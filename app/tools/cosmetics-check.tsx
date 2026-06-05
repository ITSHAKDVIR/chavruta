/**
 * Cosmetics kashrut checker — native port of the Kosharot tool at
 * kosharot.co.il/loadedFiles/Kosher_Cosmetics_AI.html.
 *
 * User uploads or takes a photo of the ingredients list. We send it to the
 * Kosharot api-proxy (GPT-4o-mini vision), get back a comma-separated
 * ingredient list, then categorize against three on-device databases:
 *   - PROBLEMATIC_ALWAYS    (red — definitely not kosher)
 *   - PROBLEMATIC_IF_NOT_VEGAN (orange — unless product is labeled vegan)
 *   - REQUIRES_CHECK        (yellow — undisclosed composition)
 *
 * No WebView. Photo capture, network call, and analysis all run natively.
 */
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon } from '../../src/components/Icon';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import {
  AnalysisResult,
  analyzeIngredients,
  extractIngredients,
} from '../../src/services/cosmeticsApi';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

type Stage = 'idle' | 'reading' | 'done' | 'error' | 'notCosmetic';

async function pickImageAndConvertToBase64(source: 'camera' | 'library'): Promise<string | null> {
  const ImagePicker: any = await import('expo-image-picker');
  const perm =
    source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    Alert.alert('הרשאה נדחתה', 'יש לאפשר גישה כדי להעלות תמונה.');
    return null;
  }
  const opts = {
    mediaTypes: 'images' as any,
    quality: 0.7,
    base64: true,
    allowsEditing: false,
  };
  const res =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync(opts)
      : await ImagePicker.launchImageLibraryAsync(opts);
  if (res.canceled || !res.assets || res.assets.length === 0) return null;
  const a = res.assets[0];
  if (!a.base64) return null;
  // OpenAI vision expects a data URL
  return `data:image/jpeg;base64,${a.base64}`;
}

