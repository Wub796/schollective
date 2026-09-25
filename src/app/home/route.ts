import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUserAndProfile } from "@/lib/neon/profiles";

export const dynamic = "force-dynamic";

/**
 * "Where is home for whoever is asking?"
 *
 * The error page and the 404 page each offer one way out, and the right
 * destination is not the same for everyone. A signed-in user sent to `/` lands
 * on the marketing page with their session still live and no way back into the
 * product — which is the state an error page exists to get them out of. An
 * anonymous visitor sent to `/dashboard` meets the login wall instead of the
 * page that explains what this is.
 *
 * Neither surface can answer the question for itself: the boundaries are client
 * components rendered in place of a page that just failed, and a 404 is served
 * for paths that were never going to read a session. So they link here, and this
 * decides once, server-side, in one place rather than in each of them.
 *
 * `/dashboard` is the signed-in destination because it is already role-aware: it
 * redirects a professor to `/prof/dashboard` and an admin to `/admin/dashboard`
 * itself, so nothing here needs to know the role, and a role added later works
 * without touching this file.
 *
 * A failed session read answers `/`. A broken database must not turn the way out
 * of an error page into a second error.
 */
export async function GET(request: NextRequest) {
  // Never cached: the answer depends on who is asking, and a shared cache
  // serving one answer to everyone would send half of them to the wrong place.
  const headers = { "Cache-Control": "private, no-store" };

  try {
    const { user } = await getCurrentUserAndProfile(request.headers);
    return NextResponse.redirect(new URL(user ? "/dashboard" : "/", request.url), { headers });
  } catch {
    return NextResponse.redirect(new URL("/", request.url), { headers });
  }
}
