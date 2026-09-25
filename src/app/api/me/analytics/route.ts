import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUserAndProfile } from "@/lib/neon/profiles";
import { runAs } from "@/lib/neon/user-context";
import { isMinorAccount } from "@/lib/neon/youth-protection";

export const dynamic = "force-dynamic";

/** The caller's own answer; never cached, by us or by a proxy. */
const PRIVATE_HEADERS = { "Cache-Control": "private, no-store" };

/**
 * Whether optional analytics may run for the caller.
 *
 * One boolean, and the only reason it exists is the age gate: product analytics
 * and session replay are consent-gated on the client (src/lib/consent.ts), and
 * this adds the second condition that a cookie banner cannot express — whether
 * the account behind the session is a minor, which only the server knows.
 *
 * The answer is about the CALLER, so there is nothing to authorise: it reports
 * `profiles.is_minor` for the session's own user id and can say nothing about
 * anybody else.
 *
 *   signed in, minor      suppress: true
 *   signed in, adult      suppress: false
 *   no session            suppress: false — an anonymous visitor has no account
 *                         and therefore no age to protect beyond the consent
 *                         they were already asked for.
 *   anything went wrong   suppress: true. Deliberately the opposite of the
 *                         no-session case: an error means we do not know who
 *                         this is, and "do not record" is the answer that is
 *                         wrong in the cheap direction.
 */
export async function GET(request: NextRequest) {
  const { session, user } = await getCurrentUserAndProfile(request.headers);

  if (!session || !user) {
    return NextResponse.json({ suppress: false, reason: "anonymous" }, { headers: PRIVATE_HEADERS });
  }

  try {
    const minor = await runAs(user.id, async () => isMinorAccount(user.id));
    return NextResponse.json(
      { suppress: minor, reason: minor ? "minor" : "adult" },
      { headers: PRIVATE_HEADERS },
    );
  } catch (err: unknown) {
    // A missing column (0014 not applied and the bootstrap not yet run) lands
    // here, as does a database outage. Either way the honest answer is "we could
    // not tell", and the client reads anything other than a clean false as a no.
    console.error("[analytics] Could not determine analytics eligibility:", err);
    return NextResponse.json({ suppress: true, reason: "unknown" }, { headers: PRIVATE_HEADERS });
  }
}
