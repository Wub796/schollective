"use server";

import { sql } from "@/lib/neon/db";
import { runAs } from "@/lib/neon/user-context";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  sanitiseText,
  isValidId,
  LIMITS,
} from "@/lib/security";
import { ADMIN_VIEW_AS_COOKIE, requireAdmin } from "@/lib/authz";
import { createNotification } from "@/lib/notifications";
import { defaultStatusForRole, isUserRole } from "@/lib/status";
import { clearAdminPreviewData } from "@/lib/admin-preview";

const VIEW_AS_COOKIE = ADMIN_VIEW_AS_COOKIE;

/**
 * Guard against an admin locking themselves out.
 *
 * `changeUserRole` already refused self-targeting; `suspendUser` and
 * `setUserSuspended` did not, so an admin could suspend their own account and
 * lose product access with no screen left that could undo it.
 */
const SELF_TARGET_ERROR = "You cannot apply this to your own account.";

export async function setAdminViewAs(role: "student" | "professor" | null, launchTour?: boolean) {
  const auth = await requireAdmin();
  if (!auth.ok) return;
  const { user } = auth;

  // Only these two may be previewed; "admin" would be a no-op that still sets
  // the cookie every downstream page branches on.
  if (role !== null && role !== "student" && role !== "professor") return;

  const cookieStore = await cookies();
  if (role) {
    if (launchTour) {
      await clearAdminPreviewData(user.id);
    }
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
    await clearAdminPreviewData(user.id);
    redirect("/admin/dashboard");
  }
}

export async function setUserSuspended(targetUserId: string, suspend: boolean) {
  if (!isValidId(targetUserId)) return { error: "Invalid user ID." };

  const auth = await requireAdmin();
  if (!auth.ok) return { error: auth.error };
  const { user } = auth;

  if (targetUserId === user.id) return { error: SELF_TARGET_ERROR };

  return runAs(user.id, async () => {
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
  await sql`
    UPDATE "user"
    SET "status" = ${newStatus}, "updatedAt" = now()
    WHERE "id" = ${targetUserId};
  `;

  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/users");
  revalidatePath("/admin/professors");
  return { success: true };
  });
}

export async function revokeVerification(professorId: string) {
  if (!isValidId(professorId)) return { error: "Invalid professor ID." };

  const auth = await requireAdmin();
  if (!auth.ok) return { error: auth.error };
  const { user } = auth;

  if (professorId === user.id) return { error: SELF_TARGET_ERROR };

  return runAs(user.id, async () => {
  await sql`
    UPDATE profiles
    SET status = 'pending', updated_at = now()
    WHERE id = ${professorId} AND role = 'professor';
  `;
  await sql`
    UPDATE "user"
    SET "status" = 'pending', "updatedAt" = now()
    WHERE "id" = ${professorId};
  `;

  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/professors");
  return { success: true };
  });
}

export async function changeUserRole(
  targetUserId: string,
  newRole: "student" | "professor" | "admin"
) {
  if (!isValidId(targetUserId)) return { error: "Invalid user ID." };
  if (!isUserRole(newRole)) {
    return { error: "Invalid role." };
  }

  const auth = await requireAdmin();
  if (!auth.ok) return { error: auth.error };
  const { user } = auth;
  if (targetUserId === user.id) return { error: "Cannot change your own role" };

  const defaultStatus = defaultStatusForRole(newRole);

  return runAs(user.id, async () => {
  await sql`
    UPDATE profiles
    SET role = ${newRole}, status = ${defaultStatus}, updated_at = now()
    WHERE id = ${targetUserId};
  `;
  await sql`
    UPDATE "user"
    SET "role" = ${newRole}, "status" = ${defaultStatus}, "updatedAt" = now()
    WHERE "id" = ${targetUserId};
  `;

  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/users");
  revalidatePath("/admin/professors");
  return { success: true };
  });
}

export async function warnUser(userId: string, warningMessage: string) {
  if (!isValidId(userId)) return { error: "Invalid user ID." };

  const safeMsg = sanitiseText(warningMessage, LIMITS.warningMessage);
  if (!safeMsg) return { error: "Warning message cannot be empty." };

  const auth = await requireAdmin();
  if (!auth.ok) return { error: auth.error };
  const { user } = auth;

  if (userId === user.id) return { error: SELF_TARGET_ERROR };

  // Delivered as a private notification to the user.
  //
  // This used to insert `[SYSTEM WARNING]: …` as a message into the target's
  // most recent thread, which had two bad consequences: the other participant
  // in that thread — an uninvolved student or professor — read the moderation
  // notice too, and a user with no threads at all could not be warned, so the
  // action returned "No active threads found" and the moderator was stuck.
  await createNotification({
    actorId: user.id,
    userId,
    type: "admin_warning",
    title: "A message from the Schollective team",
    body: safeMsg,
  });

  revalidatePath("/admin/users");
  revalidatePath("/admin/threads");
  return { success: true };
}

export async function suspendUser(userId: string, reason: string) {
  if (!isValidId(userId)) return { error: "Invalid user ID." };

  const auth = await requireAdmin();
  if (!auth.ok) return { error: auth.error };
  const { user } = auth;

  if (userId === user.id) return { error: SELF_TARGET_ERROR };

  return runAs(user.id, async () => {
  await sql`
    UPDATE profiles
    SET status = 'suspended', updated_at = now()
    WHERE id = ${userId};
  `;
  await sql`
    UPDATE "user"
    SET "status" = 'suspended', "updatedAt" = now()
    WHERE "id" = ${userId};
  `;

  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/users");
  revalidatePath("/admin/professors");
  return { success: true };
  });
}

export async function unsuspendUser(userId: string) {
  if (!isValidId(userId)) return { error: "Invalid user ID." };

  const auth = await requireAdmin();
  if (!auth.ok) return { error: auth.error };
  const { user } = auth;

  return runAs(user.id, async () => {
  const targets = await sql`SELECT role FROM profiles WHERE id = ${userId} LIMIT 1;`;
  const target = targets[0];
  const newStatus = target?.role === "professor" ? "approved" : "active";

  await sql`
    UPDATE profiles
    SET status = ${newStatus}, updated_at = now()
    WHERE id = ${userId};
  `;
  await sql`
    UPDATE "user"
    SET "status" = ${newStatus}, "updatedAt" = now()
    WHERE "id" = ${userId};
  `;

  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/users");
  revalidatePath("/admin/professors");
  return { success: true };
  });
}

export async function softDeleteThread(requestId: string) {
  if (!isValidId(requestId)) return { error: "Invalid request ID." };

  const auth = await requireAdmin();
  if (!auth.ok) return { error: auth.error };
  const { user } = auth;

  return runAs(user.id, async () => {
  await sql`
    UPDATE requests
    SET status = 'deleted', updated_at = now()
    WHERE id = ${requestId};
  `;

  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/threads");
  // 'deleted' now genuinely hides the thread from both participants, so their
  // lists have to be rebuilt or they keep rendering it from cache.
  revalidatePath("/threads");
  revalidatePath("/prof/students");
  revalidatePath(`/messages/${requestId}`);
  return { success: true };
  });
}
