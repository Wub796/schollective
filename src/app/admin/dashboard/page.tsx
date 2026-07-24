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
        padding: "2.25rem 2.5rem",
        border: "1px solid rgba(161, 197, 209, 0.45)",
        borderRadius: "14px",
        background: "rgba(161, 197, 209, 0.12)",
        display: "flex", flexDirection: "column", gap: "0.5rem",
      }}
    >
      <span
        className="font-display"
        style={{ fontSize: "2.8rem", fontWeight: 900, color: "#141005", letterSpacing: "-0.04em", lineHeight: 1 }}
      >
        {value}
      </span>
      <div>
        <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#141005", fontFamily: "var(--font-sans)", lineHeight: 1.4 }}>
          {label}
        </div>
        <div style={{
          display: "inline-block", fontSize: "0.58rem", fontWeight: 800, letterSpacing: "0.2em",
          textTransform: "uppercase", color: "#141005", background: "#FFC20F",
          padding: "0.25rem 0.75rem", borderRadius: "100px", width: "fit-content", marginTop: "0.5rem",
          fontFamily: "var(--font-sans, monospace)", border: "1px solid rgba(255, 194, 15, 0.6)"
        }}>
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
      <div style={{ display: "flex", flexDirection: "column", gap: "3.5rem" }}>
        {/* ── Page header ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ width: "1.5rem", height: "2px", background: "#FFC20F", display: "block" }} />
            <span style={{ fontSize: "0.62rem", fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", color: "#008CBB", fontFamily: "var(--font-sans, monospace)" }}>
              Internal Systems
            </span>
          </div>
          <h1 className="font-display" style={{ fontSize: "clamp(2.4rem, 4.5vw, 3.6rem)", fontWeight: 900, color: "#141005", letterSpacing: "-0.035em", lineHeight: 1.1 }}>
            Admin <em style={{ fontStyle: "italic", color: "#008CBB", fontWeight: 300 }}>Overview</em>
          </h1>
          <p style={{ fontSize: "0.95rem", color: "#3b3527", opacity: 0.75, fontWeight: 400, maxWidth: "38rem", lineHeight: 1.8, fontFamily: "var(--font-sans)", marginTop: "0.25rem" }}>
            Platform health at a glance. Manage the verification queue, user accounts, and mentorship activity.
          </p>
          <AdminPreviewControls />
        </div>

        {/* ── Stats ── */}
        <div className="dash-stat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.25rem" }}>
          <StatCard value={totalActive}              label="Active Accounts" sub="Students + Faculty" accent="#008CBB" />
          <StatCard value={studentCount ?? 0}        label="Students"        sub="Registered"          accent="#008CBB" />
          <StatCard value={facultyCount ?? 0}        label="Faculty"         sub="Verified"            accent="#008CBB" />
          <StatCard value={activeThreadsCount ?? 0}  label="Active Threads"  sub="System-wide"         accent="#008CBB" />
        </div>

        {/* ── Hairline ── */}
        <div style={{ height: "1px", background: "rgba(161, 197, 209, 0.4)" }} />

        {/* ── Verification queue ── */}
        <section style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ width: "1rem", height: "2px", background: "#FFC20F", display: "block" }} />
            <h2 className="font-display" style={{ fontSize: "1.2rem", fontWeight: 700, color: "#141005", letterSpacing: "-0.025em" }}>
              Verification Queue
            </h2>
            <span style={{
              marginLeft: "auto", fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.22em",
              textTransform: "uppercase", color: "#141005", background: "rgba(255, 194, 15, 0.35)",
              padding: "0.3rem 0.8rem", borderRadius: "100px", fontFamily: "var(--font-sans, monospace)"
            }}>
              {pendingProfessors?.length ?? 0} pending
            </span>
          </div>
          {(pendingProfessors?.length ?? 0) === 0 ? (
            <div style={{ padding: "3rem 2rem", borderRadius: "16px", border: "1px dashed rgba(161, 197, 209, 0.6)", background: "rgba(255, 255, 255, 0.7)", textAlign: "center" }}>
              <div style={{ fontSize: "0.85rem", color: "#3b3527", opacity: 0.75, fontFamily: "var(--font-sans)", letterSpacing: "0.02em" }}>
                All caught up — no pending reviews.
              </div>
            </div>
          ) : (
            <AdminReviewTable applicants={(pendingProfessors ?? []) as any} />
          )}
        </section>
      </div>
    </AdminShell>
  );
}
