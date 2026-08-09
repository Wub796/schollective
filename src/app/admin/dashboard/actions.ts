"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";
import { scoreProfessorApplication } from "@/lib/validators";

/**
 * Runs the professor validation algorithm and stores the score
 * on the profile row so the admin can see it immediately.
 * Can be called server-side on signup or on-demand from the admin table.
 */
export async function scoreApplication(profileId: string) {
  try {
    const supabase = await createClient();

    const { data: profile } = await supabase
      .from("profiles")
      .select("email, institution, expertise_fields, first_name, last_name")
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

    await supabase
      .from("profiles")
      .update({
        ai_score: result.score,
        ai_flags: result.flags,
        ai_level: result.level,
      })
      .eq("id", profileId);

    revalidatePath("/admin/dashboard");
    return { success: true, result };
  } catch (err: any) {
    return { error: err.message || "Scoring failed" };
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
