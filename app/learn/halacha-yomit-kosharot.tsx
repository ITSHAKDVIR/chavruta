import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { HDate } from '@hebcal/core';
import { WebView } from 'react-native-webview';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { getHalachaForDate } from '../../src/data/halachaYomit';
import { hebrewDateInfo } from '../../src/data/hebcal';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

/**
 * Extract the YouTube video ID from any URL form:
 *   - https://www.youtube.com/watch?v=ABC123
 *   - https://youtu.be/ABC123
 *   - https://youtube.com/embed/ABC123
 * Returns null if no ID can be parsed.
 */
function youtubeIdFromUrl(url: string): string | null {
  const m =
    url.match(/[?&]v=([a-zA-Z0-9_-]{6,})/) ||
    url.match(/youtu\.be\/([a-zA-Z0-9_-]{6,})/) ||
    url.match(/embed\/([a-zA-Z0-9_-]{6,})/);
  return m ? m[1] : null;
}

export default function HalachaYomitKosharotReader() {
  const router = useRouter();
  const [dayOffset, setDayOffset] = useState(0);

  const date = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + dayOffset);
    return d;
  }, [dayOffset]);

  const entry = useMemo(() => getHalachaForDate(date), [date.toDateString()]);
  const hebrew = useMemo(() => hebrewDateInfo(date), [date.toDateString()]);
  const hd = useMemo(() => new HDate(date), [date.toDateString()]);
  const isToday = dayOffset === 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={[typography.bodyBold, { color: colors.primary }]}>‹ חזרה</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        <ScreenHeader title="הלכה יומית" subtitle="לימוד יומי לפי תאריך עברי" />

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          <Card>
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm }}>
              <Pressable onPress={() => setDayOffset(dayOffset - 1)} style={styles.navBtn}>
                <Text style={[typography.h3, { color: colors.primary }]}>‹</Text>
              </Pressable>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={[typography.h3, { color: colors.textPrimary }]}>{hebrew.gematria}</Text>
                <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>
                  {date.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}
                </Text>
                {!isToday && (
                  <Pressable onPress={() => setDayOffset(0)} style={{ marginTop: 4 }}>
                    <Text style={[typography.caption, { color: colors.primary }]}>← קפוץ להיום</Text>
                  </Pressable>
                )}
              </View>
              <Pressable onPress={() => setDayOffset(dayOffset + 1)} style={styles.navBtn}>
                <Text style={[typography.h3, { color: colors.primary }]}>›</Text>
              </Pressable>
            </View>
          </Card>

          {!entry ? (
            <Card>
              <Text style={[typography.h3, { color: colors.textPrimary }]}>אין הלכה לתאריך זה</Text>
              <Text style={[typography.body, { color: colors.textMuted, marginTop: spacing.sm }]}>
                {hd.getDate() === 30 && hd.getMonth() === 8
                  ? 'השנה חודש חשון של 29 ימים, אין ל׳ חשון.'
                  : hd.getDate() === 30 && hd.getMonth() === 9
                  ? 'השנה חודש כסלו של 29 ימים, אין ל׳ כסלו.'
                  : 'התאריך הזה לא מופיע בספר עבור שנה זו.'}
              </Text>
            </Card>
          ) : (
            <Card padding="xl">
              {entry.title ? (
                <Text style={[typography.h2, { color: colors.textPrimary, marginBottom: spacing.md }]}>
                  {entry.title}
                </Text>
              ) : null}
              <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.md }]}>
                {entry.dateLabel}
              </Text>
              {entry.paragraphs.map((p, i) => (
                <Text
                  key={i}
                  style={[
                    typography.body,
                    {
                      color: colors.textPrimary,
                      lineHeight: 28,
                      marginBottom: i < entry.paragraphs.length - 1 ? spacing.md : 0,
                    },
                  ]}
                >
                  {p}
                </Text>
              ))}
            </Card>
          )}

          {/* YouTube video for the day's halacha — extracted from the
              "הלכה יומית עם ברקוד" sheet user provided. Embed only on native
              (WebView). Title appears above the player. */}
          {entry && (entry as any).videoUrl && (
            <VideoPlayer
              videoUrl={(entry as any).videoUrl as string}
              title={(entry as any).videoTitle as string | undefined}
            />
          )}

          <Card variant="accent">
            <Text style={[typography.small, { color: colors.primaryDark, opacity: 0.85 }]}>
              💡 לימוד יומי בהלכה לפי התאריך העברי.
            </Text>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * Embedded YouTube player using react-native-webview. Standard 16:9 ratio.
 * The video appears as a real player with play/pause/fullscreen — no need to
 * leave the app to watch the halacha.
 */
function VideoPlayer({ videoUrl, title }: { videoUrl: string; title?: string }) {
  const { width } = useWindowDimensions();
  const videoId = youtubeIdFromUrl(videoUrl);
  if (!videoId) return null;
  // Subtract horizontal padding (spacing.lg * 2 from the parent View)
  const playerWidth = width - spacing.lg * 2;
  const playerHeight = Math.round((playerWidth * 9) / 16);
  // Use youtube-nocookie.com domain — bypasses error 153 (embed-disabled videos
  // often work via the privacy-enhanced domain). Plus playsinline + jsapi.
  const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?playsinline=1&rel=0&enablejsapi=1&modestbranding=1`;

  return (
    <Card padding="md">
      <Text style={[typography.eyebrow, { color: colors.primary, marginBottom: spacing.xs }]}>
        🎥 וידאו ההלכה היומית
      </Text>
      {title && (
        <Text style={[typography.bodyBold, { color: colors.textPrimary, marginBottom: spacing.sm }]}>
          {title}
        </Text>
      )}
      <View style={{ height: playerHeight, borderRadius: radius.md, overflow: 'hidden', backgroundColor: '#000' }}>
        {Platform.OS === 'web' ? (
          // @ts-ignore — iframe is valid in react-native-web
          <iframe
            src={embedUrl}
            style={{ width: '100%', height: '100%', border: 0 }}
            allowFullScreen
            title={title || 'YouTube video'}
          />
        ) : (
          <WebView
            source={{ uri: embedUrl }}
            style={{ flex: 1, backgroundColor: '#000' }}
            allowsFullscreenVideo
            javaScriptEnabled
            domStorageEnabled
          />
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: {
    padding: spacing.lg,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
