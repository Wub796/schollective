/**
 * Schollective Security Core
 * ─────────────────────────────────────────────────────────────────
 * Zero-dependency, in-memory security utilities:
 *
 *   1. Rate limiter — sliding-window, dual IP + user-ID tracking
 *   2. Input sanitizers — XSS-neutralise, truncate, validate
 *   3. Request validators — zod-lite type guards with clean messages
 *
 * These guards run on EVERY server action and API route.
 * In production, swap the in-memory Map for a Redis-backed store.
 */

// ─────────────────────────────────────────────────────────────────
// RATE LIMITER
// ─────────────────────────────────────────────────────────────────

interface RateLimitWindow {
  timestamps: number[];
}

const ipRateMap = new Map<string, RateLimitWindow>();
const userRateMap = new Map<string, RateLimitWindow>();

/** Clean up stale entries every 5 minutes */
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = 0;

function expireStaleWindows(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  const maxAge = 60 * 60 * 1000; // 1 hour — any window entirely in the past
  for (const map of [ipRateMap, userRateMap]) {
    for (const [key, window] of map) {
      window.timestamps = window.timestamps.filter((ts) => now - ts < maxAge);
      if (window.timestamps.length === 0) map.delete(key);
    }
  }
}

export interface RateLimitResult {
  allowed: boolean;
  /** How many requests remain in this window */
  remaining: number;
  /** Seconds before a new request can be made */
  retryAfterSeconds: number;
  /** Total allowed requests per window */
  limit: number;
}

/**
 * Checks whether a request should be allowed under a sliding-window rate limit.
 *
 * @param key       — unique identifier (user ID, IP, or composite)
 * @param max       — max requests allowed in the window
 * @param windowMs  — window duration in milliseconds
 * @param useIpMap  — if true, uses the IP map instead of user map (for unauthenticated routes)
 */
export function checkRateLimit(
  key: string,
  max: number = 30,
  windowMs: number = 60 * 1000,
  useIpMap: boolean = false
): RateLimitResult {
  expireStaleWindows();
  const map = useIpMap ? ipRateMap : userRateMap;
  const now = Date.now();

  let entry = map.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    map.set(key, entry);
  }

  // Slide the window — discard timestamps outside the window
  entry.timestamps = entry.timestamps.filter((ts) => now - ts < windowMs);

  if (entry.timestamps.length >= max) {
    const oldest = entry.timestamps[0];
    const retryAfter = Math.ceil((oldest + windowMs - now) / 1000);
    return { allowed: false, remaining: 0, retryAfterSeconds: Math.max(1, retryAfter), limit: max };
  }

  entry.timestamps.push(now);
  return {
    allowed: true,
    remaining: max - entry.timestamps.length,
    retryAfterSeconds: 0,
    limit: max,
  };
}

/**
 * Extracts a client IP from NextRequest headers, with fallbacks for proxies.
 */
export function getClientIp(request: Request): string {
  // Vercel / Cloudflare / standard proxy headers
  const headers = request.headers;
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headers.get("x-real-ip") ??
    headers.get("cf-connecting-ip") ??
    "unknown"
  );
}

/**
 * Runs rate limit checks for both IP and user-ID in one call.
 * Returns the strictest result.
 */
export function checkDualRateLimit(
  userId: string | null,
  ip: string,
  maxUser: number,
  maxIp: number,
  windowMs: number
): RateLimitResult {
  // IP check first (broader, blocks abuse even without auth)
  const ipResult = checkRateLimit(ip, maxIp, windowMs, true);
  if (!ipResult.allowed) return ipResult;

  // User-specific check if authenticated
  if (userId) {
    const userResult = checkRateLimit(userId, maxUser, windowMs);
    if (!userResult.allowed) return userResult;
    return userResult; // return user result (has correct remaining count)
  }

  return ipResult;
}

// ─────────────────────────────────────────────────────────────────
// INPUT SANITISERS
// ─────────────────────────────────────────────────────────────────

/** Maximum lengths for common input fields */
export const LIMITS = {
  name: 100,
  email: 254,
  institution: 200,
  department: 200,
  academicTitle: 200,
  bio: 2000,
  expertiseField: 100,
  publication: 500,
  topic: 300,
  messageContent: 10_000,
  url: 2048,
  searchQuery: 200,
  warningMessage: 1000,
  goal: 2000,
  background: 5000,
  officeHours: 500,
  studentType: 100,
} as const;

/** Characters to strip from user input (zero-width, control, etc.) */
const DANGEROUS_CHARS = /[\u0000-\u001F\u007F-\u009F\u200B-\u200D\uFEFF]/g;

