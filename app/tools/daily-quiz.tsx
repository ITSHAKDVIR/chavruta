import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { Pill } from '../../src/components/Pill';
import { useStoredJSON } from '../../src/hooks/useStoredJSON';
import { getJSON } from '../../src/storage/storage';
import { findNextShabbatParshah } from '../../src/data/hebcal';
import { useLocation } from '../../src/hooks/useLocation';
import { hebrewDateInfo } from '../../src/data/hebcal';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

const KEY_SCORE = '@yahadut/quiz-score';
const KEY_DAILY = '@yahadut/quiz-daily';

type Quiz = { q: string; options: string[]; correctIdx: number; explanation: string };

// שאלות חידון לעבודה אמיתית בטקסט הלכתי / תלמודי. רמת קושי גבוהה - לתלמידי חכמים.
const FALLBACK_QUIZZES: Quiz[] = [
  // ====== הלכות שבת ======
  {
    q: 'מהי "מלאכת מחשבת" שאוסרת המשנה בשבת, ומה ההבדל ההלכתי שלה ממלאכה רגילה?',
    options: [
      'מלאכה שתכליתה מחושבת ומכוונת - שלא לשמה פטור (אבל אסור)',
      'מלאכה הנעשית במחשבה תחילה - אסורה רק במחשבה',
      'מלאכת אומן בלבד - לעם הארץ מותרת',
      'מלאכה שעניינה במחשבה לא במעשה',
    ],
    correctIdx: 0,
    explanation: 'מלאכת מחשבת אסרה תורה (שבת ע ע"ב). זה כולל כוונה לתכלית המלאכה. דבר שאינו מתכוון - פטור. מתעסק - פטור. ויש בזה נפקא מינה לדאורייתא/דרבנן.',
  },
  {
    q: 'הוצאה ממקום למקום בשבת - כמה תנאים נדרשים כדי שיהיה חיוב חטאת?',
    options: ['2 (עקירה והנחה)', '3 (עקירה, הולכה, הנחה)', '4 (עקירה, הולכה, רשות אחרת, הנחה)', '5 (כולל עקירת חפץ ועקירת גוף)'],
    correctIdx: 2,
    explanation: 'שבת ב ע"א - "ארבעה תנאים: עקירה מרשות, הולכה, רשות אחרת, הנחה". שאחד מהם חסר - פטור (אבל אסור מדרבנן).',
  },
  // ====== הלכות תפילה ======
  {
    q: 'לשיטת הרמב"ם תפילה היא חיוב מן התורה כל יום. לשיטת הרמב"ן - באיזה אופן?',
    options: [
      'תפילה דרבנן לגמרי',
      'תפילה דאורייתא רק בעת צרה, ומדרבנן תקנו כל יום',
      'תפילה דאורייתא, אבל ההלכה כרמב"ם',
      'תפילה דרבנן, אבל זמני התפילה דאורייתא',
    ],
    correctIdx: 1,
    explanation: 'מחלוקת ידועה בספר המצוות לרמב"ם (עשה ה) שתפילה דאורייתא, ובהשגות הרמב"ן שדאורייתא רק "ביום צרה". אנשי כנסת הגדולה תקנו את התפילות הקבועות.',
  },
  {
    q: '"שכח ולא אמר "ותן טל ומטר" בברכת השנים, מאיפה חוזר?',
    options: [
      'מתחיל מתחילת העמידה',
      'חוזר לברכת השנים אם נזכר לפני "שומע תפילה"',
      'משלים ב"שומע תפילה" אם עבר את ברכת השנים',
      'גם ב\' וגם ג\' - לפי איפה נזכר',
    ],
    correctIdx: 3,
    explanation: 'שו"ע או"ח קי"ז. לפני שעבר על ברכת השנים - חוזר לברכה. עבר אבל לא סיים שומע תפילה - אומר בשומע תפילה. סיים העמידה - חוזר לראש.',
  },
  // ====== הלכות מאכלים ======
  {
    q: 'בליעת איסור בכלי שני - האם בולעת?',
    options: [
      'לא בולעת לגמרי - מותר להכניס דבר חלבי לכלי שני בשרי נקי',
      'בולעת אבל פליטתה מועטה (חצי שיעור)',
      'נחלקו ראשונים - הרמב"ם בולעת, הראב"ד לא',
      'בולעת רק אם היד סולדת',
    ],
    correctIdx: 0,
    explanation: 'יו"ד ק"ה - "כלי שני אינו מבשל". לפי רוב הראשונים אין בליעה בכלי שני (חוץ ממאכל הרבה - "כלי ראשון"). ועל זה מבוסס היתר לערות חלב לתוך כוס תה בשרית.',
  },
  {
    q: 'דג שנמצא בו חתיכת בשר רחוקה ממנו - האם אסור באכילה עם חלב?',
    options: [
      'אסור - דג ובשר הם בעיה',
      'מותר - דג ובשר לא חוששים ב"דבר חריף" אבל במאכל רגיל מותר',
      'מותר - הבעיה רק בבישול יחד, לא ב"בלוע"',
      'תלוי באם המידה של החתיכה כזית',
    ],
    correctIdx: 2,
    explanation: 'יו"ד ק"ט. דג ובשר - הבעיה היא רק בבישול יחד או בנגיעה ישירה (סכנה לפי הפרי חדש), לא בבליעה ממרחק.',
  },
  // ====== עירובין ======
  {
    q: 'מהו "עירוב חצרות" ומהי תכליתו ההלכתית?',
    options: [
      'מעבר ענוי ביום הכיפורים',
      'כל הדיירים בחצר נחשבים כדיירי בית אחד לעניין הוצאה בשבת',
      'תקנה לאפשר תפילה בעשרה',
      'אחדות עם כל המשפחה לפני יום טוב',
    ],
    correctIdx: 1,
    explanation: 'או"ח שס"ה. כדי שמותר להוציא מבית לחצר משותפת בשבת, כל הדיירים מסכימים בלחם משותף שכל החצר היא "רשות אחת" - "עירוב חצרות".',
  },
  // ====== טוהר ======
  {
    q: 'אבן הסליקה ("שיש") על קבר - האם מטמאת באוהל?',
    options: [
      'מטמאת תמיד',
      'מטמאת רק אם יש בה דין "אבן הקשורה לאדם" - מחלוקת ראשונים',
      'לא מטמאת - היא חלק מהאדמה',
      'מטמאת רק אם מורידים את הקבר תחת השיש',
    ],
    correctIdx: 1,
    explanation: 'מחלוקת בדיני אוהל המת (אהלות פרק ב). למעשה נקטו - אבן הקבועה מעל קבר לא מטמאת באוהל, אבל אבן ארוכה שמכסה את הקבר - יש מטמאים.',
  },
  // ====== חזקה ======
  {
    q: 'מהי "חזקת מרא קמא" ובאיזה דין משתמשים בה?',
    options: [
      'המוחזק הראשון - הקרקע נחשבת שלו, גם אם השני טוען חזקה',
      'מי שאמר אינו רוצה - חזקה שלא יחזור בו',
      'חזקת כשרות לעדים',
      'חזקה שאדם נמצא במקום שהוחזק שם',
    ],
    correctIdx: 0,
    explanation: 'ב"ב כ"ח: "חזקת מרא קמא" - המוחזק הראשון (הבעלים המקוריים) נחשב כממונא דידיה. השני שטוען "באתי בחזקה" צריך להביא ראיה.',
  },
  // ====== מועדים ======
  {
    q: 'איזה דין שני ימים טובים של גלויות נוהג גם בארץ ישראל?',
    options: [
      'אף אחד - בארץ ישראל יום אחד',
      'ראש השנה - יומיים בא"י כי ספק עתיק',
      'שמיני עצרת ושמחת תורה - גם בא"י יומיים',
      'יום הכיפורים בלבד',
    ],
    correctIdx: 1,
    explanation: 'ביצה ד ע"ב. ראש השנה הוא ספק יום ההולדת של שני יומיים מעיקרא (לפי מצב הקידוש בזמן הסנהדרין), ולכן גם בא"י נוהג שני ימים. שאר חגים - יום אחד.',
  },
  // ====== מצוות ======
  {
    q: '"לאו שניתק לעשה" - מה הדין כאשר עבר על הלאו ולא קיים את העשה?',
    options: [
      'פטור מכלום',
      'חייב מלקות, וגם עליו לקיים את העשה',
      'חייב מלקות, ואינו יכול לקיים את העשה אחר כך',
      'אינו לוקה (כי ניתק לעשה), אבל חייב לקיים את העשה',
    ],
    correctIdx: 3,
    explanation: 'מכות י"ד-ט"ו. עיקרון "לאו שניתק לעשה אין לוקין עליו". דוגמא: "לא תקח האם על הבנים" - שילוח הקן. עבר ולקח - חייב לשלוח (העשה), ולא לוקה. אבל אם שחט - לוקה.',
  },
  {
    q: 'מצות פריה ורביה - לפי בית הלל - כמה ילדים?',
    options: ['בן ובת', 'שני בנים', 'שני בנים ושתי בנות', 'בן אחד'],
    correctIdx: 0,
    explanation: 'יבמות ס"א: "בית הלל אומרים זכר ונקבה" - יוצא ידי חובה בבן ובת. בית שמאי - שני זכרים.',
  },
  // ====== כתובות וגיטין ======
  {
    q: 'גט שזמנו מאוחר ("גט מאוחר") - מה דינו?',
    options: [
      'כשר',
      'פסול לגמרי',
      'מחלוקת אם פסול או רק "אינו ראוי לכתחילה"',
      'כשר, אבל הילדים שנולדו בינתיים ספק ממזרים',
    ],
    correctIdx: 3,
    explanation: 'גיטין י"ז. אם בעל גירש בכ\' ניסן וכתב בגט "ל\' ניסן" - הוא נחשב שגירשה בל\' ניסן. אם היו ילדים בינתיים, הם ספק ממזרים כי תיאורטית האם היתה נשואה אז.',
  },
  // ====== עוד מהלכות שבת ======
  {
    q: 'מהי "תולדה" של מלאכת שבת ובמה היא נבדלת מ"אב"?',
    options: [
      'תולדה - חצי שיעור של אב',
      'תולדה - מלאכה שדומה לאב במהותה ובתכליתה (אסורה מן התורה כמו אב)',
      'תולדה - אסורה מדרבנן',
      'תולדה - דורשת כוונה, אב לא',
    ],
    correctIdx: 1,
    explanation: 'משנה שבת ז ע"ב. ל"ט מלאכות הן אבות. תולדות הן מלאכות שדומות לאבות (אותו עיקר מעשה ותכלית). חיוב חטאת זהה. דוגמא: "סוחט פירות" - תולדה של "דש".',
  },
  // ====== כשרות ======
  {
    q: '"דבר חריף" בהלכות תערובות - מה מיוחד בו לעניין בליעה?',
    options: [
      'דבר חריף מעורר טעם, ולכן יש בליעה בלי חום',
      'דבר חריף הופך את הכלי לבן יומו אפילו אחרי 24 שעות',
      'דבר חריף יוצר טעם לפגם, ולכן פטור',
      'דבר חריף לא בולע',
    ],
    correctIdx: 0,
    explanation: 'יו"ד צ"ו. בצל, שום, צנון, לימון, פלפל חריף - מעוררים טעם (אפילו בלי חום). אם חתכו בסכין בשרי - מעבירים בליעה לדבר החריף, וצריך 60 כנגד.',
  },
];

