"use server";

import { sql } from "@/lib/neon/db";
import { runAs } from "@/lib/neon/user-context";
import { revalidatePath } from "next/cache";
import { filterMessage } from "@/lib/validators";
import { sanitiseText, isValidId, LIMITS } from "@/lib/security";
import { checkDurableRateLimit } from "@/lib/rate-limit";
import { requireParticipant, requireStudentActor, requireUser } from "@/lib/authz";
import { MEMBER_ENDED, MESSAGEABLE_STATUS, TERMINAL_STATUSES, asSqlArray, type MemberStatus } from "@/lib/status";
import { createNotification } from "@/lib/notifications";
import { captureServerEvent } from "@/lib/posthog-server";
import { recordThreadRead } from "@/lib/neon/social";
import {
  MAX_COLLABORATORS,
  canCloseThread,
  canInviteCollaborators,
  canLeaveThread,
  canRemoveMember,
  normaliseCollaboratorIds,
  remainingCollaboratorSlots,
  threadAudience,
} from "@/lib/collaboration";
import { facultyName, fullName } from "@/lib/people";
import { internalError } from "@/lib/utils";

const MESSAGE_RATE_LIMIT = 15;
const MESSAGE_RATE_WINDOW_MS = 60 * 1000;
const INVITES_PER_DAY = 20;
const DAY_MS = 24 * 60 * 60 * 1000;

function revalidateThread(requestId: string) {
  revalidatePath(`/messages/${requestId}`);
  revalidatePath("/threads");
  revalidatePath("/prof/dashboard");
  revalidatePath("/prof/students");
}

