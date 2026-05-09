"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Admin: suspend or reactivate a user account.
 */
export async function setUserSuspended(targetUserId: string, suspend: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: admin } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (admin?.role !== "admin") return { error: "Access denied" };

  const { error } = await supabase
    .from("profiles")
    .update({ status: suspend ? "suspended" : "approved", updated_at: new Date().toISOString() })
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
