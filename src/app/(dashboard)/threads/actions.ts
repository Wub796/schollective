"use server";

import { revalidatePath } from "next/cache";
import { sql } from "@/lib/neon/db";
import { runAs } from "@/lib/neon/user-context";
import { recordThreadRead } from "@/lib/neon/social";
import { requireStudentActor } from "@/lib/authz";
import { isCanonicalUuid } from "@/lib/security";
import { createNotification } from "@/lib/notifications";
import { captureServerEvent } from "@/lib/posthog-server";
import { internalError } from "@/lib/utils";
import { isOpenToMembers } from "@/lib/collaboration";
import { fullName } from "@/lib/people";
import { PARTICIPANT_ONGOING, asSqlArray, type RequestStatus } from "@/lib/status";

/**
 * Accepts or declines an invitation to collaborate on another student's
 * mentorship request.
 *
 * Declining is always possible — even after the request has closed, so a
 * student is never stuck with an invitation they cannot clear. Joining needs
 * the request to still be open, and follows the same one-open-conversation rule
 * as sending a request: a student already talking to this professor joins that
 * conversation rather than a second one.
 */
export async function respondToGroupInvite(requestId: string, decision: "accept" | "decline") {
  if (!isCanonicalUuid(requestId)) return { error: "Invalid invitation." };
  if (decision !== "accept" && decision !== "decline") return { error: "Invalid response." };

  const auth = await requireStudentActor();
  if (!auth.ok) return { error: auth.error };
  const { user, profile } = auth;

  try {
    return await runAs(user.id, async () => {
      const [invite] = (await sql`
        SELECT r.id, r.status, r.topic, r.student_id, r.professor_id, m.status AS member_status
        FROM request_members m
        JOIN requests r ON r.id = m.request_id
        WHERE m.request_id = ${requestId} AND m.student_id = ${user.id}
        LIMIT 1;
      `) as Array<{ id: string; status: RequestStatus; topic: string; student_id: string; professor_id: string; member_status: string }>;

      if (!invite || invite.member_status !== "invited") {
        return { error: "That invitation is no longer open." };
      }

      if (decision === "decline") {
        await sql`
          UPDATE request_members
          SET status = 'declined', responded_at = now()
          WHERE request_id = ${requestId} AND student_id = ${user.id} AND status = 'invited';
        `;
        revalidatePath("/threads");
        revalidatePath(`/messages/${requestId}`);
        return { success: true };
      }

      if (!isOpenToMembers(invite.status)) {
        return { error: "This request has closed, so it can no longer be joined." };
      }

      const [conflict] = await sql`
        SELECT r.id FROM requests r
        WHERE r.professor_id = ${invite.professor_id}
          AND r.id <> ${requestId}
          AND r.status = ANY(${asSqlArray(PARTICIPANT_ONGOING)})
          AND (
            r.student_id = ${user.id}
            OR EXISTS (
              SELECT 1 FROM request_members m
              WHERE m.request_id = r.id AND m.student_id = ${user.id} AND m.status = 'joined'
            )
          )
        LIMIT 1;
      `;
      if (conflict) {
        return { error: "You already have an open request with this professor. Close it before joining another." };
      }

      const joined = await sql`
        UPDATE request_members
        SET status = 'joined', responded_at = now()
        WHERE request_id = ${requestId} AND student_id = ${user.id} AND status = 'invited'
        RETURNING student_id;
      `;
      if (!joined[0]) return { error: "That invitation is no longer open." };

      // A new member starts caught up: the history is there to read, not to
      // arrive as a badge of every message sent before they joined.
      await recordThreadRead(requestId, user.id);

      await createNotification({
        actorId: user.id,
        userId: invite.student_id,
        type: "group_member_joined",
        title: `${fullName(profile)} joined your group`,
        body: invite.topic,
        requestId,
      });
      await captureServerEvent(user.id, "group_invite_accepted", { request_id: requestId });

      revalidatePath("/threads");
      revalidatePath(`/messages/${requestId}`);
      revalidatePath("/prof/dashboard");
      revalidatePath("/prof/students");
      return { success: true, requestId };
    });
  } catch (err) {
    return { error: internalError("respondToGroupInvite", err, "Failed to respond to the invitation.") };
  }
}
