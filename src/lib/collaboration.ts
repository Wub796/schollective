/**
 * Group mentorship threads: the rules every screen and action shares.
 *
 * Client-safe — no server imports — so the thread page, the members panel and
 * the server actions all read one definition, and the tests import it directly.
 * The database enforces the same membership transitions in
 * `guard_request_member_change` (db/migrations/0008). These exist so an action
 * refuses with a sentence rather than a Postgres error, and so a screen never
 * offers a button whose action would be refused.
 */

import { isValidId } from "./security";
import {
  MEMBER_ENDED,
  OPEN_TO_MEMBERS,
  TERMINAL_STATUSES,
  type MemberStatus,
  type RequestStatus,
} from "./status";

/** Students a lead may bring onto a request. With the lead, a group of five. */
export const MAX_COLLABORATORS = 4;

/** How the viewer takes part in a thread. */
export type ThreadRole = "lead" | "member" | "professor";

/** Who is changing a membership, relative to the student it belongs to. */
export type MembershipActor = "self" | "lead" | "professor";

/**
 * Whether `actor` may move a membership from `from` to `to`:
 *
 *   the member themself:   invited -> joined | declined,  joined -> left
 *   the lead or professor: invited | joined -> removed
 *   the lead:              declined | left | removed -> invited
 */
export function isAllowedMemberTransition(
  actor: MembershipActor,
  from: MemberStatus,
  to: MemberStatus,
): boolean {
  if (actor === "self") {
    return (from === "invited" && (to === "joined" || to === "declined")) || (from === "joined" && to === "left");
  }
  if (to === "removed") return from === "invited" || from === "joined";
  if (to === "invited") return actor === "lead" && MEMBER_ENDED.includes(from);
  return false;
}

/**
 * Moving into these needs the request to still be open. Moving out never does,
 * so a student can always decline an invite to a thread that has since closed.
 */
export function transitionNeedsOpenRequest(to: MemberStatus): boolean {
  return to === "invited" || to === "joined";
}

export function isOpenToMembers(status: RequestStatus): boolean {
  return OPEN_TO_MEMBERS.includes(status);
}

/** Only the lead adds collaborators, and only while the request is open. */
export function canInviteCollaborators(role: ThreadRole | null, status: RequestStatus): boolean {
  return role === "lead" && isOpenToMembers(status);
}

/** The lead and the professor may remove a student who is invited or has joined. */
export function canRemoveMember(role: ThreadRole | null, memberStatus: MemberStatus): boolean {
  return (role === "lead" || role === "professor") && (memberStatus === "invited" || memberStatus === "joined");
}

/**
 * The lead and the professor may close a thread. A member leaves instead:
 * closing would end the conversation for everyone else on it.
 */
export function canCloseThread(role: ThreadRole | null, status: RequestStatus): boolean {
  return (role === "lead" || role === "professor") && !TERMINAL_STATUSES.includes(status);
}

export function canLeaveThread(role: ThreadRole | null): boolean {
  return role === "member";
}

/** Invite slots still free, counting everyone who is invited or has joined. */
export function remainingCollaboratorSlots(activeMemberCount: number): number {
  return Math.max(0, MAX_COLLABORATORS - Math.max(0, activeMemberCount));
}

/**
 * Everyone who should hear about something that happened in a thread — the
 * lead, the professor and every joined member — except whoever caused it.
 */
export function threadAudience(
  thread: { student_id: string; professor_id: string },
  joinedMemberIds: readonly string[],
  actorId: string,
): string[] {
  return [...new Set([thread.student_id, thread.professor_id, ...joinedMemberIds])].filter(
    (id) => Boolean(id) && id !== actorId,
  );
}

/**
 * Reads collaborator ids submitted with a form: drops anything that is not an
 * id, the lead themself, and duplicates. An over-limit selection is reported
 * rather than silently truncated — which students got left off would be
 * arbitrary.
 */
export function normaliseCollaboratorIds(
  values: readonly unknown[],
  leadId: string,
): { ids: string[]; overLimit: boolean } {
  const ids = [...new Set(values.filter(isValidId))].filter((id) => id !== leadId);
  return { ids, overLimit: ids.length > MAX_COLLABORATORS };
}
