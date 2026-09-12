import { cookies } from "next/headers";
import { sql } from "@/lib/neon/db";
import { runAs } from "@/lib/neon/user-context";
import { getCurrentUserAndProfile, type ProfileRecord } from "@/lib/neon/profiles";
import {
  PARTICIPANT_VISIBLE,
  asSqlArray,
  isUserRole,
  type RequestStatus,
  type UserRole,
} from "@/lib/status";

/**
 * Account-level and thread-level authorisation.
 *
 * These live apart from `getCurrentUserAndProfile` because authentication only
 * answers "who is this?" — every route that reads or writes someone else's data
 * still has to ask "may they?".
 *
 * WHY THE `require*` HELPERS EXIST
 * A server action is a publicly invokable HTTP endpoint: its id is a
 * deterministic build-time hash embedded in a static JS chunk, which anyone can
 * fetch whether or not they can load the page that uses it. So a page-level
 * `redirect()` guard protects the page and nothing else. Before these helpers,
 * `updateProfProfile` relied on exactly that and wrote `role: "professor"`
 * unconditionally, letting any signed-in caller promote themselves out of the
 * admin review queue. Every action and route now starts with one of these
 * calls, so the check is a single reviewable line rather than a convention.
 */

/** A suspended account keeps its session but loses access to the product. */
export function isSuspended(profile: Pick<ProfileRecord, "status"> | null | undefined): boolean {
  return profile?.status === "suspended";
}

export const ADMIN_VIEW_AS_COOKIE = "x-admin-view-as";

export interface AuthContext {
  session: any;
  user: { id: string; email: string; [key: string]: any };
  profile: ProfileRecord;
  /**
   * The role an admin has switched into via `x-admin-view-as`, or null. Pages
   * that want a faithful preview compare this against the role they serve;
   * write paths refuse when it is set.
   */
  adminPreviewRole: UserRole | null;
  /** True when an admin is deliberately previewing the product as another role. */
  isAdminPreview: boolean;
}

export type Authorized = { ok: true } & AuthContext;
export type Denied = { ok: false; error: string; status: 401 | 403 };
export type AuthzResult = Authorized | Denied;

const UNAUTHENTICATED: Denied = { ok: false, error: "Unauthorized", status: 401 };
const SUSPENDED: Denied = { ok: false, error: "Your account is suspended.", status: 403 };
/**
 * Deliberately identical for "wrong role" and "no profile": a caller probing an
 * endpoint learns only that they may not use it, not why.
 */
const FORBIDDEN: Denied = { ok: false, error: "You do not have access to this action.", status: 403 };

export interface RequireOptions {
  /** Skip the suspension check (only the suspended-account page itself needs this). */
  allowSuspended?: boolean;
}

async function readAdminPreviewRole(): Promise<UserRole | null> {
  try {
    const store = await cookies();
    const value = store.get(ADMIN_VIEW_AS_COOKIE)?.value;
    return isUserRole(value) ? value : null;
  } catch {
    // cookies() is unavailable in some runtimes/contexts; absence of a preview
    // cookie is the safe default.
    return null;
  }
}

/**
 * Establishes that a real, non-suspended account is calling.
 *
 * Returns a discriminated result rather than throwing so server actions can
 * hand `error` straight back to the client, which is the shape every form in
 * this codebase already renders.
 */
export async function requireUser(options: RequireOptions = {}): Promise<AuthzResult> {
  const { session, user, profile } = await getCurrentUserAndProfile();
  if (!session || !user || !profile) return UNAUTHENTICATED;
  if (!options.allowSuspended && isSuspended(profile)) return SUSPENDED;

  // Only an admin can be previewing: the cookie is set exclusively by
  // setAdminViewAs, which is itself admin-gated, but reading it only for admins
  // means a forged cookie on any other account is inert.
  const adminPreviewRole = profile.role === "admin" ? await readAdminPreviewRole() : null;

  return {
    ok: true,
    session,
    user,
    profile,
    adminPreviewRole,
    isAdminPreview: adminPreviewRole !== null,
  };
}

/**
 * Establishes that the caller holds one of `roles`.
 *
 * An admin always passes, because every admin surface is a superset of the
 * others; `allowAdminPreview` additionally lets an admin previewing as a
 * student or professor through a check for that role.
 */
export async function requireRole(
  roles: UserRole | readonly UserRole[],
  options: RequireOptions = {},
): Promise<AuthzResult> {
  const result = await requireUser(options);
  if (!result.ok) return result;

  const allowed = (Array.isArray(roles) ? roles : [roles]) as readonly UserRole[];
  if (allowed.includes(result.profile.role as UserRole)) return result;

  // An admin may reach any surface; callers that must not be written to by a
  // previewing admin branch on `isAdminPreview` rather than on the role.
  if (result.profile.role === "admin") return result;

  return FORBIDDEN;
}

/** Convenience wrapper: the caller must be an admin, with no preview escape. */
export async function requireAdmin(): Promise<AuthzResult> {
  const result = await requireUser();
  if (!result.ok) return result;
  if (result.profile.role !== "admin") return FORBIDDEN;
  return result;
}

export interface ThreadRequest {
  id: string;
  status: RequestStatus;
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

export type ParticipantResult =
  | { ok: true; request: ThreadRequest }
  | { ok: false; error: string; status: 404 };

/**
 * Establishes that `userId` is party to `requestId` and that the thread is not
 * one an admin has soft-deleted.
 *
 * A missing thread and a thread belonging to someone else return the same
 * answer, so the endpoint cannot be used to enumerate which ids exist.
 */
export async function requireParticipant(
  requestId: string,
  userId: string,
): Promise<ParticipantResult> {
  const { request, isParticipant } = await getThreadAccess(requestId, userId);
  const notFound = { ok: false as const, error: "Thread not found.", status: 404 as const };

  if (!request || !isParticipant) return notFound;
  if (!PARTICIPANT_VISIBLE.includes(request.status)) return notFound;

  return { ok: true, request };
}

/** The status list to bind into participant-facing queries. */
export function participantVisibleStatuses(): string[] {
  return asSqlArray(PARTICIPANT_VISIBLE);
}
