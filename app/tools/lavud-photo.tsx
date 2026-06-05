import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { askGemini, imageUriToBase64 } from '../../src/services/gemini';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

const CARD_LONG_CM = 8.56;

type Result = {
  gapCm: number;
  rawText: string;
  isLavud: { naeh: boolean; feinstein: boolean; chazonish: boolean };
};

const PROMPT = `אתה רואה תמונה של פער/חור/רווח כלשהו במחיצה (לדוגמה: דופן סוכה, גדר), עם **כרטיס אשראי / רישיון נהיגה / תעודת זהות** מונח על הצד הארוך שלו לידו או בתוכו. הכרטיס הוא בדיוק 8.56 ס"מ ארוך (תקן ISO/IEC 7810).

המשימה שלך:
1. זהה את הפער (האזור הריק / החור / הרווח שבין שני דברים)
2. זהה את הכרטיס בתמונה (8.56 ס"מ ארוך)
3. השווה גדלים - כמה ס"מ הוא הפער?

החזר ב-JSON בלבד (בלי טקסט נוסף, בלי markdown):
{
  "gapCm": מספר (גודל הפער בס"מ, כמספר עשרוני),
  "notes": "הסבר קצר איך מדדת"
}

אם לא רואים בבירור גם פער וגם כרטיס - החזר:
{ "gapCm": null, "notes": "תיאור הבעיה" }`;

function parseResponse(text: string): { gapCm: number | null; notes: string } | null {
  // Try to extract JSON from possible markdown wrapper
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    const j = JSON.parse(m[0]);
    return { gapCm: j.gapCm ?? null, notes: j.notes ?? '' };
  } catch {
    return null;
  }
}

