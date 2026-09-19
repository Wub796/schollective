import { sql } from "@/lib/neon/db";
import { isValidId } from "@/lib/security";
import {
  isFeedbackStatus,
  type FeedbackCategory,
  type FeedbackStatus,
} from "@/lib/feedback";

/**
 * Reads and writes for the beta feedback queue (db/migrations/0013).
 *
 * Every function here assumes the caller has already wrapped it in `runAs` with
 * the signed-in user's id: the policies on `feedback_reports` are written in
 * terms of `app_user_id()` (migration 0004), so a call made outside that context
 * sees nothing at all — a report that appears to save and then cannot be read
 * back. The route and the admin page both call `runAs` explicitly for that
 * reason, and each query below also names its `user_id` rather than relying on
 * the policy alone, so the ownership question is answered twice.
 */

export interface FeedbackReportRow {
  id: string;
  user_id: string;
  role: string | null;
  category: FeedbackCategory | string;
  subject: string | null;
  message: string;
  page_path: string | null;
  status: FeedbackStatus | string;
  admin_note: string | null;
  created_at: string;
}

/** What the admin queue needs: the report plus who wrote it. */
export interface AdminFeedbackRow extends FeedbackReportRow {
  first_name: string | null;
  last_name: string | null;
  preferred_name: string | null;
  honorific: string | null;
  email: string | null;
}

/** How many reports sit in each state, for the queue's filter tabs. */
export interface FeedbackCounts {
  new: number;
  reviewed: number;
  closed: number;
  total: number;
}

export interface NewFeedbackReport {
  userId: string;
  /** The role at the time of writing; the queue shows it even if the role changes. */
  role: string | null;
  category: FeedbackCategory;
  subject: string;
  message: string;
  page: string;
  userAgent: string;
}

/**
 * Stores one report and returns the stored row.
 *
 * The insert has no `RETURNING`: the SELECT policy is what a RETURNING clause
 * would be evaluated against, and the row is fetched with the author's own
 * identity instead. (The same trap as `notifications`, see db/README.md.)
 */
export async function createFeedbackReport(report: NewFeedbackReport): Promise<FeedbackReportRow> {
  const id = crypto.randomUUID();
  const role = report.role === "professor" || report.role === "student" || report.role === "admin"
    ? report.role
    : null;

  await sql`
    INSERT INTO feedback_reports
      (id, user_id, role, category, subject, message, page_path, user_agent)
    VALUES (
      ${id},
      ${report.userId},
      ${role},
      ${report.category},
      ${report.subject || null},
      ${report.message},
      ${report.page || null},
      ${report.userAgent || null}
    );
  `;

  const rows = (await sql`
    SELECT id, user_id, role, category, subject, message, page_path, status, admin_note, created_at
    FROM feedback_reports
    WHERE id = ${id} AND user_id = ${report.userId}
    LIMIT 1;
  `) as FeedbackReportRow[];

  return rows[0];
}

/** The author's own reports, newest first — the receipt their settings page shows. */
export async function listOwnFeedbackReports(
  userId: string,
  limit: number = 5,
): Promise<FeedbackReportRow[]> {
  return (await sql`
    SELECT id, user_id, role, category, subject, message, page_path, status, admin_note, created_at
    FROM feedback_reports
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT ${limit};
  `) as FeedbackReportRow[];
}

/**
 * The admin queue, newest first. Named by state so the filter tabs can ask for
 * one view at a time; `all` is not a status the database knows.
 */
export async function listFeedbackReportsForAdmin(options: {
  status?: FeedbackStatus | "all";
  limit?: number;
} = {}): Promise<AdminFeedbackRow[]> {
  const { status = "all", limit = 200 } = options;

  const rows = status === "all"
    ? await sql`
        SELECT f.id, f.user_id, f.role, f.category, f.subject, f.message, f.page_path,
               f.status, f.admin_note, f.created_at,
               p.first_name, p.last_name, p.preferred_name, p.honorific, p.email
        FROM feedback_reports f
        LEFT JOIN profiles p ON p.id = f.user_id
        ORDER BY f.created_at DESC
        LIMIT ${limit};
      `
    : await sql`
        SELECT f.id, f.user_id, f.role, f.category, f.subject, f.message, f.page_path,
               f.status, f.admin_note, f.created_at,
               p.first_name, p.last_name, p.preferred_name, p.honorific, p.email
        FROM feedback_reports f
        LEFT JOIN profiles p ON p.id = f.user_id
        WHERE f.status = ${status}
        ORDER BY f.created_at DESC
        LIMIT ${limit};
      `;

  return rows as AdminFeedbackRow[];
}

export async function countFeedbackByStatus(): Promise<FeedbackCounts> {
  const rows = (await sql`
    SELECT
      COUNT(*) FILTER (WHERE status = 'new')      ::int AS new,
      COUNT(*) FILTER (WHERE status = 'reviewed') ::int AS reviewed,
      COUNT(*) FILTER (WHERE status = 'closed')   ::int AS closed,
      COUNT(*)                                    ::int AS total
    FROM feedback_reports;
  `) as FeedbackCounts[];

  return rows[0] ?? { new: 0, reviewed: 0, closed: 0, total: 0 };
}

/**
 * Moves one report through the queue. Admin-only, enforced by the policy as
 * well as by the caller: the UPDATE policy is `USING (app_is_admin())`.
 */
export async function setFeedbackStatus(
  id: string,
  status: FeedbackStatus,
  adminNote: string | null = null,
): Promise<boolean> {
  // Both arguments are checked here because this is the one function in the
  // module that writes a value an admin typed; a bad id would otherwise update
  // zero rows and look like success.
  if (!isValidId(id) || !isFeedbackStatus(status)) return false;

  const rows = (await sql`
    UPDATE feedback_reports
       SET status = ${status},
           admin_note = COALESCE(${adminNote}, admin_note),
           updated_at = now()
     WHERE id = ${id}
    RETURNING id;
  `) as Array<{ id: string }>;

  return rows.length > 0;
}

/** Removes a report. Admin-only, and deliberately the only way a row disappears. */
export async function deleteFeedbackReport(id: string): Promise<boolean> {
  if (!isValidId(id)) return false;

  const rows = (await sql`
    DELETE FROM feedback_reports WHERE id = ${id} RETURNING id;
  `) as Array<{ id: string }>;

  return rows.length > 0;
}
