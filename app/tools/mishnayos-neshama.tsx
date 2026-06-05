/**
 * Mishnayos l'iluy neshama — by Hebrew letters of the deceased's name.
 * Per the Chabad table: each Hebrew letter → an entire perek of mishna
 * from various tractates (Berakhot, Shabbat, Sukkah, etc.).
 * Plus 4 perakim for the letters of "נשמה" at the end.
 * Full text fetched from Sefaria.
 * Name persists in AsyncStorage so re-opening shows the study list directly.
 */
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon } from '../../src/components/Icon';
import { KeyboardScroll } from '../../src/components/KeyboardScroll';
import { ParchmentText } from '../../src/components/ParchmentText';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import {
  LETTER_TO_MISHNA,
  NESHAMA_LETTERS,
  nameToLetters,
} from '../../src/data/mishnayos-letters';
import { cleanSefariaText } from '../../src/services/sefaria';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

const STORAGE_KEY = '@chavruta/mishnayos-name';

type LoadedMishna = {
  letter: string;
  ref: string;
  label: string;
  text: string | null;
  loading: boolean;
  error: string | null;
};

async function fetchSefariaMishna(ref: string): Promise<string> {
  const urlRef = encodeURIComponent(ref.replace(/\s+/g, '_'));
  const url = `https://www.sefaria.org/api/v3/texts/${urlRef}?version=hebrew&return_format=text_only`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('שגיאת שרת ' + res.status);
  const data: any = await res.json();
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

export default function MishnayosNeshamaScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loaded, setLoaded] = useState<LoadedMishna[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const AS: any = (await import('@react-native-async-storage/async-storage')).default;
        const stored = await AS.getItem(STORAGE_KEY);
        if (stored) {
          setName(stored);
          setSubmitted(true);
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    if (!submitted) return;
    const nameLetters = nameToLetters(name);
    const allLetters = [...nameLetters, ...NESHAMA_LETTERS];
    const initial: LoadedMishna[] = allLetters.map((l, i) => {
      const m = LETTER_TO_MISHNA[l]!;
      return {
        letter: l + (i >= nameLetters.length ? ' (נשמה)' : ''),
        ref: m.ref,
        label: m.label,
        text: null,
        loading: true,
        error: null,
      };
    });
    setLoaded(initial);
    initial.forEach((row, i) => {
      fetchSefariaMishna(row.ref)
        .then((text) => {
          setLoaded((curr) => {
            const next = [...curr];
            next[i] = { ...next[i], text, loading: false };
            return next;
          });
        })
        .catch((e) => {
          setLoaded((curr) => {
            const next = [...curr];
            next[i] = { ...next[i], error: e?.message || 'שגיאה', loading: false };
            return next;
          });
        });
    });
  }, [submitted, name]);

  async function submitName() {
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      const AS: any = (await import('@react-native-async-storage/async-storage')).default;
      await AS.setItem(STORAGE_KEY, trimmed);
    } catch {}
    setSubmitted(true);
  }

  async function reset() {
    try {
      const AS: any = (await import('@react-native-async-storage/async-storage')).default;
      await AS.removeItem(STORAGE_KEY);
    } catch {}
    setSubmitted(false);
    setLoaded([]);
  }

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
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Icon name="chevronRight" size={20} color={colors.primary} />
          <Text style={[typography.bodyBold, { color: colors.primary }]}>חזרה</Text>
        </Pressable>
        {submitted && (
          <Pressable onPress={reset} hitSlop={10}>
            <Text style={[typography.caption, { color: colors.primary }]}>שם חדש</Text>
          </Pressable>
        )}
      </View>

      <KeyboardScroll contentContainerStyle={{ paddingBottom: spacing.xxl }} extraOffset={20}>
        <ScreenHeader
          title="משניות לעילוי נשמה"
          subtitle={submitted ? `לעילוי נשמת ${name}` : 'לפי אותיות שם הנפטר/ה'}
        />

        {!submitted ? (
          <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
            <Card variant="featured">
              <Text style={[typography.body, { color: colors.textPrimary, lineHeight: 22 }]}>
                המנהג ללמוד משניות לעילוי נשמת הנפטר/ה לפי אותיות השם.
                לכל אות — פרק שלם ממסכת ייעודית (לפי טבלת חב״ד). בסיום, מוסיפים 4 פרקים
                לאותיות <Text style={{ fontWeight: '700', color: colors.primary }}>נ-ש-מ-ה</Text>.
              </Text>
            </Card>

            <Text style={[typography.bodyBold, { color: colors.textPrimary, marginTop: spacing.md }]}>
              שם הנפטר/ה:
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="לדוגמה: יעקב בן שרה"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              autoFocus
            />
            <Text style={[typography.caption, { color: colors.textMuted, fontStyle: 'italic' }]}>
              💡 השם יישמר אוטומטית — בפעם הבאה תפתח את המסך וכבר תראה את הלימוד.
            </Text>
            <Button
              label="התחל לימוד"
              onPress={submitName}
              variant="primary"
              style={{ marginTop: spacing.md }}
              fullWidth
              disabled={!name.trim()}
            />
          </View>
        ) : (
          <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
            {loaded.map((row, i) => (
              <ParchmentText
                key={i}
                sectionName={`אות ${row.letter} · ${row.label}`}
              >
                {row.loading ? (
                  <View style={{ alignItems: 'center', padding: spacing.md }}>
                    <ActivityIndicator size="small" color="#5c2a05" />
                  </View>
                ) : row.error ? (
                  <Text style={{ color: '#5c2a05', fontStyle: 'italic', textAlign: 'center' }}>
                    שגיאה: {row.error}
                  </Text>
                ) : (
                  <Text style={{ color: '#2c1810', fontSize: 17, lineHeight: 30, textAlign: 'right', fontFamily: 'serif' }}>
                    {row.text}
                  </Text>
                )}
              </ParchmentText>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </KeyboardScroll>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backBtn: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4 },
  input: {
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 18,
    color: colors.textPrimary,
    textAlign: 'right',
  },
});
