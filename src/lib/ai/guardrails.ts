/**
 * Schollective AI Safety Guards & Token Protection Engine
 * ─────────────────────────────────────────────────────────────────
 * Protects against excessive token usage, runaway prompt lengths,
 * and high API costs via:
 *   1. Input payload truncation (strict field bounds)
 *   2. Server-side TTL caching (prevents duplicate API hits)
 *   3. Sliding window rate-limiting per user ID
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

// In-memory TTL Cache
const responseCache = new Map<string, CacheEntry<any>>();

// User Request Counters: userId -> Array of timestamps
const rateLimitMap = new Map<string, number[]>();

/**
 * Checks if a user has exceeded their AI request quota.
 * Default: Max 10 requests per 10 minutes per user.
 */
export function checkUserAiRateLimit(
  userId: string,
  maxRequestsWindow = 10,
  windowMs = 10 * 60 * 1000
): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
  const now = Date.now();
  const timestamps = rateLimitMap.get(userId) || [];

  // Filter out timestamps older than windowMs
  const validTimestamps = timestamps.filter((ts) => now - ts < windowMs);

  if (validTimestamps.length >= maxRequestsWindow) {
    const oldest = validTimestamps[0];
    const retryAfter = Math.ceil((oldest + windowMs - now) / 1000);
    return { allowed: false, remaining: 0, retryAfterSeconds: Math.max(1, retryAfter) };
  }

  validTimestamps.push(now);
  rateLimitMap.set(userId, validTimestamps);

  return {
    allowed: true,
    remaining: maxRequestsWindow - validTimestamps.length,
    retryAfterSeconds: 0,
  };
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
 * Safely truncates input text to prevent token budget exhaustion.
 */
export function truncatePromptText(text: string | null | undefined, maxChars = 400): string {
  if (!text) return "";
  const trimmed = text.trim();
  if (trimmed.length <= maxChars) return trimmed;
  return trimmed.slice(0, maxChars) + "... [truncated for token safety]";
}
