import { GoogleGenAI } from "@google/genai";

/**
 * Collects all configured Gemini API keys in priority order:
 * 1. GEMINI_API_KEY (supports single key or comma-separated keys: "key1,key2")
 * 2. GEMINI_API_KEY_BACKUP / GEMINI_BACKUP_KEY
 * 3. GOOGLE_API_KEY / GOOGLE_GENAI_API_KEY / NEXT_PUBLIC_GEMINI_API_KEY
 */
export function getAllGeminiApiKeys(): string[] {
  const candidates: (string | undefined)[] = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
    process.env.GEMINI_API_KEY_4,
    process.env.GEMINI_API_KEY_5,
    process.env.GEMINI_API_KEY_BACKUP,
    process.env.GEMINI_BACKUP_KEY,
    process.env.GOOGLE_API_KEY,
    process.env.GOOGLE_GENAI_API_KEY,
    process.env.NEXT_PUBLIC_GEMINI_API_KEY,
  ];

  const keys: string[] = [];
  for (const candidate of candidates) {
    if (!candidate || candidate === "undefined" || candidate === "null") continue;
    // Support comma-delimited key strings
    const split = candidate.split(",").map((s) => s.trim()).filter(Boolean);
    for (const k of split) {
      if (!keys.includes(k)) {
        keys.push(k);
      }
    }
  }

  return keys;
}

/**
 * Initializes Google Gemini Client if API key exists.
 * Returns client for the primary key (or optional index).
 */
export function getGeminiClient(keyIndex = 0): GoogleGenAI | null {
  const keys = getAllGeminiApiKeys();
  const apiKey = keys[keyIndex];
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * Checks if an error is due to rate-limiting, quota exhaustion, or 429 response.
 */
export function isGeminiQuotaError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const anyErr = err as Record<string, any>;

  if (anyErr.status === 429 || anyErr.code === 429 || anyErr.statusCode === 429) {
    return true;
  }
  if (anyErr.error?.code === 429 || anyErr.error?.status === "RESOURCE_EXHAUSTED") {
    return true;
  }

  const msg = (anyErr.message || anyErr.toString?.() || "").toLowerCase();
  return (
    msg.includes("429") ||
    msg.includes("resource_exhausted") ||
    msg.includes("quota") ||
    msg.includes("rate limit") ||
    msg.includes("too many requests")
  );
}

/**
 * Checks if an error is a transient Gemini capacity or availability issue
 * (429 quota, 503 unavailable, high demand spikes, model temporary overload).
 */
export function isGeminiTransientError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  if (isGeminiQuotaError(err)) return true;

  const anyErr = err as Record<string, any>;
  if (anyErr.status === 503 || anyErr.code === 503 || anyErr.statusCode === 503) {
    return true;
  }
  if (anyErr.error?.code === 503 || anyErr.error?.status === "UNAVAILABLE") {
    return true;
  }

  const msg = (anyErr.message || anyErr.toString?.() || "").toLowerCase();
  return (
    msg.includes("503") ||
    msg.includes("unavailable") ||
    msg.includes("high demand") ||
    msg.includes("temporarily overloaded") ||
    msg.includes("spikes in demand")
  );
}

/**
 * Executes an AI operation with automatic failover across all configured API keys.
 * If Key #1 hits rate limits, quota exhaustion (429), or transient spikes (503),
 * it automatically re-runs the operation with Key #2, etc., with exponential backoff on the final key.
 */
export async function executeWithGeminiFailover<T>(
  operation: (client: GoogleGenAI, apiKeyIndex: number) => Promise<T>
): Promise<T> {
  const keys = getAllGeminiApiKeys();
  if (keys.length === 0) {
    throw new Error("AI service is not configured (GEMINI_API_KEY missing).");
  }

  let lastError: unknown;
  for (let i = 0; i < keys.length; i++) {
    const client = new GoogleGenAI({ apiKey: keys[i] });
    try {
      return await operation(client, i);
    } catch (err: any) {
      lastError = err;
      const isRetriable = isGeminiTransientError(err);
      if (isRetriable) {
        if (i < keys.length - 1) {
          console.warn(
            `[GeminiFailover] Key #${i + 1} hit quota or transient spike (${err?.status || err?.code || "503/429"}). Retrying with backup key #${i + 2}...`
          );
          continue;
        } else {
          // On the final key, if it's a transient 503/high-demand spike, attempt a brief backoff retry
          try {
            await new Promise((resolve) => setTimeout(resolve, 1200));
            return await operation(client, i);
          } catch (retryErr: any) {
            lastError = retryErr;
          }
        }
      }
      throw lastError;
    }
  }

  throw lastError;
}
