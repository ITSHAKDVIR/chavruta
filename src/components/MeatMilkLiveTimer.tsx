import React, { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from './Card';
import { getJSON, setJSON, Keys } from '../storage/storage';
import { colors, spacing } from '../theme/colors';
import { typography } from '../theme/typography';

type State = {
  startedAt: number | null;
  minhag: '6h' | '5h+' | '5.5h' | '3h' | '1h';
  meal: 'meat' | 'dairy';
  notifId?: string;
  dismissedAt?: number;
};

const HOURS_BY_MINHAG: Record<State['minhag'], number> = {
  '6h': 6, '5h+': 5.01, '5.5h': 5.5, '3h': 3, '1h': 1,
};

/** How long after expiry to keep the "wait ended" reminder on the home page. */
const SHOW_AFTER_END_MS = 6 * 3600_000; // 6 hours

function formatRemaining(ms: number): string {
  if (ms <= 0) return '00:00:00';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function formatHoursAgo(ms: number): string {
  const totalMin = Math.floor(ms / 60_000);
  if (totalMin < 60) return `${totalMin} דקות`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m === 0 ? `${h} שעות` : `${h} שעות ו-${m} דקות`;
}

/**
 * Live home-page card for the meat/milk timer.
 *
 *   Active   → primary card, ticking seconds, dramatic countdown.
 *   Done     → green/accent card, "✓ ניתן לאכול X", stays for up to 6 hours
 *              after expiry until user dismisses it manually.
 */
export function MeatMilkLiveTimer() {
  const router = useRouter();
  const [state, setState] = useState<State | null>(null);
  const [now, setNow] = useState(Date.now());

  // Periodically re-read state from storage (covers cross-screen changes)
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const s = await getJSON<State>(Keys.meatMilkTimer, { startedAt: null, minhag: '6h', meal: 'meat' });
      if (mounted) setState(s);
    };
    load();
    const id = setInterval(load, 10_000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  // Tick every second while active
  useEffect(() => {
    if (!state?.startedAt) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [state?.startedAt]);

  if (!state?.startedAt) return null;

  const hours = HOURS_BY_MINHAG[state.minhag];
  const endsAt = state.startedAt + hours * 3600_000;
  const remaining = endsAt - now;

  const isActive = remaining > 0;
  const elapsedSinceEnd = -remaining; // negative remaining = time since end
  const showAsDone = !isActive && elapsedSinceEnd < SHOW_AFTER_END_MS && !state.dismissedAt;

  const isMeat = state.meal === 'meat';
  const emoji = isMeat ? '🥩' : '🧀';
  const eatenLabel = isMeat ? 'בשר' : 'חלב';
  const nextLabel = isMeat ? 'חלב' : 'בשר';

  async function dismiss(e: any) {
    e.stopPropagation();
    if (!state) return;
    const next = { ...state, dismissedAt: Date.now() };
    setState(next);
    await setJSON(Keys.meatMilkTimer, next);
  }

  if (isActive) {
    const isFinishingSoon = remaining < 10 * 60 * 1000;
    return (
      <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.md }}>
        <Card variant="primary" onPress={() => router.push('/tools/meatmilk' as any)}>
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.md }}>
            <Text style={{ fontSize: 36 }}>{emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[typography.small, { color: colors.textInverse, opacity: 0.85 }]}>
                אכלת {eatenLabel} - עד שניתן לאכול {nextLabel}
              </Text>
              <Text
                style={{
                  fontSize: 32,
                  fontWeight: '700',
                  color: colors.textInverse,
                  marginTop: 4,
                  letterSpacing: 1.5,
                }}
              >
                {formatRemaining(remaining)}
              </Text>
              {isFinishingSoon && (
                <Text style={[typography.caption, { color: colors.textInverse, opacity: 0.85, marginTop: 2 }]}>
                  ✨ מסיים בקרוב
                </Text>
              )}
            </View>
            <Text style={{ color: colors.textInverse, fontSize: 22 }}>‹</Text>
          </View>
        </Card>
      </View>
    );
  }

  if (showAsDone) {
    return (
      <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.md }}>
        <Card variant="accent" onPress={() => router.push('/tools/meatmilk' as any)}>
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.md }}>
            <Text style={{ fontSize: 36 }}>✓</Text>
            <View style={{ flex: 1 }}>
              <Text style={[typography.small, { color: colors.primaryDark, opacity: 0.85 }]}>
                הסתיים זמן ההמתנה ({hours} שעות)
              </Text>
              <Text style={[typography.h3, { color: colors.primaryDark, marginTop: 2 }]}>
                ניתן לאכול {nextLabel}
              </Text>
              <Text style={[typography.caption, { color: colors.primaryDark, opacity: 0.75, marginTop: 2 }]}>
                לפני {formatHoursAgo(elapsedSinceEnd)}
              </Text>
            </View>
            <Pressable onPress={dismiss} hitSlop={10}>
              <Text style={{ color: colors.primaryDark, opacity: 0.6, fontSize: 18 }}>✕</Text>
            </Pressable>
          </View>
        </Card>
      </View>
    );
  }

  return null;
}
