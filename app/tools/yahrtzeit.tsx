import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View, Pressable, TextInput, Alert, Modal } from 'react-native';
import { KeyboardScroll } from '../../src/components/KeyboardScroll';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { Pill } from '../../src/components/Pill';
import { useStoredJSON } from '../../src/hooks/useStoredJSON';
import { Keys } from '../../src/storage/storage';
import { Yahrtzeit, HEBREW_MONTHS, RELATIONSHIPS, findNextYahrtzeit, daysUntil, formatYahrtzeitDate } from '../../src/data/yahrtzeit';
import { HDate } from '@hebcal/core';
import { scheduleAt, ensurePermissions } from '../../src/services/notifications';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

type Form = {
  hebrewName: string;
  hebrewFatherName: string;
  relationship: string;
  day: string;
  month: number;
  year: string;
  afterSunset: boolean;
  notes: string;
};

const EMPTY_FORM: Form = {
  hebrewName: '',
  hebrewFatherName: '',
  relationship: 'אב',
  day: '',
  month: 1,
  year: '',
  afterSunset: false,
  notes: '',
};

export default function YahrtzeitScreen() {
  const router = useRouter();
  const [list, setList] = useStoredJSON<Yahrtzeit[]>(Keys.yahrtzeits, []);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Form>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);

  const today = new Date();

  const enriched = useMemo(
    () =>
      list
        .map((y) => {
          const nextHd = findNextYahrtzeit(y, today);
          return { y, nextHd, daysAway: daysUntil(nextHd, today), gregDate: nextHd.greg() };
        })
        .sort((a, b) => a.daysAway - b.daysAway),
    [list],
  );

  async function saveForm() {
    if (!form.hebrewName.trim() || !form.day || !form.year) {
      Alert.alert('שדות חסרים', 'יש למלא שם, יום, וחודש פטירה.');
      return;
    }
    const dayN = parseInt(form.day, 10);
    const yearN = parseInt(form.year, 10);
    if (!dayN || dayN < 1 || dayN > 30 || !yearN || yearN < 5400 || yearN > 6200) {
      Alert.alert('ערך לא תקין', 'יום: 1-30, שנה: 5400-6200');
      return;
    }
    let actualDay = dayN;
    let actualMonth = form.month;
    let actualYear = yearN;
    if (form.afterSunset) {
      const hd = new HDate(dayN, form.month, yearN).next();
      actualDay = hd.getDate();
      actualMonth = hd.getMonth();
      actualYear = hd.getFullYear();
    }
    const entry: Yahrtzeit = {
      id: editingId ?? String(Date.now()),
      hebrewName: form.hebrewName.trim(),
      hebrewFatherName: form.hebrewFatherName.trim(),
      relationship: form.relationship,
      deathHebrewDay: actualDay,
      deathHebrewMonth: actualMonth,
      deathHebrewYear: actualYear,
      afterSunset: form.afterSunset,
      notes: form.notes.trim() || undefined,
      createdAt: Date.now(),
    };
    if (editingId) {
      setList((l) => l.map((x) => (x.id === editingId ? entry : x)));
    } else {
      setList((l) => [...l, entry]);
    }
    await scheduleReminderFor(entry);
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(false);
  }

  async function scheduleReminderFor(y: Yahrtzeit) {
    const nextHd = findNextYahrtzeit(y, new Date());
    const reminderTime = new Date(nextHd.greg());
    reminderTime.setDate(reminderTime.getDate() - 1);
    reminderTime.setHours(20, 0, 0, 0);
    const ok = await ensurePermissions();
    if (ok) {
      await scheduleAt(reminderTime, {
        title: `יארצייט - ${y.hebrewName}`,
        body: `מחר ${formatYahrtzeitDate(nextHd)} - להזכיר נשמת ${y.hebrewName} ${y.hebrewFatherName ? `בן/בת ${y.hebrewFatherName}` : ''}`,
        channelId: 'default',
      });
    }
  }

  function edit(y: Yahrtzeit) {
    setForm({
      hebrewName: y.hebrewName,
      hebrewFatherName: y.hebrewFatherName,
      relationship: y.relationship,
      day: String(y.deathHebrewDay),
      month: y.deathHebrewMonth,
      year: String(y.deathHebrewYear),
      afterSunset: y.afterSunset,
      notes: y.notes ?? '',
    });
    setEditingId(y.id);
    setShowForm(true);
  }

  function del(y: Yahrtzeit) {
    Alert.alert('הסרה', `להסיר את ${y.hebrewName} מהרשימה?`, [
      { text: 'ביטול', style: 'cancel' },
      { text: 'הסר', style: 'destructive', onPress: () => setList((l) => l.filter((x) => x.id !== y.id)) },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={[typography.bodyBold, { color: colors.primary }]}>‹ חזרה</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            setForm(EMPTY_FORM);
            setEditingId(null);
            setShowForm(true);
          }}
          hitSlop={10}
        >
          <Text style={[typography.bodyBold, { color: colors.primary }]}>+ חדש</Text>
        </Pressable>
      </View>

      <KeyboardScroll contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <ScreenHeader title="יארצייטים" subtitle="מעקב + תזכורת קדיש" />

        {enriched.length === 0 ? (
          <View style={{ paddingHorizontal: spacing.lg }}>
            <Card>
              <View style={{ alignItems: 'center', paddingVertical: spacing.xl }}>
                <Text style={{ fontSize: 56 }}>🕯️</Text>
                <Text style={[typography.h2, { color: colors.textPrimary, marginTop: spacing.md }]}>
                  אין יארצייטים שמורים
                </Text>
                <Text style={[typography.body, { color: colors.textMuted, marginTop: spacing.sm, textAlign: 'center' }]}>
                  הוסף נשמה לזכרון כדי לקבל תזכורת אוטומטית יום לפני.
                </Text>
                <View style={{ marginTop: spacing.lg }}>
                  <Button label="הוסף יארצייט" onPress={() => setShowForm(true)} />
                </View>
              </View>
            </Card>
          </View>
        ) : (
          <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
            {enriched.map(({ y, nextHd, daysAway, gregDate }) => (
              <Card key={y.id} onPress={() => edit(y)}>
                <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm }}>
                      <Text style={[typography.h3, { color: colors.textPrimary }]}>{y.hebrewName}</Text>
                      <Pill label={y.relationship} tone="default" />
                    </View>
                    {y.hebrewFatherName ? (
                      <Text style={[typography.small, { color: colors.textMuted, marginTop: 2 }]}>
                        בן/בת {y.hebrewFatherName}
                      </Text>
                    ) : null}
                    <Text style={[typography.body, { color: colors.primary, marginTop: spacing.sm }]}>
                      יארצייט הבא: {formatYahrtzeitDate(nextHd)}
                    </Text>
                    <Text style={[typography.small, { color: colors.textMuted }]}>
                      {gregDate.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </Text>
                    {y.notes ? (
                      <Text style={[typography.small, { color: colors.textSecondary, marginTop: spacing.sm, fontStyle: 'italic' }]}>
                        {y.notes}
                      </Text>
                    ) : null}
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: 32 }}>🕯️</Text>
                    {daysAway === 0 ? (
                      <Pill label="היום!" tone="primary" />
                    ) : daysAway === 1 ? (
                      <Pill label="מחר" tone="warning" />
                    ) : daysAway <= 7 ? (
                      <Pill label={`עוד ${daysAway}י׳`} tone="warning" />
                    ) : (
                      <Pill label={`עוד ${daysAway}י׳`} tone="default" />
                    )}
                  </View>
                </View>
                <View style={{ flexDirection: 'row-reverse', gap: spacing.sm, marginTop: spacing.md }}>
                  <Button label="ערוך" onPress={() => edit(y)} variant="secondary" />
                  <Button label="הסר" onPress={() => del(y)} variant="ghost" />
                </View>
              </Card>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </KeyboardScroll>

      <Modal visible={showForm} animationType="slide" transparent={false}>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <View style={styles.topBar}>
            <Pressable onPress={() => setShowForm(false)} hitSlop={10}>
              <Text style={[typography.bodyBold, { color: colors.primary }]}>ביטול</Text>
            </Pressable>
            <Pressable onPress={saveForm} hitSlop={10}>
              <Text style={[typography.bodyBold, { color: colors.primary }]}>שמור</Text>
            </Pressable>
          </View>
          <KeyboardScroll contentContainerStyle={{ paddingBottom: spacing.xl }}>
            <ScreenHeader title={editingId ? 'עריכת יארצייט' : 'יארצייט חדש'} />
            <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
              <Card>
                <Label>שם הנפטר (עברי)</Label>
                <Input value={form.hebrewName} onChangeText={(v) => setForm({ ...form, hebrewName: v })} />

                <Label>שם האב (עברי)</Label>
                <Input value={form.hebrewFatherName} onChangeText={(v) => setForm({ ...form, hebrewFatherName: v })} />

                <Label>קרבת משפחה</Label>
                <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                  {RELATIONSHIPS.map((r) => (
                    <Pressable
                      key={r}
                      onPress={() => setForm({ ...form, relationship: r })}
                      style={[styles.chip, form.relationship === r && styles.chipActive]}
                    >
                      <Text
                        style={[
                          typography.caption,
                          { color: form.relationship === r ? colors.textInverse : colors.textPrimary },
                        ]}
                      >
                        {r}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </Card>

              <Card>
                <Label>יום פטירה (1-30)</Label>
                <Input value={form.day} onChangeText={(v) => setForm({ ...form, day: v })} keyboardType="numeric" />

                <Label>חודש</Label>
                <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                  {HEBREW_MONTHS.map((m) => (
                    <Pressable
                      key={m.value}
                      onPress={() => setForm({ ...form, month: m.value })}
                      style={[styles.chip, form.month === m.value && styles.chipActive]}
                    >
                      <Text
                        style={[
                          typography.caption,
                          { color: form.month === m.value ? colors.textInverse : colors.textPrimary },
                        ]}
                      >
                        {m.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <Label>שנת פטירה (עברי, לדוגמא: 5780)</Label>
                <Input value={form.year} onChangeText={(v) => setForm({ ...form, year: v })} keyboardType="numeric" />

                <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.md }}>
                  <Text style={[typography.body, { color: colors.textPrimary, flex: 1 }]}>
                    נפטר אחרי שקיעת החמה? (התאריך עובר ליום הבא)
                  </Text>
                  <Pressable
                    onPress={() => setForm({ ...form, afterSunset: !form.afterSunset })}
                    style={[styles.toggle, form.afterSunset && styles.toggleActive]}
                  >
                    <Text
                      style={[
                        typography.bodyBold,
                        { color: form.afterSunset ? colors.textInverse : colors.textPrimary },
                      ]}
                    >
                      {form.afterSunset ? 'כן' : 'לא'}
                    </Text>
                  </Pressable>
                </View>
              </Card>

              <Card>
                <Label>הערות (אופציונלי)</Label>
                <Input
                  value={form.notes}
                  onChangeText={(v) => setForm({ ...form, notes: v })}
                  multiline
                  numberOfLines={3}
                  style={{ minHeight: 80 }}
                />
              </Card>
            </View>
          </KeyboardScroll>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <Text style={[typography.bodyBold, { color: colors.textPrimary, marginTop: spacing.sm }]}>{children}</Text>
  );
}

function Input(props: React.ComponentProps<typeof TextInput>) {
  return (
    <TextInput
      placeholderTextColor={colors.textMuted}
      {...props}
      style={[styles.input, props.style]}
    />
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: { padding: spacing.lg, flexDirection: 'row-reverse', justifyContent: 'space-between' },
  input: {
    marginTop: 4,
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
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
  toggle: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 60,
    alignItems: 'center',
  },
  toggleActive: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
});
