"use server";

import { sql } from "@/lib/neon/db";
import { runAs } from "@/lib/neon/user-context";
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

    await runAs(user.id, async () => {
      await sql`
        UPDATE requests
        SET status = ${status}, updated_at = now()
        WHERE id = ${reqId} AND professor_id = ${user.id};
      `;
    });

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

export async function createNotification({
  userId, type, title, body, requestId,
}: {
  userId: string;
  type: "request_accepted" | "request_declined" | "new_request" | "message";
  title: string;
  body?: string;
  requestId?: string;
}) {
  const safeType = type;
  const safeTitle = sanitiseText(title, LIMITS.topic);
  const safeBody = body ? sanitiseText(body, LIMITS.messageContent) : null;
  const safeRequestId = requestId && isValidUuid(requestId) ? requestId : null;

  if (!safeTitle) return;

  try {
    // Notifications are written on behalf of the recipient (a professor
    // accepting a request notifies the student), so the insert policy only
    // requires an authenticated writer. Apply the acting professor's identity
    // explicitly — server actions run outside the ambient context guarantee.
    const { user } = await getCurrentUserAndProfile();
    if (!user) return;
    await runAs(user.id, async () => {
      await sql`
        INSERT INTO notifications (user_id, type, title, message, link)
        VALUES (${userId}, ${safeType}, ${safeTitle}, ${safeBody || safeTitle}, ${safeRequestId ? '/messages/' + safeRequestId : null});
      `;
    });
  } catch (err: any) {
    console.error("[notification] insert error:", err.message);
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
