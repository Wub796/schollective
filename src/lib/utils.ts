import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Safely extracts a human-readable message from an unknown thrown value.
 *
 * Replaces `catch (err: any)` — the thrown value in a catch is `unknown` in
 * strict TS, and most handlers only want `err?.message ?? fallback`.
 */
export function errorMessage(err: unknown, fallback = "Something went wrong."): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "string" && err) return err;
  return fallback;
}

/**
 * Logs the real failure and returns a message that is safe to show a user.
 *
 * Prefer this to `errorMessage` anywhere the result crosses the network.
 * `errorMessage` hands back whatever the thrown value said, and several routes
 * were returning that straight to the client — which meant a Postgres error, or
 * `assertStorageConfigured`'s list of missing environment variables, could be
 * read by anyone who could trigger the failure. The detail belongs in the logs,
 * where Sentry picks it up; the caller gets a sentence they can act on.
 */
export function internalError(context: string, err: unknown, userMessage: string): string {
  console.error(`[${context}]`, err instanceof Error ? (err.stack ?? err.message) : err);
  return userMessage;
}

/**
 * Reads a jsonb string-array column into a JS array.
 *
 * `expertise_fields` and friends are jsonb, and the Neon HTTP driver may hand
 * them back already parsed or still as text depending on the query, so accept
 * both rather than assuming one.
 */
export function parseJsonbArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === "string");
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.filter((v): v is string => typeof v === "string");
    } catch {
      return [value];
    }
  }
  return [];
}
