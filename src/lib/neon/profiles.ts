import { sql } from "./db";
import { ensureAuthSchema } from "./schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

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
}

export async function getProfileById(id: string): Promise<ProfileRecord | null> {
  const rows = await sql`SELECT * FROM profiles WHERE id = ${id} LIMIT 1;`;
  return (rows[0] as ProfileRecord) || null;
}

export async function getProfileByEmail(email: string): Promise<ProfileRecord | null> {
  const rows = await sql`SELECT * FROM profiles WHERE email = ${email} LIMIT 1;`;
  return (rows[0] as ProfileRecord) || null;
}

export async function upsertProfile(profile: Partial<ProfileRecord> & { id: string; email: string }) {
  await ensureAuthSchema();
  const interests = JSON.stringify(profile.academic_interests || []);
  const extras = JSON.stringify(profile.extracurriculars || []);
  const expertise = JSON.stringify(profile.expertise_fields || []);
  const coursework = JSON.stringify(profile.coursework || []);
  const skills = JSON.stringify(profile.skills_and_tools || []);
  const publications = JSON.stringify(profile.publications || []);
  const studentTypes = JSON.stringify(profile.accepting_student_types || []);

  const rows = await sql`
    INSERT INTO profiles (
      id, email, role, status, first_name, preferred_name, last_name,
      avatar_url, institution, education_level, department, academic_title,
      major, graduation_year, bio, academic_interests, extracurriculars,
      expertise_fields, coursework, skills_and_tools, publications,
      accepting_student_types, lab_website, portfolio_url, office_hours,
      seeking_mentorship_type, is_accepting_requests, profile_complete,
      updated_at
    ) VALUES (
      ${profile.id}, ${profile.email}, ${profile.role || 'student'}, ${profile.status || 'active'},
      ${profile.first_name || null}, ${profile.preferred_name || null}, ${profile.last_name || null},
      ${profile.avatar_url || null}, ${profile.institution || null}, ${profile.education_level || null},
      ${profile.department || null}, ${profile.academic_title || null}, ${profile.major || null},
      ${profile.graduation_year || null}, ${profile.bio || null}, ${interests}, ${extras},
      ${expertise}, ${coursework}, ${skills}, ${publications}, ${studentTypes},
      ${profile.lab_website || null}, ${profile.portfolio_url || null}, ${profile.office_hours || null},
      ${profile.seeking_mentorship_type || null}, ${profile.is_accepting_requests ?? true},
      ${profile.profile_complete ?? false}, now()
    )
    ON CONFLICT (id) DO UPDATE SET
      role = COALESCE(EXCLUDED.role, profiles.role),
      status = COALESCE(EXCLUDED.status, profiles.status),
      first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
      preferred_name = COALESCE(EXCLUDED.preferred_name, profiles.preferred_name),
      last_name = COALESCE(EXCLUDED.last_name, profiles.last_name),
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
      profile_complete = COALESCE(EXCLUDED.profile_complete, profiles.profile_complete),
      updated_at = now()
    RETURNING *;
  `;

  return rows[0] as ProfileRecord;
}
