/**
 * Fetch the canonical Monday/Thursday Torah aliyot from Hebcal's leyning API.
 *
 * Hebcal returns 3 aliyot per parsha for weekday readings, each with a book
 * name, begin verse, and end verse. We then turn each into a Sefaria ref and
 * fetch the actual text via fetchSefariaText.
 *
 * API: https://www.hebcal.com/leyning?cfg=json&start=YYYY-MM-DD&end=YYYY-MM-DD
 */

export type WeekdayAliya = {
  /** Sefaria book name, e.g. "Numbers" */
  book: string;
  /** Begin verse, e.g. "16:1" */
  begin: string;
  /** End verse, e.g. "16:3" */
  end: string;
  /** Verse count */
  verses: number;
};

export type WeekdayLeyning = {
  /** English parsha name from Hebcal, e.g. "Korach" */
  parsha: string;
  /** ISO date YYYY-MM-DD for which this reading applies */
  date: string;
  aliyot: WeekdayAliya[];
};

function fmtDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Find the next Monday or Thursday (inclusive of today if today is Mon/Thu). */
function nextMonOrThu(from: Date): Date {
  const d = new Date(from);
  d.setHours(0, 0, 0, 0);
  for (let i = 0; i < 7; i++) {
    const dow = d.getDay();
    if (dow === 1 || dow === 4) return d;
    d.setDate(d.getDate() + 1);
  }
  return d;
}

export async function fetchMondayThursdayLeyning(now: Date = new Date(), inIsrael = true): Promise<WeekdayLeyning | null> {
  const target = nextMonOrThu(now);
  const day = fmtDate(target);
  const iParam = inIsrael ? 'on' : 'off';
  const url = `https://www.hebcal.com/leyning?cfg=json&i=${iParam}&start=${day}&end=${day}`;
  try {
    const r = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!r.ok) return null;
    const data: any = await r.json();
    const items: any[] = data?.items ?? [];
    // Find an item with weekday aliyot
    const item = items.find((it) => it.weekday && Object.keys(it.weekday).length >= 3);
    if (!item) return null;
    const wd = item.weekday;
    const aliyot: WeekdayAliya[] = ['1', '2', '3']
      .map((k) => wd[k])
      .filter(Boolean)
      .map((a: any) => ({ book: a.k, begin: a.b, end: a.e, verses: a.v }));
    if (aliyot.length === 0) return null;
    return {
      parsha: item.name?.en ?? '',
      date: item.date ?? day,
      aliyot,
    };
  } catch {
    return null;
  }
}

/** Build a Sefaria ref for a weekday aliya, e.g. "Numbers 16:1-16:3". */
export function aliyaToSefariaRef(a: WeekdayAliya): string {
  return `${a.book} ${a.begin}-${a.end}`;
}
