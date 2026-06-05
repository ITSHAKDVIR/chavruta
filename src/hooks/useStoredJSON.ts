import { useCallback, useEffect, useState } from 'react';
import { getJSON, setJSON } from '../storage/storage';

export function useStoredJSON<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const v = await getJSON<T>(key, initial);
      if (mounted) {
        setValue(v);
        setLoaded(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [key]);

  const save = useCallback(
    async (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const updated = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
        setJSON(key, updated);
        return updated;
      });
    },
    [key],
  );

  return [value, save, loaded] as const;
}
