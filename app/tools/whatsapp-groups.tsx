import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, TextInput, Linking, Alert } from 'react-native';
import { KeyboardScroll } from '../../src/components/KeyboardScroll';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { Pill } from '../../src/components/Pill';
import { useStoredJSON } from '../../src/hooks/useStoredJSON';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

const KEY = '@yahadut/wa-groups';

type Group = { id: string; name: string; link: string; category: string; description?: string };

const CATEGORIES = ['תפילה', 'לימוד', 'הלכה', 'חברתי', 'שיעורים', 'אחר'];

export default function WhatsappGroupsScreen() {
  const router = useRouter();
  const [groups, setGroups] = useStoredJSON<Group[]>(KEY, []);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', link: '', category: 'תפילה', description: '' });

  function add() {
    if (!form.name.trim() || !form.link.trim()) { Alert.alert('חסר', 'יש למלא שם וקישור'); return; }
    if (!form.link.includes('chat.whatsapp.com')) { Alert.alert('שגיאה', 'הקישור חייב להיות קישור WhatsApp תקין'); return; }
    setGroups((arr) => [...arr, { id: String(Date.now()), ...form }]);
    setForm({ name: '', link: '', category: 'תפילה', description: '' });
    setShowForm(false);
  }

  function open(g: Group) {
    Linking.openURL(g.link).catch(() => Alert.alert('שגיאה', 'לא ניתן לפתוח את הקישור'));
  }

  function del(id: string) {
    setGroups((arr) => arr.filter((g) => g.id !== id));
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}><Text style={[typography.bodyBold, { color: colors.primary }]}>‹ חזרה</Text></Pressable>
        <Pressable onPress={() => setShowForm(!showForm)} hitSlop={10}><Text style={[typography.bodyBold, { color: colors.primary }]}>{showForm ? 'בטל' : '+ הוסף'}</Text></Pressable>
      </View>
      <KeyboardScroll contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <ScreenHeader title="קבוצות WhatsApp" subtitle="גישה מהירה לקבוצות לימוד והלכה" />

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          {showForm && (
            <Card>
              <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>שם הקבוצה:</Text>
              <TextInput value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} style={styles.input} />
              <Text style={[typography.bodyBold, { color: colors.textPrimary, marginTop: spacing.sm }]}>קטגוריה:</Text>
              <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                {CATEGORIES.map((c) => (
                  <Pressable key={c} onPress={() => setForm({ ...form, category: c })} style={[styles.chip, form.category === c && styles.chipActive]}>
                    <Text style={[typography.caption, { color: form.category === c ? colors.textInverse : colors.textPrimary }]}>{c}</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={[typography.bodyBold, { color: colors.textPrimary, marginTop: spacing.sm }]}>קישור הזמנה (https://chat.whatsapp.com/...):</Text>
              <TextInput value={form.link} onChangeText={(v) => setForm({ ...form, link: v })} placeholder="הדבק קישור הזמנה" placeholderTextColor={colors.textMuted} style={styles.input} autoCapitalize="none" />
              <Text style={[typography.bodyBold, { color: colors.textPrimary, marginTop: spacing.sm }]}>תיאור:</Text>
              <TextInput value={form.description} onChangeText={(v) => setForm({ ...form, description: v })} style={styles.input} />
              <View style={{ marginTop: spacing.md }}><Button label="הוסף" onPress={add} fullWidth /></View>
            </Card>
          )}

          {groups.length === 0 ? (
            <Card>
              <Text style={[typography.body, { color: colors.textSecondary }]}>
                שמור כאן קישורי הזמנה לקבוצות WhatsApp שאתה משתמש בהן הרבה. הקבוצות נשמרות באפליקציה לגישה מהירה.
              </Text>
            </Card>
          ) : (
            groups.map((g) => (
              <Card key={g.id} onPress={() => open(g)}>
                <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.md }}>
                  <Text style={{ fontSize: 32 }}>💬</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.h3, { color: colors.textPrimary }]}>{g.name}</Text>
                    <View style={{ flexDirection: 'row-reverse', gap: 4, marginTop: 4 }}>
                      <Pill label={g.category} tone="default" />
                    </View>
                    {g.description ? <Text style={[typography.small, { color: colors.textMuted, marginTop: 4 }]}>{g.description}</Text> : null}
                  </View>
                  <Pressable onPress={() => del(g.id)}><Text style={[typography.caption, { color: colors.danger }]}>הסר</Text></Pressable>
                </View>
              </Card>
            ))
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
