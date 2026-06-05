import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable, Image, Alert, ActivityIndicator, TextInput } from 'react-native';
import { KeyboardScroll } from '../../src/components/KeyboardScroll';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { Pill } from '../../src/components/Pill';
import { useStoredJSON } from '../../src/hooks/useStoredJSON';
import { getJSON } from '../../src/storage/storage';
import { ensurePermissions, scheduleAt } from '../../src/services/notifications';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

const KEY_TIMES = '@yahadut/shul-times';
const KEY_AI = '@yahadut/ai-prefs';

type PrayerTime = {
  id: string;
  type: 'shacharit' | 'mincha' | 'maariv' | 'shabbat-mincha' | 'shabbat-maariv' | 'kabbalat-shabbat' | 'other';
  time: string;
  days: string;
  note?: string;
};

type ShulData = {
  shulName: string;
  photoUri?: string;
  times: PrayerTime[];
};

const TYPE_LABEL: Record<string, string> = {
  shacharit: 'שחרית',
  mincha: 'מנחה',
  maariv: 'ערבית',
  'shabbat-mincha': 'מנחה שבת',
  'shabbat-maariv': 'ערבית שבת',
  'kabbalat-shabbat': 'קבלת שבת',
  other: 'אחר',
};

export default function ShulTimesScreen() {
  const router = useRouter();
  const [data, setData] = useStoredJSON<ShulData>(KEY_TIMES, { shulName: '', times: [] });
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [manualForm, setManualForm] = useState<PrayerTime>({ id: '', type: 'shacharit', time: '', days: 'יום ראשון-חמישי' });

  async function pickPhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      const { status: lib } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (lib !== 'granted') {
        Alert.alert('הרשאה נדחתה');
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.6 });
      if (!res.canceled) { setPhoto(res.assets[0].uri); setPhotoBase64(res.assets[0].base64 ?? null); }
      return;
    }
    const res = await ImagePicker.launchCameraAsync({ base64: true, quality: 0.6 });
    if (!res.canceled) { setPhoto(res.assets[0].uri); setPhotoBase64(res.assets[0].base64 ?? null); }
  }

  async function parseWithAI() {
    if (!photo || !photoBase64) return;
    setLoading(true);
    try {
      // Use the Gemini PHP proxy instead of asking user for their own API key.
      // Same prompt as before; Gemini returns the JSON in its text response.
      const { askGemini } = await import('../../src/services/gemini');
      const promptText = `הסתכל בתמונה הזו של לוח זמני תפילה בבית כנסת. חלץ את כל זמני התפילה ותחזיר JSON בלבד במבנה הבא, ללא טקסט נוסף:

[{"type":"shacharit","time":"06:30","days":"ראשון-חמישי","note":""}, ...]

סוגים אפשריים: shacharit, mincha, maariv, kabbalat-shabbat, shabbat-mincha, shabbat-maariv, other.
זמן: HH:MM 24 שעות.`;

      const res = await askGemini({ prompt: promptText, imageB64: photoBase64 });
      if (!res.success) {
        Alert.alert('שגיאה', res.error);
        return;
      }
      const result = parseTimes(res.text);
      if (result.length === 0) {
        Alert.alert('לא זוהו זמנים', 'לא הצלחנו לחלץ זמנים מהתמונה. נסה תמונה ברורה יותר או הזן ידנית.');
      } else {
        setData({ ...data, photoUri: photo, times: result });
        Alert.alert('✓ הוזנו', `${result.length} זמני תפילה זוהו`);
        setPhoto(null);
      }
    } catch (e: any) {
      Alert.alert('שגיאה', String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }

  function addManual() {
    if (!manualForm.time.trim()) { Alert.alert('חסר', 'הזן שעה'); return; }
    const entry = { ...manualForm, id: String(Date.now()) };
    setData({ ...data, times: [...data.times, entry] });
    setManualForm({ id: '', type: 'shacharit', time: '', days: 'יום ראשון-חמישי' });
    setShowManual(false);
  }

  function removeTime(id: string) {
    setData({ ...data, times: data.times.filter((t) => t.id !== id) });
  }

  async function scheduleReminders() {
    const ok = await ensurePermissions();
    if (!ok) {
      Alert.alert('שגיאה', 'הרשאות התראות נדחו');
      return;
    }
    let count = 0;
    for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
      const d = new Date(Date.now() + dayOffset * 86_400_000);
      for (const t of data.times) {
        const [h, m] = t.time.split(':').map(Number);
        if (isNaN(h) || isNaN(m)) continue;
        const when = new Date(d);
        when.setHours(h, m - 10, 0, 0);
        if (when.getTime() < Date.now()) continue;
        const id = await scheduleAt(when, {
          title: `${TYPE_LABEL[t.type]} בעוד 10 דקות`,
          body: `${data.shulName} · ${t.time}`,
        });
        if (id) count++;
      }
    }
    Alert.alert('✓ תזכורות נקבעו', `נקבעו ${count} תזכורות תפילה ל-14 הימים הקרובים`);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={[typography.bodyBold, { color: colors.primary }]}>‹ חזרה</Text>
        </Pressable>
      </View>
      <KeyboardScroll contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <ScreenHeader title="זמני בית הכנסת שלי" subtitle="צילום לוח → AI → תזכורות" />

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          <Card>
            <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>שם בית הכנסת:</Text>
            <TextInput value={data.shulName} onChangeText={(v) => setData({ ...data, shulName: v })} placeholder="לדוגמא: היכל יוסף" placeholderTextColor={colors.textMuted} style={styles.input} />
          </Card>

          <Card variant="primary">
            <Text style={[typography.h3, { color: colors.textPrimary }]}>📷 צלם את לוח התפילות</Text>
            <Text style={[typography.body, { color: colors.textPrimary, opacity: 0.9, marginTop: spacing.sm }]}>
              צלם את הלוח של בית הכנסת שלך, וה-AI יזהה את הזמנים ויכניס אותם לאפליקציה.
            </Text>
            {photo && <Image source={{ uri: photo }} style={styles.preview} />}
            <View style={{ flexDirection: 'row-reverse', gap: spacing.sm, marginTop: spacing.md }}>
              <Button label={photo ? 'צלם שוב' : '📷 צלם'} onPress={pickPhoto} variant="secondary" style={{ flex: 1 }} fullWidth />
              {photo && <Button label={loading ? 'מנתח...' : '🤖 נתח עם AI'} onPress={parseWithAI} variant="secondary" style={{ flex: 1 }} fullWidth />}
            </View>
            {loading && <View style={{ marginTop: spacing.sm }}><ActivityIndicator color={colors.textPrimary} /></View>}
          </Card>

          <Pressable onPress={() => setShowManual(!showManual)}>
            <Text style={[typography.bodyBold, { color: colors.primary, textAlign: 'center' }]}>
              {showManual ? 'בטל הוספה ידנית' : '+ הוסף ידנית'}
            </Text>
          </Pressable>

          {showManual && (
            <Card>
              <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>סוג:</Text>
              <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                {Object.entries(TYPE_LABEL).map(([k, v]) => (
                  <Pressable key={k} onPress={() => setManualForm({ ...manualForm, type: k as any })} style={[styles.chip, manualForm.type === k && styles.chipActive]}>
                    <Text style={[typography.caption, { color: manualForm.type === k ? colors.textInverse : colors.textPrimary }]}>{v}</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={[typography.bodyBold, { color: colors.textPrimary, marginTop: spacing.sm }]}>שעה (HH:MM):</Text>
              <TextInput value={manualForm.time} onChangeText={(v) => setManualForm({ ...manualForm, time: v })} placeholder="07:00" placeholderTextColor={colors.textMuted} style={styles.input} />
              <Text style={[typography.bodyBold, { color: colors.textPrimary, marginTop: spacing.sm }]}>ימים:</Text>
              <TextInput value={manualForm.days} onChangeText={(v) => setManualForm({ ...manualForm, days: v })} placeholder="ראשון-חמישי" placeholderTextColor={colors.textMuted} style={styles.input} />
              <View style={{ marginTop: spacing.md }}>
                <Button label="הוסף" onPress={addManual} fullWidth />
              </View>
            </Card>
          )}

          {data.times.length > 0 && (
            <>
              <Text style={[typography.h3, { color: colors.textPrimary, marginTop: spacing.md }]}>זמני התפילה</Text>
              {data.times.map((t) => (
                <Card key={t.id}>
                  <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.md }}>
                    <Text style={[typography.display, { color: colors.primary, fontSize: 24 }]}>{t.time}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[typography.h3, { color: colors.textPrimary }]}>{TYPE_LABEL[t.type]}</Text>
                      <Text style={[typography.small, { color: colors.textMuted, marginTop: 2 }]}>{t.days}</Text>
                      {t.note ? <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2, fontStyle: 'italic' }]}>{t.note}</Text> : null}
                    </View>
                    <Pressable onPress={() => removeTime(t.id)}>
                      <Text style={[typography.caption, { color: colors.danger }]}>הסר</Text>
                    </Pressable>
                  </View>
                </Card>
              ))}

              <Button label="🔔 קבע תזכורות 10 דק׳ לפני" onPress={scheduleReminders} variant="primary" fullWidth />
            </>
          )}
        </View>
        <View style={{ height: 40 }} />
      </KeyboardScroll>
    </SafeAreaView>
  );
}

function parseTimes(text: string): PrayerTime[] {
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return [];
  try {
    const arr = JSON.parse(match[0]);
    return arr.map((t: any, i: number) => ({
      id: String(Date.now() + i),
      type: t.type ?? 'other',
      time: t.time ?? '',
      days: t.days ?? '',
      note: t.note,
    }));
  } catch {
    return [];
  }
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: { padding: spacing.lg },
  preview: { width: '100%', height: 220, borderRadius: radius.md, marginTop: spacing.md, resizeMode: 'cover' },
  input: { marginTop: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, fontSize: 16, color: colors.textPrimary, textAlign: 'right', backgroundColor: colors.bg },
  chip: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.full, backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
});
