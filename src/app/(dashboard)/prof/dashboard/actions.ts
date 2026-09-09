"use server";

import { sql } from "@/lib/neon/db";
import { runAs } from "@/lib/neon/user-context";
import { createNotification } from "@/lib/notifications";
import { getCurrentUserAndProfile } from "@/lib/neon/profiles";
import { revalidatePath } from "next/cache";
import { checkRateLimit, sanitiseText, isValidUuid, LIMITS } from "@/lib/security";
import { captureServerEvent } from "@/lib/posthog-server";

export async function updateRequestStatus(requestId: string, status: "active" | "declined") {
  const reqId = sanitiseText(requestId, 100);
  if (!reqId || !isValidUuid(reqId)) {
    return { error: "Invalid request ID." };
  }
  if (status !== "active" && status !== "declined") {
    return { error: "Invalid status." };
  }

  try {
    const { user } = await getCurrentUserAndProfile();
    if (!user) return { error: "Unauthorized" };

    // Rate limit: 20 status changes per minute
    const rate = checkRateLimit(`status:${user.id}`, 20, 60 * 1000);
    if (!rate.allowed) {
      return { error: `Please slow down. Try again in ${rate.retryAfterSeconds}s.` };
    }

    const updatedRows = await runAs(user.id, async () =>
      await sql`
        UPDATE requests
        SET status = ${status}, updated_at = now()
        WHERE id = ${reqId} AND professor_id = ${user.id}
        RETURNING student_id;
      `
    );

    const studentId = (updatedRows as Array<{ student_id: string }> | undefined)?.[0]?.student_id;
    if (studentId) {
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
        requestId: reqId,
      });
    }

    await captureServerEvent(user.id, "professor_request_status_updated", { request_id: reqId, status });
    revalidatePath("/prof/dashboard");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to update request status." };
  }
}

export async function markRequestViewed(requestId: string) {
  const reqId = sanitiseText(requestId, 100);
  if (!reqId || !isValidUuid(reqId)) {
    return { error: "Invalid request ID." };
  }

  try {
    const { user } = await getCurrentUserAndProfile();
    if (!user) return { error: "Unauthorized" };

    await runAs(user.id, async () => {
      await sql`
        UPDATE requests
        SET status = 'viewed', updated_at = now()
        WHERE id = ${reqId} AND professor_id = ${user.id} AND status = 'pending';
      `;
    });

    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to mark request as viewed." };
  }
}

export async function toggleAvailability(isAccepting: boolean) {
  try {
    const { user } = await getCurrentUserAndProfile();
    if (!user) return { error: "Unauthorized" };

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
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to toggle availability." };
  }
}

export async function markAllNotificationsRead() {
  const { user } = await getCurrentUserAndProfile();
  if (!user) return;

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
