import React, { useEffect, useState } from 'react';
import { Alert, Linking, Platform, StyleSheet, Text, TextInput, View, Pressable } from 'react-native';
import { KeyboardScroll } from '../../src/components/KeyboardScroll';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { Pill } from '../../src/components/Pill';
import { useStoredJSON } from '../../src/hooks/useStoredJSON';
import { ensurePermissions, scheduleWeekly, cancelById } from '../../src/services/notifications';
import { getJSON, setJSON } from '../../src/storage/storage';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

const KEY = '@yahadut/parent-call';
const KEY_PREFS = '@yahadut/parent-call-prefs';
const KEY_NOTIF_IDS = '@yahadut/parent-call-notif-ids';

type Parent = { id: string; name: string; phone: string; lastCalledISO?: string };

type Prefs = {
  enabled: boolean;
  weekday: number; // 0=Sunday ... 6=Saturday
  hour: number;
  minute: number;
};

const DEFAULT_PREFS: Prefs = { enabled: false, weekday: 5, hour: 11, minute: 0 }; // ערב שבת 11:00

const WEEKDAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

function showAlert(msg: string) {
  if (Platform.OS === 'web' && typeof (window as any).alert === 'function') (window as any).alert(msg);
  else Alert.alert('', msg);
}

export default function ParentCallScreen() {
  const router = useRouter();
  const [parents, setParents] = useStoredJSON<Parent[]>(KEY, []);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);

  useEffect(() => {
    (async () => {
      const p = await getJSON<Prefs>(KEY_PREFS, DEFAULT_PREFS);
      setPrefs(p);
    })();
  }, []);

  async function savePrefs(next: Prefs) {
    setPrefs(next);
    await setJSON(KEY_PREFS, next);
    if (next.enabled) await reschedule(next);
    else await cancelAll();
  }

  async function cancelAll() {
    const ids = await getJSON<string[]>(KEY_NOTIF_IDS, []);
    for (const id of ids) {
      try { await cancelById(id); } catch {}
    }
    await setJSON(KEY_NOTIF_IDS, []);
  }

  async function reschedule(p: Prefs) {
    await cancelAll();
    const ok = await ensurePermissions();
    if (!ok) {
      showAlert('יש לאשר הרשאות התראות במכשיר');
      return;
    }
    const id = await scheduleWeekly(p.weekday, p.hour, p.minute, {
      title: '📞 כיבוד הורים',
      body: `הגיע זמן השיחה השבועית להורים`,
      channelId: 'default',
    });
    if (id) await setJSON(KEY_NOTIF_IDS, [id]);
  }

  function add() {
    if (!newName.trim() || !newPhone.trim()) {
      showAlert('יש למלא שם ומספר');
      return;
    }
    setParents((arr) => [...arr, { id: String(Date.now()), name: newName.trim(), phone: newPhone.trim() }]);
    setNewName('');
    setNewPhone('');
    setShowForm(false);
  }
  function call(p: Parent) {
    Linking.openURL(`tel:${p.phone.replace(/[^0-9+]/g, '')}`);
    setParents((arr) => arr.map((x) => (x.id === p.id ? { ...x, lastCalledISO: new Date().toISOString() } : x)));
  }
  function del(id: string) {
    setParents((arr) => arr.filter((p) => p.id !== id));
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={[typography.bodyBold, { color: colors.primary }]}>‹ חזרה</Text>
        </Pressable>
        <Pressable onPress={() => setShowForm(!showForm)} hitSlop={10}>
          <Text style={[typography.bodyBold, { color: colors.primary }]}>{showForm ? 'בטל' : '+ חדש'}</Text>
        </Pressable>
      </View>
      <KeyboardScroll contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <ScreenHeader title="כיבוד אב ואם" subtitle="התקשרות שבועית קבועה" />

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          <Card variant="accent">
            <Text style={[typography.body, { color: colors.primaryDark, opacity: 0.85 }]}>
              "כבד את אביך ואת אמך, למען יאריכון ימיך" - מצוות כיבוד הורים. שיחה שבועית - מעט שעושה הרבה.
            </Text>
          </Card>

          {/* תזכורת קבועה */}
          <Card>
            <Text style={[typography.h3, { color: colors.textPrimary, marginBottom: spacing.sm }]}>🔔 תזכורת שבועית קבועה</Text>

            <Pressable onPress={() => savePrefs({ ...prefs, enabled: !prefs.enabled })} style={styles.toggleRow}>
              <View style={[styles.cb, prefs.enabled && styles.cbDone]}>
                {prefs.enabled && <Text style={{ color: colors.textInverse, fontWeight: '700' }}>✓</Text>}
              </View>
              <Text style={[typography.body, { color: colors.textPrimary, flex: 1 }]}>הפעלת תזכורת שבועית</Text>
              <Pill label={prefs.enabled ? 'פעיל' : 'כבוי'} tone={prefs.enabled ? 'success' : 'default'} />
            </Pressable>

            <Text style={[typography.bodyBold, { color: colors.textPrimary, marginTop: spacing.md, marginBottom: spacing.sm }]}>יום בשבוע:</Text>
            <View style={{ flexDirection: 'row-reverse', gap: 4, flexWrap: 'wrap' }}>
              {WEEKDAYS.map((d, i) => (
                <Pressable
                  key={i}
                  onPress={() => savePrefs({ ...prefs, weekday: i })}
                  style={[styles.chip, prefs.weekday === i && styles.chipActive]}
                >
                  <Text style={[typography.body, { color: prefs.weekday === i ? colors.textInverse : colors.textPrimary }]}>{d}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={[typography.bodyBold, { color: colors.textPrimary, marginTop: spacing.md, marginBottom: spacing.sm }]}>שעה:</Text>
            <View style={{ flexDirection: 'row-reverse', gap: spacing.sm, alignItems: 'center', flexWrap: 'wrap' }}>
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 4 }}>
                <TextInput
                  value={String(prefs.hour).padStart(2, '0')}
                  onChangeText={(v) => {
                    const n = parseInt(v.replace(/\D/g, ''), 10);
                    if (!isNaN(n) && n >= 0 && n <= 23) savePrefs({ ...prefs, hour: n });
                  }}
                  keyboardType="numeric"
                  maxLength={2}
                  style={[styles.timeInput, { width: 60 }]}
                  textAlign="center"
                />
                <Text style={[typography.h2, { color: colors.textPrimary }]}>:</Text>
                <TextInput
                  value={String(prefs.minute).padStart(2, '0')}
                  onChangeText={(v) => {
                    const n = parseInt(v.replace(/\D/g, ''), 10);
                    if (!isNaN(n) && n >= 0 && n <= 59) savePrefs({ ...prefs, minute: n });
                  }}
                  keyboardType="numeric"
                  maxLength={2}
                  style={[styles.timeInput, { width: 60 }]}
                  textAlign="center"
                />
              </View>
              <Text style={[typography.caption, { color: colors.textMuted, marginRight: spacing.md }]}>
                ({String(prefs.hour).padStart(2, '0')}:{String(prefs.minute).padStart(2, '0')} ביום {WEEKDAYS[prefs.weekday]})
              </Text>
            </View>
          </Card>

          {showForm && (
            <Card>
              <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>שם:</Text>
              <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                {['אבא', 'אמא', 'סבא', 'סבתא'].map((n) => (
                  <Pressable key={n} onPress={() => setNewName(n)}>
                    <Pill label={n} tone={newName === n ? 'primary' : 'default'} />
                  </Pressable>
                ))}
              </View>
              <TextInput
                value={newName}
                onChangeText={setNewName}
                placeholder="או הקלד שם..."
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                textAlign="right"
              />
              <Text style={[typography.bodyBold, { color: colors.textPrimary, marginTop: spacing.sm }]}>טלפון:</Text>
              <TextInput
                value={newPhone}
                onChangeText={setNewPhone}
                placeholder="050-1234567"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
                style={styles.input}
                textAlign="right"
              />
              <View style={{ marginTop: spacing.md }}>
                <Button label="הוסף" onPress={add} fullWidth />
              </View>
            </Card>
          )}

          {parents.map((p) => {
            const daysSinceCall = p.lastCalledISO ? Math.floor((Date.now() - new Date(p.lastCalledISO).getTime()) / 86_400_000) : null;
            return (
              <Card key={p.id} variant={daysSinceCall !== null && daysSinceCall > 7 ? 'primary' : 'default'}>
                <Text style={[typography.h3, { color: daysSinceCall !== null && daysSinceCall > 7 ? colors.textInverse : colors.textPrimary }]}>{p.name}</Text>
                <Text style={[typography.small, { color: daysSinceCall !== null && daysSinceCall > 7 ? colors.textInverse : colors.textMuted, opacity: 0.85, marginTop: 2 }]}>{p.phone}</Text>
                {daysSinceCall !== null && (
                  <View style={{ marginTop: spacing.sm }}>
                    <Pill
                      label={daysSinceCall === 0 ? 'התקשרת היום' : `לפני ${daysSinceCall} ימים`}
                      tone={daysSinceCall > 7 ? 'danger' : daysSinceCall > 3 ? 'warning' : 'success'}
                    />
                  </View>
                )}
                <View style={{ flexDirection: 'row-reverse', gap: spacing.sm, marginTop: spacing.md }}>
                  <Button label="📞 התקשר" onPress={() => call(p)} variant={daysSinceCall !== null && daysSinceCall > 7 ? 'secondary' : 'primary'} fullWidth style={{ flex: 1 }} />
                  <Pressable onPress={() => del(p.id)}>
                    <Text style={[typography.caption, { color: colors.danger }]}>הסר</Text>
                  </Pressable>
                </View>
              </Card>
            );
          })}
        </View>
        <View style={{ height: 40 }} />
      </KeyboardScroll>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: { padding: spacing.lg, flexDirection: 'row-reverse', justifyContent: 'space-between' },
  toggleRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  cb: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  cbDone: { backgroundColor: colors.success, borderColor: colors.success },
  chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.md, backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border, minWidth: 56, alignItems: 'center' },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
  input: { marginTop: 4, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, fontSize: 16, color: colors.textPrimary, backgroundColor: colors.bg },
  timeInput: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.sm, fontSize: 22, color: colors.textPrimary, backgroundColor: colors.bg, fontWeight: '700' },
});
