import { getJSON, setJSON } from './storage';

const KEY_BRACHA_HISTORY = '@yahadut/bracha-history';
const KEY_BRACHA_PREFS = '@yahadut/bracha-prefs';
const KEY_LEVANA_HISTORY = '@yahadut/levana-history';

export type BrachaRecord = { siteId: string; saidAt: number };
export type BrachaHistory = Record<string, number>;

export type BrachaPrefs = {
  geofencingEnabled: boolean;
  geofenceRadiusKm: number;
  silenceUntil: number | null;
  nusachLevana: 'sefardi' | 'ashkenazi';
};

const DEFAULT_PREFS: BrachaPrefs = {
  geofencingEnabled: true,
  geofenceRadiusKm: 6,
  silenceUntil: null,
  nusachLevana: 'ashkenazi',
};

export async function loadBrachaHistory(): Promise<BrachaHistory> {
  return getJSON<BrachaHistory>(KEY_BRACHA_HISTORY, {});
}

export async function recordBracha(siteId: string, when = Date.now()): Promise<BrachaHistory> {
  const cur = await loadBrachaHistory();
  cur[siteId] = when;
  await setJSON(KEY_BRACHA_HISTORY, cur);
  return cur;
}

export async function clearBracha(siteId: string): Promise<BrachaHistory> {
  const cur = await loadBrachaHistory();
  delete cur[siteId];
  await setJSON(KEY_BRACHA_HISTORY, cur);
  return cur;
}

export async function loadBrachaPrefs(): Promise<BrachaPrefs> {
  const v = await getJSON<Partial<BrachaPrefs>>(KEY_BRACHA_PREFS, {});
  return { ...DEFAULT_PREFS, ...v };
}

export async function saveBrachaPrefs(prefs: BrachaPrefs): Promise<void> {
  await setJSON(KEY_BRACHA_PREFS, prefs);
}

export type LevanaRecord = { hyear: number; hmonth: number; saidAt: number };
export async function loadLevanaHistory(): Promise<LevanaRecord[]> {
  return getJSON<LevanaRecord[]>(KEY_LEVANA_HISTORY, []);
}

export async function recordLevana(hyear: number, hmonth: number, when = Date.now()): Promise<LevanaRecord[]> {
  const cur = await loadLevanaHistory();
  const idx = cur.findIndex((r) => r.hyear === hyear && r.hmonth === hmonth);
  if (idx >= 0) cur[idx] = { hyear, hmonth, saidAt: when };
  else cur.push({ hyear, hmonth, saidAt: when });
  await setJSON(KEY_LEVANA_HISTORY, cur);
  return cur;
}

export function saidLevanaThisMonth(history: LevanaRecord[], hyear: number, hmonth: number): boolean {
  return history.some((r) => r.hyear === hyear && r.hmonth === hmonth);
}
