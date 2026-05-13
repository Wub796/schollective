import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { AdminShell } from "@/components/ui/AdminShell";
import { AdminReviewTable } from "@/components/features/AdminReviewTable";
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
        padding: "1.5rem",
        border: `1px solid ${accent ? `${accent}18` : "rgba(250,250,249,0.07)"}`,
        borderRadius: "14px",
        background: accent ? `${accent}06` : "rgba(250,250,249,0.025)",
        display: "flex", flexDirection: "column", gap: "0.5rem",
      }}
    >
      <span
        className="font-display"
        style={{ fontSize: "2.6rem", fontWeight: 900, color: accent ?? "#fafaf9", letterSpacing: "-0.04em", lineHeight: 1 }}
      >
        {value}
      </span>
      <div>
        <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "rgba(250,250,249,0.7)", fontFamily: "var(--font-sans)" }}>
          {label}
        </div>
        <div style={{ fontSize: "0.52rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(250,250,249,0.22)", fontFamily: "var(--font-mono, monospace)", marginTop: "0.2rem" }}>
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

  // ── Data fetches ─────────────────────────────────────────────────────────
  const [
    { data: pendingProfessors },
    { count: studentCount },
    { count: facultyCount },
    { count: pendingCount },
    { count: activeThreadsCount },
    { count: closedThreadsCount },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, first_name, last_name, preferred_name, email, institution, expertise_fields, ai_score, ai_level, ai_flags")
      .eq("role", "professor").eq("status", "pending")
      .order("created_at", { ascending: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "student"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "professor").eq("status", "approved"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "professor").eq("status", "pending"),
    supabase.from("requests").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("requests").select("*", { count: "exact", head: true }).eq("status", "closed"),
  ]);

  return (
    <AdminShell>
      {/* ── Page header ── */}
      <div style={{ marginBottom: "2.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.75rem" }}>
          <span style={{ width: "1.25rem", height: "1px", background: "rgba(250,250,249,0.2)", display: "block" }} />
          <span style={{ fontSize: "0.48rem", fontWeight: 700, letterSpacing: "0.38em", textTransform: "uppercase", color: "rgba(250,250,249,0.3)", fontFamily: "var(--font-mono, monospace)" }}>
            Internal Systems
          </span>
        </div>
        <h1 className="font-display" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 900, color: "#fafaf9", letterSpacing: "-0.035em", lineHeight: 1.05 }}>
          Admin <em style={{ fontStyle: "italic", color: "rgba(250,250,249,0.3)" }}>Overview</em>
        </h1>
        <p style={{ fontSize: "0.85rem", color: "rgba(250,250,249,0.38)", fontWeight: 300, maxWidth: "38rem", lineHeight: 1.7, fontFamily: "var(--font-sans)", marginTop: "0.5rem" }}>
          Platform health at a glance. Manage the verification queue, user accounts, and mentorship activity.
        </p>
      </div>

      {/* ── Stats ── */}
      <div className="dash-stat-grid" style={{ marginBottom: "2.5rem" }}>
        <StatCard value={studentCount ?? 0}       label="Students"       sub="Registered"   accent="#818cf8" />
        <StatCard value={facultyCount ?? 0}        label="Faculty"        sub="Verified"      accent="#4ade80" />
        <StatCard value={pendingCount ?? 0}         label="Pending"        sub="Awaiting review" accent="#facc15" />
        <StatCard value={activeThreadsCount ?? 0}  label="Active Threads" sub="System-wide"  accent="#60a5fa" />
      </div>

      {/* ── Hairline ── */}
      <div style={{ height: "1px", background: "rgba(250,250,249,0.06)", marginBottom: "2.5rem" }} />

      {/* ── Verification queue ── */}
      <section style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
          <span style={{ width: "1rem", height: "1px", background: "rgba(250,250,249,0.2)", display: "block" }} />
          <h2 className="font-display" style={{ fontSize: "1.15rem", fontWeight: 700, color: "rgba(250,250,249,0.85)", letterSpacing: "-0.02em" }}>
            Verification Queue
          </h2>
          <span style={{ marginLeft: "auto", fontSize: "0.48rem", fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(250,250,249,0.25)", fontFamily: "var(--font-mono, monospace)" }}>
            {pendingProfessors?.length ?? 0} pending
          </span>
        </div>
        <AdminReviewTable applicants={(pendingProfessors ?? []) as any} />
      </section>
    </AdminShell>
  );
}
