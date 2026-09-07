import { sql } from "@/lib/neon/db";
import { runAs } from "@/lib/neon/user-context";
import type { ProfileRecord } from "@/lib/neon/profiles";

/**
 * Account-level and thread-level authorisation checks.
 *
 * These live apart from `getCurrentUserAndProfile` because authentication only
 * answers "who is this?" — every route that reads or writes someone else's data
 * still has to ask "may they?".
 */

/** A suspended account keeps its session but loses access to the product. */
export function isSuspended(profile: Pick<ProfileRecord, "status"> | null | undefined): boolean {
  return profile?.status === "suspended";
}

export interface ThreadRequest {
  id: string;
  status: string;
  topic: string | null;
  student_id: string;
  professor_id: string;
}

export interface ThreadAccess {
  /** The request row, or null when no such thread exists. */
  request: ThreadRequest | null;
  /** True only when the viewer is the student or the professor on the thread. */
  isParticipant: boolean;
}

/**
 * Loads a mentorship thread together with whether this user is party to it.
 *
 * Message threads are private between one student and one professor, so every
 * entry point — page, API route and server action — must gate on
 * `isParticipant` rather than on being signed in.
 */
export async function getThreadAccess(requestId: string, userId: string): Promise<ThreadAccess> {
  return runAs(userId, async () => {
    const rows = await sql`
      SELECT id, status, topic, student_id, professor_id
      FROM requests
      WHERE id = ${requestId}
      LIMIT 1;
    `;

    const request = (rows[0] as ThreadAccess["request"]) ?? null;
    if (!request) return { request: null, isParticipant: false };

    return {
      request,
      isParticipant: request.student_id === userId || request.professor_id === userId,
    };
  });
}
