// ⚡ CRITICAL: Install crash logger BEFORE any other import that might fail.
// This must be the very first line so we capture even module-loading errors.
import { installCrashLogger } from '../src/services/crashLogger';
installCrashLogger();

import 'temporal-polyfill/global';

import React, { useEffect, useState } from 'react';
import {
  I18nManager,
  Platform,
  View,
  Text,
  ScrollView,
  Pressable,
  Share,
} from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import {
  getCrashes,
  getCrashesAsText,
  clearCrashes,
  CrashEntry,
} from '../src/services/crashLogger';
import { useFonts } from 'expo-font';
import {
  Rubik_300Light,
  Rubik_400Regular,
  Rubik_500Medium,
  Rubik_600SemiBold,
  Rubik_700Bold,
  Rubik_800ExtraBold,
} from '@expo-google-fonts/rubik';

// CRITICAL INSIGHT: Our codebase uses explicit `flexDirection: 'row-reverse'`
// throughout to achieve a Hebrew RTL look. When I18nManager.isRTL=true, React
// Native AUTO-FLIPS row↔row-reverse, which means our row-reverse silently
// becomes row-LTR — breaking the intended Hebrew layout.
//
// The fix: DISABLE forceRTL. Keep isRTL=false so our explicit row-reverse
// styles render exactly as written. If a previous install left forceRTL=true
// in SharedPreferences, we flip it back and reload once.
if (I18nManager.isRTL) {
  try {
    I18nManager.allowRTL(false);
    I18nManager.forceRTL(false);
    if (Platform.OS !== 'web') {
      (async () => {
        try {
          const AsyncStorage: any = (await import('@react-native-async-storage/async-storage')).default;
          const KEY = '@yahadut/rtl-disable-reload-done';
          const done = await AsyncStorage.getItem(KEY);
          if (!done) {
            await AsyncStorage.setItem(KEY, '1');
            const Updates: any = await import('expo-updates');
            if (Updates.reloadAsync) {
              await Updates.reloadAsync();
            }
          }
        } catch {}
      })();
    }
  } catch {}
}

// Backup: ensure Text/TextInput default to right-aligned + light color (the
// new dark navy theme has white text on dark backgrounds, so the RN default
// near-black text would be invisible). Explicit `style.color` on any Text
// component overrides this default normally.
import { Text as _RNText, TextInput as _RNTextInput } from 'react-native';
// Set Rubik-Regular as the DEFAULT font family at module load — before any
// component renders. The font is now embedded in the APK via the expo-font
// plugin (see app.json) so it's available before the JS bundle starts.
(_RNText as any).defaultProps = (_RNText as any).defaultProps || {};
(_RNText as any).defaultProps.style = {
  fontFamily: 'Rubik-Regular',
  writingDirection: 'rtl',
  textAlign: 'right',
  color: '#FFFFFF',
};
(_RNTextInput as any).defaultProps = (_RNTextInput as any).defaultProps || {};
(_RNTextInput as any).defaultProps.style = {
  fontFamily: 'Rubik-Regular',
  writingDirection: 'rtl',
  textAlign: 'right',
  color: '#FFFFFF',
};

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null; info: { componentStack: string } | null }
> {
  state = { error: null as Error | null, info: null as { componentStack: string } | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    this.setState({ info });
    console.error('AppErrorBoundary caught:', error?.message, info.componentStack);
  }

  reset = () => this.setState({ error: null, info: null });

  render() {
    if (this.state.error) {
      return (
        <CrashScreen
          error={this.state.error}
          componentStack={this.state.info?.componentStack ?? ''}
          onReset={this.reset}
        />
      );
    }
    return this.props.children;
  }
}

