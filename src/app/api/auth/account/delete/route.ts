import { NextResponse, type NextRequest } from "next/server";
import { sql } from "@/lib/neon/db";
import { runAs } from "@/lib/neon/user-context";
import { getCurrentUserAndProfile } from "@/lib/neon/profiles";
import { isSuspended } from "@/lib/authz";
import { checkRateLimit } from "@/lib/security";
import { DELETE_CONFIRMATION_PHRASE, confirmationMatches } from "@/lib/account-deletion";
import { internalError } from "@/lib/utils";

export const dynamic = "force-dynamic";

const PRIVATE_HEADERS = { "Cache-Control": "private, no-store" };

/**
 * Permanently deletes the caller's own account. No grace period, no backup kept.
 *
 * WHY THIS IS THE LOUD ONE
 * The foreign keys into `profiles` are ON DELETE CASCADE, so deleting the
 * profile row takes the whole graph with it: this user's requests, every
 * message in them, their notifications, friendships, blocks, group memberships
 * and read positions. One table does not follow it: `safety_reports` references
 * profiles with ON DELETE SET NULL (db/migrations/0014), so a safety report — and
 * the copy of the thread filed with it — outlives both accounts. That is
 * deliberate, and it is why deleting an account is not a way to erase a report.
 * For a mentorship thread that means the OTHER participant
 * also loses the conversation — the messages are one row set, not one per
 * reader. That is why the UI demands a typed phrase, why this route re-checks
 * that phrase server side (the button is not the control), and why it is kept
 * separate from the reversible disable path above rather than being a "make it
 * permanent now" shortcut on it.
 *
 * ORDER MATTERS, and it is chosen for the failure it leaves behind:
 *   1. sessions — access is gone even if everything below fails;
 *   2. AI review jobs — keyed by user id with no foreign key, so nothing else
 *      would ever remove rows that contain a copy of the profile;
 *   3. the profile row — cascades the app data, and is the one statement whose
 *      row count is checked (see BELOW);
 *   4. the auth row last — cascades its own sessions and OAuth links.
 * Failing between 3 and 4 leaves an account that can still sign in and gets a
 * fresh, empty profile (the schema bootstrap recreates it), which is
 * recoverable. The reverse order would leave data behind with no way in.
 *
 * WHY THE PROFILE DELETE IS CHECKED
 * `profiles` carries FORCE ROW LEVEL SECURITY, so the delete only matches a row
 * when `profiles_delete` allows it (db/migrations/0010). A DELETE that matches
 * nothing is not an error — it reports success — and then step 4 removes the
 * auth row and leaves a profile nobody can reach or delete. That is exactly the
 * failure 0010 was written to prevent, and it is silent in every other layer:
 * the API answers `{ success: true }` and the UI shows the account as gone. So
 * the row count is checked, and a database that refuses this statement is
 * reported as a failure instead of being mistaken for a deletion.
 */
export async function POST(request: NextRequest) {
  const { session, user, profile } = await getCurrentUserAndProfile(request.headers);
  if (!session || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: PRIVATE_HEADERS });
  }
  // A suspended account is a moderation record. Its owner gets one answer, from
  // support, rather than a self-service way to remove the evidence.
  if (isSuspended(profile)) {
    return NextResponse.json(
      { error: "Your account is suspended. Contact support instead." },
      { status: 403, headers: PRIVATE_HEADERS },
    );
  }

  let body: Record<string, unknown> = {};
  try {
    body = ((await request.json()) ?? {}) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400, headers: PRIVATE_HEADERS });
  }

  if (!confirmationMatches(body.confirmation, DELETE_CONFIRMATION_PHRASE)) {
    return NextResponse.json(
      { error: `Type ${DELETE_CONFIRMATION_PHRASE} to confirm.` },
      { status: 400, headers: PRIVATE_HEADERS },
    );
  }

  const rate = checkRateLimit(`account-delete:${user.id}`, 3, 60 * 60 * 1000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429, headers: { ...PRIVATE_HEADERS, "Retry-After": String(rate.retryAfterSeconds) } },
    );
  }

  try {
    const removed = await runAs(user.id, async () => {
      // An admin is the one account whose removal can lock the platform out of
      // its own moderation tools, and the deletion is irreversible, so the last
      // one standing is refused. The count runs as this user: an admin passes
      // `app_is_admin()` and sees every profile row.
      if (profile?.role === "admin") {
        const others = await sql`
          SELECT count(*)::int AS count FROM profiles
          WHERE role = 'admin' AND id <> ${user.id} AND status <> 'deactivated';
        `;
        if (!others[0]?.count) {
          return {
            refused:
              "This is the only administrator account. Promote another administrator before deleting this one.",
          };
        }
      }

      await sql`DELETE FROM session WHERE "userId" = ${user.id};`;
      await sql`DELETE FROM ai_profile_review_jobs WHERE user_id = ${user.id};`;

      const deletedProfile =
        await sql`DELETE FROM profiles WHERE id = ${user.id} RETURNING id;`;
      if (!deletedProfile.length) {
        return {
          refused: null as string | null,
          failed:
            "Your profile could not be deleted, so nothing was removed and your account still works. " +
            "This is a database configuration problem on our side, not something you did — please contact support.",
        };
      }

      await sql`DELETE FROM "user" WHERE id = ${user.id};`;

      return { refused: null as string | null, failed: null as string | null };
    });

    if (removed?.refused) {
      return NextResponse.json({ error: removed.refused }, { status: 409, headers: PRIVATE_HEADERS });
    }
    if (removed?.failed) {
      return NextResponse.json({ error: removed.failed }, { status: 500, headers: PRIVATE_HEADERS });
    }

    return NextResponse.json({ success: true }, { headers: PRIVATE_HEADERS });
  } catch (err) {
    return NextResponse.json(
      { error: internalError("account/delete", err, "Could not delete the account.") },
      { status: 500, headers: PRIVATE_HEADERS },
    );
  }
}
