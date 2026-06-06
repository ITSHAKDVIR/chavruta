import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { BrandBar } from '../../src/components/BrandBar';
import { Card } from '../../src/components/Card';
import { Icon } from '../../src/components/Icon';
import { useLocation } from '../../src/hooks/useLocation';
import { getString, setString, Keys } from '../../src/storage/storage';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

const NUSACH_LABELS: Record<string, string> = {
  ashkenazi: 'אשכנז',
  sephardi: 'ספרד',
  'edot-mizrach': 'עדות מזרח',
  chabad: 'חב"ד',
  baladi: 'תימני בלדי',
};

type SettingsItem = {
  id: string;
  label: string;
  emoji: string;
  description?: string;
  value?: string;
  route?: string;
};

export default function MoreScreen() {
  const { location } = useLocation();
  const router = useRouter();
  const [nusach, setNusach] = useState<string>('ashkenazi');

  useEffect(() => {
    (async () => {
      const stored = await getString(Keys.nusach, 'ashkenazi');
      setNusach(stored);
    })();
  }, []);

  async function cycleNusach() {
    const order = ['ashkenazi', 'sephardi', 'edot-mizrach', 'chabad', 'baladi'];
    const next = order[(order.indexOf(nusach) + 1) % order.length];
    setNusach(next);
    await setString(Keys.nusach, next);
  }

  const items: (SettingsItem & { iconName: string })[] = [
    {
      id: 'location',
      label: 'מיקום',
      emoji: '📍',
      iconName: 'location',
      value: location.name,
      description: 'לחישוב זמני היום והלכה',
      route: '/settings/location',
    },
    {
      id: 'nusach',
      label: 'נוסח תפילה',
      emoji: '✦',
      iconName: 'star',
      value: NUSACH_LABELS[nusach] || nusach,
      description: 'אשכנז / ספרד / עדות מזרח / חב"ד',
    },
    {
      id: 'notifications',
      label: 'מרכז התראות',
      emoji: '🔔',
      iconName: 'bell',
      description: 'כל ההתראות במקום אחד - שבת, תפילות, לימוד, יארצייט, טהרה',
      route: '/settings/notifications',
    },
    {
      id: 'about',
      label: 'אודות',
      emoji: 'ℹ️',
      iconName: 'info',
      description: 'גרסה ופרטים',
    },
  ];

  function handleItemPress(item: SettingsItem) {
    if (item.id === 'nusach') {
      cycleNusach();
      return;
    }
    if (item.route) router.push(item.route as any);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <BrandBar />
      <ScrollView contentContainerStyle={styles.scroll}>
        <ScreenHeader title="הגדרות" subtitle="העדפות אישיות וטכניות" />

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          <Card variant="primary" onPress={() => router.push('/settings/location' as any)}>
            <Text style={[typography.small, { color: colors.textPrimary, opacity: 0.85 }]}>מיקום נוכחי</Text>
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <Icon name="location" size={22} color={colors.textPrimary} strokeWidth={1.7} />
              <Text style={[typography.h1, { color: colors.textPrimary }]}>{location.name}</Text>
            </View>
            <Text style={[typography.small, { color: colors.textPrimary, opacity: 0.8, marginTop: spacing.sm }]}>
              לחיצה לשינוי
            </Text>
          </Card>

          {items.map((item) => (
            <Card key={item.id} onPress={() => handleItemPress(item)}>
              <View style={styles.itemRow}>
                <Icon name={item.iconName as any} size={26} color={colors.primary} strokeWidth={1.5} />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row-reverse', alignItems: 'baseline', gap: spacing.sm, flexWrap: 'wrap' }}>
                    <Text style={[typography.h3, { color: colors.textPrimary }]}>{item.label}</Text>
                    {item.value && (
                      <Text style={[typography.body, { color: colors.primary }]}>· {item.value}</Text>
                    )}
                  </View>
                  {item.description ? (
                    <Text style={[typography.small, { color: colors.textMuted, marginTop: 2 }]}>
                      {item.description}
                    </Text>
                  ) : null}
                </View>
                <Text style={{ color: colors.textMuted, fontSize: 20 }}>‹</Text>
              </View>
            </Card>
          ))}

          <Text style={[typography.small, { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl }]}>
            חברותא · גרסה 1.0.0
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingBottom: spacing.xl },
  itemRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
  },
});
