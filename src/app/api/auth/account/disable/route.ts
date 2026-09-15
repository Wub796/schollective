import { NextResponse, type NextRequest } from "next/server";
import { sql } from "@/lib/neon/db";
import { runAs } from "@/lib/neon/user-context";
import { getCurrentUserAndProfile } from "@/lib/neon/profiles";
import { isSuspended } from "@/lib/authz";
import { checkRateLimit } from "@/lib/security";
import { OPEN_TO_MEMBERS, asSqlArray } from "@/lib/status";
import {
  DEACTIVATED_STATUS,
  DEACTIVATION_GRACE_DAYS,
  DISABLE_CONFIRMATION_PHRASE,
  RESTORE_PATH,
  confirmationMatches,
  purgeAfter,
} from "@/lib/account-deletion";
import { accountDisabledEmail, sendEmail } from "@/lib/email";
import { internalError } from "@/lib/utils";

export const dynamic = "force-dynamic";

const PRIVATE_HEADERS = { "Cache-Control": "private, no-store" };

/**
 * Disables the caller's own account inside a grace window.
 *
 * What "disable" means, precisely, because the email quotes all of it:
 *   * the profile stops being visible — a professor drops out of the public
 *     directory (`status = 'approved'` is what makes a faculty page exist), a
 *     student drops out of discovery (`app_is_discoverable_student`);
 *   * every session is revoked, so nobody is left signed in on a device;
 *   * threads that could still receive messages are closed. A thread is only
 *     messageable while it is `active`, and an account that cannot sign in can
 *     never answer, so leaving one open is leaving the other participant
 *     talking to nobody;
 *   * friend requests this account sent but nobody answered are withdrawn —
 *     the addressee should not hold a pending request from a closed account.
 *
 * What it deliberately does NOT do is delete anything. Messages, threads and
 * the profile row all stay exactly as they are, which is what makes the restore
 * path real rather than a promise.
 */
export async function POST(request: NextRequest) {
  const { session, user, profile } = await getCurrentUserAndProfile(request.headers);
  if (!session || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: PRIVATE_HEADERS });
  }
  if (!profile) {
    return NextResponse.json(
      { error: "Your profile could not be loaded. Please try again." },
      { status: 409, headers: PRIVATE_HEADERS },
    );
  }
  // A suspended account has no product access to give up; disabling it would
  // hand its owner a way to sidestep moderation with a self-service switch.
  if (isSuspended(profile)) {
    return NextResponse.json(
      { error: "Your account is suspended. Contact support instead." },
      { status: 403, headers: PRIVATE_HEADERS },
    );
  }
  if (profile.status === DEACTIVATED_STATUS) {
    return NextResponse.json(
      { error: "This account is already disabled." },
      { status: 409, headers: PRIVATE_HEADERS },
    );
  }

  let body: Record<string, unknown> = {};
  try {
    body = ((await request.json()) ?? {}) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400, headers: PRIVATE_HEADERS });
  }

  if (!confirmationMatches(body.confirmation, DISABLE_CONFIRMATION_PHRASE)) {
    return NextResponse.json(
      { error: `Type ${DISABLE_CONFIRMATION_PHRASE} to confirm.` },
      { status: 400, headers: PRIVATE_HEADERS },
    );
  }

  // Three attempts an hour is plenty for a deliberate act, and stops a stuck
  // client from looping the disable path (which also closes threads).
  const rate = checkRateLimit(`account-disable:${user.id}`, 3, 60 * 60 * 1000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429, headers: { ...PRIVATE_HEADERS, "Retry-After": String(rate.retryAfterSeconds) } },
    );
  }

  try {
    const result = await runAs(user.id, async () => {
      // `status_before_deactivation = status` reads the OUTGOING row, which is
      // the whole point: it is what restore returns to. The trigger in
      // db/migrations/0010 refuses any other value, so this column can never
      // become a claim about a status the account never held.
      const updated = await sql`
        UPDATE profiles
        SET status = ${DEACTIVATED_STATUS},
            status_before_deactivation = status,
            deactivated_at = now(),
            updated_at = now()
        WHERE id = ${user.id}
          AND status <> ${DEACTIVATED_STATUS}
        RETURNING deactivated_at;
      `;
      if (!updated[0]) return null;

      // Revoke every session before anything else that can fail: an account that
      // is about to be hidden must not stay usable on a device we cannot see.
      await sql`DELETE FROM session WHERE "userId" = ${user.id};`;

      const closed = await sql`
        UPDATE requests
        SET status = 'closed', updated_at = now()
        WHERE (student_id = ${user.id} OR professor_id = ${user.id})
          AND status = ANY(${asSqlArray(OPEN_TO_MEMBERS)})
        RETURNING id;
      `;

      const withdrawn = await sql`
        DELETE FROM friendships
        WHERE requester_id = ${user.id} AND status = 'pending'
        RETURNING id;
      `;

      // Pending group invites (request_members, status 'invited') are NOT
      // withdrawn here: that table's DELETE policy is admin-only, and the
      // trigger that guards membership transitions owns the legal moves. The
      // invitations lapse with the grace window — the purge removes them.
      return {
        deactivatedAt: updated[0].deactivated_at as string,
        closedThreads: closed.length,
        withdrawnRequests: withdrawn.length,
      };
    });

    if (!result) {
      return NextResponse.json(
        { error: "This account is already disabled." },
        { status: 409, headers: PRIVATE_HEADERS },
      );
    }

    const deadline = purgeAfter(result.deactivatedAt);
    const purgeDateLabel = (deadline ?? new Date()).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    });

    // Sent last, and its failure does not undo the disable: the state is already
    // recorded, and the restore page is reachable by signing in regardless. The
    // response reports whether the mail went out so the UI can say so instead of
    // claiming an email that never left.
    const emailSent = await sendEmail({
      to: user.email,
      ...accountDisabledEmail({
        restoreUrl: new URL(RESTORE_PATH, appOrigin(request)).toString(),
        purgeDateLabel,
        graceDays: DEACTIVATION_GRACE_DAYS,
      }),
    });

    return NextResponse.json(
      {
        success: true,
        emailSent,
        purgeAfter: deadline?.toISOString() ?? null,
        graceDays: DEACTIVATION_GRACE_DAYS,
        closedThreads: result.closedThreads,
        withdrawnRequests: result.withdrawnRequests,
      },
      { headers: PRIVATE_HEADERS },
    );
  } catch (err) {
    return NextResponse.json(
      { error: internalError("account/disable", err, "Could not disable the account.") },
      { status: 500, headers: PRIVATE_HEADERS },
    );
  }
}

/**
 * Origin for links inside email. NEXT_PUBLIC_APP_URL first (it is the address
 * the product presents to users), then Better Auth's own baseURL, then the
 * request — never the Host header on its own, which a caller controls.
 */
function appOrigin(request: NextRequest): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL;
  if (configured) return configured.replace(/\/$/, "");
  return new URL(request.url).origin;
}
