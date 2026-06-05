import React from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { HolidayCountdown } from '../../src/components/HolidayCountdown';
import { useLocation } from '../../src/hooks/useLocation';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

// Midrashim per Rabbi Dvir's review (comments 186/187) — copied verbatim from
// מכון התורה והארץ, סדר ט"ו בשבט: http://toraland.org.il/shvat15
const SEVEN_SPECIES = [
  {
    name: 'חיטה',
    emoji: '🌾',
    bracha: 'בורא מיני מזונות',
    verse: 'אֶרֶץ חִטָּה',
    midrash:
      `'בטנך ערמת חטים'. הסבירו חז"ל: והלא ערימות של פלפלים ושל אצטרובילין יפות מהן, ולמה נמשלו ישראל לחיטין? אלא יכול אדם לחיות בלא פלפלים ובלא אצטרובילין, ואי אפשר לעולם לחיות בלא חטים. וכשם שאי אפשר לעולם ללא חטים, כך אי אפשר לעולם בלא ישראל (שיר השירים רבה ז). אילן שאכל ממנו אדם הראשון (=עץ הדעת)... רבי יהודה אומר: חיטה הייתה, שאין התינוק יודע לקרות אבא ואמא עד שיטעום טעם דגן (ברכות מ ע"א).`,
  },
  {
    name: 'שעורה',
    emoji: '🌾',
    bracha: 'בורא מיני מזונות',
    verse: 'וּשְׂעֹרָה',
    midrash:
      `הרואה שעורים בחלום סרו עוונותיו, שנאמר: 'וסר עוונך וחטאתך תכופר' (ישעיהו ו,ז). אמר רבי זירא: לא עליתי מבבל עד שראיתי שעורים בחלום (ברכות נז.). המדרש מתאר את חשיבותם של השעורים המוקרבים בקרבן העומר: כשבא המן הרשע לקחת את מרדכי להרכיב אותו על הסוס ולקרא לפניו 'ככה ייעשה לאיש אשר המלך חפץ ביקרו', הוא בא לבית המדרש לחפש את מרדכי ומצא את התלמידים לומדים. שאל אותם: במה אתם עוסקים? אמרו לו: במצוות העומר. אמר להם: ממה הוא מזהב או מכסף? אמרו לו: משעורים. אמר: שעורים שלכם ניצחו את כל הכסף והזהב שנתתי לאחשורוש (מדרש רבה ויקרא כח).`,
  },
  {
    name: 'גפן (ענבים)',
    emoji: '🍇',
    bracha: 'בורא פרי הגפן',
    verse: 'וְגֶפֶן',
    midrash:
      `"יין ישמח לבב אנוש" (תהילים קד, טו), ומאידך "עץ הדעת גפן היה, שאין לך דבר שמביא יללה על האדם אלא יין, שנאמר (על נח) 'וישת מן היין וישכר'" (ברכות מ ע"א). למה נמשלו ישראל לגפן? אשכולות שבה אלו תלמידי חכמים, זמורות שבה אלו בעלי בתים, עלים שבה אלו עמי הארץ, קנוקנות שבה אלו ריקנים שבישראל, וכולם בגפן אחת. מה הטעם? יבקשו האשכולות (תלמידי חכמים) רחמים על העלים (עמי הארץ), שאלמלא העלים אין האשכולות מתקיימים (חולין צב ע"א). "גפן ממצרים תסיע" (תהילים פ,ט)... מה הגפן הזאת נשענת על גבי הקנה, כך הן ישראל, נשענים בזכות תורה שהיא נכתבת בקנה (ויקרא רבה לו).`,
  },
  {
    name: 'תאנה',
    emoji: '🍈',
    bracha: 'בורא פרי העץ',
    verse: 'וּתְאֵנָה',
    midrash:
      `"נוצר תאנה יאכל פריה" (משלי כז, יח). למה נמשלה תורה לתאנה? כיוון שרוב האילנות כגון הזית והגפן והתמר נלקטים כאחד, והתאנה נלקטת מעט מעט. כך התורה, היום לומד מעט ולמחר הרבה, לפי שאינה נלמדת לא בשנה ולא בשתים (במדבר רבה יב). התאנה אינה מבשילה באופן אחיד, ולכן האריה היא תהליך איטי "נלקטת מעט מעט", שנפרס על כמה חודשים. סבלנות, התמדה וחריצות הן תכונות נדרשות למגדלי התאנה. לימוד התורה גם הוא, לוקח זמן, ואינו יכול להיעשות בפעם אחת, אלא רק בהתמדה, קביעות ואורך רוח.`,
  },
  {
    name: 'רימון',
    emoji: '🍎',
    bracha: 'בורא פרי העץ',
    verse: 'וְרִמּוֹן',
    midrash:
      `"כפלח הרימון רקתך" (שיר השירים ד,ג) – אל תקרי "רקתך" אלא "ריקתך", אפילו ריקנים שבישראל מלאים מצוות כרימון (עירובין יט ע"א). הרימון הוא פרי שמחד חיצוניותו מסמלת יופי ושפע, ומאידך פנימיותו מרובה בגרגרים עסיסיים: "רבי מאיר רימון מצא, תוכו אכל, קליפתו זרק" (חגיגה טו ע"ב). חובה עלינו לזכור, שלמרות שיש חשיבות בעולמו של הקב"ה לתכונות החיצוניות שלנו, בתורה ישראל הדגש הוא דווקא על הפנימיות, "תוכו אכל".`,
  },
  {
    name: 'זית',
    emoji: '🫒',
    bracha: 'בורא פרי העץ',
    verse: 'אֶרֶץ זֵית שֶׁמֶן',
    midrash:
      `"זית רענן יפה פרי תואר קרא ה' שמך" (ירמיהו יא, טז). הזית הינו ירוק עד, אינו משיר את עליו, יכול לעמוד בתנאי יובש וידוע בשרידותו לאורך עשרות ומאות שנים. ישראל נמשלו לזית, שעומדים בגבורה בניסיונות הכליה של אויביהם, ויכולים להם: למה נמשלו ישראל לזית? מה זית אין עליו נושרים לא בימות החמה ולא בימות הגשמים – אף ישראל, אין להם בטלה עולמית לא בעולם הזה ולא בעולם הבא (ילקוט שמעוני ירמיהו רפט).`,
  },
  {
    name: 'תמר',
    emoji: '🌴',
    bracha: 'בורא פרי העץ',
    verse: 'וּדְבָשׁ',
    midrash:
      `למה נמשלו ישראל לתמר? מה תמרה זו אין בה פסולת, אלא תמרים לאכילה, לולבים להלל (ארבעת המינים בסוכות), חריות לסיכוך, סיבים לחבלים... כך הם ישראל, אין בהם פסולת, אלא: מהם בעלי מקרא, מהם בעלי משנה, מהם בעלי אגדה, מהם בעלי מצוות, מהם בעלי צדקות (בראשית רבה מא). גדולתם של ישראל, למרות שונותם זה מזה, היא לראות "כל אחד מעלת חברינו", לראות בכל יהודי את נקודת הטוב הטמונה בו. ראיה זו מגיעה מההבנה שכולנו מאוחדים ובעלי "לב אחד": כתמר, מה תמר זה אין לו אלא לב אחד (הגזע המרכזי צומח למעלה, ואינו מתפצל לענפים), אף ישראל אין להם אלא לב אחד לאביהם שבשמים (סוכה מה ע"ב).`,
  },
];

