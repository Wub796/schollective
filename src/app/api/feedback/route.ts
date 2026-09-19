import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUserAndProfile } from "@/lib/neon/profiles";
import { runAs } from "@/lib/neon/user-context";
import { checkDurableRateLimit } from "@/lib/rate-limit";
import { isSuspended } from "@/lib/authz";
import {
  validateFeedbackReport,
  feedbackCategoryLabel,
  type FeedbackCategory,
} from "@/lib/feedback";
import { createFeedbackReport, listOwnFeedbackReports } from "@/lib/neon/feedback";
import { feedbackReportEmail, isEmailConfigured, sendEmail } from "@/lib/email";
import { internalError } from "@/lib/utils";

export const dynamic = "force-dynamic";

/** Feedback is per-user data; never let a proxy cache it. */
const PRIVATE_HEADERS = { "Cache-Control": "private, no-store" };

/**
 * Ten reports an hour is far more than a person with ten problems, and far less
 * than a script. The window is the durable one (Postgres-backed,
 * src/lib/rate-limit.ts) because the per-isolate limiter is close to no limit at
 * all on Cloudflare.
 */
const REPORTS_PER_HOUR = 10;
const HOUR_MS = 60 * 60 * 1000;

/** The author's own recent reports — the receipt the settings page renders. */
export async function GET(request: NextRequest) {
  const { session, user } = await getCurrentUserAndProfile(request.headers);
  if (!session || !user) {
    return NextResponse.json(
      { reports: [], error: "Please sign in again to see your reports." },
      { status: 401, headers: PRIVATE_HEADERS },
    );
  }

  try {
    const reports = await runAs(user.id, async () => listOwnFeedbackReports(user.id, 5));
    return NextResponse.json({ reports }, { headers: PRIVATE_HEADERS });
  } catch (err: unknown) {
    // A missing table (migration 0013 not applied) lands here. Say so in the
    // log rather than in the response: the reader of the response is a person
    // trying to send feedback, and the fix is an operator's.
    console.error("[feedback] Could not read reports:", err);
    return NextResponse.json(
      { reports: [], error: "We could not load your reports." },
      { status: 503, headers: PRIVATE_HEADERS },
    );
  }
}

export async function POST(request: NextRequest) {
  const { session, user, profile } = await getCurrentUserAndProfile(request.headers);
  if (!session || !user) {
    return NextResponse.json(
      { error: "Please sign in again — your session has expired." },
      { status: 401, headers: PRIVATE_HEADERS },
    );
  }
  if (!profile) {
    return NextResponse.json(
      { error: "Your profile could not be loaded. Please try again." },
      { status: 409, headers: PRIVATE_HEADERS },
    );
  }
  if (isSuspended(profile)) {
    return NextResponse.json(
      { error: "Your account is suspended, so feedback cannot be sent from it." },
      { status: 403, headers: PRIVATE_HEADERS },
    );
  }

  const body = await request.json().catch(() => null);
  const validated = validateFeedbackReport(body);
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400, headers: PRIVATE_HEADERS });
  }

  try {
    const rate = await runAs(user.id, async () =>
      checkDurableRateLimit("feedback", user.id, REPORTS_PER_HOUR, HOUR_MS),
    );
    if (!rate.allowed) {
      const minutes = Math.max(1, Math.ceil(rate.retryAfterSeconds / 60));
      return NextResponse.json(
        {
          error:
            `That is a lot of reports in one hour — we cap it at ${REPORTS_PER_HOUR}. ` +
            `Try again in about ${minutes} minute${minutes === 1 ? "" : "s"}.`,
        },
        { status: 429, headers: PRIVATE_HEADERS },
      );
    }

    const stored = await runAs(user.id, async () =>
      createFeedbackReport({
        userId: user.id,
        role: profile.role ?? null,
        category: validated.value.category,
        subject: validated.value.subject,
        message: validated.value.message,
        page: validated.value.page,
        userAgent: request.headers.get("user-agent")?.slice(0, 300) ?? "",
      }),
    );

    // Best effort, after the row exists: the report is already durable, so a
    // mail failure changes what the team is told, not what the user sent. The
    // response reports which happened so the UI never claims a notification
    // that did not go out.
    const emailed = await notifyTeam(validated.value.category, profile, validated.value.message, validated.value.page);

    return NextResponse.json(
      { report: stored, emailed },
      { status: 201, headers: PRIVATE_HEADERS },
    );
  } catch (err: unknown) {
    return NextResponse.json(
      { error: internalError("submitFeedback", err, "We could not save that. Please try again.") },
      { status: 500, headers: PRIVATE_HEADERS },
    );
  }
}

/**
 * Sends the heads-up email, if this deployment has both a key and somewhere to
 * send it. `FEEDBACK_EMAIL_TO` is unset by default: without it the admin queue
 * is the only reader, which is a supported configuration rather than a failure,
 * so nothing is logged as one.
 */
async function notifyTeam(
  category: FeedbackCategory,
  profile: { first_name?: string | null; last_name?: string | null; email?: string | null; role?: string | null },
  message: string,
  pagePath: string,
): Promise<boolean> {
  const to = process.env.FEEDBACK_EMAIL_TO;
  if (!to || !isEmailConfigured()) return false;

  const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim();
  const reporterLabel =
    [name || profile.email || "A signed-in account", profile.role ? `(${profile.role})` : ""]
      .filter(Boolean)
      .join(" ");

  const origin = process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "";

  try {
    return await sendEmail({
      to,
      ...feedbackReportEmail({
        categoryLabel: feedbackCategoryLabel(category),
        reporterLabel,
        message,
        pagePath: pagePath || null,
        adminUrl: origin ? `${origin.replace(/\/$/, "")}/admin/feedback` : "/admin/feedback",
      }),
    });
  } catch (err: unknown) {
    console.error("[feedback] Could not notify the team:", err);
    return false;
  }
}