function CrashScreen({
  error,
  componentStack,
  onReset,
}: {
  error: Error;
  componentStack: string;
  onReset: () => void;
}) {
  const [crashes, setCrashes] = useState<CrashEntry[]>([]);

  useEffect(() => {
    getCrashes().then(setCrashes);
  }, []);

  const fullText = `LIVE ERROR:
${error.message}
${error.stack ?? ''}
COMPONENT STACK:
${componentStack}

PRIOR CRASHES (${crashes.length}):
${crashes
  .map(
    (c, i) =>
      `[${i + 1}] ${new Date(c.ts).toLocaleString('he-IL')} - ${c.kind}\n${c.message}\n${c.stack ?? ''}`,
  )
  .join('\n\n')}`;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAF7F0' }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
        <Text style={{ fontSize: 22, fontWeight: '700', color: '#7A4E2D', marginBottom: 8 }}>
          ⚠️ שגיאה
        </Text>
        <Text style={{ fontSize: 14, color: '#7A4E2D', marginBottom: 16 }}>
          לחץ "שתף" כדי לשלוח את הלוג ולתת לי להבין מה התקלה.
        </Text>

        <View style={{ flexDirection: 'row-reverse', gap: 12, marginBottom: 20 }}>
          <Pressable
            onPress={() => Share.share({ message: fullText })}
            style={{ flex: 1, backgroundColor: '#7A4E2D', padding: 14, borderRadius: 8, alignItems: 'center' }}
          >
            <Text style={{ color: '#fff', fontWeight: '700' }}>📤 שתף לוג</Text>
          </Pressable>
          <Pressable
            onPress={() => clearCrashes().then(() => setCrashes([]))}
            style={{ flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#7A4E2D', padding: 14, borderRadius: 8, alignItems: 'center' }}
          >
            <Text style={{ color: '#7A4E2D', fontWeight: '700' }}>🗑 נקה</Text>
          </Pressable>
          <Pressable
            onPress={onReset}
            style={{ flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#7A4E2D', padding: 14, borderRadius: 8, alignItems: 'center' }}
          >
            <Text style={{ color: '#7A4E2D', fontWeight: '700' }}>🔄 נסה שוב</Text>
          </Pressable>
        </View>

        <Text style={{ fontSize: 16, fontWeight: '700', color: '#2F2A24', marginBottom: 6 }}>
          שגיאה נוכחית:
        </Text>
        <Text
          selectable
          style={{ fontSize: 13, color: '#5C1F3A', marginBottom: 12, fontFamily: 'monospace' }}
        >
          {error.message}
        </Text>
        <Text
          selectable
          style={{ fontSize: 11, color: '#666', marginBottom: 20, fontFamily: 'monospace' }}
        >
          {error.stack ?? ''}
        </Text>
        {!!componentStack && (
          <>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#2F2A24', marginBottom: 4 }}>
              Component stack:
            </Text>
            <Text
              selectable
              style={{ fontSize: 11, color: '#666', marginBottom: 20, fontFamily: 'monospace' }}
            >
              {componentStack}
            </Text>
          </>
        )}

        {crashes.length > 0 && (
          <>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#2F2A24', marginBottom: 6 }}>
              שגיאות קודמות ({crashes.length}):
            </Text>
            {crashes.map((c, i) => (
              <View
                key={i}
                style={{ backgroundColor: '#fff', padding: 10, borderRadius: 6, marginBottom: 8, borderWidth: 1, borderColor: '#E8DFCC' }}
              >
                <Text style={{ fontSize: 11, color: '#888' }}>
                  {new Date(c.ts).toLocaleString('he-IL')} · {c.kind}
                </Text>
                <Text selectable style={{ fontSize: 12, color: '#5C1F3A', marginTop: 4, fontFamily: 'monospace' }}>
                  {c.message.slice(0, 500)}
                </Text>
                {c.stack && (
                  <Text selectable style={{ fontSize: 10, color: '#888', marginTop: 4, fontFamily: 'monospace' }}>
                    {c.stack.slice(0, 800)}
                  </Text>
                )}
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * If we have logged crashes from previous runs and no current error, surface
 * a banner that opens the crash screen. Lets the user share crashes even after
 * the app recovers.
 */
function PriorCrashesBanner() {
  const [count, setCount] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    getCrashes().then((c) => setCount(c.length));
  }, []);

  // Banner is for the developer, NOT end users. Only show in dev builds.
  // On a real APK (__DEV__ false), users never see it.
  if (!__DEV__ || count === 0 || dismissed) return null;
  return (
    <Pressable
      onPress={() => setDismissed(true)}
      style={{
        position: 'absolute',
        top: Platform.OS === 'ios' ? 50 : 30,
        left: 12,
        right: 12,
        backgroundColor: '#FFE08A',
        borderColor: '#8B6914',
        borderWidth: 1,
        borderRadius: 8,
        padding: 10,
        zIndex: 9999,
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <Text style={{ fontSize: 16 }}>⚠️</Text>
      <Text style={{ flex: 1, fontSize: 12, color: '#5C4810' }}>
        יש {count} שגיאות מתועדות. לחץ להסתרה או לחץ "שתף".
      </Text>
      <CrashSharer onClose={() => { setCount(0); setDismissed(true); }} />
    </Pressable>
  );
}

function CrashSharer({ onClose }: { onClose: () => void }) {
  return (
    <Pressable
      onPress={async () => {
        const text = await getCrashesAsText();
        await Share.share({ message: text });
        await clearCrashes();
        onClose();
      }}
      hitSlop={10}
      style={{ backgroundColor: '#5C4810', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 }}
    >
      <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>שתף</Text>
    </Pressable>
  );
}

export default function RootLayout() {
  // Load Rubik font globally — bundled in APK so every device sees the same UI
  const [fontsLoaded] = useFonts({
    'Rubik-Light': Rubik_300Light,
    'Rubik-Regular': Rubik_400Regular,
    'Rubik-Medium': Rubik_500Medium,
    'Rubik-SemiBold': Rubik_600SemiBold,
    'Rubik-Bold': Rubik_700Bold,
    'Rubik-ExtraBold': Rubik_800ExtraBold,
  });

  // Set Rubik as the default font for ALL Text components once loaded
  useEffect(() => {
    if (!fontsLoaded) return;
    const RNText: any = _RNText;
    RNText.defaultProps = RNText.defaultProps || {};
    RNText.defaultProps.style = [RNText.defaultProps.style, { fontFamily: 'Rubik-Regular' }];
  }, [fontsLoaded]);

  useEffect(() => {
    // NOTE: We deliberately do NOT call forceRTL(true) here. Our entire UI uses
    // explicit `flexDirection: 'row-reverse'` to achieve a Hebrew right-to-left
    // visual. When isRTL=true, React Native auto-flips row↔row-reverse, which
    // would silently break every explicit row-reverse declaration. The top-level
    // code at the very start of this file forces isRTL=false (and reloads once
    // on first launch) to keep this invariant — re-asserting forceRTL(true)
    // here was the cause of the "home screen flips to LTR after navigating
    // back" bug.
    //
    // Lazy-load startup code so failures don't crash the app
    (async () => {
      try {
        const { configureNotifications } = await import('../src/services/notifications');
        await configureNotifications().catch(() => {});
      } catch (e) {
        console.warn('[startup] notifications init failed:', e);
      }

      try {
        const { rescheduleAll } = await import('../src/services/notificationsHub');
        const { scheduleAllReminders: scheduleTaharaReminders } = await import(
          '../src/services/taharaReminders'
        );
        const { getJSON, Keys } = await import('../src/storage/storage');
        const { DEFAULT_LOCATIONS } = await import('../src/data/hebcal');

        const loc = (await getJSON<any>(Keys.location, null)) ?? DEFAULT_LOCATIONS[0];
        await Promise.allSettled([rescheduleAll(loc)]);

        // Reschedule tekufa notifications (per user's stored hours-before)
        try {
          const { scheduleTekufaNotifications } = await import('../src/services/tekufaNotifications');
          await scheduleTekufaNotifications();
        } catch (e) { console.warn('[startup] tekufa schedule', e); }

        const cycles = await getJSON<{ id: string; startDate: string }[]>(
          '@yahadut/tahara-cycles',
          [],
        );
        if (cycles.length > 0) {
          const latest = [...cycles].sort((a, b) => b.startDate.localeCompare(a.startDate))[0];
          await scheduleTaharaReminders(new Date(latest.startDate));
        }
      } catch (e) {
        console.warn('[startup] reminders scheduling failed:', e);
      }
    })();
  }, []);

  return (
    <AppErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#0a1f3d' },
              animation: 'slide_from_right',
            }}
          />
          <PriorCrashesBanner />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </AppErrorBoundary>
  );
}