// The 15-fruit Tu BiShvat seder is divided into 3 groups corresponding to the 3 worlds (Kabbalah):
// 1. Klipah outside (peel inedible, inside eaten) - World of Asiyah
// 2. Klipah inside (pit/stone, outside eaten) - World of Yetzirah
// 3. Fully edible - World of Beriah
const FRUIT_GROUPS = [
  {
    id: 'asiyah',
    title: 'קבוצה 1 - קליפה בחוץ, פרי בפנים',
    world: 'עולם העשייה',
    description: 'פרי שאוכלים את הפנים ולא את הקליפה - מסמל את התכלית הנגלית והפעולה בעולם.',
    fruits: ['רימון', 'אגוזים', 'שקדים', 'בוטנים', 'תפוז / לימון'],
    cupColor: 'לבן בלבד (חזק)',
  },
  {
    id: 'yetzirah',
    title: 'קבוצה 2 - קליפה בפנים, פרי בחוץ',
    world: 'עולם היצירה',
    description: 'פרי שאוכלים את החוץ ובפנים יש גלעין/חרצן - מסמל את הסיבוב הפנימי של היצירה.',
    fruits: ['זית', 'תמר', 'חרוב', 'אפרסק', 'דובדבן'],
    cupColor: 'לבן עם מעט אדום',
  },
  {
    id: 'beriah',
    title: 'קבוצה 3 - נאכל כולו',
    world: 'עולם הבריאה',
    description: 'פרי שאוכלים בשלמותו - מסמל את הקבלה הזכה והשלמה.',
    fruits: ['תאנה', 'ענב', 'אגס', 'תפוח', 'חבוש'],
    cupColor: 'אדום עם מעט לבן',
  },
];

