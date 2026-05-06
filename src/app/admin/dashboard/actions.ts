"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

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
