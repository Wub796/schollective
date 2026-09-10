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
