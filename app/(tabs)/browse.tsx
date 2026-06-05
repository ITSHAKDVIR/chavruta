import React, { useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View, Pressable, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BrandBar } from '../../src/components/BrandBar';
import { colors, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

/**
 * CSS injection that strips Sefaria's site chrome (header, footer, side nav,
 * reader controls) so the text fills our app shell, making the experience
 * feel embedded rather than a browser-in-a-browser.
 *
 * Selectors target both Sefaria's classic markup and their newer React app.
 * They're aggressive but safe — if any element doesn't exist, the rule is a no-op.
 */
/** Minimal CSS — hide ONLY the obvious site navigation, leave content alone.
 *  Aggressive hiding caused content panels to disappear when Sefaria's React
 *  app re-rendered with different class names. */
const SEFARIA_CLEAN_CSS = `
  /* Hide site-wide navigation header */
  .header.headerOnly,
  #header.header,
  nav.header,
  .siteFooter,
  footer.siteFooter,
  .cookiesNotification,
  .interruptMessage,
  .bannerMessage {
    display: none !important;
  }
`;

/** Run on page load: inject the stylesheet. Idempotent. */
const SEFARIA_INJECT_JS = `
(function() {
  try {
    if (document.getElementById('chavruta-injected-style')) return;
    var s = document.createElement('style');
    s.id = 'chavruta-injected-style';
    s.innerHTML = ${JSON.stringify(SEFARIA_CLEAN_CSS)};
    document.head.appendChild(s);
    // Force Hebrew-only mode when supported
    try {
      var btns = document.querySelectorAll('[data-target="hebrew"], .heButton, button.he');
      btns.forEach(function(b){ b.click && b.click(); });
    } catch (e) {}
  } catch (e) {}
  true;
})();
`;

function isSefariaUrl(url: string): boolean {
  return /(^https?:)?\/\/(www\.)?sefaria\.org/.test(url);
}

export default function BrowseScreen() {
  const { url, title } = useLocalSearchParams<{ url?: string; title?: string }>();
  const router = useRouter();
  const webRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);
  const [cleanMode, setCleanMode] = useState(true);

  const initialUrl = url || 'https://www.sefaria.org.il/?lang=he';
  const shouldInject = cleanMode && isSefariaUrl(initialUrl);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <BrandBar />
      <View style={styles.topBar}>
        <Pressable
          onPress={() => {
            if (Platform.OS !== 'web' && canGoBack && webRef.current) {
              webRef.current.goBack();
            } else {
              router.back();
            }
          }}
          hitSlop={10}
          style={styles.barBtn}
        >
          <Text style={[typography.bodyBold, { color: colors.primary }]}>
            ‹ {Platform.OS !== 'web' && canGoBack ? 'דף קודם' : 'חזרה'}
          </Text>
        </Pressable>
        <Text numberOfLines={1} style={[typography.bodyBold, { color: colors.textPrimary, flex: 1, textAlign: 'center' }]}>
          {title || 'ספריא'}
        </Text>
        {isSefariaUrl(initialUrl) && (
          <Pressable onPress={() => setCleanMode(!cleanMode)} hitSlop={10} style={styles.barBtn}>
            <Text style={[typography.small, { color: colors.primary }]}>
              {cleanMode ? '👁' : '🧹'}
            </Text>
          </Pressable>
        )}
        <Pressable onPress={() => Linking.openURL(initialUrl)} hitSlop={10} style={styles.barBtn}>
          <Text style={[typography.small, { color: colors.primary }]}>↗</Text>
        </Pressable>
      </View>
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        {Platform.OS === 'web' ? (
          // On web, react-native-webview is unsupported. Use a real <iframe>.
          // CSS injection isn't possible cross-origin in iframe - browsers block it.
          // @ts-ignore — iframe is a DOM element, valid only in react-native-web.
          <iframe
            src={initialUrl}
            style={{ flex: 1, border: 0, width: '100%', height: '100%', minHeight: 400 }}
            onLoad={() => setLoading(false)}
            title={title || 'Sefaria'}
          />
        ) : (
          <WebView
            ref={webRef}
            source={{ uri: initialUrl }}
            // Explicit flex + bg fixes the "bottom half is empty navy" bug
            // some users saw on shorter pages — without this, the WebView
            // measured its intrinsic content height instead of filling parent.
            style={{ flex: 1, backgroundColor: '#fff' }}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            onNavigationStateChange={(s) => setCanGoBack(s.canGoBack)}
            startInLoadingState
            originWhitelist={['*']}
            scalesPageToFit
            javaScriptEnabled
            domStorageEnabled
            injectedJavaScript={shouldInject ? SEFARIA_INJECT_JS : undefined}
            // Re-inject on every navigation inside Sefaria so it sticks across sections
            onLoad={() => {
              if (shouldInject && webRef.current) {
                webRef.current.injectJavaScript(SEFARIA_INJECT_JS);
              }
            }}
            renderLoading={() => (
              <View style={styles.loading}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            )}
          />
        )}
        {loading && (
          <View style={styles.loadingOverlay} pointerEvents="none">
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  barBtn: { paddingVertical: 4 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingOverlay: { position: 'absolute', top: 12, alignSelf: 'center' },
});
