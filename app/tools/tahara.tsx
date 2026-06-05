import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable, TextInput, Alert } from 'react-native';
import { KeyboardScroll } from '../../src/components/KeyboardScroll';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HDate, months } from '@hebcal/core';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { Pill } from '../../src/components/Pill';
import { useStoredJSON } from '../../src/hooks/useStoredJSON';
import { calculate, formatHebrewDate, Cycle, dayBefore } from '../../src/data/tahara';
import { scheduleAllReminders, cancelTaharaReminders, buildSchedule, loadTaharaPrefs, saveTaharaPrefs, TaharaReminderPrefs } from '../../src/services/taharaReminders';
import { hebrewNumeral } from '../../src/data/hebrewNumbers';
import { hebrewDateInfo } from '../../src/data/hebcal';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

const HEB_MONTHS = [
  { key: months.NISAN, name: 'ניסן' }, { key: months.IYYAR, name: 'אייר' }, { key: months.SIVAN, name: 'סיון' },
  { key: months.TAMUZ, name: 'תמוז' }, { key: months.AV, name: 'אב' }, { key: months.ELUL, name: 'אלול' },
  { key: months.TISHREI, name: 'תשרי' }, { key: months.CHESHVAN, name: 'חשון' }, { key: months.KISLEV, name: 'כסלו' },
  { key: months.TEVET, name: 'טבת' }, { key: months.SHVAT, name: 'שבט' }, { key: months.ADAR_I, name: 'אדר' },
  { key: months.ADAR_II, name: 'אדר ב׳' },
];

function isoFromHeb(day: number, month: number, year: number): string {
  try {
    const greg = new HDate(day, month, year).greg();
    return `${greg.getFullYear()}-${String(greg.getMonth() + 1).padStart(2, '0')}-${String(greg.getDate()).padStart(2, '0')}`;
  } catch {
    return '';
  }
}

const KEY = '@yahadut/tahara-cycles';

