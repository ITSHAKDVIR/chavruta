import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, Alert, Modal } from 'react-native';
import { KeyboardScroll } from '../../src/components/KeyboardScroll';
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

const KEY = '@yahadut/chiddushim';

type Chidush = {
  id: string;
  title: string;
  body: string;
  source: string;
  tags: string[];
  createdAt: number;
};

const COMMON_TAGS = ['חומש', 'גמרא', 'הלכה', 'מוסר', 'אגדה', 'פרשה', 'מועדים', 'תפילה'];

export default function ChiddushimScreen() {
  const router = useRouter();
  const [items, setItems] = useStoredJSON<Chidush[]>(KEY, []);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [source, setSource] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [search, setSearch] = useState('');

  function reset() {
    setTitle(''); setBody(''); setSource(''); setTags([]); setEditingId(null);
  }

  function openNew() {
    reset();
    setShowForm(true);
  }

  function openEdit(c: Chidush) {
    setTitle(c.title);
    setBody(c.body);
    setSource(c.source);
    setTags(c.tags);
    setEditingId(c.id);
    setShowForm(true);
  }

  function save() {
    if (!title.trim() || !body.trim()) {
      Alert.alert('שדות חסרים', 'יש למלא כותרת ותוכן.');
      return;
    }
    const entry: Chidush = {
      id: editingId ?? String(Date.now()),
      title: title.trim(),
      body: body.trim(),
      source: source.trim(),
      tags,
      createdAt: editingId ? items.find((x) => x.id === editingId)!.createdAt : Date.now(),
    };
    if (editingId) {
      setItems((arr) => arr.map((x) => (x.id === editingId ? entry : x)));
    } else {
      setItems((arr) => [entry, ...arr]);
    }
    setShowForm(false);
    reset();
  }

  function del(id: string) {
    Alert.alert('מחיקה', 'למחוק חידוש זה?', [
      { text: 'ביטול', style: 'cancel' },
      { text: 'מחק', style: 'destructive', onPress: () => setItems((arr) => arr.filter((x) => x.id !== id)) },
    ]);
  }

  function toggleTag(t: string) {
    setTags((arr) => (arr.includes(t) ? arr.filter((x) => x !== t) : [...arr, t]));
  }

  const filtered = search.trim()
    ? items.filter((c) => c.title.includes(search) || c.body.includes(search) || c.source.includes(search) || c.tags.some((t) => t.includes(search)))
    : items;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={[typography.bodyBold, { color: colors.primary }]}>‹ חזרה</Text>
        </Pressable>
        <Pressable onPress={openNew} hitSlop={10}>
          <Text style={[typography.bodyBold, { color: colors.primary }]}>+ חדש</Text>
        </Pressable>
      </View>

      <KeyboardScroll contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <ScreenHeader title="פנקס חידושים" subtitle={`${items.length} רשומות`} />

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          {items.length > 0 && (
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="חיפוש בחידושים..."
              placeholderTextColor={colors.textMuted}
              style={styles.search}
            />
          )}

          {items.length === 0 ? (
            <Card>
              <View style={{ alignItems: 'center', paddingVertical: spacing.xl }}>
                <Text style={{ fontSize: 56 }}>📖</Text>
                <Text style={[typography.h2, { color: colors.textPrimary, marginTop: spacing.md }]}>אין חידושים שמורים</Text>
                <Text style={[typography.body, { color: colors.textMuted, marginTop: spacing.sm, textAlign: 'center' }]}>
                  שמור חידושים, פירושים והערות מן הלימוד שלך.
                </Text>
                <View style={{ marginTop: spacing.lg }}>
                  <Button label="חידוש ראשון" onPress={openNew} />
                </View>
              </View>
            </Card>
          ) : filtered.length === 0 ? (
            <Card>
              <Text style={[typography.body, { color: colors.textMuted, textAlign: 'center' }]}>
                לא נמצאו תוצאות עבור "{search}"
              </Text>
            </Card>
          ) : (
            filtered.map((c) => (
              <Card key={c.id} onPress={() => openEdit(c)}>
                <Text style={[typography.h3, { color: colors.textPrimary }]}>{c.title}</Text>
                {c.source ? (
                  <Text style={[typography.small, { color: colors.primary, marginTop: 2 }]}>{c.source}</Text>
                ) : null}
                <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.sm }]} numberOfLines={4}>
                  {c.body}
                </Text>
                {c.tags.length > 0 && (
                  <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 4, marginTop: spacing.sm }}>
                    {c.tags.map((t) => (
                      <Pill key={t} label={t} tone="default" />
                    ))}
                  </View>
                )}
                <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', marginTop: spacing.sm }}>
                  <Text style={[typography.caption, { color: colors.textMuted }]}>
                    {hebrewDateInfo(new Date(c.createdAt)).gematria}
                  </Text>
                  <Pressable onPress={() => del(c.id)} hitSlop={6}>
                    <Text style={[typography.caption, { color: colors.danger }]}>מחק</Text>
                  </Pressable>
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
              <Text style={[typography.bodyBold, { color: colors.primary }]}>ביטול</Text>
            </Pressable>
            <Pressable onPress={save} hitSlop={10}>
              <Text style={[typography.bodyBold, { color: colors.primary }]}>שמור</Text>
            </Pressable>
          </View>
          <KeyboardScroll contentContainerStyle={{ paddingBottom: spacing.xl }}>
            <ScreenHeader title={editingId ? 'עריכת חידוש' : 'חידוש חדש'} />
            <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
              <Card>
                <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>כותרת:</Text>
                <TextInput value={title} onChangeText={setTitle} style={styles.input} />

                <Text style={[typography.bodyBold, { color: colors.textPrimary, marginTop: spacing.sm }]}>מקור:</Text>
                <TextInput
                  value={source}
                  onChangeText={setSource}
                  placeholder={'לדוגמא: בראשית א׳ א׳, רש״י'}
                  placeholderTextColor={colors.textMuted}
                  style={styles.input}
                />

                <Text style={[typography.bodyBold, { color: colors.textPrimary, marginTop: spacing.sm }]}>תוכן:</Text>
                <TextInput
                  value={body}
                  onChangeText={setBody}
                  multiline
                  numberOfLines={8}
                  style={[styles.input, { minHeight: 200, textAlignVertical: 'top' }]}
                />

                <Text style={[typography.bodyBold, { color: colors.textPrimary, marginTop: spacing.sm }]}>תיוג:</Text>
                <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                  {COMMON_TAGS.map((t) => (
                    <Pressable key={t} onPress={() => toggleTag(t)} style={[styles.tag, tags.includes(t) && styles.tagActive]}>
                      <Text style={[typography.caption, { color: tags.includes(t) ? colors.textInverse : colors.textPrimary }]}>{t}</Text>
                    </Pressable>
                  ))}
                </View>
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
  search: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 16,
    color: colors.textPrimary,
    textAlign: 'right',
  },
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
  tag: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagActive: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
});
