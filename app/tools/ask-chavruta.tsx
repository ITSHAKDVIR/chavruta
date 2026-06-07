/**
 * עוזר הכשרות החכם — לקוח native מלא של הצ'אט של כושרות.
 *
 * תומך בכל היכולות של chat-page.js שבאתר:
 *   ✓ 4 נושאים (חרקים / כללי / מומלצים / סימולטור)
 *   ✓ העלאת תמונת מוצר ב"מומלצים" (מצלמה/גלריה)
 *   ✓ זיהוי מוצר אוטומטי + שליחה כשאלה
 *   ✓ continuation flow למוצר חלקי
 *   ✓ הצגת מוצרי IKR מובנים
 *   ✓ סימולטור עם כפתורי אופציות
 *   ✓ אישור היסטוריה לסימולטור (needsConfirm)
 *   ✓ אנימציית הקלדה הדרגתית
 *   ✓ Markdown מלא + טאגי [P]/[K]/[G]/[N] של recommendations
 *   ✓ קישורי web ו-YouTube
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon } from '../../src/components/Icon';
import { BotMessage, Topic } from '../../src/components/BotMessage';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

const CHAT_URL = 'https://www.kosharot.co.il/loadedFiles/chat-service.php';
const SIM_URL = 'https://www.kosharot.co.il/loadedFiles/sim-service.php';
const REC_URL = 'https://www.kosharot.co.il/recommendationsBot_v2.php';

type IkrProduct = { name: string; url?: string; factoryName?: string; kosherBy?: string };
type IkrSection = { title?: string; products: IkrProduct[]; moreUrl?: string; moreLabel?: string };
type WebLink = { title: string; url: string };
type ConfirmHistoryItem = { q?: string; a: string };

type Msg = {
  role: 'user' | 'bot';
  text: string;
  options?: { text: string }[];
  ikrProducts?: IkrSection;
  webLinks?: WebLink[];
  youtubeLinks?: WebLink[];
  /** Sim confirm payload — when present, render confirm buttons. */
  confirm?: {
    history: ConfirmHistoryItem[];
    pageId: any;
  };
  /** A user message that's just a thumbnail of a sent image (no text). */
  imageUri?: string;
};

const TOPICS: { id: Topic; name: string }[] = [
  { id: 'bugs', name: 'בדיקת חרקים' },
  { id: 'general', name: 'שאלות כלליות' },
  { id: 'recommendations', name: 'מומלצים' },
  { id: 'simulator', name: 'סימולטור' },
];

const WELCOME: Record<Topic, string> = {
  bugs: 'שלום! אני כאן לעזור בכל שאלה הנוגעת לבדיקת חרקים במזון. איך אוכל לסייע?',
  general: 'שלום! אני מכיר היטב את ספר כושרות ואת מאמרי אתר כושרות — שאלו ואמצא לכם את הקטע הרלוונטי.',
  recommendations: 'שלום! אני כאן לעזור למצוא מוצרים ועסקים מומלצים לכל השנה. שאלו על מוצר, כשרות, מסעדה, או צלמו את האריזה.',
  simulator: 'ברוכים הבאים לסימולטור הכשרות — תארו לי את התקלה שקרתה במטבח (לדוגמה: "הכנסתי כף בשרית לקדרה חלבית"), ואני אדריך אתכם שלב אחר שלב לפי ההלכה.',
};

