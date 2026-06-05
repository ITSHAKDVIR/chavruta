import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable, TextInput, Alert } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon } from '../../src/components/Icon';
import {
  computeZmanim,
  formatTime,
  hebrewDateInfo,
  getSpecialDay,
  StoredLocation,
  DEFAULT_LOCATIONS_BY_REGION,
  getCandleLightingMinutes,
  getCandleLightingMinhag,
} from '../../src/data/hebcal';
import { useLocation } from '../../src/hooks/useLocation';
import { useSavedLocations } from '../../src/hooks/useSavedLocations';
import { useTick } from '../../src/hooks/useTick';
import { Card } from '../../src/components/Card';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Pill } from '../../src/components/Pill';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

export default function ZmanimScreen() {
  useTick(60_000);
  const router = useRouter();
  const { location: defaultLocation } = useLocation();
  const { saved: savedCities, add: addCity, remove: removeCity } = useSavedLocations();
  const [viewLocation, setViewLocation] = useState<StoredLocation | null>(null);
  const location = viewLocation ?? defaultLocation;
  const [dateStr, setDateStr] = useState(new Date().toISOString().slice(0, 10));
  const [showAddCity, setShowAddCity] = useState(false);

  function isActive(loc: StoredLocation): boolean {
    return location.name === loc.name;
  }
  function pickCity(loc: StoredLocation | null) {
    setViewLocation(loc);
  }
  const selectedDate = useMemo(() => {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? new Date() : d;
  }, [dateStr]);

  const isToday = selectedDate.toDateString() === new Date().toDateString();
  const inIsrael = location.countryCode === 'IL';

  const zmanim = useMemo(() => computeZmanim(selectedDate, location), [location, selectedDate.toDateString()]);
  const hebrew = useMemo(() => hebrewDateInfo(selectedDate), [selectedDate.toDateString()]);
  const special = useMemo(() => getSpecialDay(selectedDate, inIsrael), [selectedDate.toDateString(), inIsrael]);

  function shiftDay(days: number) {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setDateStr(d.toISOString().slice(0, 10));
  }

  type Row = { label: string; key: keyof typeof zmanim; note?: string; section?: string; highlight?: boolean };
  const rows: Row[] = [
    { label: 'עלות השחר', key: 'alotHaShachar', note: '72 דקות לפני נץ', section: 'בוקר' },
    { label: 'משיכיר', key: 'misheyakir', note: 'זמן ציצית ותפילין' },
    { label: 'הנץ החמה', key: 'sunrise', note: 'זמן תפילת ותיקין' },
    { label: 'סוף זמן ק"ש (מג"א)', key: 'sofZmanShmaMA', note: '3 שעות זמניות מעלות השחר', section: 'ק"ש ותפילה' },
    { label: 'סוף זמן ק"ש (גר"א / בעל התניא)', key: 'sofZmanShmaGRA', note: '3 שעות זמניות מהנץ' },
    { label: 'סוף זמן תפילה (מג"א)', key: 'sofZmanTfillaMA', note: '4 שעות זמניות מעלות' },
    { label: 'סוף זמן תפילה (גר"א)', key: 'sofZmanTfillaGRA', note: '4 שעות זמניות מהנץ' },
  ];
  if (special.isErevPesach) {
    rows.push({ label: 'סוף זמן אכילת חמץ (מג"א)', key: 'sofZmanAchilatChametz', note: '4 שעות זמניות מעלות', section: 'ערב פסח', highlight: true });
    rows.push({ label: 'סוף זמן ביעור חמץ (גר"א)', key: 'sofZmanBiurChametz', note: '5 שעות זמניות מהנץ', highlight: true });
  }
  rows.push(
    { label: 'חצות היום', key: 'chatzot', note: 'אמצע היום בין נץ לשקיעה', section: 'צהריים' },
    { label: 'מנחה גדולה', key: 'minchaGedola', note: 'תחילת זמן מנחה' },
    { label: 'מנחה קטנה', key: 'minchaKetana', note: 'מנחה לכתחילה' },
    { label: 'פלג המנחה', key: 'plagHaMincha', note: '1.25 שעות זמניות לפני שקיעה' },
  );
  if (special.isErevShabbat) {
    const candleMins = getCandleLightingMinutes(location);
    const minhag = getCandleLightingMinhag(location);
    rows.push({
      label: '🕯️ הדלקת נרות שבת',
      key: 'candleLighting',
      note: `${candleMins} דק׳ לפני שקיעה · ${minhag}`,
      section: 'ערב שבת',
      highlight: true,
    });
  }
  rows.push(
    { label: 'שקיעת החמה', key: 'sunset', note: 'תחילת בין השמשות', section: 'ערב' },
    { label: 'צאת הכוכבים (יומי)', key: 'tzeit18min', note: '18 דקות אחרי שקיעה - לזמני יום-יום' },
    { label: 'צאת הכוכבים (שבת/חג)', key: 'tzeitShabbat', note: '3 כוכבים קטנים (8.5°) - תלוי מיקום ועונה' },
    { label: 'צאת הכוכבים (תוספת)', key: 'tzeitShabbatStrict', note: '13.5° - בערך 10 דק׳ לאחר הקודם' },
    { label: 'צאת הכוכבים (ר"ת)', key: 'tzeit72min', note: '72 דקות אחרי השקיעה' },
  );
  if (special.isMotzeiShabbat) {
    rows.push({ label: '🌃 צאת שבת (הבדלה)', key: 'havdalah', note: 'מוצאי שבת - מחושב לפי מיקום', highlight: true });
  }
  if (special.isFast) {
    rows.push({ label: `🍽️ צאת ה${special.fastName ?? 'צום'}`, key: 'tzeit18min', note: 'מותר לאכול', highlight: true });
  }
  rows.push({ label: 'חצות לילה', key: 'chatzotNight', note: 'אמצע הלילה - זמן תיקון חצות', section: 'לילה' });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={['#0a1f3d', '#1e3a5f', '#2c5282']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill as any}
      />
      {/* Glow orb removed per user feedback. */}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Icon name="chevronRight" size={20} color={colors.primary} />
          <Text style={[typography.bodyBold, { color: colors.primary }]}>חזרה</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <ScreenHeader title="זמני היום" subtitle={`${hebrew.gematria} · ${location.name}`} />

        {/* Multi-city pager */}
        <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.sm }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 6, paddingVertical: 4 }}
          >
            <Pressable
              onPress={() => pickCity(null)}
              style={[styles.cityChip, !viewLocation && styles.cityChipActive]}
            >
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 4 }}>
                <Icon
                  name="home"
                  size={12}
                  color={!viewLocation ? colors.textInverse : colors.textPrimary}
                  strokeWidth={2}
                />
                <Text
                  style={[
                    typography.caption,
                    { color: !viewLocation ? colors.textInverse : colors.textPrimary, fontWeight: '700' },
                  ]}
                >
                  {defaultLocation.name}
                </Text>
              </View>
            </Pressable>
            {savedCities.map((c) => (
              <Pressable
                key={c.name}
                onPress={() => pickCity(c)}
                onLongPress={() =>
                  Alert.alert('הסר עיר', `להסיר את ${c.name} מהמועדפים?`, [
                    { text: 'ביטול', style: 'cancel' },
                    {
                      text: 'הסר',
                      style: 'destructive',
                      onPress: async () => {
                        await removeCity(c.name);
                        if (viewLocation?.name === c.name) setViewLocation(null);
                      },
                    },
                  ])
                }
                style={[styles.cityChip, isActive(c) && styles.cityChipActive]}
              >
                <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 4 }}>
                  <Icon
                    name="pin"
                    size={12}
                    color={isActive(c) ? colors.textInverse : colors.textPrimary}
                    strokeWidth={2}
                  />
                  <Text
                    style={[
                      typography.caption,
                      { color: isActive(c) ? colors.textInverse : colors.textPrimary, fontWeight: '700' },
                    ]}
                  >
                    {c.name}
                  </Text>
                </View>
              </Pressable>
            ))}
            <Pressable onPress={() => setShowAddCity(true)} style={styles.cityChipAdd}>
              <Text style={[typography.caption, { color: colors.primary, fontWeight: '700' }]}>+ הוסף עיר</Text>
            </Pressable>
          </ScrollView>
          {savedCities.length > 0 && (
            <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2, textAlign: 'center', opacity: 0.7 }]}>
              לחיצה ארוכה על עיר תסיר אותה
            </Text>
          )}
        </View>

        {/* City picker modal - rendered as inline panel for simplicity */}
        {showAddCity && (
          <Card>
            <Text style={[typography.h3, { color: colors.textPrimary, marginBottom: spacing.sm }]}>בחר עיר להוספה</Text>
            <ScrollView style={{ maxHeight: 300 }} nestedScrollEnabled={true}>
              {DEFAULT_LOCATIONS_BY_REGION.filter((l) => !savedCities.some((s) => s.name === l.name) && l.name !== defaultLocation.name).map((l) => (
                <Pressable
                  key={l.name}
                  onPress={async () => {
                    await addCity(l);
                    setShowAddCity(false);
                  }}
                  style={styles.cityRow}
                >
                  <Text style={[typography.body, { color: colors.textPrimary }]}>{l.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Pressable onPress={() => setShowAddCity(false)} style={{ marginTop: spacing.sm, alignItems: 'center' }}>
              <Text style={[typography.bodyBold, { color: colors.danger }]}>ביטול</Text>
            </Pressable>
          </Card>
        )}

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md, marginBottom: spacing.md }}>
          <Card>
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm }}>
              <Pressable onPress={() => shiftDay(-1)} style={styles.navBtn}>
                <Icon name="chevronLeft" size={20} color={colors.primary} />
              </Pressable>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={[typography.h3, { color: colors.textPrimary }]}>{hebrew.gematria}</Text>
                <TextInput
                  value={dateStr}
                  onChangeText={setDateStr}
                  style={styles.dateInput}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
              <Pressable onPress={() => shiftDay(1)} style={styles.navBtn}>
                <Icon name="chevronRight" size={20} color={colors.primary} />
              </Pressable>
            </View>
            {!isToday && (
              <View style={{ marginTop: spacing.sm, alignItems: 'center' }}>
                <Pressable onPress={() => setDateStr(new Date().toISOString().slice(0, 10))}>
                  <Text style={[typography.caption, { color: colors.primary }]}>← קפוץ להיום</Text>
                </Pressable>
              </View>
            )}
            {(special.isShabbat || special.isYomTov || special.isFast || special.isErevPesach || special.isErevShabbat || special.isMotzeiShabbat) && (
              <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 4, marginTop: spacing.sm }}>
                {special.isShabbat && <Pill label="🕯️ שבת" tone="accent" />}
                {special.isYomTov && <Pill label="יום טוב" tone="accent" />}
                {special.isFast && <Pill label={`🍽️ ${special.fastName ?? 'צום'}`} tone="warning" />}
                {special.isErevPesach && <Pill label="ערב פסח" tone="primary" />}
                {special.isErevShabbat && <Pill label="ערב שבת" tone="primary" />}
                {special.isMotzeiShabbat && <Pill label="מוצאי שבת" tone="info" />}
              </View>
            )}
          </Card>
        </View>

        <View style={{ paddingHorizontal: spacing.lg, gap: 6 }}>
          {rows.map((row, i) => (
            <React.Fragment key={`${row.key as string}-${i}`}>
              {row.section && (
                <Text style={[typography.eyebrow, { color: colors.primary, marginTop: i === 0 ? 0 : spacing.md, marginBottom: spacing.xs, paddingHorizontal: 2 }]}>
                  {row.section}
                </Text>
              )}
              <Card padding="md" variant={row.highlight ? 'featured' : 'default'}>
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.body, { color: colors.textPrimary, fontWeight: row.highlight ? '700' : '400' }]}>
                      {row.label}
                    </Text>
                    {row.note ? (
                      <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>
                        {row.note}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={[typography.timeBig, { color: row.highlight ? colors.primaryLight : colors.primary }]}>
                    {formatTime(zmanim[row.key] as Date | null, location.timezone)}
                  </Text>
                </View>
              </Card>
            </React.Fragment>
          ))}
        </View>

        <Text style={[typography.small, styles.note]}>
          *הזמנים מחושבים לפי {location.latitude.toFixed(2)}°, {location.longitude.toFixed(2)}° · {location.timezone}.{'\n'}
          שעון קיץ / חורף מתעדכן אוטומטית.
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  glow: {
    position: 'absolute',
    top: -100,
    right: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: colors.glowGold,
    opacity: 0.4,
  },
  topBar: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md },
  backBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-end',
  },
  navBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.glassBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  dateInput: {
    marginTop: 4, fontSize: 14, color: colors.textMuted,
    textAlign: 'center', padding: 4, minWidth: 100,
  },
  row: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm },
  note: { color: colors.textMuted, paddingHorizontal: spacing.lg, marginTop: spacing.lg, textAlign: 'center' },
  cityChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  cityChipActive: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
  cityChipAdd: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.primary,
  },
  cityRow: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
  },
});
