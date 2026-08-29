"use server";

import { sql } from "@/lib/neon/db";
import { getCurrentUserAndProfile } from "@/lib/neon/profiles";
import { revalidatePath } from "next/cache";
import { filterMessage } from "@/lib/validators";
import { checkRateLimit, sanitiseText, isValidUuid, LIMITS } from "@/lib/security";

const MESSAGE_RATE_LIMIT = 15;

export async function sendMessage(requestId: string, content: string) {
  const reqId = sanitiseText(requestId, 100);
  if (!reqId || !isValidUuid(reqId)) {
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
    const { user } = await getCurrentUserAndProfile();
    if (!user) return { error: "Unauthorized" };

    const rateCheck = checkRateLimit(`msg:${user.id}`, MESSAGE_RATE_LIMIT, 60 * 1000);
    if (!rateCheck.allowed) {
      return {
        error: `You're sending messages too quickly. Please wait ${rateCheck.retryAfterSeconds} seconds.`,
        rateLimited: true,
      };
    }

    const requests = await sql`
      SELECT status, student_id, professor_id
      FROM requests
      WHERE id = ${reqId}
      LIMIT 1;
    `;
    const request = requests[0];

    if (!request) return { error: "Thread not found." };
    if (request.status !== "active") {
      return { error: "This thread is not active and cannot receive messages." };
    }
    if (request.student_id !== user.id && request.professor_id !== user.id) {
      return { error: "Unauthorized: You are not a participant in this thread." };
    }

    await sql`
      INSERT INTO messages (request_id, sender_id, content)
      VALUES (${reqId}, ${user.id}, ${sanitisedContent});
    `;

    await sql`
      UPDATE requests
      SET updated_at = now()
      WHERE id = ${reqId};
    `;

    revalidatePath(`/messages/${reqId}`);
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to send message." };
  }
}

export async function closeRequest(requestId: string) {
  const reqId = sanitiseText(requestId, 100);
  if (!reqId || !isValidUuid(reqId)) {
    return { error: "Invalid request ID." };
  }

  try {
    const { user } = await getCurrentUserAndProfile();
    if (!user) return { error: "Unauthorized" };

    const requests = await sql`
      SELECT student_id, professor_id
      FROM requests
      WHERE id = ${reqId}
      LIMIT 1;
    `;
    const request = requests[0];

    if (!request) return { error: "Request not found" };
    if (request.student_id !== user.id && request.professor_id !== user.id) {
      return { error: "Unauthorized: You are not a participant in this thread." };
    }

    await sql`
      UPDATE requests
      SET status = 'closed', updated_at = now()
      WHERE id = ${reqId};
    `;

    revalidatePath(`/messages/${reqId}`);
    revalidatePath("/dashboard");
    revalidatePath("/prof/dashboard");

    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to close request." };
  }
}

export async function markRead(requestId: string) {
  const reqId = sanitiseText(requestId, 100);
  if (!reqId || !isValidUuid(reqId)) {
    return { error: "Invalid request ID." };
  }

  try {
    const { user } = await getCurrentUserAndProfile();
    if (!user) return { error: "Unauthorized" };

    await sql`
      UPDATE messages
      SET read_at = now()
      WHERE request_id = ${reqId}
        AND sender_id != ${user.id}
        AND read_at IS NULL;
    `;

    revalidatePath(`/messages/${reqId}`);
    revalidatePath("/dashboard");
    revalidatePath("/prof/dashboard");

    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to mark messages as read." };
  }
}
