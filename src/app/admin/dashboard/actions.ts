"use server";

import { sql } from "@/lib/neon/db";
import { getCurrentUserAndProfile } from "@/lib/neon/profiles";
import { revalidatePath } from "next/cache";
import { scoreProfessorApplication } from "@/lib/validators";
import { checkRateLimit, sanitiseText, isValidUuid, LIMITS } from "@/lib/security";

export async function scoreApplication(profileId: string) {
  const pid = sanitiseText(profileId, 100);
  if (!pid || !isValidUuid(pid)) {
    return { error: "Invalid profile ID." };
  }

  try {
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

    if (isHighLegitimacy && (profile.status === "pending" || !profile.status)) {
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
  } catch (err: any) {
    console.error("[scoreApplication] Unexpected error:", err);
    return { error: err.message || "Scoring failed" };
  }
}

export async function autoReviewAllPendingProfessors() {
  try {
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
      const res = await scoreApplication(item.id);
      if (res?.autoApproved) autoApprovedCount++;
      else flaggedCount++;
    }

    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/professors");
    revalidatePath("/professors");

    return { success: true, processed: pending.length, autoApprovedCount, flaggedCount };
  } catch (err: any) {
    console.error("[autoReviewAllPendingProfessors] Error:", err);
    return { error: err.message || "Batch review failed" };
  }
}

export async function updateProfessorStatus(profileId: string, newStatus: 'approved' | 'rejected') {
  const pid = sanitiseText(profileId, 100);
  if (!pid || !isValidUuid(pid)) return { error: "Invalid profile ID." };
  if (newStatus !== "approved" && newStatus !== "rejected") return { error: "Invalid status." };

  try {
    const { user, profile: adminProfile } = await getCurrentUserAndProfile();
    if (!user || adminProfile?.role !== 'admin') {
      return { error: "Access denied: Admin privileges required." };
    }

    if (newStatus === "approved") {
      await sql`
        UPDATE profiles
        SET status = ${newStatus},
            profile_complete = true,
            is_accepting_requests = true,
            updated_at = now()
        WHERE id = ${pid};
      `;
    } else {
      await sql`
        UPDATE profiles
        SET status = ${newStatus},
            updated_at = now()
        WHERE id = ${pid};
      `;
    }

    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/professors");
    revalidatePath("/professors");
    return { success: true };
  } catch (err: any) {
    console.error("[updateProfessorStatus] Unexpected error:", err);
    return { error: err.message || "Failed to update professor status." };
  }
}
