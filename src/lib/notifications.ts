import { sql } from "@/lib/neon/db";
import { runAs } from "@/lib/neon/user-context";
import { sanitiseText, isValidUuid, LIMITS } from "@/lib/security";

export type NotificationType =
  | "request_accepted"
  | "request_declined"
  | "new_request"
  | "message";

/**
 * Inserts a notification for a recipient, on behalf of the acting user.
 *
 * Deliberately a plain server module, not an exported "use server" action:
 * server actions are publicly invokable endpoints, and a write-on-behalf-of
 * primitive must never be callable directly by the client (that would be a
 * notification-spam/phishing vector). Call it only from authenticated server
 * actions and routes, passing the acting user's id.
 */
export async function createNotification({
  actorId,
  userId,
  type,
  title,
  body,
  requestId,
}: {
  /** The signed-in user performing the action that caused the notification. */
  actorId: string;
  /** The recipient. */
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  requestId?: string;
}): Promise<void> {
  if (!actorId || !isValidUuid(userId)) return;

  const safeType = type;
  const safeTitle = sanitiseText(title, LIMITS.topic);
  const safeBody = body ? sanitiseText(body, LIMITS.messageContent) : null;
  const safeRequestId = requestId && isValidUuid(requestId) ? requestId : null;

  if (!safeTitle) return;

  try {
    // The insert policy only requires an authenticated writer — the app
    // legitimately writes on behalf of others (a professor accepting a
    // request notifies the student). Apply the acting user's identity
    // explicitly: server actions run outside any ambient context guarantee.
    await runAs(actorId, async () => {
      await sql`
        INSERT INTO notifications (user_id, type, title, message, link)
        VALUES (${userId}, ${safeType}, ${safeTitle}, ${safeBody || safeTitle}, ${safeRequestId ? '/messages/' + safeRequestId : null});
      `;
    });
  } catch (err: any) {
    console.error("[notification] insert error:", err?.message || err);
  }
}
