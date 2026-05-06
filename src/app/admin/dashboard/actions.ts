"use server";

import { createClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

/**
 * Admin Action: Update Professor Application Status
 */
export async function updateProfessorStatus(profileId: string, newStatus: 'approved' | 'rejected') {
  const supabase = await createClient();

  // 1. Double-check Authorization
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Unauthorized");

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single();

  if (adminProfile?.role !== 'admin') {
    throw new Error("Access denied: Admin privileges required.");
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

  if (error) {
    console.error("Status update error:", error);
    throw new Error(error.message);
  }

  // 3. Sync State
  revalidatePath("/admin/dashboard");
  return { success: true };
}
