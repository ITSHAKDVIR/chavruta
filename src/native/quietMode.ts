/**
 * Wrapper around the native QuietMode module (Android only).
 * On iOS we no-op because Apple doesn't expose DND control to apps.
 *
 * Native side: see plugins/withQuietMode.js which injects:
 *  - Permission ACCESS_NOTIFICATION_POLICY into AndroidManifest
 *  - Kotlin module com.itzhakdvir.chavruta.quietmode.QuietModeModule
 *
 * Usage:
 *   await toggleSystemDnd(true);   // user is starting to daven → DND on
 *   await toggleSystemDnd(false);  // closed siddur → DND off
 *
 * The first time this is called the user is taken to a system settings
 * screen to grant Notification-Policy access. After granting, future
 * calls toggle DND instantly without any prompt.
 */
import { Platform, Linking, NativeModules } from 'react-native';

type QuietModeNativeModule = {
  hasPolicyAccess(): Promise<boolean>;
  requestPolicyAccess(): Promise<void>;
  setDnd(enabled: boolean): Promise<boolean>;
};

function getNativeModule(): QuietModeNativeModule | null {
  // The module name must match what the Kotlin file declares with Name("...").
  const mod = (NativeModules as any).QuietMode as QuietModeNativeModule | undefined;
  return mod ?? null;
}

/** Returns true if the user has granted Notification Policy access on Android. */
export async function hasDndPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  const mod = getNativeModule();
  if (!mod) return false;
  try { return await mod.hasPolicyAccess(); } catch { return false; }
}

/** Open the system "Do Not Disturb Access" screen so the user can grant access.
 *  On iOS this is a no-op (the API doesn't exist). */
export async function requestDndPermission(): Promise<void> {
  if (Platform.OS !== 'android') return;
  const mod = getNativeModule();
  if (mod) {
    try { await mod.requestPolicyAccess(); return; } catch {}
  }
  // Fallback: deep-link to general settings if the module isn't loaded.
  try { await Linking.openSettings(); } catch {}
}

/** Toggle the device's Do Not Disturb mode.
 *  On iOS we politely show a one-time hint (handled at call site) — the actual
 *  system DND can ONLY be controlled by the user in Settings on iOS. */
export async function toggleSystemDnd(enabled: boolean): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  const mod = getNativeModule();
  if (!mod) {
    // Native module not yet bundled — fall back to opening settings so the
    // user can toggle manually. (This is the case in Expo Go / dev builds.)
    try { await Linking.openSettings(); } catch {}
    return false;
  }
  try {
    const ok = await mod.hasPolicyAccess();
    if (!ok) {
      await mod.requestPolicyAccess();
      return false;
    }
    return await mod.setDnd(enabled);
  } catch {
    return false;
  }
}
