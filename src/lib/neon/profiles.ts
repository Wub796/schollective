import { sql } from "./db";
import { runAs } from "./user-context";
import { ensureAuthSchema } from "./schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export interface AcademicStats {
  unweighted_gpa?: number | null;
  weighted_gpa?: number | null;
  class_rank?: number | null;
  class_size?: number | null;
  does_not_rank?: boolean;
  school_does_not_rank?: boolean;
  standardized_test_type?: string | null;
  standardized_test_score?: string | null;
  testing?: {
    test: "SAT" | "ACT" | "PSAT" | "None" | string;
    score?: string | number | null;
  } | null;
  advanced_coursework?: string[] | null;
}

export interface ActivityItem {
  id: string;
  title: string;
  organization: string;
  category: "Research" | "Software / Engineering Project" | "Software/Engineering Project" | "Competition Team" | "School Club / Leadership" | "School Club/Leadership" | "Fine Arts / Athletics" | "Fine Arts/Athletics" | "Work / Volunteer" | "Work/Volunteer" | string;
  date_range?: string;
  dateRange?: string;
  description?: string;
}

export interface HonorAwardItem {
  id: string;
  title: string;
  issuer?: string;
  issuer_or_level?: string;
  year: string;
}

export interface LanguageItem {
  id?: string;
  language: string;
  proficiency: "Native / Bilingual" | "Professional Working" | "Limited Working" | "Elementary" | "Fluent" | "Conversational" | "Basic/Reading" | string;
}

export interface SocialLinks {
  github?: string | null;
  github_url?: string | null;
  linkedin?: string | null;
  linkedin_url?: string | null;
  portfolio?: string | null;
  portfolio_url?: string | null;
}

