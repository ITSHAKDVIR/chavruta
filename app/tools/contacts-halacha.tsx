import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, TextInput, Alert, Linking } from 'react-native';
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

const KEY = '@yahadut/halacha-contacts';

type Role = 'rav' | 'rabbanit' | 'bodeket' | 'sofer' | 'mohel' | 'shoichet' | 'mashgiach' | 'kabran' | 'other';

type Contact = {
  id: string;
  name: string;
  role: Role;
  city?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  notes?: string;
  topics?: string[];
};

const ROLE_LABELS: Record<Role, { label: string; emoji: string }> = {
  rav: { label: 'רב', emoji: '👨‍🏫' },
  rabbanit: { label: 'רבנית', emoji: '👩‍🏫' },
  bodeket: { label: 'בודקת', emoji: '🕊️' },
  sofer: { label: 'סופר סת"ם', emoji: '✍️' },
  mohel: { label: 'מוהל', emoji: '🩺' },
  shoichet: { label: 'שוחט', emoji: '🔪' },
  mashgiach: { label: 'משגיח כשרות', emoji: '✓' },
  kabran: { label: 'חברה קדישא', emoji: '🕯️' },
  other: { label: 'אחר', emoji: '👤' },
};

const COMMON_TOPICS = ['הלכה כללית', 'נדה', 'כשרות', 'אבלות', 'נישואין', 'גרושין', 'גיור', 'שבת', 'מועדים'];

