"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  sanitiseText,
  isValidUuid,
  LIMITS,
} from "@/lib/security";

const VIEW_AS_COOKIE = "x-admin-view-as";

export async function setAdminViewAs(role: "student" | "professor" | null, launchTour?: boolean) {
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
      maxAge: 60 * 60,
    });
    const targetPath = role === "student" ? "/dashboard" : "/prof/dashboard";
    redirect(launchTour ? `${targetPath}?tour=true` : targetPath);
  } else {
    cookieStore.delete(VIEW_AS_COOKIE);
    redirect("/admin/dashboard");
  }
}

export async function setUserSuspended(targetUserId: string, suspend: boolean) {
  if (!isValidUuid(targetUserId)) return { error: "Invalid user ID." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: admin } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (admin?.role !== "admin") return { error: "Access denied" };

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
  revalidatePath("/admin/professors");
  return { success: true };
}

export async function revokeVerification(professorId: string) {
  if (!isValidUuid(professorId)) return { error: "Invalid professor ID." };

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
  revalidatePath("/admin/professors");
  return { success: true };
}

export async function changeUserRole(
  targetUserId: string,
  newRole: "student" | "professor" | "admin"
) {
  if (!isValidUuid(targetUserId)) return { error: "Invalid user ID." };
  if (!["student", "professor", "admin"].includes(newRole)) {
    return { error: "Invalid role." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: admin } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (admin?.role !== "admin") return { error: "Access denied" };

  if (targetUserId === user.id) return { error: "Cannot change your own role" };

  const defaultStatus = newRole === "professor" ? "pending" : "active";

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
  revalidatePath("/admin/professors");
  return { success: true };
}

export async function warnUser(userId: string, warningMessage: string) {
  if (!isValidUuid(userId)) return { error: "Invalid user ID." };

  const safeMsg = sanitiseText(warningMessage, LIMITS.warningMessage);
  if (!safeMsg) return { error: "Warning message cannot be empty." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: admin } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (admin?.role !== "admin") return { error: "Access denied" };

  const { data: request } = await supabase
    .from("requests")
    .select("id")
    .or(`student_id.eq.${userId},professor_id.eq.${userId}`)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!request) {
    return { error: "No active threads found for this user to deliver the warning." };
  }

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("messages")
    .insert({
      request_id: request.id,
      sender_id: user.id,
      content: `[SYSTEM WARNING]: ${safeMsg}`,
    });

  if (error) return { error: error.message };

  revalidatePath(`/messages/${request.id}`);
  return { success: true };
}

export async function suspendUser(userId: string, reason: string) {
  if (!isValidUuid(userId)) return { error: "Invalid user ID." };

  const safeReason = sanitiseText(reason, LIMITS.warningMessage);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: admin } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (admin?.role !== "admin") return { error: "Access denied" };

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("profiles")
    .update({
      status: "suspended",
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) return { error: error.message };

  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/users");
  revalidatePath("/admin/professors");
  return { success: true };
}

export async function unsuspendUser(userId: string) {
  if (!isValidUuid(userId)) return { error: "Invalid user ID." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: admin } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (admin?.role !== "admin") return { error: "Access denied" };

  const adminClient = createAdminClient();
  const { data: target } = await adminClient.from("profiles").select("role").eq("id", userId).single();
  const newStatus = target?.role === "professor" ? "approved" : "active";

  const { error } = await adminClient
    .from("profiles")
    .update({
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) return { error: error.message };

  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/users");
  revalidatePath("/admin/professors");
  return { success: true };
}

export async function softDeleteThread(requestId: string) {
  if (!isValidUuid(requestId)) return { error: "Invalid request ID." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: admin } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (admin?.role !== "admin") return { error: "Access denied" };

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("requests")
    .update({
      status: "deleted",
      updated_at: new Date().toISOString(),
    })
    .eq("id", requestId);

  if (error) return { error: error.message };

  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/threads");
  return { success: true };
}