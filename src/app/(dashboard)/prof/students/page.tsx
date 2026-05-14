import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { MessageSquare, Users } from "lucide-react";

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

  if (!profile || profile.role !== "professor") redirect("/dashboard");
  if (profile.status !== "approved") redirect("/prof/pending");

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
    <div style={{ padding: "3rem 0", display: "flex", flexDirection: "column", gap: "3.5rem" }}>

      {/* ── Header ── */}
      <header style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ width: "1.5rem", height: "1px", background: "rgba(250, 250, 249, 0.2)", display: "block" }} />
          <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.38em", textTransform: "uppercase", color: "rgba(250, 250, 249, 0.3)", fontFamily: "var(--font-mono, monospace)" }}>
            Faculty Portal
          </span>
        </div>
        <h1 className="font-display" style={{ fontSize: "clamp(2.4rem, 5vw, 3.8rem)", fontWeight: 900, color: "#fafaf9", letterSpacing: "-0.035em", lineHeight: 1.05 }}>
          Dr. {displayName}&apos;s{" "}
          <em style={{ fontStyle: "italic", color: "rgba(250, 250, 249, 0.35)" }}>students</em>
        </h1>
        <p style={{ fontSize: "0.9rem", color: "rgba(250, 250, 249, 0.4)", fontWeight: 300, maxWidth: "42rem", lineHeight: 1.7, fontFamily: "var(--font-sans)", marginTop: "0.25rem" }}>
          An overview of every student you&apos;re currently mentoring and those you&apos;ve guided in the past.
        </p>
      </header>

      {/* ── Stats strip ── */}
      <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
        {[
          { value: activeStudents.length + pastStudents.length, label: "Total Students", sub: "All Time" },
          { value: activeStudents.length, label: "Active",  sub: "Currently Mentoring" },
          { value: pastStudents.length,   label: "Alumni",  sub: "Completed Sessions" },
        ].map(({ value, label, sub }) => (
          <div key={label} style={{
            padding: "1.25rem 1.75rem",
            border: "1px solid rgba(250, 250, 249, 0.07)",
            borderRadius: "14px",
            background: "rgba(250, 250, 249, 0.025)",
            display: "flex", flexDirection: "column", gap: "0.35rem", minWidth: "9rem",
          }}>
            <span className="font-display" style={{ fontSize: "2rem", fontWeight: 900, color: "#fafaf9", letterSpacing: "-0.04em", lineHeight: 1 }}>
              {value}
            </span>
            <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "rgba(250, 250, 249, 0.65)", fontFamily: "var(--font-sans)" }}>{label}</div>
            <div style={{ fontSize: "0.52rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(250, 250, 249, 0.22)", fontFamily: "var(--font-mono, monospace)" }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* ── Hairline ── */}
      <div style={{ height: "1px", background: "rgba(250, 250, 249, 0.06)" }} />

      {/* ── Empty state ── */}
      {activeStudents.length === 0 && pastStudents.length === 0 && (
        <div style={{
          border: "1px dashed rgba(250, 250, 249, 0.08)", borderRadius: "16px",
          padding: "5rem 2rem", textAlign: "center",
          display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem",
        }}>
          <div style={{
            width: "3.5rem", height: "3.5rem", borderRadius: "50%",
            background: "rgba(250, 250, 249, 0.04)", border: "1px solid rgba(250, 250, 249, 0.08)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Users size={20} color="rgba(250, 250, 249, 0.3)" />
          </div>
          <div>
            <h3 className="font-display" style={{ fontSize: "1.3rem", fontWeight: 700, color: "rgba(250, 250, 249, 0.7)", marginBottom: "0.5rem", letterSpacing: "-0.02em" }}>
              No students yet
            </h3>
            <p style={{ fontSize: "0.82rem", color: "rgba(250, 250, 249, 0.32)", maxWidth: "26rem", lineHeight: 1.7, fontFamily: "var(--font-sans)" }}>
              Students will appear here once you accept their mentorship requests.
              Head to the dashboard to review your pending queue.
            </p>
          </div>
          <Link href="/prof/dashboard" style={{ textDecoration: "none" }}>
            <div style={{
              padding: "0.8rem 1.85rem", border: "1px solid rgba(250, 250, 249, 0.15)",
              borderRadius: "100px", fontSize: "0.58rem", fontWeight: 700,
              letterSpacing: "0.22em", textTransform: "uppercase",
              color: "rgba(250, 250, 249, 0.7)", fontFamily: "var(--font-sans)", cursor: "pointer",
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
            <span style={{ width: "1rem", height: "1px", background: "rgba(250, 250, 249, 0.2)", display: "block" }} />
            <h2 className="font-display" style={{ fontSize: "1.1rem", fontWeight: 700, color: "rgba(250, 250, 249, 0.85)", letterSpacing: "-0.02em" }}>
              Currently Mentoring
            </h2>
            <span style={{ marginLeft: "auto", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(250, 250, 249, 0.25)", fontFamily: "var(--font-mono, monospace)" }}>
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
            <span style={{ width: "1rem", height: "1px", background: "rgba(250, 250, 249, 0.2)", display: "block" }} />
            <h2 className="font-display" style={{ fontSize: "1.1rem", fontWeight: 700, color: "rgba(250, 250, 249, 0.45)", letterSpacing: "-0.02em" }}>
              Alumni
            </h2>
            <span style={{ marginLeft: "auto", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(250, 250, 249, 0.15)", fontFamily: "var(--font-mono, monospace)" }}>
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

function StudentRow({ req, status }: { req: any; status: "active" | "closed" }) {
  const student     = req.student;
  const displayName = student?.preferred_name || student?.first_name || "Student";
  const initials    = `${student?.first_name?.[0] ?? ""}${student?.last_name?.[0] ?? ""}`.toUpperCase();
  const isActive    = status === "active";

  return (
    <Link href={`/messages/${req.id}`} style={{ textDecoration: "none" }}>
      <div style={{
        display: "flex", alignItems: "center", gap: "1.25rem",
        padding: "1.25rem 1.5rem",
        border: "1px solid rgba(250, 250, 249, 0.07)",
        borderRadius: "14px",
        background: "rgba(250, 250, 249, 0.025)",
        cursor: "pointer", transition: "border-color 0.2s, background 0.2s",
      }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.borderColor = "rgba(250, 250, 249, 0.14)";
          (e.currentTarget as HTMLElement).style.background  = "rgba(250, 250, 249, 0.04)";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.borderColor = "rgba(250, 250, 249, 0.07)";
          (e.currentTarget as HTMLElement).style.background  = "rgba(250, 250, 249, 0.025)";
        }}
      >
        {/* Avatar */}
        <div style={{
          width: "2.75rem", height: "2.75rem", borderRadius: "50%", flexShrink: 0,
          background: "rgba(250, 250, 249, 0.05)", border: "1px solid rgba(250, 250, 249, 0.1)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "0.78rem", fontWeight: 600, color: "rgba(250, 250, 249, 0.6)",
          fontFamily: "var(--font-sans)",
        }}>
          {initials || "?"}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "rgba(250, 250, 249, 0.85)", fontFamily: "var(--font-sans)", marginBottom: "0.2rem" }}>
            {displayName} {student?.last_name}
          </div>
          <div style={{ fontSize: "0.65rem", color: "rgba(250, 250, 249, 0.35)", fontFamily: "var(--font-sans)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {req.topic || "No topic specified"}
          </div>
        </div>

        {/* Institution */}
        {student?.institution && (
          <div style={{
            display: "none", // visible on larger screens via inline override is complex; keep simple
            fontSize: "0.62rem", color: "rgba(250, 250, 249, 0.28)",
            fontFamily: "var(--font-sans)",
          }} className="hidden sm:block">
            {student.institution}
          </div>
        )}

        {/* Latest activity */}
        {req.latest && (
          <div style={{ flexShrink: 0, textAlign: "right" }}>
            <div style={{ fontSize: "0.58rem", color: "rgba(250, 250, 249, 0.2)", fontFamily: "var(--font-sans)" }}>
              {new Date(req.latest.created_at).toLocaleDateString()}
            </div>
          </div>
        )}

        {/* Status dot + Open thread button */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: isActive ? "rgba(120,220,120,0.8)" : "rgba(250, 250, 249, 0.2)" }} />
            <span style={{ fontSize: "0.48rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: isActive ? "rgba(250, 250, 249, 0.4)" : "rgba(250, 250, 249, 0.18)", fontFamily: "var(--font-mono, monospace)" }}>
              {isActive ? "Active" : "Closed"}
            </span>
          </div>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: "2rem", height: "2rem", borderRadius: "8px",
            border: "1px solid rgba(250, 250, 249, 0.1)", background: "rgba(250, 250, 249, 0.04)",
          }}>
            <MessageSquare size={12} color="rgba(250, 250, 249, 0.4)" />
          </div>
        </div>
      </div>
    </Link>
  );
}
