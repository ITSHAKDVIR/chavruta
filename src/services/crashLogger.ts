/**
 * On-device crash logger. Captures JS errors via ErrorUtils + console.error,
 * persists them to AsyncStorage so they survive crashes, and can be displayed
 * on the next launch. Lets us debug production crashes without USB / adb.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_CRASHES = '@yahadut/crash-log';
const MAX_ENTRIES = 10;

export type CrashEntry = {
  ts: number;
  kind: 'fatal' | 'error' | 'warn';
  message: string;
  stack?: string;
  componentStack?: string;
  context?: string;
};

let installed = false;

export function installCrashLogger() {
  if (installed) return;
  installed = true;

  // 1. Capture uncaught JS errors via React Native's ErrorUtils
  try {
    const g: any = typeof globalThis !== 'undefined' ? globalThis : {};
    const ErrorUtils = g.ErrorUtils;
    if (ErrorUtils && typeof ErrorUtils.setGlobalHandler === 'function') {
      const originalHandler = ErrorUtils.getGlobalHandler?.();
      ErrorUtils.setGlobalHandler((error: any, isFatal: boolean) => {
        logCrashSync({
          ts: Date.now(),
          kind: isFatal ? 'fatal' : 'error',
          message: String(error?.message ?? error),
          stack: String(error?.stack ?? ''),
          context: 'ErrorUtils.globalHandler',
        });
        // Still call the original handler so RN shows its own red-box if in dev
        try {
          originalHandler?.(error, isFatal);
        } catch {}
      });
    }
  } catch {}

  // 2. Capture unhandled promise rejections
  try {
    const onRejection = (e: any) => {
      const reason = e?.reason ?? e;
      logCrashSync({
        ts: Date.now(),
        kind: 'error',
        message: 'Unhandled promise rejection: ' + String(reason?.message ?? reason),
        stack: String(reason?.stack ?? ''),
        context: 'unhandledrejection',
      });
    };
    if (typeof addEventListener === 'function') {
      addEventListener('unhandledrejection', onRejection);
    }
  } catch {}

  // Intentionally NOT intercepting console.error — that channel produces
  // thousands of dev-mode noise warnings (e.g. RN-Web "Unexpected text node"
  // every render) and would fill up AsyncStorage on the user's device for no
  // diagnostic value. Real crashes are captured by ErrorUtils + the promise
  // rejection handler above.
}

/** Synchronously schedule a save - fire-and-forget. */
function logCrashSync(entry: CrashEntry) {
  saveCrash(entry).catch(() => {});
}

async function saveCrash(entry: CrashEntry) {
  try {
    const raw = await AsyncStorage.getItem(KEY_CRASHES);
    const list: CrashEntry[] = raw ? JSON.parse(raw) : [];
    list.unshift(entry); // newest first
    const trimmed = list.slice(0, MAX_ENTRIES);
    await AsyncStorage.setItem(KEY_CRASHES, JSON.stringify(trimmed));
  } catch {}
}

export async function getCrashes(): Promise<CrashEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY_CRASHES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function clearCrashes(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY_CRASHES);
  } catch {}
}

/** Returns a formatted, copyable text of all stored crashes. */
export async function getCrashesAsText(): Promise<string> {
  const list = await getCrashes();
  if (list.length === 0) return 'אין שגיאות מתועדות.';
  return list
    .map((c, i) => {
      const time = new Date(c.ts).toLocaleString('he-IL');
      return `=== ${i + 1}/${list.length} [${c.kind.toUpperCase()}] ${time} ===\n` +
        `Context: ${c.context ?? ''}\n` +
        `Message: ${c.message}\n` +
        (c.stack ? `Stack:\n${c.stack}\n` : '') +
        (c.componentStack ? `Component:\n${c.componentStack}\n` : '');
    })
    .join('\n');
}