export default function TaharaScreen() {
  const router = useRouter();
  const [cycles, setCycles] = useStoredJSON<Cycle[]>(KEY, []);
  const todayHd = new HDate(new Date());
  const [hebDay, setHebDay] = useState<number>(todayHd.getDate());
  const [hebMonth, setHebMonth] = useState<number>(todayHd.getMonth());
  const [hebYear, setHebYear] = useState<number>(todayHd.getFullYear());
  const [prefs, setPrefs] = useState<TaharaReminderPrefs | null>(null);

  React.useEffect(() => {
    loadTaharaPrefs().then(setPrefs);
  }, []);

  async function updatePrefs(patch: Partial<TaharaReminderPrefs>) {
    if (!prefs) return;
    const next = { ...prefs, ...patch };
    setPrefs(next);
    await saveTaharaPrefs(next);
  }

  const newStart = useMemo(() => isoFromHeb(hebDay, hebMonth, hebYear), [hebDay, hebMonth, hebYear]);

  const sorted = useMemo(() => [...cycles].sort((a, b) => b.startDate.localeCompare(a.startDate)), [cycles]);
  const current = sorted[0];
  const previous = sorted[1];

  const result = useMemo(() => {
    if (!current) return null;
    return calculate(new Date(current.startDate), previous ? new Date(previous.startDate) : null);
  }, [current?.startDate, previous?.startDate]);

  // ===== הערכת ביוץ =====
  // אורך מחזור ממוצע (מההיסטוריה) → צופים מחזור הבא → ביוץ = 14 ימים לפני.
  const ovulationEstimate = useMemo(() => {
    if (!current) return null;
    // חישוב אורך מחזור ממוצע מההפרשים ההיסטוריים
    const gaps: number[] = [];
    for (let i = 0; i < sorted.length - 1; i++) {
      const a = new Date(sorted[i].startDate).getTime();
      const b = new Date(sorted[i + 1].startDate).getTime();
      const days = Math.round((a - b) / 86_400_000);
      if (days >= 18 && days <= 45) gaps.push(days); // סינון ערכים סבירים בלבד
    }
    const avgCycle = gaps.length > 0 ? Math.round(gaps.reduce((s, n) => s + n, 0) / gaps.length) : 28;
    const lastStart = new Date(current.startDate);
    const predictedNext = new Date(lastStart);
    predictedNext.setDate(predictedNext.getDate() + avgCycle);
    const ovulation = new Date(predictedNext);
    ovulation.setDate(ovulation.getDate() - 14);
    const fertileStart = new Date(ovulation);
    fertileStart.setDate(fertileStart.getDate() - 2);
    const fertileEnd = new Date(ovulation);
    fertileEnd.setDate(fertileEnd.getDate() + 1);
    return {
      avgCycle,
      sampleSize: gaps.length,
      predictedNext,
      ovulation,
      fertileStart,
      fertileEnd,
      daysToOvulation: Math.ceil((ovulation.getTime() - Date.now()) / 86_400_000),
    };
  }, [current?.startDate, sorted]);

  async function addCycle() {
    const d = new Date(newStart);
    if (isNaN(d.getTime())) {
      Alert.alert('תאריך לא תקין');
      return;
    }
    const cycle: Cycle = { id: String(Date.now()), startDate: newStart };
    setCycles((arr) => [...arr, cycle]);
    const r = await scheduleAllReminders(d);
    if (r.scheduled > 0) {
      Alert.alert('✓ תזכורות נקבעו', `נקבעו ${r.scheduled} תזכורות: הפסק טהרה + בדיקות בוקר וערב + ליל טבילה. ההתראות יגיעו ישירות לפלאפון.`);
    } else if (r.failed) {
      Alert.alert('שים לב', 'יש לאשר הרשאות התראות במכשיר. בלעדיהן לא תקבלי תזכורות.');
    }
  }

  async function reschedule() {
    if (!current) return;
    const r = await scheduleAllReminders(new Date(current.startDate));
    Alert.alert(r.scheduled > 0 ? '✓ עודכנו' : 'שגיאה', r.scheduled > 0 ? `${r.scheduled} תזכורות` : 'יש לאשר הרשאות');
  }

  async function disableReminders() {
    await cancelTaharaReminders();
    Alert.alert('✓ בוטלו', 'התזכורות בוטלו');
  }

  function removeCycle(id: string) {
    Alert.alert('הסרה', 'להסיר רשומה זו?', [
      { text: 'ביטול', style: 'cancel' },
      { text: 'הסר', style: 'destructive', onPress: () => setCycles((arr) => arr.filter((c) => c.id !== id)) },
    ]);
  }

  function setEndDate(id: string, endDate: string) {
    setCycles((arr) => arr.map((c) => (c.id === id ? { ...c, endDate } : c)));
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={[typography.bodyBold, { color: colors.primary }]}>‹ חזרה</Text>
        </Pressable>
      </View>
      <KeyboardScroll contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <ScreenHeader title="לוח טהרה" subtitle="זמני פרישה לפי עונות" />

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          {prefs && (
            <Card>
              <Text style={[typography.bodyBold, { color: colors.textPrimary, marginBottom: spacing.sm }]}>הגדרות תזכורות בדיקה:</Text>

              <Pressable onPress={() => updatePrefs({ morningEnabled: !prefs.morningEnabled })} style={styles.toggleRow}>
                <View style={[styles.cb, prefs.morningEnabled && styles.cbDone]}>
                  {prefs.morningEnabled && <Text style={{ color: colors.textInverse, fontWeight: '700' }}>✓</Text>}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.body, { color: colors.textPrimary }]}>תזכורת לבדיקת בוקר</Text>
                  <Text style={[typography.caption, { color: colors.textMuted }]}>
                    {prefs.leadMinutes} דקות לפני {prefs.morningHour.toString().padStart(2, '0')}:{prefs.morningMinute.toString().padStart(2, '0')}
                  </Text>
                </View>
              </Pressable>

              <Pressable onPress={() => updatePrefs({ eveningEnabled: !prefs.eveningEnabled })} style={styles.toggleRow}>
                <View style={[styles.cb, prefs.eveningEnabled && styles.cbDone]}>
                  {prefs.eveningEnabled && <Text style={{ color: colors.textInverse, fontWeight: '700' }}>✓</Text>}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.body, { color: colors.textPrimary }]}>תזכורת לבדיקת ערב</Text>
                  <Text style={[typography.caption, { color: colors.textMuted }]}>
                    {prefs.leadMinutes} דקות לפני {prefs.eveningUsesSunset ? 'השקיעה (לפי מיקום)' : `${prefs.eveningHour.toString().padStart(2, '0')}:${prefs.eveningMinute.toString().padStart(2, '0')}`}
                  </Text>
                </View>
              </Pressable>

              <Pressable onPress={() => updatePrefs({ eveningUsesSunset: !prefs.eveningUsesSunset })} style={[styles.toggleRow, { opacity: prefs.eveningEnabled ? 1 : 0.5 }]}>
                <View style={[styles.cb, prefs.eveningUsesSunset && styles.cbDone]}>
                  {prefs.eveningUsesSunset && <Text style={{ color: colors.textInverse, fontWeight: '700' }}>✓</Text>}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.body, { color: colors.textPrimary }]}>ערב לפי שקיעה (לפי מיקום)</Text>
                  <Text style={[typography.caption, { color: colors.textMuted }]}>
                    אחרת - שעה קבועה: {prefs.eveningHour.toString().padStart(2, '0')}:{prefs.eveningMinute.toString().padStart(2, '0')}
                  </Text>
                </View>
              </Pressable>
            </Card>
          )}

          <Card>
            <Text style={[typography.bodyBold, { color: colors.textPrimary, marginBottom: spacing.sm }]}>הוספת תחילת וסת (תאריך עברי):</Text>

            <Text style={[typography.caption, { color: colors.textMuted, marginBottom: 4 }]}>יום:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row-reverse', gap: 4 }}>
                {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => (
                  <Pressable
                    key={d}
                    onPress={() => setHebDay(d)}
                    style={[styles.chip, hebDay === d && styles.chipActive]}
                  >
                    <Text style={[typography.caption, { color: hebDay === d ? colors.textInverse : colors.textPrimary, fontWeight: '700' }]}>
                      {hebrewNumeral(d)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm, marginBottom: 4 }]}>חודש:</Text>
            <View style={{ flexDirection: 'row-reverse', gap: 4, flexWrap: 'wrap' }}>
              {HEB_MONTHS.map((m) => (
                <Pressable
                  key={m.key}
                  onPress={() => setHebMonth(m.key)}
                  style={[styles.chip, hebMonth === m.key && styles.chipActive]}
                >
                  <Text style={[typography.caption, { color: hebMonth === m.key ? colors.textInverse : colors.textPrimary, fontWeight: '700' }]}>
                    {m.name}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm, marginBottom: 4 }]}>שנה:</Text>
            <View style={{ flexDirection: 'row-reverse', gap: 4, flexWrap: 'wrap' }}>
              {[todayHd.getFullYear() - 1, todayHd.getFullYear(), todayHd.getFullYear() + 1].map((y) => (
                <Pressable
                  key={y}
                  onPress={() => setHebYear(y)}
                  style={[styles.chip, hebYear === y && styles.chipActive]}
                >
                  <Text style={[typography.caption, { color: hebYear === y ? colors.textInverse : colors.textPrimary, fontWeight: '700' }]}>
                    {hebrewDateInfo(new HDate(1, months.TISHREI, y).greg()).yearHe}
                  </Text>
                </Pressable>
              ))}
            </View>

            {newStart && (
              <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm }]}>
                לועזי: {new Date(newStart).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}
              </Text>
            )}

            <View style={{ marginTop: spacing.md }}>
              <Button label="+ הוסף וסת" onPress={addCycle} fullWidth />
            </View>
          </Card>

          {result && current && (
            <>
              <Card variant="primary">
                <Text style={[typography.small, { color: colors.textPrimary, opacity: 0.85 }]}>תחילת הוסת האחרון</Text>
                <Text style={[typography.h2, { color: colors.textPrimary, marginTop: 2 }]}>
                  {formatHebrewDate(new Date(current.startDate))}
                </Text>
                <Text style={[typography.small, { color: colors.textPrimary, opacity: 0.85, marginTop: 4 }]}>
                  {new Date(current.startDate).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}
                </Text>
              </Card>

              <Text style={[typography.h2, { color: colors.textPrimary, marginTop: spacing.md }]}>
                הפסק טהרה
              </Text>
              <Card>
                <Row label="הפסק טהרה (5 ימים)" value={result.hefsekTaharaSephardi} note="ספרדים - בסוף יום 5 לפני שקיעה" />
                <Row label="סוף 7 נקיים" value={result.sevenCleanEnd} />
                <Row label="ליל טבילה" value={result.mikvehNight} highlight />
              </Card>

              <Text style={[typography.h2, { color: colors.textPrimary, marginTop: spacing.md }]}>
                ימי פרישה
              </Text>
              <Card variant="accent">
                <Row label="עונה בינונית (30 יום)" value={result.onahBenonit} highlight />
                <Text style={[typography.caption, { color: colors.primaryDark, opacity: 0.75, marginTop: 2 }]}>
                  30 ימים מתחילת הוסת
                </Text>
                <View style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.1)', marginVertical: spacing.md }} />
                <Row label="עונת החודש" value={result.onahChodeshHebrew} highlight />
                <Text style={[typography.caption, { color: colors.primaryDark, opacity: 0.75, marginTop: 2 }]}>
                  אותו תאריך עברי בחודש הבא
                </Text>
                {result.haflagah && (
                  <>
                    <View style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.1)', marginVertical: spacing.md }} />
                    <Row label={`הפלגה (${result.haflagah.gap} יום)`} value={result.haflagah.date} highlight />
                    <Text style={[typography.caption, { color: colors.primaryDark, opacity: 0.75, marginTop: 2 }]}>
                      אותה הפלגה מהוסת הקודם
                    </Text>
                  </>
                )}
              </Card>

              <Card variant="primary">
                <Text style={[typography.h3, { color: colors.textPrimary }]}>📋 לוח בדיקות 7 נקיים</Text>
                <Text style={[typography.small, { color: colors.textPrimary, opacity: 0.85, marginTop: 4 }]}>
                  תזכורות אוטומטיות יישלחו לפלאפון לכל בדיקה
                </Text>
                <View style={{ marginTop: spacing.sm, gap: 4 }}>
                  {(() => {
                    const sched = buildSchedule(new Date(current.startDate), prefs ?? {
                      enabled: true, morningEnabled: true, eveningEnabled: true,
                      morningHour: 8, morningMinute: 0,
                      eveningUsesSunset: true, eveningHour: 18, eveningMinute: 30,
                      leadMinutes: 10,
                    });
                    return (
                      <>
                        <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', paddingVertical: 4 }}>
                          <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>הפסק טהרה</Text>
                          <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>
                            {formatHebrewDate(sched.hefsekTahara)} - {sched.hefsekTahara.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                          </Text>
                        </View>
                        {sched.bedikot.map((b) => (
                          <View key={b.day} style={{ paddingVertical: 4, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)' }}>
                            <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>
                              יום {hebrewNumeral(b.day)} מ-7 נקיים · {formatHebrewDate(b.morning).split(' ').slice(0, 2).join(' ')}
                            </Text>
                            <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', marginTop: 2 }}>
                              <Text style={[typography.small, { color: colors.textPrimary, opacity: 0.9 }]}>
                                בוקר: {b.morning.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                              </Text>
                              <Text style={[typography.small, { color: colors.textPrimary, opacity: 0.9 }]}>
                                ערב: {b.evening.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                              </Text>
                            </View>
                          </View>
                        ))}
                        <View style={{ paddingVertical: 4, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)' }}>
                          <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>
                            🌊 ליל טבילה - {formatHebrewDate(sched.mikvehNight)}
                          </Text>
                        </View>
                      </>
                    );
                  })()}
                </View>
                <View style={{ flexDirection: 'row-reverse', gap: spacing.sm, marginTop: spacing.md }}>
                  <Button label="🔔 עדכן תזכורות" onPress={reschedule} variant="secondary" fullWidth style={{ flex: 1 }} />
                  <Button label="בטל תזכורות" onPress={disableReminders} variant="ghost" />
                </View>
              </Card>

              {ovulationEstimate && (
                <Card variant="accent">
                  <Text style={[typography.h3, { color: colors.primaryDark }]}>🌸 הערכת ביוץ ופוריות</Text>
                  <Text style={[typography.caption, { color: colors.primaryDark, opacity: 0.75, marginTop: 4 }]}>
                    הערכה בלבד - לפי {ovulationEstimate.sampleSize > 0
                      ? `${ovulationEstimate.sampleSize} מחזור${ovulationEstimate.sampleSize === 1 ? '' : 'ים'} בהיסטוריה (ממוצע ${ovulationEstimate.avgCycle} ימים)`
                      : `מחזור ברירת מחדל 28 ימים`}
                  </Text>
                  <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
                    <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={[typography.body, { color: colors.primaryDark }]}>תחזית המחזור הבא:</Text>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[typography.bodyBold, { color: colors.primaryDark }]}>
                          {formatHebrewDate(ovulationEstimate.predictedNext)}
                        </Text>
                        <Text style={[typography.caption, { color: colors.primaryDark, opacity: 0.7 }]}>
                          {ovulationEstimate.predictedNext.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })}
                        </Text>
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={[typography.body, { color: colors.primaryDark }]}>חלון פוריות:</Text>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[typography.bodyBold, { color: colors.primaryDark }]}>
                          {ovulationEstimate.fertileStart.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })}
                          {' — '}
                          {ovulationEstimate.fertileEnd.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })}
                        </Text>
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={[typography.bodyBold, { color: colors.primaryDark }]}>יום ביוץ משוער:</Text>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[typography.h3, { color: colors.primaryDark }]}>
                          {formatHebrewDate(ovulationEstimate.ovulation)}
                        </Text>
                        <Text style={[typography.caption, { color: colors.primaryDark, opacity: 0.7 }]}>
                          {ovulationEstimate.ovulation.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'short' })}
                          {ovulationEstimate.daysToOvulation > 0
                            ? ` · בעוד ${ovulationEstimate.daysToOvulation} ימים`
                            : ovulationEstimate.daysToOvulation === 0
                            ? ' · היום'
                            : ` · לפני ${-ovulationEstimate.daysToOvulation} ימים`}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <Text style={[typography.caption, { color: colors.primaryDark, opacity: 0.75, marginTop: spacing.md, fontStyle: 'italic' }]}>
                    💡 ביוץ צפוי 14 ימים לפני המחזור הבא. חלון הפוריות הוא 2 ימים לפני ועד יום אחד אחרי הביוץ. ההערכה תהיה מדויקת יותר ככל שיוזנו עוד מחזורים.
                  </Text>
                </Card>
              )}

              <Card>
                <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>סדר ימי הפרישה הקרובים:</Text>
                <View style={{ marginTop: spacing.sm, gap: 6 }}>
                  {result.nextPrishahDates.map((d, i) => {
                    const days = Math.ceil((d.getTime() - Date.now()) / 86_400_000);
                    return (
                      <View key={i} style={{ flexDirection: 'row-reverse', justifyContent: 'space-between' }}>
                        <Text style={[typography.body, { color: colors.textPrimary }]}>
                          {formatHebrewDate(d)}
                        </Text>
                        <Pill label={days > 0 ? `+${days}י׳` : days === 0 ? 'היום' : `-${-days}י׳`} tone={days <= 1 ? 'warning' : 'default'} />
                      </View>
                    );
                  })}
                </View>
              </Card>
            </>
          )}

          <Text style={[typography.h2, { color: colors.textPrimary, marginTop: spacing.md }]}>היסטוריה</Text>
          {sorted.length === 0 ? (
            <Card>
              <Text style={[typography.body, { color: colors.textMuted }]}>אין רשומות. הוסף תחילת וסת.</Text>
            </Card>
          ) : (
            sorted.map((c, i) => {
              const prev = sorted[i + 1];
              const gap = prev ? Math.round((new Date(c.startDate).getTime() - new Date(prev.startDate).getTime()) / 86_400_000) : null;
              return (
                <Card key={c.id}>
                  <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>
                        {formatHebrewDate(new Date(c.startDate))}
                      </Text>
                      <Text style={[typography.small, { color: colors.textMuted, marginTop: 2 }]}>
                        {new Date(c.startDate).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                      </Text>
                      {gap !== null && (
                        <Text style={[typography.small, { color: colors.primary, marginTop: 4 }]}>
                          הפלגה: {gap} יום
                        </Text>
                      )}
                    </View>
                    <Pressable onPress={() => removeCycle(c.id)} hitSlop={6}>
                      <Text style={[typography.caption, { color: colors.danger }]}>הסר</Text>
                    </Pressable>
                  </View>
                </Card>
              );
            })
          )}

          <Card>
            <Text style={[typography.h3, { color: colors.textPrimary }]}>הערה הלכתית</Text>
            <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.sm }]}>
              החישובים כאן הם להנחיה כללית בלבד. בעניינים מעשיים יש להתייעץ עם רב או בודקת מוסמכת.
              לוח זה עוקב אחרי 3 עונות חשש: בינונית, החודש, וההפלגה.
            </Text>
          </Card>

          <Card>
            <Text style={[typography.h3, { color: colors.textPrimary }]}>הסבר קצר</Text>
            <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.sm }]}>
              <Text style={{ fontWeight: '700' }}>הפסק טהרה</Text> - בדיקה בסוף יום 5 (5 ימי וסת), לפני שקיעה.{'\n'}
              <Text style={{ fontWeight: '700' }}>7 נקיים</Text> - 7 ימים שלמים ללא דם, בדיקות בוקר וערב.{'\n'}
              <Text style={{ fontWeight: '700' }}>עונה בינונית</Text> - חוששים 30 יום מהוסת.{'\n'}
              <Text style={{ fontWeight: '700' }}>עונה החודש</Text> - אותו תאריך עברי בחודש הבא.{'\n'}
              <Text style={{ fontWeight: '700' }}>הפלגה</Text> - אם הוסת הקודם היה N ימים לפני - חוששים שוב לאחרי N ימים.
            </Text>
          </Card>
        </View>

        <View style={{ height: 40 }} />
      </KeyboardScroll>
    </SafeAreaView>
  );
}

function Row({ label, value, note, highlight }: { label: string; value: Date; note?: string; highlight?: boolean }) {
  return (
    <View style={{ paddingVertical: spacing.sm, flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.sm }}>
      <View style={{ flex: 1 }}>
        <Text style={[typography.body, { color: highlight ? colors.primary : colors.textPrimary, fontWeight: highlight ? '700' : '400' }]}>
          {label}
        </Text>
        {note ? <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>{note}</Text> : null}
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={[typography.body, { color: colors.textPrimary, fontWeight: '700' }]}>
          {formatHebrewDate(value)}
        </Text>
        <Text style={[typography.caption, { color: colors.textMuted }]}>
          {value.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: { padding: spacing.lg },
  input: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 18,
    color: colors.textPrimary,
    textAlign: 'right',
    backgroundColor: colors.bg,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 36,
    alignItems: 'center',
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
  toggleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  cb: {
    width: 24, height: 24, borderRadius: 6, borderWidth: 2,
    borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  cbDone: { backgroundColor: colors.success, borderColor: colors.success },
});
