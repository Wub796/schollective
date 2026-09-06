import React from "react";
import { redirect } from "next/navigation";
import { sql } from "@/lib/neon/db";
import { getCurrentUserAndProfile } from "@/lib/neon/profiles";
import { AdminShell } from "@/components/ui/AdminShell";
import { AdminReviewTable } from "@/components/features/AdminReviewTable";
import { AdminPreviewControls } from "@/components/features/AdminPreviewControls";
import { AdminSafetyQueue } from "@/components/features/AdminSafetyQueue";
import {
  Users, GraduationCap, MessageSquare, ClipboardCheck,
} from "lucide-react";

export const dynamic = "force-dynamic";

function StatCard({
  value, label, sub, accent,
}: {
  value: string | number; label: string; sub: string; accent?: string;
}) {
  return (
    <div
      style={{
        padding: "2rem 2.25rem",
        border: "1px solid rgba(99, 102, 241, 0.15)",
        borderRadius: "16px",
        background: "#ffffff",
        boxShadow: "0 4px 18px rgba(99, 102, 241, 0.05)",
        display: "flex", flexDirection: "column", gap: "0.5rem",
      }}
    >
      <span
        className="font-display"
        style={{ fontSize: "2.6rem", fontWeight: 900, color: "#0f172a", letterSpacing: "-0.04em", lineHeight: 1 }}
      >
        {value}
      </span>
      <div>
        <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#0f172a", fontFamily: "var(--font-sans)", lineHeight: 1.4 }}>
          {label}
        </div>
        <div style={{
          display: "inline-block", fontSize: "0.58rem", fontWeight: 800, letterSpacing: "0.2em",
          textTransform: "uppercase", color: "#4f46e5", background: "rgba(99, 102, 241, 0.08)",
          padding: "0.25rem 0.75rem", borderRadius: "100px", width: "fit-content", marginTop: "0.5rem",
          fontFamily: "var(--font-sans, monospace)", border: "1px solid rgba(99, 102, 241, 0.2)"
        }}>
          {sub}
        </div>
      </div>
    </div>
  );
}

export default async function AdminDashboard() {
  const { session, profile } = await getCurrentUserAndProfile();
  if (!session) redirect("/login");

  if (!profile || profile.role !== "admin") {
    redirect(profile?.role === "professor" ? "/prof/dashboard" : "/dashboard");
  }

  const [
    allProfessors,
    studentCountRes,
    activeStudentCountRes,
    activeThreadsCountRes,
  ] = await Promise.all([
    sql`
      SELECT id, first_name, last_name, preferred_name, email, status, institution, expertise_fields, ai_score, ai_level, ai_flags, created_at
      FROM profiles
      WHERE role = 'professor'
      ORDER BY created_at ASC;
    `,
    sql`SELECT COUNT(*)::int as count FROM profiles WHERE role = 'student';`,
    sql`SELECT COUNT(*)::int as count FROM profiles WHERE role = 'student' AND (status = 'active' OR status IS NULL);`,
    sql`SELECT COUNT(*)::int as count FROM requests WHERE status = 'active';`,
  ]);

  const studentCount = studentCountRes[0]?.count || 0;
  const activeStudentCount = activeStudentCountRes[0]?.count || 0;
  const activeThreadsCount = activeThreadsCountRes[0]?.count || 0;

  const pendingProfessors = (allProfessors ?? []).filter(
    (p) => p.status !== "approved" && p.status !== "rejected" && p.status !== "suspended"
  );
  const facultyCount = (allProfessors ?? []).filter((p) => p.status === "approved").length;
  const pendingCount = pendingProfessors.length;

  const totalActive = (activeStudentCount ?? 0) + (facultyCount ?? 0);

  return (
    <AdminShell>
      <div style={{ display: "flex", flexDirection: "column", gap: "3.5rem" }}>
        {/* ── Page header ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <h1 className="font-display" style={{ fontSize: "clamp(2.4rem, 4.5vw, 3.6rem)", fontWeight: 900, color: "#0f172a", letterSpacing: "-0.035em", lineHeight: 1.1 }}>
            Admin <em style={{ fontStyle: "italic", color: "#4f46e5", fontWeight: 300 }}>Overview</em>
          </h1>
          <p style={{ fontSize: "0.95rem", color: "#475569", opacity: 0.75, fontWeight: 400, maxWidth: "38rem", lineHeight: 1.8, fontFamily: "var(--font-sans)", marginTop: "0.25rem" }}>
            Platform health at a glance. Manage the verification queue, user accounts, and mentorship activity.
          </p>
          <AdminPreviewControls />
        </div>

        {/* ── Stats ── */}
        <div className="dash-stat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.25rem" }}>
          <StatCard value={totalActive}              label="Active Accounts" sub="Students + Faculty" accent="#4f46e5" />
          <StatCard value={studentCount ?? 0}        label="Students"        sub="Registered"          accent="#4f46e5" />
          <StatCard value={facultyCount ?? 0}        label="Faculty"         sub="Verified"            accent="#4f46e5" />
          <StatCard value={activeThreadsCount ?? 0}  label="Active Threads"  sub="System-wide"         accent="#4f46e5" />
        </div>

        {/* ── Hairline ── */}
        <div style={{ height: "1px", background: "rgba(99, 102, 241, 0.12)" }} />

        {/* ── Verification queue ── */}
        <section style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <h2 className="font-display" style={{ fontSize: "1.2rem", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.025em" }}>
              Verification Queue
            </h2>
            <span style={{
              marginLeft: "auto", fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.22em",
              textTransform: "uppercase", color: "#0f172a", background: "rgba(79, 70, 229, 0.35)",
              padding: "0.3rem 0.8rem", borderRadius: "100px", fontFamily: "var(--font-sans, monospace)"
            }}>
              {pendingProfessors?.length ?? 0} pending
            </span>
          </div>
          {(pendingProfessors?.length ?? 0) === 0 ? (
            <div style={{ padding: "3rem 2rem", borderRadius: "16px", border: "1px dashed rgba(99, 102, 241, 0.6)", background: "rgba(255, 255, 255, 0.7)", textAlign: "center" }}>
              <div style={{ fontSize: "0.85rem", color: "#475569", opacity: 0.75, fontFamily: "var(--font-sans)", letterSpacing: "0.02em" }}>
                All caught up — no pending reviews.
              </div>
            </div>
          ) : (
            <AdminReviewTable applicants={(pendingProfessors ?? []) as any} />
          )}
        </section>

        {/* ── AI Safety & Bot Moderation Queue ── */}
        <section>
          <AdminSafetyQueue
            initialFlaggedAccounts={
              (allProfessors ?? [])
                .filter((p) => p.ai_level === "suspicious" || (p.ai_flags && p.ai_flags.length > 0))
                .map((p) => ({
                  id: p.id,
                  first_name: p.first_name || undefined,
                  last_name: p.last_name || undefined,
                  email: p.email,
                  role: "professor",
                  ai_score: p.ai_score,
                  ai_flags: p.ai_flags,
                  ai_level: p.ai_level,
                  created_at: p.created_at,
                }))
            }
          />
        </section>
      </div>
    </AdminShell>
  );
}
