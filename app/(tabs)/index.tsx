import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon } from '../../src/components/Icon';
import { useLocation } from '../../src/hooks/useLocation';
import { useShortcuts } from '../../src/hooks/useShortcuts';
import { useDevicePerformance } from '../../src/hooks/useDevicePerformance';
import { useTick } from '../../src/hooks/useTick';
import {
  hebrewDateInfo,
  holidaysForDate,
  parshahForDate,
  omerDay,
} from '../../src/data/hebcal';
import { Tool } from '../../src/data/tools';
import { Pill } from '../../src/components/Pill';
import { Section } from '../../src/components/Section';
import { Card } from '../../src/components/Card';
import { BrandBar } from '../../src/components/BrandBar';
import { ShortcutPicker } from '../../src/components/ShortcutPicker';
import { IconCluster, IconGrid } from '../../src/components/IconCluster';
import { ToolDetailModal } from '../../src/components/ToolDetailModal';
import { colors, radius, spacing } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

const CLUSTER_HEIGHT = 380;

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

  const { shortcuts, favorites, toggleFavorite, trackUse } = useShortcuts();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);

  const { tier, ready: perfReady } = useDevicePerformance();
  const useCluster = perfReady && tier === 'high';

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

  const onPickFromCluster = (tool: Tool) => setSelectedTool(tool);
  const onOpenFromModal = (tool: Tool) => {
    setSelectedTool(null);
    trackUse(tool.id);
    router.push(tool.route as any);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <LinearGradient
        colors={[colors.gradientStart, colors.bgMid, colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill as any}
      />
      <BrandBar />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* ── ברוך הבא header ── */}
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

        {/* ── 3D icon cluster (or grid fallback on weak devices) ── */}
        {useCluster ? (
          <View style={{ height: CLUSTER_HEIGHT }}>
            <IconCluster height={CLUSTER_HEIGHT} onPick={onPickFromCluster} />
          </View>
        ) : perfReady ? (
          <View style={{ paddingVertical: spacing.md }}>
            <IconGrid onPick={onPickFromCluster} />
          </View>
        ) : null}

        {/* ── Favorites (current home screen shortcuts grid, unchanged) ── */}
        <Section title="המועדפים שלי" subtitle="לחץ + לעריכת הרשימה">
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

      <ToolDetailModal
        tool={selectedTool}
        onClose={() => setSelectedTool(null)}
        onOpen={onOpenFromModal}
      />
    </SafeAreaView>
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
        style={{
          color: colors.textPrimary,
          marginTop: 4,
          textAlign: 'center',
          fontWeight: '600',
          fontSize: width >= 90 ? 12 : 11,
          lineHeight: width >= 90 ? 15 : 14,
          paddingHorizontal: 2,
        }}
        numberOfLines={2}
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
        style={{
          color: colors.primary,
          marginTop: 4,
          textAlign: 'center',
          fontWeight: '600',
          fontSize: width >= 90 ? 12 : 11,
        }}
      >
        הוסף
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingBottom: spacing.xl },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
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
  shortcuts: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  shortcut: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortcutAdd: {
    borderStyle: 'dashed',
  },
});
