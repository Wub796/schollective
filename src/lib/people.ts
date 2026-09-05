/**
 * How people are named on screen, and where two students stand with each other.
 *
 * Client-safe, so server pages and client components agree. Every card, row,
 * header and chat bubble names people through these, so a preferred name reads
 * the same way everywhere.
 */

import type { FriendshipStatus } from "./status";

export interface NamedPerson {
  first_name?: string | null;
  last_name?: string | null;
  preferred_name?: string | null;
}

/** A name as shown: what someone goes by, and their surname. */
export interface NameParts {
  given: string;
  family: string;
}

/** Whether a preferred name is absent, just a first name, or a whole name. */
export type PreferredNameKind = "none" | "given" | "full";

function wordsOf(value: string | null | undefined): string[] {
  return (value ?? "").trim().split(/\s+/).filter(Boolean);
}

function sameWords(a: readonly string[], b: readonly string[]): boolean {
  return (
    a.length === b.length &&
    a.every((word, i) => word.localeCompare(b[i], undefined, { sensitivity: "base" }) === 0)
  );
}

/**
 * How a preferred name reads: "Benny" is a first name, "Benny Wu" a whole name.
 *
 * It is a whole name when it ends with the surname on file (compared without
 * regard to case or accents), or when no surname is on file and it has more
 * than one word. Anything else stands in for the first name, so "Mary Jane"
 * stays a given name and the surname is still shown after it.
 */
export function preferredNameKind(
  preferredName: string | null | undefined,
  lastName: string | null | undefined,
): PreferredNameKind {
  const preferred = wordsOf(preferredName);
  if (preferred.length === 0) return "none";
  const surname = wordsOf(lastName);
  if (surname.length === 0) return preferred.length > 1 ? "full" : "given";
  return sameWords(preferred.slice(-surname.length), surname) ? "full" : "given";
}

/**
 * Splits a name for display, reading the preferred name as a first name or a
 * whole name (see preferredNameKind), so a surname is never dropped and never
 * shown twice, as in "Benny Wu Wu".
 */
export function nameParts(person: NamedPerson | null | undefined): NameParts {
  const first = wordsOf(person?.first_name).join(" ");
  const last = wordsOf(person?.last_name).join(" ");
  const preferred = wordsOf(person?.preferred_name);
  const kind = preferredNameKind(person?.preferred_name, person?.last_name);

  if (kind === "none") return { given: first, family: last };
  if (kind === "given") return { given: preferred.join(" "), family: last };

  // A whole name: the surname is its last word(s) and whatever precedes it is
  // the given name. Typed as only the surname, the first name on file stands in.
  const surnameLength = Math.max(wordsOf(last).length, 1);
  return {
    given: preferred.slice(0, -surnameLength).join(" ") || first,
    family: last || preferred.slice(-surnameLength).join(" "),
  };
}

/** The name someone goes by, e.g. "Benny", or the fallback when there is none. */
export function givenName(person: NamedPerson | null | undefined, fallback = "Student"): string {
  return nameParts(person).given || fallback;
}

/** Given name and surname, e.g. "Ada Lovelace". */
export function fullName(person: NamedPerson | null | undefined, fallback = "Student"): string {
  const { given, family } = nameParts(person);
  return [given, family].filter(Boolean).join(" ") || fallback;
}

/** "Dr. Jiwoo Kim": how faculty are addressed throughout the product. */
export function facultyName(person: NamedPerson | null | undefined): string {
  return `Dr. ${fullName(person, "Professor")}`;
}

/** Two-letter avatar initials of the name as shown, or "?" when there is no name at all. */
export function initialsOf(person: NamedPerson | null | undefined): string {
  const { given, family } = nameParts(person);
  return `${given.charAt(0)}${family.charAt(0)}`.toUpperCase() || "?";
}

/** The slugs onboarding stores, as people would say them. */
const EDUCATION_LABELS: Record<string, string> = {
  "high-school": "High school student",
  "high-school-underclassman": "High school underclassman",
  "high-school-junior": "High school junior",
  "high-school-senior": "High school senior",
  college: "College student",
  undergraduate: "Undergraduate",
  "undergraduate-lower": "Lower-division undergraduate",
  "undergraduate-upper": "Upper-division undergraduate",
  graduate: "Graduate student",
  phd: "PhD student",
};

/** An education-level slug as words: "undergraduate-upper" → "Upper-division undergraduate". */
export function educationLabel(level: string | null | undefined): string | null {
  const slug = level?.trim();
  if (!slug) return null;
  const known = EDUCATION_LABELS[slug.toLowerCase()];
  if (known) return known;
  const words = slug.replace(/[-_]+/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** "Ben", "Ben and Dev", "Ben, Dev and 2 others" — given names, never an empty entry. */
export function listNames(people: readonly (NamedPerson | null | undefined)[], shown = 2): string {
  const names = people.map((person) => givenName(person, "")).filter(Boolean);
  if (names.length <= 1) return names[0] ?? "";
  if (names.length <= shown) return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
  const rest = names.length - shown;
  return `${names.slice(0, shown).join(", ")} and ${rest} other${rest === 1 ? "" : "s"}`;
}

/** Where the viewer stands with another student. */
export type FriendshipState = "none" | "outgoing" | "incoming" | "friends";

export interface FriendshipEdge {
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatus;
}

export function friendshipStateFor(
  edge: FriendshipEdge | null | undefined,
  viewerId: string,
): FriendshipState {
  if (!edge) return "none";
  if (edge.requester_id !== viewerId && edge.addressee_id !== viewerId) return "none";
  if (edge.status === "accepted") return "friends";
  return edge.requester_id === viewerId ? "outgoing" : "incoming";
}
