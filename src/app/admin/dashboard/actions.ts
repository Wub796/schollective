"use server";

import { sql } from "@/lib/neon/db";
import { runAs } from "@/lib/neon/user-context";
import { revalidatePath } from "next/cache";
import { scoreProfessorApplication } from "@/lib/validators";
import { checkDurableRateLimit } from "@/lib/rate-limit";
import { isValidId } from "@/lib/security";
import { requireAdmin, requireUser } from "@/lib/authz";
import { internalError } from "@/lib/utils";

const BATCH_REVIEWS_PER_HOUR = 10;
const HOUR_MS = 60 * 60 * 1000;

interface ScorableProfile {
  id: string;
  email: string | null;
  institution: string | null;
  expertise_fields: string[] | null;
  first_name: string | null;
  last_name: string | null;
  lab_website: string | null;
  publications: string[] | null;
  status: string | null;
}

function revalidateApplications() {
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/professors");
  revalidatePath("/professors");
}

/**
 * Scores applications and writes the outcome as two statements: one read for
 * every row, one UPDATE joined against the results.
 *
 * The per-applicant loop this replaces ran a SELECT and an UPDATE per row, and
 * every query here is a separate HTTP round trip to Neon — a batch review of 40
 * applications cost ~120 of them. Runs under the caller's database identity.
 *
 * Returns the scored rows it found; ids the viewer may not see are absent.
 */
async function scoreProfiles(ids: readonly string[], options: { canAutoApprove: boolean }) {
  const unique = [...new Set(ids)].filter(isValidId);
  if (unique.length === 0) return [];

  const profiles = (await sql`
    SELECT id, email, institution, expertise_fields, first_name, last_name,
           lab_website, publications, status
    FROM profiles
    WHERE id = ANY(${unique}::text[]);
  `) as ScorableProfile[];

  const scored = profiles.map((profile) => {
    const result = scoreProfessorApplication({
      email:            profile.email || "",
      institution:      profile.institution || "",
      expertise_fields: profile.expertise_fields || [],
      first_name:       profile.first_name || "",
      last_name:        profile.last_name || "",
      lab_website:      profile.lab_website || "",
      publications:     profile.publications || [],
    });

    return {
      profile,
      result,
      // Auto-approval is admin-only (see scoreApplication); scoring itself is not.
      autoApprove:
        options.canAutoApprove &&
        result.score >= 70 &&
        result.level === "high" &&
        (profile.status === "pending" || !profile.status),
    };
  });

  await sql`
    UPDATE profiles p
    SET ai_score = v.ai_score,
        ai_flags = v.ai_flags::jsonb,
        ai_level = v.ai_level,
        status = CASE WHEN v.auto_approve THEN 'approved' ELSE p.status END,
        profile_complete = CASE WHEN v.auto_approve THEN true ELSE p.profile_complete END,
        is_accepting_requests = CASE WHEN v.auto_approve THEN true ELSE p.is_accepting_requests END,
        updated_at = now()
    FROM (
      SELECT *
      FROM unnest(
        ${scored.map((s) => s.profile.id)}::text[],
        ${scored.map((s) => s.result.score)}::int[],
        ${scored.map((s) => s.result.level)}::text[],
        ${scored.map((s) => JSON.stringify(s.result.flags))}::text[],
        ${scored.map((s) => s.autoApprove)}::boolean[]
      ) AS t(id, ai_score, ai_level, ai_flags, auto_approve)
    ) v
    WHERE p.id = v.id;
  `;

  // The auth row mirrors the profile status (migration 0007); only the
  // auto-approved subset changes, and one statement covers all of them.
  const approved = scored.filter((s) => s.autoApprove).map((s) => s.profile.id);
  if (approved.length > 0) {
    await sql`
      UPDATE "user"
      SET "status" = 'approved', "updatedAt" = now()
      WHERE id = ANY(${approved}::text[]);
    `;
  }

  revalidateApplications();
  return scored;
}

export async function scoreApplication(profileId: string) {
  if (!isValidId(profileId)) {
    return { error: "Invalid profile ID." };
  }

  try {
    // Server actions are publicly invokable endpoints, so the caller is resolved
    // here and every query runs under their identity; the RLS admin branch then
    // enforces the same rule at the database layer.
    const auth = await requireUser();
    if (!auth.ok) return { error: auth.error };
    const { user, profile: callerProfile } = auth;

    const isSelf = user.id === profileId;
    const isAdmin = callerProfile.role === "admin";
    if (!isSelf && !isAdmin) {
      return { error: "Access denied: Admin privileges required." };
    }

    // A professor may score their OWN application (that is what the AI reviewer
    // card does) but scoring must not then approve them. Auto-approval is an
    // admin-only outcome: with `canAutoApprove` unconditional, any pending
    // professor whose application scored >= 70 could call this action on their
    // own id and promote themselves straight past manual credential review.
    const [scored] = await runAs(user.id, async () =>
      scoreProfiles([profileId], { canAutoApprove: isAdmin }),
    );
    if (!scored) return { error: "Profile not found" };

    return {
      success: true,
      autoApproved: scored.autoApprove,
      result: {
        score: scored.result.score,
        level: scored.result.level,
        flags: scored.result.flags,
        signals: scored.result.signals,
      },
    };
  } catch (err: unknown) {
    return { error: internalError("scoreApplication", err, "Scoring failed.") };
  }
}

