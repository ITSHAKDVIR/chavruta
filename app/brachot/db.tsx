import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, TextInput } from 'react-native';
import { KeyboardScroll } from '../../src/components/KeyboardScroll';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { Pill } from '../../src/components/Pill';
import { BRACHOT_HANEHENIN, BRACHOT_HAREIYA, BrachaEntry } from '../../src/data/brachotDb';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

type Tab = 'nehenin' | 'reiya';

export default function BrachotDbScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('nehenin');
  const [search, setSearch] = useState('');

  const source = tab === 'nehenin' ? BRACHOT_HANEHENIN : BRACHOT_HAREIYA;
  const filtered = search.trim()
    ? source.filter((b) =>
        b.trigger.includes(search) ||
        b.category.includes(search) ||
        (b.examples ?? []).some((e) => e.includes(search)),
      )
    : source;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={[typography.bodyBold, { color: colors.primary }]}>‹ חזרה</Text>
        </Pressable>
      </View>
      <KeyboardScroll contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <ScreenHeader title="מאגר ברכות" subtitle="ברכות הנהנין וברכות הראייה" />

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          <View style={{ flexDirection: 'row-reverse', gap: spacing.sm }}>
            <Pressable onPress={() => setTab('nehenin')} style={[styles.tab, tab === 'nehenin' && styles.tabActive]}>
              <Text style={[typography.bodyBold, { color: tab === 'nehenin' ? colors.textInverse : colors.textPrimary }]}>
                הנהנין (אוכל)
              </Text>
            </Pressable>
            <Pressable onPress={() => setTab('reiya')} style={[styles.tab, tab === 'reiya' && styles.tabActive]}>
              <Text style={[typography.bodyBold, { color: tab === 'reiya' ? colors.textInverse : colors.textPrimary }]}>
                הראייה
              </Text>
            </Pressable>
          </View>

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="חיפוש..."
            placeholderTextColor={colors.textMuted}
            style={styles.search}
          />

          {filtered.map((b) => (
            <BrachaCard key={b.id} bracha={b} />
          ))}
        </View>

        <View style={{ height: 40 }} />
      </KeyboardScroll>
    </SafeAreaView>
  );
}

function BrachaCard({ bracha }: { bracha: BrachaEntry }) {
  return (
    <Card>
      <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm }}>
        <Pill label={bracha.category} tone="default" />
        <Text style={[typography.h3, { color: colors.textPrimary, flex: 1 }]}>{bracha.trigger}</Text>
      </View>
      {bracha.examples && bracha.examples.length > 0 && (
        <Text style={[typography.small, { color: colors.textMuted, marginTop: 4 }]}>
          לדוגמא: {bracha.examples.join(', ')}
        </Text>
      )}
      {bracha.before && (
        <View style={[styles.brachaBox, { backgroundColor: colors.surfaceAlt, marginTop: spacing.sm }]}>
          <Text style={[typography.caption, { color: colors.primary, marginBottom: 4 }]}>לפני:</Text>
          <Text style={[typography.sacred, { color: colors.textPrimary }]}>{bracha.before}</Text>
        </View>
      )}
      {bracha.after && (
        <View style={[styles.brachaBox, { backgroundColor: colors.surfaceAlt, marginTop: spacing.sm }]}>
          <Text style={[typography.caption, { color: colors.accent, marginBottom: 4 }]}>אחרי:</Text>
          <Text style={[typography.body, { color: colors.textPrimary }]}>{bracha.after}</Text>
        </View>
      )}
      {bracha.notes && (
        <Text style={[typography.small, { color: colors.textMuted, marginTop: spacing.sm, fontStyle: 'italic' }]}>
          * {bracha.notes}
        </Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: { padding: spacing.lg },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
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
  brachaBox: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
