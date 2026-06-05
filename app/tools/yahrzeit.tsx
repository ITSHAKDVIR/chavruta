import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View } from 'react-native';
import { KeyboardScroll } from '../../src/components/KeyboardScroll';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { Pill } from '../../src/components/Pill';
import {
  addYahrzeit,
  aveilusDaysRemaining,
  daysUntil,
  deleteYahrzeit,
  HEB_MONTHS,
  hebrewDateLabel,
  isInAveilus,
  loadYahrzeits,
  nextYahrzeitDate,
  RELATIONS,
  Yahrzeit,
  yearsSince,
} from '../../src/services/yahrzeit';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

const KADDISH_HE = `יִתְגַּדַּל וְיִתְקַדַּשׁ שְׁמֵהּ רַבָּא (אמן). בְּעָלְמָא דִּי בְרָא כִרְעוּתֵהּ, וְיַמְלִיךְ מַלְכוּתֵהּ, וְיַצְמַח פֻּרְקָנֵהּ, וִיקָרֵב מְשִׁיחֵהּ (אמן). בְּחַיֵּיכוֹן וּבְיוֹמֵיכוֹן וּבְחַיֵּי דְכָל בֵּית יִשְׂרָאֵל, בַּעֲגָלָא וּבִזְמַן קָרִיב, וְאִמְרוּ אָמֵן (אמן).
יְהֵא שְׁמֵהּ רַבָּא מְבָרַךְ לְעָלַם וּלְעָלְמֵי עָלְמַיָּא.
יִתְבָּרַךְ וְיִשְׁתַּבַּח וְיִתְפָּאַר וְיִתְרוֹמַם וְיִתְנַשֵּׂא וְיִתְהַדָּר וְיִתְעַלֶּה וְיִתְהַלָּל שְׁמֵהּ דְּקֻדְשָׁא בְּרִיךְ הוּא (אמן), לְעֵלָּא מִן כָּל בִּרְכָתָא וְשִׁירָתָא תֻּשְׁבְּחָתָא וְנֶחָמָתָא דַּאֲמִירָן בְּעָלְמָא, וְאִמְרוּ אָמֵן (אמן).`;

