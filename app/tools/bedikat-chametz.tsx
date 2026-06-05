import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View, Pressable } from 'react-native';
import { KeyboardScroll } from '../../src/components/KeyboardScroll';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { useStoredJSON } from '../../src/hooks/useStoredJSON';
import { HolidayCountdown } from '../../src/components/HolidayCountdown';
import { useLocation } from '../../src/hooks/useLocation';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

const KEY = '@yahadut/bedikat-chametz';

type ChecklistItem = {
  id: string;
  label: string;
  custom?: boolean;
};

type State = {
  /** Custom user-added items appended to the default list. */
  customItems: ChecklistItem[];
  /** Per-item checked state. */
  checked: Record<string, boolean>;
};

const DEFAULT_ITEMS: ChecklistItem[] = [
  { id: 'kitchen', label: 'מטבח - ארונות, מקרר, תנור, כיריים' },
  { id: 'pantry', label: 'מזווה / חדר אוכל' },
  { id: 'living', label: 'סלון - ספות, שולחנות, פינות' },
  { id: 'bedrooms', label: 'חדרי שינה - מיטות, ארונות' },
  { id: 'kids', label: 'חדרי ילדים + צעצועים' },
  { id: 'study', label: 'חדר עבודה / לימוד - שולחנות, ספרים' },
  { id: 'bathroom', label: 'שירותים / חדר אמבטיה' },
  { id: 'storage', label: 'מחסן / מרפסת שירות' },
  { id: 'car', label: 'רכב - תאי כפפות, בין מושבים, תא מטען' },
  { id: 'office', label: 'משרד / מקום עבודה' },
  { id: 'pockets', label: 'כיסי בגדים שעדיין לא הסתיים השימוש בהם' },
  { id: 'sale', label: 'מכירת חמץ - חתימה אצל רב' },
];

const DEFAULT_STATE: State = { customItems: [], checked: {} };

const BRACHA = `בָּרוּךְ אַתָּה ה' אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, אֲשֶׁר קִדְּשָׁנוּ בְּמִצְוֹתָיו וְצִוָּנוּ עַל בִּעוּר חָמֵץ.`;

const BITUL_LAYLA = `כָּל חֲמִירָא וַחֲמִיעָא דְּאִכָּא בִרְשׁוּתִי, דְּלָא חֲזִיתֵיהּ וּדְלָא בִיעַרְתֵּיהּ, וּדְלָא יְדַעְנָא לֵיהּ, לִבְטֵיל וְלֶהֱוֵי כְּעַפְרָא דְאַרְעָא.`;

const BITUL_YOM = `כָּל חֲמִירָא וַחֲמִיעָא דְּאִכָּא בִרְשׁוּתִי, דַּחֲזִיתֵיהּ וּדְלָא חֲזִיתֵיהּ, דַּחֲמִיתֵיהּ וּדְלָא חֲמִיתֵיהּ, דְּבִיעַרְתֵּיהּ וּדְלָא בִיעַרְתֵּיהּ, לִבְטֵיל וְלֶהֱוֵי כְּעַפְרָא דְאַרְעָא.`;

