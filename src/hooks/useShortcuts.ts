import { useCallback, useEffect, useState } from 'react';
import { getJSON, setJSON, Keys } from '../storage/storage';
import { TOOLS_BY_ID, DEFAULT_SHORTCUT_IDS, Tool } from '../data/tools';

const INIT_FLAG_KEY = '@yahadut/shortcuts-initialized';
const MIGRATION_KEY = '@yahadut/shortcuts-migration-v2';
const MIGRATION_V3_KEY = '@yahadut/shortcuts-migration-v3';
/** Tools auto-added on migration v2 (one-time, for existing users). */
const V2_MUST_HAVE = ['tfilon'];
/** Tools auto-added on migration v3 — kosher tools (chat AI + restaurants). */
const V3_MUST_HAVE = ['ask-chavruta', 'kosher-restaurants'];

export type ShortcutsState = {
  favorites: string[];
  shortcuts: Tool[];
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => Promise<void>;
  /** No-op kept for API compatibility; usage history not displayed on home. */
  trackUse: (id: string) => Promise<void>;
  reload: () => Promise<void>;
};

let _favCache: string[] | null = null;
let _initDone = false;
const listeners = new Set<() => void>();

async function loadFavorites(): Promise<string[]> {
  if (_favCache !== null) return _favCache;
  // First-run init: seed defaults so a new user sees a useful home page
  if (!_initDone) {
    _initDone = true;
    const initialized = await getJSON<boolean>(INIT_FLAG_KEY, false);
    if (!initialized) {
      await setJSON(Keys.shortcutFavorites, DEFAULT_SHORTCUT_IDS);
      await setJSON(INIT_FLAG_KEY, true);
      await setJSON(MIGRATION_KEY, true);
      await setJSON(MIGRATION_V3_KEY, true);
      _favCache = [...DEFAULT_SHORTCUT_IDS];
      return _favCache;
    }
    // Migration v2: ensure must-have tools (e.g. siddur) appear for existing users.
    const migrated = await getJSON<boolean>(MIGRATION_KEY, false);
    if (!migrated) {
      const current = await getJSON<string[]>(Keys.shortcutFavorites, []);
      const missing = V2_MUST_HAVE.filter((id) => !current.includes(id));
      if (missing.length > 0) {
        const next = [...missing, ...current];
        await setJSON(Keys.shortcutFavorites, next);
      }
      await setJSON(MIGRATION_KEY, true);
    }
    // Migration v3: add Kosharot AI chat + kosher restaurants.
    const migratedV3 = await getJSON<boolean>(MIGRATION_V3_KEY, false);
    if (!migratedV3) {
      const current = await getJSON<string[]>(Keys.shortcutFavorites, []);
      const missing = V3_MUST_HAVE.filter((id) => !current.includes(id));
      if (missing.length > 0) {
        const next = [...current, ...missing];
        await setJSON(Keys.shortcutFavorites, next);
        await setJSON(MIGRATION_V3_KEY, true);
        _favCache = next;
        return _favCache;
      }
      await setJSON(MIGRATION_V3_KEY, true);
    }
  }
  _favCache = await getJSON<string[]>(Keys.shortcutFavorites, []);
  return _favCache;
}

async function saveFavorites(favs: string[]) {
  _favCache = favs;
  await setJSON(Keys.shortcutFavorites, favs);
}

function notify() {
  listeners.forEach((fn) => fn());
}

export function useShortcuts(): ShortcutsState {
  const [favorites, setFavorites] = useState<string[]>([]);

  const reload = useCallback(async () => {
    const favs = await loadFavorites();
    setFavorites([...favs]);
  }, []);

  useEffect(() => {
    reload();
    listeners.add(reload);
    return () => {
      listeners.delete(reload);
    };
  }, [reload]);

  const isFavorite = useCallback((id: string) => favorites.includes(id), [favorites]);

  const toggleFavorite = useCallback(async (id: string) => {
    const favs = await loadFavorites();
    const next = favs.includes(id) ? favs.filter((x) => x !== id) : [...favs, id];
    await saveFavorites(next);
    notify();
  }, []);

  const trackUse = useCallback(async (id: string) => {
    // Mark tool as "seen" so the discovery hook stops suggesting it.
    try {
      const seen = await getJSON<string[]>('@yahadut/seen-tools-v1', []);
      if (!seen.includes(id)) {
        await setJSON('@yahadut/seen-tools-v1', [...seen, id]);
      }
    } catch {}
  }, []);

  const shortcuts = favorites.map((id) => TOOLS_BY_ID[id]).filter(Boolean);

  return { favorites, shortcuts, isFavorite, toggleFavorite, trackUse, reload };
}
