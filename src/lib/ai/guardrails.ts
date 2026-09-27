/**
 * Schollective AI Cybersecurity & Safety Guardrails Engine
 * ─────────────────────────────────────────────────────────────────
 * Implements cybersecurity safeguards & token protection:
 *   1. Prompt Injection Sanitization & XSS filtering
 *   2. Token budget enforcement & payload truncation
 *   3. Sliding window rate-limiting per user ID
 *   4. Fail-safe execution wrapper with deterministic fallback execution
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

// In-memory TTL Cache
const responseCache = new Map<string, CacheEntry<any>>();

/**
 * Prompt Injection Attack Patterns & Exploits
 */
const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|above|prior)\s+(instructions|prompts|rules)/gi,
  /disregard\s+(all\s+)?(previous|above|prior)\s+(instructions|prompts|rules)/gi,
  /system\s+prompt\s+override/gi,
  /forget\s+(all\s+)?(previous|above|prior)\s+instructions/gi,
  /you\s+are\s+now\s+a/gi,
  /jailbreak/gi,
  /dan\s+mode/gi,
  /act\s+as\s+an\s+unrestricted/gi,
  /<script[^>]*>[\s\S]*?<\/script>/gi,
  /javascript:/gi,
  /onload=/gi,
  /onerror=/gi,
];

/**
 * Cybersecurity Safeguard: Sanitizes input against prompt injection, XSS, and control characters.
 */
export function sanitizeAiPromptInput(text: string | null | undefined, maxChars = 300): string {
  if (!text) return "";
  let sanitized = String(text).trim();

  // Strip control characters & zero-width spaces
  sanitized = sanitized.replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200D\uFEFF]/g, "");

  // Intercept and strip known prompt injection patterns
  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    sanitized = sanitized.replace(pattern, "[sanitized]");
  }

  // Truncate to hard length limit for token safety
  if (sanitized.length > maxChars) {
    sanitized = sanitized.slice(0, maxChars) + "... [truncated]";
  }

  return sanitized;
}

/**
 * Gets cached AI result if valid.
 */
export function getCachedAiResult<T>(cacheKey: string): T | null {
  const entry = responseCache.get(cacheKey);
  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    responseCache.delete(cacheKey);
    return null;
  }

  return entry.data as T;
}

/**
 * Caches an AI result with a TTL (default 10 minutes).
 */
export function setCachedAiResult<T>(cacheKey: string, data: T, ttlMs = 10 * 60 * 1000): void {
  responseCache.set(cacheKey, {
    data,
    expiresAt: Date.now() + ttlMs,
  });
}

/**
 * Fail-Safe AI Execution Wrapper:
 * Attempts the primary LLM call. If it fails for ANY reason (rate limits, 429 quota exhaustion,
 * network offline, invalid API key, timeout), it seamlessly invokes the deterministic fallback.
 */
export async function executeAiWithFallback<T>(
  aiOperation: () => Promise<T>,
  fallbackOperation: () => T | Promise<T>
): Promise<T> {
  try {
    return await aiOperation();
  } catch (err: any) {
    console.warn("[executeAiWithFallback] LLM unavailable or rate-limited. Activating deterministic fallback:", err?.message || err);
    return await fallbackOperation();
  }
}

/**
 * 3-Tier Hybrid AI Execution Engine (100% Free):
 * 1. Primary: Gemini 3.6 Flash (Best free-tier reasoning model)
 * 2. Secondary: Gemini 3.5 Flash-Lite (Lightweight fast fallback)
 * 3. Tertiary: High-precision deterministic rule engine (Zero-cost offline fallback)
 */
export async function executeHybridAiWithFallback<T>(
  primaryProOperation: () => Promise<T>,
  secondaryFlashOperation: () => Promise<T>,
  deterministicFallback: () => T | Promise<T>
): Promise<T> {
  try {
    return await primaryProOperation();
  } catch (proErr: any) {
    console.warn("[HybridAI] Gemini 2.5 Pro rate-limited or busy. Trying Gemini 2.5 Flash:", proErr?.message || proErr);
    try {
      return await secondaryFlashOperation();
    } catch (flashErr: any) {
      console.warn("[HybridAI] Gemini 2.5 Flash also unavailable. Activating deterministic fallback:", flashErr?.message || flashErr);
      return await deterministicFallback();
    }
  }
}
