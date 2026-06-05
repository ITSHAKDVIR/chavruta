import { useCallback, useEffect, useState } from 'react';
import { StoredLocation } from '../data/hebcal';
import { getJSON, setJSON } from '../storage/storage';

const KEY = '@yahadut/saved-locations';

/**
 * Manage a list of locations the user has pinned for quick access on the
 * Zmanim screen (swipe between them without changing the primary location).
 */
export function useSavedLocations() {
  const [saved, setSaved] = useState<StoredLocation[]>([]);

  useEffect(() => {
    (async () => {
      const v = await getJSON<StoredLocation[]>(KEY, []);
      setSaved(v);
    })();
  }, []);

  const persist = useCallback(async (list: StoredLocation[]) => {
    setSaved(list);
    await setJSON(KEY, list);
  }, []);

  const add = useCallback(
    async (loc: StoredLocation) => {
      // Don't duplicate by name
      if (saved.some((s) => s.name === loc.name)) return;
      await persist([...saved, loc]);
    },
    [saved, persist],
  );

  const remove = useCallback(
    async (name: string) => {
      await persist(saved.filter((s) => s.name !== name));
    },
    [saved, persist],
  );

  const move = useCallback(
    async (name: string, delta: -1 | 1) => {
      const idx = saved.findIndex((s) => s.name === name);
      if (idx < 0) return;
      const target = idx + delta;
      if (target < 0 || target >= saved.length) return;
      const list = [...saved];
      [list[idx], list[target]] = [list[target], list[idx]];
      await persist(list);
    },
    [saved, persist],
  );

  return { saved, add, remove, move };
}
