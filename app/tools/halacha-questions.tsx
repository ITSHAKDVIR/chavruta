import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, TextInput, Alert, Modal } from 'react-native';
import { KeyboardScroll } from '../../src/components/KeyboardScroll';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { Pill } from '../../src/components/Pill';
import { useStoredJSON } from '../../src/hooks/useStoredJSON';
import { hebrewDateInfo } from '../../src/data/hebcal';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

const KEY = '@yahadut/halacha-questions';

type Status = 'pending' | 'asked' | 'answered' | 'archived';
type Priority = 'high' | 'normal' | 'low';

type Question = {
  id: string;
  question: string;
  topic: string;
  priority: Priority;
  status: Status;
  askedRabbi?: string;
  answer?: string;
  createdAt: number;
  updatedAt: number;
};

const TOPICS = ['שבת', 'מועדים', 'כשרות', 'נדה', 'ברכות', 'נישואין', 'אבלות', 'כללי'];

export default function HalachaQuestionsScreen() {
  const router = useRouter();
  const [questions, setQuestions] = useStoredJSON<Question[]>(KEY, []);
  const [filter, setFilter] = useState<Status | 'all'>('pending');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ question: '', topic: 'כללי', priority: 'normal' as Priority, askedRabbi: '', answer: '' });

  function reset() {
    setForm({ question: '', topic: 'כללי', priority: 'normal', askedRabbi: '', answer: '' });
    setEditingId(null);
  }

  function add() {
    if (!form.question.trim()) { Alert.alert('חסר', 'יש להזין שאלה'); return; }
    const q: Question = {
      id: editingId ?? String(Date.now()),
      question: form.question.trim(),
      topic: form.topic,
      priority: form.priority,
      status: form.answer.trim() ? 'answered' : form.askedRabbi.trim() ? 'asked' : 'pending',
      askedRabbi: form.askedRabbi.trim() || undefined,
      answer: form.answer.trim() || undefined,
      createdAt: editingId ? (questions.find((x) => x.id === editingId)?.createdAt ?? Date.now()) : Date.now(),
      updatedAt: Date.now(),
    };
    setQuestions((arr) => editingId ? arr.map((x) => (x.id === editingId ? q : x)) : [q, ...arr]);
    reset();
    setShowForm(false);
  }

  function edit(q: Question) {
    setForm({ question: q.question, topic: q.topic, priority: q.priority, askedRabbi: q.askedRabbi ?? '', answer: q.answer ?? '' });
    setEditingId(q.id);
    setShowForm(true);
  }

  function changeStatus(id: string, status: Status) {
    setQuestions((arr) => arr.map((q) => (q.id === id ? { ...q, status, updatedAt: Date.now() } : q)));
  }

  function del(id: string) {
    Alert.alert('הסרה', 'למחוק שאלה?', [
      { text: 'בטל', style: 'cancel' },
      { text: 'מחק', style: 'destructive', onPress: () => setQuestions((arr) => arr.filter((q) => q.id !== id)) },
    ]);
  }

  const filtered = filter === 'all' ? questions : questions.filter((q) => q.status === filter);
  const counts = { pending: 0, asked: 0, answered: 0, archived: 0 };
  questions.forEach((q) => { counts[q.status]++; });

  const statusInfo: Record<Status, { label: string; emoji: string; tone: any }> = {
    pending: { label: 'ממתין לשאלה', emoji: '⏳', tone: 'warning' },
    asked: { label: 'נשאל - ממתין לתשובה', emoji: '✉️', tone: 'info' },
    answered: { label: 'נענה', emoji: '✓', tone: 'success' },
    archived: { label: 'בארכיון', emoji: '📁', tone: 'default' },
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={[typography.bodyBold, { color: colors.primary }]}>‹ חזרה</Text>
        </Pressable>
        <Pressable onPress={() => { reset(); setShowForm(true); }} hitSlop={10}>
          <Text style={[typography.bodyBold, { color: colors.primary }]}>+ חדש</Text>
        </Pressable>
      </View>
      <KeyboardScroll contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <ScreenHeader title="שאלות לרב" subtitle={`${counts.pending} ממתינות + ${counts.asked} בהמתנה לתשובה`} />

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          <View style={{ flexDirection: 'row-reverse', gap: spacing.sm, flexWrap: 'wrap' }}>
            {(['all', 'pending', 'asked', 'answered', 'archived'] as const).map((s) => (
              <Pressable key={s} onPress={() => setFilter(s)} style={[styles.tab, filter === s && styles.tabActive]}>
                <Text style={[typography.caption, { color: filter === s ? colors.textInverse : colors.textPrimary }]}>
                  {s === 'all' ? 'הכל' : statusInfo[s].label} {s !== 'all' && `(${counts[s]})`}
                </Text>
              </Pressable>
            ))}
          </View>

          {filtered.length === 0 ? (
            <Card>
              <View style={{ alignItems: 'center', paddingVertical: spacing.xl }}>
                <Text style={{ fontSize: 56 }}>❓</Text>
                <Text style={[typography.h3, { color: colors.textPrimary, marginTop: spacing.md }]}>אין שאלות</Text>
                <Text style={[typography.body, { color: colors.textMuted, marginTop: spacing.sm, textAlign: 'center' }]}>
                  רשום שאלה כשהיא צצה - אל תשכח. בפעם הבאה שתפגוש את הרב - שאל את כולן.
                </Text>
              </View>
            </Card>
          ) : (
            filtered.map((q) => (
              <Card key={q.id} onPress={() => edit(q)}>
                <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 16 }}>{statusInfo[q.status].emoji}</Text>
                  <Pill label={q.topic} tone="default" />
                  {q.priority === 'high' && <Pill label="דחוף" tone="danger" />}
                </View>
                <Text style={[typography.body, { color: colors.textPrimary, marginTop: spacing.sm, lineHeight: 22 }]}>
                  {q.question}
                </Text>
                {q.askedRabbi && (
                  <Text style={[typography.small, { color: colors.textMuted, marginTop: 4, fontStyle: 'italic' }]}>
                    נשאל: {q.askedRabbi}
                  </Text>
                )}
                {q.answer && (
                  <View style={{ marginTop: spacing.sm, padding: spacing.sm, backgroundColor: '#E9F4EB', borderRadius: radius.sm }}>
                    <Text style={[typography.body, { color: colors.textPrimary }]}>{q.answer}</Text>
                  </View>
                )}
                <View style={{ flexDirection: 'row-reverse', gap: spacing.sm, marginTop: spacing.md, flexWrap: 'wrap' }}>
                  {q.status === 'pending' && (
                    <Pressable onPress={() => changeStatus(q.id, 'asked')}><Text style={[typography.caption, { color: colors.primary }]}>סמן כנשאל</Text></Pressable>
                  )}
                  {q.status === 'asked' && (
                    <Pressable onPress={() => changeStatus(q.id, 'answered')}><Text style={[typography.caption, { color: colors.success }]}>סמן כנענה</Text></Pressable>
                  )}
                  {q.status !== 'archived' && (
                    <Pressable onPress={() => changeStatus(q.id, 'archived')}><Text style={[typography.caption, { color: colors.textMuted }]}>ארכיון</Text></Pressable>
                  )}
                  <Pressable onPress={() => del(q.id)}><Text style={[typography.caption, { color: colors.danger }]}>מחק</Text></Pressable>
                </View>
              </Card>
            ))
          )}
        </View>
        <View style={{ height: 40 }} />
      </KeyboardScroll>

      <Modal visible={showForm} animationType="slide">
        <SafeAreaView style={styles.safe} edges={['top']}>
          <View style={styles.topBar}>
            <Pressable onPress={() => setShowForm(false)} hitSlop={10}>
              <Text style={[typography.bodyBold, { color: colors.primary }]}>בטל</Text>
            </Pressable>
            <Pressable onPress={add} hitSlop={10}>
              <Text style={[typography.bodyBold, { color: colors.primary }]}>שמור</Text>
            </Pressable>
          </View>
          <KeyboardScroll contentContainerStyle={{ paddingBottom: spacing.xl }}>
            <ScreenHeader title={editingId ? 'עריכת שאלה' : 'שאלה חדשה'} />
            <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
              <Card>
                <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>השאלה:</Text>
                <TextInput value={form.question} onChangeText={(v) => setForm({ ...form, question: v })} multiline numberOfLines={4} style={[styles.input, { minHeight: 100, textAlignVertical: 'top' }]} />

                <Text style={[typography.bodyBold, { color: colors.textPrimary, marginTop: spacing.sm }]}>תחום:</Text>
                <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                  {TOPICS.map((t) => (
                    <Pressable key={t} onPress={() => setForm({ ...form, topic: t })} style={[styles.chip, form.topic === t && styles.chipActive]}>
                      <Text style={[typography.caption, { color: form.topic === t ? colors.textInverse : colors.textPrimary }]}>{t}</Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={[typography.bodyBold, { color: colors.textPrimary, marginTop: spacing.sm }]}>דחיפות:</Text>
                <View style={{ flexDirection: 'row-reverse', gap: 4, marginTop: 4 }}>
                  {(['low', 'normal', 'high'] as Priority[]).map((p) => (
                    <Pressable key={p} onPress={() => setForm({ ...form, priority: p })} style={[styles.chip, form.priority === p && styles.chipActive]}>
                      <Text style={[typography.caption, { color: form.priority === p ? colors.textInverse : colors.textPrimary }]}>
                        {p === 'low' ? 'נמוכה' : p === 'normal' ? 'רגילה' : 'דחוף'}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={[typography.bodyBold, { color: colors.textPrimary, marginTop: spacing.sm }]}>שם הרב (אם נשאל):</Text>
                <TextInput value={form.askedRabbi} onChangeText={(v) => setForm({ ...form, askedRabbi: v })} placeholder="לדוגמא: הרב פלוני" placeholderTextColor={colors.textMuted} style={styles.input} />

                <Text style={[typography.bodyBold, { color: colors.textPrimary, marginTop: spacing.sm }]}>תשובה (אם התקבלה):</Text>
                <TextInput value={form.answer} onChangeText={(v) => setForm({ ...form, answer: v })} multiline numberOfLines={4} style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]} />
              </Card>
            </View>
          </KeyboardScroll>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: { padding: spacing.lg, flexDirection: 'row-reverse', justifyContent: 'space-between' },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
  input: {
    marginTop: 4,
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    padding: spacing.md, fontSize: 16, color: colors.textPrimary,
    textAlign: 'right', backgroundColor: colors.bg,
  },
  chip: {
    paddingHorizontal: spacing.md, paddingVertical: 6,
    borderRadius: radius.full, backgroundColor: colors.surfaceAlt,
    borderWidth: 1, borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
});
