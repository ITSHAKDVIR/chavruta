/**
 * Kosher restaurants — pulls from the new kosharot.co.il/restaurants_api.php
 * endpoint we deployed. That endpoint queries `kosharot_rest` directly
 * (no chat-bot 15-row truncation) and supports BOTH city-based and
 * GPS-based queries with category filtering.
 *
 * Screen layout:
 *   - Mode toggle:  "📍 הקרובים אליי"  /  "🏙 לפי עיר"
 *   - Category chips: מסעדות / אולמות / חנויות / מלונות / מזון מהיר
 *   - List of restaurants matching all active filters
 *
 * The "near me" mode uses the user's saved location (from useLocation),
 * with a default 5-km radius. The city mode shows the picker dropdown.
 */
import React, { useDeferredValue, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon } from '../../src/components/Icon';
import { KeyboardScroll } from '../../src/components/KeyboardScroll';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { Pill } from '../../src/components/Pill';
import {
  fetchRestaurantsByCity,
  fetchRestaurantsNear,
  fetchCities,
  Restaurant,
  CategoryId,
  CATEGORY_NAMES,
  CityWithCount,
} from '../../src/services/kosharotApi';
import { fetchIkrByCity, councilIdForCity } from '../../src/services/ikrApi';
import { useLocation } from '../../src/hooks/useLocation';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

const ALL_CATEGORIES: CategoryId[] = [1, 142, 2, 3, 4];

