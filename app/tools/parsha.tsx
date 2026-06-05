import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { SefariaReader } from '../../src/components/SefariaReader';
import { findNextShabbatParshah } from '../../src/data/hebcal';
import { useLocation } from '../../src/hooks/useLocation';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

/**
 * Each parsha is split into 7 aliyot. For now, the most common usage is reading the
 * full parsha sequentially. We pre-defined the START ref of each parsha; clicking
 * "aliyah N" loads that specific section.
 *
 * Parshas span across multiple chapters. The simplest approach: load the parsha
 * range as the user-known canonical reference (Sefaria knows the parsha boundaries).
 */
const PARSHA_REFS: Record<string, { full: string; first: string }> = {
  'בראשית': { full: 'Genesis.1.1-6.8', first: 'Genesis.1' },
  'נח': { full: 'Genesis.6.9-11.32', first: 'Genesis.6.9-31' },
  'לך לך': { full: 'Genesis.12.1-17.27', first: 'Genesis.12' },
  'וירא': { full: 'Genesis.18.1-22.24', first: 'Genesis.18' },
  'חיי שרה': { full: 'Genesis.23.1-25.18', first: 'Genesis.23' },
  'תולדות': { full: 'Genesis.25.19-28.9', first: 'Genesis.25.19-34' },
  'ויצא': { full: 'Genesis.28.10-32.3', first: 'Genesis.28.10-22' },
  'וישלח': { full: 'Genesis.32.4-36.43', first: 'Genesis.32.4-31' },
  'וישב': { full: 'Genesis.37.1-40.23', first: 'Genesis.37' },
  'מקץ': { full: 'Genesis.41.1-44.17', first: 'Genesis.41' },
  'ויגש': { full: 'Genesis.44.18-47.27', first: 'Genesis.44.18-34' },
  'ויחי': { full: 'Genesis.47.28-50.26', first: 'Genesis.47.28-31' },
  'שמות': { full: 'Exodus.1.1-6.1', first: 'Exodus.1' },
  'וארא': { full: 'Exodus.6.2-9.35', first: 'Exodus.6.2-13' },
  'בא': { full: 'Exodus.10.1-13.16', first: 'Exodus.10' },
  'בשלח': { full: 'Exodus.13.17-17.16', first: 'Exodus.13.17-22' },
  'יתרו': { full: 'Exodus.18.1-20.23', first: 'Exodus.18' },
  'משפטים': { full: 'Exodus.21.1-24.18', first: 'Exodus.21' },
  'תרומה': { full: 'Exodus.25.1-27.19', first: 'Exodus.25' },
  'תצוה': { full: 'Exodus.27.20-30.10', first: 'Exodus.27.20-28.43' },
  'כי תשא': { full: 'Exodus.30.11-34.35', first: 'Exodus.30.11-31.17' },
  'ויקהל': { full: 'Exodus.35.1-38.20', first: 'Exodus.35' },
  'פקודי': { full: 'Exodus.38.21-40.38', first: 'Exodus.38.21-39.21' },
  'ויקרא': { full: 'Leviticus.1.1-5.26', first: 'Leviticus.1' },
  'צו': { full: 'Leviticus.6.1-8.36', first: 'Leviticus.6' },
  'שמיני': { full: 'Leviticus.9.1-11.47', first: 'Leviticus.9' },
  'תזריע': { full: 'Leviticus.12.1-13.59', first: 'Leviticus.12' },
  'מצורע': { full: 'Leviticus.14.1-15.33', first: 'Leviticus.14' },
  'אחרי מות': { full: 'Leviticus.16.1-18.30', first: 'Leviticus.16' },
  'קדושים': { full: 'Leviticus.19.1-20.27', first: 'Leviticus.19' },
  'אמור': { full: 'Leviticus.21.1-24.23', first: 'Leviticus.21' },
  'בהר': { full: 'Leviticus.25.1-26.2', first: 'Leviticus.25' },
  'בחקתי': { full: 'Leviticus.26.3-27.34', first: 'Leviticus.26.3-46' },
  'במדבר': { full: 'Numbers.1.1-4.20', first: 'Numbers.1' },
  'נשא': { full: 'Numbers.4.21-7.89', first: 'Numbers.4.21-49' },
  'בהעלתך': { full: 'Numbers.8.1-12.16', first: 'Numbers.8' },
  'שלח': { full: 'Numbers.13.1-15.41', first: 'Numbers.13' },
  'קרח': { full: 'Numbers.16.1-18.32', first: 'Numbers.16' },
  'חקת': { full: 'Numbers.19.1-22.1', first: 'Numbers.19' },
  'בלק': { full: 'Numbers.22.2-25.9', first: 'Numbers.22.2-41' },
  'פינחס': { full: 'Numbers.25.10-30.1', first: 'Numbers.25.10-26.4' },
  'מטות': { full: 'Numbers.30.2-32.42', first: 'Numbers.30.2-31.54' },
  'מסעי': { full: 'Numbers.33.1-36.13', first: 'Numbers.33' },
  'דברים': { full: 'Deuteronomy.1.1-3.22', first: 'Deuteronomy.1' },
  'ואתחנן': { full: 'Deuteronomy.3.23-7.11', first: 'Deuteronomy.3.23-4.49' },
  'עקב': { full: 'Deuteronomy.7.12-11.25', first: 'Deuteronomy.7.12-8.20' },
  'ראה': { full: 'Deuteronomy.11.26-16.17', first: 'Deuteronomy.11.26-12.32' },
  'שופטים': { full: 'Deuteronomy.16.18-21.9', first: 'Deuteronomy.16.18-17.20' },
  'כי תצא': { full: 'Deuteronomy.21.10-25.19', first: 'Deuteronomy.21.10-22.29' },
  'כי תבוא': { full: 'Deuteronomy.26.1-29.8', first: 'Deuteronomy.26' },
  'נצבים': { full: 'Deuteronomy.29.9-30.20', first: 'Deuteronomy.29.9-30.20' },
  'וילך': { full: 'Deuteronomy.31.1-31.30', first: 'Deuteronomy.31' },
  'האזינו': { full: 'Deuteronomy.32.1-32.52', first: 'Deuteronomy.32' },
  'וזאת הברכה': { full: 'Deuteronomy.33.1-34.12', first: 'Deuteronomy.33' },
};

