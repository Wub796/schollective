/**
 * Sanitisation for the profile write paths.
 *
 * There are two ways to write a profile — the `updateProfProfile` server action
 * (FormData, from the faculty form) and `POST /api/auth/profile/update` (JSON,
 * from onboarding and the student form). Only the first one sanitised anything:
 * the route spread the request body straight into `upsertProfile`, so bio length,
 * HTML stripping and URL scheme checks were all enforced on one path and not the
 * other. This module is the single gate both now pass through.
 *
 * It also decides which fields a user may set about themselves *at all*.
 * `role`, `status`, `ai_score`, `ai_level`, `ai_flags` and `profile_complete`
 * are privileged: they are assigned by the onboarding flow, the admin review
 * queue or the AI reviewer, never copied from a request body.
 */

import type {
  AcademicStats,
  ActivityItem,
  HonorAwardItem,
  LanguageItem,
  SocialLinks,
} from "@/lib/neon/profiles";
import {
  LIMITS,
  sanitiseBool,
  sanitiseMultiline,
  sanitiseTagArray,
  sanitiseText,
  sanitiseUrl,
} from "@/lib/security";
import { avatarKeyFromRoute, avatarOwner } from "@/lib/avatar";

/** Fields the account owner may set about themselves. */
export interface SanitisedProfileInput {
  first_name?: string;
  last_name?: string;
  preferred_name?: string;
  institution?: string;
  education_level?: string;
  department?: string;
  academic_title?: string;
  major?: string;
  graduation_year?: string;
  bio?: string;
  lab_website?: string;
  portfolio_url?: string;
  office_hours?: string;
  seeking_mentorship_type?: string;
  academic_interests?: string[];
  expertise_fields?: string[];
  coursework?: string[];
  skills_and_tools?: string[];
  accepting_student_types?: string[];
  publications?: string[];
  extracurriculars?: string[];
  is_accepting_requests?: boolean;
  avatar_url?: string;
  /**
   * The structured JSON columns. Sanitisation walks them recursively and cleans
   * every string, but does not re-validate their shape — these hold evolving
   * profile-builder output, and the builders own that contract. The casts below
   * are the one place that looseness is acknowledged.
   */
  academic_stats?: AcademicStats | null;
  activities?: ActivityItem[] | null;
  honors_awards?: HonorAwardItem[] | null;
  languages?: LanguageItem[] | null;
  social_links?: SocialLinks | null;
}

/**
 * Never accepted from a request body, on either path. Listed explicitly so the
 * reason is reviewable rather than implied by omission.
 */
export const PRIVILEGED_PROFILE_FIELDS = [
  "id",
  "email",
  "role",
  "status",
  "profile_complete",
  "ai_score",
  "ai_level",
  "ai_flags",
  "created_at",
  "updated_at",
] as const;

/** Caps on the structured JSON columns, so a body cannot carry unbounded arrays. */
const MAX_ACTIVITIES = 50;
const MAX_HONORS = 50;
const MAX_LANGUAGES = 25;

type Source = (key: string) => unknown;

function textField(get: Source, key: string, max: number): string | undefined {
  const raw = get(key);
  if (raw === undefined || raw === null) return undefined;
  return sanitiseText(raw, max);
}

function urlField(get: Source, key: string): string | undefined {
  const raw = get(key);
  if (raw === undefined || raw === null) return undefined;
  return sanitiseUrl(raw);
}

/**
 * A profile picture: a path to one of our own uploads, which `sanitiseUrl` would
 * reject for having no host, or an https image elsewhere such as a Google account
 * photo. Given `ownerId`, an upload must be the caller's own, since the serving
 * route is public and any account's key would otherwise be claimable.
 *
 * Anything else is dropped, and `rejectedProfileField` reports it.
 */
function avatarField(get: Source, ownerId: string | undefined): string | undefined {
  const raw = get("avatar_url");
  if (raw === undefined || raw === null) return undefined;
  if (typeof raw !== "string") return undefined;
  const value = raw.trim();
  if (!value) return "";
  const key = avatarKeyFromRoute(value);
  if (key) return !ownerId || avatarOwner(key) === ownerId ? value : undefined;
  const url = sanitiseUrl(value);
  return /^https:\/\//i.test(url) ? url : undefined;
}

function tagField(get: Source, key: string, max: number): string[] | undefined {
  const raw = get(key);
  if (raw === undefined || raw === null) return undefined;
  return sanitiseTagArray(raw, max);
}

function multilineField(get: Source, key: string, max: number): string[] | undefined {
  const raw = get(key);
  if (raw === undefined || raw === null) return undefined;
  if (Array.isArray(raw)) return sanitiseTagArray(raw, max);
  return sanitiseMultiline(raw, max);
}

/**
 * Recursively strips HTML and control characters from every string inside one of
 * the JSON columns, and caps the array length. The shape is validated loosely on
 * purpose — these columns hold evolving builder output — but no string inside
 * them reaches the database unsanitised.
 */
