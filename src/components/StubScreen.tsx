import React from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from './ScreenHeader';
import { Card } from './Card';
import { colors, spacing } from '../theme/colors';
import { typography } from '../theme/typography';

type Props = {
  title: string;
  subtitle?: string;
  emoji?: string;
  description: string;
  bullets?: string[];
};

export function StubScreen({ title, subtitle, emoji, description, bullets }: Props) {
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
        <ScreenHeader title={title} subtitle={subtitle} />
        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          <Card variant="accent">
            <View style={{ alignItems: 'center', paddingVertical: spacing.lg }}>
              <Text style={{ fontSize: 64 }}>{emoji ?? '🚧'}</Text>
              <Text style={[typography.h2, { color: colors.primaryDark, marginTop: spacing.md, textAlign: 'center' }]}>
                בפיתוח
              </Text>
              <Text style={[typography.body, { color: colors.primaryDark, opacity: 0.85, marginTop: spacing.sm, textAlign: 'center' }]}>
                {description}
              </Text>
            </View>
          </Card>

          {bullets && bullets.length > 0 ? (
            <Card>
              <Text style={[typography.h3, { color: colors.textPrimary, marginBottom: spacing.sm }]}>
                מה צפוי בעדכון הבא:
              </Text>
              {bullets.map((b, i) => (
                <View key={i} style={{ flexDirection: 'row-reverse', alignItems: 'flex-start', gap: spacing.sm, paddingVertical: 4 }}>
                  <Text style={[typography.body, { color: colors.primary }]}>•</Text>
                  <Text style={[typography.body, { color: colors.textSecondary, flex: 1 }]}>{b}</Text>
                </View>
              ))}
            </Card>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: { padding: spacing.lg },
});