export default function ContactsHalachaScreen() {
  const router = useRouter();
  const [contacts, setContacts] = useStoredJSON<Contact[]>(KEY, []);
  const [filter, setFilter] = useState<Role | 'all'>('all');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Contact, 'id'>>({ name: '', role: 'rav' });
  const [topicInput, setTopicInput] = useState('');

  const filtered = contacts.filter((c) => {
    if (filter !== 'all' && c.role !== filter) return false;
    if (search && !c.name.includes(search) && !c.city?.includes(search)) return false;
    return true;
  });

  function reset() {
    setForm({ name: '', role: 'rav' });
    setTopicInput('');
    setEditingId(null);
  }

  function save() {
    if (!form.name.trim()) {
      Alert.alert('שדה חובה', 'יש למלא שם');
      return;
    }
    const entry: Contact = {
      ...form,
      id: editingId ?? String(Date.now()),
      name: form.name.trim(),
      city: form.city?.trim() || undefined,
      phone: form.phone?.trim() || undefined,
      whatsapp: form.whatsapp?.trim() || undefined,
      email: form.email?.trim() || undefined,
      notes: form.notes?.trim() || undefined,
    };
    setContacts((arr) => editingId ? arr.map((c) => (c.id === editingId ? entry : c)) : [...arr, entry]);
    reset();
    setShowForm(false);
  }

  function edit(c: Contact) {
    setForm(c);
    setEditingId(c.id);
    setShowForm(true);
  }

  function del(id: string) {
    Alert.alert('הסרה', 'להסיר איש קשר?', [
      { text: 'ביטול', style: 'cancel' },
      { text: 'הסר', style: 'destructive', onPress: () => setContacts((arr) => arr.filter((c) => c.id !== id)) },
    ]);
  }

  function addTopic() {
    if (!topicInput.trim()) return;
    setForm({ ...form, topics: [...(form.topics ?? []), topicInput.trim()] });
    setTopicInput('');
  }

  function call(phone: string) { Linking.openURL(`tel:${phone}`); }
  function whatsapp(p: string) {
    const phone = p.replace(/[^0-9+]/g, '');
    Linking.openURL(`https://wa.me/${phone}`);
  }
  function email(addr: string) { Linking.openURL(`mailto:${addr}`); }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={[typography.bodyBold, { color: colors.primary }]}>‹ חזרה</Text>
        </Pressable>
        <Pressable onPress={() => { reset(); setShowForm(!showForm); }} hitSlop={10}>
          <Text style={[typography.bodyBold, { color: colors.primary }]}>{showForm ? 'בטל' : '+ חדש'}</Text>
        </Pressable>
      </View>

      <KeyboardScroll contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <ScreenHeader title="אנשי קשר הלכתיים" subtitle={`${contacts.length} אנשי קשר`} />

        {showForm && (
          <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.md }}>
            <Card>
              <Label>שם:</Label>
              <Input value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} />

              <Label>תפקיד:</Label>
              <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                {Object.entries(ROLE_LABELS).map(([k, v]) => (
                  <Pressable key={k} onPress={() => setForm({ ...form, role: k as Role })} style={[styles.chip, form.role === k && styles.chipActive]}>
                    <Text style={{ fontSize: 14 }}>{v.emoji}</Text>
                    <Text style={[typography.caption, { color: form.role === k ? colors.textInverse : colors.textPrimary, marginRight: 4 }]}>
                      {v.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Label>עיר (אופציונלי):</Label>
              <Input value={form.city ?? ''} onChangeText={(v) => setForm({ ...form, city: v })} />

              <Label>טלפון:</Label>
              <Input value={form.phone ?? ''} onChangeText={(v) => setForm({ ...form, phone: v })} keyboardType="phone-pad" />

              <Label>WhatsApp (אם שונה מטלפון):</Label>
              <Input value={form.whatsapp ?? ''} onChangeText={(v) => setForm({ ...form, whatsapp: v })} keyboardType="phone-pad" />

              <Label>דוא"ל:</Label>
              <Input value={form.email ?? ''} onChangeText={(v) => setForm({ ...form, email: v })} keyboardType="email-address" />

              <Label>תחומי התמחות:</Label>
              <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                {(form.topics ?? []).map((t, i) => (
                  <Pressable key={i} onPress={() => setForm({ ...form, topics: (form.topics ?? []).filter((_, j) => j !== i) })}>
                    <Pill label={`${t} ✕`} tone="primary" />
                  </Pressable>
                ))}
              </View>
              <View style={{ flexDirection: 'row-reverse', gap: spacing.sm, marginTop: spacing.sm }}>
                <Input value={topicInput} onChangeText={setTopicInput} placeholder="הוסף תחום" style={{ flex: 1 }} />
                <Button label="+" onPress={addTopic} variant="secondary" />
              </View>
              <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 4, marginTop: spacing.sm }}>
                {COMMON_TOPICS.map((t) => (
                  <Pressable key={t} onPress={() => {
                    if (!(form.topics ?? []).includes(t)) {
                      setForm({ ...form, topics: [...(form.topics ?? []), t] });
                    }
                  }}>
                    <Pill label={t} tone="default" />
                  </Pressable>
                ))}
              </View>

              <Label>הערות:</Label>
              <Input value={form.notes ?? ''} onChangeText={(v) => setForm({ ...form, notes: v })} multiline numberOfLines={3} style={{ minHeight: 70, textAlignVertical: 'top' }} />

              <View style={{ marginTop: spacing.md }}>
                <Button label="שמור" onPress={save} fullWidth />
              </View>
            </Card>
          </View>
        )}

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          <View style={{ flexDirection: 'row-reverse', gap: spacing.sm, flexWrap: 'wrap' }}>
            <Pressable onPress={() => setFilter('all')} style={[styles.tab, filter === 'all' && styles.tabActive]}>
              <Text style={[typography.body, { color: filter === 'all' ? colors.textInverse : colors.textPrimary }]}>הכל</Text>
            </Pressable>
            {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
              <Pressable key={r} onPress={() => setFilter(r)} style={[styles.tab, filter === r && styles.tabActive]}>
                <Text style={{ fontSize: 14 }}>{ROLE_LABELS[r].emoji}</Text>
                <Text style={[typography.body, { color: filter === r ? colors.textInverse : colors.textPrimary, marginRight: 4 }]}>
                  {ROLE_LABELS[r].label}
                </Text>
              </Pressable>
            ))}
          </View>

          {contacts.length > 0 && (
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="חיפוש שם / עיר..."
              placeholderTextColor={colors.textMuted}
              style={styles.search}
            />
          )}

          {filtered.length === 0 ? (
            <Card>
              <View style={{ alignItems: 'center', paddingVertical: spacing.xl }}>
                <Text style={{ fontSize: 48 }}>📞</Text>
                <Text style={[typography.h3, { color: colors.textPrimary, marginTop: spacing.md }]}>
                  {contacts.length === 0 ? 'אין אנשי קשר' : 'לא נמצאו תוצאות'}
                </Text>
                {contacts.length === 0 && (
                  <View style={{ marginTop: spacing.lg }}>
                    <Button label="הוסף את הראשון" onPress={() => { reset(); setShowForm(true); }} />
                  </View>
                )}
              </View>
            </Card>
          ) : (
            filtered.map((c) => (
              <Card key={c.id}>
                <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.md }}>
                  <Text style={{ fontSize: 36 }}>{ROLE_LABELS[c.role].emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.h3, { color: colors.textPrimary }]}>{c.name}</Text>
                    <View style={{ flexDirection: 'row-reverse', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                      <Pill label={ROLE_LABELS[c.role].label} tone="default" />
                      {c.city ? <Pill label={`📍 ${c.city}`} tone="default" /> : null}
                    </View>
                  </View>
                </View>

                {(c.topics ?? []).length > 0 && (
                  <View style={{ flexDirection: 'row-reverse', gap: 4, marginTop: spacing.sm, flexWrap: 'wrap' }}>
                    {c.topics!.map((t, i) => <Pill key={i} label={t} tone="primary" />)}
                  </View>
                )}

                {c.notes ? (
                  <Text style={[typography.small, { color: colors.textSecondary, marginTop: spacing.sm, fontStyle: 'italic' }]}>
                    {c.notes}
                  </Text>
                ) : null}

                <View style={{ flexDirection: 'row-reverse', gap: spacing.sm, marginTop: spacing.md }}>
                  {c.phone ? <Button label="📞" onPress={() => call(c.phone!)} variant="primary" /> : null}
                  {c.whatsapp || c.phone ? <Button label="💬" onPress={() => whatsapp(c.whatsapp || c.phone!)} variant="secondary" /> : null}
                  {c.email ? <Button label="✉️" onPress={() => email(c.email!)} variant="secondary" /> : null}
                  <Pressable onPress={() => edit(c)} style={{ marginRight: 'auto', alignSelf: 'center' }}>
                    <Text style={[typography.caption, { color: colors.primary }]}>ערוך</Text>
                  </Pressable>
                  <Pressable onPress={() => del(c.id)} style={{ alignSelf: 'center' }}>
                    <Text style={[typography.caption, { color: colors.danger }]}>הסר</Text>
                  </Pressable>
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
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
  tab: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
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
});
