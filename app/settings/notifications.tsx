import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable, Switch, Alert, ActivityIndicator } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { Pill } from '../../src/components/Pill';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { loadNotifPrefs, saveNotifPrefs, rescheduleAll, NOTIF_DEFINITIONS, NotifId, NotifPrefs } from '../../src/services/notificationsHub';
import { loadNotifSettings, saveNotifSettings, NotifSettings, DEFAULT_SETTINGS } from '../../src/services/notifSettings';
import { ensurePermissions, presentNow, scheduleAt } from '../../src/services/notifications';
import { useLocation } from '../../src/hooks/useLocation';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

const GROUP_LABELS: Record<string, string> = {
  shabbat: 'שבת',
  tefila: 'תפילות',
  learning: 'לימוד',
  mitzvot: 'מצוות',
  personal: 'אישי',
};

/** Which notifications have configurable timing. */
const HAS_SETTINGS = new Set<NotifId>([
  'shabbat-candles',
  'havdalah',
  'mincha-reminder',
  'maariv-reminder',
  'sof-zman-shma',
  'sof-zman-tfila',
  'shema-al-mita',
  'omer-counting',
  'daf-yomi-reminder',
  'mishna-yomi-reminder',
  'rosh-chodesh',
  'fast-day',
  'parent-call',
]);

const WEEKDAYS_HE = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function settingsSummary(id: NotifId, s: NotifSettings): string | null {
  switch (id) {
    case 'shabbat-candles': return `${s.shabbatCandlesLeadMin} דק׳ לפני הדלקה`;
    case 'havdalah': return s.havdalahOffsetMin === 0 ? 'בזמן צאת הכוכבים' : `${s.havdalahOffsetMin} דק׳ אחרי צאת`;
    case 'mincha-reminder': return `${s.minchaLeadMin} דק׳ לפני שקיעה`;
    case 'maariv-reminder': return `${s.maarivAfterMin} דק׳ אחרי שקיעה`;
    case 'sof-zman-shma': return `${s.sofZmanShmaLeadMin} דק׳ לפני סוף הזמן`;
    case 'sof-zman-tfila': return `${s.sofZmanTfilaLeadMin} דק׳ לפני סוף הזמן`;
    case 'shema-al-mita': return `כל יום ב-${pad2(s.shemaHour)}:${pad2(s.shemaMinute)}`;
    case 'omer-counting': return `בעת הספירה - בשעה ${pad2(s.omerHour)}:${pad2(s.omerMinute)}`;
    case 'daf-yomi-reminder': return `כל בוקר ב-${pad2(s.dafHour)}:${pad2(s.dafMinute)}`;
    case 'mishna-yomi-reminder': return `כל ערב ב-${pad2(s.mishnaHour)}:${pad2(s.mishnaMinute)}`;
    case 'rosh-chodesh': return `ערב ר"ח ב-${pad2(s.roshChodeshEveHour)}:${pad2(s.roshChodeshEveMinute)}`;
    case 'fast-day': return `ערב הצום ב-${pad2(s.fastEveHour)}:${pad2(s.fastEveMinute)}`;
    case 'parent-call': return `כל יום ${WEEKDAYS_HE[s.parentCallWeekday]} ב-${pad2(s.parentCallHour)}:${pad2(s.parentCallMinute)}`;
    default: return null;
  }
}

