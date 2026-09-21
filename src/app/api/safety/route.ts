import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUserAndProfile } from "@/lib/neon/profiles";
import { runAs } from "@/lib/neon/user-context";
import { checkDurableRateLimit } from "@/lib/rate-limit";
import { isSuspended, requireParticipant } from "@/lib/authz";
import { isValidId } from "@/lib/security";
import {
  isUrgentConcern,
  safetyConcernLabel,
  validateSafetyReport,
} from "@/lib/youth-protection";
import {
  copyThreadIntoReportAsEvidence,
  createSafetyReport,
  listOwnSafetyReports,
  threadMinority,
} from "@/lib/neon/youth-protection";
import { isEmailConfigured, safetyReportEmail, sendEmail } from "@/lib/email";
import { internalError } from "@/lib/utils";

export const dynamic = "force-dynamic";

/** A safety report is per-user data; never let a proxy cache it. */
const PRIVATE_HEADERS = { "Cache-Control": "private, no-store" };

/**
 * Generous on purpose. Twenty an hour is far more than one person has concerns,
 * and low enough that a script cannot fill the queue — but a student who is
 * frightened and sends three near-identical reports must not be told to slow
 * down, so the ceiling is well above any plausible human burst.
 */
const REPORTS_PER_HOUR = 20;
const HOUR_MS = 60 * 60 * 1000;

/** The reporter's own reports — the receipt the settings page renders. */
export async function GET(request: NextRequest) {
  const { session, user } = await getCurrentUserAndProfile(request.headers);
  if (!session || !user) {
    return NextResponse.json(
      { reports: [], error: "Please sign in again to see your reports." },
      { status: 401, headers: PRIVATE_HEADERS },
    );
  }

  try {
    const reports = await runAs(user.id, async () => listOwnSafetyReports(user.id, 5));
    return NextResponse.json({ reports }, { headers: PRIVATE_HEADERS });
  } catch (err: unknown) {
    // A missing table (migration 0014 not applied) lands here. Say so in the log
    // rather than in the response: the reader of the response is a person trying
    // to report something, and the fix is an operator's.
    console.error("[safety] Could not read reports:", err);
    return NextResponse.json(
      { reports: [], error: "We could not load your reports." },
      { status: 503, headers: PRIVATE_HEADERS },
    );
  }
}