export default function KosherRestaurantsScreen() {
  const router = useRouter();
  const { location } = useLocation();

  /** "near" = GPS radius search; "city" = city-name search. */
  const [mode, setMode] = useState<'near' | 'city'>('city');
  const [radiusKm, setRadiusKm] = useState<number>(5);

  // City selection (city mode). Default to the user's saved location name,
  // or Jerusalem.
  const defaultCity = useMemo(() => {
    if (!location?.name) return 'ירושלים';
    return location.name.replace(/['"׳״]/g, '').trim();
  }, [location?.name]);
  const [city, setCity] = useState<string>(defaultCity);
  useEffect(() => { setCity(defaultCity); }, [defaultCity]);

  // Free-text autocomplete state. The picker lets users type any city; the
  // full city list is fetched ONCE per session into `allCities` and every
  // keystroke filters synchronously via useMemo (no setState per keystroke).
  const [pickerQuery, setPickerQuery] = useState('');
  const [allCities, setAllCities] = useState<CityWithCount[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);

  // Multi-select categories. Empty = show all.
  const [activeCats, setActiveCats] = useState<CategoryId[]>([]);

  // Source filter: 'all' = both sources, 'kosharot' = recommendations only.
  // (No "IKR-only" option — that would just be "all the residual", weird UX.)
  const [sourceFilter, setSourceFilter] = useState<'all' | 'kosharot'>('all');

  // Free-text search across name + address.
  const [search, setSearch] = useState('');

  // Picker modal state
  const [pickerOpen, setPickerOpen] = useState(false);

  // Load the full cities list once when the modal first opens.
  useEffect(() => {
    if (!pickerOpen || allCities.length > 0) return;
    let cancelled = false;
    setPickerLoading(true);
    (async () => {
      const list = await fetchCities('');
      if (!cancelled) {
        setAllCities(list);
        setPickerLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [pickerOpen, allCities.length]);

  // React 19 useDeferredValue: the TextInput keeps painting at typing speed
  // because we filter+render with the DEFERRED query value. The list lags by
  // one frame while the input stays smooth. This is the key to no-lag Hebrew
  // typing in RN-Web — without it, every keystroke blocks until the entire
  // 50-row list re-renders.
  const deferredQuery = useDeferredValue(pickerQuery);
  const pickerSuggestions = useMemo(() => {
    const q = deferredQuery.trim();
    if (!q) return allCities;
    return allCities.filter((c) => c.name.includes(q));
  }, [allCities, deferredQuery]);

  // Fetched list + loading
  const [results, setResults] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // We fetch from TWO sources, but with VERY different cadences:
  //   - Kosharot PHP supports server-side category filter, so it re-runs
  //     whenever the user toggles categories. Cheap, no rate-limit risk.
  //   - IKR is rate-limited by IP and has no category param, so we fetch
  //     ONCE per (mode, city, radius) — category filter is applied
  //     client-side. The ikrApi layer also caches per councilId for 10
  //     minutes and single-flights concurrent calls, so cycling back to
  //     a previously-viewed city is free.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true); setErrorMsg('');
      try {
        const cats = activeCats.length > 0 ? activeCats : undefined;
        const [kosharotList, ikrList] = await Promise.all([
          mode === 'near' && location?.latitude && location?.longitude
            ? fetchRestaurantsNear(location.latitude, location.longitude, radiusKm, { category: cats })
            : fetchRestaurantsByCity(city, { category: cats }),
          mode === 'city' ? fetchIkrByCity(city) : Promise.resolve([] as Restaurant[]),
        ]);
        // Apply category filter to IKR client-side (IKR API has no category param)
        const ikrFiltered = !cats
          ? ikrList
          : ikrList.filter((r) => r.categoryId != null && cats.includes(r.categoryId));
        // Dedup IKR against Kosharot by normalized name (Kosharot wins)
        const norm = (s: string) => s.replace(/['"׳״]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
        const kosharotKeys = new Set(kosharotList.map((r) => norm(r.name)));
        const ikrUnique = ikrFiltered.filter((r) => !kosharotKeys.has(norm(r.name)));
        const merged = [...kosharotList, ...ikrUnique];
        if (!cancelled) setResults(merged);
      } catch (e: any) {
        if (!cancelled) {
          setResults([]);
          setErrorMsg(e?.message || 'שגיאה');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [mode, city, radiusKm, activeCats, location?.latitude, location?.longitude]);

  // Council match indicator (so we can tell the user whether IKR data is
  // available for the chosen city).
  const ikrAvailable = useMemo(
    () => mode === 'city' && councilIdForCity(city) != null,
    [mode, city],
  );

  const filtered = useMemo(() => {
    const q = search.trim();
    const bySource = sourceFilter === 'all'
      ? results
      : results.filter((r) => r.source === sourceFilter);
    if (!q) return bySource;
    return bySource.filter((r) =>
      r.name.includes(q) || r.address.includes(q) || r.kashrutKind.includes(q),
    );
  }, [results, search, sourceFilter]);

  const kosharotCount = useMemo(() => results.filter((r) => r.source === 'kosharot').length, [results]);

  function toggleCat(c: CategoryId) {
    setActiveCats((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  }

  function call(phone: string) {
    Linking.openURL(`tel:${phone.replace(/[^0-9+]/g, '')}`);
  }
  function navigate(address: string, cityName: string) {
    const q = encodeURIComponent(`${address}, ${cityName}`);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${q}`);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={['#0a1f3d', '#1e3a5f', '#2c5282']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill as any}
      />

      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Icon name="chevronRight" size={20} color={colors.primary} />
          <Text style={[typography.bodyBold, { color: colors.primary }]}>חזרה</Text>
        </Pressable>
      </View>

      <KeyboardScroll contentContainerStyle={{ paddingBottom: spacing.xl }} extraOffset={20}>
        <ScreenHeader title="מסעדות כשרות" subtitle="מאגר כושרות · עסקים עם השגחה" />

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          {/* Mode toggle */}
          <View style={styles.toggleRow}>
            <Pressable
              onPress={() => setMode('near')}
              disabled={!location?.latitude || !location?.longitude}
              style={[styles.toggleBtn, mode === 'near' && styles.toggleBtnActive,
                (!location?.latitude || !location?.longitude) && styles.toggleBtnDisabled]}
            >
              <Text style={[typography.bodyBold, { color: mode === 'near' ? colors.textInverse : colors.textPrimary }]}>
                📍 הקרובים אליי
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setMode('city')}
              style={[styles.toggleBtn, mode === 'city' && styles.toggleBtnActive]}
            >
              <Text style={[typography.bodyBold, { color: mode === 'city' ? colors.textInverse : colors.textPrimary }]}>
                🏙 לפי עיר
              </Text>
            </Pressable>
          </View>

          {/* Mode-specific selector */}
          {mode === 'city' ? (
            <Pressable onPress={() => setPickerOpen(true)} style={styles.dropdownBtn}>
              <Icon name="chevronLeft" size={18} color={colors.primary} />
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Text style={[typography.caption, { color: colors.textMuted }]}>עיר:</Text>
                <Text style={[typography.h3, { color: colors.textPrimary, marginTop: 2 }]}>{city}</Text>
              </View>
            </Pressable>
          ) : (
            <Card>
              <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>רדיוס חיפוש</Text>
              <View style={{ flexDirection: 'row-reverse', gap: 8, marginTop: spacing.sm, flexWrap: 'wrap' }}>
                {[1, 2, 5, 10, 20].map((km) => (
                  <Pressable
                    key={km}
                    onPress={() => setRadiusKm(km)}
                    style={[styles.radiusChip, radiusKm === km && styles.radiusChipActive]}
                  >
                    <Text style={{ color: radiusKm === km ? colors.textInverse : colors.textPrimary, fontWeight: '600' }}>
                      {km} ק״מ
                    </Text>
                  </Pressable>
                ))}
              </View>
              {location?.name ? (
                <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm }]}>
                  סביב {location.name}
                </Text>
              ) : null}
            </Card>
          )}

          {/* Source filter — Kosharot recommendations vs IKR rabbinate vs both */}
          <View>
            <Text style={[typography.caption, { color: colors.textMuted, marginBottom: 6 }]}>
              מקור הנתונים:
            </Text>
            <View style={{ flexDirection: 'row-reverse', gap: 6 }}>
              {([
                { key: 'all', label: `הכל${results.length ? ` (${results.length})` : ''}` },
                { key: 'kosharot', label: `★ רק מומלצי כושרות${kosharotCount ? ` (${kosharotCount})` : ''}` },
              ] as const).map((s) => {
                const active = sourceFilter === s.key;
                return (
                  <Pressable
                    key={s.key}
                    onPress={() => setSourceFilter(s.key)}
                    style={[styles.catChip, active && styles.catChipActive, { flex: 1 }]}
                  >
                    <Text style={{ color: active ? colors.textInverse : colors.textPrimary, fontSize: 12, fontWeight: '600', textAlign: 'center' }}>
                      {s.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {mode === 'city' && !ikrAvailable && (
              <Text style={[typography.caption, { color: colors.textMuted, marginTop: 4, fontSize: 11 }]}>
                ℹ️ מאגר הרבנות זמין לערים מרכזיות בלבד (54 רשויות)
              </Text>
            )}
            {mode === 'near' && (
              <Text style={[typography.caption, { color: colors.textMuted, marginTop: 4, fontSize: 11 }]}>
                ℹ️ חיפוש GPS תומך כרגע במאגר כושרות בלבד
              </Text>
            )}
          </View>

          {/* Category multi-select chips */}
          <View>
            <Text style={[typography.caption, { color: colors.textMuted, marginBottom: 6 }]}>
              סוג עסק (אפשר כמה — ריק = הכל):
            </Text>
            <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6 }}>
              {ALL_CATEGORIES.map((c) => {
                const active = activeCats.includes(c);
                return (
                  <Pressable
                    key={c}
                    onPress={() => toggleCat(c)}
                    style={[styles.catChip, active && styles.catChipActive]}
                  >
                    <Text style={{ color: active ? colors.textInverse : colors.textPrimary, fontSize: 13, fontWeight: '600' }}>
                      {CATEGORY_NAMES[c]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Search box */}
          {results.length > 0 && (
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="חיפוש שם / כתובת / סוג כשרות..."
              placeholderTextColor={colors.textMuted}
              style={styles.search}
            />
          )}

          {/* Loading / error / empty / list */}
          {loading && (
            <View style={{ padding: spacing.xl, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm }]}>
                טוען מסעדות...
              </Text>
            </View>
          )}

          {!loading && errorMsg !== '' && (
            <Card>
              <Text style={[typography.body, { color: colors.danger, textAlign: 'center' }]}>{errorMsg}</Text>
            </Card>
          )}

          {!loading && errorMsg === '' && filtered.length === 0 && (
            <Card>
              <Text style={[typography.body, { color: colors.textMuted, textAlign: 'center' }]}>
                {mode === 'near'
                  ? `לא נמצאו עסקים ברדיוס ${radiusKm} ק"מ. נסה רדיוס גדול יותר.`
                  : `לא נמצאו עסקים ב${city} בקטגוריות שבחרת.`}
              </Text>
            </Card>
          )}

          {!loading && filtered.length > 0 && (
            <Text style={[typography.caption, { color: colors.primary, textAlign: 'center' }]}>
              {filtered.length} עסקים
            </Text>
          )}

          {!loading && filtered.map((r, i) => (
            <Card key={`${r.name}-${r.address}-${i}`}>
              <View style={{ flexDirection: 'row-reverse', alignItems: 'flex-start', gap: spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.h3, { color: colors.textPrimary }]}>{r.name}</Text>
                  <View style={{ flexDirection: 'row-reverse', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                    {r.source === 'kosharot'
                      ? <Pill label="★ מומלץ כושרות" tone="warning" />
                      : <Pill label="רבנות" tone="info" />}
                    {r.kashrutKind ? <Pill label={`✓ ${r.kashrutKind}`} tone="success" /> : null}
                    {r.category ? <Pill label={r.category} tone="default" /> : null}
                  </View>
                </View>
                {typeof r.distanceKm === 'number' && (
                  <View style={styles.distBadge}>
                    <Text style={{ color: colors.textInverse, fontWeight: '700', fontSize: 12 }}>
                      {r.distanceKm < 1 ? `${Math.round(r.distanceKm * 1000)}מ׳` : `${r.distanceKm}ק״מ`}
                    </Text>
                  </View>
                )}
              </View>
              {r.address || r.city ? (
                <Text style={[typography.small, { color: colors.textSecondary, marginTop: spacing.sm }]}>
                  📍 {[r.address, r.city].filter(Boolean).join(', ')}
                </Text>
              ) : null}
              {r.supervisorAuthority ? (
                <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>
                  השגחה: {r.supervisorAuthority}
                </Text>
              ) : null}
              {r.supervisor ? (
                <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>
                  מפקח: {r.supervisor}
                </Text>
              ) : null}
              {r.remarks ? (
                <Text style={[typography.small, { color: colors.textSecondary, marginTop: spacing.sm, fontStyle: 'italic' }]}>
                  {r.remarks}
                </Text>
              ) : null}
              <View style={{ flexDirection: 'row-reverse', gap: spacing.sm, marginTop: spacing.md, flexWrap: 'wrap' }}>
                {r.supervisor && /\d{6,}/.test(r.supervisor) ? (
                  <Button label="📞 חיוג" onPress={() => call(r.supervisor)} variant="primary" style={{ flex: 1, minWidth: 90 }} fullWidth />
                ) : null}
                {r.address && r.city ? (
                  <Button label="🗺️ נווט" onPress={() => navigate(r.address, r.city)} variant="secondary" style={{ flex: 1, minWidth: 90 }} fullWidth />
                ) : null}
                {r.remarksUrl ? (
                  <Button label="🔗 פרטים" onPress={() => Linking.openURL(r.remarksUrl!)} variant="secondary" style={{ flex: 1, minWidth: 90 }} fullWidth />
                ) : null}
              </View>
            </Card>
          ))}

          <Text style={[typography.caption, { color: colors.textMuted, textAlign: 'center', marginTop: spacing.md }]}>
            נתונים: מאגר כושרות + IKR (רבנות)
          </Text>
        </View>
      </KeyboardScroll>

      {/* City picker modal — free-text autocomplete from the DB. */}
      <Modal
        visible={pickerOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setPickerOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setPickerOpen(false)}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ width: '100%' }}
          >
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHandle} />
            <Text style={[typography.h2, { color: colors.textPrimary, textAlign: 'center', marginBottom: spacing.md }]}>
              בחר עיר
            </Text>
            <TextInput
              value={pickerQuery}
              onChangeText={setPickerQuery}
              placeholder="הקלד שם עיר... (השאר ריק לרשימה מלאה)"
              placeholderTextColor={colors.textMuted}
              style={[styles.search, { marginBottom: spacing.md }]}
              autoFocus
            />
            {pickerLoading ? (
              <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.md }} />
            ) : pickerSuggestions.length === 0 ? (
              <Text style={[typography.body, { color: colors.textMuted, textAlign: 'center', marginTop: spacing.md }]}>
                {pickerQuery ? 'לא נמצאו ערים תואמות' : 'טוען...'}
              </Text>
            ) : (
              // ScrollView+map (not FlatList) — for ~200 short rows the
              // virtualization overhead exceeds the savings, and rendering
              // every keystroke through FlatList recycling is the main lag
              // source in RN-Web. Cap to 50 visible rows; suffix counter shows the rest.
              <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 420 }}>
                {pickerSuggestions.slice(0, 50).map((item, idx) => (
                  <Pressable
                    key={`${item.name}-${idx}`}
                    onPress={() => {
                      setCity(item.name);
                      setSearch('');
                      setPickerQuery('');
                      setPickerOpen(false);
                    }}
                    style={[styles.modalRow, city === item.name && styles.modalRowActive]}
                  >
                    <Text style={[typography.caption, { color: colors.textMuted }]}>
                      {item.count} עסקים
                    </Text>
                    <Text style={[typography.body, { color: colors.textPrimary, fontWeight: '600' }]}>
                      {item.name}
                    </Text>
                  </Pressable>
                ))}
                {pickerSuggestions.length > 50 ? (
                  <Text style={[typography.caption, { color: colors.textMuted, textAlign: 'center', marginTop: spacing.md }]}>
                    + עוד {pickerSuggestions.length - 50} ערים — צמצם בהקלדה
                  </Text>
                ) : null}
              </ScrollView>
            )}
          </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md },
  backBtn: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, alignSelf: 'flex-end' },
  toggleRow: { flexDirection: 'row-reverse', gap: spacing.sm },
  toggleBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: 'center',
  },
  toggleBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  toggleBtnDisabled: { opacity: 0.4 },
  dropdownBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: colors.glass,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing.md,
    gap: spacing.sm,
  },
  radiusChip: {
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  radiusChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  catChip: {
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  catChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  search: {
    backgroundColor: colors.glass,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing.md,
    color: colors.textPrimary,
    fontSize: 15,
    textAlign: 'right',
  },
  distBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#0a1f3d',
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    maxHeight: '75%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.glassBorder,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  modalRow: {
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: 4,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalRowActive: {
    backgroundColor: 'rgba(212,164,55,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(212,164,55,0.4)',
  },
});
