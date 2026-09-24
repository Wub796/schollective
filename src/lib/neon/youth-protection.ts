import { sql } from "@/lib/neon/db";
import { isValidId } from "@/lib/security";
import {
  isSafetyReportStatus,
  resolveMinorFlag,
  summaryOfSnapshot,
  SAFETY_REPORT_SNAPSHOT_LIMIT,
  URGENT_CONCERN_CATEGORIES,
  type SafetyConcernCategory,
  type SafetyReportStatus,
} from "@/lib/youth-protection";
import { facultyName, fullName } from "@/lib/people";

/**
 * Reads and writes for the youth protection records and the safety queue
 * (db/migrations/0014_youth_protection.sql).
 *
 * Like src/lib/neon/feedback.ts, every function here assumes the caller has
 * already wrapped it in `runAs` with the signed-in user's id: the three tables
 * this module touches carry FORCE ROW LEVEL SECURITY and their policies are
 * written in terms of `app_user_id()` (migration 0004). A call made outside that
 * context sees nothing at all, which presents as a report that saves and then
 * cannot be read back.
 *
 * Two things this module is careful about:
 *
 *   1. **The date of birth never leaves.** It is read into the process only to
 *      decide `profiles.is_minor`, and no function here returns it to a caller
 *      that is not its owner. `readOwnYouthProtection` is the one reader, and it
 *      is only ever used for the signed-in account's own settings page.
 *   2. **The evidence copy references nothing that can cascade.** The messages
 *      are copied with the sender's name as text, because by the time a report
 *      is read the accounts in it may be gone (see the migration).
 */

// ─────────────────────────────────────────────────────────────────
// DATE OF BIRTH AND GUARDIAN CONSENT
// ─────────────────────────────────────────────────────────────────

export interface YouthProtectionRecord {
  profile_id: string;
  date_of_birth: string;
  guardian_name: string | null;
  guardian_email: string | null;
  guardian_consent_at: string | null;
  consent_version: string | null;
  updated_at: string;
}

/**
 * The caller's own record, or null when they have never answered.
 *
 * The owner's only. An admin reading somebody else's date of birth is not a
 * capability this module offers, deliberately: an admin who needs to know
 * whether a thread involved a minor reads `profiles.is_minor`, which is what the
 * queue shows.
 */
export async function readOwnYouthProtection(profileId: string): Promise<YouthProtectionRecord | null> {
  if (!isValidId(profileId)) return null;

  const rows = (await sql`
    SELECT profile_id, date_of_birth::text AS date_of_birth, guardian_name, guardian_email,
           guardian_consent_at, consent_version, updated_at
    FROM youth_protection
    WHERE profile_id = ${profileId}
    LIMIT 1;
  `) as YouthProtectionRecord[];

  return rows[0] ?? null;
}

export interface SaveAgeInput {
  profileId: string;
  /** `YYYY-MM-DD`, already validated by `parseDateOfBirth`. */
  dateOfBirth: string;
  /** Present only when the account is a minor; see the route. */
  guardian?: { guardianName: string; guardianEmail: string; version: string } | null;
}

/**
 * Stores a date of birth (and the guardian's consent, when one is due) and
 * refreshes the derived flag.
 *
 * Upsert rather than insert: people get their own date of birth wrong and have
 * to correct it, and a second call must be an edit rather than a duplicate-key
 * error. The guardian columns are only written when a guardian is supplied, so
 * correcting a typo in the date does not silently wipe the consent that was
 * recorded with it.
 *
 * The flag is refreshed from the RECORD, not from the input: `refreshMinorFlag`
 * re-reads what is actually stored, so the flag and the record cannot disagree
 * even if a write half-succeeded.
 */
