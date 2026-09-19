/**
 * How people are named on screen, and where two students stand with each other.
 *
 * Client-safe, so server pages and client components agree. Every card, row,
 * header and chat bubble names people through these, so a preferred name reads
 * the same way everywhere.
 *
 * A title someone types into their own name box is dropped here: the product
 * supplies the honorific, so onboarding as "Professor Smith" reads "Dr. Smith"
 * rather than "Dr. Professor Smith".
 */

import type { FriendshipStatus } from "./status";

export interface NamedPerson {
  first_name?: string | null;
  last_name?: string | null;
  preferred_name?: string | null;
  /** The title the person chose to be addressed by; see HONORIFIC_OPTIONS. */
  honorific?: string | null;
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

/** A word without the punctuation that follows a title: "Prof.," reads as "prof". */
function bareWord(value: string): string {
  return value.toLowerCase().replace(/[.,]+$/, "");
}

/**
 * A read from a lookup table that cannot walk the prototype chain. Plain
 * `table[key]` answers "constructor" (or `toString`, or `__proto__`) with
 * something inherited — a function where a label is expected — and these tables
 * are indexed by strings that arrive from a request body.
 */
function lookup<T>(table: Record<string, T>, key: string): T | undefined {
  return Object.prototype.hasOwnProperty.call(table, key) ? table[key] : undefined;
}

/**
 * Titles people type in front of their own name ("Professor Smith", "Dr. Wu").
 * A surname is left alone, so someone actually named Doctor keeps it.
 */
const TYPED_TITLES = new Set(["dr", "drs", "doctor", "prof", "professor"]);

function isTypedTitle(word: string): boolean {
  return TYPED_TITLES.has(bareWord(word));
}

/** The words of a name someone typed, without any title in front of it. */
function typedNameWords(value: string | null | undefined): string[] {
  const words = wordsOf(value);
  let start = 0;
  while (start < words.length && isTypedTitle(words[start])) start += 1;
  return words.slice(start);
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
  const preferred = typedNameWords(preferredName);
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
  const first = typedNameWords(person?.first_name).join(" ");
  const last = wordsOf(person?.last_name).join(" ");
  const preferred = typedNameWords(person?.preferred_name);
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

/**
 * The name someone goes by, e.g. "Benny", or the fallback when there is none.
 * A surname stands in when there is no given name — someone who typed only
 * "Professor" is greeted as "Smith", not "Student".
 */
export function givenName(person: NamedPerson | null | undefined, fallback = "Student"): string {
  const { given, family } = nameParts(person);
  return given || family || fallback;
}

/** Given name and surname, e.g. "Ada Lovelace". */
export function fullName(person: NamedPerson | null | undefined, fallback = "Student"): string {
  const { given, family } = nameParts(person);
  return [given, family].filter(Boolean).join(" ") || fallback;
}

/** The titles a professor may pick, as they read on screen. */
export const HONORIFIC_OPTIONS = ["Dr.", "Prof.", "Mr.", "Ms.", "Mx.", "Mrs."] as const;

export type HonorificOption = (typeof HONORIFIC_OPTIONS)[number];

/** Stored when someone asks to be shown without a title at all. */
export const NO_HONORIFIC = "none";

/**
 * Shown for a professor who has never chosen. Every faculty profile read "Dr."
 * before the choice existed, and it stays the answer for anyone who does not
 * pick — including every account that predates the field.
 */
export const DEFAULT_FACULTY_HONORIFIC = "Dr.";

/**
 * Spellings that mean one of the offered titles. "doctor" and "professor" are
 * here because those are the words people type when asked for a title.
 */
const HONORIFIC_ALIASES: Record<string, HonorificOption> = {
  dr: "Dr.",
  doctor: "Dr.",
  prof: "Prof.",
  professor: "Prof.",
  mr: "Mr.",
  ms: "Ms.",
  mx: "Mx.",
  mrs: "Mrs.",
};

/**
 * A chosen title as it is stored: an offered one written the way the product
 * shows it ("dr", "DR." and "doctor" all become "Dr."), NO_HONORIFIC to be
 * shown without one, a title of the account's own as typed, or null when nobody
 * has chosen — which `honorificOf` reads as the default.
 */
export function normaliseHonorific(value: string | null | undefined): string | null {
  const chosen = (value ?? "").trim();
  if (!chosen) return null;
  if (chosen.toLowerCase() === NO_HONORIFIC) return NO_HONORIFIC;
  return lookup(HONORIFIC_ALIASES, bareWord(chosen)) ?? chosen;
}

/** The picker's options: every title we offer, then the choice to have none. */
export const HONORIFIC_CHOICES: readonly { value: string; label: string }[] = [
  ...HONORIFIC_OPTIONS.map((title) => ({ value: title, label: title })),
  { value: NO_HONORIFIC, label: "No title (just your name)" },
];

/**
 * How someone is addressed: the title they chose, "" when they chose to have
 * none, or `fallback` for a person who has never chosen.
 */
export function honorificOf(
  person: NamedPerson | null | undefined,
  fallback = DEFAULT_FACULTY_HONORIFIC,
): string {
  const chosen = normaliseHonorific(person?.honorific);
  if (chosen === null) return fallback;
  return chosen === NO_HONORIFIC ? "" : chosen;
}

/**
 * A title in front of a name that is already composed: "Dr. Jiwoo", or simply
 * "Jiwoo" when there is no title. Callers never write the spacing themselves.
 */
export function withTitle(person: NamedPerson | null | undefined, name: string): string {
  const title = honorificOf(person);
  return [title, name].filter(Boolean).join(" ");
}

/**
 * "Dr. Jiwoo Kim": how faculty are addressed throughout the product, with the
 * title they chose standing in front of the default.
 */
export function facultyName(person: NamedPerson | null | undefined): string {
  return withTitle(person, fullName(person, "Professor"));
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
  const known = lookup(EDUCATION_LABELS, slug.toLowerCase());
  if (known) return known;
  const words = slug.replace(/[-_]+/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** Stored when someone asked for their gender to stay off their profile. */
export const NO_GENDER = "prefer-not-to-say";

/**
 * The genders a profile may list, stored as the slug and read as the label — the
 * same arrangement the education levels use. One list, so the picker, the write
 * path's whitelist and every label on screen cannot disagree, and a new option
 * is one line here rather than a migration.
 *
 * "Prefer not to say" is an option, not an absence: it is stored, and it means
 * keep this off my profile. See `genderLabel`.
 */
export const GENDER_CHOICES: readonly { value: string; label: string }[] = [
  { value: "woman", label: "Woman" },
  { value: "man", label: "Man" },
  { value: "nonbinary", label: "Non-binary" },
  { value: NO_GENDER, label: "Prefer not to say" },
];

/** A gender as it is stored, or null for anything not on the list. */
export function normaliseGender(value: string | null | undefined): string | null {
  const chosen = (value ?? "").trim();
  if (!chosen) return null;
  // Compared without punctuation or case, so "Non-binary" and "nonbinary" are
  // the same answer whether it arrived from the picker or a request body.
  const bare = chosen.toLowerCase().replace(/[^a-z]/g, "");
  return (
    GENDER_CHOICES.find((choice) => choice.value.replace(/[^a-z]/g, "") === bare)?.value ?? null
  );
}

/**
 * A gender as it reads on someone's profile, or null when there is nothing to
 * show — because nobody chose, or because they chose "prefer not to say", which
 * is an answer about privacy rather than an empty field.
 */
export function genderLabel(value: string | null | undefined): string | null {
  const slug = normaliseGender(value);
  if (!slug || slug === NO_GENDER) return null;
  return GENDER_CHOICES.find((choice) => choice.value === slug)?.label ?? null;
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