export default function YahrzeitScreen() {
  const router = useRouter();
  const [list, setList] = useState<Yahrzeit[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showKaddish, setShowKaddish] = useState(false);

  const reload = useCallback(async () => {
    setList(await loadYahrzeits());
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  // Sort by upcoming
  const sorted = [...list].sort((a, b) => daysUntil(a) - daysUntil(b));

  function confirmDelete(yz: Yahrzeit) {
    Alert.alert(
      'מחיקת יארצייט',
      `למחוק את היארצייט של ${yz.name}?`,
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'מחק',
          style: 'destructive',
          onPress: async () => {
            await deleteYahrzeit(yz.id);
            await reload();
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={[typography.bodyBold, { color: colors.primary }]}>‹ חזרה</Text>
        </Pressable>
      </View>

      <KeyboardScroll contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        <ScreenHeader title="יארצייט וקדיש" subtitle="מעקב + תזכורות" />

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          <View style={{ flexDirection: 'row-reverse', gap: spacing.sm }}>
            <Button
              label="+ יארצייט חדש"
              onPress={() => setShowAdd(true)}
              variant="primary"
              style={{ flex: 1 }}
            />
            <Button
              label="📖 נוסח הקדיש"
              onPress={() => setShowKaddish(true)}
              variant="secondary"
              style={{ flex: 1 }}
            />
          </View>

          {sorted.length === 0 && (
            <Card variant="accent">
              <Text style={[typography.body, { color: colors.primaryDark }]}>
                עדיין לא הוספת יארצייט. לחץ על "יארצייט חדש" כדי להתחיל.
              </Text>
              <Text
                style={[
                  typography.caption,
                  { color: colors.primaryDark, marginTop: spacing.sm, opacity: 0.8 },
                ]}
              >
                האפליקציה תשלח תזכורת ערב היארצייט ובבוקר היארצייט עצמו.
              </Text>
            </Card>
          )}

          {sorted.map((yz) => {
            const days = daysUntil(yz);
            const next = nextYahrzeitDate(yz);
            const years = yearsSince(yz);
            const aveilusDays = aveilusDaysRemaining(yz);
            const inAveilus = isInAveilus(yz);
            const isTodayOrSoon = days <= 2;
            return (
              <Card key={yz.id} variant={isTodayOrSoon ? 'primary' : 'default'}>
                <View
                  style={{
                    flexDirection: 'row-reverse',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        typography.h3,
                        { color: isTodayOrSoon ? colors.textInverse : colors.textPrimary },
                      ]}
                    >
                      🕯️ {yz.name}
                    </Text>
                    <Text
                      style={[
                        typography.caption,
                        {
                          color: isTodayOrSoon ? colors.textInverse : colors.textMuted,
                          opacity: 0.85,
                          marginTop: 2,
                        },
                      ]}
                    >
                      {yz.relation}
                      {yz.parentName ? ` בן/בת ${yz.parentName}` : ''}
                    </Text>
                  </View>
                  <Pressable onPress={() => confirmDelete(yz)} hitSlop={10}>
                    <Text
                      style={[
                        typography.bodyBold,
                        { color: isTodayOrSoon ? colors.textInverse : colors.danger },
                      ]}
                    >
                      🗑
                    </Text>
                  </Pressable>
                </View>

                <View style={{ marginTop: spacing.md, gap: spacing.xs }}>
                  <View style={styles.row}>
                    <Text
                      style={[
                        typography.body,
                        { color: isTodayOrSoon ? colors.textInverse : colors.textPrimary },
                      ]}
                    >
                      📅 {hebrewDateLabel(yz.hebMonth, yz.hebDay)}
                    </Text>
                    <Text
                      style={[
                        typography.body,
                        { color: isTodayOrSoon ? colors.textInverse : colors.textPrimary },
                      ]}
                    >
                      {next.toLocaleDateString('he-IL')}
                    </Text>
                  </View>
                  <View style={styles.row}>
                    <Text
                      style={[
                        typography.body,
                        { color: isTodayOrSoon ? colors.textInverse : colors.textPrimary },
                      ]}
                    >
                      ⏳{' '}
                      {days === 0
                        ? 'היום!'
                        : days === 1
                        ? 'מחר'
                        : days < 0
                        ? `לפני ${-days} ימים`
                        : `בעוד ${days} ימים`}
                    </Text>
                    {years !== null && (
                      <Pill
                        label={`${years} שנים`}
                        tone={isTodayOrSoon ? 'success' : 'default'}
                      />
                    )}
                  </View>
                  {inAveilus && aveilusDays !== null && aveilusDays > 0 && (
                    <View
                      style={[
                        styles.row,
                        {
                          marginTop: spacing.xs,
                          paddingTop: spacing.xs,
                          borderTopWidth: 1,
                          borderTopColor: isTodayOrSoon
                            ? 'rgba(255,255,255,0.3)'
                            : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          typography.caption,
                          {
                            color: isTodayOrSoon ? colors.textInverse : colors.primary,
                            fontWeight: '700',
                          },
                        ]}
                      >
                        אבלות י"א חודש: עוד {aveilusDays} ימים
                      </Text>
                    </View>
                  )}
                </View>
              </Card>
            );
          })}

          <Card variant="accent">
            <Text style={[typography.bodyBold, { color: colors.primaryDark }]}>💡 מנהגי היארצייט</Text>
            <Text
              style={[
                typography.body,
                { color: colors.primaryDark, opacity: 0.85, marginTop: spacing.sm },
              ]}
            >
              ⊙ הדלקת נר נשמה - מערב התאריך עד למחרת בערב.
              {'\n'}⊙ אמירת קדיש - בכל שלוש התפילות של היום.
              {'\n'}⊙ עליה לתורה במנחה (אם יום קריאה).
              {'\n'}⊙ לימוד משניות לעילוי נשמה.
              {'\n'}⊙ צדקה לעילוי נשמה.
              {'\n'}⊙ ביקור בקבר אם אפשר.
            </Text>
          </Card>
        </View>
      </KeyboardScroll>

      {showAdd && (
        <AddYahrzeitModal
          onClose={() => setShowAdd(false)}
          onSaved={async () => {
            await reload();
            setShowAdd(false);
          }}
        />
      )}

      {showKaddish && (
        <Modal animationType="slide" transparent onRequestClose={() => setShowKaddish(false)}>
          <View style={styles.modalBg}>
            <View style={styles.modalBox}>
              <Text style={[typography.h2, { color: colors.textPrimary }]}>קדיש יתום</Text>
              <KeyboardScroll style={{ maxHeight: 400, marginTop: spacing.md }}>
                <Text style={[typography.sacred, { color: colors.textPrimary, lineHeight: 32 }]}>
                  {KADDISH_HE}
                </Text>
              </KeyboardScroll>
              <Button label="סגור" onPress={() => setShowKaddish(false)} variant="primary" />
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

function AddYahrzeitModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState('');
  const [parentName, setParentName] = useState('');
  const [relation, setRelation] = useState(RELATIONS[0]);
  const [month, setMonth] = useState<number>(HEB_MONTHS[0].value);
  const [day, setDay] = useState<string>('');
  const [yearOfDeath, setYearOfDeath] = useState<string>('');
  const [remindEve, setRemindEve] = useState(true);
  const [remindMorning, setRemindMorning] = useState(true);

  async function save() {
    const d = parseInt(day, 10);
    if (!name.trim() || isNaN(d) || d < 1 || d > 30) {
      Alert.alert('שגיאה', 'נא למלא שם ויום (1-30).');
      return;
    }
    await addYahrzeit({
      name: name.trim(),
      parentName: parentName.trim() || undefined,
      relation,
      hebMonth: month,
      hebDay: d,
      hebYearOfDeath: yearOfDeath ? parseInt(yearOfDeath, 10) : undefined,
      remindEve,
      remindMorning,
    });
    onSaved();
  }

  return (
    <Modal animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBg}>
        <View style={styles.modalBox}>
          <KeyboardScroll contentContainerStyle={{ paddingBottom: spacing.lg }}>
            <Text style={[typography.h2, { color: colors.textPrimary }]}>יארצייט חדש</Text>

            <Text style={[typography.bodyBold, { marginTop: spacing.md, color: colors.textPrimary }]}>
              שם הנפטר/ת
            </Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="לדוגמה: יעקב בן יצחק"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={[typography.bodyBold, { marginTop: spacing.sm, color: colors.textPrimary }]}>
              שם האב (לקדיש)
            </Text>
            <TextInput
              style={styles.input}
              value={parentName}
              onChangeText={setParentName}
              placeholder="לא חובה"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={[typography.bodyBold, { marginTop: spacing.sm, color: colors.textPrimary }]}>
              קרבה
            </Text>
            <View style={{ flexDirection: 'row-reverse', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
              {RELATIONS.map((r) => (
                <Pressable
                  key={r}
                  onPress={() => setRelation(r)}
                  style={[styles.chip, relation === r && styles.chipActive]}
                >
                  <Text
                    style={[
                      typography.caption,
                      { color: relation === r ? colors.textInverse : colors.textPrimary },
                    ]}
                  >
                    {r}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={[typography.bodyBold, { marginTop: spacing.sm, color: colors.textPrimary }]}>
              חודש פטירה
            </Text>
            <View style={{ flexDirection: 'row-reverse', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
              {HEB_MONTHS.map((m) => (
                <Pressable
                  key={m.value}
                  onPress={() => setMonth(m.value)}
                  style={[styles.chip, month === m.value && styles.chipActive]}
                >
                  <Text
                    style={[
                      typography.caption,
                      { color: month === m.value ? colors.textInverse : colors.textPrimary },
                    ]}
                  >
                    {m.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={[typography.bodyBold, { marginTop: spacing.sm, color: colors.textPrimary }]}>
              יום בחודש
            </Text>
            <TextInput
              style={styles.input}
              value={day}
              onChangeText={setDay}
              placeholder="1-30"
              keyboardType="number-pad"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={[typography.bodyBold, { marginTop: spacing.sm, color: colors.textPrimary }]}>
              שנת פטירה עברית (לא חובה)
            </Text>
            <TextInput
              style={styles.input}
              value={yearOfDeath}
              onChangeText={setYearOfDeath}
              placeholder="למשל 5780"
              keyboardType="number-pad"
              placeholderTextColor={colors.textMuted}
            />

            <Pressable
              onPress={() => setRemindEve((v) => !v)}
              style={styles.toggleRow}
            >
              <Text style={[typography.body, { color: colors.textPrimary }]}>
                🕯️ תזכורת בערב היארצייט
              </Text>
              <Pill label={remindEve ? 'דלוקה' : 'כבויה'} tone={remindEve ? 'success' : 'default'} />
            </Pressable>
            <Pressable
              onPress={() => setRemindMorning((v) => !v)}
              style={styles.toggleRow}
            >
              <Text style={[typography.body, { color: colors.textPrimary }]}>
                🌅 תזכורת בבוקר היארצייט
              </Text>
              <Pill
                label={remindMorning ? 'דלוקה' : 'כבויה'}
                tone={remindMorning ? 'success' : 'default'}
              />
            </Pressable>

            <View style={{ flexDirection: 'row-reverse', gap: spacing.sm, marginTop: spacing.md }}>
              <Button label="ביטול" onPress={onClose} variant="secondary" style={{ flex: 1 }} />
              <Button label="שמור" onPress={save} variant="primary" style={{ flex: 1 }} />
            </View>
          </KeyboardScroll>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: { padding: spacing.lg },
  row: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: 4,
    fontSize: 16,
    color: colors.textPrimary,
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    maxHeight: '90%',
  },
});
