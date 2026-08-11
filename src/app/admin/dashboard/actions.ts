"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";
import { scoreProfessorApplication } from "@/lib/validators";

/**
 * Runs the AI professor validation algorithm.
 * - Automatically APPROVES legitimate high-scoring applications (score >= 70).
 * - Leaves suspicious/low-scoring applications in 'pending' status, marked with AI flags for admin review.
 * - NEVER automatically rejects applications.
 */
export async function scoreApplication(profileId: string) {
  try {
    const adminClient = createAdminClient();

    const { data: profile } = await adminClient
      .from("profiles")
      .select("id, email, institution, expertise_fields, first_name, last_name, status, role")
      .eq("id", profileId)
      .single();

    if (!profile) return { error: "Profile not found" };

    const result = scoreProfessorApplication({
      email:            profile.email,
      institution:      profile.institution,
      expertise_fields: profile.expertise_fields,
      first_name:       profile.first_name,
      last_name:        profile.last_name,
    });

    const isHighLegitimacy = result.score >= 70 && result.level === "high";

    const updates: Record<string, any> = {
      ai_score: result.score,
      ai_flags: result.flags,
      ai_level: result.level,
      updated_at: new Date().toISOString(),
    };

    // Auto-approve if high legitimacy score and currently pending
    let autoApproved = false;
    if (isHighLegitimacy && (profile.status === "pending" || !profile.status)) {
      updates.status = "approved";
      updates.profile_complete = true;
      updates.is_accepting_requests = true;
      autoApproved = true;
    }

    let { error: updateError } = await adminClient
      .from("profiles")
      .update(updates)
      .eq("id", profileId);

    if (updateError && (updateError.message?.includes("profile_complete") || updateError.message?.includes("is_accepting_requests"))) {
      delete updates.profile_complete;
      delete updates.is_accepting_requests;
      const retry = await adminClient
        .from("profiles")
        .update(updates)
        .eq("id", profileId);
      updateError = retry.error;
    }

    if (updateError) {
      console.error("[scoreApplication] Update error:", updateError.message);
      return { error: updateError.message };
    }

    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/professors");
    revalidatePath("/professors");

    return {
      success: true,
      autoApproved,
      result: {
        score: result.score,
        level: result.level,
        flags: result.flags,
        signals: result.signals,
      },
    };
  } catch (err: any) {
    console.error("[scoreApplication] Error:", err);
    return { error: err.message || "Scoring failed" };
  }
}

/**
 * Batch Action: Process all pending professor applications with the AI reviewer.
 * Auto-approves high scoring applicants and flags suspicious ones for admin inspection.
 */
export async function autoReviewAllPendingProfessors() {
  try {
    const adminClient = createAdminClient();

    const { data: pending } = await adminClient
      .from("profiles")
      .select("id")
      .eq("role", "professor")
      .eq("status", "pending");

    if (!pending || pending.length === 0) {
      return { success: true, processed: 0, autoApprovedCount: 0, flaggedCount: 0 };
    }

    let autoApprovedCount = 0;
    let flaggedCount = 0;

    for (const item of pending) {
      const res = await scoreApplication(item.id);
      if (res?.autoApproved) {
        autoApprovedCount++;
      } else {
        flaggedCount++;
      }
    }

    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/professors");
    revalidatePath("/professors");

    return {
      success: true,
      processed: pending.length,
      autoApprovedCount,
      flaggedCount,
    };
  } catch (err: any) {
    console.error("[autoReviewAllPendingProfessors] Error:", err);
    return { error: err.message || "Batch review failed" };
  }
}

/**
 * Admin Action: Update Professor Application Status
 */
export async function updateProfessorStatus(profileId: string, newStatus: 'approved' | 'rejected') {
  try {
    const supabase = await createClient();

    // 1. Double-check Authorization
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("[updateProfessorStatus] Auth error or missing user:", authError?.message);
      return { error: "Unauthorized: Session expired. Please log in again." };
    }

    // Use service role admin client to bypass RLS policies
    const adminClient = createAdminClient();

    // Check if the current user is an admin
    const { data: adminProfile, error: adminQueryError } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (adminQueryError || adminProfile?.role !== 'admin') {
      console.error("[updateProfessorStatus] Admin check failed:", adminQueryError?.message, adminProfile);
      return { error: "Access denied: Admin privileges required." };
    }

    // 2. Perform Update with adminClient
    const updates: Record<string, any> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    if (newStatus === "approved") {
      updates.profile_complete = true;
      updates.is_accepting_requests = true;
    }

    let { error: updateError } = await adminClient
      .from("profiles")
      .update(updates)
      .eq("id", profileId);

    if (updateError && (updateError.message?.includes("profile_complete") || updateError.message?.includes("is_accepting_requests") || updateError.message?.includes("schema cache"))) {
      console.warn("[updateProfessorStatus] Schema cache fallback — retrying update without extra columns:", updateError.message);
      delete updates.profile_complete;
      delete updates.is_accepting_requests;
      const retry = await adminClient
        .from("profiles")
        .update(updates)
        .eq("id", profileId);
      updateError = retry.error;
    }

    if (updateError) {
      console.error("[updateProfessorStatus] DB update error:", updateError.message);
      return { error: `Update failed: ${updateError.message}` };
    }

    // 3. Sync State across all relevant views
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/professors");
    revalidatePath("/professors");
    return { success: true };
  } catch (err: any) {
    console.error("[updateProfessorStatus] Unexpected error:", err);
    return { error: err.message || "Failed to update professor status." };
  }
}