export async function saveAgeAndConsent(input: SaveAgeInput): Promise<YouthProtectionRecord | null> {
  if (!isValidId(input.profileId)) return null;

  await sql`
    INSERT INTO youth_protection
      (profile_id, date_of_birth, guardian_name, guardian_email, guardian_consent_at, consent_version)
    VALUES (
      ${input.profileId},
      ${input.dateOfBirth}::date,
      ${input.guardian?.guardianName ?? null},
      ${input.guardian?.guardianEmail ?? null},
      ${input.guardian ? new Date().toISOString() : null},
      ${input.guardian?.version ?? null}
    )
    ON CONFLICT (profile_id) DO UPDATE SET
      date_of_birth = EXCLUDED.date_of_birth,
      guardian_name = COALESCE(EXCLUDED.guardian_name, youth_protection.guardian_name),
      guardian_email = COALESCE(EXCLUDED.guardian_email, youth_protection.guardian_email),
      guardian_consent_at = COALESCE(EXCLUDED.guardian_consent_at, youth_protection.guardian_consent_at),
      consent_version = COALESCE(EXCLUDED.consent_version, youth_protection.consent_version),
      updated_at = now();
  `;

  await refreshMinorFlag(input.profileId);
  return readOwnYouthProtection(input.profileId);
}

/** The date of birth and education level an account has, as one row. */
async function readAgeSignals(profileId: string): Promise<{
  education_level: string | null;
  date_of_birth: string | null;
  is_minor: boolean;
} | null> {
  const rows = (await sql`
    SELECT p.education_level, p.is_minor, y.date_of_birth::text AS date_of_birth
    FROM profiles p
    LEFT JOIN youth_protection y ON y.profile_id = p.id
    WHERE p.id = ${profileId}
    LIMIT 1;
  `) as Array<{ education_level: string | null; is_minor: boolean; date_of_birth: string | null }>;

  return rows[0] ?? null;
}

/**
 * Recomputes `profiles.is_minor` from what is stored, and reports the answer.
 *
 * Idempotent and safe to call on every profile write. It runs under the caller's
 * own identity, so it can only ever move the caller's own row — which is the
 * only row whose signals it can read, since `youth_protection` is owner-scoped.
 * An admin correcting someone else's education level therefore does not refresh
 * their flag; those accounts keep the flag they had, and the education-level
 * fallback in the message guard still covers them.
 *
 * A missing profile row (never created, or deleted between the two queries)
 * returns false rather than throwing: this is called at the end of a profile
 * save that has already succeeded, and a flag it could not refresh must not turn
 * that save into an error the user sees.
 */
export async function refreshMinorFlag(profileId: string): Promise<boolean> {
  if (!isValidId(profileId)) return false;

  const signals = await readAgeSignals(profileId);
  if (!signals) return false;

  const isMinor = resolveMinorFlag({
    dateOfBirth: signals.date_of_birth,
    educationLevel: signals.education_level,
  });

  // Only write on a change. Every profile save runs this, and an unconditional
  // UPDATE would touch the row (and any trigger watching it) for no reason on
  // the overwhelmingly common no-change path.
  if (signals.is_minor !== isMinor) {
    await sql`
      UPDATE profiles SET is_minor = ${isMinor} WHERE id = ${profileId};
    `;
  }

  return isMinor;
}

/** Whether this account is currently treated as a minor. For the analytics gate. */
export async function isMinorAccount(profileId: string): Promise<boolean> {
  if (!isValidId(profileId)) return false;

  const rows = (await sql`
    SELECT is_minor FROM profiles WHERE id = ${profileId} LIMIT 1;
  `) as Array<{ is_minor: boolean }>;

  return rows[0]?.is_minor === true;
}

// ─────────────────────────────────────────────────────────────────
// SAFETY REPORTS
// ─────────────────────────────────────────────────────────────────

export interface SafetyReportRow {
  id: string;
  reporter_id: string | null;
  reporter_role: string | null;
  reported_profile_id: string | null;
  request_id: string | null;
  category: SafetyConcernCategory | string;
  message: string;
  minor_involved: boolean;
  snapshot_summary: string | null;
  status: SafetyReportStatus | string;
  admin_note: string | null;
  created_at: string;
}

/** What the admin queue needs: the report, who wrote it, and who it names. */
export interface AdminSafetyReportRow extends SafetyReportRow {
  reporter_name: string | null;
  reporter_email: string | null;
  reported_name: string | null;
  reported_email: string | null;
  evidence_count: number;
}

export interface SafetyReportCounts {
  new: number;
  reviewing: number;
  closed: number;
  total: number;
}

export interface NewSafetyReport {
  reporterId: string;
  reporterRole: string | null;
  reportedProfileId: string | null;
  requestId: string | null;
  category: SafetyConcernCategory;
  message: string;
  minorInvolved: boolean;
}

