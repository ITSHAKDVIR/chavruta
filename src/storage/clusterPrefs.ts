import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * 3D icon cluster preference on the home screen.
 *
 * - 'auto' (default): show the cluster on capable devices, plain grid on weak ones
 * - 'on'             : force the cluster everywhere
 * - 'off'            : force plain grid everywhere
 */
export type ClusterPref = 'auto' | 'on' | 'off';

const KEY = '@chavruta/cluster_pref';

export async function loadClusterPref(): Promise<ClusterPref> {
  try {
    const v = await AsyncStorage.getItem(KEY);
    if (v === 'on' || v === 'off' || v === 'auto') return v;
  } catch {}
  return 'auto';
}

export async function saveClusterPref(pref: ClusterPref): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, pref);
  } catch {}
}