/** HTML/script tags — strip entirely, don't encode */
const HTML_TAGS = /<[^>]*>/g;

/**
 * Sanitises a plain-text string:
 *   1. Strips HTML tags
 *   2. Strips control/zero-width characters
 *   3. Truncates to maxLen
 *   4. Trims whitespace
 */
export function sanitiseText(input: unknown, maxLen: number): string {
  if (typeof input !== "string") return "";
  return input
    .replace(HTML_TAGS, "")
    .replace(DANGEROUS_CHARS, "")
    .trim()
    .slice(0, maxLen);
}

/**
 * Sanitises a URL string:
 *   - Strips whitespace
 *   - Blocks javascript: and data: URIs
 *   - Truncates to maxLen
 *   - Returns empty string if it doesn't look like a URL
 */
export function sanitiseUrl(input: unknown, maxLen: number = LIMITS.url): string {
  if (typeof input !== "string") return "";
  const cleaned = input.replace(DANGEROUS_CHARS, "").trim().slice(0, maxLen);
  if (!cleaned) return "";

  const lower = cleaned.toLowerCase();
  // Block dangerous URI schemes
  if (/^(javascript|data|vbscript):/i.test(lower)) return "";

  // Allow http/https or protocol-relative URLs, and plain domains (will be prefixed client-side)
  if (/^(https?:)?\/\//i.test(cleaned)) return cleaned;
  if (/^[a-zA-Z0-9][-a-zA-Z0-9]*(?:\.[a-zA-Z0-9][-a-zA-Z0-9]*)+/.test(cleaned)) return cleaned;

  // If it has no protocol, assume https
  if (/^[a-zA-Z0-9]/.test(cleaned) && cleaned.includes(".")) {
    return cleaned;
  }

  return "";
}

/**
 * Sanitises an email string.
 */
export function sanitiseEmail(input: unknown): string {
  if (typeof input !== "string") return "";
  return input.replace(DANGEROUS_CHARS, "").trim().slice(0, LIMITS.email).toLowerCase();
}

/**
 * Validates a UUID string (for IDs passed from the client).
 */
export function isValidUuid(input: unknown): input is string {
  if (typeof input !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input);
}

/**
 * Sanitises an array of strings (comma-separated or already an array).
 * Returns an array of cleaned, deduped, non-empty strings.
 */
export function sanitiseTagArray(input: unknown, maxLen: number): string[] {
  if (Array.isArray(input)) {
    return [...new Set(
      input
        .map((s) => sanitiseText(s, maxLen))
        .filter(Boolean)
    )];
  }
  if (typeof input === "string") {
    return [...new Set(
      input
        .split(",")
        .map((s) => sanitiseText(s, maxLen))
        .filter(Boolean)
    )];
  }
  return [];
}

/**
 * Sanitises multi-line text (publications, goals, etc.).
 * Splits by newline, sanitises each line, filters empties.
 */
export function sanitiseMultiline(input: unknown, maxLen: number): string[] {
  if (typeof input !== "string") return [];
  return input
    .split("\n")
    .map((s) => sanitiseText(s, maxLen))
    .filter(Boolean);
}

/**
 * Sanitises a boolean from form data (checkboxes come as "true"/"false" or "on").
 */
export function sanitiseBool(input: unknown): boolean {
  if (typeof input === "boolean") return input;
  if (typeof input === "string") return input.toLowerCase() === "true" || input === "on";
  return false;
}

// ─────────────────────────────────────────────────────────────────
// REQUEST GUARD
// ─────────────────────────────────────────────────────────────────

/**
 * Wraps an API route handler with:
 *   1. Rate limiting (IP + optional user)
 *   2. Error boundary (always returns JSON, never crashes)
 */
export function withApiGuard<T extends (...args: any[]) => Promise<Response>>(
  handler: T,
  options: {
    maxPerMinute?: number;
  } = {}
): T {
  const { maxPerMinute = 60 } = options;

  return (async (...args: Parameters<T>) => {
    try {
      const request = args[0] as Request;
      const ip = getClientIp(request);

      const rateResult = checkRateLimit(ip, maxPerMinute, 60 * 1000, true);
      if (!rateResult.allowed) {
        return new Response(
          JSON.stringify({
            error: "Too many requests. Please wait before trying again.",
            retryAfterSeconds: rateResult.retryAfterSeconds,
          }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "Retry-After": String(rateResult.retryAfterSeconds),
            },
          }
        );
      }

      return await handler(...args);
    } catch (err: any) {
      console.error("[Security Guard] Unhandled error:", err?.message || err);
      return new Response(
        JSON.stringify({ error: "An internal error occurred." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }) as T;
}