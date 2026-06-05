/**
 * Live pruta / shaveh-pruta / pidion-haben values, sourced from
 * pruta-silver.com (which itself tracks the world silver exchange in
 * real time).
 *
 * Endpoint: GET https://pruta-silver.com/data.php?type_data=current_data
 * Returns: { silver, gold, dolar, silver_calc, gold_calc, date, time, maam }
 *   - silver_calc  : silver price in NIS / gram (real number)
 *   - maam         : VAT factor (typically 1.18)
 *
 * Formulas extracted from the site's main.js:
 *   pruta_bursa     = silver_calc * 0.025 * 100   (agorot, exchange price)
 *   pruta_retailer  = silver_calc * 0.025 * 100 * retailer_factor * maam
 *   pidyon_haben_101 = silver_calc * 101          (NIS, 101g of silver)
 *   pidyon_haben_96  = silver_calc * 96           (NIS, 96g — Chazon Ish)
 *
 * We cache successful responses in AsyncStorage so the screens have
 * something to show offline.
 */
const ENDPOINT = 'https://pruta-silver.com/data.php?type_data=current_data';
const CACHE_KEY = '@chavruta/pruta-silver';

export type PrutaSnapshot = {
  silverCalc: number;        // NIS per gram of silver
  maam: number;              // VAT factor (e.g. 1.18)
  prutaBursa: number;        // agorot — exchange-rate pruta
  prutaRetailer: number;     // agorot — retail (with retail markup + VAT)
  shavehPruta: number;       // NIS — minimum monetary value (= pruta_bursa / 100)
  pidyonHaben101: number;    // NIS — Pidyon HaBen, 101g silver
  pidyonHaben96: number;     // NIS — Pidyon HaBen, 96g (Chazon Ish)
  date: string;              // "DD/MM/YYYY"
  time: string;              // "HH:MM:SS"
  fetchedAt: number;         // ms epoch
};

/** Retail markup factor — site default is 10% (1.10). */
const RETAILER_FACTOR = 1.10;

function compute(silverCalc: number, maam: number, date: string, time: string): PrutaSnapshot {
  const prutaBursa = +(silverCalc * 0.025 * 100).toFixed(2);
  const prutaRetailer = +(silverCalc * 0.025 * 100 * RETAILER_FACTOR * maam).toFixed(2);
  return {
    silverCalc,
    maam,
    prutaBursa,
    prutaRetailer,
    shavehPruta: +(prutaBursa / 100).toFixed(4),
    pidyonHaben101: +(silverCalc * 101).toFixed(2),
    pidyonHaben96: +(silverCalc * 96).toFixed(2),
    date,
    time,
    fetchedAt: Date.now(),
  };
}

export async function fetchPrutaValues(): Promise<PrutaSnapshot | null> {
  try {
    const r = await fetch(`${ENDPOINT}&t=${Date.now()}`);
    if (!r.ok) return null;
    const data: any = await r.json();
    if (typeof data?.silver_calc !== 'number') return null;
    const snap = compute(data.silver_calc, data.maam ?? 1.18, data.date || '', data.time || '');
    try {
      const AS: any = (await import('@react-native-async-storage/async-storage')).default;
      await AS.setItem(CACHE_KEY, JSON.stringify(snap));
    } catch {}
    return snap;
  } catch {
    return null;
  }
}

/** Read the last-known snapshot from cache; useful when offline or before
 *  the first fetch completes. */
export async function getCachedPrutaValues(): Promise<PrutaSnapshot | null> {
  try {
    const AS: any = (await import('@react-native-async-storage/async-storage')).default;
    const raw = await AS.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PrutaSnapshot;
  } catch {
    return null;
  }
}
