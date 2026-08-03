import React from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { Users } from "lucide-react";
import Link from "next/link";
import { StudentRow } from "@/components/features/StudentRow";

export const dynamic = "force-dynamic";

export default async function ProfStudentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, preferred_name, first_name, status")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/dashboard");

  // Allow admins to preview as professor
  const cookieStore = await cookies();
  const isAdminPreviewing = profile.role === "admin" && cookieStore.get("x-admin-view-as")?.value === "professor";

  if (!isAdminPreviewing && profile.role !== "professor") redirect("/dashboard");
  if (!isAdminPreviewing && profile.status !== "approved") redirect("/prof/pending");

  const displayName = profile.preferred_name || profile.first_name || "Professor";

  const { data: allRequests } = await supabase
    .from("requests")
    .select(`
      id, status, topic, updated_at, created_at,
      student:student_id ( id, first_name, last_name, preferred_name, institution ),
      messages ( content, created_at )
    `)
    .eq("professor_id", user.id)
    .in("status", ["active", "closed"])
    .order("updated_at", { ascending: false });

  const process = (req: any) => {
    const student = Array.isArray(req.student) ? req.student[0] : req.student;
    const latest =
      req.messages?.length > 0
        ? [...req.messages].sort(
            (a: any, b: any) =>
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0]
        : null;
    return { ...req, student, latest };
  };

  const activeStudents = (allRequests || []).filter((r) => r.status === "active").map(process);
  const pastStudents   = (allRequests || []).filter((r) => r.status === "closed").map(process);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "3.5rem" }}>

      {/* ── Header ── */}
      <header style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ width: "1.5rem", height: "2px", background: "#6366f1", display: "block" }} />
          <span style={{ fontSize: "0.62rem", fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", color: "#4f46e5", fontFamily: "var(--font-sans, monospace)" }}>
            Faculty Portal
          </span>
        </div>
        <h1 className="font-display" style={{ fontSize: "clamp(2.4rem, 4.5vw, 3.6rem)", fontWeight: 900, color: "#0f172a", letterSpacing: "-0.035em", lineHeight: 1.1 }}>
          Dr. {displayName}&apos;s{" "}
          <em style={{ fontStyle: "italic", color: "#4f46e5", fontWeight: 300 }}>students</em>
        </h1>
        <p style={{ fontSize: "0.95rem", color: "#475569", opacity: 0.75, fontWeight: 400, maxWidth: "42rem", lineHeight: 1.8, fontFamily: "var(--font-sans)", marginTop: "0.25rem" }}>
          An overview of every student you&apos;re currently mentoring and those you&apos;ve guided in the past.
        </p>
      </header>

      {/* ── Stats strip ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.25rem" }}>
        {[
          { value: activeStudents.length + pastStudents.length, label: "Total Students", sub: "All Time" },
          { value: activeStudents.length, label: "Active",  sub: "Currently Mentoring" },
          { value: pastStudents.length,   label: "Alumni",  sub: "Completed Sessions" },
        ].map(({ value, label, sub }) => (
          <div key={label} style={{
            padding: "2.25rem 2.5rem",
            border: "1px solid rgba(99, 102, 241, 0.45)",
            borderRadius: "14px",
            background: "rgba(99, 102, 241, 0.12)",
            display: "flex", flexDirection: "column", gap: "0.5rem",
          }}>
            <span className="font-display" style={{ fontSize: "2.8rem", fontWeight: 900, color: "#0f172a", letterSpacing: "-0.04em", lineHeight: 1 }}>
              {value}
            </span>
            <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#0f172a", fontFamily: "var(--font-sans)", lineHeight: 1.4 }}>{label}</div>
            <div style={{
              display: "inline-block", fontSize: "0.58rem", fontWeight: 800, letterSpacing: "0.2em",
              textTransform: "uppercase", color: "#0f172a", background: "#6366f1",
              padding: "0.25rem 0.75rem", borderRadius: "100px", width: "fit-content", marginTop: "0.5rem",
              fontFamily: "var(--font-sans, monospace)", border: "1px solid rgba(79, 70, 229, 0.6)"
            }}>
              {sub}
            </div>
          </div>
        ))}
      </div>

      {/* ── Hairline ── */}
      <div style={{ height: "1px", background: "rgba(15, 23, 42, 0.06)" }} />

      {/* ── Empty state ── */}
      {activeStudents.length === 0 && pastStudents.length === 0 && (
        <div style={{
          border: "1px dashed rgba(15, 23, 42, 0.08)", borderRadius: "16px",
          padding: "5rem 2rem", textAlign: "center",
          display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem",
        }}>
          <div style={{
            width: "3.5rem", height: "3.5rem", borderRadius: "50%",
            background: "rgba(15, 23, 42, 0.04)", border: "1px solid rgba(15, 23, 42, 0.08)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Users size={20} color="rgba(15, 23, 42, 0.3)" />
          </div>
          <div>
            <h3 className="font-display" style={{ fontSize: "1.3rem", fontWeight: 700, color: "rgba(15, 23, 42, 0.7)", marginBottom: "0.5rem", letterSpacing: "-0.02em" }}>
              No students yet
            </h3>
            <p style={{ fontSize: "0.82rem", color: "rgba(15, 23, 42, 0.32)", maxWidth: "26rem", lineHeight: 1.7, fontFamily: "var(--font-sans)" }}>
              Students will appear here once you accept their mentorship requests.
              Head to the dashboard to review your pending queue.
            </p>
          </div>
          <Link href="/prof/dashboard" style={{ textDecoration: "none" }}>
            <div style={{
              padding: "0.8rem 1.85rem", border: "1px solid rgba(15, 23, 42, 0.15)",
              borderRadius: "100px", fontSize: "0.58rem", fontWeight: 700,
              letterSpacing: "0.22em", textTransform: "uppercase",
              color: "rgba(15, 23, 42, 0.7)", fontFamily: "var(--font-sans)", cursor: "pointer",
            }}>
              View Request Queue
            </div>
          </Link>
        </div>
      )}

      {/* ── Active Students ── */}
      {activeStudents.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ width: "1rem", height: "1px", background: "rgba(15, 23, 42, 0.2)", display: "block" }} />
            <h2 className="font-display" style={{ fontSize: "1.2rem", fontWeight: 700, color: "rgba(15, 23, 42, 0.85)", letterSpacing: "-0.025em" }}>
              Currently Mentoring
            </h2>
            <span style={{ marginLeft: "auto", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(15, 23, 42, 0.25)", fontFamily: "var(--font-sans, monospace)" }}>
              {activeStudents.length} active
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {activeStudents.map((req: any) => (
              <StudentRow key={req.id} req={req} status="active" />
            ))}
          </div>
        </div>
      )}

      {/* ── Past Students ── */}
      {pastStudents.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ width: "1rem", height: "1px", background: "rgba(15, 23, 42, 0.2)", display: "block" }} />
            <h2 className="font-display" style={{ fontSize: "1.2rem", fontWeight: 700, color: "rgba(15, 23, 42, 0.45)", letterSpacing: "-0.025em" }}>
              Alumni
            </h2>
            <span style={{ marginLeft: "auto", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(15, 23, 42, 0.15)", fontFamily: "var(--font-sans, monospace)" }}>
              {pastStudents.length} completed
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", opacity: 0.75 }}>
            {pastStudents.map((req: any) => (
              <StudentRow key={req.id} req={req} status="closed" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


