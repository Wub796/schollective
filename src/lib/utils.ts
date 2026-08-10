import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