export default function BedikatChametzScreen() {
  const router = useRouter();
  const { location } = useLocation();
  const inIsrael = location.countryCode === 'IL';
  const [state, setState] = useStoredJSON<State>(KEY, DEFAULT_STATE);
  const [newLocation, setNewLocation] = useState('');

  const items = [...DEFAULT_ITEMS, ...state.customItems];

  function toggle(id: string) {
    setState((s) => ({ ...s, checked: { ...s.checked, [id]: !s.checked[id] } }));
  }

  function addCustomLocation() {
    const text = newLocation.trim();
    if (!text) return;
    const id = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setState((s) => ({ ...s, customItems: [...s.customItems, { id, label: text, custom: true }] }));
    setNewLocation('');
  }

  function removeCustom(id: string) {
    setState((s) => {
      const checked = { ...s.checked };
      delete checked[id];
      return { ...s, customItems: s.customItems.filter((it) => it.id !== id), checked };
    });
  }

  function resetChecks() {
    Alert.alert('איפוס סימונים', 'לאפס את כל הסימונים בצ׳ק-ליסט?', [
      { text: 'ביטול', style: 'cancel' },
      {
        text: 'אפס',
        style: 'destructive',
        onPress: () => setState((s) => ({ ...s, checked: {} })),
      },
    ]);
  }

  function resetAll() {
    Alert.alert('איפוס מלא', 'לאפס סימונים + להסיר את כל המקומות המותאמים אישית?', [
      { text: 'ביטול', style: 'cancel' },
      {
        text: 'אפס הכל',
        style: 'destructive',
        onPress: () => setState(DEFAULT_STATE),
      },
    ]);
  }

  const doneCount = items.filter((it) => state.checked[it.id]).length;
  const progress = items.length > 0 ? Math.round((doneCount / items.length) * 100) : 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={[typography.bodyBold, { color: colors.primary }]}>‹ חזרה</Text>
        </Pressable>
      </View>
      <KeyboardScroll contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <ScreenHeader title="בדיקת חמץ" subtitle="צ׳ק-ליסט + נוסחים" />

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          <HolidayCountdown holiday="erev-pesach" inIsrael={inIsrael} />

          <Card variant={progress === 100 ? 'accent' : 'primary'}>
            <Text style={[typography.h2, { color: progress === 100 ? colors.primaryDark : colors.textInverse }]}>
              {doneCount} / {items.length} ({progress}%)
            </Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
          </Card>

          <Card>
            <Text style={[typography.h3, { color: colors.textPrimary, marginBottom: spacing.sm }]}>
              ברכה לפני הבדיקה
            </Text>
            <View style={styles.brachaBox}>
              <Text style={[typography.sacred, { color: colors.textPrimary }]}>{BRACHA}</Text>
            </View>
            <Text style={[typography.small, { color: colors.textMuted, marginTop: spacing.sm }]}>
              לפני הבדיקה (אור ל-י"ד בניסן)
            </Text>
          </Card>

          {items.map((item, i) => {
            const isDone = !!state.checked[item.id];
            return (
              <View key={item.id} style={[styles.row, isDone && { opacity: 0.7 }]}>
                <Pressable onPress={() => toggle(item.id)} style={[styles.cb, isDone && styles.cbDone]}>
                  {isDone && <Text style={{ color: colors.textInverse, fontWeight: '700' }}>✓</Text>}
                </Pressable>
                <Pressable onPress={() => toggle(item.id)} style={{ flex: 1 }}>
                  <Text style={[typography.body, { color: colors.textPrimary, textDecorationLine: isDone ? 'line-through' : 'none' }]}>
                    {i + 1}. {item.label}
                  </Text>
                  {item.custom && (
                    <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>(מקום מותאם אישית)</Text>
                  )}
                </Pressable>
                {item.custom && (
                  <Pressable onPress={() => removeCustom(item.id)} hitSlop={10}>
                    <Text style={{ color: colors.danger, fontSize: 18 }}>✕</Text>
                  </Pressable>
                )}
              </View>
            );
          })}

          <Card>
            <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>הוסף מקום לבדוק</Text>
            <Text style={[typography.small, { color: colors.textMuted, marginTop: 2, marginBottom: spacing.sm }]}>
              לדוגמא: "מגירת התרופות", "תיק העבודה", "מתחת לכיריים"
            </Text>
            <View style={{ flexDirection: 'row-reverse', gap: spacing.sm }}>
              <TextInput
                value={newLocation}
                onChangeText={setNewLocation}
                placeholder="שם המקום..."
                placeholderTextColor={colors.textMuted}
                style={[styles.input, { flex: 1 }]}
                textAlign="right"
                onSubmitEditing={addCustomLocation}
                returnKeyType="done"
              />
              <Pressable
                onPress={addCustomLocation}
                disabled={!newLocation.trim()}
                style={[styles.addBtn, !newLocation.trim() && { opacity: 0.5 }]}
              >
                <Text style={[typography.bodyBold, { color: colors.textInverse }]}>+ הוסף</Text>
              </Pressable>
            </View>
          </Card>

          <Card>
            <Text style={[typography.h3, { color: colors.textPrimary, marginBottom: spacing.sm }]}>
              ביטול חמץ - בלילה
            </Text>
            <View style={styles.brachaBox}>
              <Text style={[typography.sacred, { color: colors.textPrimary }]}>{BITUL_LAYLA}</Text>
            </View>
            <Text style={[typography.small, { color: colors.textMuted, marginTop: spacing.sm }]}>
              אחרי הבדיקה, באור ל-י"ד בניסן.
            </Text>
          </Card>

          <Card>
            <Text style={[typography.h3, { color: colors.textPrimary, marginBottom: spacing.sm }]}>
              ביטול חמץ - ביום
            </Text>
            <View style={styles.brachaBox}>
              <Text style={[typography.sacred, { color: colors.textPrimary }]}>{BITUL_YOM}</Text>
            </View>
            <Text style={[typography.small, { color: colors.textMuted, marginTop: spacing.sm }]}>
              ביום י"ד בניסן, אחרי שריפת החמץ (לפני סוף זמן אכילת חמץ).
            </Text>
          </Card>

          <View style={{ flexDirection: 'row-reverse', gap: spacing.sm, flexWrap: 'wrap' }}>
            <Button label="↻ אפס סימונים" onPress={resetChecks} variant="secondary" style={{ flexGrow: 1, minWidth: 140 }} />
            <Button label="🗑 אפס הכל" onPress={resetAll} variant="ghost" style={{ flexGrow: 1, minWidth: 140 }} />
          </View>
        </View>

        <View style={{ height: 40 }} />
      </KeyboardScroll>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: { padding: spacing.lg },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cb: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  cbDone: { backgroundColor: colors.success, borderColor: colors.success },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.surface,
  },
  brachaBox: {
    padding: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: colors.bg,
  },
  addBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