/**
 * Files a safety report, and copies the thread's messages into it.
 *
 * THE ORDER HERE IS THE DESIGN
 *   1. Establish who is calling, and that they may see the thread they are
 *      reporting on (`requireParticipant`). A report made from a thread has to
 *      come from someone on it, or the endpoint would be a way to read a
 *      stranger's conversation by reporting it.
 *   2. Record whether a minor was on that thread, at that moment, onto the
 *      report. Reconstructing it later means asking whether accounts that may
 *      since have been deleted were children at the time.
 *   3. Write the report row, then copy the messages. The row comes first so that
 *      a failure in the copy leaves a report an admin can still act on, quoting
 *      the reporter's own words, rather than an error the reporter has to
 *      interpret.
 *   4. Notify the team by email, last and best-effort. The queue is the record;
 *      the email is a heads-up that may fail without losing anything, and the
 *      response says which happened rather than claiming one.
 */
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
      { error: "Your account is suspended. Report this to safety@schollective.com instead." },
      { status: 403, headers: PRIVATE_HEADERS },
    );
  }

  const body = await request.json().catch(() => null);
  const validated = validateSafetyReport(body);
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400, headers: PRIVATE_HEADERS });
  }

  const { category, message, requestId, reportedProfileId } = validated.value;

  // A thread id that is not a thread is a client bug, not a report about
  // nothing: refusing it here keeps a junk uuid out of the queue's join.
  if (requestId && !isValidId(requestId)) {
    return NextResponse.json({ error: "That conversation could not be found." }, { status: 400, headers: PRIVATE_HEADERS });
  }

  try {
    const rate = await runAs(user.id, async () =>
      checkDurableRateLimit("safety", user.id, REPORTS_PER_HOUR, HOUR_MS),
    );
    if (!rate.allowed) {
      const minutes = Math.max(1, Math.ceil(rate.retryAfterSeconds / 60));
      return NextResponse.json(
        {
          error:
            `You have sent ${REPORTS_PER_HOUR} reports in the last hour. If this is urgent, ` +
            `email safety@schollective.com now. Otherwise try again in about ${minutes} minute${minutes === 1 ? "" : "s"}.`,
        },
        { status: 429, headers: PRIVATE_HEADERS },
      );
    }

    // The thread, if there is one, and the authority to report on it.
    let thread: { id: string; otherId: string; involvesMinor: boolean } | null = null;

    if (requestId) {
      const access = await requireParticipant(requestId, user.id);
      if (!access.ok) {
        return NextResponse.json(
          { error: "That conversation could not be found." },
          { status: 404, headers: PRIVATE_HEADERS },
        );
      }

      const isProfessor = access.role === "professor";
      const otherId = isProfessor ? access.request.student_id : access.request.professor_id;

      const involvesMinor = await runAs(user.id, async () =>
        threadMinority(requestId, access.request.student_id),
      );

      thread = { id: requestId, otherId, involvesMinor };
    }

    // When the report is made from a thread and the reporter did not name anyone,
    // the other party is who they mean. Defaulting is the right call here: the
    // alternative is a queue full of reports about "someone" from a UI whose only
    // other participant is on screen.
    const subject = reportedProfileId && isValidId(reportedProfileId)
      ? reportedProfileId
      : thread?.otherId ?? null;

    const reportId = await runAs(user.id, async () =>
      createSafetyReport({
        reporterId: user.id,
        reporterRole: profile.role ?? null,
        reportedProfileId: subject,
        requestId: thread?.id ?? null,
        category,
        message,
        minorInvolved: thread?.involvesMinor ?? false,
      }),
    );

    let evidenceCopied = 0;
    if (thread) {
      try {
        evidenceCopied = await runAs(user.id, async () =>
          copyThreadIntoReportAsEvidence(reportId, thread.id),
        );
      } catch (err: unknown) {
        // The report exists and is actionable; the copy is extra. Log it loudly
        // because an admin reading a report with no evidence should know whether
        // the thread was empty or the copy failed.
        console.error(`[safety] Evidence copy failed for report ${reportId}:`, err);
      }
    }

    const emailed = await notifyTeam({
      category,
      reporter: profile,
      message,
      involvesMinor: thread?.involvesMinor ?? false,
      evidenceCopied,
    });

    return NextResponse.json(
      { id: reportId, evidenceCopied, emailed, urgent: isUrgentConcern(category) },
      { status: 201, headers: PRIVATE_HEADERS },
    );
  } catch (err: unknown) {
    return NextResponse.json(
      { error: internalError("submitSafetyReport", err, "We could not save that. Please try again.") },
      { status: 500, headers: PRIVATE_HEADERS },
    );
  }
}

/**
 * Sends the heads-up email, if this deployment has both a key and somewhere to
 * send it.
 *
 * `SAFETY_EMAIL_TO` is deliberately separate from `FEEDBACK_EMAIL_TO`: a safety
 * report and a suggestion about the profile form do not belong in the same inbox,
 * and a deployment that has turned feedback notifications off has not thereby
 * decided to stop hearing about a child. Without the variable the admin queue is
 * the only reader, which is a supported configuration and not a failure, so
 * nothing is logged as one.
 */
async function notifyTeam({
  category,
  reporter,
  message,
  involvesMinor,
  evidenceCopied,
}: {
  category: string;
  reporter: { first_name?: string | null; last_name?: string | null; email?: string | null; role?: string | null };
  message: string;
  involvesMinor: boolean;
  evidenceCopied: number;
}): Promise<boolean> {
  const to = process.env.SAFETY_EMAIL_TO;
  if (!to || !isEmailConfigured()) return false;

  const name = [reporter.first_name, reporter.last_name].filter(Boolean).join(" ").trim();
  const reporterLabel =
    [name || reporter.email || "A signed-in account", reporter.role ? `(${reporter.role})` : ""]
      .filter(Boolean)
      .join(" ");

  const origin = process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "";

  try {
    return await sendEmail({
      to,
      ...safetyReportEmail({
        categoryLabel: safetyConcernLabel(category),
        reporterLabel,
        message,
        involvesMinor,
        evidenceCopied,
        adminUrl: origin ? `${origin.replace(/\/$/, "")}/admin/safety` : "/admin/safety",
      }),
    });
  } catch (err: unknown) {
    console.error("[safety] Could not notify the team:", err);
    return false;
  }
}
