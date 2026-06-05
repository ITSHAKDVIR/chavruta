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
import { HDate } from '@hebcal/core';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

const KEY = '@yahadut/learning-plans';

type Plan = {
  id: string;
  name: string;
  totalUnits: number;
  unitLabel: string;
  targetDate: string;
  progress: number;
  log: { date: string; units: number }[];
};

export default function LearningPlanScreen() {
  const router = useRouter();
  const [plans, setPlans] = useStoredJSON<Plan[]>(KEY, []);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', totalUnits: '', unitLabel: 'דפים', targetDate: '' });
  const [activeId, setActiveId] = useState<string | null>(null);
  const [logAmount, setLogAmount] = useState('1');

  const active = plans.find((p) => p.id === activeId);

  function createPlan() {
    const total = parseInt(form.totalUnits, 10);
    if (!form.name.trim() || !total || total <= 0 || !form.targetDate) { Alert.alert('חסר', 'יש למלא את כל השדות'); return; }
    const p: Plan = {
      id: String(Date.now()),
      name: form.name.trim(),
      totalUnits: total,
      unitLabel: form.unitLabel,
      targetDate: form.targetDate,
      progress: 0,
      log: [],
    };
    setPlans((arr) => [...arr, p]);
    setForm({ name: '', totalUnits: '', unitLabel: 'דפים', targetDate: '' });
    setShowForm(false);
  }

  function logProgress() {
    if (!active) return;
    const amount = parseInt(logAmount, 10);
    if (!amount) return;
    setPlans((arr) => arr.map((p) => p.id === active.id ? { ...p, progress: p.progress + amount, log: [...p.log, { date: new Date().toISOString().slice(0, 10), units: amount }] } : p));
    setLogAmount('1');
  }

  function del(id: string) {
    Alert.alert('מחיקה', 'למחוק תוכנית?', [
      { text: 'בטל', style: 'cancel' },
      { text: 'מחק', style: 'destructive', onPress: () => { setPlans((arr) => arr.filter((p) => p.id !== id)); if (activeId === id) setActiveId(null); } },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <Pressable onPress={() => activeId ? setActiveId(null) : router.back()} hitSlop={10}>
          <Text style={[typography.bodyBold, { color: colors.primary }]}>‹ {activeId ? 'רשימה' : 'חזרה'}</Text>
        </Pressable>
        {!activeId && <Pressable onPress={() => setShowForm(!showForm)} hitSlop={10}><Text style={[typography.bodyBold, { color: colors.primary }]}>{showForm ? 'בטל' : '+ תוכנית'}</Text></Pressable>}
      </View>
      <KeyboardScroll contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <ScreenHeader title={active?.name ?? 'תוכניות לימוד'} subtitle={active ? `${active.progress}/${active.totalUnits} ${active.unitLabel}` : 'יעדים אישיים'} />

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          {!active && showForm && (
            <Card>
              <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>שם התוכנית:</Text>
              <TextInput value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} placeholder='לדוגמא: סיום מסכת ברכות' placeholderTextColor={colors.textMuted} style={styles.input} />
              <Text style={[typography.bodyBold, { color: colors.textPrimary, marginTop: spacing.sm }]}>סך הכל יחידות:</Text>
              <TextInput value={form.totalUnits} onChangeText={(v) => setForm({ ...form, totalUnits: v })} keyboardType='numeric' placeholder='64' placeholderTextColor={colors.textMuted} style={styles.input} />
              <Text style={[typography.bodyBold, { color: colors.textPrimary, marginTop: spacing.sm }]}>תווית יחידה:</Text>
              <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                {['דפים', 'פרקים', 'משניות', 'הלכות', 'עמודים', 'פסוקים'].map((u) => (
                  <Pressable key={u} onPress={() => setForm({ ...form, unitLabel: u })} style={[styles.chip, form.unitLabel === u && styles.chipActive]}>
                    <Text style={[typography.caption, { color: form.unitLabel === u ? colors.textInverse : colors.textPrimary }]}>{u}</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={[typography.bodyBold, { color: colors.textPrimary, marginTop: spacing.sm }]}>תאריך יעד:</Text>
              <TextInput value={form.targetDate} onChangeText={(v) => setForm({ ...form, targetDate: v })} placeholder='YYYY-MM-DD' placeholderTextColor={colors.textMuted} style={styles.input} />
              <View style={{ marginTop: spacing.md }}><Button label='צור' onPress={createPlan} fullWidth /></View>
            </Card>
          )}

          {active ? (
            <>
              {(() => {
                const daysRemaining = Math.max(1, Math.ceil((new Date(active.targetDate).getTime() - Date.now()) / 86_400_000));
                const remaining = active.totalUnits - active.progress;
                const dailyTarget = Math.ceil(remaining / daysRemaining);
                const percent = Math.round((active.progress / active.totalUnits) * 100);
                return (
                  <>
                    <Card variant="primary">
                      <Text style={{ fontSize: 64, color: colors.textPrimary, fontWeight: '700', textAlign: 'center' }}>{percent}%</Text>
                      <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${percent}%` }]} /></View>
                      <Text style={[typography.body, { color: colors.textPrimary, opacity: 0.9, textAlign: 'center', marginTop: spacing.sm }]}>
                        {active.progress} / {active.totalUnits} {active.unitLabel}
                      </Text>
                    </Card>
                    <Card variant="accent">
                      <Text style={[typography.h3, { color: colors.primaryDark, textAlign: 'center' }]}>קצב יומי דרוש:</Text>
                      <Text style={{ fontSize: 36, color: colors.primaryDark, fontWeight: '700', textAlign: 'center' }}>{dailyTarget}</Text>
                      <Text style={[typography.body, { color: colors.primaryDark, opacity: 0.85, textAlign: 'center' }]}>
                        {active.unitLabel} ביום (עוד {daysRemaining} ימים)
                      </Text>
                    </Card>
                    <Card>
                      <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>הוסף ללמידה היום:</Text>
                      <View style={{ flexDirection: 'row-reverse', gap: spacing.sm, marginTop: spacing.sm }}>
                        <TextInput value={logAmount} onChangeText={setLogAmount} keyboardType='numeric' style={[styles.input, { flex: 1 }]} />
                        <Button label="+ הוסף" onPress={logProgress} />
                      </View>
                    </Card>
                    {active.log.length > 0 && (
                      <Card>
                        <Text style={[typography.h3, { color: colors.textPrimary, marginBottom: spacing.sm }]}>10 ימים אחרונים</Text>
                        {active.log.slice(-10).reverse().map((l, i) => (
                          <View key={i} style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', paddingVertical: 4 }}>
                            <Text style={[typography.body, { color: colors.textPrimary }]}>{new HDate(new Date(l.date)).renderGematriya()}</Text>
                            <Text style={[typography.bodyBold, { color: colors.primary }]}>+{l.units}</Text>
                          </View>
                        ))}
                      </Card>
                    )}
                    <Button label='הסר תוכנית' onPress={() => del(active.id)} variant='ghost' />
                  </>
                );
              })()}
            </>
          ) : plans.length === 0 ? (
            <Card><View style={{ alignItems: 'center', paddingVertical: spacing.xl }}>
              <Text style={{ fontSize: 56 }}>📚</Text>
              <Text style={[typography.h3, { color: colors.textPrimary, marginTop: spacing.md }]}>אין תוכניות</Text>
              <View style={{ marginTop: spacing.lg }}><Button label='צור תוכנית' onPress={() => setShowForm(true)} /></View>
            </View></Card>
          ) : (
            plans.map((p) => {
              const percent = Math.round((p.progress / p.totalUnits) * 100);
              return (
                <Card key={p.id} onPress={() => setActiveId(p.id)}>
                  <Text style={[typography.h3, { color: colors.textPrimary }]}>{p.name}</Text>
                  <View style={styles.progressBarSmall}><View style={[styles.progressFillSmall, { width: `${percent}%` }]} /></View>
                  <Text style={[typography.small, { color: colors.textMuted, marginTop: 4 }]}>{p.progress}/{p.totalUnits} {p.unitLabel} · {percent}%</Text>
                </Card>
              );
            })
          )}
        </View>
        <View style={{ height: 40 }} />
      </KeyboardScroll>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: { padding: spacing.lg, flexDirection: 'row-reverse', justifyContent: 'space-between' },
  input: { marginTop: 4, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, fontSize: 16, color: colors.textPrimary, textAlign: 'right', backgroundColor: colors.bg },
  chip: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.full, backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
  progressBar: { height: 12, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 6, overflow: 'hidden', marginTop: spacing.sm },
  progressFill: { height: '100%', backgroundColor: colors.surface },
  progressBarSmall: { height: 6, backgroundColor: colors.surfaceAlt, borderRadius: 3, marginTop: spacing.sm, overflow: 'hidden' },
  progressFillSmall: { height: '100%', backgroundColor: colors.primary },
});
