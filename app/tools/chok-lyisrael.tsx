/**
 * חוק לישראל — daily learning per the Chida's program.
 *
 * Sefaria's calendar API already returns authoritative refs for the
 * standard daily learnings (Parsha, Daily Mishnah, Daily Rambam,
 * Halakhah Yomit, Tanya, Daf Yomi, 929 Tanach). We map them onto the
 * 7 Chok categories and fetch each inline.
 *
 * This is verified: every ref below comes from Sefaria's own calendar
 * for the current day, so refs are always valid.
 */
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon } from '../../src/components/Icon';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { ParchmentText } from '../../src/components/ParchmentText';
import { Card } from '../../src/components/Card';
import { cleanSefariaText } from '../../src/services/sefaria';
import { colors, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

const DAY_NAMES_HE = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

type Section = {
  key: string;
  label: string;
  ref: string;
  refDisplay: string;
  text: string | null;
  loading: boolean;
  error: string | null;
};

async function fetchSefariaText(ref: string): Promise<string> {
  const urlRef = encodeURIComponent(ref.replace(/\s+/g, '_'));
  const url = `https://www.sefaria.org/api/v3/texts/${urlRef}?version=hebrew&return_format=text_only`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('שגיאת שרת ' + res.status);
  const data: any = await res.json();
  if (data.error) throw new Error(data.error);
  const versions = data.versions || [];
  const heVersion = versions.find((v: any) => v.language === 'he') || versions[0];
  const text = heVersion?.text || data.he || data.text;
  if (!text) throw new Error('אין טקסט');
  const flatten = (x: any): string => {
    if (typeof x === 'string') return x;
    if (Array.isArray(x)) return x.map(flatten).join(' ');
    return '';
  };
  // Use central cleaner — strips tags AND decodes &nbsp; / &thinsp; / &amp; etc.
  return cleanSefariaText(flatten(text));
}

/** Pull a calendar item by its English title. */
function findItem(items: any[], titleKey: string): { displayValue: string; ref: string } | null {
  const item = items.find((c) => c.title?.en === titleKey);
  if (!item || !item.ref) return null;
  return {
    // Prefer Hebrew display value (e.g. "שלח") over English transliteration.
    displayValue: item.displayValue?.he || item.displayValue?.en || '',
    ref: item.ref,
  };
}

/** Build today's Chok L'Yisrael sections from the calendar API. */
function buildSectionsFromCalendar(items: any[], parsha: string): Section[] {
  const torah    = findItem(items, 'Parashat Hashavua');
  const mishna   = findItem(items, 'Daily Mishnah');
  const rambam   = findItem(items, 'Daily Rambam');
  const halakhah = findItem(items, 'Halakhah Yomit');
  const tanach929 = findItem(items, '929');
  const dafYomi  = findItem(items, 'Daf Yomi');
  const tanya    = findItem(items, 'Tanya Yomi');

  const sections: Section[] = [];
  const push = (key: string, label: string, item: { displayValue: string; ref: string } | null) => {
    if (!item) return;
    sections.push({
      key, label,
      ref: item.ref,
      refDisplay: item.displayValue,
      text: null, loading: true, error: null,
    });
  };

  push('torah',    `📖 תורה — פרשת השבוע`,          torah);
  push('929',      `🕊️ נביאים / כתובים — 929`,        tanach929);
  push('mishna',   `📚 משנה יומית`,                   mishna);
  push('daf',      `🎓 גמרא — דף יומי`,                dafYomi);
  push('rambam',   `⚖️ הלכה — רמב״ם יומי`,            rambam);
  push('halakhah', `📜 הלכה — שולחן ערוך יומי`,        halakhah);
  push('tanya',    `🌟 פנימיות — תניא יומי`,           tanya);
  return sections;
}

export default function ChokLYisraelScreen() {
  const router = useRouter();
  const [parsha, setParsha] = useState<string | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('https://www.sefaria.org/api/calendars?diaspora=0');
        const data: any = await res.json();
        const items = data.calendar_items || [];
        const p = items.find((c: any) => c.title?.en === 'Parashat Hashavua');
        // Prefer Hebrew display value (e.g. "שלח") over English transliteration.
        const heName = p?.displayValue?.he || p?.displayValue?.en || 'בראשית';
        const enName = p?.displayValue?.en || 'Bereshit';
        setParsha(heName);
        const secs = buildSectionsFromCalendar(items, enName);
        setSections(secs);
      } catch (e: any) {
        setError(e?.message || 'שגיאה בטעינת לוח הלימוד');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!sections.length) return;
    sections.forEach((row, i) => {
      if (row.text || row.error) return;
      fetchSefariaText(row.ref)
        .then((text) => {
          setSections((curr) => {
            const next = [...curr];
            next[i] = { ...next[i], text, loading: false };
            return next;
          });
        })
        .catch((e) => {
          setSections((curr) => {
            const next = [...curr];
            next[i] = { ...next[i], error: e?.message || 'שגיאה', loading: false };
            return next;
          });
        });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections.length]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <LinearGradient
          colors={['#0a1f3d', '#1e3a5f', '#2c5282']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill as any}
        />
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Icon name="chevronRight" size={20} color={colors.primary} />
            <Text style={[typography.bodyBold, { color: colors.primary }]}>חזרה</Text>
          </Pressable>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[typography.body, { color: colors.textMuted, marginTop: 12 }]}>
            טוען את הלימוד של היום...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !parsha) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Icon name="chevronRight" size={20} color={colors.primary} />
            <Text style={[typography.bodyBold, { color: colors.primary }]}>חזרה</Text>
          </Pressable>
        </View>
        <View style={{ padding: spacing.lg }}>
          <ScreenHeader title="חוק לישראל" subtitle="לימוד יומי לפי החיד״א" />
          <Card variant="featured">
            <Text style={[typography.body, { color: colors.textPrimary }]}>
              שגיאה: {error || 'לא ניתן לזהות את פרשת השבוע'}
            </Text>
          </Card>
        </View>
      </SafeAreaView>
    );
  }

  const today = new Date().getDay();
  const dayName = DAY_NAMES_HE[today];
  const todayHebDate = new Date().toLocaleDateString('he-IL', {
    day: 'numeric', month: 'long',
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={['#0a1f3d', '#1e3a5f', '#2c5282']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill as any}
      />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Icon name="chevronRight" size={20} color={colors.primary} />
          <Text style={[typography.bodyBold, { color: colors.primary }]}>חזרה</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        <ScreenHeader
          title="חוק לישראל"
          subtitle={`יום ${dayName} · פרשת ${parsha} · ${todayHebDate}`}
        />
        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          {sections.map((row) => (
            <ParchmentText
              key={row.key}
              sectionName={`${row.label}${row.refDisplay ? ` · ${row.refDisplay}` : ''}`}
            >
              {row.loading ? (
                <View style={{ alignItems: 'center', padding: spacing.md }}>
                  <ActivityIndicator size="small" color="#5c2a05" />
                </View>
              ) : row.error ? (
                <Text style={{ color: '#5c2a05', fontStyle: 'italic', textAlign: 'center' }}>
                  לא נטען ({row.error})
                </Text>
              ) : (
                <Text style={{ color: '#2c1810', fontSize: 17, lineHeight: 30, textAlign: 'right', fontFamily: 'serif' }}>
                  {row.text}
                </Text>
              )}
            </ParchmentText>
          ))}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md },
  backBtn: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, alignSelf: 'flex-end' },
});
