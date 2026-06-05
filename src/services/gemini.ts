/**
 * Gemini client - talks to our PHP proxy on kosharot.co.il which forwards to
 * the actual Gemini API. The proxy holds the API key; we just hold a static
 * token so the proxy can identify our app.
 *
 * If the token leaks (e.g., someone decompiles the APK), the server admin can
 * rotate the token in PHP and we'll ship an app update with the new value.
 */

const PROXY_URL = 'https://www.kosharot.co.il/BIMD/chavruta-gemini.php';
const APP_TOKEN = 'chv_BimD7k9pQrX2vN8mLwY3xZf';

export type GeminiResponse =
  | { success: true; text: string; model: string }
  | { success: false; error: string };

export type GeminiOpts = {
  /** The text prompt — required. */
  prompt: string;
  /** Optional base64-encoded image (no data: prefix). */
  imageB64?: string;
  /** Image MIME type. Default 'image/jpeg'. */
  mimeType?: string;
  /** Override request timeout. Default 60s. */
  timeoutMs?: number;
};

/**
 * Send a prompt (and optionally an image) to Gemini via our proxy.
 * Returns parsed Gemini text or an error string.
 */
export async function askGemini(opts: GeminiOpts): Promise<GeminiResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 60_000);

  try {
    const body: Record<string, unknown> = { prompt: opts.prompt };
    if (opts.imageB64) {
      body.image = opts.imageB64;
      body.mimeType = opts.mimeType ?? 'image/jpeg';
    }

    const res = await fetch(PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Chavruta-Token': APP_TOKEN,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timer);

    const txt = await res.text();
    let parsed: any;
    try {
      parsed = JSON.parse(txt);
    } catch {
      return { success: false, error: `Bad response (${res.status}): ${txt.slice(0, 200)}` };
    }

    if (!res.ok || parsed.success === false) {
      return { success: false, error: parsed.error || `HTTP ${res.status}` };
    }
    if (typeof parsed.text !== 'string') {
      return { success: false, error: 'Missing text in response' };
    }
    return { success: true, text: parsed.text, model: parsed.model || 'gemini' };
  } catch (e: any) {
    clearTimeout(timer);
    if (e.name === 'AbortError') {
      return { success: false, error: 'הבקשה נמשכה יותר מדי - נסה שוב' };
    }
    return { success: false, error: e.message || 'שגיאה לא ידועה' };
  }
}

/**
 * Read a file at the given URI and return its base64 contents (without data: prefix).
 * Works for local file paths from expo-image-picker / expo-image-manipulator.
 *
 * SDK 56 note: the top-level `readAsStringAsync` from `expo-file-system` is
 * deprecated and now throws at runtime. The supported fallback is to import
 * from the `/legacy` subpath (per docs.expo.dev/versions/v56.0.0/sdk/filesystem).
 */
export async function imageUriToBase64(uri: string): Promise<string> {
  const FS: any = await import('expo-file-system/legacy');
  return await FS.readAsStringAsync(uri, { encoding: 'base64' });
}
