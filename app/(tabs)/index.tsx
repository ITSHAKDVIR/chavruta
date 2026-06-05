import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon } from '../../src/components/Icon';
import { HeroCarousel, HeroCard } from '../../src/components/HeroCarousel';
import { useLocation } from '../../src/hooks/useLocation';
import { useShortcuts } from '../../src/hooks/useShortcuts';
import { useToolDiscovery, markToolSeen } from '../../src/hooks/useToolDiscovery';
import { useBedtimeHint } from '../../src/hooks/useBedtimeHint';
import { MeatMilkLiveTimer } from '../../src/components/MeatMilkLiveTimer';
import { useTick } from '../../src/hooks/useTick';
import {
  computeZmanim,
  hebrewDateInfo,
  holidaysForDate,
  parshahForDate,
  formatTime,
  omerDay,
  getSpecialDay,
  getCandleLightingMinutes,
} from '../../src/data/hebcal';
import { getTodayLearning } from '../../src/data/learning';
import { getSeasonalCards } from '../../src/data/seasonal';
import { getActiveHolidayKits, formatDaysUntil, toolsForKit } from '../../src/data/holidayKit';
import { loadBrachaPrefs, BrachaPrefs } from '../../src/storage/brachot';
import { useHomeAlerts } from '../../src/hooks/useHomeAlerts';
import { Card } from '../../src/components/Card';
import { Pill } from '../../src/components/Pill';
import { Section } from '../../src/components/Section';
import { BrandBar } from '../../src/components/BrandBar';
import { ShortcutPicker } from '../../src/components/ShortcutPicker';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