/** Render the appropriate settings UI for the given notification. */
function renderSettingsFor(
  id: NotifId,
  s: NotifSettings,
  patch: (p: Partial<NotifSettings>) => Promise<void>,
): React.ReactNode {
  switch (id) {
    case 'shabbat-candles':
      return (
        <MinutesPicker
          label="כמה דקות לפני הדלקת נרות"
          options={[5, 10, 15, 20, 30, 45, 60, 90, 120]}
          value={s.shabbatCandlesLeadMin}
          onChange={(v) => patch({ shabbatCandlesLeadMin: v })}
        />
      );
    case 'havdalah':
      return (
        <MinutesPicker
          label="כמה דקות אחרי צאת הכוכבים"
          options={[0, 10, 20, 30, 45, 60, 72]}
          value={s.havdalahOffsetMin}
          onChange={(v) => patch({ havdalahOffsetMin: v })}
        />
      );
    case 'mincha-reminder':
      return (
        <MinutesPicker
          label="כמה דקות לפני שקיעה"
          options={[15, 30, 45, 60, 90, 120]}
          value={s.minchaLeadMin}
          onChange={(v) => patch({ minchaLeadMin: v })}
        />
      );
    case 'maariv-reminder':
      return (
        <MinutesPicker
          label="כמה דקות אחרי שקיעה"
          options={[0, 15, 18, 30, 42, 60, 72]}
          value={s.maarivAfterMin}
          onChange={(v) => patch({ maarivAfterMin: v })}
        />
      );
    case 'sof-zman-shma':
      return (
        <MinutesPicker
          label="כמה דקות לפני סוף זמן ק״ש"
          options={[5, 10, 15, 20, 30, 45, 60]}
          value={s.sofZmanShmaLeadMin}
          onChange={(v) => patch({ sofZmanShmaLeadMin: v })}
        />
      );
    case 'sof-zman-tfila':
      return (
        <MinutesPicker
          label="כמה דקות לפני סוף זמן תפילה"
          options={[5, 10, 15, 20, 30, 45, 60]}
          value={s.sofZmanTfilaLeadMin}
          onChange={(v) => patch({ sofZmanTfilaLeadMin: v })}
        />
      );
    case 'shema-al-mita':
      return (
        <View>
          <TimePicker
            label="שעת תזכורת ק״ש על המיטה"
            hour={s.shemaHour}
            minute={s.shemaMinute}
            onChange={(h, m) => patch({ shemaHour: h, shemaMinute: m })}
          />
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', marginTop: spacing.md, gap: spacing.sm }}>
            <Switch
              value={s.shemaSmartCharger}
              onValueChange={(v) => patch({ shemaSmartCharger: v })}
              trackColor={{ true: colors.primary, false: colors.border }}
              thumbColor={colors.surface}
            />
            <Text style={[typography.small, { color: colors.textSecondary, flex: 1 }]}>
              גם להציע אוטומטית כשהמכשיר מחובר למטען בשעה מאוחרת
            </Text>
          </View>
        </View>
      );
    case 'omer-counting':
      return (
        <TimePicker
          label="שעת התזכורת לספירת העומר"
          hour={s.omerHour}
          minute={s.omerMinute}
          onChange={(h, m) => patch({ omerHour: h, omerMinute: m })}
        />
      );
    case 'daf-yomi-reminder':
      return (
        <TimePicker
          label="שעת התזכורת לדף יומי"
          hour={s.dafHour}
          minute={s.dafMinute}
          onChange={(h, m) => patch({ dafHour: h, dafMinute: m })}
        />
      );
    case 'mishna-yomi-reminder':
      return (
        <TimePicker
          label="שעת התזכורת למשנה יומית"
          hour={s.mishnaHour}
          minute={s.mishnaMinute}
          onChange={(h, m) => patch({ mishnaHour: h, mishnaMinute: m })}
        />
      );
    case 'rosh-chodesh':
      return (
        <TimePicker
          label="שעת התזכורת בערב ר״ח"
          hour={s.roshChodeshEveHour}
          minute={s.roshChodeshEveMinute}
          onChange={(h, m) => patch({ roshChodeshEveHour: h, roshChodeshEveMinute: m })}
        />
      );
    case 'fast-day':
      return (
        <TimePicker
          label="שעת התזכורת בערב הצום"
          hour={s.fastEveHour}
          minute={s.fastEveMinute}
          onChange={(h, m) => patch({ fastEveHour: h, fastEveMinute: m })}
        />
      );
    case 'parent-call':
      return (
        <View>
          <Text style={[typography.bodyBold, { color: colors.textPrimary, marginBottom: spacing.sm }]}>
            יום השיחה השבועית
          </Text>
          <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6 }}>
            {WEEKDAYS_HE.map((label, idx) => {
              const active = s.parentCallWeekday === idx;
              return (
                <Pressable
                  key={idx}
                  onPress={() => patch({ parentCallWeekday: idx })}
                  style={{
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    borderRadius: radius.md,
                    backgroundColor: active ? colors.primary : colors.surfaceAlt,
                    borderWidth: 1,
                    borderColor: active ? colors.primaryDark : colors.border,
                  }}
                >
                  <Text style={[typography.caption, { color: active ? colors.textInverse : colors.textPrimary, fontWeight: '700' }]}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <View style={{ marginTop: spacing.md }}>
            <TimePicker
              label="שעת התזכורת"
              hour={s.parentCallHour}
              minute={s.parentCallMinute}
              onChange={(h, m) => patch({ parentCallHour: h, parentCallMinute: m })}
            />
          </View>
        </View>
      );
    default:
      return null;
  }
}

function MinutesPicker({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: number[];
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <View>
      <Text style={[typography.small, { color: colors.textPrimary, marginBottom: spacing.sm }]}>{label}</Text>
      <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 4 }}>
        {options.map((opt) => (
          <Pressable
            key={opt}
            onPress={() => onChange(opt)}
            style={[settingsStyles.chip, opt === value && settingsStyles.chipActive]}
          >
            <Text
              style={[
                typography.caption,
                { color: opt === value ? colors.textInverse : colors.textPrimary, fontWeight: opt === value ? '700' : '400' },
              ]}
            >
              {opt} דק׳
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function TimePicker({
  label,
  hour,
  minute,
  onChange,
}: {
  label: string;
  hour: number;
  minute: number;
  onChange: (h: number, m: number) => void;
}) {
  return (
    <View>
      <Text style={[typography.small, { color: colors.textPrimary, marginBottom: spacing.sm }]}>{label}</Text>
      <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm }}>
        <Pressable
          onPress={() => onChange((hour + 23) % 24, minute)}
          style={settingsStyles.numBtn}
        >
          <Text style={[typography.bodyBold, { color: colors.primary }]}>−</Text>
        </Pressable>
        <Text style={[typography.h3, { color: colors.textPrimary, minWidth: 60, textAlign: 'center' }]}>
          {pad2(hour)}
        </Text>
        <Pressable
          onPress={() => onChange((hour + 1) % 24, minute)}
          style={settingsStyles.numBtn}
        >
          <Text style={[typography.bodyBold, { color: colors.primary }]}>+</Text>
        </Pressable>
        <Text style={[typography.h3, { color: colors.textMuted }]}>:</Text>
        <Pressable
          onPress={() => onChange(hour, (minute + 55) % 60)}
          style={settingsStyles.numBtn}
        >
          <Text style={[typography.bodyBold, { color: colors.primary }]}>−</Text>
        </Pressable>
        <Text style={[typography.h3, { color: colors.textPrimary, minWidth: 60, textAlign: 'center' }]}>
          {pad2(minute)}
        </Text>
        <Pressable
          onPress={() => onChange(hour, (minute + 5) % 60)}
          style={settingsStyles.numBtn}
        >
          <Text style={[typography.bodyBold, { color: colors.primary }]}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const settingsStyles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  numBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default function NotificationsHubScreen() {
  const router = useRouter();
  const { location } = useLocation();
  const [prefs, setPrefs] = useState<NotifPrefs | null>(null);
  const [settings, setSettings] = useState<NotifSettings>(DEFAULT_SETTINGS);
  const [expanded, setExpanded] = useState<Set<NotifId>>(new Set());
  const [busy, setBusy] = useState(false);
  const [permStatus, setPermStatus] = useState<'unknown' | 'granted' | 'denied'>('unknown');

  useEffect(() => {
    (async () => {
      setPrefs(await loadNotifPrefs());
      setSettings(await loadNotifSettings());
      try {
        const s = await Notifications.getPermissionsAsync();
        setPermStatus(s.granted ? 'granted' : 'denied');
      } catch {
        setPermStatus('denied');
      }
    })();
  }, []);

  function toggleExpanded(id: NotifId) {
    const next = new Set(expanded);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpanded(next);
  }

  async function patchSettings(patch: Partial<NotifSettings>) {
    const next = { ...settings, ...patch };
    setSettings(next);
    await saveNotifSettings(next);
  }

  async function requestPermission() {
    const ok = await ensurePermissions();
    setPermStatus(ok ? 'granted' : 'denied');
    if (!ok) {
      Alert.alert(
        'הרשאה לא ניתנה',
        Platform.OS === 'ios'
          ? 'גש להגדרות > חברותא > Notifications והפעל אותן ידנית.'
          : Platform.OS === 'android'
            ? 'גש להגדרות > Apps > חברותא > Notifications והפעל אותן.'
            : 'התראות בדפדפן דורשות הרשאה. אם חסמת - אפס דרך הגדרות האתר.',
      );
    } else {
      Alert.alert('✓ הרשאה ניתנה', 'אפשר עכשיו לקבל התראות.');
    }
  }

  async function testNow() {
    const ok = await ensurePermissions();
    if (!ok) {
      Alert.alert('שגיאה', 'אין הרשאת התראות. לחץ "אפשר התראות" למעלה.');
      return;
    }
    await presentNow({
      title: 'התראת בדיקה ✓',
      body: 'אם אתה רואה את זה - ההתראות עובדות במכשיר שלך.',
    });
    Alert.alert(
      'נשלחה התראה',
      Platform.OS === 'web'
        ? 'התראה אמורה להופיע בדפדפן או בשורת ההתראות של המערכת.'
        : 'בדוק את שורת ההתראות של הטלפון.',
    );
  }

  async function test30s() {
    const ok = await ensurePermissions();
    if (!ok) {
      Alert.alert('שגיאה', 'אין הרשאת התראות.');
      return;
    }
    const when = new Date(Date.now() + 30_000);
    const id = await scheduleAt(when, {
      title: 'התראה מתוזמנת ✓',
      body: 'זוהי התראה שתוזמנה לפני 30 שניות. סימן שהתזמון עובד.',
    });
    if (id) {
      Alert.alert(
        '✓ תוזמן',
        'התראה תוצג בעוד 30 שניות. אפשר לסגור את האפליקציה - היא עדיין תופיע.',
      );
    } else {
      Alert.alert('שגיאה', 'לא ניתן לתזמן.');
    }
  }

  async function toggle(id: NotifId) {
    if (!prefs) return;
    const next = { ...prefs, [id]: !prefs[id] };
    setPrefs(next);
    await saveNotifPrefs(next);
  }

  async function apply() {
    if (!prefs) return;
    setBusy(true);
    try {
      const result = await rescheduleAll(location);
      Alert.alert(
        result.scheduled > 0 ? '✓ התראות הוגדרו' : 'שים לב',
        result.scheduled > 0
          ? `נקבעו ${result.scheduled} התראות ל-30 הימים הקרובים.\n\nההתראות יגיעו ישירות למסך הפלאפון.`
          : 'אנא ודא שיש הרשאת התראות במכשיר',
      );
    } finally {
      setBusy(false);
    }
  }

  if (!prefs) return null;

  const groups = Array.from(new Set(NOTIF_DEFINITIONS.map((d) => d.group)));
  const activeCount = Object.values(prefs).filter(Boolean).length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={[typography.bodyBold, { color: colors.primary }]}>‹ חזרה</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <ScreenHeader title="מרכז התראות" subtitle={`${activeCount} מתוך ${NOTIF_DEFINITIONS.length} פעילות`} />

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          <Card variant="primary">
            <Text style={[typography.h3, { color: colors.textPrimary }]}>📱 התראות למסך הפלאפון</Text>
            <Text style={[typography.body, { color: colors.textPrimary, opacity: 0.9, marginTop: spacing.sm }]}>
              ההתראות יגיעו ישירות למסך הנעילה / שורת ההתראות של המכשיר. יש להפעיל את ההגדרות, ואז ללחוץ "החל" למטה.
            </Text>
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md }}>
              <View style={[styles.dot, permStatus === 'granted' ? styles.dotOk : styles.dotBad]} />
              <Text style={[typography.small, { color: colors.textPrimary, opacity: 0.9 }]}>
                {permStatus === 'granted' ? 'הרשאת התראות פעילה' : permStatus === 'denied' ? 'אין הרשאת התראות' : 'בודק הרשאות...'}
              </Text>
            </View>
            <View style={{ flexDirection: 'row-reverse', gap: spacing.sm, marginTop: spacing.md, flexWrap: 'wrap' }}>
              {permStatus !== 'granted' && (
                <Button label="🔓 אפשר התראות" onPress={requestPermission} variant="secondary" style={{ flex: 1, minWidth: 140 }} fullWidth />
              )}
              <Button label="🧪 שלח התראת בדיקה עכשיו" onPress={testNow} variant="secondary" style={{ flex: 1, minWidth: 140 }} fullWidth />
              <Button label="⏱ בדיקת תזמון (30 שנ׳)" onPress={test30s} variant="secondary" style={{ flex: 1, minWidth: 140 }} fullWidth />
            </View>
            <View style={{ marginTop: spacing.md }}>
              <Button
                label={busy ? 'מתזמן...' : '🔔 החל / רענן את ההתראות'}
                onPress={apply}
                variant="secondary"
                fullWidth
              />
            </View>
          </Card>

          {groups.map((group) => (
            <View key={group} style={{ marginTop: spacing.md }}>
              <Text style={[typography.h2, { color: colors.textPrimary, marginBottom: spacing.sm }]}>
                {GROUP_LABELS[group]}
              </Text>
              {NOTIF_DEFINITIONS.filter((d) => d.group === group).map((def) => {
                const isOn = prefs[def.id];
                const isExpanded = expanded.has(def.id);
                const hasSettings = HAS_SETTINGS.has(def.id);
                return (
                  <Card key={def.id} style={{ marginBottom: spacing.sm }}>
                    <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.md }}>
                      <Text style={{ fontSize: 32 }}>{def.emoji}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[typography.h3, { color: colors.textPrimary }]}>{def.title}</Text>
                        <Text style={[typography.small, { color: colors.textMuted, marginTop: 2 }]}>
                          {settingsSummary(def.id, settings) || def.description}
                        </Text>
                      </View>
                      {hasSettings && (
                        <Pressable
                          onPress={() => toggleExpanded(def.id)}
                          hitSlop={10}
                          style={{
                            paddingHorizontal: 10,
                            paddingVertical: 6,
                            borderRadius: 999,
                            backgroundColor: isExpanded ? colors.primary : colors.surfaceAlt,
                            borderWidth: 1,
                            borderColor: colors.primary,
                          }}
                        >
                          <Text
                            style={[
                              typography.caption,
                              { color: isExpanded ? colors.textInverse : colors.primary, fontWeight: '700' },
                            ]}
                          >
                            {isExpanded ? '▲ סגור' : '⚙ זמן'}
                          </Text>
                        </Pressable>
                      )}
                      <Switch
                        value={isOn}
                        onValueChange={() => toggle(def.id)}
                        trackColor={{ true: colors.primary, false: colors.border }}
                        thumbColor={colors.surface}
                      />
                    </View>
                    {isExpanded && hasSettings && (
                      <View style={styles.settingsBlock}>
                        {!isOn && (
                          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.sm, fontStyle: 'italic' }]}>
                            (הפעל את ההתראה כדי שהזמן ייכנס לתוקף)
                          </Text>
                        )}
                        {renderSettingsFor(def.id, settings, patchSettings)}
                      </View>
                    )}
                  </Card>
                );
              })}
            </View>
          ))}

          <Card variant="accent">
            <Text style={[typography.body, { color: colors.primaryDark, opacity: 0.85 }]}>
              💡 ההתראות מתוזמנות מקומית - אינן דורשות חיבור לאינטרנט. הן יעבדו גם כשהאפליקציה סגורה.
              {'\n\n'}
              שים לב: ב-iOS יש מגבלה של 64 התראות מתוזמנות בו זמנית.
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
  topBar: { padding: spacing.lg },
  dot: { width: 10, height: 10, borderRadius: 5 },
  dotOk: { backgroundColor: '#4CD964' },
  dotBad: { backgroundColor: '#FF6B6B' },
  settingsBlock: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
