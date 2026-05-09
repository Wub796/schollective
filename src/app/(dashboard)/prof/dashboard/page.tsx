import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { ThreadCard } from "@/components/features/ThreadCard";
import { RequestQueueCard } from "@/components/features/RequestQueueCard";
import { Inbox, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProfessorDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "professor") {
    redirect(profile?.role === "admin" ? "/admin/dashboard" : "/dashboard");
  }
  if (profile.status !== "approved") redirect("/prof/pending");

  const displayName = profile.preferred_name || profile.first_name || "Professor";

  const { data: allRequests } = await supabase
    .from("requests")
    .select(`
      id, status, topic, created_at, updated_at,
      student:student_id ( first_name, last_name, preferred_name, education_level ),
      messages ( content, created_at )
    `)
    .eq("professor_id", user.id)
    .order("created_at", { ascending: false });

  const pendingRequests = (allRequests || [])
    .filter((r) => r.status === "pending")
    .map((req: any) => {
      const student = Array.isArray(req.student) ? req.student[0] : req.student;
      return {
        ...req,
        student,
        initial_message:
          req.messages?.length > 0
            ? [...req.messages].sort(
                (a: any, b: any) =>
                  new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
              )[0].content
            : undefined,
      };
    });

  const activeThreads = (allRequests || [])
    .filter((r) => r.status === "active")
    .map((req: any) => {
      const student = Array.isArray(req.student) ? req.student[0] : req.student;
      return {
        ...req,
        participant: {
          first_name: student.first_name,
          last_name: student.last_name,
          preferred_name: student.preferred_name,
          detail: student.education_level?.replace("-", " "),
        },
        latest_message:
          req.messages?.length > 0
            ? [...req.messages].sort(
                (a: any, b: any) =>
                  new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              )[0]
            : undefined,
      };
    });

  return (
    <div style={{ padding: "3rem 0", display: "flex", flexDirection: "column", gap: "4rem" }}>

      {/* ── Header ──────────────────────────────────────────────── */}
      <header style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ width: "1.5rem", height: "1px", background: "rgba(255,255,255,0.2)", display: "block" }} />
          <span style={{
            fontSize: "0.5rem", fontWeight: 700, letterSpacing: "0.38em",
            textTransform: "uppercase", color: "rgba(255,255,255,0.3)",
            fontFamily: "var(--font-mono, monospace)",
          }}>
            Faculty Portal
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "2rem", flexWrap: "wrap" }}>
          <h1 className="font-display" style={{
            fontSize: "clamp(2.4rem, 5vw, 3.8rem)", fontWeight: 900,
            color: "#fff", letterSpacing: "-0.035em", lineHeight: 1.05,
          }}>
            Dr. <em style={{ fontStyle: "italic", color: "rgba(255,255,255,0.35)" }}>{displayName}</em>
          </h1>

          {/* Accepting badge */}
          <div style={{
            display: "flex", alignItems: "center", gap: "0.5rem",
            padding: "0.6rem 1.25rem",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "100px",
            background: "rgba(255,255,255,0.04)",
            flexShrink: 0,
          }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "rgba(120,220,120,0.8)", animation: "pulse 2s infinite" }} />
            <span style={{
              fontSize: "0.5rem", fontWeight: 700, letterSpacing: "0.22em",
              textTransform: "uppercase", color: "rgba(255,255,255,0.5)",
              fontFamily: "var(--font-mono, monospace)",
            }}>
              Accepting Requests
            </span>
          </div>
        </div>

        <p style={{
          fontSize: "0.9rem", color: "rgba(255,255,255,0.4)", fontWeight: 300,
          maxWidth: "42rem", lineHeight: 1.7, fontFamily: "var(--font-sans)", marginTop: "0.25rem",
        }}>
          Manage your student mentorship pipeline and active research dialogues.
        </p>
      </header>

      {/* ── Hairline ─────────────────────────────────────────────── */}
      <div style={{ height: "1px", background: "rgba(255,255,255,0.06)" }} />

      {/* ── Two-column layout ─────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "4rem", alignItems: "start" }}>

        {/* ── Request Queue ─────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ width: "1rem", height: "1px", background: "rgba(255,255,255,0.2)", display: "block" }} />
            <h2 className="font-display" style={{ fontSize: "1.1rem", fontWeight: 700, color: "rgba(255,255,255,0.85)", letterSpacing: "-0.02em" }}>
              Request Queue
            </h2>
            <span style={{
              marginLeft: "auto",
              fontSize: "0.5rem", fontWeight: 700, letterSpacing: "0.25em",
              textTransform: "uppercase", color: "rgba(255,255,255,0.25)",
              fontFamily: "var(--font-mono, monospace)",
            }}>
              {pendingRequests.length} pending
            </span>
          </div>

          {pendingRequests.length === 0 ? (
            <div style={{
              border: "1px dashed rgba(255,255,255,0.07)",
              borderRadius: "16px", padding: "2.5rem 1.5rem", textAlign: "center",
            }}>
              <Inbox size={20} color="rgba(255,255,255,0.2)" style={{ margin: "0 auto 0.75rem" }} />
              <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.3)", fontStyle: "italic", fontFamily: "var(--font-sans)" }}>
                No pending requests
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {pendingRequests.map((req) => (
                <RequestQueueCard key={req.id} request={req as any} />
              ))}
            </div>
          )}
        </div>

        {/* ── Active Threads ───────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ width: "1rem", height: "1px", background: "rgba(255,255,255,0.2)", display: "block" }} />
            <h2 className="font-display" style={{ fontSize: "1.1rem", fontWeight: 700, color: "rgba(255,255,255,0.85)", letterSpacing: "-0.02em" }}>
              Active Mentorships
            </h2>
            <span style={{
              marginLeft: "auto",
              fontSize: "0.5rem", fontWeight: 700, letterSpacing: "0.25em",
              textTransform: "uppercase", color: "rgba(255,255,255,0.25)",
              fontFamily: "var(--font-mono, monospace)",
            }}>
              {activeThreads.length} active
            </span>
          </div>

          {activeThreads.length === 0 ? (
            <div style={{
              border: "1px dashed rgba(255,255,255,0.07)",
              borderRadius: "16px", padding: "4rem 2rem", textAlign: "center",
              display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem",
            }}>
              <Clock size={20} color="rgba(255,255,255,0.2)" />
              <div>
                <h3 className="font-display" style={{ fontSize: "1.2rem", fontWeight: 700, color: "rgba(255,255,255,0.6)", marginBottom: "0.4rem", letterSpacing: "-0.02em" }}>
                  No active dialogues
                </h3>
                <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.3)", maxWidth: "22rem", lineHeight: 1.7, fontFamily: "var(--font-sans)" }}>
                  Once you accept a request, it will appear here as an active mentorship thread.
                </p>
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.25rem" }}>
              {activeThreads.map((req) => (
                <ThreadCard key={req.id} request={req as any} viewerRole="professor" />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