export default function AskChavrutaScreen() {
  const router = useRouter();
  // Allow callers (e.g. kashering-simulator route) to deep-link into a
  // specific topic via ?topic=simulator|bugs|recommendations.
  const { topic: topicParam } = useLocalSearchParams<{ topic?: string }>();
  const initialTopic: Topic = (['bugs', 'general', 'recommendations', 'simulator'].includes(topicParam || '')
    ? (topicParam as Topic)
    : 'general');
  const [topic, setTopic] = useState<Topic>(initialTopic);
  const [messages, setMessages] = useState<Msg[]>([{ role: 'bot', text: WELCOME[initialTopic] || WELCOME.general }]);
  // When the screen opens DIRECTLY on the simulator topic (deep link from
  // the kashering tool), the simulator never gets initialized — switchTopic
  // only runs on chip clicks. Kick off the same bootstrap on mount.
  const didBootstrap = useRef(false);
  useEffect(() => {
    if (initialTopic !== 'simulator' || didBootstrap.current) return;
    didBootstrap.current = true;
    (async () => {
      setLoading(true);
      try {
        const r = await fetch(SIM_URL, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: '', simPageId: null, simHistory: [] }),
        });
        const data = await r.json();
        if (data.simPageId !== undefined) setSimPageId(data.simPageId);
        if (data.simHistory !== undefined) setSimHistory(data.simHistory);
        setMessages([{ role: 'bot', text: data.response || WELCOME.simulator, options: data.options || [] }]);
      } catch (e: any) {
        setMessages([{ role: 'bot', text: '⚠️ שגיאה: ' + (e?.message || 'לא ניתן') }]);
      } finally { setLoading(false); }
    })();
  }, [initialTopic]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [simPageId, setSimPageId] = useState<any>(null);
  const [simHistory, setSimHistory] = useState<any[]>([]);
  /** When the bot returns `partial` we save these so the next user message
      auto-extends the previous question with the answer. */
  const [pendingProductName, setPendingProductName] = useState<string | null>(null);
  const [pendingKosher, setPendingKosher] = useState<string | null>(null);
  const [pendingMissing, setPendingMissing] = useState<string | null>(null);
  /** Images user has staged but not yet sent. */
  const [stagedImages, setStagedImages] = useState<{ uri: string; b64: string }[]>([]);
  const scrollRef = useRef<any>(null);
  const insets = useSafeAreaInsets();

  async function switchTopic(newTopic: Topic) {
    setTopic(newTopic);
    setThreadId(null); setSimPageId(null); setSimHistory([]);
    setPendingProductName(null); setPendingKosher(null); setPendingMissing(null);
    setStagedImages([]); setInput('');
    if (newTopic === 'simulator') {
      setMessages([]); setLoading(true);
      try {
        const r = await fetch(SIM_URL, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: '', simPageId: null, simHistory: [] }),
        });
        const data = await r.json();
        if (data.simPageId !== undefined) setSimPageId(data.simPageId);
        if (data.simHistory !== undefined) setSimHistory(data.simHistory);
        setMessages([{ role: 'bot', text: data.response || '', options: data.options || [] }]);
      } catch (e: any) {
        setMessages([{ role: 'bot', text: '⚠️ שגיאה: ' + (e?.message || 'לא ניתן') }]);
      } finally { setLoading(false); }
    } else {
      setMessages([{ role: 'bot', text: WELCOME[newTopic] }]);
    }
  }

  /** Pick an image from camera or library and stage it for sending. */
  async function pickImage(useCamera: boolean) {
    try {
      const ImagePicker: any = await import('expo-image-picker');
      if (useCamera) {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (perm.status !== 'granted') { Alert.alert('הרשאה נדחתה'); return; }
      }
      // launchImageLibraryAsync uses Android Photo Picker — no permission needed.
      const opts = { base64: true, quality: 0.7 as const };
      const res = useCamera
        ? await ImagePicker.launchCameraAsync(opts)
        : await ImagePicker.launchImageLibraryAsync(opts);
      if (!res.canceled && res.assets?.[0]) {
        const a = res.assets[0];
        let b64 = a.base64 ?? '';
        // If original > 8MB, resize to 2048px max
        if ((a.fileSize ?? 0) > 8 * 1024 * 1024) {
          const IM: any = await import('expo-image-manipulator');
          const r = await IM.manipulateAsync(a.uri, [{ resize: { width: 2048 } }], { compress: 0.95, format: IM.SaveFormat.JPEG, base64: true });
          b64 = r.base64 ?? b64;
        }
        setStagedImages((arr) => [...arr, { uri: a.uri, b64 }]);
      }
    } catch (e: any) { Alert.alert('שגיאה', e?.message || 'בעיה'); }
  }

  function removeStaged(idx: number) {
    setStagedImages((arr) => arr.filter((_, i) => i !== idx));
  }

  /** Send staged images for product analysis. Implements the same status-handling
      flow as analyzeImage() in chat-page.js. */
  async function sendImages() {
    if (stagedImages.length === 0 || loading) return;
    setLoading(true);
    const images = stagedImages.map((s) => s.b64);
    const previewUris = stagedImages.map((s) => s.uri);
    setStagedImages([]);
    // Show user's images as a message
    setMessages((m) => [...m, ...previewUris.map((u) => ({ role: 'user' as const, text: '', imageUri: u }))]);

    try {
      const isCont = pendingProductName !== null;
      const r = await fetch(CHAT_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          topic: 'analyzeImage',
          images,
          message: '',
          continuationProduct: isCont ? pendingProductName : null,
          continuationKosher: isCont ? pendingKosher : null,
          continuationMissing: isCont ? pendingMissing : null,
        }),
      });
      if (!r.ok) throw new Error('שרת ' + r.status);
      const data = await r.json();

      if (data.status === 'certificate') {
        // It's a kashrut certificate — auto-send query with business name + address
        setPendingProductName(null); setPendingKosher(null); setPendingMissing(null);
        const q = `${data.business || ''} ${data.address || ''} [מקור:תמונה]`.trim();
        setLoading(false);
        await send(q);
      } else if (data.status === 'full') {
        // Got everything — compose the question and auto-send
        const kosherStr = Array.isArray(data.kosher) ? data.kosher.join(', ') : (data.kosher || '');
        const shortName = data.product
          ? (data.brand ? `${data.product} ${data.brand}` : data.product)
          : (data.brand || '');
        const extras: string[] = [];
        if (data.category) extras.push(`קטגוריה: ${data.category}`);
        const ing = Array.isArray(data.ingredients) ? data.ingredients.filter(Boolean) : [];
        if (ing.length > 0) extras.push(`רכיבים: ${ing.join(', ')}`);
        if (data.origin) extras.push(`מוצא: ${data.origin}`);
        if (data.grade) extras.push(`ציון: ${data.grade}`);
        if (data.factory) extras.push(`מפעל: ${data.factory}`);
        const extrasStr = extras.length > 0 ? ' — ' + extras.join(' | ') : '';
        setPendingProductName(null); setPendingKosher(null); setPendingMissing(null);
        setLoading(false);
        await send(`${shortName}${kosherStr ? ` בכשרות ${kosherStr}` : ''}${extrasStr} [מקור:תמונה]`);
      } else if (data.status === 'partial') {
        // Identified something but missing info — keep it pending for next user message
        const partialKosher = Array.isArray(data.kosher) ? data.kosher.join(', ') : (data.kosher || null);
        setPendingKosher(partialKosher);
        setPendingProductName(data.brand || data.product || '');
        setPendingMissing(data.missing || null);
        const brandName = data.brand ? `**${data.brand}**` : 'המוצר';
        let msg: string;
        if (isCont) msg = '🔍 עדיין לא הצלחתי לזהות כשרות ברורה.\nצלם את צד האריזה עם הכשרות בתאורה טובה, או כתוב את הכשרות ידנית.';
        else if (data.missing === 'product_name') {
          msg = partialKosher
            ? `🔍 זיהיתי מוצר של ${brandName} עם כשרות **${partialKosher}**.\nשם המוצר הספציפי לא מופיע בצד הזה — שלח תמונה של הצד הקדמי.`
            : `🔍 זיהיתי מוצר של ${brandName}, אך שם המוצר לא מופיע בצד הזה. שלח תמונה של הצד עם השם.`;
        } else {
          const productDesc = (data.brand || '') + (data.product ? (data.brand ? ' — ' : '') + data.product : '');
          msg = `🔍 זיהיתי: **${productDesc}**\nלא הצלחתי לזהות את הכשרות מהתמונה. צלם את הצד עם חותמת הכשרות, או כתוב אותה ידנית.`;
        }
        setMessages((m) => [...m, { role: 'bot', text: msg }]);
        setLoading(false);
      } else {
        setPendingProductName(null); setPendingKosher(null); setPendingMissing(null);
        setMessages((m) => [...m, { role: 'bot', text: '🔍 לא הצלחתי לזהות את המוצר. נסה תמונה ברורה יותר או כתוב ידנית.' }]);
        setLoading(false);
      }
    } catch (e: any) {
      setMessages((m) => [...m, { role: 'bot', text: '⚠️ שגיאה: ' + (e?.message || 'בעיה') }]);
      setLoading(false);
    }
    setTimeout(() => scrollRef.current?.scrollToEnd?.({ animated: true }), 80);
  }

  /** Send the user's text. Handles the recommendations continuation logic too. */
  async function send(raw: string) {
    const trimmed = raw.trim();
    if (!trimmed || loading) return;
    setInput('');

    // Detect [מקור:תמונה] tag — don't show the tag to the user
    const isFromImage = raw.includes('[מקור:תמונה]');
    const cleanForDisplay = raw.replace(/\s*\[מקור:תמונה\]/g, '').trim();
    const isSystem = trimmed === '__continue__' || trimmed === '__reject__';

    // If recommendations + pendingProductName: compose extended question
    let message = raw;
    if (pendingProductName !== null && topic === 'recommendations' && !isFromImage) {
      const clean = trimmed.replace(/\s*\[מקור:תמונה\]/g, '').trim();
      message = `האם ${pendingProductName} עם כשרות ${clean} מומלץ?`;
      setPendingProductName(null);
    }

    if (!isSystem && !isFromImage) {
      setMessages((m) => [...m, { role: 'user', text: cleanForDisplay }]);
    }
    setLoading(true);

    try {
      const isRec = topic === 'recommendations';
      const isSim = topic === 'simulator';
      const endpoint = isRec ? REC_URL : isSim ? SIM_URL : CHAT_URL;
      const simIsAtStart = isSim && !/^\d+$/.test(trimmed) && simPageId === 410002;
      const body = isRec
        ? { question: message }
        : isSim
          ? { message, simPageId: simIsAtStart ? null : simPageId, simHistory: simIsAtStart ? [] : simHistory }
          : { message, topic, threadId, simPageId };

      const r = await fetch(endpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error('שרת ' + r.status);
      const data = await r.json();
      if (data.error) throw new Error(data.error);
      if (data.threadId) setThreadId(data.threadId);
      if (data.simPageId !== undefined) setSimPageId(data.simPageId);
      if (data.simHistory !== undefined) setSimHistory(data.simHistory);

      // Sim confirm flow
      if (isSim && data.needsConfirm) {
        setMessages((m) => [...m, {
          role: 'bot', text: '',
          confirm: {
            history: data.confirmedHistory || [],
            pageId: data.simPageId,
          },
          // Save the follow-up so confirm can play it after user clicks
          options: data.options || undefined,
        }]);
        // Also append the next-question as a separate (preview) message
        if (data.response) {
          setMessages((m) => [...m, { role: 'bot', text: data.response, options: data.options || undefined }]);
        }
        setLoading(false);
        return;
      }

      const answer = data.response || data.answer;
      if (!answer) throw new Error('אין תשובה');
      setMessages((m) => [...m, {
        role: 'bot', text: answer,
        options: data.options || undefined,
        ikrProducts: data.ikrProducts || undefined,
        webLinks: data.webLinks || undefined,
        youtubeLinks: data.youtubeLinks || undefined,
      }]);
    } catch (e: any) {
      setMessages((m) => [...m, { role: 'bot', text: '⚠️ שגיאה: ' + (e?.message || 'בעיה') }]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd?.({ animated: true }), 80);
    }
  }

  /** Confirm-message handlers */
  async function confirmHistory(history: ConfirmHistoryItem[], pageId: any) {
    setSimPageId(pageId);
    setSimHistory(history);
    await send('__continue__');
  }
  async function rejectHistory() {
    setSimPageId(null); setSimHistory([]);
    await switchTopic('simulator');
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}
      >

      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Icon name="chevronRight" size={20} color={colors.primary} />
          <Text style={[typography.bodyBold, { color: colors.primary }]}>חזרה</Text>
        </Pressable>
      </View>

      <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.sm }}>
        <Text style={[typography.eyebrow, { color: colors.primary }]}>עוזר הכשרות החכם</Text>
        <Text style={[typography.h1Light, { color: colors.textPrimary, marginTop: 2 }]}>
          <Text style={{ color: colors.primary, fontWeight: '700' }}>כושרות</Text>
        </Text>
      </View>

      {/* Topic chips — wrap in a height-constrained View, otherwise on web the
          horizontal ScrollView stretches to fill the parent's vertical space. */}
      <View style={{ height: 48 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.topicRow}>
          {TOPICS.map((t) => (
            <Pressable key={t.id} onPress={() => switchTopic(t.id)} style={[styles.chip, topic === t.id && styles.chipActive]}>
              <Text style={{ fontSize: 12.5, fontWeight: '700', color: topic === t.id ? colors.bg : colors.textPrimary }}>
                {t.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Messages — use plain ScrollView since the outer KeyboardAvoidingView
          already handles keyboard avoidance. Nested KAV breaks scrolling. */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={true}
      >
        {messages.map((m, i) => (
          <View key={i} style={[styles.bubble, m.role === 'user' ? styles.bubbleUser : styles.bubbleBot]}>
            {m.imageUri && (
              <Image source={{ uri: m.imageUri }} style={styles.thumb} />
            )}
            {m.text && (m.role === 'user' ? (
              <Text style={{ color: colors.textPrimary, fontSize: 14.5, lineHeight: 22 }}>{m.text}</Text>
            ) : (
              <BotMessage text={m.text} topic={topic} instant={i < messages.length - 2} />
            ))}

            {/* Sim confirm panel */}
            {m.confirm && (
              <View style={{ gap: 8, marginTop: spacing.sm }}>
                <Text style={{ color: colors.primary, fontWeight: '700' }}>🔍 זיהיתי מהשאלה שלך:</Text>
                {m.confirm.history.map((h, j) => (
                  <View key={j} style={styles.confirmRow}>
                    <Text style={{ color: colors.textPrimary, fontSize: 13.5 }}>
                      ✓ {h.q ? <Text style={{ color: colors.textMuted }}>{h.q.replace(/[:?!.\s]+$/, '')}: </Text> : ''}
                      <Text style={{ fontWeight: '700' }}>{h.a}</Text>
                    </Text>
                  </View>
                ))}
                <View style={{ flexDirection: 'row-reverse', gap: 8 }}>
                  <Pressable onPress={() => confirmHistory(m.confirm!.history, m.confirm!.pageId)} style={[styles.confirmBtn, { backgroundColor: colors.success }]}>
                    <Text style={{ color: '#fff', fontWeight: '700' }}>✓ נכון, המשיכו</Text>
                  </Pressable>
                  <Pressable onPress={rejectHistory} style={[styles.confirmBtn, { backgroundColor: 'rgba(248,113,113,0.15)', borderColor: 'rgba(248,113,113,0.5)', borderWidth: 1 }]}>
                    <Text style={{ color: colors.danger, fontWeight: '700' }}>✗ אתחל מחדש</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* Simulator options */}
            {m.options && m.options.length > 0 && !m.confirm && (
              <View style={{ gap: 6, marginTop: spacing.sm }}>
                {m.options.map((opt, j) => (
                  <Pressable key={j} onPress={() => send(String(j + 1))} style={styles.simOption}>
                    <View style={styles.simNum}>
                      <Text style={{ color: colors.bg, fontWeight: '700', fontSize: 12 }}>{j + 1}</Text>
                    </View>
                    <Text style={{ flex: 1, color: colors.textPrimary, fontSize: 13.5 }}>{opt.text}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            {/* IKR structured products */}
            {m.ikrProducts && m.ikrProducts.products && m.ikrProducts.products.length > 0 && (
              <View style={styles.ikrSection}>
                {m.ikrProducts.title ? (
                  <Text style={styles.ikrTitle}>{m.ikrProducts.title}</Text>
                ) : null}
                {m.ikrProducts.products.map((p, j) => (
                  <Pressable key={j} onPress={() => p.url && Linking.openURL(p.url)} style={styles.ikrItem}>
                    <Text style={styles.ikrName}>{p.name}</Text>
                    {(p.factoryName || p.kosherBy) && (
                      <Text style={styles.ikrMeta}>
                        {[p.factoryName, p.kosherBy].filter(Boolean).join(' | ')}
                      </Text>
                    )}
                  </Pressable>
                ))}
                {m.ikrProducts.moreUrl && (
                  <Pressable onPress={() => Linking.openURL(m.ikrProducts!.moreUrl!)}>
                    <Text style={{ color: colors.primary, fontSize: 12.5, marginTop: 6 }}>
                      ↩ {m.ikrProducts.moreLabel || 'למאגר המלא'}
                    </Text>
                  </Pressable>
                )}
              </View>
            )}

            {/* Web links */}
            {m.webLinks && m.webLinks.length > 0 && (
              <View style={{ marginTop: spacing.sm, gap: 4 }}>
                <Text style={[typography.eyebrow, { color: '#60a5fa' }]}>📚 מאמרים</Text>
                {m.webLinks.map((l, j) => (
                  <Pressable key={j} onPress={() => Linking.openURL(l.url)}>
                    <Text style={{ color: '#60a5fa', fontSize: 13 }}>← {l.title}</Text>
                  </Pressable>
                ))}
              </View>
            )}
            {m.youtubeLinks && m.youtubeLinks.length > 0 && (
              <View style={{ marginTop: spacing.sm, gap: 4 }}>
                <Text style={[typography.eyebrow, { color: '#f87171' }]}>▶ סרטונים</Text>
                {m.youtubeLinks.map((l, j) => (
                  <Pressable key={j} onPress={() => Linking.openURL(l.url)}>
                    <Text style={{ color: '#f87171', fontSize: 13 }}>▶ {l.title}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        ))}

        {loading && (
          <View style={[styles.bubble, styles.bubbleBot, { flexDirection: 'row-reverse', gap: 10 }]}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={{ color: colors.textMuted, fontSize: 13 }}>מעבד את השאלה...</Text>
          </View>
        )}
      </ScrollView>

      {/* Staged images preview (above input bar) */}
      {stagedImages.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.previewBar}>
          {stagedImages.map((s, i) => (
            <View key={i} style={styles.previewItem}>
              <Image source={{ uri: s.uri }} style={styles.previewImg} />
              <Pressable onPress={() => removeStaged(i)} style={styles.previewRemove}>
                <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>×</Text>
              </Pressable>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Input bar — add bottom safe-area inset so it sits ABOVE the Android
          system navigation bar rather than under it. */}
      <View style={[styles.inputBar, { paddingBottom: spacing.md + Math.max(insets.bottom, 8) }]}>
        {topic === 'recommendations' && (
          <Pressable onPress={() => showImageOptions(pickImage)} style={styles.imgBtn} disabled={loading}>
            <Icon name="camera" size={20} color={colors.primary} />
          </Pressable>
        )}
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder={topic === 'recommendations' ? 'שאל על מוצר, מסעדה...' : 'כתוב את שאלתך...'}
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          editable={!loading}
          multiline
        />
        <Pressable
          onPress={() => stagedImages.length > 0 ? sendImages() : send(input)}
          disabled={(!input.trim() && stagedImages.length === 0) || loading}
          style={[styles.sendBtn, ((!input.trim() && stagedImages.length === 0) || loading) && { opacity: 0.4 }]}
        >
          <Icon name="chevronLeft" size={22} color={colors.bg} />
        </Pressable>
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function showImageOptions(picker: (useCamera: boolean) => Promise<void>) {
  Alert.alert('הוסף תמונה', undefined, [
    { text: 'מצלמה', onPress: () => picker(true) },
    { text: 'גלריה', onPress: () => picker(false) },
    { text: 'בטל', style: 'cancel' },
  ]);
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md },
  backBtn: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, alignSelf: 'flex-end' },
  topicRow: {
    flexDirection: 'row-reverse', gap: 6,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md, paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.glass,
    borderWidth: 1, borderColor: colors.glassBorder,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  bubble: {
    marginTop: spacing.sm, padding: spacing.md,
    borderRadius: radius.md, borderWidth: 1, maxWidth: '94%',
  },
  bubbleUser: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(212,164,55,0.15)',
    borderColor: 'rgba(212,164,55,0.4)',
  },
  bubbleBot: {
    alignSelf: 'flex-end',
    backgroundColor: colors.glass,
    borderColor: colors.glassBorder,
  },
  simOption: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 10,
    padding: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: radius.sm,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  simNum: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  confirmRow: {
    padding: 6,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: radius.sm,
  },
  confirmBtn: {
    flex: 1,
    padding: 10,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  ikrSection: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: 'rgba(96,165,250,0.08)',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.3)',
  },
  ikrTitle: { color: '#60a5fa', fontSize: 12, fontWeight: '700', marginBottom: 6 },
  ikrItem: { paddingVertical: 4 },
  ikrName: { color: '#60a5fa', fontSize: 13.5, fontWeight: '600' },
  ikrMeta: { color: colors.textMuted, fontSize: 11, marginTop: 1 },
  thumb: { width: 160, height: 160, borderRadius: radius.sm, marginBottom: 6 },
  previewBar: {
    backgroundColor: colors.glass,
    borderTopWidth: 1, borderTopColor: colors.glassBorder,
    paddingHorizontal: spacing.sm, paddingVertical: 6,
    maxHeight: 80,
  },
  previewItem: { marginHorizontal: 4 },
  previewImg: { width: 60, height: 60, borderRadius: 6 },
  previewRemove: {
    position: 'absolute', top: -4, right: -4,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: colors.danger,
    alignItems: 'center', justifyContent: 'center',
  },
  inputBar: {
    flexDirection: 'row-reverse', alignItems: 'flex-end', gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.glass,
    borderTopWidth: 1, borderTopColor: colors.glassBorder,
  },
  imgBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.glass,
    borderWidth: 1, borderColor: colors.glassBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: colors.glass,
    borderWidth: 1, borderColor: colors.glassBorder,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: 10,
    color: colors.textPrimary,
    fontSize: 15, textAlign: 'right',
    maxHeight: 100,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
});
