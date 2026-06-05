import React from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

const BRACHA = `בָּרוּךְ אַתָּה ה׳ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, אֲשֶׁר קִדְּשָׁנוּ בְּמִצְוֹתָיו וְצִוָּנוּ עַל מִצְוַת עֵרוּב.`;

const NUSACH = `בְּדֵין עֵרוּבָא יְהֵא שָׁרֵא לָנָא לְמֵיפֵא וּלְבַשּׁוּלֵי וּלְאַטְמוּנֵי וּלְאַדְלוּקֵי שְׁרָגָא וּלְמֶעֱבַד כָּל צָרְכָּנָא, מִיּוֹמָא טָבָא לְשַׁבַּתָּא, לָנוּ וּלְכָל יִשְׂרָאֵל הַדָּרִים בָּעִיר הַזֹּאת.`;

export default function EruvTavshilinScreen() {
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
        <ScreenHeader title="ערוב תבשילין" subtitle="כשיום טוב חל ביום שישי" />

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          <Card variant="accent">
            <Text style={[typography.body, { color: colors.primaryDark, opacity: 0.85 }]}>
              ערוב תבשילין נדרש כאשר <Text style={{ fontWeight: '700' }}>יום טוב חל ביום שישי</Text> (או יום טוב יומיים שמסתיים בשישי) - כדי שיהיה מותר להכין משבת בתוך היום טוב.{'\n\n'}
              עורכים אותו <Text style={{ fontWeight: '700' }}>בערב יום טוב (יום חמישי)</Text> לפני שקיעת החמה.
            </Text>
          </Card>

          <Card>
            <Text style={[typography.h3, { color: colors.textPrimary }]}>איך עושים?</Text>
            <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.sm }]}>
              1. <Text style={{ fontWeight: '700' }}>לוקחים</Text> פת (כשני זיתים) ותבשיל חשוב (כזית - בשר, ביצה, דג).{'\n'}
              2. <Text style={{ fontWeight: '700' }}>מניחים אותם</Text> במקום מסומן בערב יום טוב, לפני שקיעה.{'\n'}
              3. <Text style={{ fontWeight: '700' }}>מברכים</Text> את הברכה ואומרים את הנוסח.{'\n'}
              4. <Text style={{ fontWeight: '700' }}>נשמרים</Text> את הערוב עד שבת. בשבת ניתן לאכול את הפת בלחם משנה.
            </Text>
          </Card>

          <Card>
            <Text style={[typography.h3, { color: colors.textPrimary, marginBottom: spacing.sm }]}>ברכה</Text>
            <View style={[styles.brachaBox]}>
              <Text style={[typography.sacred, { color: colors.textPrimary }]}>{BRACHA}</Text>
            </View>
          </Card>

          <Card>
            <Text style={[typography.h3, { color: colors.textPrimary, marginBottom: spacing.sm }]}>הנוסח (אחרי הברכה)</Text>
            <View style={[styles.brachaBox]}>
              <Text style={[typography.sacred, { color: colors.textPrimary }]}>{NUSACH}</Text>
            </View>
            <Text style={[typography.small, { color: colors.textMuted, marginTop: spacing.sm }]}>
              תרגום: "בערוב הזה - מותר לנו לאפות ולבשל ולהטמין ולהדליק נר ולעשות כל צרכנו מיום טוב לשבת, לנו ולכל ישראל הגרים בעיר הזאת."
            </Text>
          </Card>

          <Card variant="accent">
            <Text style={[typography.bodyBold, { color: colors.primaryDark }]}>אם שכחתי?</Text>
            <Text style={[typography.body, { color: colors.primaryDark, opacity: 0.85, marginTop: spacing.sm }]}>
              מי שיש לו רב בעיר יכול לסמוך על ערוב הרב (אם הכוונה מראש כללה אותם).{'\n'}
              אחרת - אסור להכין משבת ביום טוב, ויש לסיים את כל ההכנות לפני יום טוב.
            </Text>
          </Card>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: { padding: spacing.lg },
  brachaBox: {
    padding: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
