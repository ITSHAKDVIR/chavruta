import React from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable, Alert } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { Pill } from '../../src/components/Pill';
import { useStoredJSON } from '../../src/hooks/useStoredJSON';
import { hebrewDateInfo } from '../../src/data/hebcal';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

const KEY = '@yahadut/100-brachot';

type DayData = {
  date: string;
  manual: number;
  preset: Record<string, boolean>;
};

const PRESETS = [
  { id: 'birkot-hashachar', label: 'ברכות השחר', count: 16, note: 'אלהי נשמה, פוקח עוורים, מלביש ערומים, וכו׳ (16 ברכות)' },
  { id: 'birkot-hatorah', label: 'ברכות התורה', count: 3, note: 'אשר בחר בנו, נותן התורה, וכו׳' },
  { id: 'tzitzit', label: 'ציצית / טלית', count: 1 },
  { id: 'tefilin', label: 'תפילין (להניח + על מצות תפילין)', count: 2, note: '2 ברכות. אם מניחים ר"ת בנפרד - +2' },
  { id: 'pesukei-shacharit', label: 'פסוקי דזמרה (ברוך שאמר + ישתבח)', count: 2 },
  { id: 'krias-shma-shacharit', label: 'ברכות ק"ש שחרית', count: 3, note: 'יוצר אור, אהבה רבה, אמת ויציב' },
  { id: 'amidah-shacharit', label: 'עמידה שחרית', count: 19, note: '19 ברכות' },
  { id: 'meal-bread-am', label: 'ארוחה עם פת (בוקר/צהריים)', count: 6, note: 'נטילה, המוציא, ברכת המזון (4 ברכות)' },
  { id: 'amidah-mincha', label: 'עמידה מנחה', count: 19 },
  { id: 'meal-bread-pm', label: 'ארוחת ערב עם פת', count: 6 },
  { id: 'krias-shma-arvit', label: 'ברכות ק"ש ערבית', count: 4, note: 'מעריב ערבים, אהבת עולם, אמת ואמונה, השכיבנו' },
  { id: 'amidah-maariv', label: 'עמידה ערבית', count: 19 },
  { id: 'krias-shma-night', label: 'המפיל (ק"ש על המיטה)', count: 1 },
  { id: 'asher-yatzar', label: 'אשר יצר (כל פעם)', count: 4, note: 'ממוצע 4 פעמים ביום' },
  { id: 'fruits-snacks', label: 'פירות וחטיפים בין הארוחות', count: 5 },
  { id: 'drinks', label: 'שתייה (מים, מיץ)', count: 4 },
];

