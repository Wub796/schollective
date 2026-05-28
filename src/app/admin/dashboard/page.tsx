import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { AdminShell } from "@/components/ui/AdminShell";
import { AdminReviewTable } from "@/components/features/AdminReviewTable";
import { AdminPreviewControls } from "@/components/features/AdminPreviewControls";
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
        padding: "2rem",
        border: `1px solid ${accent ? `${accent}18` : "rgba(15, 23, 42,0.07)"}`,
        borderRadius: "14px",
        background: accent ? `${accent}06` : "rgba(15, 23, 42,0.025)",
        display: "flex", flexDirection: "column", gap: "0.5rem",
      }}
    >
      <span
        className="font-display"
        style={{ fontSize: "2.8rem", fontWeight: 900, color: accent ?? "#fafaf9", letterSpacing: "-0.04em", lineHeight: 1 }}
      >
        {value}
      </span>
      <div>
        <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "rgba(15, 23, 42,0.7)", fontFamily: "var(--font-sans)" }}>
          {label}
        </div>
        <div style={{ fontSize: "0.52rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(15, 23, 42,0.22)", fontFamily: "var(--font-mono, monospace)", marginTop: "0.2rem" }}>
          {sub}
        </div>
      </div>
    </div>
  );
}

export default async function AdminDashboard() {
  const supabase = await createClient();

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("*").eq("id", session.user.id).single();

  if (!profile || profile.role !== "admin") {
    redirect(profile?.role === "professor" ? "/prof/dashboard" : "/dashboard");
  }

  // Use service-role client for all data queries (bypasses RLS)
  const adminClient = createAdminClient();

  const [
    { data: pendingProfessors },
    { count: studentCount },
    { count: activeStudentCount },
    { count: facultyCount },
    { count: pendingCount },
    { count: activeThreadsCount },
  ] = await Promise.all([
    adminClient
      .from("profiles")
      .select("id, first_name, last_name, preferred_name, email, institution, expertise_fields, ai_score, ai_level, ai_flags")
      .eq("role", "professor").eq("status", "pending")
      .order("created_at", { ascending: true }),
    adminClient.from("profiles").select("*", { count: "exact", head: true }).eq("role", "student"),
    adminClient.from("profiles").select("*", { count: "exact", head: true }).eq("role", "student").eq("status", "active"),
    adminClient.from("profiles").select("*", { count: "exact", head: true }).eq("role", "professor").in("status", ["approved", "active"]),
    adminClient.from("profiles").select("*", { count: "exact", head: true }).eq("role", "professor").eq("status", "pending"),
    adminClient.from("requests").select("*", { count: "exact", head: true }).eq("status", "active"),
  ]);

  const totalActive = (activeStudentCount ?? 0) + (facultyCount ?? 0);

  return (
    <AdminShell>
      {/* ── Page header ── */}
      <div style={{ marginBottom: "2.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.75rem" }}>
          <span style={{ width: "1.25rem", height: "1px", background: "rgba(15, 23, 42,0.2)", display: "block" }} />
          <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.42em", textTransform: "uppercase", color: "rgba(15, 23, 42,0.3)", fontFamily: "var(--font-mono, monospace)" }}>
            Internal Systems
          </span>
        </div>
        <h1 className="font-display" style={{ fontSize: "clamp(2.6rem, 4vw, 3.5rem)", fontWeight: 900, color: "var(--text-primary)", letterSpacing: "-0.035em", lineHeight: 1.05 }}>
          Admin <em style={{ fontStyle: "italic", color: "rgba(15, 23, 42,0.3)" }}>Overview</em>
        </h1>
        <p style={{ fontSize: "0.95rem", color: "rgba(15, 23, 42,0.38)", fontWeight: 300, maxWidth: "38rem", lineHeight: 1.8, fontFamily: "var(--font-sans)", marginTop: "0.5rem" }}>
          Platform health at a glance. Manage the verification queue, user accounts, and mentorship activity.
        </p>
        <AdminPreviewControls />
      </div>

      {/* ── Stats ── */}
      <div className="dash-stat-grid" style={{ marginBottom: "2.5rem" }}>
        <StatCard value={totalActive}              label="Active Accounts" sub="Students + Faculty" accent="#4ade80" />
        <StatCard value={studentCount ?? 0}        label="Students"        sub="Registered"          accent="#818cf8" />
        <StatCard value={facultyCount ?? 0}        label="Faculty"         sub="Verified"            accent="#60a5fa" />
        <StatCard value={activeThreadsCount ?? 0}  label="Active Threads"  sub="System-wide"         accent="#a78bfa" />
      </div>

      {/* ── Hairline ── */}
      <div style={{ height: "1px", background: "rgba(15, 23, 42,0.06)", marginBottom: "2.5rem" }} />

      {/* ── Verification queue ── */}
      <section style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
          <span style={{ width: "1rem", height: "1px", background: "rgba(15, 23, 42,0.2)", display: "block" }} />
          <h2 className="font-display" style={{ fontSize: "1.2rem", fontWeight: 700, color: "rgba(15, 23, 42,0.85)", letterSpacing: "-0.025em" }}>
            Verification Queue
          </h2>
          <span style={{ marginLeft: "auto", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.42em", textTransform: "uppercase", color: "rgba(15, 23, 42,0.25)", fontFamily: "var(--font-mono, monospace)" }}>
            {pendingProfessors?.length ?? 0} pending
          </span>
        </div>
        {(pendingProfessors?.length ?? 0) === 0 ? (
          <div style={{ padding: "2.5rem 1.5rem", borderRadius: "12px", border: "1px solid rgba(15, 23, 42,0.05)", background: "rgba(15, 23, 42,0.01)", textAlign: "center" }}>
            <div style={{ fontSize: "0.7rem", color: "rgba(15, 23, 42,0.2)", fontFamily: "var(--font-sans)", letterSpacing: "0.05em" }}>
              All caught up — no pending reviews.
            </div>
          </div>
        ) : (
          <AdminReviewTable applicants={(pendingProfessors ?? []) as any} />
        )}
      </section>
    </AdminShell>
  );
}
