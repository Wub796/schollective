import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { AdminReviewTable } from "@/components/features/AdminReviewTable";
import { ShieldCheck, Users, GraduationCap, Activity, Home, User, Settings } from "lucide-react";

export const dynamic = "force-dynamic";

function StatCard({ value, label, sub }: { value: string | number; label: string; sub: string }) {
  return (
    <div style={{
      padding: "1.5rem",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: "14px",
      background: "rgba(255,255,255,0.025)",
      display: "flex", flexDirection: "column", gap: "0.5rem",
    }}>
      <span className="font-display" style={{ fontSize: "2.4rem", fontWeight: 900, color: "#fff", letterSpacing: "-0.04em", lineHeight: 1 }}>
        {value}
      </span>
      <div>
        <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "rgba(255,255,255,0.7)", fontFamily: "var(--font-sans)" }}>{label}</div>
        <div style={{ fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", fontFamily: "var(--font-mono, monospace)", marginTop: "0.2rem" }}>
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
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    const fallback = profile?.role === "professor" ? "/prof/dashboard" : "/dashboard";
    redirect(fallback);
  }

  // Fetch pending professors
  const { data: pendingProfessors } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, preferred_name, email, institution, expertise_fields")
    .eq("role", "professor")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  // Fetch system stats
  const { count: studentCount } = await supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "student");
  const { count: facultyCount } = await supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "professor").eq("status", "approved");
  const { count: activeThreadsCount } = await supabase.from("requests").select("*", { count: "exact", head: true }).eq("status", "active");

  return (
    <div style={{ minHeight: "100vh", background: "#080c14", display: "flex", flexDirection: "column" }}>
      {/* ── Top Navigation (Matches Landing Page / AppShell) ── */}
      <header style={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "space-between", 
        padding: "1.5rem 5vw", 
        background: "rgba(8,12,20,0.92)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <span className="font-display" style={{ fontSize: "1.05rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
              Schollective
            </span>
          </Link>
          <span style={{ fontSize: "0.42rem", fontWeight: 700, letterSpacing: "0.38em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", fontFamily: "var(--font-mono, monospace)", marginTop: "2px", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ width: "4px", height: "4px", background: "#ff4a4a", borderRadius: "50%" }}></span>
            Admin Environment
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <Link href="/" style={{ textDecoration: "none" }} className="admin-nav-link">
            <div style={{ padding: "0.5rem 1rem", color: "rgba(255,255,255,0.7)", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", fontFamily: "var(--font-sans)", display: "flex", alignItems: "center", gap: "0.4rem", transition: "color 0.2s" }}>
              <Home size={12} /> Home
            </div>
          </Link>
          <Link href="/profile" style={{ textDecoration: "none" }} className="admin-nav-button">
            <div style={{ padding: "0.5rem 1rem", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "100px", color: "rgba(255,255,255,0.7)", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", fontFamily: "var(--font-sans)", display: "flex", alignItems: "center", gap: "0.4rem", transition: "all 0.2s" }}>
              <Settings size={12} /> Settings
            </div>
          </Link>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main style={{ flex: 1, padding: "3rem 5vw", display: "flex", flexDirection: "column", gap: "3.5rem", maxWidth: "1200px", margin: "0 auto", width: "100%" }}>
        
        {/* ── Header ── */}
      <header style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ width: "1.5rem", height: "1px", background: "rgba(255,255,255,0.2)", display: "block" }} />
          <span style={{ fontSize: "0.5rem", fontWeight: 700, letterSpacing: "0.38em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-mono, monospace)" }}>
            Internal Systems
          </span>
        </div>
        <h1 className="font-display" style={{ fontSize: "clamp(2.4rem, 5vw, 3.8rem)", fontWeight: 900, color: "#fff", letterSpacing: "-0.035em", lineHeight: 1.05 }}>
          Admin <em style={{ fontStyle: "italic", color: "rgba(255,255,255,0.35)" }}>Approval Portal</em>
        </h1>
        <p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.4)", fontWeight: 300, maxWidth: "42rem", lineHeight: 1.7, fontFamily: "var(--font-sans)", marginTop: "0.25rem" }}>
          Review and verify professor credentials to maintain the academic integrity of the Schollective network.
        </p>
      </header>

      {/* ── Stats row ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
        <StatCard value={studentCount || 0} label="Students" sub="Registered" />
        <StatCard value={facultyCount || 0} label="Faculty" sub="Verified" />
        <StatCard value={activeThreadsCount || 0} label="Active Threads" sub="System-wide" />
      </div>

      {/* ── Hairline ── */}
      <div style={{ height: "1px", background: "rgba(255,255,255,0.06)" }} />

      {/* ── Queue ── */}
      <section style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ width: "1rem", height: "1px", background: "rgba(255,255,255,0.2)", display: "block" }} />
          <h2 className="font-display" style={{ fontSize: "1.2rem", fontWeight: 700, color: "rgba(255,255,255,0.85)", letterSpacing: "-0.02em" }}>
            Verification Queue
          </h2>
          <span style={{ marginLeft: "auto", fontSize: "0.5rem", fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", fontFamily: "var(--font-mono, monospace)" }}>
            {pendingProfessors?.length || 0} pending
          </span>
        </div>
        
        <AdminReviewTable applicants={(pendingProfessors || []) as any} />
      </section>

        <footer style={{ marginTop: "4rem", paddingTop: "2rem", borderTop: "1px solid rgba(255,255,255,0.04)", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.5rem", fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)", fontFamily: "var(--font-mono, monospace)" }}>
          <span>Schollective Admin Engine v1.0</span>
          <span>Secure Environment · Academic Integrity First</span>
        </footer>
      </main>
    </div>
  );
}
