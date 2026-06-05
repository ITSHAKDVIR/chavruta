import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Vibration } from 'react-native';
import * as ExpoAudio from 'expo-audio';
import { useStoredJSON } from './useStoredJSON';

const KEY = '@yahadut/raashan-prefs';

export type RaashanSound = 'ratchet' | 'horn' | 'siren' | 'whistle' | 'bell';

export const SOUND_OPTIONS: { id: RaashanSound; label: string; emoji: string }[] = [
  { id: 'ratchet', label: 'רעשן עץ', emoji: '🪅' },
  { id: 'horn', label: 'צופר', emoji: '📯' },
  { id: 'siren', label: 'סירנה', emoji: '🚨' },
  { id: 'whistle', label: 'שריקה', emoji: '😤' },
  { id: 'bell', label: 'פעמון', emoji: '🔔' },
];

export type RaashanPrefs = {
  vibration: boolean;
  shakeEnabled: boolean;
  count: number;
  sound: RaashanSound;
};

export const DEFAULT_RAASHAN_PREFS: RaashanPrefs = {
  vibration: true,
  shakeEnabled: true,
  count: 0,
  sound: 'ratchet',
};

const SOUND_ASSETS: Record<RaashanSound, number> = {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  ratchet: require('../../assets/raashan.wav'),
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  horn: require('../../assets/raashan-horn.wav'),
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  siren: require('../../assets/raashan-siren.wav'),
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  whistle: require('../../assets/raashan-whistle.wav'),
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  bell: require('../../assets/raashan-bell.wav'),
};

let _audioModeConfigured = false;
async function ensureAudioMode() {
  if (_audioModeConfigured) return;
  _audioModeConfigured = true;
  try {
    const mod: any = ExpoAudio as any;
    if (typeof mod.setAudioModeAsync === 'function') {
      await mod.setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: false,
        interruptionMode: 'mixWithOthers',
      });
    }
  } catch (e) {
    console.warn('[useRaashan] setAudioModeAsync failed:', e);
  }
}

/**
 * Shared raashan firing logic with WAV sound + vibration. Supports multiple
 * sound presets — caches one player per sound id so switching is instant.
 * Also supports a "hold-to-loop" mode for sustained noise.
 */
export function useRaashan() {
  const [prefs, setPrefs] = useStoredJSON<RaashanPrefs>(KEY, DEFAULT_RAASHAN_PREFS);
  const [playing, setPlaying] = useState(false);

  // One cached player per sound id
  const playerCacheRef = useRef<Partial<Record<RaashanSound, any>>>({});
  const playingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loopingRef = useRef(false);

  useEffect(() => {
    ensureAudioMode().catch(() => {});
    return () => {
      const cache = playerCacheRef.current;
      for (const k of Object.keys(cache)) {
        try {
          (cache as any)[k]?.remove?.();
        } catch {}
      }
      playerCacheRef.current = {};
      if (playingTimerRef.current) clearTimeout(playingTimerRef.current);
    };
  }, []);

  async function getPlayer(): Promise<any | null> {
    if (Platform.OS === 'web') return null;
    await ensureAudioMode();
    const soundId = prefs.sound ?? 'ratchet';
    let player = playerCacheRef.current[soundId];
    if (!player) {
      const asset = SOUND_ASSETS[soundId];
      player = (ExpoAudio as any).createAudioPlayer(asset);
      try {
        player.volume = 1.0;
        player.muted = false;
      } catch {}
      playerCacheRef.current[soundId] = player;
    }
    return player;
  }

  async function startLoop() {
    if (loopingRef.current) return;
    loopingRef.current = true;
    if (prefs.vibration && Platform.OS !== 'web') {
      // Long pulsed vibration that we'll cancel on stopLoop
      Vibration.vibrate([0, 80, 40, 80, 40, 80, 40, 80, 40, 80, 40, 80, 40, 80, 40, 80, 40, 80, 40, 80], true);
    }
    setPlaying(true);
    try {
      if (Platform.OS === 'web') {
        return;
      }
      const player = await getPlayer();
      if (!player) return;
      try {
        player.loop = true;
      } catch {}
      try {
        await player.seekTo(0);
      } catch {}
      try {
        player.play();
      } catch (e) {
        console.warn('[useRaashan] loop play failed:', e);
      }
    } catch (e) {
      console.warn('[useRaashan] startLoop failed:', e);
    }
    setPrefs((p) => ({ ...p, count: p.count + 1 }));
  }

  async function stopLoop() {
    if (!loopingRef.current) return;
    loopingRef.current = false;
    Vibration.cancel();
    setPlaying(false);
    try {
      const soundId = prefs.sound ?? 'ratchet';
      const player = playerCacheRef.current[soundId];
      if (player) {
        try {
          player.loop = false;
        } catch {}
        try {
          player.pause();
        } catch {}
        try {
          await player.seekTo(0);
        } catch {}
      }
    } catch {}
  }

  const fire = useCallback(async function fire() {
    if (prefs.vibration && Platform.OS !== 'web') {
      Vibration.vibrate([0, 60, 30, 60, 30, 60]);
    }
    setPlaying(true);
    if (playingTimerRef.current) clearTimeout(playingTimerRef.current);
    playingTimerRef.current = setTimeout(() => setPlaying(false), 350);

    try {
      if (Platform.OS === 'web') {
        // Web fallback: simple noise burst (no asset support without metro)
        // @ts-ignore - browser-only
        const ctx = new (window as any).AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sawtooth';
        osc.frequency.value = 220;
        gain.gain.value = 0.5;
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      } else {
        await ensureAudioMode();
        const soundId = prefs.sound ?? 'ratchet';
        let player = playerCacheRef.current[soundId];
        if (!player) {
          const asset = SOUND_ASSETS[soundId];
          player = (ExpoAudio as any).createAudioPlayer(asset);
          try {
            player.volume = 1.0;
            player.muted = false;
          } catch {}
          playerCacheRef.current[soundId] = player;
        }
        try {
          await player.seekTo(0);
        } catch {}
        try {
          player.play();
        } catch (e) {
          console.warn('[useRaashan] play() failed:', e);
        }
      }
    } catch (e) {
      console.warn('[useRaashan] sound failed:', e);
    }

    setPrefs((p) => ({ ...p, count: p.count + 1 }));
  }, [prefs.sound, prefs.vibration, setPrefs]);

  const stableStartLoop = useCallback(startLoop, [prefs.sound, prefs.vibration, setPrefs]);
  const stableStopLoop = useCallback(stopLoop, [prefs.sound, setPrefs]);

  return { prefs, setPrefs, playing, fire, startLoop: stableStartLoop, stopLoop: stableStopLoop };
}
