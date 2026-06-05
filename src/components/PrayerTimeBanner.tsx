/**
 * PrayerTimeBanner — top-of-page strip that warns the user if they opened
 * a prayer outside its halachic window, or if the end is approaching.
 *
 * Self-updating: re-renders every 30 seconds so the "X minutes left" counter
 * stays accurate while the user is reading.
 */
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Icon } from './Icon';
import { colors, radius, spacing } from '../theme/colors';
import { typography } from '../theme/typography';
import type { PrayerWarning } from '../data/prayerTimeWindows';
import { getPrayerWarning, PrayerKind } from '../data/prayerTimeWindows';
import type { ZmanimResult } from '../data/hebcal';

type Props = {
  kind: PrayerKind;
  zmanim: ZmanimResult;
};

// Banners sit on the navy/glass app background — need high-contrast colors.
// Use SOLID-but-soft backgrounds with bright text for readability.
const TONE: Record<PrayerWarning['level'], { bg: string; border: string; fg: string; subFg: string; icon: 'info' | 'warning' | 'clock' }> = {
  info:   { bg: 'rgba(96,165,250,0.18)', border: '#60a5fa', fg: '#dbeafe', subFg: '#bfdbfe', icon: 'info' },
  warn:   { bg: 'rgba(250,204,21,0.18)', border: '#facc15', fg: '#fef3c7', subFg: '#fde68a', icon: 'warning' },
  urgent: { bg: 'rgba(248,113,113,0.22)', border: '#f87171', fg: '#fee2e2', subFg: '#fecaca', icon: 'clock' },
};

export function PrayerTimeBanner({ kind, zmanim }: Props) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const warning = getPrayerWarning(kind, zmanim, now);
  if (!warning) return null;

  const tone = TONE[warning.level];
  return (
    <View style={[styles.box, { backgroundColor: tone.bg, borderColor: tone.border }]}>
      <View style={{ flex: 1 }}>
        <Text style={[typography.bodyBold, { color: tone.fg }]}>
          {warning.title}
        </Text>
        {warning.body && (
          <Text style={[typography.small, { color: tone.subFg, marginTop: 2 }]}>
            {warning.body}
          </Text>
        )}
      </View>
      <Icon name={tone.icon === 'clock' ? 'clock' : tone.icon === 'warning' ? 'warning' : 'info'} size={22} color={tone.fg} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderRightWidth: 4,
  },
});
