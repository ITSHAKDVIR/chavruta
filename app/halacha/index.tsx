import React from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { Icon } from '../../src/components/Icon';
import { colors, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { HDate } from '@hebcal/core';
import { isShemita } from '../../src/data/hebcal';

type HalachaTool = {
  id: string;
  title: string;
  description: string;
  iconName: string; // Lucide icon name for consistency with rest of the app
  route: string;
};

const TOOLS: HalachaTool[] = [
  {
    id: 'trumot',
    title: 'הפרשת תרומות ומעשרות',
    description: 'נוסח הפרשה לפי סוג + סימולציה',
    iconName: 'wheat',
    route: '/halacha/trumot',
  },
  {
    id: 'challah',
    title: 'הפרשת חלה',
    description: 'נוסח מלא + שיעורים',
    iconName: 'wheat',
    route: '/halacha/challah',
  },
  {
    id: 'orla',
    title: 'מחשבון שנות ערלה',
    description: 'בדוק אם הפרי מותר באכילה',
    iconName: 'fruit',
    route: '/halacha/orla',
  },
  {
    id: 'shemita',
    title: 'שביעית',
    description: 'מועדי ביעור + הלכות',
    iconName: 'fruit',
    route: '/halacha/shemita',
  },
  {
    id: 'kilayim',
    title: 'כלאיים',
    description: 'טבלת אילן ומרחקים',
    iconName: 'wheat',
    route: '/halacha/kilayim',
  },
];

export default function HalachaIndex() {
  const router = useRouter();
  const year = new HDate(new Date()).getFullYear();
  const inShemita = isShemita(year);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={[typography.bodyBold, { color: colors.primary }]}>‹ חזרה</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <ScreenHeader
          title="כלי הלכה"
          subtitle="מצוות התלויות בארץ - בעידן המודרני"
        />

        {inShemita ? (
          <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.lg }}>
            <Card variant="accent">
              <Text style={[typography.h2, { color: colors.primaryDark }]}>🌳 שנת שמיטה</Text>
              <Text style={[typography.body, { color: colors.primaryDark, marginTop: 4, opacity: 0.85 }]}>
                שנת התשפ"ב היא שנת שמיטה. הצג מועדי ביעור וקדושת שביעית.
              </Text>
            </Card>
          </View>
        ) : null}

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          {TOOLS.map((tool) => (
            <Card key={tool.id} onPress={() => router.push(tool.route as any)}>
              <View style={styles.row}>
                <Icon name={tool.iconName as any} size={28} color={colors.primary} strokeWidth={1.5} />
                <View style={{ flex: 1 }}>
                  <Text style={[typography.h3, { color: colors.textPrimary }]}>{tool.title}</Text>
                  <Text style={[typography.small, { color: colors.textMuted, marginTop: 2 }]}>
                    {tool.description}
                  </Text>
                </View>
                <Text style={{ color: colors.textMuted, fontSize: 22 }}>‹</Text>
              </View>
            </Card>
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
  row: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.md },
});
