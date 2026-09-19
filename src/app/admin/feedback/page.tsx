import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUserAndProfile } from "@/lib/neon/profiles";
import { runAs } from "@/lib/neon/user-context";
import { AdminShell } from "@/components/ui/AdminShell";
import { AdminFeedbackQueue } from "@/components/features/AdminFeedbackQueue";
import {
  countFeedbackByStatus,
  listFeedbackReportsForAdmin,
  type AdminFeedbackRow,
  type FeedbackCounts,
} from "@/lib/neon/feedback";

export const dynamic = "force-dynamic";

/**
 * The beta feedback queue.
 *
 * Every query runs inside `runAs`: `feedback_reports` carries FORCE ROW LEVEL
 * SECURITY and its SELECT policy is `user_id = app_user_id() OR app_is_admin()`
 * (db/migrations/0013), so without the admin's database identity this page would
 * render as empty rather than as an error — the failure mode that makes an
 * operator believe the beta is simply quiet.
 */
export default async function AdminFeedbackPage() {
  const { session, user, profile } = await getCurrentUserAndProfile();
  if (!session) redirect("/login");

  if (!profile || profile.role !== "admin") {
    redirect(profile?.role === "professor" ? "/prof/dashboard" : "/dashboard");
  }

  const [reports, counts] = (await runAs(user.id, async () =>
    Promise.all([
      listFeedbackReportsForAdmin({ status: "all", limit: 300 }),
      countFeedbackByStatus(),
    ]),
  )) as [AdminFeedbackRow[], FeedbackCounts];

  return (
    <AdminShell>
      <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
        <header style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <h1
            className="font-display"
            style={{
              fontSize: "clamp(2.4rem, 4.5vw, 3.6rem)", fontWeight: 900,
              color: "var(--text-primary)", letterSpacing: "-0.035em", lineHeight: 1.1,
            }}
          >
            Beta <em style={{ fontStyle: "italic", color: "var(--accent)", fontWeight: 300 }}>Feedback</em>
          </h1>
          <p style={{
            fontSize: "0.95rem", color: "var(--text-secondary)", opacity: 0.75,
            maxWidth: "42rem", lineHeight: 1.8, fontFamily: "var(--font-sans)", margin: 0,
          }}>
            Everything students and faculty have reported through Settings → Feedback. These are the
            only copy of a report: the notification email is a heads-up, not the record.
          </p>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "0.6rem",
            fontSize: "0.75rem", color: "var(--text-secondary)",
          }}>
            <span style={{
              fontWeight: 800, color: "var(--accent)",
              background: "rgba(99, 102, 241, 0.08)", border: "1px solid rgba(99, 102, 241, 0.2)",
              padding: "0.25rem 0.7rem", borderRadius: "100px",
              fontFamily: "var(--font-sans, monospace)", letterSpacing: "0.1em", textTransform: "uppercase",
            }}>
              {counts.new} unread
            </span>
            <span>{counts.total} total</span>
          </div>
        </header>

        <div style={{ height: "1px", background: "rgba(99, 102, 241, 0.12)" }} />

        <AdminFeedbackQueue reports={reports ?? []} counts={counts} />
      </div>
    </AdminShell>
  );
}
