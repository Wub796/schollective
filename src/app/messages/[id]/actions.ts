"use server";

import { sql } from "@/lib/neon/db";
import { runAs } from "@/lib/neon/user-context";
import { revalidatePath } from "next/cache";
import { filterMessage } from "@/lib/validators";
import { sanitiseText, isValidId, LIMITS } from "@/lib/security";
import { checkDurableRateLimit } from "@/lib/rate-limit";
import { requireParticipant, requireUser } from "@/lib/authz";
import { MESSAGEABLE_STATUS, TERMINAL_STATUSES } from "@/lib/status";
import { createNotification } from "@/lib/notifications";
import { internalError } from "@/lib/utils";

const MESSAGE_RATE_LIMIT = 15;
const MESSAGE_RATE_WINDOW_MS = 60 * 1000;

export async function sendMessage(requestId: string, content: string) {
  if (!isValidId(requestId)) {
    return { error: "Invalid request ID." };
  }

  const sanitisedContent = sanitiseText(content, LIMITS.messageContent);
  if (!sanitisedContent) {
    return { error: "Message cannot be empty." };
  }

  const filter = filterMessage(sanitisedContent);
  if (!filter.allowed) {
    return { error: filter.reason ?? "Message blocked by content filter." };
  }

  try {
    const auth = await requireUser();
    if (!auth.ok) return { error: auth.error };
    const { user } = auth;

    // DB-backed so the window is shared across Worker isolates (the in-memory
    // counter resets on every deploy/isolate recycle).
    const rateCheck = await checkDurableRateLimit("msg", user.id, MESSAGE_RATE_LIMIT, MESSAGE_RATE_WINDOW_MS);
    if (!rateCheck.allowed) {
      return {
        error: `You're sending messages too quickly. Please wait ${rateCheck.retryAfterSeconds} seconds.`,
        rateLimited: true,
      };
    }

    const access = await requireParticipant(requestId, user.id);
    if (!access.ok) return { error: access.error };
    if (access.request.status !== MESSAGEABLE_STATUS) {
      return { error: "This thread is not active and cannot receive messages." };
    }

    return runAs(user.id, async () => {
      await sql`
        INSERT INTO messages (request_id, sender_id, content)
        VALUES (${requestId}, ${user.id}, ${sanitisedContent});
      `;

      await sql`
        UPDATE requests
        SET updated_at = now()
        WHERE id = ${requestId};
      `;

      // Notify the other participant so the conversation is discovered
      // without polling the thread page.
      const recipientId =
        user.id === access.request.student_id ? access.request.professor_id : access.request.student_id;
      await createNotification({
        actorId: user.id,
        userId: recipientId,
        type: "message",
        title: "New message",
        body: sanitisedContent.slice(0, 120),
        requestId,
      });

      revalidatePath(`/messages/${requestId}`);
      revalidatePath("/threads");
      revalidatePath("/prof/students");
      return { success: true };
    });
  } catch (err) {
    return { error: internalError("sendMessage", err, "Failed to send message.") };
  }
}

export async function closeRequest(requestId: string) {
  if (!isValidId(requestId)) {
    return { error: "Invalid request ID." };
  }

  try {
    const auth = await requireUser();
    if (!auth.ok) return { error: auth.error };
    const { user } = auth;

    const access = await requireParticipant(requestId, user.id);
    if (!access.ok) return { error: access.error };

    // Closing something already finished is a no-op, not an error worth a write:
    // without this, a closed thread could be "closed" again and bump its
    // updated_at, reordering both participants' thread lists for no reason.
    if (TERMINAL_STATUSES.includes(access.request.status)) {
      return { success: true, alreadyClosed: true };
    }

    return runAs(user.id, async () => {
      await sql`
        UPDATE requests
        SET status = 'closed', updated_at = now()
        WHERE id = ${requestId};
      `;

      revalidatePath(`/messages/${requestId}`);
      revalidatePath("/dashboard");
      revalidatePath("/threads");
      revalidatePath("/prof/dashboard");
      revalidatePath("/prof/students");

      return { success: true };
    });
  } catch (err) {
    return { error: internalError("closeRequest", err, "Failed to close request.") };
  }
}

export async function markRead(requestId: string) {
  if (!isValidId(requestId)) {
    return { error: "Invalid request ID." };
  }

  try {
    const auth = await requireUser();
    if (!auth.ok) return { error: auth.error };
    const { user } = auth;

    // Without this, anyone could clear the unread state on someone else's thread.
    const access = await requireParticipant(requestId, user.id);
    if (!access.ok) return { error: access.error };

    return runAs(user.id, async () => {
      await sql`
        UPDATE messages
        SET read_at = now()
        WHERE request_id = ${requestId}
          AND sender_id != ${user.id}
          AND read_at IS NULL;
      `;

      revalidatePath(`/messages/${requestId}`);
      revalidatePath("/dashboard");
      revalidatePath("/threads");
      revalidatePath("/prof/dashboard");

      return { success: true };
    });
  } catch (err) {
    return { error: internalError("markRead", err, "Failed to mark messages as read.") };
  }
}
