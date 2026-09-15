"use server";

import { sql } from "@/lib/neon/db";
import { runAs } from "@/lib/neon/user-context";
import { revalidatePath } from "next/cache";
import { sanitiseText, isValidId, LIMITS } from "@/lib/security";
import { requireRole } from "@/lib/authz";
import { PROFESSOR_LIVE_STATUS, PARTICIPANT_ONGOING, asSqlArray } from "@/lib/status";
import { captureServerEvent } from "@/lib/posthog-server";
import { createNotification } from "@/lib/notifications";
import { checkGenericOutreach } from "@/lib/mentorship-quality";
import { MAX_COLLABORATORS, normaliseCollaboratorIds } from "@/lib/collaboration";
import { facultyName, fullName } from "@/lib/people";

export async function submitMentorshipRequest(formData: FormData) {
  // Students send requests. requireRole also rejects suspended accounts, which
  // the previous explicit isSuspended check did by hand.
  const auth = await requireRole("student");
  if (!auth.ok) return { error: auth.error };
  const { user, profile } = auth;

  const profId = sanitiseText(formData.get("prof_id"), 100);
  const topic = sanitiseText(formData.get("topic"), LIMITS.topic);
  const background = sanitiseText(formData.get("background"), LIMITS.background);
  const goals = sanitiseText(formData.get("goals"), LIMITS.goal);

  if (!profId || !isValidId(profId)) {
    return { error: "Invalid professor ID." };
  }
  if (!topic) {
    return { error: "Please provide a topic for your request." };
  }
  if (!background) {
    return { error: "Please describe your academic background." };
  }
  if (!goals) {
    return { error: "Please describe your mentorship goals." };
  }

  // The for-professors page promises the outreach editor rejects generic mass
  // messages — this is where that promise is enforced, before anything is
  // written.
  const quality = checkGenericOutreach(background, goals);
  if (!quality.allowed) {
    return { error: quality.reason };
  }

  // Optional co-students. The whole selection is validated before anything is
  // written, so a bad pick never leaves a request behind without its group.
  const { ids: collaboratorIds, overLimit } = normaliseCollaboratorIds(formData.getAll("collaborator_ids"), user.id);
  if (overLimit) {
    return { error: `You can add up to ${MAX_COLLABORATORS} collaborators to a request.` };
  }

  // All DB work runs under the student's database identity (RLS): creating a
  // request and its opening message are owner-scoped writes.
  return runAs(user.id, async () => {
  // 1.5. Rate Limiting Check: Max 5 requests per 24 hours
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const countResult = await sql`
    SELECT COUNT(*)::int as count
    FROM requests
    WHERE student_id = ${user.id} AND created_at > ${twentyFourHoursAgo};
  `;

  const count = countResult[0]?.count || 0;
  if (count >= 5) {
    return { error: "Request limit reached. You can send up to 5 requests per 24 hours.", limitReached: true };
  }

  // The professor id arrives from the client, so confirm it really is an
  // approved professor who is open to requests before creating a thread.
  //
  // `is_accepting_requests` used to be checked on every surface that DISPLAYS a
  // professor but on none that writes, so the toggle only hid them from the
  // directory — anyone holding a /request/new?prof=<id> URL, or a stale tab,
  // could still deliver a request. The error string already claimed otherwise.
  // `IS NOT FALSE` because the column is nullable and null means "default on".
  const professors = await sql`
    SELECT id, first_name, last_name, preferred_name FROM profiles
    WHERE id = ${profId}
      AND role = 'professor'
      AND status = ${PROFESSOR_LIVE_STATUS}
      AND is_accepting_requests IS NOT FALSE
    LIMIT 1;
  `;
  const professor = professors[0];
  if (!professor) {
    return { error: "That professor is not currently accepting new requests." };
  }

  // One open conversation per student and professor: re-sending while a
  // decision is pending creates a duplicate thread the professor has to trip
  // over twice. A group thread the student has joined counts too.
  const existing = await sql`
    SELECT r.id FROM requests r
    WHERE r.professor_id = ${profId}
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
  if (existing[0]) {
    return { error: "You already have an open request with this professor." };
  }

  if (collaboratorIds.length > 0) {
    const friendRows = await sql`
      SELECT CASE WHEN requester_id = ${user.id} THEN addressee_id ELSE requester_id END AS id
      FROM friendships
      WHERE status = 'accepted'
        AND ((requester_id = ${user.id} AND addressee_id = ANY(${collaboratorIds}::text[]))
          OR (addressee_id = ${user.id} AND requester_id = ANY(${collaboratorIds}::text[])));
    `;
    if (friendRows.length !== collaboratorIds.length) {
      return { error: "Collaborators must be on your friends list. Refresh the page and try again." };
    }
  }

  // 2. Insert request
  const requestInsert = await sql`
    INSERT INTO requests (student_id, professor_id, status, topic, expected_outcome)
    VALUES (${user.id}, ${profId}, 'pending', ${topic}, ${goals})
    RETURNING id;
  `;

  const requestId = requestInsert[0]?.id;
  if (!requestId) return { error: "Failed to create request." };

  // Concatenate message content
  const initialMessageContent = [
    `**Academic Background:**`,
    background,
    ``,
    `**Mentorship Goals:**`,
    goals,
  ].join("\n").trim();

  // Insert Initial Message
  await sql`
    INSERT INTO messages (request_id, sender_id, content)
    VALUES (${requestId}, ${user.id}, ${initialMessageContent});
  `;

  // Invite the group in one statement, so either every collaborator is invited
  // or none is. If a friendship ended in the moment since validation the request
  // still stands, and the student can invite from the thread.
  let invited: string[] = [];
  if (collaboratorIds.length > 0) {
    try {
      await sql`
        INSERT INTO request_members (request_id, student_id)
        SELECT ${requestId}::uuid, unnest(${collaboratorIds}::text[]);
      `;
      invited = collaboratorIds;
    } catch (err) {
      console.error("[submitMentorshipRequest] could not invite collaborators:", err instanceof Error ? err.message : err);
    }
  }

  // Let the professor know a request is waiting in their queue.
  await createNotification({
    actorId: user.id,
    userId: profId,
    type: "new_request",
    title: invited.length > 0 ? "New group mentorship request" : "New mentorship request",
    body: invited.length > 0 ? `${topic} · group of ${invited.length + 1} students` : topic,
    requestId,
  });

  for (const collaboratorId of invited) {
    await createNotification({
      actorId: user.id,
      userId: collaboratorId,
      type: "group_invite",
      title: `${fullName(profile)} invited you to collaborate`,
      body: `${topic} — with ${facultyName(professor)}`,
      link: "/threads",
    });
  }

  await captureServerEvent(user.id, "mentorship_request_submitted", {
    professor_id: profId,
    request_id: requestId,
    collaborator_count: invited.length,
  });
  revalidatePath("/dashboard");
  revalidatePath("/threads");

  return { success: true, invitesFailed: invited.length < collaboratorIds.length };
  });
}