function jsonField(get: Source, key: string, maxItems: number, maxChars: number): unknown {
  const raw = get(key);
  if (raw === undefined || raw === null) return undefined;

  const clean = (value: unknown, depth: number): unknown => {
    if (depth > 4) return null;
    if (typeof value === "string") return sanitiseText(value, maxChars);
    if (typeof value === "number" || typeof value === "boolean" || value === null) return value;
    if (Array.isArray(value)) {
      return value.slice(0, maxItems).map((item) => clean(item, depth + 1));
    }
    if (typeof value === "object") {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        // Key names are structural, not content; keep them short and inert.
        out[sanitiseText(k, 64)] = clean(v, depth + 1);
      }
      return out;
    }
    return null;
  };

  return clean(raw, 0);
}

function build(get: Source, ownerId?: string): SanitisedProfileInput {
  const out: SanitisedProfileInput = {
    first_name: textField(get, "first_name", LIMITS.name),
    last_name: textField(get, "last_name", LIMITS.name),
    preferred_name: textField(get, "preferred_name", LIMITS.name),
    institution: textField(get, "institution", LIMITS.institution),
    education_level: textField(get, "education_level", LIMITS.studentType),
    department: textField(get, "department", LIMITS.department),
    academic_title: textField(get, "academic_title", LIMITS.academicTitle),
    major: textField(get, "major", LIMITS.institution),
    graduation_year: textField(get, "graduation_year", 30),
    bio: textField(get, "bio", LIMITS.bio),
    office_hours: textField(get, "office_hours", LIMITS.officeHours),
    seeking_mentorship_type: textField(get, "seeking_mentorship_type", LIMITS.studentType),

    lab_website: urlField(get, "lab_website"),
    portfolio_url: urlField(get, "portfolio_url"),
    avatar_url: avatarField(get, ownerId),

    academic_interests: tagField(get, "academic_interests", LIMITS.expertiseField),
    expertise_fields: tagField(get, "expertise_fields", LIMITS.expertiseField),
    coursework: tagField(get, "coursework", LIMITS.expertiseField),
    skills_and_tools: tagField(get, "skills_and_tools", LIMITS.expertiseField),
    accepting_student_types: tagField(get, "accepting_student_types", LIMITS.studentType),
    extracurriculars: tagField(get, "extracurriculars", LIMITS.publication),
    publications: multilineField(get, "publications", LIMITS.publication),

    academic_stats: jsonField(get, "academic_stats", MAX_ACTIVITIES, LIMITS.publication) as
      | AcademicStats
      | undefined,
    activities: jsonField(get, "activities", MAX_ACTIVITIES, LIMITS.publication) as
      | ActivityItem[]
      | undefined,
    honors_awards: jsonField(get, "honors_awards", MAX_HONORS, LIMITS.publication) as
      | HonorAwardItem[]
      | undefined,
    languages: jsonField(get, "languages", MAX_LANGUAGES, LIMITS.name) as LanguageItem[] | undefined,
    social_links: jsonField(get, "social_links", 12, LIMITS.url) as SocialLinks | undefined,
  };

  const accepting = get("is_accepting_requests");
  if (accepting !== undefined && accepting !== null) {
    out.is_accepting_requests = sanitiseBool(accepting);
  }

  // Drop keys the caller did not send, so `upsertProfile` keeps the stored value.
  // A key sent empty stays as "": that is a deliberate clear, stored as NULL.
  for (const key of Object.keys(out) as (keyof SanitisedProfileInput)[]) {
    if (out[key] === undefined) delete out[key];
  }

  return out;
}

