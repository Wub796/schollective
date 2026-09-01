"use server";

import { sql } from "@/lib/neon/db";
import { getCurrentUserAndProfile } from "@/lib/neon/profiles";
import { revalidatePath } from "next/cache";
import { checkRateLimit, sanitiseText, isValidUuid, LIMITS } from "@/lib/security";
import { getPostHogClient } from "@/lib/posthog-server";

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

    await sql`
      UPDATE requests
      SET status = ${status}, updated_at = now()
      WHERE id = ${reqId} AND professor_id = ${user.id};
    `;

    // Track accept/decline on the server
    const posthog = getPostHogClient();
    if (posthog) {
      const eventName = status === "active" ? "professor_request_accepted" : "professor_request_declined";
      posthog.capture({
        distinctId: user.id,
        event: eventName,
        properties: { request_id: reqId },
      });
      await posthog.flush().catch(() => undefined);
    }

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

    await sql`
      UPDATE requests
      SET status = 'viewed', updated_at = now()
      WHERE id = ${reqId} AND professor_id = ${user.id} AND status = 'pending';
    `;

    revalidatePath("/prof/dashboard");
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

    await sql`
      UPDATE profiles
      SET is_accepting_requests = ${isAccepting}, updated_at = now()
      WHERE id = ${user.id} AND role = 'professor';
    `;

    // Track availability toggle on the server
    const posthog = getPostHogClient();
    if (posthog) {
      posthog.capture({
        distinctId: user.id,
        event: "professor_availability_toggled",
        properties: { is_accepting: isAccepting },
      });
      await posthog.flush().catch(() => undefined);
    }

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
    await sql`
      INSERT INTO notifications (user_id, type, title, message, link)
      VALUES (${userId}, ${safeType}, ${safeTitle}, ${safeBody || safeTitle}, ${safeRequestId ? '/messages/' + safeRequestId : null});
    `;
  } catch (err: any) {
    console.error("[notification] insert error:", err.message);
  }
}

export async function markAllNotificationsRead() {
  const { user } = await getCurrentUserAndProfile();
  if (!user) return;

  await sql`
    UPDATE notifications
    SET read = true
    WHERE user_id = ${user.id} AND read = false;
  `;

  revalidatePath("/dashboard");
  revalidatePath("/prof/dashboard");
}
