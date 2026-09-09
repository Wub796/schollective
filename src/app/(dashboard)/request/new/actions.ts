"use server";

import { sql } from "@/lib/neon/db";
import { runAs } from "@/lib/neon/user-context";
import { getCurrentUserAndProfile } from "@/lib/neon/profiles";
import { revalidatePath } from "next/cache";
import { sanitiseText, isValidUuid, LIMITS } from "@/lib/security";
import { isSuspended } from "@/lib/authz";
import { captureServerEvent } from "@/lib/posthog-server";
import { createNotification } from "@/lib/notifications";
import { checkGenericOutreach } from "@/lib/mentorship-quality";

export async function submitMentorshipRequest(formData: FormData) {
  const { session, user, profile } = await getCurrentUserAndProfile();
  if (!session || !user) return { error: "Unauthorized" };
  if (isSuspended(profile)) return { error: "Your account is suspended." };

  const profId = sanitiseText(formData.get("prof_id"), 100);
  const topic = sanitiseText(formData.get("topic"), LIMITS.topic);
  const background = sanitiseText(formData.get("background"), LIMITS.background);
  const goals = sanitiseText(formData.get("goals"), LIMITS.goal);

  if (!profId || !isValidUuid(profId)) {
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
  // approved professor before creating a thread against it.
  const professors = await sql`
    SELECT id FROM profiles
    WHERE id = ${profId} AND role = 'professor' AND status = 'approved'
    LIMIT 1;
  `;
  if (!professors[0]) {
    return { error: "That professor is not accepting requests." };
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

  // Let the professor know a request is waiting in their queue.
  await createNotification({
    actorId: user.id,
    userId: profId,
    type: "new_request",
    title: "New mentorship request",
    body: topic,
    requestId,
  });

  await captureServerEvent(user.id, "mentorship_request_submitted", { professor_id: profId, request_id: requestId });
  revalidatePath("/dashboard");
  revalidatePath("/threads");


  return { success: true };
  });
}