export default function LavudPhotoScreen() {
  const router = useRouter();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function pickImage(useCamera: boolean) {
    setError(null);
    setResult(null);
    try {
      const ImagePicker: any = await import('expo-image-picker');
      const perm = useCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== 'granted') {
        setError('צריך לאשר גישה למצלמה / גלריה');
        return;
      }
      const opts = { allowsEditing: true, quality: 0.7 as const };
      const res = useCamera
        ? await ImagePicker.launchCameraAsync(opts)
        : await ImagePicker.launchImageLibraryAsync(opts);
      if (!res.canceled && res.assets && res.assets[0]) {
        setImageUri(res.assets[0].uri);
      }
    } catch (e: any) {
      setError(e.message || 'שגיאה בפתיחת המצלמה');
    }
  }

  async function analyze() {
    if (!imageUri) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      // Resize to reduce upload size
      const IM: any = await import('expo-image-manipulator');
      const resized = await IM.manipulateAsync(
        imageUri,
        [{ resize: { width: 1024 } }],
        { compress: 0.75, format: IM.SaveFormat.JPEG },
      );
      const b64 = await imageUriToBase64(resized.uri);
      const res = await askGemini({ prompt: PROMPT, imageB64: b64 });
      if (!res.success) {
        setError(res.error);
        return;
      }
      const parsed = parseResponse(res.text);
      if (!parsed || parsed.gapCm === null) {
        setError(parsed?.notes || 'לא הצלחתי לזהות את הפער או הכרטיס. נסה תמונה ברורה יותר.');
        return;
      }
      const gap = parsed.gapCm;
      setResult({
        gapCm: gap,
        rawText: parsed.notes,
        isLavud: {
          naeh: gap < 24, // 3 × 8 = 24 cm
          feinstein: gap < 27, // 3 × 9
          chazonish: gap < 28.8, // 3 × 9.6
        },
      });
    } catch (e: any) {
      setError(e.message || 'שגיאה');
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setImageUri(null);
    setResult(null);
    setError(null);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={[typography.bodyBold, { color: colors.primary }]}>‹ חזרה</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        <ScreenHeader title="מודד לבוד עם מצלמה" subtitle="צילום פער + כרטיס אשראי = מדידה אוטומטית" />

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          <Card variant="accent">
            <Text style={[typography.body, { color: colors.primaryDark, opacity: 0.9 }]}>
              <Text style={{ fontWeight: '700' }}>איך זה עובד:</Text>
              {'\n'}1. הנח כרטיס אשראי / ת"ז / רישיון נהיגה ליד הפער שאתה רוצה למדוד
              {'\n'}2. צלם תמונה שרואים בה גם את הפער וגם את הכרטיס
              {'\n'}3. ה-AI ימדוד את הפער ביחס לכרטיס (8.56 ס"מ)
              {'\n'}4. תקבל הוראה אם זה לבוד או לא
            </Text>
          </Card>

          {!imageUri && (
            <View style={{ gap: spacing.sm }}>
              <Button label="📷 צלם תמונה" onPress={() => pickImage(true)} variant="primary" />
              <Button
                label="🖼 בחר מהגלריה"
                onPress={() => pickImage(false)}
                variant="secondary"
              />
            </View>
          )}

          {imageUri && (
            <Card>
              <Image
                source={{ uri: imageUri }}
                style={styles.preview}
                resizeMode="contain"
              />
              <View style={{ flexDirection: 'row-reverse', gap: spacing.sm, marginTop: spacing.sm }}>
                <Button
                  label={loading ? 'מנתח...' : '🔍 נתח'}
                  onPress={analyze}
                  variant="primary"
                  style={{ flex: 1 }}
                  disabled={loading}
                />
                <Button
                  label="צלם שוב"
                  onPress={reset}
                  variant="secondary"
                  style={{ flex: 1 }}
                  disabled={loading}
                />
              </View>
            </Card>
          )}

          {loading && (
            <View style={{ alignItems: 'center', padding: spacing.lg }}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[typography.body, { color: colors.textMuted, marginTop: spacing.sm }]}>
                ה-AI מנתח את התמונה...
              </Text>
            </View>
          )}

          {error && (
            <Card variant="accent">
              <Text style={[typography.bodyBold, { color: colors.danger }]}>✗ {error}</Text>
            </Card>
          )}

          {result && (
            <>
              <Card variant="primary">
                <Text style={[typography.caption, { color: colors.textPrimary, opacity: 0.85 }]}>
                  גודל הפער שזוהה
                </Text>
                <Text
                  style={[
                    typography.h1,
                    { color: colors.textPrimary, marginTop: spacing.xs, textAlign: 'center' },
                  ]}
                >
                  {result.gapCm.toFixed(1)} ס"מ
                </Text>
                {result.rawText && (
                  <Text
                    style={[
                      typography.caption,
                      { color: colors.textPrimary, opacity: 0.85, marginTop: spacing.xs, textAlign: 'center' },
                    ]}
                  >
                    {result.rawText}
                  </Text>
                )}
              </Card>

              <Card>
                <Text style={[typography.h3, { color: colors.textPrimary, marginBottom: spacing.sm }]}>
                  📐 פסיקה לפי שיטות הטפח
                </Text>
                <View style={{ gap: spacing.sm }}>
                  <ShitaResult
                    label='הגר"ח נאה (1 טפח = 8 ס"מ)'
                    boundary={24}
                    actual={result.gapCm}
                    ok={result.isLavud.naeh}
                  />
                  <ShitaResult
                    label='הרב פיינשטיין (9 ס"מ)'
                    boundary={27}
                    actual={result.gapCm}
                    ok={result.isLavud.feinstein}
                  />
                  <ShitaResult
                    label='חזון איש (9.6 ס"מ)'
                    boundary={28.8}
                    actual={result.gapCm}
                    ok={result.isLavud.chazonish}
                  />
                </View>
              </Card>
            </>
          )}

          <Card variant="accent">
            <Text style={[typography.caption, { color: colors.primaryDark, fontStyle: 'italic' }]}>
              💡 לדיוק מקסימלי: צלם מעמדה ניצבת לקיר, ודא שהכרטיס לא מוטה. עדיף לצלם כשהכרטיס
              נוגע בקצה של הפער.
            </Text>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ShitaResult({
  label,
  boundary,
  actual,
  ok,
}: {
  label: string;
  boundary: number;
  actual: number;
  ok: boolean;
}) {
  return (
    <View style={styles.shitaRow}>
      <View style={{ flex: 1 }}>
        <Text style={[typography.body, { color: colors.textPrimary }]}>{label}</Text>
        <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>
          3 טפחים = {boundary} ס"מ · אתה: {actual.toFixed(1)} ס"מ
        </Text>
      </View>
      <View
        style={[
          styles.verdict,
          { backgroundColor: ok ? '#2a4d2a' : '#8b1c1c' },
        ]}
      >
        <Text style={[typography.bodyBold, { color: '#fff' }]}>
          {ok ? '✓ לבוד' : '✗ לא לבוד'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: { padding: spacing.lg },
  preview: {
    width: '100%',
    height: 300,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
  },
  shitaRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
  },
  verdict: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
});
