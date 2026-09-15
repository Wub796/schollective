import { sql } from "@/lib/neon/db";
import { runAs } from "@/lib/neon/user-context";
import { sanitiseText, isValidId, LIMITS } from "@/lib/security";
import { safeInternalPath } from "@/lib/safe-redirect";

export type NotificationType =
  | "request_accepted"
  | "request_declined"
  | "new_request"
  | "message"
  /**
   * A moderation warning from an admin. Delivered here rather than as a thread
   * message: the previous implementation inserted `[SYSTEM WARNING]: …` into the
   * target's most recent thread, which meant the unrelated other participant
   * read it too, and a user with no threads could not be warned at all.
   */
  | "admin_warning"
  /** Another student asked to be friends. */
  | "friend_request"
  /** A friend request the recipient sent was accepted. */
  | "friend_accepted"
  /** The lead of a request invited the recipient to collaborate on it. */
  | "group_invite"
  /** A student joined, left, or was removed from a group thread. */
  | "group_member_joined"
  | "group_member_left"
  | "group_member_removed";

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
  link,
}: {
  /** The signed-in user performing the action that caused the notification. */
  actorId: string;
  /** The recipient. */
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  /** Links the notification to `/messages/<requestId>`. */
  requestId?: string;
  /**
   * An in-app path to link to instead, for notifications that are not about a
   * thread the recipient can open (a friend request, a pending invite). Only a
   * site-relative path is accepted.
   */
  link?: string;
}): Promise<void> {
  // Both ids are validated: `actorId` becomes the database identity the insert
  // runs under, so a malformed value would silently widen what the RLS policy
  // evaluates rather than failing loudly.
  if (!isValidId(actorId) || !isValidId(userId)) return;

  const safeType = type;
  const safeTitle = sanitiseText(title, LIMITS.topic);
  const safeBody = body ? sanitiseText(body, LIMITS.messageContent) : null;
  const safeRequestId = requestId && isValidId(requestId) ? requestId : null;
  const safeLink = safeInternalPath(link) ?? (safeRequestId ? `/messages/${safeRequestId}` : null);

  if (!safeTitle) return;

  try {
    // The insert policy only requires an authenticated writer — the app
    // legitimately writes on behalf of others (a professor accepting a
    // request notifies the student). Apply the acting user's identity
    // explicitly: server actions run outside any ambient context guarantee.
    await runAs(actorId, async () => {
      await sql`
        INSERT INTO notifications (user_id, type, title, message, link)
        VALUES (${userId}, ${safeType}, ${safeTitle}, ${safeBody || safeTitle}, ${safeLink});
      `;
    });
  } catch (err: any) {
    console.error("[notification] insert error:", err?.message || err);
  }
}