export default function HundredBrachotScreen() {
  const router = useRouter();
  const todayStr = new Date().toISOString().slice(0, 10);
  const [allData, setAllData] = useStoredJSON<Record<string, DayData>>(KEY, {});
  const today = allData[todayStr] ?? { date: todayStr, manual: 0, preset: {} };

  function save(next: DayData) {
    setAllData((d) => ({ ...d, [todayStr]: next }));
  }

  function togglePreset(id: string) {
    save({ ...today, preset: { ...today.preset, [id]: !today.preset[id] } });
  }

  function incManual() {
    save({ ...today, manual: today.manual + 1 });
  }
  function decManual() {
    save({ ...today, manual: Math.max(0, today.manual - 1) });
  }
  function reset() {
    Alert.alert('איפוס', 'לאפס את ספירת היום?', [
      { text: 'בטל', style: 'cancel' },
      { text: 'אפס', style: 'destructive', onPress: () => save({ date: todayStr, manual: 0, preset: {} }) },
    ]);
  }

  const presetTotal = PRESETS.reduce((sum, p) => sum + (today.preset[p.id] ? p.count : 0), 0);
  const total = presetTotal + today.manual;
  const percent = Math.min(100, (total / 100) * 100);

  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={[typography.bodyBold, { color: colors.primary }]}>‹ חזרה</Text>
        </Pressable>
        <Pressable onPress={reset} hitSlop={10}>
          <Text style={[typography.bodyBold, { color: colors.danger }]}>איפוס</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <ScreenHeader title="100 ברכות יומיות" subtitle={hebrewDateInfo(new Date()).gematria} />

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          <Card variant={total >= 100 ? 'accent' : 'primary'}>
            <Text style={{ fontSize: 72, color: total >= 100 ? colors.primaryDark : colors.textInverse, fontWeight: '700', textAlign: 'center' }}>
              {total} / 100
            </Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${percent}%` }]} />
            </View>
            {total >= 100 ? (
              <Text style={[typography.h3, { color: colors.primaryDark, textAlign: 'center', marginTop: spacing.sm }]}>
                ✓ השלמת 100 ברכות היום!
              </Text>
            ) : (
              <Text style={[typography.body, { color: colors.textInverse, opacity: 0.9, textAlign: 'center', marginTop: 4 }]}>
                חסרות {100 - total} ברכות
              </Text>
            )}
          </Card>

          <Card>
            <Text style={[typography.h3, { color: colors.textPrimary }]}>סימון תפילות וארוחות:</Text>
            <Text style={[typography.small, { color: colors.textMuted, marginTop: 4 }]}>
              סמן מה אמרת היום, האפליקציה מחשבת את הברכות שיש בכל פעולה.
            </Text>
            <View style={{ marginTop: spacing.md, gap: spacing.xs }}>
              {PRESETS.map((p) => {
                const isOn = !!today.preset[p.id];
                return (
                  <Pressable key={p.id} onPress={() => togglePreset(p.id)} style={[styles.row, isOn && styles.rowOn]}>
                    <View style={[styles.cb, isOn && styles.cbDone]}>
                      {isOn && <Text style={{ color: colors.textInverse, fontWeight: '700' }}>✓</Text>}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[typography.body, { color: colors.textPrimary }]}>{p.label}</Text>
                      {p.note ? <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>{p.note}</Text> : null}
                    </View>
                    <Pill label={`+${p.count}`} tone={isOn ? 'success' : 'default'} />
                  </Pressable>
                );
              })}
            </View>
          </Card>

          <Card>
            <Text style={[typography.h3, { color: colors.textPrimary }]}>ברכות נוספות (ידני):</Text>
            <Text style={[typography.small, { color: colors.textMuted, marginTop: 4 }]}>
              לדוגמא: שהכל, בורא פרי האדמה, ברכות הראייה
            </Text>
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.md, marginTop: spacing.md }}>
              <Pressable onPress={decManual} style={styles.counterBtn}>
                <Text style={{ fontSize: 28, color: colors.textInverse }}>−</Text>
              </Pressable>
              <Text style={{ fontSize: 48, color: colors.primary, fontWeight: '700', minWidth: 80, textAlign: 'center' }}>
                {today.manual}
              </Text>
              <Pressable onPress={incManual} style={styles.counterBtn}>
                <Text style={{ fontSize: 28, color: colors.textInverse }}>+</Text>
              </Pressable>
            </View>
          </Card>

          <Card>
            <Text style={[typography.h3, { color: colors.textPrimary, marginBottom: spacing.sm }]}>7 ימים אחרונים</Text>
            <View style={{ flexDirection: 'row-reverse', gap: 4 }}>
              {weekDates.map((d) => {
                const day = allData[d];
                const t = day ? (PRESETS.reduce((s, p) => s + (day.preset[p.id] ? p.count : 0), 0) + day.manual) : 0;
                const isToday = d === todayStr;
                return (
                  <View key={d} style={[styles.weekCell, isToday && styles.weekCellToday]}>
                    <Text style={[typography.bodyBold, { color: t >= 100 ? colors.success : colors.textMuted }]}>
                      {t >= 100 ? '✓' : t}
                    </Text>
                    <Text style={[typography.caption, { color: colors.textMuted, fontSize: 9 }]}>
                      {new Date(d).getDate()}
                    </Text>
                  </View>
                );
              })}
            </View>
          </Card>

          <Card variant="accent">
            <Text style={[typography.body, { color: colors.primaryDark, opacity: 0.85 }]}>
              💡 "חייב אדם לברך מאה ברכות בכל יום" (תלמוד מנחות מ"ג ע"ב). דוד המלך תיקן את התקנה לאחר מגפה.
            </Text>
          </Card>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: { padding: spacing.lg, flexDirection: 'row-reverse', justifyContent: 'space-between' },
  progressBar: { height: 10, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 5, overflow: 'hidden', marginTop: spacing.sm },
  progressFill: { height: '100%', backgroundColor: colors.surface },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
  },
  rowOn: { backgroundColor: '#E9F4EB' },
  cb: {
    width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface,
  },
  cbDone: { backgroundColor: colors.success, borderColor: colors.success },
  counterBtn: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  weekCell: {
    flex: 1, aspectRatio: 1, backgroundColor: colors.surface,
    borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  weekCellToday: { borderColor: colors.primary, borderWidth: 2 },
});
