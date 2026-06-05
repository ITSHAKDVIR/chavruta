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

const KEY = '@yahadut/books-learned';

type Book = { id: string; name: string; type: string; startedDate: string; finishedDate?: string; siyumDate?: string; notes?: string };

const TYPES = ['מסכת', 'ספר', 'חומש', 'נביא', 'הלכה', 'מוסר', 'אגדה', 'אחר'];

export default function BooksLearnedScreen() {
  const router = useRouter();
  const [books, setBooks] = useStoredJSON<Book[]>(KEY, []);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'מסכת', startedDate: new Date().toISOString().slice(0, 10), finishedDate: '', notes: '' });

  function add() {
    if (!form.name.trim()) return;
    setBooks((arr) => [...arr, { id: String(Date.now()), ...form, finishedDate: form.finishedDate || undefined, notes: form.notes || undefined }]);
    setForm({ name: '', type: 'מסכת', startedDate: new Date().toISOString().slice(0, 10), finishedDate: '', notes: '' });
    setShowForm(false);
  }

  function markFinished(id: string) {
    const today = new Date().toISOString().slice(0, 10);
    setBooks((arr) => arr.map((b) => b.id === id ? { ...b, finishedDate: today, siyumDate: today } : b));
  }

  function del(id: string) {
    Alert.alert('מחיקה', 'למחוק?', [{ text: 'בטל', style: 'cancel' }, { text: 'מחק', style: 'destructive', onPress: () => setBooks((arr) => arr.filter((b) => b.id !== id)) }]);
  }

  const inProgress = books.filter((b) => !b.finishedDate);
  const finished = books.filter((b) => b.finishedDate);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}><Text style={[typography.bodyBold, { color: colors.primary }]}>‹ חזרה</Text></Pressable>
        <Pressable onPress={() => setShowForm(!showForm)} hitSlop={10}><Text style={[typography.bodyBold, { color: colors.primary }]}>{showForm ? 'בטל' : '+ ספר'}</Text></Pressable>
      </View>
      <KeyboardScroll contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <ScreenHeader title="ספרים שלמדתי" subtitle={`${inProgress.length} בלימוד · ${finished.length} סיומים`} />

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          {showForm && (
            <Card>
              <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>שם:</Text>
              <TextInput value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} placeholder="לדוגמא: ברכות" placeholderTextColor={colors.textMuted} style={styles.input} />
              <Text style={[typography.bodyBold, { color: colors.textPrimary, marginTop: spacing.sm }]}>סוג:</Text>
              <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                {TYPES.map((t) => (
                  <Pressable key={t} onPress={() => setForm({ ...form, type: t })} style={[styles.chip, form.type === t && styles.chipActive]}>
                    <Text style={[typography.caption, { color: form.type === t ? colors.textInverse : colors.textPrimary }]}>{t}</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={[typography.bodyBold, { color: colors.textPrimary, marginTop: spacing.sm }]}>תאריך התחלה:</Text>
              <TextInput value={form.startedDate} onChangeText={(v) => setForm({ ...form, startedDate: v })} style={styles.input} />
              <Text style={[typography.bodyBold, { color: colors.textPrimary, marginTop: spacing.sm }]}>תאריך סיום (אם כבר):</Text>
              <TextInput value={form.finishedDate} onChangeText={(v) => setForm({ ...form, finishedDate: v })} placeholder="או השאר ריק" placeholderTextColor={colors.textMuted} style={styles.input} />
              <View style={{ marginTop: spacing.md }}><Button label="הוסף" onPress={add} fullWidth /></View>
            </Card>
          )}

          {/* Empty state — when no books at all, render a prominent
              centered call-to-action so the screen doesn't look broken. */}
          {!showForm && inProgress.length === 0 && finished.length === 0 && (
            <View style={{ alignItems: 'center', paddingVertical: 60, gap: spacing.md }}>
              <Text style={{ fontSize: 60 }}>📚</Text>
              <Text style={[typography.h2, { color: colors.textPrimary, textAlign: 'center' }]}>
                עדיין לא הוספת ספרים
              </Text>
              <Text style={[typography.body, { color: colors.textMuted, textAlign: 'center', paddingHorizontal: spacing.lg }]}>
                התחל לעקוב אחרי הספרים שאתה לומד, ועם סיום הספר תקבל "סיום" מתועד.
              </Text>
              <View style={{ width: '70%', marginTop: spacing.md }}>
                <Button
                  label="+ הוסף ספר ראשון"
                  onPress={() => setShowForm(true)}
                  variant="primary"
                  fullWidth
                />
              </View>
            </View>
          )}

          {inProgress.length > 0 && (
            <>
              <Text style={[typography.h2, { color: colors.textPrimary }]}>בלימוד</Text>
              {inProgress.map((b) => (
                <Card key={b.id}>
                  <Text style={[typography.h3, { color: colors.textPrimary }]}>{b.name}</Text>
                  <Pill label={b.type} tone="default" />
                  <Text style={[typography.small, { color: colors.textMuted, marginTop: spacing.sm }]}>
                    התחלתי: {new HDate(new Date(b.startedDate)).renderGematriya()}
                  </Text>
                  <View style={{ flexDirection: 'row-reverse', gap: spacing.sm, marginTop: spacing.md }}>
                    <Button label="✓ סיימתי - סיום!" onPress={() => markFinished(b.id)} variant="primary" style={{ flex: 1 }} fullWidth />
                    <Pressable onPress={() => del(b.id)}><Text style={[typography.caption, { color: colors.danger }]}>הסר</Text></Pressable>
                  </View>
                </Card>
              ))}
            </>
          )}

          {finished.length > 0 && (
            <>
              <Text style={[typography.h2, { color: colors.textPrimary, marginTop: spacing.lg }]}>🎉 סיומים ({finished.length})</Text>
              {finished.map((b) => (
                <Card key={b.id} variant="accent">
                  <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm }}>
                    <Text style={{ fontSize: 24 }}>✓</Text>
                    <Text style={[typography.h3, { color: colors.primaryDark, flex: 1 }]}>{b.name}</Text>
                    <Pill label={b.type} tone="default" />
                  </View>
                  {b.siyumDate && (
                    <Text style={[typography.small, { color: colors.primaryDark, opacity: 0.85, marginTop: 4 }]}>
                      סיום: {new HDate(new Date(b.siyumDate)).renderGematriya()}
                    </Text>
                  )}
                </Card>
              ))}
            </>
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
});
