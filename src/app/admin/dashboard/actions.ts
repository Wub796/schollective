"use server";

import { sql } from "@/lib/neon/db";
import { runAs } from "@/lib/neon/user-context";
import { revalidatePath } from "next/cache";
import { scoreProfessorApplication } from "@/lib/validators";
import { isValidId } from "@/lib/security";
import { requireAdmin, requireUser } from "@/lib/authz";
import { internalError } from "@/lib/utils";

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
    return runAs(user.id, async () => await scoreApplicationFor(profileId, { canAutoApprove: isAdmin }));
  } catch (err: unknown) {
    return { error: internalError("scoreApplication", err, "Scoring failed.") };
  }
}

/** The scoring body — runs under the caller's database identity. */
async function scoreApplicationFor(pid: string, options: { canAutoApprove: boolean }) {
    const profiles = await sql`
      SELECT id, email, institution, expertise_fields, first_name, last_name, lab_website, publications, status, role
      FROM profiles
      WHERE id = ${pid}
      LIMIT 1;
    `;
    const profile = profiles[0];
    if (!profile) return { error: "Profile not found" };

    const result = scoreProfessorApplication({
      email:            profile.email || "",
      institution:      profile.institution || "",
      expertise_fields: profile.expertise_fields || [],
      first_name:       profile.first_name || "",
      last_name:        profile.last_name || "",
      lab_website:      profile.lab_website || "",
      publications:     profile.publications || [],
    });

    const isHighLegitimacy = result.score >= 70 && result.level === "high";
    let autoApproved = false;

    if (options.canAutoApprove && isHighLegitimacy && (profile.status === "pending" || !profile.status)) {
      autoApproved = true;
      await sql`
        UPDATE profiles
        SET status = 'approved',
            profile_complete = true,
            is_accepting_requests = true,
            ai_score = ${result.score},
            ai_flags = ${result.flags},
            ai_level = ${result.level},
            updated_at = now()
        WHERE id = ${pid};
      `;
      await sql`
        UPDATE "user"
        SET "status" = 'approved',
            "updatedAt" = now()
        WHERE "id" = ${pid};
      `;
    } else {
      await sql`
        UPDATE profiles
        SET ai_score = ${result.score},
            ai_flags = ${result.flags},
            ai_level = ${result.level},
            updated_at = now()
        WHERE id = ${pid};
      `;
    }

    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/professors");
    revalidatePath("/professors");

    return { success: true, autoApproved, result: { score: result.score, level: result.level, flags: result.flags, signals: result.signals } };
}

export async function autoReviewAllPendingProfessors() {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return { error: auth.error };
    const { user } = auth;

    return runAs(user.id, async () => {
    const pending = await sql`
      SELECT id
      FROM profiles
      WHERE role = 'professor' AND status = 'pending';
    `;

    if (!pending || pending.length === 0) {
      return { success: true, processed: 0, autoApprovedCount: 0, flaggedCount: 0 };
    }

    let autoApprovedCount = 0;
    let flaggedCount = 0;

    for (const item of pending) {
      const res = await scoreApplicationFor(item.id, { canAutoApprove: true });
      if (res?.autoApproved) autoApprovedCount++;
      else flaggedCount++;
    }

    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/professors");
    revalidatePath("/professors");

    return { success: true, processed: pending.length, autoApprovedCount, flaggedCount };
    });
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
