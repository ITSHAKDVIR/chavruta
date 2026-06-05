import React from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { PEREK_SHIRA } from '../../src/data/perekShira';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

export default function PerekShiraScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={[typography.bodyBold, { color: colors.primary }]}>‹ חזרה</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <ScreenHeader title="פרק שירה" subtitle="שירת הבריאה כולה" />

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.lg }}>
          {PEREK_SHIRA.map((section, i) => (
            <View key={i}>
              <Text style={[typography.h2, { color: colors.textPrimary, marginBottom: spacing.sm }]}>
                {section.title}
              </Text>
              <Card>
                {section.verses.map((v, j) => (
                  <View key={j} style={[styles.verse, j < section.verses.length - 1 && styles.verseBorder]}>
                    <Text style={[typography.bodyBold, { color: colors.primary }]}>{v.speaker}</Text>
                    <Text style={[typography.sacred, { color: colors.textPrimary, marginTop: 4 }]}>
                      {v.text}
                    </Text>
                    {v.source ? (
                      <Text style={[typography.caption, { color: colors.textMuted, marginTop: 4 }]}>
                        ({v.source})
                      </Text>
                    ) : null}
                  </View>
                ))}
              </Card>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: { padding: spacing.lg },
  verse: { paddingVertical: spacing.sm },
  verseBorder: { borderBottomWidth: 1, borderBottomColor: '#F2EDE0' },
});