const FOURTH_CUP = `כוס רביעית: אדום מלא - מסמלת את עולם האצילות, הגאולה השלמה.`;

const TU_BISHVAT_KAVANAH = `יְהִי רָצוֹן מִלְּפָנֶיךָ ה' אֱלֹהֵינוּ וֵאלֹהֵי אֲבוֹתֵינוּ, שֶׁבְּכֹחַ סְגֻלַּת אֲכִילַת הַפֵּרוֹת שֶׁאָנוּ אוֹכְלִים וּמְבָרְכִים עֲלֵיהֶם עַתָּה, וְהַהוֹגִים בְּסוֹד שָׁרְשָׁם הָעֶלְיוֹן שֶׁהֵם תְּלוּיִם עָלָיו, יִתְמַלְּאוּ עִילוּי, וְעֵל יְדֵי זֶה יִתְבָּרְכוּ הַפֵּרוֹת בְּעוֹלָם הָאָרֶץ הַזֶּה, וּמַעֲשֵׂה יָדֵינוּ כּוֹנְנָה עָלֵינוּ.`;

export default function TuBishvatScreen() {
  const router = useRouter();
  const { location } = useLocation();
  const inIsrael = location.countryCode === 'IL';
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={[typography.bodyBold, { color: colors.primary }]}>‹ חזרה</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <ScreenHeader title={'ט"ו בשבט - ראש השנה לאילן'} subtitle={'סדר ט"ו בשבט + שבעת המינים'} />

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          <HolidayCountdown holiday="tu-bishvat" inIsrael={inIsrael} />

          <Card variant="primary">
            <Text style={[typography.h3, { color: colors.textPrimary }]}>סדר ט"ו בשבט</Text>
            <Text style={[typography.body, { color: colors.textPrimary, opacity: 0.9, marginTop: spacing.sm }]}>
              מנהג המקובלים מצפת (האר"י ז"ל): אוכלים 15 (או 30) פירות, חלוקים ל-3 קבוצות לפי טבעם הפנימי. שותים 4 כוסות יין (לבן → אדום, כסמל החורף → אביב).
            </Text>
          </Card>

          <Card>
            <Text style={[typography.h2, { color: colors.textPrimary }]}>שבעת המינים שנשתבחה בהם ארץ ישראל</Text>
            <Text style={[typography.small, { color: colors.textMuted, marginTop: 2 }]}>
              "אֶרֶץ חִטָּה וּשְׂעֹרָה וְגֶפֶן וּתְאֵנָה וְרִמּוֹן, אֶרֶץ זֵית שֶׁמֶן וּדְבָשׁ" (דברים ח, ח)
            </Text>
            <View style={{ marginTop: spacing.md, gap: spacing.md }}>
              {SEVEN_SPECIES.map((sp, i) => (
                <View key={i} style={styles.speciesBlock}>
                  <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm }}>
                    <Text style={{ fontSize: 28 }}>{sp.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>{sp.name}</Text>
                      <Text style={[typography.small, { color: colors.textMuted }]}>ברכה: {sp.bracha}</Text>
                    </View>
                    <Text style={[typography.sacred, { color: colors.primary }]}>{sp.verse}</Text>
                  </View>
                  <Text style={[typography.small, { color: colors.textSecondary, marginTop: spacing.sm, lineHeight: 20 }]}>
                    💡 {sp.midrash}
                  </Text>
                </View>
              ))}
            </View>
          </Card>

          <Card variant="accent">
            <Text style={[typography.bodyBold, { color: colors.primaryDark }]}>הקדמה לסדר</Text>
            <Text style={[typography.body, { color: colors.primaryDark, opacity: 0.85, marginTop: spacing.sm }]}>
              לפני האכילה אומרים את הכוונה הבאה:
            </Text>
            <View style={[styles.sacredBox, { marginTop: spacing.sm }]}>
              <Text style={[typography.sacred, { color: colors.primaryDark }]}>{TU_BISHVAT_KAVANAH}</Text>
            </View>
          </Card>

          {FRUIT_GROUPS.map((group, i) => (
            <Card key={group.id}>
              <Text style={[typography.bodyBold, { color: colors.primary }]}>{group.title}</Text>
              <Text style={[typography.small, { color: colors.textMuted, marginTop: 2 }]}>{group.world}</Text>
              <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.sm }]}>
                {group.description}
              </Text>
              <Text style={[typography.bodyBold, { color: colors.textPrimary, marginTop: spacing.md }]}>פירות לדוגמא:</Text>
              <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                {group.fruits.map((f) => (
                  <View key={f} style={styles.fruitPill}>
                    <Text style={[typography.small, { color: colors.textPrimary }]}>{f}</Text>
                  </View>
                ))}
              </View>
              <Text style={[typography.caption, { color: colors.primary, marginTop: spacing.md }]}>
                🍷 כוס {i + 1}: {group.cupColor}
              </Text>
            </Card>
          ))}

          <Card variant="accent">
            <Text style={[typography.bodyBold, { color: colors.primaryDark }]}>🍷 כוס רביעית</Text>
            <Text style={[typography.body, { color: colors.primaryDark, opacity: 0.85, marginTop: spacing.sm }]}>
              {FOURTH_CUP}
            </Text>
          </Card>

          <Card>
            <Text style={[typography.h3, { color: colors.textPrimary }]}>סדר ההלכה</Text>
            <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.sm }]}>
              ⊙ <Text style={{ fontWeight: '700' }}>על הראשון</Text> מברכים "בורא פרי העץ" / "בורא מיני מזונות" כראוי.{'\n'}
              ⊙ <Text style={{ fontWeight: '700' }}>מקדימים פירות שבעת המינים</Text> לפני שאר פירות.{'\n'}
              ⊙ <Text style={{ fontWeight: '700' }}>סדר עדיפות בשבעת המינים</Text>: זית (בערכים: זית→תמר→ענב→תאנה→רימון, על פי קרבת ההזכרה למילה "ארץ").{'\n'}
              ⊙ אם אוכלים פרי <Text style={{ fontWeight: '700' }}>חדש בעונה</Text> - מברכים גם "שהחיינו" לפני בורא פרי העץ.{'\n'}
              ⊙ אין אומרים תחנון ב-ט"ו בשבט.
            </Text>
          </Card>

          <Card variant="accent">
            <Text style={[typography.bodyBold, { color: colors.primaryDark }]}>מנהגים נוספים</Text>
            <Text style={[typography.body, { color: colors.primaryDark, opacity: 0.85, marginTop: spacing.sm }]}>
              ⊙ <Text style={{ fontWeight: '700' }}>קריאת פרי עץ הדר</Text> (פרשת בראשית, יחזקאל לא, תהילים) - בסעודת ט"ו בשבט.{'\n'}
              ⊙ <Text style={{ fontWeight: '700' }}>נטיעת עצים</Text> - מנהג שהתחדש בארץ ישראל.{'\n'}
              ⊙ <Text style={{ fontWeight: '700' }}>תפילה על אתרוג</Text> שיהיה ליום סוכות הבא.{'\n'}
              ⊙ <Text style={{ fontWeight: '700' }}>שירת הים</Text> - בקצת קהילות.
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
  speciesRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  speciesBlock: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  fruitPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sacredBox: {
    padding: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