export default function CosmeticsCheckScreen() {
  const router = useRouter();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [isVegan, setIsVegan] = useState(false);
  const [stage, setStage] = useState<Stage>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [extracted, setExtracted] = useState<string>('');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [partial, setPartial] = useState(false);

  async function pickFrom(source: 'camera' | 'library') {
    try {
      const dataUrl = await pickImageAndConvertToBase64(source);
      if (!dataUrl) return;
      setImageData(dataUrl);
      // Display URI = same data URL (works in <Image source={{uri}}/>)
      setImageUri(dataUrl);
      setStage('idle');
      setAnalysis(null);
      setExtracted('');
      setErrorMessage('');
    } catch (e: any) {
      Alert.alert('שגיאה', e?.message || 'לא ניתן לפתוח את התמונה');
    }
  }

  async function analyze() {
    if (!imageData) return;
    setStage('reading');
    setErrorMessage('');
    try {
      const result = await extractIngredients(imageData, false);
      if (result.isNotCosmetic) {
        setStage('notCosmetic');
        return;
      }
      setPartial(result.partial);
      setExtracted(result.text);
      if (!result.text || result.text.toUpperCase() === 'EMPTY') {
        setStage('error');
        setErrorMessage('לא זוהו רכיבים בתמונה. נסה שוב עם תמונה ברורה יותר.');
        return;
      }
      const a = analyzeIngredients(result.text, isVegan);
      setAnalysis(a);
      setStage('done');
    } catch (e: any) {
      setStage('error');
      setErrorMessage(e?.message || 'שגיאה בלתי צפויה');
    }
  }

  function reset() {
    setImageUri(null);
    setImageData(null);
    setAnalysis(null);
    setExtracted('');
    setStage('idle');
    setErrorMessage('');
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
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        <ScreenHeader title="בדיקת כשרות קוסמטיקה" subtitle="ניתוח רכיבים מתוך תמונה" />

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          <Card>
            <Text style={[typography.body, { color: colors.textPrimary }]}>
              צלמו או העלו תמונה של רשימת הרכיבים על המוצר. המערכת תזהה רכיבים בעייתיים
              לפי מאגר כושרות. ה-AI עלול לטעות — מומלץ לאמת מול הרכיבים שהוצגו.
            </Text>
          </Card>

          {/* Vegan toggle */}
          <Card>
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>המוצר מסומן טבעוני / Vegan</Text>
                <Text style={[typography.small, { color: colors.textMuted, marginTop: 2 }]}>
                  אם כן — לא נסמן רכיבים שיכולים להיות צמחיים
                </Text>
              </View>
              <Switch value={isVegan} onValueChange={setIsVegan} />
            </View>
          </Card>

          {/* Image preview / pickers */}
          {imageUri ? (
            <Card>
              <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="contain" />
              <View style={{ flexDirection: 'row-reverse', gap: spacing.sm, marginTop: spacing.sm }}>
                <Button label="בדוק כשרות" onPress={analyze} variant="primary" style={{ flex: 1 }} disabled={stage === 'reading'} />
                <Button label="החלף תמונה" onPress={reset} variant="secondary" style={{ flex: 1 }} disabled={stage === 'reading'} />
              </View>
            </Card>
          ) : (
            <Card>
              <Text style={[typography.bodyBold, { color: colors.textPrimary, marginBottom: spacing.sm }]}>
                בחר מקור תמונה:
              </Text>
              <View style={{ flexDirection: 'row-reverse', gap: spacing.sm }}>
                <Button label="📷 צילום" onPress={() => pickFrom('camera')} variant="primary" style={{ flex: 1 }} />
                <Button label="🖼️ גלריה" onPress={() => pickFrom('library')} variant="secondary" style={{ flex: 1 }} />
              </View>
            </Card>
          )}

          {/* Loading */}
          {stage === 'reading' && (
            <Card>
              <View style={{ alignItems: 'center', padding: spacing.md, gap: spacing.sm }}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[typography.body, { color: colors.textPrimary }]}>מנתח את התמונה...</Text>
                <Text style={[typography.caption, { color: colors.textMuted }]}>זה לוקח 5-15 שניות</Text>
              </View>
            </Card>
          )}

          {/* Not a cosmetic */}
          {stage === 'notCosmetic' && (
            <Card>
              <Text style={[typography.h3, { color: colors.warning }]}>זה לא מוצר קוסמטי</Text>
              <Text style={[typography.body, { color: colors.textPrimary, marginTop: spacing.sm }]}>
                התמונה נראית מוצר אכיל. הכלי הזה מיועד לקוסמטיקה בלבד. אם בכל זאת רוצה
                לבדוק — בחר תמונה אחרת.
              </Text>
            </Card>
          )}

          {/* Error */}
          {stage === 'error' && (
            <Card>
              <Text style={[typography.h3, { color: colors.danger }]}>שגיאה</Text>
              <Text style={[typography.body, { color: colors.textPrimary, marginTop: spacing.sm }]}>
                {errorMessage}
              </Text>
            </Card>
          )}

          {/* Result */}
          {stage === 'done' && analysis && (
            <ResultView extracted={extracted} partial={partial} analysis={analysis} />
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function ResultView({
  extracted,
  partial,
  analysis,
}: {
  extracted: string;
  partial: boolean;
  analysis: AnalysisResult;
}) {
  const allClear =
    analysis.problematic.length === 0 &&
    analysis.conditional.length === 0 &&
    analysis.requiresCheck.length === 0;

  return (
    <>
      {/* Verdict summary */}
      <Card>
        <Text style={[typography.h3, { color: allClear ? colors.success : colors.warning }]}>
          {allClear ? '✓ לא זוהו רכיבים בעייתיים' : '⚠ נמצאו רכיבים שדורשים בירור'}
        </Text>
        {partial && (
          <Text style={[typography.small, { color: colors.warning, marginTop: 4 }]}>
            ⚠ רשימת הרכיבים שזוהתה חלקית — מומלץ לצלם שוב בזווית אחרת
          </Text>
        )}
        <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm }]}>
          זוהו {analysis.rawIngredients.length} רכיבים בסך הכל
        </Text>
      </Card>

      {/* Problematic always */}
      {analysis.problematic.length > 0 && (
        <Card>
          <Text style={[typography.bodyBold, { color: colors.danger, marginBottom: spacing.sm }]}>
            🔴 רכיבים בעייתיים ({analysis.problematic.length})
          </Text>
          {analysis.problematic.map((f, i) => (
            <View key={i} style={styles.findingRow}>
              <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>
                {f.translation.he}
                {f.translation.eNumber ? ` (${f.translation.eNumber})` : ''}
              </Text>
              <Text style={[typography.small, { color: colors.textMuted, marginTop: 2 }]}>
                {f.translation.explanation}
              </Text>
              <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2, fontStyle: 'italic' }]}>
                ברכיבים: {f.original}
              </Text>
            </View>
          ))}
        </Card>
      )}

      {/* Conditional */}
      {analysis.conditional.length > 0 && (
        <Card>
          <Text style={[typography.bodyBold, { color: colors.warning, marginBottom: spacing.sm }]}>
            🟠 יכול להיות מן החי ({analysis.conditional.length})
          </Text>
          <Text style={[typography.small, { color: colors.textMuted, marginBottom: spacing.sm }]}>
            אם המוצר מסומן טבעוני — הרכיבים האלה בסדר.
          </Text>
          {analysis.conditional.map((f, i) => (
            <View key={i} style={styles.findingRow}>
              <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>
                {f.translation.he}
                {f.translation.eNumber ? ` (${f.translation.eNumber})` : ''}
              </Text>
              <Text style={[typography.small, { color: colors.textMuted, marginTop: 2 }]}>
                {f.translation.explanation}
              </Text>
            </View>
          ))}
        </Card>
      )}

      {/* Requires check */}
      {analysis.requiresCheck.length > 0 && (
        <Card>
          <Text style={[typography.bodyBold, { color: colors.primary, marginBottom: spacing.sm }]}>
            🟡 רכיבים שתוכנם לא מפורט ({analysis.requiresCheck.length})
          </Text>
          {analysis.requiresCheck.map((f, i) => (
            <View key={i} style={styles.findingRow}>
              <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>
                {f.translation.he}
              </Text>
              <Text style={[typography.small, { color: colors.textMuted, marginTop: 2 }]}>
                {f.translation.explanation}
              </Text>
            </View>
          ))}
        </Card>
      )}

      {/* Raw ingredients */}
      <Card>
        <Text style={[typography.bodyBold, { color: colors.textPrimary, marginBottom: spacing.sm }]}>
          רשימת הרכיבים שזוהתה
        </Text>
        <Text style={[typography.small, { color: colors.textSecondary }]}>{extracted}</Text>
      </Card>

      <Text style={[typography.caption, { color: colors.textMuted, textAlign: 'center', fontStyle: 'italic' }]}>
        מבוסס על מאגר כושרות. בקרה זו אינה מהווה תחליף לפסיקה של רב. {'\n'}
        רכיבים שאינם ברשימה — לא נבדקו ויכולים להיות בעייתיים.
      </Text>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md },
  backBtn: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, alignSelf: 'flex-end' },
  preview: {
    width: '100%',
    height: 220,
    borderRadius: radius.md,
    backgroundColor: colors.glass,
  },
  findingRow: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
  },
});
