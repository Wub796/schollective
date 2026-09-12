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

function build(get: Source): SanitisedProfileInput {
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
    avatar_url: urlField(get, "avatar_url"),

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

  // Drop keys the caller did not send, so `upsertProfile`'s COALESCE keeps the
  // stored value instead of overwriting it with an empty string.
  for (const key of Object.keys(out) as (keyof SanitisedProfileInput)[]) {
    if (out[key] === undefined) delete out[key];
  }

  return out;
}

/** Sanitises a faculty/student form submission. */
export function sanitiseProfileFormData(formData: FormData): SanitisedProfileInput {
  return build((key) => (formData.has(key) ? formData.get(key) : undefined));
}

/** Sanitises a JSON request body, ignoring every privileged field. */
export function sanitiseProfileBody(body: unknown): SanitisedProfileInput {
  const record = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const privileged = new Set<string>(PRIVILEGED_PROFILE_FIELDS);
  return build((key) =>
    privileged.has(key) ? undefined : Object.prototype.hasOwnProperty.call(record, key) ? record[key] : undefined,
  );
}
