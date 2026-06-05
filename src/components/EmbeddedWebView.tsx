/**
 * EmbeddedWebView — full-screen WebView with our chrome (back button + title).
 *
 * Used for tools that should show an external page IN PLACE rather than
 * navigating to a separate browser screen. The WebView fills all available
 * space below the title bar. A small "external" button lets the user open
 * the page in their system browser if they want.
 */
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon } from './Icon';
import { colors, spacing } from '../theme/colors';
import { typography } from '../theme/typography';

type Props = {
  url: string;
  title: string;
  subtitle?: string;
};

export function EmbeddedWebView({ url, title, subtitle }: Props) {
  const router = useRouter();
  const webRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);

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
        <Pressable onPress={() => Linking.openURL(url)} hitSlop={10}>
          <Text style={[typography.caption, { color: colors.primary }]}>פתח בדפדפן ↗</Text>
        </Pressable>
      </View>

      <View style={styles.header}>
        <Text style={[typography.eyebrow, { color: colors.primary }]}>מכון כושרות</Text>
        <Text style={[typography.h1Light, { color: colors.textPrimary, marginTop: 2 }]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>
            {subtitle}
          </Text>
        )}
      </View>

      {/* WebView fills the rest of the screen with a white background so the
          embedded page looks like part of the app, not a void. */}
      <View style={styles.webWrap}>
        {Platform.OS === 'web' ? (
          // @ts-ignore react-native-web supports iframe
          <iframe
            src={url}
            style={{ width: '100%', height: '100%', border: 0 }}
            title={title}
          />
        ) : (
          <WebView
            ref={webRef}
            source={{ uri: url }}
            style={{ flex: 1, backgroundColor: '#fff' }}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            javaScriptEnabled
            domStorageEnabled
            scalesPageToFit
            originWhitelist={['*']}
          />
        )}
        {loading && (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}
      </View>
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
  backBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  webWrap: {
    flex: 1,
    margin: spacing.lg,
    marginTop: 0,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  loader: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
});
