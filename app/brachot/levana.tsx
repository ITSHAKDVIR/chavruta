import React, { useEffect, useState, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable, Alert } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { Pill } from '../../src/components/Pill';
import { levanaStatus, getLevanaWindow } from '../../src/data/kiddushLevana';
import { formatTime } from '../../src/data/hebcal';
import { useLocation } from '../../src/hooks/useLocation';
import {
  loadBrachaPrefs,
  loadLevanaHistory,
  recordLevana,
  saidLevanaThisMonth,
  saveBrachaPrefs,
  BrachaPrefs,
} from '../../src/storage/brachot';
import { scheduleAt, cancelById } from '../../src/services/notifications';
import { HDate } from '@hebcal/core';
import { hebrewNumeral } from '../../src/data/hebrewNumbers';
import { getBirkatLevanaText } from '../../src/data/birkatLevana';

function hebYear(y: number): string {
  return 'ה׳' + hebrewNumeral(y % 1000);
}
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

// Nusach text moved to src/data/birkatLevana.ts (separate Ashkenazi + Sephardi).

// Active nusach text is now resolved at render time from prefs.nusachLevana.

export default function LevanaScreen() {
  const router = useRouter();
  const { location } = useLocation();
  const [history, setHistory] = useState<{ hyear: number; hmonth: number; saidAt: number }[]>([]);
  const [prefs, setPrefs] = useState<BrachaPrefs | null>(null);

  useEffect(() => {
    (async () => {
      setHistory(await loadLevanaHistory());
      setPrefs(await loadBrachaPrefs());
    })();
  }, []);

  const status = useMemo(() => levanaStatus(new Date()), []);
  const saidThisMonth = status ? saidLevanaThisMonth(history, status.window.hyear, status.window.hmonth) : false;
  const upcomingMonths = useMemo(() => {
    const arr: ReturnType<typeof getLevanaWindow>[] = [];
    const hd = new HDate(new Date());
    let y = hd.getFullYear();
    let m = hd.getMonth();
    for (let i = 0; i < 6; i++) {
      const w = getLevanaWindow(y, m);
      if (w) arr.push(w);
      m++;
      if (m > 13) {
        m = 1;
        y++;
      }
    }
    return arr.filter(Boolean);
  }, []);

  async function markSaid() {
    if (!status) return;
    const next = await recordLevana(status.window.hyear, status.window.hmonth);
    setHistory(next);
  }

  async function scheduleReminders() {
    if (!status) return;
    const ok = await loadBrachaPrefs();
    const triggerTime =
      ok.nusachLevana === 'sefardi' ? status.window.startSefardi : status.window.startAshkenazi;
    const trigger = new Date(triggerTime);
    trigger.setHours(20, 30, 0, 0);
    if (trigger.getTime() <= Date.now()) {
      Alert.alert('זמן עבר', 'חלון התחילה כבר עבר. ניתן לברך עכשיו.');
      return;
    }
    const id = await scheduleAt(trigger, {
      title: 'קידוש לבנה',
      body: `החלון לקידוש לבנה לחודש ${status.window.monthName} פתוח`,
      channelId: 'brachot',
    });
    if (id) Alert.alert('תזכורת נקבעה', `תקבל התראה ב-${trigger.toLocaleString('he-IL')}`);
    else Alert.alert('לא ניתן', 'אנא ודא שיש הרשאת התראות.');
  }

  async function setNusach(n: 'sefardi' | 'ashkenazi') {
    // If prefs is still loading, start with a sensible default object so the
    // selector responds immediately. The persisted prefs will be overwritten
    // on next storage write.
    const base = prefs ?? (await loadBrachaPrefs());
    const next = { ...base, nusachLevana: n };
    setPrefs(next);
    await saveBrachaPrefs(next);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={[typography.bodyBold, { color: colors.primary }]}>‹ חזרה</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <ScreenHeader title="קידוש לבנה" subtitle="ברכת הלבנה - חידוש החודש" />

        {status ? (
          <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
            <Card variant={saidThisMonth ? 'accent' : status.state.startsWith('in-window') ? 'primary' : 'default'}>
              <Text
                style={[
                  typography.small,
                  {
                    color: saidThisMonth ? colors.primaryDark : status.state.startsWith('in-window') ? colors.textInverse : colors.textMuted,
                    opacity: 0.85,
                  },
                ]}
              >
                חודש {status.window.monthName} {hebYear(status.window.hyear)}
              </Text>
              {saidThisMonth ? (
                <Text style={[typography.h1, { color: colors.primaryDark, marginTop: 2 }]}>✓ בירכת החודש</Text>
              ) : status.state === 'before-window' ? (
                <Text style={[typography.h1, { color: colors.textPrimary, marginTop: 2 }]}>
                  החלון יפתח בעוד {status.daysUntil} ימים
                </Text>
              ) : status.state === 'in-window-sefardi' ? (
                <>
                  <Text style={[typography.h1, { color: colors.textInverse, marginTop: 2 }]}>
                    החלון פתוח (לפי הספרדים)
                  </Text>
                  <Text style={[typography.body, { color: colors.textInverse, opacity: 0.9, marginTop: 4 }]}>
                    לאשכנזים: עוד {status.daysUntilAshkenazi} ימים
                  </Text>
                </>
              ) : status.state === 'in-window-ashkenazi' ? (
                <Text style={[typography.h1, { color: colors.textInverse, marginTop: 2 }]}>
                  החלון פתוח · נותרו {status.daysLeft} ימים
                </Text>
              ) : (
                <Text style={[typography.h1, { color: colors.textPrimary, marginTop: 2 }]}>
                  החלון נסגר לפני {status.daysSince} ימים
                </Text>
              )}
            </Card>

            <Card>
              <Text style={[typography.h3, { color: colors.textPrimary }]}>זמני החלון</Text>
              <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
                <TimeRow
                  label="מולד"
                  time={status.window.moladInstant}
                  note="תחילת החודש האסטרונומי"
                  tz={location.timezone}
                />
                <TimeRow
                  label="תחילת זמן (ספרדים)"
                  time={status.window.startSefardi}
                  note="3 ימים אחרי המולד"
                  tz={location.timezone}
                />
                <TimeRow
                  label="תחילת זמן (אשכנזים)"
                  time={status.window.startAshkenazi}
                  note="7 ימים אחרי המולד (מנהג רוב הקהילות)"
                  tz={location.timezone}
                />
                <TimeRow
                  label="סוף זמן (חצי המולד)"
                  time={status.window.endHalfMolad}
                  note="14 יום 18 שעות מהמולד - מהר״יל"
                  tz={location.timezone}
                />
                <TimeRow
                  label="סוף זמן (15 יום)"
                  time={status.window.end15Days}
                  note="שולחן ערוך"
                  tz={location.timezone}
                />
              </View>
            </Card>

            <Card>
              <Text style={[typography.h3, { color: colors.textPrimary }]}>נוסח קידוש לבנה</Text>
              <View style={{ flexDirection: 'row-reverse', gap: spacing.sm, marginTop: spacing.sm, flexWrap: 'wrap' }}>
                <Pressable
                  onPress={() => setNusach('ashkenazi')}
                  style={[
                    styles.nusachBtn,
                    prefs?.nusachLevana === 'ashkenazi' && styles.nusachBtnActive,
                  ]}
                >
                  <Text
                    style={[
                      typography.bodyBold,
                      { color: prefs?.nusachLevana === 'ashkenazi' ? colors.textInverse : colors.textPrimary },
                    ]}
                  >
                    אשכנז
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setNusach('sefardi')}
                  style={[styles.nusachBtn, prefs?.nusachLevana === 'sefardi' && styles.nusachBtnActive]}
                >
                  <Text
                    style={[
                      typography.bodyBold,
                      { color: prefs?.nusachLevana === 'sefardi' ? colors.textInverse : colors.textPrimary },
                    ]}
                  >
                    ספרד / עדות מזרח
                  </Text>
                </Pressable>
              </View>
              <View style={{ marginTop: spacing.md, padding: spacing.md, backgroundColor: colors.surfaceAlt, borderRadius: radius.md }}>
                <Text style={[typography.sacred, { color: colors.textPrimary }]}>
                  {getBirkatLevanaText(prefs?.nusachLevana === 'sefardi' ? 'sefardi' : 'ashkenazi')}
                </Text>
              </View>
              <Text style={[typography.small, { color: colors.textMuted, marginTop: spacing.sm }]}>
                * הנוסח מקובל בסידור המודפס. מברכים בעמידה ומחוץ לבית, מול הלבנה, אחרי שעברו לפחות 3 ימים (ספרד) או 7 ימים (אשכנז) מהמולד.
              </Text>
            </Card>

            <View style={{ flexDirection: 'row-reverse', gap: spacing.sm, flexWrap: 'wrap' }}>
              <Button
                label={saidThisMonth ? '✓ סומן' : '✓ בירכתי החודש'}
                onPress={markSaid}
                variant={saidThisMonth ? 'secondary' : 'primary'}
                fullWidth
                style={{ flex: 1, minWidth: 160 }}
              />
              <Button label="🔔 קבע תזכורת" onPress={scheduleReminders} variant="secondary" style={{ flexGrow: 1, minWidth: 140 }} />
            </View>
          </View>
        ) : (
          <View style={{ paddingHorizontal: spacing.lg }}>
            <Card>
              <Text style={[typography.body, { color: colors.textMuted }]}>אין חלון פעיל כעת. החלון הבא בקרוב.</Text>
            </Card>
          </View>
        )}

        <Text style={[typography.h2, styles.heading]}>חלונות קרובים</Text>
        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.sm }}>
          {upcomingMonths.map((w) =>
            w ? (
              <Card key={`${w.hyear}-${w.hmonth}`}>
                <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View>
                    <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>{w.monthName} {hebYear(w.hyear)}</Text>
                    <Text style={[typography.small, { color: colors.textMuted, marginTop: 2 }]}>
                      {w.startAshkenazi.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })} - {w.end15Days.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 28 }}>🌙</Text>
                </View>
              </Card>
            ) : null,
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function TimeRow({ label, time, note, tz }: { label: string; time: Date; note?: string; tz?: string }) {
  return (
    <View style={styles.timeRow}>
      <View style={{ flex: 1 }}>
        <Text style={[typography.body, { color: colors.textPrimary }]}>{label}</Text>
        {note ? <Text style={[typography.caption, { color: colors.textMuted }]}>{note}</Text> : null}
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={[typography.bodyBold, { color: colors.primary }]}>
          {time.toLocaleDateString('he-IL', { day: 'numeric', month: 'short', timeZone: tz })}
        </Text>
        <Text style={[typography.caption, { color: colors.textMuted }]}>{formatTime(time, tz)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: { padding: spacing.lg },
  heading: { color: colors.textPrimary, paddingHorizontal: spacing.lg, marginTop: spacing.xl, marginBottom: spacing.sm },
  timeRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  nusachBtn: {
    flexGrow: 1,
    flexBasis: 120,
    minWidth: 110,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
  },
  nusachBtnActive: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
});
