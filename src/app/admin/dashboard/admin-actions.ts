"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const VIEW_AS_COOKIE = "x-admin-view-as";

/**
 * Admin: enter/exit "preview as" mode.
 * Sets an httpOnly cookie so the student/prof dashboards let the admin through.
 */
export async function setAdminViewAs(role: "student" | "professor" | null) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return;

  const cookieStore = await cookies();
  if (role) {
    cookieStore.set(VIEW_AS_COOKIE, role, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60, // 1 hour
    });
    redirect(role === "student" ? "/dashboard" : "/prof/dashboard");
  } else {
    cookieStore.delete(VIEW_AS_COOKIE);
    redirect("/admin/dashboard");
  }
}



/**
 * Admin: ban or reactivate a user account.
 * Reactivation is role-aware: students → 'active', professors → 'approved'.
 */
export async function setUserSuspended(targetUserId: string, suspend: boolean) {
  // Verify the caller is an admin (uses session RLS client)
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: admin } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (admin?.role !== "admin") return { error: "Access denied" };

  // Use service-role client to bypass RLS on all mutations
  const adminClient = createAdminClient();

  let newStatus: string;
  if (suspend) {
    newStatus = "suspended";
  } else {
    const { data: target } = await adminClient.from("profiles").select("role").eq("id", targetUserId).single();
    newStatus = target?.role === "professor" ? "approved" : "active";
  }

  const { error } = await adminClient
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

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("profiles")
    .update({ status: "pending", updated_at: new Date().toISOString() })
    .eq("id", professorId)
    .eq("role", "professor");

  if (error) return { error: error.message };
  revalidatePath("/admin/dashboard");
  return { success: true };
}

/**
 * Admin: change a user's role.
 * Also resets status to the appropriate default for the new role.
 */
export async function changeUserRole(
  targetUserId: string,
  newRole: "student" | "professor" | "admin"
) {
  // Verify caller is admin
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: admin } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (admin?.role !== "admin") return { error: "Access denied" };

  // Prevent self-role-change (avoid accidental lockout)
  if (targetUserId === user.id) return { error: "Cannot change your own role" };

  // Status defaults per role
  const defaultStatus = newRole === "professor" ? "approved" : "active";

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("profiles")
    .update({
      role: newRole,
      status: defaultStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", targetUserId);

  if (error) return { error: error.message };
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/users");
  return { success: true };
}