/**
 * Stores one report and returns its id.
 *
 * The insert has no `RETURNING`, for the reason db/README.md gives for
 * `notifications`: a RETURNING clause is evaluated against the SELECT policy,
 * and the row is fetched with the reporter's own identity instead.
 */
export async function createSafetyReport(report: NewSafetyReport): Promise<string> {
  const id = crypto.randomUUID();

  await sql`
    INSERT INTO safety_reports
      (id, reporter_id, reporter_role, reported_profile_id, request_id,
       category, message, minor_involved)
    VALUES (
      ${id},
      ${report.reporterId},
      ${report.reporterRole},
      ${report.reportedProfileId},
      ${report.requestId},
      ${report.category},
      ${report.message},
      ${report.minorInvolved}
    );
  `;

  return id;
}

/**
 * Whether a minor is on this thread, and the label to record for them.
 *
 * Separate from the report insert because the answer is also written onto the
 * report (`minor_involved`) so that the queue does not have to reconstruct, from
 * accounts that may since have been deleted, who was a child when the report was
 * made.
 */
export async function threadMinority(requestId: string, leadStudentId: string): Promise<boolean> {
  const rows = (await sql`
    SELECT is_minor FROM profiles
    WHERE id = ${leadStudentId}
       OR id IN (
         SELECT student_id FROM request_members
         WHERE request_id = ${requestId} AND status = 'joined'
       );
  `) as Array<{ is_minor: boolean }>;

  return rows.some((row) => row.is_minor === true);
}

/**
 * Copies a thread's messages into a report as evidence.
 *
 * The copy is what makes a report survive the deletion of the accounts it
 * describes: `messages` is reached through `requests`, which is reached through
 * `profiles`, and all of it cascades. `safety_report_evidence` references none of
 * it.
 *
 * Names are resolved NOW and stored as text, because after a deletion there is
 * no profile row left to join to and a report reading "Unknown participant said
 * this" is worth much less than one reading "Dr. Jane Smith said this".
 *
 * Only the most recent `SAFETY_REPORT_SNAPSHOT_LIMIT` messages: a report is
 * about what just happened, and an unbounded copy of a year-long thread would
 * make this the largest table in the schema.
 *
 * Assumes the caller has already established that the reporter may see the
 * thread (`requireParticipant`): messages are scoped to participants by RLS, so
 * a caller who may not read the thread gets zero rows rather than an error.
 */
export async function copyThreadIntoReportAsEvidence(reportId: string, requestId: string): Promise<number> {
  if (!isValidId(reportId)) return 0;

  const rows = (await sql`
    SELECT m.id, m.sender_id, m.content, m.created_at,
           p.role, p.first_name, p.last_name, p.preferred_name, p.honorific
    FROM messages m
    LEFT JOIN profiles p ON p.id = m.sender_id
    WHERE m.request_id = ${requestId}::uuid
    ORDER BY m.created_at DESC
    LIMIT ${SAFETY_REPORT_SNAPSHOT_LIMIT};
  `) as Array<{
    id: string;
    sender_id: string;
    content: string;
    created_at: string;
    role: string | null;
    first_name: string | null;
    last_name: string | null;
    preferred_name: string | null;
    honorific: string | null;
  }>;

  if (rows.length === 0) return 0;

  const evidence = rows.map((row) => {
    const person = {
      first_name: row.first_name,
      last_name: row.last_name,
      preferred_name: row.preferred_name,
      honorific: row.honorific,
    };
    // The same naming the thread itself uses, so a transcript matches what the
    // reader remembers seeing.
    const label = row.role === "professor" ? facultyName(person) : fullName(person, "Former participant");

    return { row, label };
  });

  // One statement for the whole copy rather than a loop of inserts: on the Neon
  // HTTP driver each query is its own round trip, and a 200-message thread would
  // otherwise be 200 of them inside one request. Parallel arrays through
  // `unnest` rather than a JSON round trip, which is the same shape the group
  // invite path uses (`unnest(${...}::text[])` in src/app/messages/[id]/actions.ts).
  //
  // Inserted oldest-first even though they were read newest-first, so the stored
  // order (and the `(report_id, sent_at)` index) reads chronologically.
  const ordered = [...evidence].reverse();

  await sql`
    INSERT INTO safety_report_evidence (id, report_id, sender_id, sender_label, sender_role, content, sent_at)
    SELECT gen_random_uuid()::text, ${reportId},
           e.sender_id, e.sender_label, e.sender_role, e.content, e.sent_at::timestamptz
    FROM unnest(
      ${ordered.map(({ row }) => row.sender_id)}::text[],
      ${ordered.map(({ label }) => label)}::text[],
      ${ordered.map(({ row }) => row.role)}::text[],
      ${ordered.map(({ row }) => row.content)}::text[],
      ${ordered.map(({ row }) => row.created_at)}::text[]
    ) AS e(sender_id, sender_label, sender_role, content, sent_at);
  `;

  await sql`
    UPDATE safety_reports
       SET snapshot_summary = ${summaryOfSnapshot(rows.length, rows.length >= SAFETY_REPORT_SNAPSHOT_LIMIT)},
           updated_at = now()
     WHERE id = ${reportId};
  `;

  return rows.length;
}

