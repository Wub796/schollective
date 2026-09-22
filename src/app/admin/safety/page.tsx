import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUserAndProfile } from "@/lib/neon/profiles";
import { runAs } from "@/lib/neon/user-context";
import { AdminShell } from "@/components/ui/AdminShell";
import { AdminSafetyReportQueue } from "@/components/features/AdminSafetyReportQueue";
import {
  countSafetyByStatus,
  listSafetyReportsForAdmin,
  type AdminSafetyReportRow,
  type SafetyReportCounts,
} from "@/lib/neon/youth-protection";
import { SAFETY_REPORT_EMAIL } from "@/lib/youth-protection";

export const dynamic = "force-dynamic";

/**
 * The safety queue.
 *
 * Separate from /admin/feedback on purpose. They are different jobs with
 * different urgency, they want different orderings, and the person who should be
 * emailed about one is not necessarily the person who should be emailed about the
 * other. Filing a report about a child behind a tab called "Beta Feedback" is how
 * one gets read a week late.
 *
 * Every query runs inside `runAs`: `safety_reports` carries FORCE ROW LEVEL
 * SECURITY and its SELECT policy is `reporter_id = app_user_id() OR
 * app_is_admin()` (db/migrations/0014), so without the admin's database identity
 * this page would render as empty rather than as an error — the failure mode that
 * makes an operator believe there is nothing to see.
 *
 * The "open" view is the default rather than everything, because a closed report
 * is a report somebody has already handled, and a queue that opens on 200 handled
 * items trains its reader to skim.
 */
export default async function AdminSafetyPage() {
  const { session, user, profile } = await getCurrentUserAndProfile();
  if (!session) redirect("/login");

  if (!profile || profile.role !== "admin") {
    redirect(profile?.role === "professor" ? "/prof/dashboard" : "/dashboard");
  }

  const [reports, counts] = (await runAs(user.id, async () =>
    Promise.all([
      listSafetyReportsForAdmin({ status: "all", limit: 300 }),
      countSafetyByStatus(),
    ]),
  )) as [AdminSafetyReportRow[], SafetyReportCounts];

  const unnotified = process.env.SAFETY_EMAIL_TO ? null : SAFETY_REPORT_EMAIL;

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
            Safety <em style={{ color: "var(--accent)" }}>reports</em>
          </h1>
          <p style={{
            fontSize: "0.95rem", color: "var(--text-secondary)", opacity: 0.75,
            maxWidth: "46rem", lineHeight: 1.8, fontFamily: "var(--font-sans)", margin: 0,
          }}>
            Concerns raised from inside a mentorship thread, plus anything sent to{" "}
            {SAFETY_REPORT_EMAIL}. A report made from a thread carries its own copy of that
            thread's messages, which is the only copy that survives the accounts in it being
            deleted — so deleting a report destroys evidence, and closing it does not.
          </p>

          <div style={{
            display: "inline-flex", alignItems: "center", gap: "0.6rem",
            fontSize: "0.75rem", color: "var(--text-secondary)", flexWrap: "wrap",
          }}>
            <span style={{
              fontWeight: 800, color: counts.new > 0 ? "#b91c1c" : "var(--accent)",
              background: counts.new > 0 ? "rgba(220, 38, 38, 0.08)" : "rgba(99, 102, 241, 0.08)",
              border: `1px solid ${counts.new > 0 ? "rgba(220, 38, 38, 0.28)" : "rgba(99, 102, 241, 0.2)"}`,
              padding: "0.25rem 0.7rem", borderRadius: "100px",
              fontFamily: "var(--font-sans, monospace)", letterSpacing: "0.1em", textTransform: "uppercase",
            }}>
              {counts.new} not yet read
            </span>
            <span>{counts.reviewing} being handled</span>
            <span>{counts.total} total</span>
          </div>

          {unnotified && (
            <p style={{
              margin: 0, fontSize: "0.8rem", lineHeight: 1.7, maxWidth: "46rem",
              color: "#b45309", fontFamily: "var(--font-sans)",
            }}>
              <strong>Nobody is being emailed about these.</strong> SAFETY_EMAIL_TO is not set on
              this deployment, so a new report lands here and nowhere else. That is a supported
              configuration for feedback and not for this: until it is set, this page has to be
              opened. See the environment table in db/README.md, and note that the public policy
              names {SAFETY_REPORT_EMAIL} — that mailbox has to exist and be read.
            </p>
          )}
        </header>

        <div style={{ height: "1px", background: "rgba(99, 102, 241, 0.12)" }} />

        <AdminSafetyReportQueue reports={reports ?? []} counts={counts} />

        <p style={{ fontSize: "0.78rem", color: "var(--text-tertiary)", lineHeight: 1.7, fontFamily: "var(--font-sans)", margin: 0 }}>
          The published rules this queue enforces are at{" "}
          <Link
            href="/safety"
            className="link-underline"
            style={{ color: "var(--accent)", fontWeight: 700, textDecoration: "none" }}
          >
            /safety
          </Link>
          . The message guard that blocks an off-platform request before it is stored is in
          src/lib/youth-protection.ts; if you change the rules, change them there and the page and
          the guard move together.
        </p>
      </div>
    </AdminShell>
  );
}
