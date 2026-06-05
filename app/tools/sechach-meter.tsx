import React, { useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View, Pressable, Image, Alert, ActivityIndicator } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

type Result = {
  shadePct: number;
  sunPct: number;
  total: number;
  kosher: boolean;
};

export default function SechachMeterScreen() {
  const router = useRouter();
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [threshold, setThreshold] = useState(110); // luminance 0-255

  async function pickPhoto(useCamera: boolean) {
    try {
      const perm = useCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== 'granted') {
        Alert.alert('הרשאה נדחתה', 'לא ניתן להמשיך ללא הרשאת מצלמה/גלריה');
        return;
      }
      const res = useCamera
        ? await ImagePicker.launchCameraAsync({ base64: true, quality: 0.6 })
        : await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.6 });
      if (!res.canceled) {
        setPhoto(res.assets[0].uri);
        setPhotoBase64(res.assets[0].base64 ?? null);
        setResult(null);
      }
    } catch (e: any) {
      Alert.alert('שגיאה', String(e?.message ?? e));
    }
  }

  async function analyze() {
    if (!photo) return;
    setLoading(true);
    setResult(null);
    try {
      let r: Result;
      if (Platform.OS === 'web') {
        r = await analyzeWeb(photo, threshold);
      } else {
        // On native we need base64 to decode. Use a hidden canvas via Image dataURL approach.
        // Without expo-image-manipulator we use base64 in an off-screen Image - but RN doesn't have canvas natively.
        // Fallback: use brightness heuristic from JPEG header is unreliable. Instead, route through web Canvas via base64 dataURL.
        if (!photoBase64) throw new Error('אין נתוני תמונה');
        r = await analyzeFromBase64(photoBase64, threshold, photo ?? undefined);
      }
      setResult(r);
    } catch (e: any) {
      Alert.alert('שגיאה בניתוח', String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setPhoto(null);
    setPhotoBase64(null);
    setResult(null);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={[typography.bodyBold, { color: colors.primary }]}>‹ חזרה</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <ScreenHeader title="מודד צילתה מרובה מחמתה" subtitle="ניתוח תמונת סכך - יחס צל לחמה" />

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          <Card variant="accent">
            <Text style={[typography.body, { color: colors.primaryDark, opacity: 0.9 }]}>
              <Text style={{ fontWeight: '700' }}>ההלכה:</Text> סוכה כשרה דורשת שצילתה מרובה מחמתה - כלומר השטח המוצל
              גדול מהשטח שדרכו עובר אור שמש. הכלי מצלם את הסכך מבפנים, מנתח כמה אור עובר ביחס לכמה מוסתר.
            </Text>
          </Card>

          <Card>
            <Text style={[typography.h3, { color: colors.textPrimary, marginBottom: spacing.sm }]}>איך מצלמים</Text>
            <Text style={[typography.body, { color: colors.textSecondary }]}>
              1. עמוד בתוך הסוכה ביום בהיר.{'\n'}
              2. כוון את המצלמה ישר כלפי מעלה אל הסכך.{'\n'}
              3. צלם את הסכך כך שימלא את כל הפריים.{'\n'}
              4. נסה שלא יהיו דפנות בתמונה - רק סכך ושמיים.{'\n'}
              5. לאחר הצילום - לחץ "נתח".
            </Text>
          </Card>

          <Card variant="primary">
            <Text style={[typography.h3, { color: colors.textPrimary }]}>📷 תמונת הסכך</Text>
            {photo && <Image source={{ uri: photo }} style={styles.preview} />}
            <View style={{ flexDirection: 'row-reverse', gap: spacing.sm, marginTop: spacing.md, flexWrap: 'wrap' }}>
              <Button label="📷 צלם" onPress={() => pickPhoto(true)} variant="secondary" style={{ flex: 1, minWidth: 120 }} fullWidth />
              <Button label="🖼️ מהגלריה" onPress={() => pickPhoto(false)} variant="secondary" style={{ flex: 1, minWidth: 120 }} fullWidth />
            </View>
            {photo && (
              <View style={{ flexDirection: 'row-reverse', gap: spacing.sm, marginTop: spacing.sm, flexWrap: 'wrap' }}>
                <Button label={loading ? 'מנתח...' : '🔍 נתח'} onPress={analyze} variant="secondary" style={{ flex: 1, minWidth: 120 }} fullWidth />
                <Button label="✕ נקה" onPress={reset} variant="secondary" style={{ flex: 1, minWidth: 120 }} fullWidth />
              </View>
            )}
            {loading && <View style={{ marginTop: spacing.sm }}><ActivityIndicator color={colors.textPrimary} /></View>}
          </Card>

          {/* רגישות / סף */}
          <Card>
            <Text style={[typography.h3, { color: colors.textPrimary }]}>סף רגישות</Text>
            <Text style={[typography.small, { color: colors.textMuted, marginTop: 4 }]}>
              נוכחי: {threshold} (0-255). פיקסל בהיר מהסף = שמש, פיקסל כהה מהסף = צל. ערך גבוה = יותר מחמיר.
            </Text>
            <View style={{ flexDirection: 'row-reverse', gap: spacing.sm, marginTop: spacing.sm, flexWrap: 'wrap' }}>
              <Pressable onPress={() => setThreshold(Math.max(50, threshold - 10))} style={[styles.btn, { flexGrow: 1, minWidth: 80 }]}>
                <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>− 10</Text>
              </Pressable>
              <Pressable onPress={() => setThreshold(110)} style={[styles.btn, { flexGrow: 1, minWidth: 80 }]}>
                <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>איפוס</Text>
              </Pressable>
              <Pressable onPress={() => setThreshold(Math.min(200, threshold + 10))} style={[styles.btn, { flexGrow: 1, minWidth: 80 }]}>
                <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>+ 10</Text>
              </Pressable>
            </View>
            {result && photo && (
              <View style={{ marginTop: spacing.sm }}>
                <Button label="חישוב מחדש עם הסף החדש" onPress={analyze} variant="secondary" fullWidth />
              </View>
            )}
          </Card>

          {result && (
            <Card variant={result.kosher ? 'primary' : 'accent'}>
              <Text style={[typography.h2, { color: result.kosher ? colors.textInverse : colors.primaryDark, textAlign: 'center' }]}>
                {result.kosher ? '✓ כשרה' : '✗ פסולה'}
              </Text>
              <Text style={[typography.body, { color: result.kosher ? colors.textInverse : colors.primaryDark, opacity: 0.9, textAlign: 'center', marginTop: spacing.sm }]}>
                {result.kosher
                  ? `צילתה מרובה מחמתה (${result.shadePct.toFixed(1)}% צל)`
                  : `חמתה מרובה מצילתה - חמה ${result.sunPct.toFixed(1)}% מול צל ${result.shadePct.toFixed(1)}%`}
              </Text>

              {/* Visual bar */}
              <View style={[styles.bar, { marginTop: spacing.md }]}>
                <View style={[styles.barShade, { flex: result.shadePct }]} />
                <View style={[styles.barSun, { flex: result.sunPct }]} />
              </View>
              <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', marginTop: 4 }}>
                <Text style={[typography.caption, { color: result.kosher ? colors.textInverse : colors.primaryDark }]}>
                  צל: {result.shadePct.toFixed(1)}%
                </Text>
                <Text style={[typography.caption, { color: result.kosher ? colors.textInverse : colors.primaryDark }]}>
                  חמה: {result.sunPct.toFixed(1)}%
                </Text>
              </View>

              <Text style={[typography.caption, { color: result.kosher ? colors.textInverse : colors.primaryDark, opacity: 0.7, marginTop: spacing.sm, textAlign: 'center' }]}>
                נותחו {result.total.toLocaleString()} פיקסלים
              </Text>
            </Card>
          )}

          <Card variant="accent">
            <Text style={[typography.caption, { color: colors.primaryDark }]}>
              💡 הכלי הוא כלי עזר בלבד. לפסיקה הלכתית מעשית יש להיוועץ ברב. בתמונה מעורפלת, בענן, בלילה, או עם זוויות
              לא ישרות - התוצאה לא מדויקת. המדידה ההלכתית הפשוטה: אם רואים יותר אור מאשר צל מבפנים - הסוכה פסולה.
            </Text>
          </Card>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

/** Web canvas-based analysis. */
async function analyzeWeb(uri: string, threshold: number): Promise<Result> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const maxDim = 300;
        const scale = Math.min(maxDim / img.width, maxDim / img.height, 1);
        const w = Math.max(1, Math.floor(img.width * scale));
        const h = Math.max(1, Math.floor(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas not available');
        ctx.drawImage(img, 0, 0, w, h);
        const data = ctx.getImageData(0, 0, w, h).data;
        resolve(computeFromImageData(data, threshold));
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => reject(new Error('טעינת תמונה נכשלה'));
    img.src = uri;
  });
}

/** Cross-platform: load from base64 data via JPEG-JS pure-JS decoder (native)
 *  or via web Canvas (web). Resizes large images first via expo-image-manipulator. */
async function analyzeFromBase64(base64: string, threshold: number, uri?: string): Promise<Result> {
  if (typeof document !== 'undefined') {
    return analyzeWeb(`data:image/jpeg;base64,${base64}`, threshold);
  }
  // Native: first resize via expo-image-manipulator to avoid decoding a 12MP image
  let workingBase64 = base64;
  if (uri) {
    try {
      const IM: any = await import('expo-image-manipulator');
      const result = await IM.manipulateAsync(
        uri,
        [{ resize: { width: 200 } }],
        { compress: 0.8, format: IM.SaveFormat.JPEG, base64: true },
      );
      if (result.base64) workingBase64 = result.base64;
    } catch (e) {
      console.warn('[sechach] resize failed, using original:', e);
    }
  }
  // Decode JPEG with jpeg-js (pure JS)
  const jpeg: any = await import('jpeg-js');
  const buffer = base64ToUint8(workingBase64);
  const decoded = jpeg.decode(buffer, { useTArray: true });
  return computeFromImageData(decoded.data, threshold);
}

function base64ToUint8(b64: string): Uint8Array {
  // Pure-JS base64 decoder that works in Hermes (no Buffer dependency)
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const lookup = new Uint8Array(128);
  for (let i = 0; i < chars.length; i++) lookup[chars.charCodeAt(i)] = i;
  let cleaned = b64.replace(/[^A-Za-z0-9+/]/g, '');
  const padding = (4 - (cleaned.length % 4)) % 4;
  cleaned += '='.repeat(padding);
  const len = (cleaned.length * 3) / 4 - padding;
  const bytes = new Uint8Array(len);
  let p = 0;
  for (let i = 0; i < cleaned.length; i += 4) {
    const a = lookup[cleaned.charCodeAt(i)];
    const b = lookup[cleaned.charCodeAt(i + 1)];
    const c = lookup[cleaned.charCodeAt(i + 2)];
    const d = lookup[cleaned.charCodeAt(i + 3)];
    if (p < len) bytes[p++] = (a << 2) | (b >> 4);
    if (p < len) bytes[p++] = ((b & 15) << 4) | (c >> 2);
    if (p < len) bytes[p++] = ((c & 3) << 6) | d;
  }
  return bytes;
}

function computeFromImageData(data: Uint8ClampedArray, threshold: number): Result {
  let shade = 0;
  let sun = 0;
  const total = data.length / 4;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // Standard luminance formula
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    // Also: very saturated blue (sky) counts as sun too
    const isSky = b > r + 15 && b > 130 && lum > 100;
    if (lum >= threshold || isSky) {
      sun++;
    } else {
      shade++;
    }
  }
  const shadePct = (shade / total) * 100;
  const sunPct = (sun / total) * 100;
  return {
    shadePct,
    sunPct,
    total,
    kosher: shade > sun,
  };
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: { padding: spacing.lg },
  preview: { width: '100%', height: 240, borderRadius: radius.md, marginTop: spacing.md, resizeMode: 'cover' },
  btn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  bar: {
    flexDirection: 'row-reverse',
    height: 24,
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
  },
  barShade: { backgroundColor: '#2D3F50' },
  barSun: { backgroundColor: '#F4C842' },
});
