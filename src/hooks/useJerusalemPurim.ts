import { useEffect, useState } from 'react';
import { getString, setString, Keys } from '../storage/storage';
import { isJerusalemPurim, setJerusalemPurim } from '../data/purimDay';

export async function loadJerusalemPurim(): Promise<boolean> {
  const v = (await getString(Keys.inJerusalem, '0')) === '1';
  setJerusalemPurim(v);
  return v;
}

export async function saveJerusalemPurim(v: boolean): Promise<void> {
  setJerusalemPurim(v);
  await setString(Keys.inJerusalem, v ? '1' : '0');
}

/** Loads the "אני בירושלים" setting. Screens that compute Purim content list the
 *  returned value in their memo deps so they recompute once it arrives. */
export function useJerusalemPurim(): boolean {
  const [v, setV] = useState(isJerusalemPurim());
  useEffect(() => {
    let alive = true;
    loadJerusalemPurim().then((x) => { if (alive) setV(x); });
    return () => { alive = false; };
  }, []);
  return v;
}
