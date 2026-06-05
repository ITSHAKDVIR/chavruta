import React, { useState, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { Pill } from '../../src/components/Pill';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

// טבלת הרחקות בין סוגי מינים בגינה ביתית.
// כללי-הלכה מבוססים על מסורת הפסיקה המקובלת:
//   • ירק ↔ ירק (שני מינים): 1.5 טפח (≈ 12 ס"מ) או היכר.
//   • ירק/קטנית/תבואה ↔ קטנית/תבואה אחרת: 6 טפחים (≈ 48 ס"מ).
//   • כל מין זרעי ↔ עץ פרי: מעיקר הדין אין צורך, ויש מחמירים 3 טפחים.
//   • גפן ↔ ירק/קטנית/תבואה: 6 טפחים מהגזע + העלים לא יאהילו על הזרעים.
//   • גפן ↔ אילן: אין חובת הרחקה.
//   • צמחי תבלין רב-שנתיים (רוזמרין, לואיזה, סלבייה) = דין אילן.
//   • צמחי תבלין חד-שנתיים שכן נחשבים ירק: בעיקר נענע, פטרוזיליה וכוסברה.
type Distance = {
  text: string;
  notes?: string;
};

type SpeciesPair = {
  a: string;
  b: string;
  emoji: string;
  distance: Distance;
};

const PAIRS: SpeciesPair[] = [
  // ירק <-> ירק (אותו מין)
  {
    a: 'ירק',
    b: 'ירק (אותו מין)',
    emoji: '🥬🥬',
    distance: { text: 'אין צורך בהרחקה - מותר זה לצד זה.', notes: 'שני זנים של אותו מין (למשל שני סוגי עגבניות) אינם כלאיים.' },
  },
  // ירק <-> ירק שונה
  {
    a: 'ירק',
    b: 'ירק שונה',
    emoji: '🥬🥕',
    distance: {
      text: '1.5 טפח (≈ 12 ס"מ) בין שורה לשורה, או היכר מובהק.',
      notes: 'אם יוצרים תלם או ערוגה נפרדת לכל מין - מותר. שני מינים בערוגה אחת ללא היכר - אסור.',
    },
  },
  // ירק <-> תבואה / קטניות
  {
    a: 'ירק',
    b: 'תבואה / קטניות',
    emoji: '🥬🌾',
    distance: {
      text: '6 טפחים (≈ 48 ס"מ) הרחקה.',
      notes: 'תבואה וקטניות יוצרים שדה נראה לעין שונה מירק - לכן צריך הרחקה גדולה יותר מבין שני מיני ירק.',
    },
  },
  // תבואה / קטניות <-> תבואה / קטניות שונות
  {
    a: 'תבואה / קטניות',
    b: 'תבואה / קטניות שונות',
    emoji: '🌾🫘',
    distance: {
      text: '6 טפחים (≈ 48 ס"מ) הרחקה.',
      notes: 'חיטה ושעורה, חיטה ועדשים וכדומה - המקרה הקלאסי של כלאי זרעים שבמשנה (כלאים א, א).',
    },
  },
  // זרעים <-> עץ פרי
  {
    a: 'ירק / תבואה / קטניות',
    b: 'עץ פרי',
    emoji: '🥬🍎',
    distance: {
      text: 'מעיקר הדין אין צורך בהרחקה. יש מחמירים 3 טפחים (≈ 24 ס"מ).',
      notes: 'מותר לזרוע ירק תחת/ליד עץ פרי - אין כאן כלאי הכרם (חל רק על גפן).',
    },
  },
  // גפן <-> ירק / תבואה / קטניות (כלאי הכרם מן התורה)
  {
    a: 'גפן',
    b: 'ירק / תבואה / קטניות',
    emoji: '🍇🥬',
    distance: {
      text: '6 טפחים מהגזע (≈ 48 ס"מ) - וגם לוודא שעלי הגפן לא יאהילו על הזרעים.',
      notes: '⚠ כלאי הכרם - אסור מן התורה ואסור בהנאה. אם העלים יאהילו על הזרעים גם בריחוק - עדיין נחשב כלאי הכרם.',
    },
  },
  // גפן <-> אילן
  {
    a: 'גפן',
    b: 'עץ פרי / אילן',
    emoji: '🍇🍎',
    distance: {
      text: 'אין חובת הרחקה. מותר זה לצד זה.',
      notes: 'הגפן עצמה נחשבת אילן, ובין שני אילנות אין דין כלאיים. רק זרעים תחת הגפן נאסרים.',
    },
  },
  // עץ פרי <-> עץ פרי
  {
    a: 'עץ פרי',
    b: 'עץ פרי אחר',
    emoji: '🍎🍐',
    distance: {
      text: 'אין הרחקה. מותר זה לצד זה.',
      notes: 'אבל הרכבת ענף ממין אחד על גזע ממין אחר (הרכבה) - אסורה מן התורה (כלאי אילן).',
    },
  },
];

// ====== מבחר מיני צמחים פופולריים + הקטגוריה ההלכתית שלהם ======
type Category = 'vegetable' | 'legume' | 'fruit-tree' | 'vine' | 'herb' | 'grain';

type SpeciesOption = {
  id: string;
  label: string;
  emoji: string;
  category: Category;
  /** "אותו מין" - שני זנים של אותו מין מותרים זה לצד זה. */
  speciesGroup?: string;
};

const SPECIES: SpeciesOption[] = [
  // ירקות
  { id: 'tomato', label: 'עגבניה', emoji: '🍅', category: 'vegetable', speciesGroup: 'tomato' },
  { id: 'cucumber', label: 'מלפפון', emoji: '🥒', category: 'vegetable', speciesGroup: 'cucumber' },
  { id: 'pepper', label: 'פלפל', emoji: '🫑', category: 'vegetable', speciesGroup: 'pepper' },
  { id: 'lettuce', label: 'חסה', emoji: '🥬', category: 'vegetable', speciesGroup: 'lettuce' },
  { id: 'cabbage', label: 'כרוב', emoji: '🥬', category: 'vegetable', speciesGroup: 'cabbage' },
  { id: 'eggplant', label: 'חציל', emoji: '🍆', category: 'vegetable', speciesGroup: 'eggplant' },
  { id: 'pumpkin', label: 'דלעת', emoji: '🎃', category: 'vegetable', speciesGroup: 'pumpkin' },
  { id: 'carrot', label: 'גזר', emoji: '🥕', category: 'vegetable', speciesGroup: 'carrot' },
  { id: 'onion', label: 'בצל', emoji: '🧅', category: 'vegetable', speciesGroup: 'onion' },
  { id: 'garlic', label: 'שום', emoji: '🧄', category: 'vegetable', speciesGroup: 'garlic' },
  { id: 'potato', label: 'תפוח אדמה', emoji: '🥔', category: 'vegetable', speciesGroup: 'potato' },
  // עשבי תיבול חד-שנתיים = ירק
  { id: 'parsley', label: 'פטרוזיליה', emoji: '🌿', category: 'vegetable', speciesGroup: 'parsley' },
  { id: 'cilantro', label: 'כוסברה', emoji: '🌿', category: 'vegetable', speciesGroup: 'cilantro' },
  { id: 'mint', label: 'נענע', emoji: '🌿', category: 'vegetable', speciesGroup: 'mint' },
  { id: 'dill', label: 'שמיר', emoji: '🌿', category: 'vegetable', speciesGroup: 'dill' },
  // עשבי תיבול רב-שנתיים = דין אילן
  { id: 'rosemary', label: 'רוזמרין', emoji: '🌿', category: 'fruit-tree', speciesGroup: 'rosemary' },
  { id: 'verbena', label: 'לואיזה', emoji: '🌿', category: 'fruit-tree', speciesGroup: 'verbena' },
  { id: 'sage', label: 'מרווה / סלבייה', emoji: '🌿', category: 'fruit-tree', speciesGroup: 'sage' },
  { id: 'oregano', label: 'אורגנו / זעתר', emoji: '🌿', category: 'fruit-tree', speciesGroup: 'oregano' },
  // קטניות
  { id: 'beans', label: 'שעועית', emoji: '🫘', category: 'legume', speciesGroup: 'beans' },
  { id: 'peas', label: 'אפונה', emoji: '🟢', category: 'legume', speciesGroup: 'peas' },
  { id: 'chickpeas', label: 'חומוס', emoji: '🫘', category: 'legume', speciesGroup: 'chickpeas' },
  { id: 'lentils', label: 'עדשים', emoji: '🫘', category: 'legume', speciesGroup: 'lentils' },
  { id: 'soy', label: 'סויה', emoji: '🫘', category: 'legume', speciesGroup: 'soy' },
  // עצי פרי
  { id: 'apple', label: 'תפוח', emoji: '🍎', category: 'fruit-tree', speciesGroup: 'apple' },
  { id: 'pear', label: 'אגס', emoji: '🍐', category: 'fruit-tree', speciesGroup: 'pear' },
  { id: 'pomegranate', label: 'רימון', emoji: '🍎', category: 'fruit-tree', speciesGroup: 'pomegranate' },
  { id: 'olive', label: 'זית', emoji: '🫒', category: 'fruit-tree', speciesGroup: 'olive' },
  { id: 'fig', label: 'תאנה', emoji: '🥝', category: 'fruit-tree', speciesGroup: 'fig' },
  // הדרים — כל אחד מין נפרד הלכתית
  { id: 'orange', label: 'תפוז', emoji: '🍊', category: 'fruit-tree', speciesGroup: 'orange' },
  { id: 'lemon', label: 'לימון', emoji: '🍋', category: 'fruit-tree', speciesGroup: 'lemon' },
  { id: 'esrog', label: 'אתרוג', emoji: '🍋', category: 'fruit-tree', speciesGroup: 'esrog' },
  { id: 'pomelo', label: 'פומלית/אשכולית', emoji: '🍊', category: 'fruit-tree', speciesGroup: 'pomelo' },
  { id: 'peach', label: 'אפרסק', emoji: '🍑', category: 'fruit-tree', speciesGroup: 'peach' },
  { id: 'plum', label: 'שזיף', emoji: '🍑', category: 'fruit-tree', speciesGroup: 'plum' },
  { id: 'apricot', label: 'משמש', emoji: '🍑', category: 'fruit-tree', speciesGroup: 'apricot' },
  { id: 'date', label: 'תמר', emoji: '🌴', category: 'fruit-tree', speciesGroup: 'date' },
  { id: 'almond', label: 'שקד', emoji: '🌰', category: 'fruit-tree', speciesGroup: 'almond' },
  // גפן
  { id: 'grape', label: 'גפן (ענבים)', emoji: '🍇', category: 'vine', speciesGroup: 'grape' },
  // דגן
  { id: 'wheat', label: 'חיטה', emoji: '🌾', category: 'grain', speciesGroup: 'wheat' },
  { id: 'barley', label: 'שעורה', emoji: '🌾', category: 'grain', speciesGroup: 'barley' },
];

type PairResult = {
  status: 'permitted' | 'minor-distance' | 'distance' | 'kerem' | 'forbidden-grafting';
  /** Hebrew title to display */
  title: string;
  /** Detailed explanation */
  detail: string;
  /** Severity color hint */
  severity: 'success' | 'warning' | 'danger';
};

/** הלכה: זוג מינים → תוצאה הלכתית. הסדר אינו משנה (a,b) ≡ (b,a). */
function resolvePair(a: SpeciesOption, b: SpeciesOption): PairResult {
  // אותו מין בדיוק - מותר תמיד
  if (a.speciesGroup && a.speciesGroup === b.speciesGroup) {
    return {
      status: 'permitted',
      title: '✓ מותר - אותו מין',
      detail: `${a.label} ו${b.label} הם זן של אותו מין. מותר לזרוע זה לצד זה ללא הרחקה.`,
      severity: 'success',
    };
  }

  const involvesVine = a.category === 'vine' || b.category === 'vine';
  const isSeedish = (c: Category) =>
    c === 'vegetable' || c === 'legume' || c === 'grain' || c === 'herb';

  // ===== גפן =====
  if (involvesVine) {
    const other = a.category === 'vine' ? b : a;
    // גפן ↔ ירק/קטנית/תבואה → כלאי הכרם מן התורה
    if (isSeedish(other.category)) {
      return {
        status: 'kerem',
        title: '⚠ כלאי הכרם - אסור מן התורה',
        detail: `הרחקה: 6 טפחים (≈ 48 ס"מ) מגזע הגפן + לוודא שעלי הגפן לא יאהילו על ה${other.label}. ${other.label === 'גפן (ענבים)' ? '' : `אם העלים יאהילו גם בריחוק כזה - עדיין נחשב כלאי הכרם.`} כלאי הכרם אסורים בהנאה.`,
        severity: 'danger',
      };
    }
    // גפן ↔ אילן → אין חובת הרחקה
    if (other.category === 'fruit-tree') {
      return {
        status: 'permitted',
        title: '✓ מותר - אין חובת הרחקה',
        detail: 'בין גפן לעץ פרי אחר אין דין כלאי הכרם. שתיהן אילן, ובין שני אילנות אין חובת הרחקה. רק זרעים תחת הגפן אסורים.',
        severity: 'success',
      };
    }
  }

  // ===== עץ פרי + עץ פרי =====
  if (a.category === 'fruit-tree' && b.category === 'fruit-tree') {
    return {
      status: 'forbidden-grafting',
      title: '✓ מותר זה לצד זה - אסור להרכיב',
      detail: `${a.label} ו${b.label} - מותר לנטוע זה לצד זה ללא הרחקה. אבל אסור מן התורה להרכיב ענף מאחד על גזע השני (כלאי אילן). שים לב: צמחי תבלין רב-שנתיים (רוזמרין, לואיזה וכד׳) נחשבים כאילן.`,
      severity: 'warning',
    };
  }

  // ===== זרעים ↔ עץ פרי =====
  // מעיקר הדין אין צורך, יש מחמירים 3 טפחים
  if (
    (isSeedish(a.category) && b.category === 'fruit-tree') ||
    (isSeedish(b.category) && a.category === 'fruit-tree')
  ) {
    return {
      status: 'permitted',
      title: '✓ מעיקר הדין מותר',
      detail: 'בין ירק/תבואה/קטנית לעץ פרי אין חובת הרחקה מעיקר הדין. יש מחמירים 3 טפחים (≈ 24 ס"מ). כלאי הכרם חל רק על גפן.',
      severity: 'success',
    };
  }

  // ===== שני מיני זרעים =====
  // לפי הכלל: ירק↔ירק = 1.5 טפח, שאר השילובים (ירק↔תבואה, ירק↔קטנית, קטנית↔קטנית, וכו׳) = 6 טפחים
  if (isSeedish(a.category) && isSeedish(b.category)) {
    const bothVeg = a.category === 'vegetable' && b.category === 'vegetable';
    if (bothVeg) {
      return {
        status: 'minor-distance',
        title: '⚠ הרחקה 1.5 טפח (או היכר)',
        detail: '1.5 טפח (≈ 12 ס"מ) בין שורה לשורה, או היכר מובהק (תלם, אבן, שביל). שני מינים שונים בערוגה אחת ללא היכר - אסור.',
        severity: 'warning',
      };
    }
    return {
      status: 'distance',
      title: '⚠ הרחקה 6 טפחים',
      detail: '6 טפחים (≈ 48 ס"מ) הרחקה. ירק עם תבואה/קטנית, או תבואה/קטנית שונים זה מזה (חיטה ושעורה וכד׳) - דורש הרחקה גדולה יותר מבין שני מיני ירק.',
      severity: 'warning',
    };
  }

  // ברירת מחדל - מותר
  return {
    status: 'permitted',
    title: '✓ אין דרישת הרחקה ידועה',
    detail: 'לפי הקטגוריות שבחרת לא קיימת דרישת הרחקה. במקרה של ספק - לעיין במדריך כושרות / מכון התורה והארץ.',
    severity: 'success',
  };
}

const HEKER_TYPES = [
  { name: 'תלם / חריץ', description: 'חריץ בקרקע בין הזרעים (לפחות 1.5 טפח רוחב, 1 טפח עומק).' },
  { name: 'אבן או לוח', description: 'הצבת מחיצה פיזית בין שני המינים.' },
  { name: 'שביל', description: 'שביל ברוחב לפחות 1.5 טפח עם רגלים דוושות.' },
  { name: 'מרחק 1.5 טפח', description: 'כשורה אחת מסתיימת, ולפני שמתחילים את הבאה — מרחק כזה מספיק.' },
];

export default function KilayimScreen() {
  const router = useRouter();
  const [speciesA, setSpeciesA] = useState<string | null>(null);
  const [speciesB, setSpeciesB] = useState<string | null>(null);

  const optA = useMemo(() => SPECIES.find((s) => s.id === speciesA) ?? null, [speciesA]);
  const optB = useMemo(() => SPECIES.find((s) => s.id === speciesB) ?? null, [speciesB]);
  const result = useMemo(() => (optA && optB ? resolvePair(optA, optB) : null), [optA, optB]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={[typography.bodyBold, { color: colors.primary }]}>‹ חזרה</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <ScreenHeader title="כלאיים - גינה ביתית" subtitle="הרחקות בין מינים" />

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          <Card variant="accent">
            <Text style={[typography.bodyBold, { color: colors.primaryDark }]}>חשוב לדעת</Text>
            <Text style={[typography.body, { color: colors.primaryDark, opacity: 0.9, marginTop: spacing.sm }]}>
              ⊙ כל הכללים כאן מתייחסים ל<Text style={{ fontWeight: '700' }}>גינה ביתית קטנה</Text> (פחות מבית סאה, ≈ 580 מ"ר).{'\n\n'}
              ⊙ לשדות חקלאיים יש כללים מורכבים יותר ויש לעיין במכון התורה והארץ או בכושרות.{'\n\n'}
              ⊙ הכללים בעברית של רוב הפוסקים. <Text style={{ fontWeight: '700' }}>גפן</Text> היא המקרה החמור ביותר — אסור מן התורה.
            </Text>
          </Card>

          <Card>
            <Text style={[typography.h3, { color: colors.textPrimary }]}>סוגי המינים</Text>
            <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
              <View style={styles.kindRow}>
                <Text style={{ fontSize: 24 }}>🥬</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>ירק</Text>
                  <Text style={[typography.small, { color: colors.textMuted }]}>חסה, עגבניה, מלפפון, פלפל, עלים</Text>
                </View>
              </View>
              <View style={styles.kindRow}>
                <Text style={{ fontSize: 24 }}>🫘</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>קטניות</Text>
                  <Text style={[typography.small, { color: colors.textMuted }]}>שעועית, אפונה, עדשים, חומוס, סויה</Text>
                </View>
              </View>
              <View style={styles.kindRow}>
                <Text style={{ fontSize: 24 }}>🌳</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>אילן (עץ פרי)</Text>
                  <Text style={[typography.small, { color: colors.textMuted }]}>תפוח, אגס, רימון, זית, תאנה, הדר</Text>
                </View>
              </View>
              <View style={styles.kindRow}>
                <Text style={{ fontSize: 24 }}>🍇</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>גפן</Text>
                  <Text style={[typography.small, { color: colors.textMuted }]}>כל זן של ענבים — דין מיוחד וחמור</Text>
                </View>
              </View>
            </View>
          </Card>

          {/* בוחר זוג מינים */}
          <Card variant="primary">
            <Text style={[typography.h3, { color: colors.textPrimary }]}>בדיקת זוג מינים</Text>
            <Text style={[typography.body, { color: colors.textPrimary, opacity: 0.9, marginTop: 4 }]}>
              בחר מה אתה רוצה לזרוע / לנטוע — נראה אם יש כלאיים והאם צריך הרחקה.
            </Text>
          </Card>

          <Card>
            <Text style={[typography.bodyBold, { color: colors.textPrimary, marginBottom: spacing.sm }]}>
              מין ראשון:
            </Text>
            <View style={{ flexDirection: 'row-reverse', gap: 6, flexWrap: 'wrap' }}>
              {SPECIES.map((s) => {
                const active = speciesA === s.id;
                return (
                  <Pressable
                    key={s.id}
                    onPress={() => setSpeciesA(active ? null : s.id)}
                    style={[styles.specChip, active && styles.specChipActive]}
                  >
                    <Text style={{ fontSize: 14 }}>{s.emoji}</Text>
                    <Text style={[typography.small, { color: active ? colors.textInverse : colors.textPrimary }]}>
                      {s.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Card>

          <Card>
            <Text style={[typography.bodyBold, { color: colors.textPrimary, marginBottom: spacing.sm }]}>
              מין שני:
            </Text>
            <View style={{ flexDirection: 'row-reverse', gap: 6, flexWrap: 'wrap' }}>
              {SPECIES.map((s) => {
                const active = speciesB === s.id;
                return (
                  <Pressable
                    key={s.id}
                    onPress={() => setSpeciesB(active ? null : s.id)}
                    style={[styles.specChip, active && styles.specChipActive]}
                  >
                    <Text style={{ fontSize: 14 }}>{s.emoji}</Text>
                    <Text style={[typography.small, { color: active ? colors.textInverse : colors.textPrimary }]}>
                      {s.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Card>

          {result && optA && optB && (
            <Card variant={
              result.severity === 'danger' ? 'default' :
              result.severity === 'warning' ? 'accent' : 'primary'
            }>
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
                <Text style={{ fontSize: 26 }}>{optA.emoji}</Text>
                <Text style={[typography.h3, {
                  color: result.severity === 'danger' ? colors.danger :
                         result.severity === 'warning' ? colors.primaryDark : colors.textInverse
                }]}>↔</Text>
                <Text style={{ fontSize: 26 }}>{optB.emoji}</Text>
              </View>
              <Text style={[typography.h2, {
                color: result.severity === 'danger' ? colors.danger :
                       result.severity === 'warning' ? colors.primaryDark : colors.textInverse
              }]}>
                {result.title}
              </Text>
              <Text style={[typography.body, {
                color: result.severity === 'danger' ? colors.textPrimary :
                       result.severity === 'warning' ? colors.primaryDark : colors.textInverse,
                opacity: 0.9,
                marginTop: spacing.sm,
              }]}>
                {result.detail}
              </Text>
            </Card>
          )}

          <Text style={[typography.h2, { color: colors.textPrimary, marginTop: spacing.md }]}>טבלת הרחקות כללית</Text>

          {PAIRS.map((pair, i) => {
            const isVine = pair.a.includes('גפן') || pair.b.includes('גפן');
            return (
              <Card key={i} variant={isVine ? 'accent' : 'default'}>
                <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.md }}>
                  <Text style={{ fontSize: 32 }}>{pair.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <Pill label={pair.a} tone="default" />
                      <Text style={[typography.bodyBold, { color: colors.textMuted }]}>↔</Text>
                      <Pill label={pair.b} tone="default" />
                      {isVine && <Pill label="⚠ מן התורה" tone="danger" />}
                    </View>
                    <Text style={[typography.body, { color: isVine ? colors.primaryDark : colors.textPrimary, marginTop: spacing.sm }]}>
                      {pair.distance.text}
                    </Text>
                    {pair.distance.notes && (
                      <Text style={[typography.small, { color: isVine ? colors.primaryDark : colors.textMuted, opacity: 0.85, marginTop: 4, fontStyle: 'italic' }]}>
                        💡 {pair.distance.notes}
                      </Text>
                    )}
                  </View>
                </View>
              </Card>
            );
          })}

          <Card>
            <Text style={[typography.h3, { color: colors.textPrimary, marginBottom: spacing.sm }]}>סוגי "היכר"</Text>
            <Text style={[typography.small, { color: colors.textMuted, marginBottom: spacing.md }]}>
              להבדיל בין שני מינים בגינה קטנה אפשר על ידי אחד מאלה:
            </Text>
            <View style={{ gap: spacing.sm }}>
              {HEKER_TYPES.map((h) => (
                <View key={h.name} style={styles.kindRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>{h.name}</Text>
                    <Text style={[typography.small, { color: colors.textMuted, marginTop: 2 }]}>{h.description}</Text>
                  </View>
                </View>
              ))}
            </View>
          </Card>

          <Card variant="accent">
            <Text style={[typography.bodyBold, { color: colors.primaryDark }]}>איסור נוסף - הרכבה</Text>
            <Text style={[typography.body, { color: colors.primaryDark, opacity: 0.85, marginTop: spacing.sm }]}>
              גם בגינה קטנה - <Text style={{ fontWeight: '700' }}>אסור להרכיב</Text> ענף ממין אחד על גזע ממין אחר (לדוגמא: ענף תפוח על גזע אגס). זה איסור התורה של כלאי אילן.
              {'\n\n'}
              גם <Text style={{ fontWeight: '700' }}>קניית עץ מורכב</Text> שלא ניתן לזיהוי - יש מחמירים שלא להחזיק אותו.
            </Text>
          </Card>

          <Card>
            <Text style={[typography.h3, { color: colors.textPrimary }]}>מקורות</Text>
            <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.sm }]}>
              ⊙ "שָׂדְךָ לֹא תִזְרַע כִּלְאָיִם" (ויקרא יט, יט){'\n'}
              ⊙ "לֹא תִזְרַע כַּרְמְךָ כִּלְאָיִם" (דברים כב, ט){'\n\n'}
              לפסיקה מעשית בגינה ובחקלאות - מכון התורה והארץ, מכון כושרות, פניני הלכה.
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
  kindRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
  },
  specChip: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  specChipActive: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
});