export default function DailyQuizScreen() {
  const router = useRouter();
  const todayStr = new Date().toISOString().slice(0, 10);
  const [score, setScore] = useStoredJSON<{ total: number; correct: number; streak: number; lastDate: string }>(KEY_SCORE, { total: 0, correct: 0, streak: 0, lastDate: '' });
  const [daily, setDaily] = useStoredJSON<{ date: string; idx: number; answered: boolean; correct: boolean }>(KEY_DAILY, { date: '', idx: 0, answered: false, correct: false });
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    if (daily.date !== todayStr) {
      const seed = parseInt(todayStr.replace(/-/g, ''), 10);
      const idx = seed % FALLBACK_QUIZZES.length;
      setDaily({ date: todayStr, idx, answered: false, correct: false });
      setSelected(null);
    }
  }, [todayStr]);

  const q = FALLBACK_QUIZZES[daily.idx % FALLBACK_QUIZZES.length];

  function answer(idx: number) {
    if (daily.answered) return;
    setSelected(idx);
    const correct = idx === q.correctIdx;
    setDaily({ ...daily, answered: true, correct });

    const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
    const newStreak = score.lastDate === yesterday ? score.streak + 1 : 1;
    setScore({ total: score.total + 1, correct: score.correct + (correct ? 1 : 0), streak: newStreak, lastDate: todayStr });
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}><Text style={[typography.bodyBold, { color: colors.primary }]}>‹ חזרה</Text></Pressable>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <ScreenHeader title="חידון יומי" subtitle={hebrewDateInfo(new Date()).gematria} />

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          <View style={{ flexDirection: 'row-reverse', gap: spacing.sm }}>
            <View style={[styles.stat, { backgroundColor: colors.surface }]}>
              <Text style={[typography.caption, { color: colors.textMuted }]}>רצף</Text>
              <Text style={[typography.h2, { color: colors.primary }]}>{score.streak}</Text>
            </View>
            <View style={[styles.stat, { backgroundColor: colors.surface }]}>
              <Text style={[typography.caption, { color: colors.textMuted }]}>נכונות</Text>
              <Text style={[typography.h2, { color: colors.success }]}>{score.correct}/{score.total}</Text>
            </View>
            <View style={[styles.stat, { backgroundColor: colors.surface }]}>
              <Text style={[typography.caption, { color: colors.textMuted }]}>%</Text>
              <Text style={[typography.h2, { color: colors.primary }]}>{score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0}</Text>
            </View>
          </View>

          <Card variant="primary">
            <Text style={[typography.h2, { color: colors.textPrimary, lineHeight: 32 }]}>{q.q}</Text>
          </Card>

          {q.options.map((opt, i) => {
            const isCorrect = daily.answered && i === q.correctIdx;
            const isWrong = daily.answered && i === selected && i !== q.correctIdx;
            return (
              <Pressable key={i} onPress={() => answer(i)} disabled={daily.answered} style={[styles.opt, isCorrect && styles.optCorrect, isWrong && styles.optWrong]}>
                <Text style={[typography.body, { color: isCorrect || isWrong ? colors.textInverse : colors.textPrimary, fontWeight: '600' }]}>
                  {String.fromCharCode(0x05D0 + i)}. {opt}
                </Text>
                {isCorrect && <Text style={{ fontSize: 18 }}>✓</Text>}
                {isWrong && <Text style={{ fontSize: 18 }}>✗</Text>}
              </Pressable>
            );
          })}

          {daily.answered && (
            <Card variant="accent">
              <Text style={[typography.h3, { color: colors.primaryDark, marginBottom: spacing.sm }]}>{daily.correct ? '🎉 נכון!' : '💡 הסבר'}</Text>
              <Text style={[typography.body, { color: colors.primaryDark, opacity: 0.9 }]}>{q.explanation}</Text>
              <Text style={[typography.small, { color: colors.primaryDark, opacity: 0.7, marginTop: spacing.sm }]}>
                שאלה חדשה מחר בבוקר.
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
  topBar: { padding: spacing.lg },
  stat: { flex: 1, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  opt: {
    flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center',
    padding: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
  },
  optCorrect: { backgroundColor: colors.success, borderColor: colors.success },
  optWrong: { backgroundColor: colors.danger, borderColor: colors.danger },
});
