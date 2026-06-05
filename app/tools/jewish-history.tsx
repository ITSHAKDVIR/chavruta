import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HDate, months } from '@hebcal/core';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { historyForDate } from '../../src/data/jewishHistory';
import { hebrewNumeral, normalizeHebrewLabel } from '../../src/data/hebrewNumbers';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

export default function JewishHistoryScreen() {
  const router = useRouter();
  const [offset, setOffset] = useState(0);

  const date = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d;
  }, [offset]);

  const events = useMemo(() => historyForDate(date), [date]);
  const hd = useMemo(() => new HDate(date), [date]);
  const hebDateLabel = `${hebrewNumeral(hd.getDate())} ב${normalizeHebrewLabel(hd.render('he-x-NoNikud').split(' ')[1] ?? '')}`;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={[typography.bodyBold, { color: colors.primary }]}>‹ חזרה</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        <ScreenHeader title="היום בהיסטוריה" subtitle={hebDateLabel} />

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          <View style={{ flexDirection: 'row-reverse', gap: spacing.sm }}>
            <Button label="‹ אתמול" onPress={() => setOffset((o) => o - 1)} variant="secondary" style={{ flex: 1 }} />
            <Button label="היום" onPress={() => setOffset(0)} variant="primary" style={{ flex: 1 }} />
            <Button label="מחר ›" onPress={() => setOffset((o) => o + 1)} variant="secondary" style={{ flex: 1 }} />
          </View>

          {events.length === 0 ? (
            <Card variant="accent">
              <Text style={[typography.body, { color: colors.primaryDark }]}>
                לא תועד אירוע מיוחד בתאריך הזה.
              </Text>
            </Card>
          ) : (
            events.map((e, i) => (
              <Card key={i} variant={i === 0 ? 'primary' : 'default'}>
                <View style={{ flexDirection: 'row-reverse', gap: spacing.sm }}>
                  <Text style={{ fontSize: 24 }}>📜</Text>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        typography.body,
                        { color: i === 0 ? colors.textInverse : colors.textPrimary, lineHeight: 24 },
                      ]}
                    >
                      {e.event}
                    </Text>
                    {e.year && (
                      <Text
                        style={[
                          typography.caption,
                          {
                            color: i === 0 ? colors.textInverse : colors.textMuted,
                            opacity: 0.85,
                            marginTop: 4,
                          },
                        ]}
                      >
                        {e.year}
                      </Text>
                    )}
                  </View>
                </View>
              </Card>
            ))
          )}

          <Card variant="accent">
            <Text style={[typography.caption, { color: colors.primaryDark, fontStyle: 'italic' }]}>
              💡 בלחיצה על "מחר" או "אתמול" ניתן לראות אירועים מתאריכים סמוכים בלוח העברי.
            </Text>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: { padding: spacing.lg },
});
