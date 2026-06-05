import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View, Pressable } from 'react-native';
import { KeyboardScroll } from '../../src/components/KeyboardScroll';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import {
  CATEGORY_EMOJI,
  CATEGORY_LABELS,
  HalachaCategory,
  HALACHA_INDEX,
  searchHalacha,
} from '../../src/data/halachaIndex';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

const CATEGORIES: (HalachaCategory | 'all')[] = [
  'all', 'shabbat', 'kashrut', 'moadim', 'tefilah', 'family', 'mitzvot-haaretz', 'aveilut', 'misc',
];

export default function HalachaSearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<HalachaCategory | 'all'>('all');

  const results = useMemo(() => {
    const base = query ? searchHalacha(query) : HALACHA_INDEX;
    return category === 'all' ? base : base.filter((t) => t.category === category);
  }, [query, category]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={[typography.bodyBold, { color: colors.primary }]}>‹ חזרה</Text>
        </Pressable>
      </View>

      <ScreenHeader title="חיפוש בהלכה" subtitle={`${HALACHA_INDEX.length} ערכים`} />

      <View style={{ paddingHorizontal: spacing.lg, gap: spacing.sm }}>
        <TextInput
          style={styles.search}
          value={query}
          onChangeText={setQuery}
          placeholder="חפש... (לדוגמה: מוקצה, בלעך, ברכת המזון)"
          placeholderTextColor={colors.textMuted}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
          {CATEGORIES.map((c) => (
            <Pressable
              key={c}
              onPress={() => setCategory(c)}
              style={[styles.catChip, category === c && styles.catChipActive]}
            >
              <Text
                style={[
                  typography.caption,
                  { color: category === c ? colors.textInverse : colors.textPrimary, fontWeight: '700' },
                ]}
              >
                {c === 'all' ? '🔍 הכל' : `${CATEGORY_EMOJI[c]} ${CATEGORY_LABELS[c]}`}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <KeyboardScroll contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing.sm, gap: spacing.sm }}>
        {results.length === 0 && (
          <Card variant="accent">
            <Text style={[typography.body, { color: colors.primaryDark }]}>לא נמצאו תוצאות.</Text>
          </Card>
        )}
        {results.map((t) => (
          <Card key={t.id}>
            <View style={{ flexDirection: 'row-reverse', gap: spacing.sm }}>
              <Text style={{ fontSize: 22 }}>{CATEGORY_EMOJI[t.category]}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[typography.h3, { color: colors.textPrimary }]}>{t.title}</Text>
                <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.xs }]}>
                  {t.summary}
                </Text>
                <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.xs, fontStyle: 'italic' }]}>
                  📖 {t.sources}
                </Text>
              </View>
            </View>
          </Card>
        ))}
      </KeyboardScroll>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: { padding: spacing.lg },
  search: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  catChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  catChipActive: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
});
