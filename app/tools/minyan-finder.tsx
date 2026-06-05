import React, { useEffect, useMemo, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, TextInput, View, Pressable, Platform, Modal } from 'react-native';
import { KeyboardScroll } from '../../src/components/KeyboardScroll';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { Pill } from '../../src/components/Pill';
import { Button } from '../../src/components/Button';
import { NUSACH_LABEL, Shul, SHULS, ShulNusach } from '../../src/data/shuls';
import { distanceKm } from '../../src/data/mikvaot';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

type SortCenter = { name: string; lat: number; lng: number };
type Tefila = 'shacharit' | 'mincha' | 'maariv' | 'all';

const TEFILA_LABEL: Record<Tefila, string> = {
  all: 'הכל',
  shacharit: 'שחרית',
  mincha: 'מנחה',
  maariv: 'מעריב',
};

export default function MinyanFinderScreen() {
  const router = useRouter();
  const [gpsLoc, setGpsLoc] = useState<SortCenter | null>(null);
  const [manualCity, setManualCity] = useState<SortCenter | null>(null);
  const [tefila, setTefila] = useState<Tefila>('all');
  const [nusachFilter, setNusachFilter] = useState<ShulNusach | 'all'>('all');
  const [search, setSearch] = useState('');
  const [showCityPicker, setShowCityPicker] = useState(false);

  useEffect(() => {
    (async () => {
      if (Platform.OS === 'web') return;
      try {
        const Location: any = await import('expo-location');
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const pos = await Location.getLastKnownPositionAsync();
        if (pos) {
          setGpsLoc({ name: 'המיקום שלי (GPS)', lat: pos.coords.latitude, lng: pos.coords.longitude });
        }
      } catch {}
    })();
  }, []);

  const sortCenter = manualCity ?? gpsLoc;

  const cities = useMemo(() => {
    const set = new Map<string, SortCenter>();
    for (const s of SHULS) {
      if (!set.has(s.city)) {
        set.set(s.city, { name: s.city, lat: s.lat, lng: s.lng });
      }
    }
    return Array.from(set.values()).sort((a, b) => a.name.localeCompare(b.name, 'he'));
  }, []);

  const list = useMemo(() => {
    let arr = [...SHULS];
    if (nusachFilter !== 'all') arr = arr.filter((s) => s.nusach === nusachFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      arr = arr.filter((s) =>
        `${s.name} ${s.city} ${s.neighborhood ?? ''} ${s.address}`.toLowerCase().includes(q),
      );
    }
    if (sortCenter) {
      return arr
        .map((s) => ({ ...s, dist: distanceKm(sortCenter.lat, sortCenter.lng, s.lat, s.lng) }))
        .sort((a, b) => (a.dist as number) - (b.dist as number));
    }
    return arr.sort((a, b) => a.city.localeCompare(b.city, 'he'));
  }, [search, sortCenter, nusachFilter]);

  function openWaze(s: Shul) {
    const url = `waze://?ll=${s.lat},${s.lng}&navigate=yes`;
    const fallback = `https://waze.com/ul?ll=${s.lat}%2C${s.lng}&navigate=yes`;
    Linking.openURL(url).catch(() => Linking.openURL(fallback));
  }

  function pickCity(c: SortCenter) {
    setManualCity(c);
    setShowCityPicker(false);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={[typography.bodyBold, { color: colors.primary }]}>‹ חזרה</Text>
        </Pressable>
      </View>
      <ScreenHeader
        title="מאתר מניין"
        subtitle={
          sortCenter
            ? `ממוין לפי קרבה ל${sortCenter.name}`
            : `${list.length} בתי כנסת`
        }
      />

      <View style={{ paddingHorizontal: spacing.lg, gap: spacing.xs }}>
        <View style={styles.searchRow}>
          <Text style={{ fontSize: 14 }}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="חפש לפי שם / עיר / שכונה / כתובת"
            placeholderTextColor={colors.textMuted}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')} hitSlop={10}>
              <Text style={{ color: colors.textMuted, fontSize: 18 }}>✕</Text>
            </Pressable>
          )}
        </View>
        <View style={{ flexDirection: 'row-reverse', gap: spacing.sm, alignItems: 'center' }}>
          <Pressable onPress={() => setShowCityPicker(true)} style={styles.cityBtn}>
            <Text style={[typography.bodyBold, { color: colors.primary }]}>
              📍 {manualCity ? manualCity.name : 'אוטומטי GPS'}
            </Text>
          </Pressable>
          {manualCity && (
            <Pressable onPress={() => setManualCity(null)} hitSlop={10}>
              <Text style={{ color: colors.danger, fontSize: 18 }}>✕</Text>
            </Pressable>
          )}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
          {(Object.keys(TEFILA_LABEL) as Tefila[]).map((t) => (
            <Pressable key={t} onPress={() => setTefila(t)} style={[styles.chip, tefila === t && styles.chipActive]}>
              <Text
                style={[
                  typography.caption,
                  { color: tefila === t ? colors.textInverse : colors.textPrimary, fontWeight: '700' },
                ]}
              >
                {TEFILA_LABEL[t]}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
          {(['all', ...Object.keys(NUSACH_LABEL)] as (ShulNusach | 'all')[]).map((n) => (
            <Pressable
              key={n}
              onPress={() => setNusachFilter(n)}
              style={[styles.chip, nusachFilter === n && styles.chipActive]}
            >
              <Text
                style={[
                  typography.caption,
                  { color: nusachFilter === n ? colors.textInverse : colors.textPrimary, fontWeight: '700' },
                ]}
              >
                {n === 'all' ? 'כל הנוסחים' : NUSACH_LABEL[n as ShulNusach]}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <KeyboardScroll contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing.sm, gap: spacing.sm }}>
        {list.length === 0 && (
          <Card variant="accent">
            <Text style={[typography.body, { color: colors.primaryDark }]}>
              לא נמצאו בתי כנסת לחיפוש הזה.
            </Text>
          </Card>
        )}
        {list.map((s: any) => (
          <Card key={`${s.name}-${s.city}-${s.address}`}>
            <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Text style={[typography.h3, { color: colors.textPrimary }]}>📿 {s.name}</Text>
                <Text style={[typography.body, { color: colors.primary, marginTop: 2 }]}>
                  {s.city} {s.neighborhood ? `· ${s.neighborhood}` : ''}
                </Text>
                <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>📍 {s.address}</Text>
              </View>
              <View style={{ alignItems: 'flex-start', gap: 4 }}>
                <Pill label={NUSACH_LABEL[s.nusach as ShulNusach]} tone="default" />
                {s.dist !== undefined && (
                  <Pill
                    label={s.dist < 1 ? `${(s.dist * 1000).toFixed(0)} מ׳` : `${s.dist.toFixed(1)} ק"מ`}
                    tone="default"
                  />
                )}
              </View>
            </View>

            {(tefila === 'all' || tefila === 'shacharit') && s.shacharit?.length > 0 && (
              <View style={styles.tefilaRow}>
                <Text style={styles.tefilaLabel}>שחרית:</Text>
                <Text style={styles.tefilaTimes}>{s.shacharit.join(' · ')}</Text>
              </View>
            )}
            {(tefila === 'all' || tefila === 'mincha') && s.mincha?.length > 0 && (
              <View style={styles.tefilaRow}>
                <Text style={styles.tefilaLabel}>מנחה:</Text>
                <Text style={styles.tefilaTimes}>{s.mincha.join(' · ')}</Text>
              </View>
            )}
            {(tefila === 'all' || tefila === 'maariv') && s.maariv?.length > 0 && (
              <View style={styles.tefilaRow}>
                <Text style={styles.tefilaLabel}>מעריב:</Text>
                <Text style={styles.tefilaTimes}>{s.maariv.join(' · ')}</Text>
              </View>
            )}
            {s.specialServices && (
              <Text style={[typography.caption, { color: colors.textMuted, marginTop: 4, fontStyle: 'italic' }]}>
                ⭐ {s.specialServices}
              </Text>
            )}

            <View style={{ flexDirection: 'row-reverse', gap: spacing.sm, marginTop: spacing.sm }}>
              <Button label="🧭 ניווט" onPress={() => openWaze(s)} variant="primary" style={{ flex: 1 }} />
              {s.phone && (
                <Button
                  label={`📞 ${s.phone}`}
                  onPress={() => Linking.openURL(`tel:${s.phone}`)}
                  variant="secondary"
                  style={{ flex: 1 }}
                />
              )}
            </View>
          </Card>
        ))}
      </KeyboardScroll>

      <Modal
        animationType="slide"
        transparent
        visible={showCityPicker}
        onRequestClose={() => setShowCityPicker(false)}
      >
        <Pressable style={styles.modalBg} onPress={() => setShowCityPicker(false)}>
          <Pressable style={styles.modalBox} onPress={(e) => e.stopPropagation?.()}>
            <Text style={[typography.h2, { color: colors.textPrimary, marginBottom: spacing.md }]}>
              בחר עיר לחיפוש
            </Text>
            <ScrollView style={{ maxHeight: 400 }} nestedScrollEnabled={true}>
              {gpsLoc && (
                <Pressable
                  onPress={() => pickCity(gpsLoc)}
                  style={[styles.cityRow, { backgroundColor: colors.surfaceAlt }]}
                >
                  <Text style={[typography.bodyBold, { color: colors.primary }]}>📍 מיקום GPS</Text>
                </Pressable>
              )}
              {cities.map((c) => (
                <Pressable key={c.name} onPress={() => pickCity(c)} style={styles.cityRow}>
                  <Text style={[typography.body, { color: colors.textPrimary }]}>{c.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Button label="ביטול" onPress={() => setShowCityPicker(false)} variant="secondary" />
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: { padding: spacing.lg },
  searchRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
    padding: 0,
    margin: 0,
  },
  cityBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
  tefilaRow: { flexDirection: 'row-reverse', gap: spacing.sm, marginTop: 4 },
  tefilaLabel: { ...typography.bodyBold, color: colors.textPrimary, minWidth: 50 },
  tefilaTimes: { ...typography.body, color: colors.textSecondary, flex: 1 },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    maxHeight: '85%',
  },
  cityRow: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
});
