"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";
import { scoreProfessorApplication } from "@/lib/validators";
import { checkRateLimit, sanitiseText, isValidUuid, LIMITS } from "@/lib/security";

/**
 * Runs the AI professor validation algorithm.
 */
export async function scoreApplication(profileId: string) {
  const pid = sanitiseText(profileId, 100);
  if (!pid || !isValidUuid(pid)) {
    return { error: "Invalid profile ID." };
  }

  try {
    const adminClient = createAdminClient();

    let profile: any = null;
    const { data: primaryProfile, error: selectError } = await adminClient
      .from("profiles")
      .select("id, email, institution, expertise_fields, first_name, last_name, lab_website, publications, status, role")
      .eq("id", pid)
      .maybeSingle();

    if (selectError || !primaryProfile) {
      const { data: fallbackProfile } = await adminClient
        .from("profiles")
        .select("id, email, institution, first_name, last_name, status")
        .eq("id", pid)
        .maybeSingle();

      if (!fallbackProfile) return { error: "Profile not found" };
      profile = fallbackProfile;
    } else {
      profile = primaryProfile;
    }

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

    const updates: Record<string, any> = {
      ai_score: result.score,
      ai_flags: result.flags,
      ai_level: result.level,
      updated_at: new Date().toISOString(),
    };

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
      .eq("id", pid);

    if (updateError && (updateError.message?.includes("profile_complete") || updateError.message?.includes("is_accepting_requests") || updateError.message?.includes("schema cache"))) {
      delete updates.profile_complete;
      delete updates.is_accepting_requests;
      const retry = await adminClient
        .from("profiles")
        .update(updates)
        .eq("id", pid);
      updateError = retry.error;
    }

    if (updateError && (updateError.message?.includes("ai_score") || updateError.message?.includes("ai_flags") || updateError.message?.includes("ai_level"))) {
      const coreUpdates: Record<string, any> = { updated_at: new Date().toISOString() };
      if (autoApproved) coreUpdates.status = "approved";
      const retryCore = await adminClient
        .from("profiles")
        .update(coreUpdates)
        .eq("id", pid);
      updateError = retryCore.error;
    }

    if (updateError) {
      console.warn("[scoreApplication] Update warning:", updateError.message);
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
    const adminClient = createAdminClient();

    const { data: pending, error } = await adminClient
      .from("profiles")
      .select("id")
      .eq("role", "professor")
      .eq("status", "pending");

    if (error || !pending || pending.length === 0) {
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
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { error: "Unauthorized: Session expired. Please log in again." };
    }

    const adminClient = createAdminClient();

    const { data: adminProfile, error: adminQueryError } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (adminQueryError || adminProfile?.role !== 'admin') {
      return { error: "Access denied: Admin privileges required." };
    }

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
      .eq("id", pid);

    if (updateError && (updateError.message?.includes("profile_complete") || updateError.message?.includes("is_accepting_requests") || updateError.message?.includes("schema cache"))) {
      delete updates.profile_complete;
      delete updates.is_accepting_requests;
      const retry = await adminClient
        .from("profiles")
        .update(updates)
        .eq("id", pid);
      updateError = retry.error;
    }

    if (updateError) {
      return { error: `Update failed: ${updateError.message}` };
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