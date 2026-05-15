"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Admin: ban or reactivate a user account.
 * Reactivation is role-aware: students → 'active', professors → 'approved'.
 */
export async function setUserSuspended(targetUserId: string, suspend: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: admin } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (admin?.role !== "admin") return { error: "Access denied" };

  // Determine the correct reactivated status for this user's role
  let newStatus: string;
  if (suspend) {
    newStatus = "suspended";
  } else {
    const { data: target } = await supabase.from("profiles").select("role").eq("id", targetUserId).single();
    newStatus = target?.role === "professor" ? "approved" : "active";
  }

  const { error } = await supabase
    .from("profiles")
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", targetUserId);

  if (error) return { error: error.message };
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/users");
  return { success: true };
}


/**
 * Admin: revoke a professor's verified status (set back to pending).
 */
export async function revokeVerification(professorId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: admin } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (admin?.role !== "admin") return { error: "Access denied" };

  const { error } = await supabase
    .from("profiles")
    .update({ status: "pending", updated_at: new Date().toISOString() })
    .eq("id", professorId)
    .eq("role", "professor");

  if (error) return { error: error.message };
  revalidatePath("/admin/dashboard");
  return { success: true };
}
