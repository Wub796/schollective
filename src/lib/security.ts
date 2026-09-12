/**
 * Schollective Security Core
 * ─────────────────────────────────────────────────────────────────
 * Zero-dependency, in-memory security utilities:
 *
 *   1. Rate limiter — sliding-window, per-isolate
 *   2. Input sanitizers — XSS-neutralise, truncate, validate
 *   3. Id type guards
 *
 * SCOPE, precisely: the sanitisers are applied by every server action and by
 * the profile update route; `checkRateLimit` is used by the AI routes, the
 * uploads route and three server actions. Nothing here is applied
 * automatically — each call site opts in, and the list above is the whole of
 * it. (An earlier version of this comment claimed these guards ran on every
 * action and route, which was never true and is the kind of claim that stops
 * people checking.)
 *
 * IMPORTANT — these counters are PER WORKER ISOLATE. On Cloudflare, isolates
 * recycle on deploy and traffic fans out across many, so this limiter bounds a
 * single burst rather than sustained abuse. Anything that needs a real shared
 * window uses `checkDurableRateLimit` (src/lib/rate-limit.ts), which keeps the
 * window in Postgres.
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
 * Extracts a client IP from request headers, with fallbacks for proxies.
 *
 * `cf-connecting-ip` is set by Cloudflare from the TCP peer and cannot be
 * spoofed by the client, so on this deployment it is always the value used.
 *
 * The two fallbacks are BOTH client-writable — `x-real-ip` no less than
 * `x-forwarded-for` — and are reachable only if a request arrives without
 * Cloudflare in front of it. Treat any per-IP limit keyed on a fallback value as
 * advisory: an attacker who can reach the origin directly can rotate either
 * header freely. They are kept so local development and a direct-origin
 * deployment still group requests sensibly, not because they are trustworthy.
 */
export function getClientIp(request: Request): string {
  const headers = request.headers;
  return (
    headers.get("cf-connecting-ip") ??
    headers.get("x-real-ip") ??
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
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
 * Cheap shape check for an opaque record id.
 *
 * Deliberately NOT named `isValidUuid`, which is what it used to be called: the
 * second branch admits any 8–64 character slug, so the old name promised a
 * guarantee the function never made and invited callers to treat it as an
 * authorisation check. It is a malformed-input filter and nothing more — it
 * keeps junk out of a query parameter, and every caller must still confirm the
 * row exists and that the user may see it.
 *
 * Accepts a canonical UUID, or a Better Auth nanoid / CUID-style id.
 */
export function isValidId(input: unknown): input is string {
  if (typeof input !== "string") return false;
  // Standard UUID format
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input)) return true;
  // Better Auth nanoid / alphanumeric ID (alphanumeric, underscores, hyphens, length 8..64)
  if (/^[a-zA-Z0-9_-]{8,64}$/.test(input)) return true;
  return false;
}

/** True only for a canonical RFC 4122 UUID, for callers that need the real thing. */
export function isCanonicalUuid(input: unknown): input is string {
  return (
    typeof input === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input)
  );
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
