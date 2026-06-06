import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { getString, setString, Keys } from '../../src/storage/storage';
import { getNusachTree, slugify, Nusach, NUSACH_LABEL, NUSACH_KEYS, SiddurNode } from '../../src/data/siddurTree';
import { isSectionRelevantToday } from '../../src/data/siddurRelevance';
import { useLocation } from '../../src/hooks/useLocation';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

/** Quick-access in-app tools/texts.
 *  Organized into groups: ברכות, חגים, אבילות, ועוד — to surface tools the
 *  user would otherwise miss while browsing the siddur tree. */
const QUICK_LINKS: { id: string; emoji: string; title: string; subtitle: string; route: string }[] = [
  // ברכות
  { id: 'birkat-hamazon', emoji: '🍞', title: 'ברכת המזון המלאה', subtitle: 'מנוקדת + הוספות לשבת, חג וברית', route: '/tfilot/birkat-hamazon-short' },
  { id: 'brachot', emoji: '🌳', title: 'ברכות הראייה והנהנין', subtitle: 'ברכת הים, אילנות, חמה, לבנה', route: '/brachot' },
  { id: 'hundred-brachot', emoji: '💯', title: '100 ברכות ביום', subtitle: 'מונה ברכות + תזכורות', route: '/tools/hundred-brachot' },
  // חגים
  { id: 'arba-minim', emoji: '🌿', title: 'ארבעת המינים', subtitle: 'קריטריונים + נטילה — לסוכות', route: '/tools/arba-minim' },
  { id: 'chanukah', emoji: '🕎', title: 'חנוכה', subtitle: 'הדלקה + ברכות + הנוסחאות', route: '/tools/chanukah' },
  { id: 'purim', emoji: '🎭', title: 'פורים', subtitle: 'מגילה + מתנות לאביונים + סדר היום', route: '/tools/purim' },
  // קדיש ואבילות
  { id: 'aveilus', emoji: '🕯', title: 'אבילות וקדיש', subtitle: 'מעקב + סדר הקדיש', route: '/tools/aveilus' },
  { id: 'yahrtzeit', emoji: '🕯', title: 'יארצייט', subtitle: 'תזכורות + תפילות', route: '/tools/yahrzeit' },
  // ועוד
  { id: 'tfilot', emoji: '📿', title: 'תפילות יומיות (אופליין)', subtitle: 'שמע, ברה"מ, תפילת הדרך, ק"ש על המיטה', route: '/tfilot' },
  { id: 'tehillim', emoji: '📜', title: 'תהילים', subtitle: 'כל הספר + פרק יומי', route: '/tehillim' },
  { id: 'tefila-today', emoji: '📿', title: 'מה מוסיפים בתפילה היום', subtitle: 'יעלה ויבוא, על הניסים, עננו...', route: '/tools/tefila-today' },
  { id: 'compass', emoji: '🧭', title: 'מצפן תפילה', subtitle: 'כיוון לירושלים', route: '/tools/compass' },
];