export interface ProfileRecord {
  id: string;
  email: string;
  role: "student" | "professor" | "admin";
  status: "active" | "pending" | "approved" | "suspended" | "rejected";
  first_name?: string | null;
  preferred_name?: string | null;
  last_name?: string | null;
  avatar_url?: string | null;
  institution?: string | null;
  education_level?: string | null;
  department?: string | null;
  academic_title?: string | null;
  major?: string | null;
  graduation_year?: string | null;
  bio?: string | null;
  academic_interests?: string[] | null;
  extracurriculars?: string[] | null;
  expertise_fields?: string[] | null;
  coursework?: string[] | null;
  skills_and_tools?: string[] | null;
  publications?: string[] | null;
  accepting_student_types?: string[] | null;
  lab_website?: string | null;
  portfolio_url?: string | null;
  office_hours?: string | null;
  seeking_mentorship_type?: string | null;
  is_accepting_requests?: boolean | null;
  profile_complete?: boolean | null;
  ai_score?: number | null;
  ai_level?: string | null;
  ai_flags?: any | null;
  academic_stats?: AcademicStats | null;
  activities?: ActivityItem[] | null;
  honors_awards?: HonorAwardItem[] | null;
  languages?: LanguageItem[] | null;
  social_links?: SocialLinks | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Retrieves the currently authenticated session and matching Neon profile.
 */
export async function getCurrentUserAndProfile(customHeaders?: Headers): Promise<{
  session: any | null;
  user: any | null;
  profile: ProfileRecord | null;
}> {
  const reqHeaders = customHeaders || (await headers());

  let session: any = null;
  try {
    session = await auth.api.getSession({ headers: reqHeaders });
  } catch (error) {
    // A failed session read is not the same as being signed out, but every
    // caller treats a null session that way, so make the real cause visible.
    console.error("[auth] Failed to read session:", error);
    return { session: null, user: null, profile: null };
  }

  if (!session?.user) {
    return { session: null, user: null, profile: null };
  }

  // The profile queries run under the signed-in user's database identity so
  // the RLS policies can scope them (the auto-insert and the email-claim
  // update write the user's own row). runAs rather than ambient context:
  // workerd does not implement AsyncLocalStorage.enterWith.
  return runAs(session.user.id, async () => {
  try {
    const userId = session.user.id;
    const userEmail = session.user.email;

    const rows = await sql`SELECT * FROM profiles WHERE id = ${userId} OR email = ${userEmail} LIMIT 1;`;
    let profile = rows[0] as ProfileRecord | undefined;

    if (!profile) {
      const nameParts = (session.user.name || "").split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";
      const role = (session.user as any).role || "student";

      const newRows = await sql`
        INSERT INTO profiles (id, email, first_name, last_name, role, status, profile_complete)
        VALUES (${userId}, ${userEmail}, ${firstName}, ${lastName}, ${role}, 'active', false)
        ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email
        RETURNING *;
      `;
      profile = newRows[0] as ProfileRecord;
    } else if (profile.id !== userId) {
      // Link migrated profile ID to current auth user ID
      try {
        const updatedRows = await sql`
          UPDATE profiles SET id = ${userId} WHERE email = ${userEmail} RETURNING *;
        `;
        if (updatedRows && updatedRows[0]) {
          profile = updatedRows[0] as ProfileRecord;
        }
      } catch {
        // Keep existing profile if update fails
      }
    }

    return { session, user: session.user, profile: profile || null };
  } catch (error) {
    // The session is valid; only the profile row could not be loaded. Keep the
    // user signed in so they are not bounced back to /login in a loop.
    console.error("[auth] Failed to load profile:", error);
    return { session, user: session.user, profile: null };
  }
  });
}

export async function getProfileById(id: string): Promise<ProfileRecord | null> {
  const rows = await sql`SELECT * FROM profiles WHERE id = ${id} LIMIT 1;`;
  return (rows[0] as ProfileRecord) || null;
}

export async function getProfileByEmail(email: string): Promise<ProfileRecord | null> {
  const rows = await sql`SELECT * FROM profiles WHERE email = ${email} LIMIT 1;`;
  return (rows[0] as ProfileRecord) || null;
}

/**
 * Runs under the row owner's database identity: the RLS policies allow the
 * signed-in user to write their own profile row (and, through the email
 * branch, adopt a pre-migration row carrying their address). The ambient
 * request context cannot be relied on here — Next.js severs it across
 * request-body reads in API routes — so the identity is applied explicitly.
 */
export async function upsertProfile(profile: Partial<ProfileRecord> & { id: string; email: string }) {
  return runAs(profile.id, async () => {
  await ensureAuthSchema();

  let derivedExtras = profile.extracurriculars;
  if (!derivedExtras && profile.activities) {
    derivedExtras = profile.activities.map(a => a.organization ? `${a.title} (${a.organization})` : a.title);
  }

  let derivedCoursework = profile.coursework;
  if (!derivedCoursework && profile.academic_stats?.advanced_coursework) {
    derivedCoursework = profile.academic_stats.advanced_coursework;
  }

  const portfolioUrl = profile.portfolio_url || profile.social_links?.portfolio_url || null;

  const interests = profile.academic_interests !== undefined ? JSON.stringify(profile.academic_interests) : null;
  const extras = derivedExtras !== undefined ? JSON.stringify(derivedExtras) : null;
  const expertise = profile.expertise_fields !== undefined ? JSON.stringify(profile.expertise_fields) : null;
  const courseworkStr = derivedCoursework !== undefined ? JSON.stringify(derivedCoursework) : null;
  const skills = profile.skills_and_tools !== undefined ? JSON.stringify(profile.skills_and_tools) : null;
  const publications = profile.publications !== undefined ? JSON.stringify(profile.publications) : null;
  const studentTypes = profile.accepting_student_types !== undefined ? JSON.stringify(profile.accepting_student_types) : null;

  const academicStats = profile.academic_stats !== undefined ? JSON.stringify(profile.academic_stats) : null;
  const activities = profile.activities !== undefined ? JSON.stringify(profile.activities) : null;
  const honorsAwards = profile.honors_awards !== undefined ? JSON.stringify(profile.honors_awards) : null;
  const languages = profile.languages !== undefined ? JSON.stringify(profile.languages) : null;
  const socialLinks = profile.social_links !== undefined ? JSON.stringify(profile.social_links) : null;

  const existing = await sql`SELECT role, status, profile_complete FROM profiles WHERE id = ${profile.id} LIMIT 1;`;
  const resolvedRole = (profile.role && profile.role.trim()) ? profile.role : (existing[0]?.role || 'student');
  const resolvedStatus = (profile.status && profile.status.trim()) ? profile.status : (existing[0]?.status || 'active');
  const resolvedProfileComplete = typeof profile.profile_complete === 'boolean' ? profile.profile_complete : (existing[0]?.profile_complete ?? false);

  const rows = await sql`
    INSERT INTO profiles (
      id, email, role, status, first_name, preferred_name, last_name,
      avatar_url, institution, education_level, department, academic_title,
      major, graduation_year, bio, academic_interests, extracurriculars,
      expertise_fields, coursework, skills_and_tools, publications,
      accepting_student_types, lab_website, portfolio_url, office_hours,
      seeking_mentorship_type, is_accepting_requests, profile_complete,
      academic_stats, activities, honors_awards, languages, social_links,
      updated_at
    ) VALUES (
      ${profile.id}, ${profile.email}, ${resolvedRole}, ${resolvedStatus},
      ${profile.first_name || null}, ${profile.preferred_name || null}, ${profile.last_name || null},
      ${profile.avatar_url || null}, ${profile.institution || null}, ${profile.education_level || null},
      ${profile.department || null}, ${profile.academic_title || null}, ${profile.major || null},
      ${profile.graduation_year || null}, ${profile.bio || null}, ${interests}, ${extras},
      ${expertise}, ${courseworkStr}, ${skills}, ${publications}, ${studentTypes},
      ${profile.lab_website || null}, ${portfolioUrl}, ${profile.office_hours || null},
      ${profile.seeking_mentorship_type || null}, ${profile.is_accepting_requests !== undefined ? profile.is_accepting_requests : null},
      ${resolvedProfileComplete},
      ${academicStats}, ${activities}, ${honorsAwards}, ${languages}, ${socialLinks},
      now()
    )
    ON CONFLICT (id) DO UPDATE SET
      role = EXCLUDED.role,
      status = EXCLUDED.status,
      first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
      preferred_name = COALESCE(EXCLUDED.preferred_name, profiles.preferred_name),
      last_name = COALESCE(EXCLUDED.last_name, profiles.last_name),
      avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
      institution = COALESCE(EXCLUDED.institution, profiles.institution),
      education_level = COALESCE(EXCLUDED.education_level, profiles.education_level),
      department = COALESCE(EXCLUDED.department, profiles.department),
      academic_title = COALESCE(EXCLUDED.academic_title, profiles.academic_title),
      major = COALESCE(EXCLUDED.major, profiles.major),
      graduation_year = COALESCE(EXCLUDED.graduation_year, profiles.graduation_year),
      bio = COALESCE(EXCLUDED.bio, profiles.bio),
      academic_interests = COALESCE(EXCLUDED.academic_interests, profiles.academic_interests),
      extracurriculars = COALESCE(EXCLUDED.extracurriculars, profiles.extracurriculars),
      expertise_fields = COALESCE(EXCLUDED.expertise_fields, profiles.expertise_fields),
      coursework = COALESCE(EXCLUDED.coursework, profiles.coursework),
      skills_and_tools = COALESCE(EXCLUDED.skills_and_tools, profiles.skills_and_tools),
      publications = COALESCE(EXCLUDED.publications, profiles.publications),
      accepting_student_types = COALESCE(EXCLUDED.accepting_student_types, profiles.accepting_student_types),
      lab_website = COALESCE(EXCLUDED.lab_website, profiles.lab_website),
      portfolio_url = COALESCE(EXCLUDED.portfolio_url, profiles.portfolio_url),
      office_hours = COALESCE(EXCLUDED.office_hours, profiles.office_hours),
      seeking_mentorship_type = COALESCE(EXCLUDED.seeking_mentorship_type, profiles.seeking_mentorship_type),
      is_accepting_requests = COALESCE(EXCLUDED.is_accepting_requests, profiles.is_accepting_requests),
      profile_complete = EXCLUDED.profile_complete,
      academic_stats = COALESCE(EXCLUDED.academic_stats, profiles.academic_stats),
      activities = COALESCE(EXCLUDED.activities, profiles.activities),
      honors_awards = COALESCE(EXCLUDED.honors_awards, profiles.honors_awards),
      languages = COALESCE(EXCLUDED.languages, profiles.languages),
      social_links = COALESCE(EXCLUDED.social_links, profiles.social_links),
      updated_at = now()
    RETURNING *;
  `;

  return rows[0] as ProfileRecord;
  });
}
