import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable, Image, TextInput, Alert, Linking, Platform } from 'react-native';
import { KeyboardScroll } from '../../src/components/KeyboardScroll';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
// Audio removed: expo-av deprecated. Stub.
const Audio : any /* was Audio.Sound */ = { Sound: { createAsync: async () => ({ sound: { playAsync: async () => {}, unloadAsync: async () => {} } }) }, setAudioModeAsync: async () => {} };
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { Pill } from '../../src/components/Pill';
import { useStoredJSON } from '../../src/hooks/useStoredJSON';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

const KEY_RABBANIM = '@yahadut/rabbanim-list';
const KEY_PRESETS = '@yahadut/photo-presets';

type Rabbi = { id: string; name: string; method: 'whatsapp' | 'email'; contact: string };

const DEFAULT_PRESETS = [
  'ארבעת המינים - בדיקה',
  'בעיה בכלים (טריפה / נטילה)',
  'שאלת נדה',
  'שאלת ברית מילה',
  'בקשת ברכה',
  'שאלה כללית',
];

export default function PhotoToRabbiScreen() {
  const router = useRouter();
  const [photo, setPhoto] = useState<string | null>(null);
  const [audio, setAudio] = useState<string | null>(null);
  const [recording, setRecording] = useState<any | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [playing, setPlaying] = useState< { playAsync: any; unloadAsync: any; pauseAsync?: any; stopAsync? : any /* was Audio.Sound */ } | null>(null);
  const [question, setQuestion] = useState('');
  const [topic, setTopic] = useState<string | null>(null);
  // Default contact pre-populates the rabbanim list on first run so users
  // have a working "send" target even before they add their own rabbi.
  const DEFAULT_RABBANIM: Rabbi[] = [
    { id: 'default-shtibel', name: 'הרב מכון כושרות (שטיבל)', method: 'whatsapp', contact: '0548366450' },
  ];
  const [rabbanim, setRabbanim] = useStoredJSON<Rabbi[]>(KEY_RABBANIM, DEFAULT_RABBANIM);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newMethod, setNewMethod] = useState<'whatsapp' | 'email'>('whatsapp');
  const [newContact, setNewContact] = useState('');

  useEffect(() => {
    return () => {
      if (playing) playing.unloadAsync();
      if (recording) recording.stopAndUnloadAsync();
    };
  }, []);

  async function startRecording() {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('הרשאת מיקרופון נדחתה');
        return;
      }
      Alert.alert('הקלטת קול לא נתמכת בגרסה זו', 'תוכל לשלוח תמונה במקום.');
      return;
      // Audio recording disabled - expo-av deprecated.
      // eslint-disable-next-line no-unreachable
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const rec: any = {};
      await rec.prepareToRecordAsync();
      await rec.startAsync();
      setRecording(rec);
      setRecordingDuration(0);
      const interval = setInterval(async () => {
        const st = await rec.getStatusAsync();
        if (st.isRecording) setRecordingDuration(Math.floor((st.durationMillis ?? 0) / 1000));
        else clearInterval(interval);
      }, 500);
    } catch (e: any) {
      Alert.alert('שגיאה', String(e?.message ?? e));
    }
  }

  async function stopRecording() {
    if (!recording) return;
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setAudio(uri);
      setRecording(null);
    } catch (e: any) {
      Alert.alert('שגיאה', String(e?.message ?? e));
    }
  }

  async function playAudio() {
    if (!audio) return;
    if (playing) {
      await playing.unloadAsync();
      setPlaying(null);
      return;
    }
    const { sound } = await Audio.Sound.createAsync({ uri: audio });
    setPlaying(sound);
    await sound.playAsync();
    sound.setOnPlaybackStatusUpdate((status: any) => {
      if (status.didJustFinish) {
        sound.unloadAsync();
        setPlaying(null);
      }
    });
  }

  async function pickFromCamera() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('הרשאת מצלמה נדחתה');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7, allowsEditing: true });
    if (!result.canceled && result.assets[0]) setPhoto(result.assets[0].uri);
  }

  async function pickFromGallery() {
    // launchImageLibraryAsync uses Android Photo Picker — no permission needed.
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7, allowsEditing: true });
    if (!result.canceled && result.assets[0]) setPhoto(result.assets[0].uri);
  }

  function addRabbi() {
    if (!newName.trim() || !newContact.trim()) {
      Alert.alert('יש למלא שם ופרטי קשר');
      return;
    }
    const r: Rabbi = {
      id: String(Date.now()),
      name: newName.trim(),
      method: newMethod,
      contact: newContact.trim(),
    };
    setRabbanim((arr) => [...arr, r]);
    setNewName('');
    setNewContact('');
    setShowAdd(false);
  }

  function removeRabbi(id: string) {
    Alert.alert('הסרה', 'להסיר רב מהרשימה?', [
      { text: 'ביטול', style: 'cancel' },
      { text: 'הסר', style: 'destructive', onPress: () => setRabbanim((arr) => arr.filter((r) => r.id !== id)) },
    ]);
  }

  async function send(rabbi: Rabbi) {
    const subject = topic || 'שאלה';
    const body = `שלום הרב,\n\n${question.trim() || '(אנא ראה תמונה)'}\n\n${photo ? '[התמונה תישלח בנפרד]' : ''}\n\nבברכה`;

    if (rabbi.method === 'whatsapp') {
      const phone = rabbi.contact.replace(/[^0-9+]/g, '');
      const text = encodeURIComponent(body);
      const url = `https://wa.me/${phone}?text=${text}`;
      try {
        await Linking.openURL(url);
        if (photo) {
          Alert.alert('לב לב', 'הודעת הטקסט נשלחה. כעת צרף את התמונה ב-WhatsApp ידנית מהגלריה.');
        }
      } catch {
        Alert.alert('לא ניתן לפתוח את WhatsApp');
      }
    } else {
      const url = `mailto:${rabbi.contact}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      try {
        await Linking.openURL(url);
        if (photo) {
          Alert.alert('שים לב', 'הדוא"ל נפתח. צרף את התמונה מהגלריה ידנית.');
        }
      } catch {
        Alert.alert('לא ניתן לפתוח את הדוא"ל');
      }
    }
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
        <ScreenHeader title="שלח שאלה לרב" subtitle="תמונה + טקסט ב-WhatsApp / דוא״ל" />

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          <Card>
            <Text style={[typography.h3, { color: colors.textPrimary }]}>תמונה (אופציונלי)</Text>
            {photo ? (
              <View style={{ marginTop: spacing.md }}>
                <Image source={{ uri: photo }} style={styles.preview} />
                <Pressable onPress={() => setPhoto(null)} style={{ marginTop: spacing.sm }}>
                  <Text style={[typography.caption, { color: colors.danger, textAlign: 'center' }]}>הסר תמונה</Text>
                </Pressable>
              </View>
            ) : (
              <View style={{ flexDirection: 'row-reverse', gap: spacing.sm, marginTop: spacing.sm }}>
                <Button label="📷 מצלמה" onPress={pickFromCamera} variant="secondary" style={{ flex: 1 }} fullWidth />
                <Button label="🖼️ גלריה" onPress={pickFromGallery} variant="secondary" style={{ flex: 1 }} fullWidth />
              </View>
            )}
          </Card>

          <Card>
            <Text style={[typography.h3, { color: colors.textPrimary }]}>הקלטה (אופציונלי)</Text>
            {recording ? (
              <View style={{ marginTop: spacing.sm, alignItems: 'center' }}>
                <Text style={{ fontSize: 48 }}>🎙️</Text>
                <Text style={[typography.h2, { color: colors.danger, marginTop: spacing.sm }]}>
                  ●  {Math.floor(recordingDuration / 60)}:{String(recordingDuration % 60).padStart(2, '0')}
                </Text>
                <View style={{ marginTop: spacing.md }}>
                  <Button label="⏹ הפסק" onPress={stopRecording} variant="danger" />
                </View>
              </View>
            ) : audio ? (
              <View style={{ marginTop: spacing.sm }}>
                <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm }}>
                  <Text style={{ fontSize: 32 }}>🔊</Text>
                  <Text style={[typography.body, { color: colors.textPrimary, flex: 1 }]}>הקלטה מוכנה</Text>
                </View>
                <View style={{ flexDirection: 'row-reverse', gap: spacing.sm, marginTop: spacing.md }}>
                  <Button label={playing ? '⏸ עצור' : '▶ נגן'} onPress={playAudio} variant="secondary" style={{ flex: 1 }} fullWidth />
                  <Button label="🗑 מחק" onPress={() => setAudio(null)} variant="ghost" />
                </View>
              </View>
            ) : (
              <View style={{ marginTop: spacing.sm }}>
                <Button label="🎙️ התחל הקלטה" onPress={startRecording} variant="secondary" fullWidth />
              </View>
            )}
          </Card>

          <Card>
            <Text style={[typography.h3, { color: colors.textPrimary }]}>נושא</Text>
            <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6, marginTop: spacing.sm }}>
              {DEFAULT_PRESETS.map((p) => (
                <Pressable key={p} onPress={() => setTopic(topic === p ? null : p)} style={[styles.preset, topic === p && styles.presetActive]}>
                  <Text style={[typography.caption, { color: topic === p ? colors.textInverse : colors.textPrimary }]}>{p}</Text>
                </Pressable>
              ))}
            </View>
          </Card>

          <Card>
            <Text style={[typography.h3, { color: colors.textPrimary }]}>השאלה</Text>
            <TextInput
              value={question}
              onChangeText={setQuestion}
              placeholder="הקלד את שאלתך..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={5}
              style={[styles.input, { minHeight: 120, textAlignVertical: 'top' }]}
            />
          </Card>

          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={[typography.h3, { color: colors.textPrimary }]}>רבני קשר</Text>
            <Pressable onPress={() => setShowAdd(!showAdd)} hitSlop={10}>
              <Text style={[typography.bodyBold, { color: colors.primary }]}>{showAdd ? 'בטל' : '+ הוסף רב'}</Text>
            </Pressable>
          </View>

          {showAdd && (
            <Card>
              <TextInput value={newName} onChangeText={setNewName} placeholder="שם הרב" placeholderTextColor={colors.textMuted} style={styles.input} />
              <View style={{ flexDirection: 'row-reverse', gap: spacing.sm, marginTop: spacing.sm }}>
                <Pressable onPress={() => setNewMethod('whatsapp')} style={[styles.tab, newMethod === 'whatsapp' && styles.tabActive]}>
                  <Text style={[typography.body, { color: newMethod === 'whatsapp' ? colors.textInverse : colors.textPrimary }]}>WhatsApp</Text>
                </Pressable>
                <Pressable onPress={() => setNewMethod('email')} style={[styles.tab, newMethod === 'email' && styles.tabActive]}>
                  <Text style={[typography.body, { color: newMethod === 'email' ? colors.textInverse : colors.textPrimary }]}>דוא״ל</Text>
                </Pressable>
              </View>
              <TextInput
                value={newContact}
                onChangeText={setNewContact}
                placeholder={newMethod === 'whatsapp' ? '+972501234567' : 'rabbi@example.com'}
                placeholderTextColor={colors.textMuted}
                keyboardType={newMethod === 'whatsapp' ? 'phone-pad' : 'email-address'}
                style={[styles.input, { marginTop: spacing.sm }]}
              />
              <View style={{ marginTop: spacing.md }}>
                <Button label="הוסף לרשימה" onPress={addRabbi} fullWidth />
              </View>
            </Card>
          )}

          {rabbanim.length === 0 ? (
            <Card>
              <Text style={[typography.body, { color: colors.textMuted, textAlign: 'center' }]}>
                אין רבנים שמורים. הוסף רב אחד או יותר.
              </Text>
            </Card>
          ) : (
            rabbanim.map((r) => (
              <Card key={r.id}>
                <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.h3, { color: colors.textPrimary }]}>{r.name}</Text>
                    <View style={{ flexDirection: 'row-reverse', gap: 4, marginTop: 4 }}>
                      <Pill label={r.method === 'whatsapp' ? '💬 WhatsApp' : '✉️ דוא״ל'} tone="default" />
                      <Text style={[typography.small, { color: colors.textMuted }]}>{r.contact}</Text>
                    </View>
                  </View>
                </View>
                <View style={{ flexDirection: 'row-reverse', gap: spacing.sm, marginTop: spacing.md }}>
                  <Button label={`שלח ${r.method === 'whatsapp' ? 'בWhatsApp' : 'בדוא״ל'}`} onPress={() => send(r)} variant="primary" style={{ flex: 1 }} fullWidth />
                  <Pressable onPress={() => removeRabbi(r.id)} hitSlop={6}>
                    <Text style={[typography.caption, { color: colors.danger }]}>הסר</Text>
                  </Pressable>
                </View>
              </Card>
            ))
          )}

          <Card variant="accent">
            <Text style={[typography.body, { color: colors.primaryDark, opacity: 0.85 }]}>
              💡 הערה: ב-WhatsApp / דוא״ל - הטקסט נשלח אוטומטית, התמונה צריך לצרף ידנית מהגלריה אחרי שהאפליקציה נפתחת.
            </Text>
          </Card>
        </View>

        <View style={{ height: 40 }} />
      </KeyboardScroll>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: { padding: spacing.lg },
  preview: { width: '100%', height: 200, borderRadius: radius.md, resizeMode: 'cover' },
  preset: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  presetActive: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
  input: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 16,
    color: colors.textPrimary,
    textAlign: 'right',
    backgroundColor: colors.bg,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
});
