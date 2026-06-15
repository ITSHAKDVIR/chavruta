import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';

/**
 * Returns the "current date" the siddur should pretend it is.
 *
 * Honors `?fakeDate=YYYY-MM-DD` (or any Date.parse-able string) for testing
 * conditional content of OTHER moadim (e.g. Chol HaMoed Pesach, Chanukah,
 * fast days) without waiting for that date to arrive. When the param is
 * absent or invalid, returns real `new Date()`.
 *
 * The memo depends on the fakeDate query string only — real-time progression
 * within a session is irrelevant for prayer-content decisions.
 */
export function useEffectiveDate(): Date {
  const { fakeDate } = useLocalSearchParams<{ fakeDate?: string }>();
  return useMemo(() => {
    if (fakeDate) {
      const parsed = new Date(fakeDate);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return new Date();
  }, [fakeDate]);
}
