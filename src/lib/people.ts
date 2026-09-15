/**
 * How people are named on screen, and where two students stand with each other.
 *
 * Client-safe, so server pages and client components agree. Older components
 * still assemble `preferred_name || first_name` inline; the social features use
 * these so a name renders the same way on every card, row and chat bubble.
 */

import type { FriendshipStatus } from "./status";

export interface NamedPerson {
  first_name?: string | null;
  last_name?: string | null;
  preferred_name?: string | null;
}

/** The name someone goes by: their preferred name, else their first name. */
export function givenName(person: NamedPerson | null | undefined, fallback = "Student"): string {
  return person?.preferred_name?.trim() || person?.first_name?.trim() || fallback;
}

/** Given name and surname, e.g. "Ada Lovelace". */
export function fullName(person: NamedPerson | null | undefined, fallback = "Student"): string {
  const parts = [givenName(person, ""), person?.last_name?.trim()].filter(Boolean);
  return parts.join(" ") || fallback;
}

/** "Dr. Jiwoo Kim" — how faculty are addressed throughout the product. */
export function facultyName(person: NamedPerson | null | undefined): string {
  return `Dr. ${fullName(person, "Professor")}`;
}

/** Two-letter avatar initials, or "?" when there is no name at all. */
export function initialsOf(person: NamedPerson | null | undefined): string {
  const first = (person?.first_name || person?.preferred_name || "").trim().charAt(0);
  const last = (person?.last_name || "").trim().charAt(0);
  return `${first}${last}`.toUpperCase() || "?";
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