export default function HomeScreen() {
  useTick(60_000);
  const router = useRouter();
  const { location, loaded } = useLocation();
  const now = new Date();
  const inIsrael = location.countryCode === 'IL';

  const hebrew = useMemo(() => hebrewDateInfo(now), [now.toDateString()]);
  const parshah = useMemo(() => parshahForDate(now, inIsrael), [now.toDateString(), inIsrael]);
  const events = useMemo(() => holidaysForDate(now, inIsrael), [now.toDateString(), inIsrael]);
  const omer = useMemo(() => omerDay(now), [now.toDateString()]);
  const zmanim = useMemo(() => computeZmanim(now, location), [location, now.toDateString()]);

  // Compute the Shabbat banner: only shown on Erev Shabbat (Friday afternoon)
  // and lit up with the actual hours-until candle lighting + formatted time.
  const shabbatBanner = useMemo(() => {
    const special = getSpecialDay(now, inIsrael);
    if (!special.isErevShabbat || !zmanim.candleLighting) return null;
    const ms = zmanim.candleLighting.getTime() - now.getTime();
    if (ms < 0) return null;
    const hours = Math.floor(ms / 3_600_000);
    const mins = Math.floor((ms % 3_600_000) / 60_000);
    const when = hours > 0 ? `${hours} שעות` : `${mins} דקות`;
    return {
      timeStr: formatTime(zmanim.candleLighting, location.timezone),
      hint: `שבת בעוד ${when}`,
    };
  }, [now.getTime(), zmanim.candleLighting, location.timezone, inIsrael]);
  const learning = useMemo(() => getTodayLearning(now), [now.toDateString()]);
  const seasonal = useMemo(() => getSeasonalCards(now), [now.toDateString()]);
  const holidayKits = useMemo(() => getActiveHolidayKits(now, 2), [now.toDateString()]);

  const [prefs, setPrefs] = useState<BrachaPrefs | null>(null);
  useEffect(() => {
    (async () => setPrefs(await loadBrachaPrefs()))();
  }, []);

  const { alerts, refresh } = useHomeAlerts(prefs);
  const { shortcuts, favorites, toggleFavorite, trackUse } = useShortcuts();
  const { suggestion, dismiss: dismissSuggestion } = useToolDiscovery(now, favorites);
  const bedtimeHint = useBedtimeHint();
  const [pickerOpen, setPickerOpen] = useState(false);

  // Responsive grid: 4 columns on wider screens, 3 on narrow phones
  const { width: screenWidth } = useWindowDimensions();
  const SHORTCUT_HPAD = spacing.lg;
  const SHORTCUT_GAP = spacing.sm;
  const SHORTCUT_COLS = screenWidth >= 380 ? 4 : 3;
  const tileWidth = Math.floor(
    (screenWidth - SHORTCUT_HPAD * 2 - SHORTCUT_GAP * (SHORTCUT_COLS - 1)) / SHORTCUT_COLS
  );

  const handleShortcut = (toolId: string, route: string) => {
    trackUse(toolId);
    router.push(route as any);
  };

  // Quick-access carousel: 3 most-used surfaces. Cards stack with the middle
  // one in focus by default — siddur is the most-used surface.
  const heroCards: HeroCard[] = useMemo(() => [
    { id: 'zmanim',  title: 'זמני היום',  subtitle: 'נץ · ק"ש · שקיעה',     icon: 'clock', route: '/zmanim' },
    { id: 'siddur',  title: 'סידור',       subtitle: 'שחרית · מנחה · ערבית', icon: 'book',  route: '/tfilon' },
    { id: 'halacha', title: 'הלכה יומית', subtitle: 'פרק היום',             icon: 'learn', route: '/learn/halacha-yomit-kosharot' },
  ], []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Background: deep navy gradient with two decorative glow orbs.
          The gradient is absolutely positioned behind all content so the
          rest of the screen scrolls over it. */}
      <LinearGradient
        colors={['#0a1f3d', '#1e3a5f', '#2c5282']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill as any}
      />
      {/* Gold/navy glow circles removed per user feedback — they were visible
          on home and didn't match the agreed mockup */}

      <BrandBar />
      {/* Gold Shabbat banner — only on Erev Shabbat, with live countdown */}
      {shabbatBanner && (
        <LinearGradient
          colors={['#b8862a', '#d4a437', '#b8862a']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.shabbatBanner}
        >
          <Text style={styles.shabbatBannerText}>
            🕯 {shabbatBanner.hint} · הדלקת נרות {shabbatBanner.timeStr}
          </Text>
        </LinearGradient>
      )}
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[typography.small, { color: colors.textMuted, textAlign: 'right' }]}>
            ברוך הבא
          </Text>
          <Text style={[typography.h1Light, { color: colors.textPrimary, textAlign: 'right', marginTop: 2 }]}>
            היום ב<Text style={{ color: colors.primary, fontWeight: '700' }}>חברותא</Text>
          </Text>
          <Text style={[typography.caption, { color: colors.textMuted, textAlign: 'right', marginTop: 4 }]}>
            {hebrew.gematria} · {location.name}
          </Text>
          <View style={styles.pillRow}>
            <Pressable
              onPress={() => router.push('/settings/location' as any)}
              hitSlop={8}
              style={styles.locationPill}
              accessibilityLabel="שנה מיקום"
            >
              <Icon name="pin" size={12} color={colors.textPrimary} strokeWidth={2} />
              <Text style={[typography.caption, { color: colors.textPrimary, marginRight: 4 }]}>
                {location.name}{!loaded ? ' (טוען...)' : ''}
              </Text>
            </Pressable>
            {parshah ? <Pill label={`פרשת ${parshah}`} tone="accent" /> : null}
            {omer ? <Pill label={`${omer} בעומר`} tone="primary" /> : null}
          </View>
          {events.length > 0 ? (
            <View style={[styles.pillRow, { marginTop: spacing.sm }]}>
              {events.map((ev, i) => {
                let tone: 'primary' | 'accent' | 'warning' | 'info' = 'info';
                if (ev.category === 'holiday') tone = 'accent';
                else if (ev.category === 'fast') tone = 'warning';
                else if (ev.category === 'roshChodesh') tone = 'primary';
                return <Pill key={i} label={ev.description} tone={tone} />;
              })}
            </View>
          ) : null}
        </View>

        <HeroCarousel
          cards={heroCards}
          onPress={(c) => router.push(c.route as any)}
        />

        {/* AI strip removed from home per user feedback —
            the chat lives in tools only. */}

        <MeatMilkLiveTimer />

        {alerts.length > 0 && (
          <View style={{ paddingHorizontal: spacing.lg, gap: spacing.sm, marginBottom: spacing.lg }}>
            {alerts.map((alert) => {
              // User preference: avoid solid gold ("accent"/"primary") boxes.
              // Use glass "default" variant with gold accents in TEXT only.
              const fg = colors.textPrimary;
              return (
                <Card key={alert.id} variant="default" onPress={() => router.push(alert.route as any)}>
                  <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.md }}>
                    <Text style={{ fontSize: 32 }}>{alert.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[typography.small, { color: colors.primary, opacity: 0.9 }]}>תזכורת</Text>
                      <Text style={[typography.h3, { color: fg, marginTop: 2 }]}>{alert.title}</Text>
                      <Text style={[typography.small, { color: colors.textMuted, marginTop: 2 }]}>{alert.body}</Text>
                    </View>
                    <Icon name="chevronLeft" size={22} color={colors.textMuted} />
                  </View>
                  {alert.quickAction && (
                    <Pressable
                      onPress={async (e) => {
                        e.stopPropagation();
                        await alert.quickAction!.onPress();
                        refresh();
                      }}
                      style={{
                        marginTop: spacing.md,
                        paddingVertical: spacing.sm,
                        backgroundColor: 'rgba(255,255,255,0.06)',
                        borderRadius: radius.md,
                        alignItems: 'center',
                      }}
                    >
                      <Text style={[typography.bodyBold, { color: fg }]}>{alert.quickAction.label}</Text>
                    </Pressable>
                  )}
                </Card>
              );
            })}
          </View>
        )}

        {bedtimeHint.shouldShow && (
          <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.lg }}>
            <Card
              variant="primary"
              onPress={() => router.push('/tfilot' as any)}
            >
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.md }}>
                <Icon name="moon" size={32} color={colors.textPrimary} />
                <View style={{ flex: 1 }}>
                  <Text style={[typography.small, { color: colors.textPrimary, opacity: 0.85 }]}>
                    שעת לילה · המכשיר בטעינה
                  </Text>
                  <Text style={[typography.h3, { color: colors.textPrimary, marginTop: 2 }]}>
                    קריאת שמע על המיטה?
                  </Text>
                </View>
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    bedtimeHint.dismiss();
                  }}
                  hitSlop={10}
                >
                  <Icon name="close" size={18} color={colors.textPrimary} />
                </Pressable>
              </View>
            </Card>
          </View>
        )}

        {suggestion && (
          <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.lg }}>
            <Card
              variant="default"
              onPress={() => {
                trackUse(suggestion.id);
                markToolSeen(suggestion.id);
                router.push(suggestion.route as any);
              }}
            >
              <View style={{ flexDirection: 'row-reverse', alignItems: 'flex-start', gap: spacing.md }}>
                {suggestion.iconName ? (
                  <Icon name={suggestion.iconName as any} size={28} color={colors.primary} strokeWidth={1.5} />
                ) : (
                  <Text style={{ fontSize: 28 }}>{suggestion.emoji}</Text>
                )}
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 4 }}>
                    <Icon name="sparkles" size={13} color={colors.primary} />
                    <Text style={[typography.small, { color: colors.primary, opacity: 0.9 }]}>
                      כלי שאולי לא הכרת
                    </Text>
                  </View>
                  <Text style={[typography.h3, { color: colors.textPrimary, marginTop: 2 }]}>{suggestion.title}</Text>
                  <Text style={[typography.small, { color: colors.textMuted, marginTop: 2 }]}>
                    {suggestion.description}
                  </Text>
                </View>
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    dismissSuggestion();
                  }}
                  hitSlop={10}
                  style={{ padding: 4 }}
                >
                  <Icon name="close" size={16} color={colors.textMuted} />
                </Pressable>
              </View>
            </Card>
          </View>
        )}

        {seasonal.length > 0 && (
          <Section title="עונת השנה" subtitle="מה אקטואלי עכשיו">
            <View style={{ paddingHorizontal: spacing.lg, gap: spacing.sm }}>
              {seasonal.slice(0, 3).map((s) => (
                <Card
                  key={s.id}
                  onPress={s.action ? () => router.push(s.action!.route as any) : undefined}
                >
                  <View style={{ flexDirection: 'row-reverse', gap: spacing.md, alignItems: 'center' }}>
                    <Text style={{ fontSize: 32 }}>{s.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[typography.h3, { color: colors.textPrimary }]}>{s.title}</Text>
                      <Text style={[typography.small, { color: colors.textSecondary, marginTop: 2 }]}>
                        {s.description}
                      </Text>
                    </View>
                    {s.action ? <Icon name="chevronLeft" size={22} color={colors.textMuted} /> : null}
                  </View>
                </Card>
              ))}
            </View>
          </Section>
        )}

        {holidayKits.map((kit) => {
          const tools = toolsForKit(kit);
          if (tools.length === 0) return null;
          const daysLabel = formatDaysUntil(kit.daysUntil, kit.customLabel);
          const titlePrefix = kit.daysUntil === 0 ? '' : 'מוכנים ל';
          return (
            <Section
              key={kit.id}
              title={`${kit.emoji} ${titlePrefix}${kit.name}`}
              subtitle={daysLabel}
            >
              <View style={styles.kitGrid}>
                {tools.map((t) => (
                  <Card
                    key={t.id}
                    style={[styles.kitCard, { width: tileWidth, minHeight: tileWidth }]}
                    onPress={() => {
                      trackUse(t.id);
                      router.push(t.route as any);
                    }}
                    padding="sm"
                  >
                    {t.iconName ? (
                      <Icon name={t.iconName as any} size={tileWidth >= 90 ? 26 : 22} color={colors.primary} strokeWidth={1.5} />
                    ) : (
                      <Text style={{ fontSize: tileWidth >= 90 ? 28 : 24 }}>{t.emoji}</Text>
                    )}
                    <Text
                      style={[
                        {
                          color: colors.textPrimary,
                          marginTop: 4,
                          textAlign: 'center',
                          fontWeight: '600',
                          fontSize: tileWidth >= 90 ? 12 : 11,
                          lineHeight: tileWidth >= 90 ? 15 : 14,
                          paddingHorizontal: 2,
                        },
                      ]}
                    >
                      {t.title}
                    </Text>
                  </Card>
                ))}
              </View>
            </Section>
          );
        })}

        <Section
          title="זמני היום"
          subtitle={`לפי ${location.name}`}
          actionLabel="כל הזמנים"
          onActionPress={() => router.push('/zmanim')}
        >
          <View style={styles.zmanimGrid}>
            <ZmanimCell label="הנץ החמה" time={formatTime(zmanim.sunrise, location.timezone)} />
            <ZmanimCell label="מנחה" time={formatTime(zmanim.minchaGedola, location.timezone)} />
            <ZmanimCell label="שקיעה" time={formatTime(zmanim.sunset, location.timezone)} />
            <ZmanimCell label="צאת הכוכבים" time={formatTime(zmanim.tzeit18min, location.timezone)} />
          </View>
        </Section>

        <Section
          title="לימוד יומי"
          subtitle="המחזורים הפעילים היום"
          actionLabel="הכל"
          onActionPress={() => router.push('/learn')}
        >
          <View style={{ paddingHorizontal: spacing.lg }}>
            {learning.slice(0, 3).map((c) => {
              // Each cycle id has a specific destination:
              // - halacha-yomit-kosharot → dedicated daily-halacha screen
              // - others (dafyomi, mishna, tehillim, parsha, etc.) → /learn/[id] dynamic reader
              const route =
                c.id === 'halacha-yomit-kosharot'
                  ? '/learn/halacha-yomit-kosharot'
                  : `/learn/${c.id}`;
              return (
                <Card key={c.id} style={styles.learnCard} onPress={() => router.push(route as any)}>
                  <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={[typography.h3, { color: colors.textPrimary }]}>{c.hebrewName}</Text>
                      <Text style={[typography.body, { color: colors.primary, marginTop: 2 }]}>
                        {c.todayLabel}
                      </Text>
                    </View>
                    <Icon name="book" size={26} color={colors.primary} />
                  </View>
                </Card>
              );
            })}
          </View>
        </Section>

        <Section
          title="קיצורי דרך"
          subtitle="לחץ + לעריכת הרשימה"
        >
          <View style={styles.shortcuts}>
            {shortcuts.map((t) => (
              <Shortcut
                key={t.id}
                emoji={t.emoji}
                iconName={t.iconName}
                label={t.title}
                width={tileWidth}
                onPress={() => handleShortcut(t.id, t.route)}
              />
            ))}
            <AddShortcut width={tileWidth} onPress={() => setPickerOpen(true)} />
          </View>
        </Section>

        <ShortcutPicker
          visible={pickerOpen}
          onClose={() => setPickerOpen(false)}
          selectedIds={favorites}
          onToggle={toggleFavorite}
        />

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function ZmanimCell({ label, time }: { label: string; time: string }) {
  return (
    <View style={styles.zmanCell}>
      <Text
        style={[typography.caption, { color: colors.textMuted, alignSelf: 'stretch' }]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {label}
      </Text>
      <Text
        style={[typography.h3, { color: colors.textPrimary, marginTop: 2, alignSelf: 'stretch' }]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {time}
      </Text>
    </View>
  );
}

function Shortcut({
  emoji,
  iconName,
  label,
  onPress,
  width,
}: {
  emoji: string;
  iconName?: string;
  label: string;
  onPress: () => void;
  width: number;
}) {
  return (
    <Card
      style={[styles.shortcut, { width, minHeight: width }]}
      onPress={onPress}
      padding="sm"
    >
      {iconName ? (
        <Icon name={iconName as any} size={width >= 90 ? 26 : 22} color={colors.primary} strokeWidth={1.5} />
      ) : (
        <Text style={{ fontSize: width >= 90 ? 28 : 24 }}>{emoji}</Text>
      )}
      <Text
        style={[
          {
            color: colors.textPrimary,
            marginTop: 4,
            textAlign: 'center',
            fontWeight: '600',
            fontSize: width >= 90 ? 12 : 11,
            lineHeight: width >= 90 ? 15 : 14,
            paddingHorizontal: 2,
          },
        ]}
      >
        {label}
      </Text>
    </Card>
  );
}

function AddShortcut({ onPress, width }: { onPress: () => void; width: number }) {
  return (
    <Card
      style={[styles.shortcut, styles.shortcutAdd, { width, minHeight: width }]}
      onPress={onPress}
      padding="sm"
      variant="outline"
    >
      <Text style={{ fontSize: width >= 90 ? 28 : 24, color: colors.primary }}>+</Text>
      <Text
        style={[
          {
            color: colors.primary,
            marginTop: 4,
            textAlign: 'center',
            fontWeight: '600',
            fontSize: width >= 90 ? 12 : 11,
          },
        ]}
      >
        הוסף
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingBottom: spacing.xl },
  // Decorative blurred orb in the top-right corner (gold tone).
  glowGold: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: colors.glowGold,
    opacity: 0.5,
  },
  // Decorative blurred orb in the bottom-left (navy tone).
  glowNavy: {
    position: 'absolute',
    bottom: -100,
    left: -100,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: colors.glowNavy,
    opacity: 0.4,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    alignItems: 'flex-start',
  },
  pillRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  locationPill: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  // Gold Shabbat countdown banner shown at the very top on Erev Shabbat
  shabbatBanner: {
    paddingVertical: 10,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  shabbatBannerText: {
    color: '#1a1a1a',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  // "Ask Chavruta..." AI strip below the carousel
  aiStrip: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    backgroundColor: colors.glass,
    borderColor: colors.glassBorder,
    borderWidth: 1,
    borderRadius: 999,
  },
  aiBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiBadgeText: {
    color: colors.bg,
    fontSize: 11,
    fontWeight: '800',
  },
  aiStripText: {
    flex: 1,
    fontSize: 13,
    color: colors.textMuted,
  },
  zmanimGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  zmanCell: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'flex-start',
  },
  learnCard: { marginBottom: spacing.sm },
  shortcuts: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  shortcut: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortcutAdd: {
    borderStyle: 'dashed',
  },
  kitGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  kitCard: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
