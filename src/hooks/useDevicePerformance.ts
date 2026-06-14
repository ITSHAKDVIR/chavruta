import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';

export type DeviceTier = 'high' | 'low';

/**
 * Classify the device based on RAM + OS version.
 *
 * - low: under 3 GB RAM, or Android < 10 → fall back to grid layout
 * - high: everything else → can render the 3D icon cluster
 *
 * iOS devices are always treated as 'high' (iOS perf floor is high enough).
 *
 * This is a coarse heuristic, not a benchmark. A second pass measures
 * actual rendering FPS once the cluster is on screen — see useFpsCheck.
 */
function classifyByHardware(): DeviceTier {
  if (Platform.OS !== 'android') return 'high';

  const ram = Device.totalMemory ?? 0; // bytes
  const ramGB = ram / (1024 * 1024 * 1024);
  const osVersion = parseInt(Device.osVersion ?? '0', 10);

  if (ramGB > 0 && ramGB < 3) return 'low';
  if (osVersion > 0 && osVersion < 10) return 'low';
  return 'high';
}

/**
 * Returns the device tier for choosing between cluster and grid.
 * The result is stable for the session.
 */
export function useDevicePerformance(): { tier: DeviceTier; ready: boolean } {
  const [tier, setTier] = useState<DeviceTier>('high');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const result = classifyByHardware();
    setTier(result);
    setReady(true);
  }, []);

  return { tier, ready };
}