/** The reporter's own reports, newest first — the receipt their settings show. */
export async function listOwnSafetyReports(userId: string, limit: number = 5): Promise<SafetyReportRow[]> {
  return (await sql`
    SELECT id, reporter_id, reporter_role, reported_profile_id, request_id::text AS request_id,
           category, message, minor_involved, snapshot_summary, status, admin_note, created_at
    FROM safety_reports
    WHERE reporter_id = ${userId}
    ORDER BY created_at DESC
    LIMIT ${limit};
  `) as SafetyReportRow[];
}

/**
 * The admin queue, newest first.
 *
 * `reporter_id` and `reported_profile_id` are both nullable now (deleting an
 * account sets them null rather than cascading the report away), so both joins
 * are LEFT and both names may come back null. The queue renders that as "account
 * deleted", which is itself information the reader needs.
 *
 * The order is urgent categories first, then newest. Done in SQL rather than by
 * sorting the page's array, because the result is capped: re-ordering the page's
 * slice would quietly drop the oldest urgent report in a busy queue, which is
 * the one report that most needs to be at the top. The list itself is passed in
 * from src/lib/youth-protection.ts, so the definition of "urgent" still lives in
 * exactly one place.
 *
 * Written as three whole statements rather than one with an interpolated WHERE
 * fragment, matching `listFeedbackReportsForAdmin` next door: the status is
 * re-checked here rather than trusted, because a runtime value that is not one of
 * the three views would otherwise have to be interpolated into the query text.
 */
export async function listSafetyReportsForAdmin(options: {
  status?: SafetyReportStatus | "open" | "all";
  limit?: number;
} = {}): Promise<AdminSafetyReportRow[]> {
  const { status = "open", limit = 200 } = options;
  const view: SafetyReportStatus | "open" | "all" =
    status === "all" || status === "open" || isSafetyReportStatus(status) ? status : "open";
  const urgent = [...URGENT_CONCERN_CATEGORIES];

  const rows =
    view === "all"
      ? await sql`
          SELECT s.id, s.reporter_id, s.reporter_role, s.reported_profile_id, s.request_id::text AS request_id,
                 s.category, s.message, s.minor_involved, s.snapshot_summary, s.status, s.admin_note, s.created_at,
                 reporter.first_name || ' ' || COALESCE(reporter.last_name, '') AS reporter_name,
                 reporter.email AS reporter_email,
                 reported.first_name || ' ' || COALESCE(reported.last_name, '') AS reported_name,
                 reported.email AS reported_email,
                 (SELECT count(*)::int FROM safety_report_evidence e WHERE e.report_id = s.id) AS evidence_count
          FROM safety_reports s
          LEFT JOIN profiles reporter ON reporter.id = s.reporter_id
          LEFT JOIN profiles reported ON reported.id = s.reported_profile_id
          ORDER BY (s.category = ANY(${urgent}::text[])) DESC, s.created_at DESC
          LIMIT ${limit};
        `
      : view === "open"
        ? await sql`
            SELECT s.id, s.reporter_id, s.reporter_role, s.reported_profile_id, s.request_id::text AS request_id,
                   s.category, s.message, s.minor_involved, s.snapshot_summary, s.status, s.admin_note, s.created_at,
                   reporter.first_name || ' ' || COALESCE(reporter.last_name, '') AS reporter_name,
                   reporter.email AS reporter_email,
                   reported.first_name || ' ' || COALESCE(reported.last_name, '') AS reported_name,
                   reported.email AS reported_email,
                   (SELECT count(*)::int FROM safety_report_evidence e WHERE e.report_id = s.id) AS evidence_count
            FROM safety_reports s
            LEFT JOIN profiles reporter ON reporter.id = s.reporter_id
            LEFT JOIN profiles reported ON reported.id = s.reported_profile_id
            WHERE s.status IN ('new', 'reviewing')
            ORDER BY (s.category = ANY(${urgent}::text[])) DESC, s.created_at DESC
            LIMIT ${limit};
          `
        : await sql`
            SELECT s.id, s.reporter_id, s.reporter_role, s.reported_profile_id, s.request_id::text AS request_id,
                   s.category, s.message, s.minor_involved, s.snapshot_summary, s.status, s.admin_note, s.created_at,
                   reporter.first_name || ' ' || COALESCE(reporter.last_name, '') AS reporter_name,
                   reporter.email AS reporter_email,
                   reported.first_name || ' ' || COALESCE(reported.last_name, '') AS reported_name,
                   reported.email AS reported_email,
                   (SELECT count(*)::int FROM safety_report_evidence e WHERE e.report_id = s.id) AS evidence_count
            FROM safety_reports s
            LEFT JOIN profiles reporter ON reporter.id = s.reporter_id
            LEFT JOIN profiles reported ON reported.id = s.reported_profile_id
            WHERE s.status = ${view}
            ORDER BY (s.category = ANY(${urgent}::text[])) DESC, s.created_at DESC
            LIMIT ${limit};
          `;

  return rows as AdminSafetyReportRow[];
}

