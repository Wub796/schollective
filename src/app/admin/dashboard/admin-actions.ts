"use server";

import { sql } from "@/lib/neon/db";
import { getCurrentUserAndProfile } from "@/lib/neon/profiles";
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
  const { user, profile } = await getCurrentUserAndProfile();
  if (!user || profile?.role !== "admin") return;

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

  const { user, profile: admin } = await getCurrentUserAndProfile();
  if (!user || admin?.role !== "admin") return { error: "Access denied" };

  let newStatus: string;
  if (suspend) {
    newStatus = "suspended";
  } else {
    const targets = await sql`SELECT role FROM profiles WHERE id = ${targetUserId} LIMIT 1;`;
    const target = targets[0];
    newStatus = target?.role === "professor" ? "approved" : "active";
  }

  await sql`
    UPDATE profiles
    SET status = ${newStatus}, updated_at = now()
    WHERE id = ${targetUserId};
  `;

  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/users");
  revalidatePath("/admin/professors");
  return { success: true };
}

export async function revokeVerification(professorId: string) {
  if (!isValidUuid(professorId)) return { error: "Invalid professor ID." };

  const { user, profile: admin } = await getCurrentUserAndProfile();
  if (!user || admin?.role !== "admin") return { error: "Access denied" };

  await sql`
    UPDATE profiles
    SET status = 'pending', updated_at = now()
    WHERE id = ${professorId} AND role = 'professor';
  `;

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

  const { user, profile: admin } = await getCurrentUserAndProfile();
  if (!user || admin?.role !== "admin") return { error: "Access denied" };
  if (targetUserId === user.id) return { error: "Cannot change your own role" };

  const defaultStatus = newRole === "professor" ? "pending" : "active";

  await sql`
    UPDATE profiles
    SET role = ${newRole}, status = ${defaultStatus}, updated_at = now()
    WHERE id = ${targetUserId};
  `;

  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/users");
  revalidatePath("/admin/professors");
  return { success: true };
}

export async function warnUser(userId: string, warningMessage: string) {
  if (!isValidUuid(userId)) return { error: "Invalid user ID." };

  const safeMsg = sanitiseText(warningMessage, LIMITS.warningMessage);
  if (!safeMsg) return { error: "Warning message cannot be empty." };

  const { user, profile: admin } = await getCurrentUserAndProfile();
  if (!user || admin?.role !== "admin") return { error: "Access denied" };

  const requests = await sql`
    SELECT id
    FROM requests
    WHERE student_id = ${userId} OR professor_id = ${userId}
    ORDER BY updated_at DESC
    LIMIT 1;
  `;
  const request = requests[0];

  if (!request) {
    return { error: "No active threads found for this user to deliver the warning." };
  }

  await sql`
    INSERT INTO messages (request_id, sender_id, content)
    VALUES (${request.id}, ${user.id}, ${'[SYSTEM WARNING]: ' + safeMsg});
  `;

  revalidatePath(`/messages/${request.id}`);
  return { success: true };
}

export async function suspendUser(userId: string, reason: string) {
  if (!isValidUuid(userId)) return { error: "Invalid user ID." };

  const { user, profile: admin } = await getCurrentUserAndProfile();
  if (!user || admin?.role !== "admin") return { error: "Access denied" };

  await sql`
    UPDATE profiles
    SET status = 'suspended', updated_at = now()
    WHERE id = ${userId};
  `;

  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/users");
  revalidatePath("/admin/professors");
  return { success: true };
}

export async function unsuspendUser(userId: string) {
  if (!isValidUuid(userId)) return { error: "Invalid user ID." };

  const { user, profile: admin } = await getCurrentUserAndProfile();
  if (!user || admin?.role !== "admin") return { error: "Access denied" };

  const targets = await sql`SELECT role FROM profiles WHERE id = ${userId} LIMIT 1;`;
  const target = targets[0];
  const newStatus = target?.role === "professor" ? "approved" : "active";

  await sql`
    UPDATE profiles
    SET status = ${newStatus}, updated_at = now()
    WHERE id = ${userId};
  `;

  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/users");
  revalidatePath("/admin/professors");
  return { success: true };
}

export async function softDeleteThread(requestId: string) {
  if (!isValidUuid(requestId)) return { error: "Invalid request ID." };

  const { user, profile: admin } = await getCurrentUserAndProfile();
  if (!user || admin?.role !== "admin") return { error: "Access denied" };

  await sql`
    UPDATE requests
    SET status = 'deleted', updated_at = now()
    WHERE id = ${requestId};
  `;

  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/threads");
  return { success: true };
}
