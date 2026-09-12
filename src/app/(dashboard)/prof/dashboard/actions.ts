"use server";

import { sql } from "@/lib/neon/db";
import { runAs } from "@/lib/neon/user-context";
import { createNotification } from "@/lib/notifications";
import { revalidatePath } from "next/cache";
import { checkRateLimit, isValidId } from "@/lib/security";
import { captureServerEvent } from "@/lib/posthog-server";
import { requireRole, requireUser } from "@/lib/authz";
import { PROFESSOR_DECIDABLE_FROM, asSqlArray } from "@/lib/status";
import { internalError } from "@/lib/utils";

/**
 * Accepts or declines a pending request.
 *
 * The status filter is not cosmetic: without it the UPDATE matched on
 * `(id, professor_id)` alone, so a professor could flip an already closed or
 * declined thread back to `active` and re-fire the acceptance notification at a
 * student whose request they had previously rejected.
 */
export async function updateRequestStatus(requestId: string, status: "active" | "declined") {
  if (!isValidId(requestId)) {
    return { error: "Invalid request ID." };
  }
  if (status !== "active" && status !== "declined") {
    return { error: "Invalid status." };
  }

  const auth = await requireRole("professor");
  if (!auth.ok) return { error: auth.error };
  const { user } = auth;

  try {
    // Rate limit: 20 status changes per minute
    const rate = checkRateLimit(`status:${user.id}`, 20, 60 * 1000);
    if (!rate.allowed) {
      return { error: `Please slow down. Try again in ${rate.retryAfterSeconds}s.` };
    }

    const updatedRows = await runAs(user.id, async () =>
      await sql`
        UPDATE requests
        SET status = ${status}, updated_at = now()
        WHERE id = ${requestId}
          AND professor_id = ${user.id}
          AND status = ANY(${asSqlArray(PROFESSOR_DECIDABLE_FROM)})
        RETURNING student_id;
      `
    );

    const studentId = (updatedRows as Array<{ student_id: string }> | undefined)?.[0]?.student_id;
    if (!studentId) {
      // Either not this professor's request, or it has already been decided.
      // Same answer either way, so the action cannot be used to probe ids.
      return { error: "That request is no longer awaiting a decision." };
    }

    // The student is waiting on this answer — without it the bell never
    // rings and they only find out by re-checking the directory.
    await createNotification({
      actorId: user.id,
      userId: studentId,
      type: status === "active" ? "request_accepted" : "request_declined",
      title: status === "active" ? "Your mentorship request was accepted!" : "Your mentorship request was declined",
      body: status === "active"
        ? "Head to your thread to continue the conversation."
        : undefined,
      requestId,
    });

    await captureServerEvent(user.id, "professor_request_status_updated", { request_id: requestId, status });
    revalidatePath("/prof/dashboard");
    revalidatePath("/threads");
    return { success: true };
  } catch (err: unknown) {
    return { error: internalError("updateRequestStatus", err, "Failed to update request status.") };
  }
}

export async function markRequestViewed(requestId: string) {
  if (!isValidId(requestId)) {
    return { error: "Invalid request ID." };
  }

  const auth = await requireRole("professor");
  if (!auth.ok) return { error: auth.error };
  const { user } = auth;

  try {
    await runAs(user.id, async () => {
      await sql`
        UPDATE requests
        SET status = 'viewed', updated_at = now()
        WHERE id = ${requestId} AND professor_id = ${user.id} AND status = 'pending';
      `;
    });

    return { success: true };
  } catch (err: unknown) {
    return { error: internalError("markRequestViewed", err, "Failed to mark request as viewed.") };
  }
}

export async function toggleAvailability(isAccepting: boolean) {
  if (typeof isAccepting !== "boolean") return { error: "Invalid value." };

  const auth = await requireRole("professor");
  if (!auth.ok) return { error: auth.error };
  const { user } = auth;

  try {
    const rate = checkRateLimit(`toggle:${user.id}`, 5, 60 * 1000);
    if (!rate.allowed) {
      return { error: `Please wait ${rate.retryAfterSeconds}s before toggling again.` };
    }

    await runAs(user.id, async () => {
      await sql`
        UPDATE profiles
        SET is_accepting_requests = ${isAccepting}, updated_at = now()
        WHERE id = ${user.id} AND role = 'professor';
      `;
    });

    await captureServerEvent(user.id, "professor_availability_toggled", { is_accepting: isAccepting });
    revalidatePath("/prof/dashboard");
    // The directory and the public profile both render availability, and
    // submitMentorshipRequest now enforces it — all three must see the change.
    revalidatePath("/professors");
    revalidatePath(`/professors/${user.id}`);
    return { success: true };
  } catch (err: unknown) {
    return { error: internalError("toggleAvailability", err, "Failed to toggle availability.") };
  }
}

export async function markAllNotificationsRead() {
  const auth = await requireUser();
  if (!auth.ok) return;
  const { user } = auth;

  await runAs(user.id, async () => {
    await sql`
      UPDATE notifications
      SET read = true
      WHERE user_id = ${user.id} AND read = false;
    `;
  });

  revalidatePath("/dashboard");
  revalidatePath("/prof/dashboard");
}
