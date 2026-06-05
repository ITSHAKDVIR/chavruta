import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getChapterText, gematriaChapter } from '../../src/data/tehillim';
import { fetchSefariaText, cleanSefariaText } from '../../src/services/sefaria';
import { hebrewNumeral } from '../../src/data/hebrewNumbers';
import { Card } from '../../src/components/Card';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

const stripHTML = cleanSefariaText;

export default function TehillimChapter() {
  const { chapter } = useLocalSearchParams<{ chapter: string }>();
  const router = useRouter();
  const num = parseInt(String(chapter), 10);
  const local = getChapterText(num);
  const [remote, setRemote] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (local) return;
    setLoading(true);
    fetchSefariaText(`Psalms.${num}`)
      .then((t) => {
        if (t && t.heText.length > 0) setRemote(t.heText.map(stripHTML));
      })
      .finally(() => setLoading(false));
  }, [num, !!local]);

  const verses = local ? local.text : remote;
  const title = local ? local.title : `תהילים פרק ${gematriaChapter(num)}`;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={[typography.bodyBold, { color: colors.primary }]}>‹ חזרה</Text>
        </Pressable>
        <View style={{ flexDirection: 'row-reverse', gap: spacing.md }}>
          {num > 1 ? (
            <Pressable onPress={() => router.replace(`/tehillim/${num - 1}` as any)} hitSlop={10}>
              <Text style={[typography.bodyBold, { color: colors.primary }]}>הקודם ›</Text>
            </Pressable>
          ) : null}
          {num < 150 ? (
            <Pressable onPress={() => router.replace(`/tehillim/${num + 1}` as any)} hitSlop={10}>
              <Text style={[typography.bodyBold, { color: colors.primary }]}>‹ הבא</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        <View style={styles.headerWrap}>
          <Text style={[typography.caption, { color: colors.textMuted }]}>פרק {hebrewNumeral(num)}</Text>
          <Text style={[typography.display, { color: colors.textPrimary }]}>{title}</Text>
        </View>

        <View style={{ paddingHorizontal: spacing.lg }}>
          {loading && (
            <View style={{ padding: spacing.xl, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[typography.body, { color: colors.textMuted, marginTop: spacing.md }]}>טוען מ-Sefaria...</Text>
            </View>
          )}

          {verses && (
            <Card padding="xl">
              {verses.map((verse, i) => (
                <View key={i} style={styles.verse}>
                  <Text style={[typography.sacred, { color: colors.textPrimary, flex: 1 }]}>
                    <Text style={{ color: colors.accentDark, fontWeight: '700' }}>({hebrewNumeral(i + 1)}) </Text>
                    {verse}
                  </Text>
                </View>
              ))}
            </Card>
          )}

          {!loading && !verses && (
            <Card>
              <Text style={[typography.body, { color: colors.textMuted, textAlign: 'center' }]}>
                לא ניתן לטעון את הפרק. בדוק חיבור לאינטרנט.
              </Text>
            </Card>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  headerWrap: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  verse: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F2EDE0',
  },
});