export async function countSafetyByStatus(): Promise<SafetyReportCounts> {
  const rows = (await sql`
    SELECT
      COUNT(*) FILTER (WHERE status = 'new')       ::int AS new,
      COUNT(*) FILTER (WHERE status = 'reviewing') ::int AS reviewing,
      COUNT(*) FILTER (WHERE status = 'closed')    ::int AS closed,
      COUNT(*)                                     ::int AS total
    FROM safety_reports;
  `) as SafetyReportCounts[];

  return rows[0] ?? { new: 0, reviewing: 0, closed: 0, total: 0 };
}

/** The messages copied into one report, oldest first, for the admin's reader. */
export async function listSafetyEvidence(reportId: string): Promise<
  Array<{
    id: string;
    sender_id: string | null;
    sender_label: string | null;
    sender_role: string | null;
    content: string;
    sent_at: string;
  }>
> {
  if (!isValidId(reportId)) return [];

  return (await sql`
    SELECT id, sender_id, sender_label, sender_role, content, sent_at
    FROM safety_report_evidence
    WHERE report_id = ${reportId}
    ORDER BY sent_at ASC;
  `) as Array<{
    id: string;
    sender_id: string | null;
    sender_label: string | null;
    sender_role: string | null;
    content: string;
    sent_at: string;
  }>;
}

/** Moves one report through the queue. Admin-only, by the policy as well as the caller. */
export async function setSafetyReportStatus(
  id: string,
  status: SafetyReportStatus,
  adminNote: string | null = null,
): Promise<boolean> {
  if (!isValidId(id) || !isSafetyReportStatus(status)) return false;

  const rows = (await sql`
    UPDATE safety_reports
       SET status = ${status},
           admin_note = COALESCE(${adminNote}, admin_note),
           updated_at = now()
     WHERE id = ${id}
    RETURNING id;
  `) as Array<{ id: string }>;

  return rows.length > 0;
}

/**
 * Removes a report, and its evidence with it (`ON DELETE CASCADE` on
 * `safety_report_evidence.report_id`). Admin-only, and deliberately the only way
 * a report disappears: a reporter cannot withdraw one, because the record of a
 * concern raised about a child should not be erasable by the person who raised
 * it while under pressure from the person it is about.
 */
export async function deleteSafetyReport(id: string): Promise<boolean> {
  if (!isValidId(id)) return false;

  const rows = (await sql`
    DELETE FROM safety_reports WHERE id = ${id} RETURNING id;
  `) as Array<{ id: string }>;

  return rows.length > 0;
}
