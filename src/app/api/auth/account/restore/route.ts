import { NextResponse, type NextRequest } from "next/server";
import { sql } from "@/lib/neon/db";
import { runAs } from "@/lib/neon/user-context";
import { getCurrentUserAndProfile } from "@/lib/neon/profiles";
import { internalError } from "@/lib/utils";
import {
  DEACTIVATED_STATUS,
  isDeactivated,
  profileStatusOnRestore,
} from "@/lib/account-deletion";

export const dynamic = "force-dynamic";

const PRIVATE_HEADERS = { "Cache-Control": "no-store" };

/**
 * Brings a disabled account back.
 *
 * Requires a session, which is the point of the flow: a disabled account can
 * still sign in (the auth row is untouched), and signing in is the proof of
 * ownership the restore email leans on — no separate token to leak or expire.
 * `/deactivated` is where that lands, and the dashboard layout sends any
 * disabled account there.
 *
 * The status it restores is the one the account held when it was disabled, read
 * from `status_before_deactivation`. That column is written by the database
 * (see the disable route) and guarded by the trigger in db/migrations/0010, so
 * a user cannot record a status they never held and restore into it.
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
  if (!isDeactivated(profile)) {
    return NextResponse.json(
      { error: "This account is not disabled." },
      { status: 409, headers: PRIVATE_HEADERS },
    );
  }

  const targetStatus = profileStatusOnRestore(profile);

  try {
    const restored = await runAs(user.id, async () => {
      const rows = await sql`
        UPDATE profiles
        SET status = ${targetStatus},
            status_before_deactivation = NULL,
            deactivated_at = NULL,
            updated_at = now()
        WHERE id = ${user.id} AND status = ${DEACTIVATED_STATUS}
        RETURNING status;
      `;
      return rows[0]?.status as string | undefined;
    });

    if (!restored) {
      return NextResponse.json(
        { error: "This account is no longer disabled." },
        { status: 409, headers: PRIVATE_HEADERS },
      );
    }

    return NextResponse.json({ success: true, status: restored }, { headers: PRIVATE_HEADERS });
  } catch (err) {
    return NextResponse.json(
      { error: internalError("account/restore", err, "Could not restore the account.") },
      { status: 500, headers: PRIVATE_HEADERS },
    );
  }
}