export default function ParshaScreen() {
  const router = useRouter();
  const { location } = useLocation();
  const inIsrael = location.countryCode === 'IL';
  const next = findNextShabbatParshah(new Date(), inIsrael);

  const [mode, setMode] = useState<'first' | 'full'>('first');

  const firstPart = next?.parshah.split(' - ')[0] ?? '';
  const refData = PARSHA_REFS[firstPart];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={[typography.bodyBold, { color: colors.primary }]}>‹ חזרה</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        <ScreenHeader title="פרשת השבוע" subtitle={next ? next.parshah : 'אין פרשה השבוע'} />

        {next && (
          <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
            <Card variant="primary">
              <Text style={[typography.h1, { color: colors.textPrimary }]}>{next.parshah}</Text>
              <Text style={[typography.body, { color: colors.textPrimary, opacity: 0.9, marginTop: 4 }]}>
                שבת {next.saturday.toLocaleDateString('he-IL', { day: 'numeric', month: 'long' })}
              </Text>
            </Card>

            {refData && (
              <>
                <View style={{ flexDirection: 'row-reverse', gap: spacing.sm }}>
                  <Pressable
                    onPress={() => setMode('first')}
                    style={[styles.btn, mode === 'first' && styles.btnActive]}
                  >
                    <Text style={[typography.bodyBold, { color: mode === 'first' ? colors.textInverse : colors.textPrimary }]}>
                      עליה ראשונה
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setMode('full')}
                    style={[styles.btn, mode === 'full' && styles.btnActive]}
                  >
                    <Text style={[typography.bodyBold, { color: mode === 'full' ? colors.textInverse : colors.textPrimary }]}>
                      פרשה מלאה
                    </Text>
                  </Pressable>
                </View>

                <SefariaReader
                  refs={mode === 'first' ? refData.first : refData.full}
                  showVerseNumbers
                  hideToggles
                  inIsrael={inIsrael}
                />
              </>
            )}

            {!refData && firstPart && (
              <Card variant="accent">
                <Text style={[typography.body, { color: colors.primaryDark }]}>
                  לא נמצאה הפניה לפרשה "{firstPart}"
                </Text>
              </Card>
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: { padding: spacing.lg },
  btn: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  btnActive: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
});