/**
 * Scores a batch from the admin review table in one request instead of the
 * client firing one server action per applicant.
 */
export async function scoreApplications(profileIds: string[]) {
  const auth = await requireAdmin();
  if (!auth.ok) return { error: auth.error };

  const ids = Array.isArray(profileIds) ? profileIds.filter(isValidId) : [];
  if (ids.length === 0) return { error: "Invalid profile IDs." };
  if (ids.length > 100) return { error: "Score at most 100 applications at a time." };

  try {
    const scored = (await runAs(auth.user.id, () =>
      scoreProfiles(ids, { canAutoApprove: true }),
    )) as Awaited<ReturnType<typeof scoreProfiles>>;
    return { success: true as const, scored: scored.length };
  } catch (err: unknown) {
    return { error: internalError("scoreApplications", err, "Scoring failed.") };
  }
}

export async function autoReviewAllPendingProfessors() {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return { error: auth.error };
    const { user } = auth;

    const pending = (await runAs(user.id, () =>
      sql`
        SELECT id
        FROM profiles
        WHERE role = 'professor' AND status = 'pending';
      `
    )) as Array<{ id: string }>;

    if (!pending || pending.length === 0) {
      return { success: true, processed: 0, autoApprovedCount: 0, flaggedCount: 0 };
    }

    // Bulk write over every pending application: bound per admin so a stuck
    // button cannot rewrite the whole queue repeatedly.
    const rate = await checkDurableRateLimit(
      "admin-batch-review",
      user.id,
      BATCH_REVIEWS_PER_HOUR,
      HOUR_MS,
    );
    if (!rate.allowed) {
      return { error: `Batch review is limited to ${BATCH_REVIEWS_PER_HOUR} runs per hour. Try again in ${rate.retryAfterSeconds}s.` };
    }

    const scored = (await runAs(user.id, () =>
      scoreProfiles(pending.map((item) => item.id), { canAutoApprove: true }),
    )) as Awaited<ReturnType<typeof scoreProfiles>>;

    const autoApprovedCount = scored.filter((item) => item.autoApprove).length;
    const flaggedCount = scored.length - autoApprovedCount;

    return { success: true, processed: scored.length, autoApprovedCount, flaggedCount };
  } catch (err: unknown) {
    return { error: internalError("autoReviewAllPendingProfessors", err, "Batch review failed.") };
  }
}

export async function updateProfessorStatus(profileId: string, newStatus: 'approved' | 'rejected') {
  const pid = profileId;
  if (!isValidId(pid)) return { error: "Invalid profile ID." };
  if (newStatus !== "approved" && newStatus !== "rejected") return { error: "Invalid status." };

  try {
    const auth = await requireAdmin();
    if (!auth.ok) return { error: auth.error };
    const { user } = auth;

    // Scoped to professors: these two statuses are the faculty review outcomes,
    // and applying them to a student or another admin would leave that account
    // in a state no screen knows how to render or recover from.
    const targets = await runAs(user.id, async () =>
      sql`SELECT id FROM profiles WHERE id = ${pid} AND role = 'professor' LIMIT 1;`
    );
    if (!targets[0]) return { error: "No professor application found for that account." };

    if (newStatus === "approved") {
      await runAs(user.id, async () => {
        await sql`
          UPDATE profiles
          SET status = ${newStatus},
              profile_complete = true,
              is_accepting_requests = true,
              updated_at = now()
          WHERE id = ${pid};
        `;
        await sql`
          UPDATE "user"
          SET "status" = ${newStatus},
              "updatedAt" = now()
          WHERE "id" = ${pid};
        `;
      });
    } else {
      await runAs(user.id, async () => {
        await sql`
          UPDATE profiles
          SET status = ${newStatus},
              updated_at = now()
          WHERE id = ${pid};
        `;
        await sql`
          UPDATE "user"
          SET "status" = ${newStatus},
              "updatedAt" = now()
          WHERE "id" = ${pid};
        `;
      });
    }

    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/professors");
    revalidatePath("/professors");
    return { success: true };
  } catch (err: unknown) {
    return { error: internalError("updateProfessorStatus", err, "Failed to update professor status.") };
  }
}