function hasText(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function isFilled(value: unknown): boolean {
  return Array.isArray(value) ? value.some(hasText) : hasText(value);
}

/** What each single-value text field is called on screen. */
const TEXT_FIELD_LABELS = {
  first_name: "First name",
  last_name: "Last name",
  preferred_name: "Preferred name",
  institution: "Institution",
  education_level: "Education level",
  department: "Department",
  academic_title: "Academic title",
  major: "Major",
  graduation_year: "Graduation year",
  bio: "Bio",
  lab_website: "Lab website",
  portfolio_url: "Portfolio link",
  office_hours: "Office hours",
  seeking_mentorship_type: "Mentorship type",
  avatar_url: "Profile picture",
} as const satisfies Partial<Record<keyof SanitisedProfileInput, string>>;

/**
 * The single-value text columns. Sent as "", each is cleared: `upsertProfile`
 * stores NULL instead of keeping the old value, which COALESCE alone cannot tell
 * apart from a field that was not sent at all.
 */
export const CLEARABLE_PROFILE_TEXT_FIELDS = Object.keys(TEXT_FIELD_LABELS) as (keyof typeof TEXT_FIELD_LABELS)[];

const URL_FIELDS: ReadonlySet<string> = new Set(["lab_website", "portfolio_url"]);

type RequiredField = "first_name" | "last_name" | "institution" | "education_level" | "expertise_fields";

/** The fields a profile needs before it counts as set up, by role. */
const REQUIRED_BY_ROLE: Record<string, readonly RequiredField[]> = {
  student: ["first_name", "education_level"],
  professor: ["first_name", "last_name", "institution", "expertise_fields"],
};

const BLANKED_MESSAGES: Record<RequiredField, string> = {
  first_name: "Your first name can't be left blank.",
  last_name: "Your last name can't be left blank.",
  institution: "Your institution can't be left blank.",
  education_level: "Choose your education level.",
  expertise_fields: "Add at least one area of expertise.",
};

function requiredFieldsFor(role: string | null | undefined): readonly RequiredField[] | null {
  return role && Object.prototype.hasOwnProperty.call(REQUIRED_BY_ROLE, role) ? REQUIRED_BY_ROLE[role] : null;
}

export function meetsProfileRequirements(
  role: string | null | undefined,
  profile: Partial<Record<RequiredField, unknown>>,
): boolean {
  const required = requiredFieldsFor(role);
  return required !== null && required.every((field) => isFilled(profile[field]));
}

/** A field a write refused, and the sentence to show the person who sent it. */
export interface ProfileFieldProblem {
  field: string;
  message: string;
}

/**
 * A required field this update would empty. Clearing a field is a real edit (see
 * CLEARABLE_PROFILE_TEXT_FIELDS), so without this a saved profile could fall
 * below what onboarding accepted. Only a field that has a value can be blanked,
 * so an older profile already missing one can still save other changes.
 */
export function blankedRequiredField(
  role: string | null | undefined,
  stored: Partial<Record<RequiredField, unknown>>,
  update: SanitisedProfileInput,
): ProfileFieldProblem | null {
  for (const field of requiredFieldsFor(role) ?? []) {
    if (update[field] !== undefined && !isFilled(update[field]) && isFilled(stored[field])) {
      return { field, message: BLANKED_MESSAGES[field] };
    }
  }
  return null;
}

/**
 * A field the caller filled in that sanitisation emptied: a web address that is
 * not one, a profile picture that is not the caller's upload, text that was only
 * markup. Stored as-is it would clear the field or keep the old value; either
 * way what was typed is not what gets saved, and the save still reports success.
 * So the write paths refuse, naming the field.
 */
export function rejectedProfileField(
  source: Record<string, unknown> | FormData,
  clean: SanitisedProfileInput,
): ProfileFieldProblem | null {
  for (const field of CLEARABLE_PROFILE_TEXT_FIELDS) {
    const raw = source instanceof FormData ? source.get(field) : source[field];
    if (!hasText(raw) || hasText(clean[field])) continue;
    if (field === "avatar_url") {
      return { field, message: "That profile picture could not be saved. Please upload it again." };
    }
    const label = TEXT_FIELD_LABELS[field];
    return {
      field,
      message: URL_FIELDS.has(field)
        ? `${label} must be a web address, like https://example.com.`
        : `${label} could not be saved as entered.`,
    };
  }
  return null;
}

export interface ProfileCompletionInput {
  /** The role the profile holds after this update. */
  role: string | null | undefined;
  /** The role it held before. */
  previousRole: string | null | undefined;
  alreadyComplete: boolean;
  /** The caller asked to finish setup — onboarding and the profile forms send this. */
  requested: boolean;
  /** The stored profile with this update's fields applied. */
  merged: Parameters<typeof meetsProfileRequirements>[1];
}

/**
 * Whether a profile is complete after an update.
 *
 * `profile_complete` is privileged (see PRIVILEGED_PROFILE_FIELDS) because a
 * client able to set it could skip onboarding with an empty profile. But
 * something still has to set it: once the field became privileged nothing did,
 * and every account created afterwards was sent from /dashboard back to
 * /onboarding indefinitely. So the client may ASK to complete setup, and the
 * server grants it only when the role's required fields are really present.
 * An edit never revokes completion — unless the role itself changes, in which
 * case the new role's requirements apply.
 */
export function resolveProfileCompletion(input: ProfileCompletionInput): boolean {
  const roleChanged = Boolean(input.previousRole) && input.role !== input.previousRole;
  if (input.alreadyComplete && !roleChanged) return true;
  return input.requested && meetsProfileRequirements(input.role, input.merged);
}

/** Sanitises a faculty/student form submission. */
export function sanitiseProfileFormData(formData: FormData, ownerId?: string): SanitisedProfileInput {
  return build((key) => (formData.has(key) ? formData.get(key) : undefined), ownerId);
}

/** Sanitises a JSON request body, ignoring every privileged field. */
export function sanitiseProfileBody(body: unknown, ownerId?: string): SanitisedProfileInput {
  const record = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const privileged = new Set<string>(PRIVILEGED_PROFILE_FIELDS);
  return build(
    (key) =>
      privileged.has(key) ? undefined : Object.prototype.hasOwnProperty.call(record, key) ? record[key] : undefined,
    ownerId,
  );
}