/** Students who have joined a thread. Runs inside the caller's runAs. */
async function joinedMemberIds(requestId: string): Promise<string[]> {
  const rows = await sql`
    SELECT student_id FROM request_members
    WHERE request_id = ${requestId} AND status = 'joined';
  `;
  return (rows as Array<{ student_id: string }>).map((row) => row.student_id);
}

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
    const { user, profile } = auth;

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
      // The thread's updated_at moves with this insert, via the
      // messages_touch_request trigger (db/migrations/0008). The explicit UPDATE
      // this used to run was refused for joined members, who may not update a
      // request, so their messages never reordered anyone's thread list.
      await sql`
        INSERT INTO messages (request_id, sender_id, content)
        VALUES (${requestId}, ${user.id}, ${sanitisedContent});
      `;

      // Writing a message means the sender has read the thread up to it.
      await recordThreadRead(requestId, user.id);

      // Everyone else on the thread hears about it: the lead, the professor and
      // every joined member.
      const senderName = access.role === "professor" ? facultyName(profile) : fullName(profile);
      const recipients = threadAudience(access.request, await joinedMemberIds(requestId), user.id);
      for (const recipientId of recipients) {
        await createNotification({
          actorId: user.id,
          userId: recipientId,
          type: "message",
          title: `New message from ${senderName}`,
          body: sanitisedContent.slice(0, 120),
          requestId,
        });
      }

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

    // Closing ends the conversation for everyone on it, so it belongs to the
    // student who started the request and the professor. A collaborator leaves.
    if (!canCloseThread(access.role, access.request.status)) {
      return { error: "Only the student who started this request or the professor can close it. You can leave the group instead." };
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

/**
 * Invites friends onto a thread the caller leads. Students who declined, left
 * or were removed earlier are invited again rather than duplicated.
 */
export async function inviteCollaborators(requestId: string, studentIds: string[]) {
  if (!isValidId(requestId)) return { error: "Invalid request ID." };

  try {
    const auth = await requireStudentActor();
    if (!auth.ok) return { error: auth.error };
    const { user, profile } = auth;

    const { ids } = normaliseCollaboratorIds(Array.isArray(studentIds) ? studentIds : [], user.id);
    if (ids.length === 0) return { error: "Choose at least one friend to invite." };

    const access = await requireParticipant(requestId, user.id);
    if (!access.ok) return { error: access.error };
    if (!canInviteCollaborators(access.role, access.request.status)) {
      return { error: "Only the student who started this request can invite collaborators, and only while it is open." };
    }

    const rate = await checkDurableRateLimit("group-invite", user.id, INVITES_PER_DAY, DAY_MS);
    if (!rate.allowed) {
      return { error: "You've sent a lot of invitations today. Try again tomorrow." };
    }

    return await runAs(user.id, async () => {
      const members = (await sql`
        SELECT student_id, status FROM request_members WHERE request_id = ${requestId};
      `) as Array<{ student_id: string; status: MemberStatus }>;
      const statusOf = new Map(members.map((member) => [member.student_id, member.status]));
      const onThread = (status: MemberStatus | undefined) => status === "invited" || status === "joined";

      const fresh = ids.filter((id) => !onThread(statusOf.get(id)));
      if (fresh.length === 0) return { error: "Those students are already on this thread." };

      const slots = remainingCollaboratorSlots(members.filter((member) => onThread(member.status)).length);
      if (fresh.length > slots) {
        return {
          error: slots === 0
            ? `This group is full. A request can include up to ${MAX_COLLABORATORS} collaborators.`
            : `Only ${slots} more collaborator${slots === 1 ? "" : "s"} can join this group.`,
        };
      }

      const friendRows = await sql`
        SELECT 1
        FROM friendships
        WHERE status = 'accepted'
          AND ((requester_id = ${user.id} AND addressee_id = ANY(${fresh}::text[]))
            OR (addressee_id = ${user.id} AND requester_id = ANY(${fresh}::text[])));
      `;
      if (friendRows.length !== fresh.length) {
        return { error: "Collaborators must be on your friends list." };
      }

      const reinvited = fresh.filter((id) => statusOf.has(id));
      const brandNew = fresh.filter((id) => !statusOf.has(id));

      if (brandNew.length > 0) {
        await sql`
          INSERT INTO request_members (request_id, student_id)
          SELECT ${requestId}::uuid, unnest(${brandNew}::text[]);
        `;
      }
      if (reinvited.length > 0) {
        await sql`
          UPDATE request_members
          SET status = 'invited', invited_at = now(), responded_at = NULL
          WHERE request_id = ${requestId}
            AND student_id = ANY(${reinvited}::text[])
            AND status = ANY(${asSqlArray(MEMBER_ENDED)});
        `;
      }

      const [professor] = await sql`
        SELECT first_name, last_name, preferred_name FROM profiles
        WHERE id = ${access.request.professor_id} LIMIT 1;
      `;
      for (const studentId of fresh) {
        await createNotification({
          actorId: user.id,
          userId: studentId,
          type: "group_invite",
          title: `${fullName(profile)} invited you to collaborate`,
          body: `${access.request.topic ?? "A mentorship request"} — with ${facultyName(professor)}`,
          link: "/threads",
        });
      }

      await captureServerEvent(user.id, "group_invite_sent", { request_id: requestId, invite_count: fresh.length });
      revalidateThread(requestId);
      return { success: true, invited: fresh.length };
    });
  } catch (err) {
    return { error: internalError("inviteCollaborators", err, "Failed to send invitations.") };
  }
}

/** Removes a student from a group thread, or withdraws their invitation. For the lead and the professor. */
export async function removeCollaborator(requestId: string, studentId: string) {
  if (!isValidId(requestId) || !isValidId(studentId)) return { error: "Invalid request." };

  try {
    const auth = await requireUser();
    if (!auth.ok) return { error: auth.error };
    const { user } = auth;

    const access = await requireParticipant(requestId, user.id);
    if (!access.ok) return { error: access.error };

    return await runAs(user.id, async () => {
      const [member] = (await sql`
        SELECT status FROM request_members
        WHERE request_id = ${requestId} AND student_id = ${studentId}
        LIMIT 1;
      `) as Array<{ status: MemberStatus }>;

      if (!member || !canRemoveMember(access.role, member.status)) {
        return { error: "You can't remove that student from this thread." };
      }

      const removed = await sql`
        UPDATE request_members
        SET status = 'removed', responded_at = now()
        WHERE request_id = ${requestId}
          AND student_id = ${studentId}
          AND status IN ('invited', 'joined')
        RETURNING student_id;
      `;
      if (!removed[0]) return { error: "That student is no longer on this thread." };

      // Someone who had joined loses a conversation they were part of and should
      // know why. A withdrawn invitation simply disappears from their list.
      if (member.status === "joined") {
        await createNotification({
          actorId: user.id,
          userId: studentId,
          type: "group_member_removed",
          title: "You were removed from a group thread",
          body: access.request.topic ?? undefined,
          link: "/threads",
        });
      }

      await captureServerEvent(user.id, "group_member_removed", { request_id: requestId, was_joined: member.status === "joined" });
      revalidateThread(requestId);
      return { success: true };
    });
  } catch (err) {
    return { error: internalError("removeCollaborator", err, "Failed to remove collaborator.") };
  }
}

/** A collaborator leaves a group thread. The lead closes the thread instead. */
export async function leaveThread(requestId: string) {
  if (!isValidId(requestId)) return { error: "Invalid request ID." };

  try {
    const auth = await requireStudentActor();
    if (!auth.ok) return { error: auth.error };
    const { user, profile } = auth;

    const access = await requireParticipant(requestId, user.id);
    if (!access.ok) return { error: access.error };
    if (!canLeaveThread(access.role)) {
      return { error: "Only collaborators can leave a thread. The student who started it can close it instead." };
    }

    return await runAs(user.id, async () => {
      const left = await sql`
        UPDATE request_members
        SET status = 'left', responded_at = now()
        WHERE request_id = ${requestId} AND student_id = ${user.id} AND status = 'joined'
        RETURNING student_id;
      `;
      if (!left[0]) return { error: "You're no longer on this thread." };

      await createNotification({
        actorId: user.id,
        userId: access.request.student_id,
        type: "group_member_left",
        title: `${fullName(profile)} left your group`,
        body: access.request.topic ?? undefined,
        requestId,
      });

      await captureServerEvent(user.id, "group_member_left", { request_id: requestId });
      revalidateThread(requestId);
      return { success: true };
    });
  } catch (err) {
    return { error: internalError("leaveThread", err, "Failed to leave the thread.") };
  }
}
