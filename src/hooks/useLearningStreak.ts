import { useCallback, useEffect, useState } from 'react';
import { getJSON, setJSON } from '../storage/storage';

const KEY = '@yahadut/learning-streak';

type StreakData = {
  /** Map of cycleId+dateISO → true. Tracks what user marked as learned. */
  marks: Record<string, boolean>;
  /** Last day the user marked anything (ISO date). For streak continuity. */
  lastMarkDate: string | null;
  /** Current consecutive streak length, in days. */
  currentStreak: number;
  /** Best ever streak. */
  bestStreak: number;
};

const DEFAULT: StreakData = {
  marks: {},
  lastMarkDate: null,
  currentStreak: 0,
  bestStreak: 0,
};

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a + 'T00:00:00').getTime();
  const db = new Date(b + 'T00:00:00').getTime();
  return Math.round((db - da) / 86400000);
}

/**
 * Hook for marking daily learning items as completed and tracking a streak
 * across days. Streak resets if a day is skipped.
 */
export function useLearningStreak() {
  const [data, setData] = useState<StreakData>(DEFAULT);

  useEffect(() => {
    (async () => {
      const d = await getJSON<StreakData>(KEY, DEFAULT);
      setData({ ...DEFAULT, ...d });
    })();
  }, []);

  const persist = useCallback(async (next: StreakData) => {
    setData(next);
    await setJSON(KEY, next);
  }, []);

  const markLearned = useCallback(
    async (cycleId: string) => {
      const today = todayISO();
      const markKey = `${cycleId}::${today}`;
      const next: StreakData = { ...data, marks: { ...data.marks, [markKey]: true } };
      // Update streak: if last mark was yesterday → +1; today → unchanged;
      // earlier → reset to 1.
      if (data.lastMarkDate === today) {
        // already counted today
      } else if (data.lastMarkDate && daysBetween(data.lastMarkDate, today) === 1) {
        next.currentStreak = data.currentStreak + 1;
      } else {
        next.currentStreak = 1;
      }
      next.lastMarkDate = today;
      next.bestStreak = Math.max(next.bestStreak, next.currentStreak);
      await persist(next);
    },
    [data, persist],
  );

  const unmarkLearned = useCallback(
    async (cycleId: string) => {
      const today = todayISO();
      const markKey = `${cycleId}::${today}`;
      const { [markKey]: _, ...rest } = data.marks;
      await persist({ ...data, marks: rest });
    },
    [data, persist],
  );

  const isLearnedToday = useCallback(
    (cycleId: string): boolean => {
      const today = todayISO();
      return !!data.marks[`${cycleId}::${today}`];
    },
    [data.marks],
  );

  /** Number of distinct cycles marked today. */
  const markedToday = (() => {
    const today = todayISO();
    return Object.keys(data.marks).filter((k) => k.endsWith(`::${today}`)).length;
  })();

  return {
    currentStreak: data.currentStreak,
    bestStreak: data.bestStreak,
    markedToday,
    markLearned,
    unmarkLearned,
    isLearnedToday,
  };
}
