"use server";

import { createClient } from "@/utils/supabase/server";
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (adminProfile?.role !== 'admin') {
      return { error: "Access denied: Admin privileges required." };
    }

    // 2. Perform Update
    const { error } = await supabase
      .from("profiles")
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString() 
      })
      .eq("id", profileId)
      .eq("role", "professor");

    if (error) throw error;

    // 3. Sync State
    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to update professor status." };
  }
}
