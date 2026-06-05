import React, { useState, useMemo } from 'react';
import { StyleSheet, Text, View, Pressable, TextInput, Alert } from 'react-native';
import { KeyboardScroll } from '../../src/components/KeyboardScroll';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { Pill } from '../../src/components/Pill';
import { useStoredJSON } from '../../src/hooks/useStoredJSON';
import { HebrewDatePicker } from '../../src/components/HebrewDatePicker';
import { calculatePhases, PHASES, KADDISH } from '../../src/data/aveilus';
import { formatHebrewDate } from '../../src/data/tahara';
import { HDate } from '@hebcal/core';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

const KEY = '@yahadut/aveilus';

type AvelEntry = {
  id: string;
  deceasedName: string;
  motherName: string;
  relation: string;
  deathDate: string;
  burialDate?: string;
};

export default function AveilusScreen() {
  const router = useRouter();
  const [entries, setEntries] = useStoredJSON<AvelEntry[]>(KEY, []);
  const [showForm, setShowForm] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [form, setForm] = useState({ deceasedName: '', motherName: '', relation: 'אבא', deathDate: new Date().toISOString().slice(0, 10), burialDate: '' });

  const active = entries.find((e) => e.id === activeId);
  const calc = useMemo(() => {
    if (!active) return null;
    return calculatePhases(new Date(active.deathDate), active.burialDate ? new Date(active.burialDate) : undefined);
  }, [active]);

  function addEntry() {
    if (!form.deceasedName.trim() || !form.deathDate) {
      Alert.alert('חסר', 'יש למלא שם ותאריך פטירה');
      return;
    }
    const entry: AvelEntry = {
      id: String(Date.now()),
      deceasedName: form.deceasedName.trim(),
      motherName: form.motherName.trim(),
      relation: form.relation,
      deathDate: form.deathDate,
      burialDate: form.burialDate || undefined,
    };
    setEntries((arr) => [...arr, entry]);
    setActiveId(entry.id);
    setForm({ deceasedName: '', motherName: '', relation: 'אבא', deathDate: new Date().toISOString().slice(0, 10), burialDate: '' });
    setShowForm(false);
  }

  function del(id: string) {
    Alert.alert('הסרה', 'להסיר רשומה?', [
      { text: 'בטל', style: 'cancel' },
      { text: 'הסר', style: 'destructive', onPress: () => { setEntries((arr) => arr.filter((e) => e.id !== id)); if (activeId === id) setActiveId(null); } },
    ]);
  }

  if (active && calc) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.topBar}>
          <Pressable onPress={() => setActiveId(null)} hitSlop={10}>
            <Text style={[typography.bodyBold, { color: colors.primary }]}>‹ הרשימה</Text>
          </Pressable>
          <Pressable onPress={() => del(active.id)} hitSlop={10}>
            <Text style={[typography.bodyBold, { color: colors.danger }]}>הסר</Text>
          </Pressable>
        </View>
        <KeyboardScroll contentContainerStyle={{ paddingBottom: spacing.xl }}>
          <ScreenHeader title={active.deceasedName} subtitle={`תאריכי אבלות · ${active.relation} · ${calc.currentPhase.hebrewName}`} />

          <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
            <Card variant="primary">
              <Text style={[typography.h2, { color: colors.textPrimary }]}>{calc.currentPhase.hebrewName}</Text>
              <Text style={[typography.body, { color: colors.textPrimary, opacity: 0.9, marginTop: spacing.sm }]}>
                {calc.currentPhase.description}
              </Text>
              <Text style={[typography.small, { color: colors.textPrimary, opacity: 0.85, marginTop: spacing.sm }]}>
                ימים מקבורה: {calc.daysSinceBurial} · מפטירה: {calc.daysSinceDeath}
              </Text>
            </Card>

            <Card>
              <Text style={[typography.h3, { color: colors.textPrimary }]}>הלכות {calc.currentPhase.hebrewName}</Text>
              <View style={{ marginTop: spacing.sm, gap: 6 }}>
                {calc.currentPhase.rules.map((r, i) => (
                  <View key={i} style={{ flexDirection: 'row-reverse', gap: 6, alignItems: 'flex-start' }}>
                    <Text style={{ color: colors.primary }}>•</Text>
                    <Text style={[typography.body, { color: colors.textSecondary, flex: 1 }]}>{r}</Text>
                  </View>
                ))}
              </View>
            </Card>

            <Card>
              <Text style={[typography.h3, { color: colors.textPrimary }]}>תאריכי מפתח</Text>
              <View style={{ marginTop: spacing.sm, gap: spacing.sm }}>
                <DateRow label="סיום שבעה" date={calc.shivaEnd} />
                <DateRow label="סיום שלושים" date={calc.sheloshimEnd} />
                {active.relation === 'אבא' || active.relation === 'אמא' ? (
                  <>
                    <DateRow label="סיום אמירת קדיש (11 חודשים)" date={calc.kaddishEnd} />
                    <DateRow label="סיום יב חודש" date={calc.yearEnd} />
                  </>
                ) : null}
                <DateRow label="יום היארצייט הבא" date={calc.yahrtzeit} highlight />
              </View>
            </Card>

            <Card>
              <Text style={[typography.h3, { color: colors.textPrimary, marginBottom: spacing.sm }]}>קדיש יתום</Text>
              <View style={{ padding: spacing.md, backgroundColor: colors.surfaceAlt, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border }}>
                <Text style={[typography.sacred, { color: colors.textPrimary }]}>{KADDISH}</Text>
              </View>
            </Card>

            <Card variant="accent">
              <Text style={[typography.h3, { color: colors.primaryDark }]}>כל השלבים</Text>
              <View style={{ marginTop: spacing.sm, gap: spacing.sm }}>
                {PHASES.map((p) => (
                  <View key={p.id} style={{ flexDirection: 'row-reverse', justifyContent: 'space-between' }}>
                    <Text style={[typography.body, { color: colors.primaryDark, flex: 1 }]}>{p.hebrewName}</Text>
                    <Text style={[typography.small, { color: colors.primaryDark, opacity: 0.7 }]}>{p.description}</Text>
                  </View>
                ))}
              </View>
            </Card>
          </View>
          <View style={{ height: 40 }} />
        </KeyboardScroll>
      </SafeAreaView>
    );
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
        <ScreenHeader title="תאריכי אבלות" subtitle="מעקב שבעה, שלושים, יב חודש + יארצייט" />

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          {showForm && (
            <Card>
              <Label>שם הנפטר/ת:</Label>
              <Input value={form.deceasedName} onChangeText={(v) => setForm({ ...form, deceasedName: v })} />

              <Label>שם האם:</Label>
              <Input value={form.motherName} onChangeText={(v) => setForm({ ...form, motherName: v })} />

              <Label>קרבת משפחה:</Label>
              <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                {['אבא', 'אמא', 'בעל', 'אישה', 'בן', 'בת', 'אח', 'אחות'].map((r) => (
                  <Pressable key={r} onPress={() => setForm({ ...form, relation: r })} style={[styles.chip, form.relation === r && styles.chipActive]}>
                    <Text style={[typography.caption, { color: form.relation === r ? colors.textInverse : colors.textPrimary }]}>{r}</Text>
                  </Pressable>
                ))}
              </View>

              <Label>תאריך פטירה:</Label>
              <View style={{ marginTop: 4 }}>
                <HebrewDatePicker
                  value={form.deathDate ? new Date(form.deathDate) : new Date()}
                  onChange={(d) => setForm({ ...form, deathDate: d.toISOString().slice(0, 10) })}
                  defaultMode="hebrew"
                />
              </View>

              <Label>תאריך קבורה (אם שונה):</Label>
              <View style={{ flexDirection: 'row-reverse', gap: spacing.sm, marginTop: 4, alignItems: 'center' }}>
                <Pressable
                  onPress={() => setForm({ ...form, burialDate: form.burialDate ? '' : form.deathDate })}
                  style={[styles.chip, form.burialDate && styles.chipActive]}
                >
                  <Text style={[typography.caption, { color: form.burialDate ? colors.textInverse : colors.textPrimary }]}>
                    {form.burialDate ? '✓ שונה' : '+ הוסף תאריך קבורה'}
                  </Text>
                </Pressable>
              </View>
              {form.burialDate && (
                <View style={{ marginTop: spacing.sm }}>
                  <HebrewDatePicker
                    value={new Date(form.burialDate)}
                    onChange={(d) => setForm({ ...form, burialDate: d.toISOString().slice(0, 10) })}
                    defaultMode="hebrew"
                  />
                </View>
              )}

              <View style={{ marginTop: spacing.md }}>
                <Button label="הוסף" onPress={addEntry} fullWidth />
              </View>
            </Card>
          )}

          {entries.length === 0 && !showForm && (
            <Card>
              <View style={{ alignItems: 'center', paddingVertical: spacing.xl }}>
                <Text style={{ fontSize: 56 }}>🕯️</Text>
                <Text style={[typography.h3, { color: colors.textPrimary, marginTop: spacing.md, textAlign: 'center' }]}>
                  אין רשומות
                </Text>
                <View style={{ marginTop: spacing.lg }}>
                  <Button label="הוסף נפטר" onPress={() => setShowForm(true)} />
                </View>
              </View>
            </Card>
          )}

          {entries.map((e) => {
            const c = calculatePhases(new Date(e.deathDate), e.burialDate ? new Date(e.burialDate) : undefined);
            return (
              <Card key={e.id} onPress={() => setActiveId(e.id)}>
                <Text style={[typography.h3, { color: colors.textPrimary }]}>{e.deceasedName}</Text>
                <Text style={[typography.small, { color: colors.textMuted, marginTop: 2 }]}>{e.relation}</Text>
                <View style={{ flexDirection: 'row-reverse', gap: 4, marginTop: spacing.sm }}>
                  <Pill label={c.currentPhase.hebrewName} tone="primary" />
                  <Pill label={`${c.daysSinceDeath} ימים`} tone="default" />
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

function DateRow({ label, date, highlight }: { label: string; date: Date; highlight?: boolean }) {
  return (
    <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between' }}>
      <Text style={[typography.body, { color: highlight ? colors.primary : colors.textPrimary, fontWeight: highlight ? '700' : '400' }]}>{label}</Text>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={[typography.bodyBold, { color: colors.primary }]}>{new HDate(date).renderGematriya()}</Text>
        <Text style={[typography.caption, { color: colors.textMuted }]}>{date.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })}</Text>
      </View>
    </View>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <Text style={[typography.bodyBold, { color: colors.textPrimary, marginTop: spacing.sm }]}>{children}</Text>;
}
function Input(props: React.ComponentProps<typeof TextInput>) {
  return <TextInput placeholderTextColor={colors.textMuted} {...props} style={[styles.input, props.style]} />;
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
    fontSize: 16,
    color: colors.textPrimary,
    textAlign: 'right',
    backgroundColor: colors.bg,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
});
