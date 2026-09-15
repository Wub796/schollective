import { sql } from "@/lib/neon/db";
import { runAs } from "@/lib/neon/user-context";
import { isValidId } from "@/lib/security";

/**
 * Wipes the student and faculty data an admin creates while previewing the
 * product as another role, so the next preview starts clean.
 *
 * Deliberately a plain server module and NOT an export of a "use server" file.
 * It used to live in src/app/admin/dashboard/admin-actions.ts, which made it a
 * publicly invokable server action — with no authorization check of its own and
 * an id parameter it trusted. Because every query runs under the identity it is
 * handed, calling it with any user's id deleted that user's requests, messages
 * and AI review jobs. Only call it with the id of an admin the caller has
 * already verified (the admin layout and setAdminViewAs both do).
 */
export async function clearAdminPreviewData(adminUserId: string): Promise<void> {
  if (!isValidId(adminUserId)) return;

  return runAs(adminUserId, async () => {
    // 1. Reset every student and faculty field on the admin's own profile.
    //    `role = 'admin'` keeps this from ever touching anyone else's row.
    try {
      await sql`
        UPDATE profiles
        SET bio = NULL,
            institution = NULL,
            education_level = NULL,
            major = NULL,
            graduation_year = NULL,
            academic_interests = NULL,
            extracurriculars = NULL,
            coursework = NULL,
            skills_and_tools = NULL,
            portfolio_url = NULL,
            seeking_mentorship_type = NULL,
            department = NULL,
            academic_title = NULL,
            publications = NULL,
            accepting_student_types = NULL,
            lab_website = NULL,
            office_hours = NULL,
            is_accepting_requests = true,
            profile_complete = true,
            ai_score = NULL,
            ai_level = NULL,
            ai_flags = NULL,
            avatar_url = NULL,
            updated_at = now()
        WHERE id = ${adminUserId}
          AND role = 'admin'
          AND (
            bio IS NOT NULL OR institution IS NOT NULL OR education_level IS NOT NULL
            OR major IS NOT NULL OR graduation_year IS NOT NULL
            OR academic_interests IS NOT NULL OR extracurriculars IS NOT NULL
            OR coursework IS NOT NULL OR skills_and_tools IS NOT NULL
            OR portfolio_url IS NOT NULL OR seeking_mentorship_type IS NOT NULL
            OR department IS NOT NULL OR academic_title IS NOT NULL
            OR publications IS NOT NULL OR profile_complete = false
            OR ai_score IS NOT NULL OR avatar_url IS NOT NULL
          );
      `;
    } catch (error) {
      console.error("[admin-preview] Error clearing admin profile fields:", error);
    }

    // 2. Remove preview AI review jobs so the reviewer card starts fresh.
    try {
      await sql`DELETE FROM ai_profile_review_jobs WHERE user_id = ${adminUserId};`;
    } catch (error) {
      console.error("[admin-preview] Error clearing admin test AI review jobs:", error);
    }

    // 3. Remove preview requests and their messages. Memberships and read
    //    positions on those requests cascade with them.
    try {
      await sql`
        DELETE FROM messages
        WHERE sender_id = ${adminUserId}
           OR request_id IN (
             SELECT id FROM requests WHERE student_id = ${adminUserId} OR professor_id = ${adminUserId}
           );
      `;
      await sql`
        DELETE FROM requests
        WHERE student_id = ${adminUserId} OR professor_id = ${adminUserId};
      `;
    } catch (error) {
      console.error("[admin-preview] Error clearing admin test requests/messages:", error);
    }
  });
}