export default function SidurIndex() {
  const router = useRouter();
  const { location } = useLocation();
  const inIsrael = location.countryCode === 'IL';
  const [nusach, setNusachState] = useState<Nusach>('ashkenazi');
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    (async () => {
      const stored = await getString(Keys.nusach, 'ashkenazi');
      if ((NUSACH_KEYS as string[]).includes(stored)) {
        setNusachState(stored as Nusach);
      }
    })();
  }, []);

  async function setNusach(n: Nusach) {
    setNusachState(n);
    await setString(Keys.nusach, n);
  }

  function openSection(slug: string) {
    router.push(`/tfilon/read?nusach=${nusach}&path=${encodeURIComponent(slug)}` as any);
  }

  const allTop = getNusachTree(nusach);
  const now = new Date();
  const top = showAll
    ? allTop
    : allTop.filter((n: SiddurNode) => isSectionRelevantToday(n.en, now, inIsrael));
  const hiddenCount = allTop.length - top.length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={[typography.bodyBold, { color: colors.primary }]}>‹ חזרה</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <ScreenHeader title="סידור תפילה" subtitle={`נוסח ${NUSACH_LABEL[nusach]} - מובנה באפליקציה`} />

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          {/* בחירת נוסח */}
          <Card>
            <Text style={[typography.bodyBold, { color: colors.textPrimary, marginBottom: spacing.sm }]}>
              נוסח התפילה שלך:
            </Text>
            <View style={{ flexDirection: 'row-reverse', gap: spacing.sm, flexWrap: 'wrap' }}>
              {(Object.keys(NUSACH_LABEL) as Nusach[]).map((n) => (
                <Pressable
                  key={n}
                  onPress={() => setNusach(n)}
                  style={[styles.nusachBtn, nusach === n && styles.nusachBtnActive]}
                >
                  <Text
                    style={[
                      typography.bodyBold,
                      { color: nusach === n ? colors.textInverse : colors.textPrimary },
                    ]}
                  >
                    {NUSACH_LABEL[n]}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm }]}>
              הנוסח נשמר בכל האפליקציה.
            </Text>
          </Card>

          {/* תוכן הסידור */}
          {allTop.length === 0 ? (
            <Card variant="accent">
              <Text style={[typography.body, { color: colors.primaryDark }]}>
                אין סידור זמין בנוסח זה.
              </Text>
            </Card>
          ) : (
            <>
              <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm }}>
                <Text style={[typography.h2, { color: colors.textPrimary }]}>
                  📿 תוכן הסידור
                </Text>
                {hiddenCount > 0 && (
                  <Pressable onPress={() => setShowAll(!showAll)} hitSlop={8}>
                    <Text style={[typography.small, { color: colors.primary }]}>
                      {showAll ? '◀ הסתר לא רלוונטי' : `הצג הכל (+${hiddenCount}) ▶`}
                    </Text>
                  </Pressable>
                )}
              </View>
              {!showAll && hiddenCount > 0 && (
                <Text style={[typography.caption, { color: colors.textMuted, marginTop: -spacing.xs }]}>
                  מוצגים רק חלקים רלוונטיים להיום ({top.length} מתוך {allTop.length}).
                </Text>
              )}
              {top.map((node, i) => (
                <Card key={`${node.en}-${i}`} onPress={() => openSection(slugify(node.en))}>
                  <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.md }}>
                    <Text style={{ fontSize: 28 }}>{emojiFor(node.en)}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[typography.h3, { color: colors.textPrimary }]}>
                        {node.he || node.en}
                      </Text>
                      {node.children && node.children.length > 0 && (
                        <Text style={[typography.small, { color: colors.textMuted, marginTop: 2 }]}>
                          {node.children.length} חלקים
                        </Text>
                      )}
                    </View>
                    <Text style={{ color: colors.textMuted, fontSize: 22 }}>‹</Text>
                  </View>
                </Card>
              ))}
            </>
          )}

          {/* קישורים מהירים */}
          <Text style={[typography.h2, { color: colors.textPrimary, marginTop: spacing.sm }]}>
            ⚡ גישה מהירה
          </Text>
          {QUICK_LINKS.map((q) => (
            <Card key={q.id} onPress={() => router.push(q.route as any)}>
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.md }}>
                <Text style={{ fontSize: 26 }}>{q.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.h3, { color: colors.textPrimary }]}>{q.title}</Text>
                  <Text style={[typography.small, { color: colors.textMuted, marginTop: 2 }]}>{q.subtitle}</Text>
                </View>
                <Text style={{ color: colors.textMuted, fontSize: 22 }}>‹</Text>
              </View>
            </Card>
          ))}

          <Card variant="accent">
            <Text style={[typography.caption, { color: colors.primaryDark }]}>
              💡 הטקסטים נטענים מ-Sefaria (CC-BY) ונשמרים במכשיר. אחרי טעינה ראשונית - זמין גם אופליין.
            </Text>
          </Card>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function emojiFor(name: string): string {
  const map: Record<string, string> = {
    'Weekday': '📿',
    'Shabbat': '🕯️',
    'Festivals': '🎉',
    'Holidays': '🎉',
    'Fast Days': '😔',
    'Rosh Chodesh': '🌙',
    'Special Days': '✨',
    'Blessings': '🙏',
    "Birkat Hamazon": '🍽️',
    'Megillah': '📜',
  };
  return map[name] || '📖';
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: { padding: spacing.lg },
  nusachBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    flexGrow: 1,
    minWidth: 90,
    alignItems: 'center',
  },
  nusachBtnActive: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
});
