import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { ThreadCard } from "@/components/features/ThreadCard";
import { RequestQueueCard } from "@/components/features/RequestQueueCard";
import { AcceptingToggle } from "@/components/features/AcceptingToggle";
import { Inbox, Clock } from "lucide-react";


export const dynamic = "force-dynamic";

function StatCard({ value, label, sub }: { value: string | number; label: string; sub: string }) {
  return (
    <div style={{
      padding: "1.5rem",
      border: "1px solid rgba(129, 140, 248, 0.1)",
      borderRadius: "14px",
      background: "rgba(17, 17, 19, 0.5)",
      display: "flex", flexDirection: "column", gap: "0.5rem",
    }}>
      <span className="font-display" style={{ fontSize: "2.4rem", fontWeight: 900, color: "#fafaf9", letterSpacing: "-0.04em", lineHeight: 1 }}>
        {value}
      </span>
      <div>
        <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "rgba(250, 250, 249, 0.7)", fontFamily: "var(--font-sans)" }}>{label}</div>
        <div style={{ fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(250, 250, 249, 0.25)", fontFamily: "var(--font-mono, monospace)", marginTop: "0.2rem" }}>
          {sub}
        </div>
      </div>
    </div>
  );
}

export default async function ProfessorDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  // Allow admins to preview as professor
  const cookieStore = await cookies();
  const isAdminPreviewing = profile.role === "admin" && cookieStore.get("x-admin-view-as")?.value === "professor";

  if (!isAdminPreviewing && profile.role !== "professor") {
    redirect(profile?.role === "admin" ? "/admin/dashboard" : "/dashboard");
  }
  // Skip status check for admin previewing
  if (!isAdminPreviewing && profile.status !== "approved") redirect("/prof/pending");

  const isAccepting = profile.is_accepting_requests !== false; // default true

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

  const closedRequests = (allRequests || [])
    .filter((r) => r.status === "closed")
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
    <div style={{ display: "flex", flexDirection: "column", gap: "4rem" }}>

      {/* ── Header ──────────────────────────────────────────────── */}
      <header style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ width: "1.5rem", height: "1px", background: "rgba(250, 250, 249, 0.2)", display: "block" }} />
          <span style={{
            fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.38em",
            textTransform: "uppercase", color: "rgba(250, 250, 249, 0.3)",
            fontFamily: "var(--font-mono, monospace)",
          }}>
            Faculty Portal
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "2rem", flexWrap: "wrap" }}>
          <h1 className="font-display" style={{
            fontSize: "clamp(2.4rem, 5vw, 3.8rem)", fontWeight: 900,
            color: "#fafaf9", letterSpacing: "-0.035em", lineHeight: 1.05,
          }}>
            Dr. <em style={{ fontStyle: "italic", color: "rgba(250, 250, 249, 0.35)" }}>{displayName}</em>
          </h1>

          {/* DB-backed availability toggle */}
          <AcceptingToggle initialValue={isAccepting} />
        </div>

        <p style={{
          fontSize: "0.9rem", color: "rgba(250, 250, 249, 0.4)", fontWeight: 300,
          maxWidth: "42rem", lineHeight: 1.7, fontFamily: "var(--font-sans)", marginTop: "0.25rem",
        }}>
          Manage your student mentorship pipeline and active research dialogues.
        </p>
      </header>

      {/* ── Stats row ──────────────────────────────────────────── */}
      <div className="dash-stat-grid">
        <StatCard value={allRequests?.length || 0} label="Total Requests" sub="Lifetime" />
        <StatCard value={activeThreads.length}     label="Active Dialogues" sub="Ongoing" />
        <StatCard value={pendingRequests.length}   label="Pending Approval" sub="In Queue" />
      </div>

      {/* ── Hairline ─────────────────────────────────────────────── */}
      <div style={{ height: "1px", background: "rgba(129, 140, 248, 0.07)" }} />

      {/* ── Stacked Layout ─────────────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "4rem" }}>

        {/* ── Request Queue ─────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ width: "1rem", height: "1px", background: "rgba(250, 250, 249, 0.2)", display: "block" }} />
            <h2 className="font-display" style={{ fontSize: "1.1rem", fontWeight: 700, color: "rgba(250, 250, 249, 0.85)", letterSpacing: "-0.02em" }}>
              Request Queue
            </h2>
            <span style={{
              marginLeft: "auto",
              fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.25em",
              textTransform: "uppercase", color: "rgba(250, 250, 249, 0.25)",
              fontFamily: "var(--font-mono, monospace)",
            }}>
              {pendingRequests.length} pending
            </span>
          </div>

          {pendingRequests.length === 0 ? (
            <div style={{
              border: "1px dashed rgba(129, 140, 248, 0.1)",
              borderRadius: "16px", padding: "2.5rem 1.5rem", textAlign: "center",
            }}>
              <Inbox size={20} color="rgba(250, 250, 249, 0.2)" style={{ margin: "0 auto 0.75rem" }} />
              <p style={{ fontSize: "0.78rem", color: "rgba(250, 250, 249, 0.3)", fontStyle: "italic", fontFamily: "var(--font-sans)" }}>
                No pending requests
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "1.25rem" }}>
              {pendingRequests.map((req) => (
                <RequestQueueCard key={req.id} request={req as any} />
              ))}
            </div>
          )}
        </div>

        {/* ── Active Threads ───────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ width: "1rem", height: "1px", background: "rgba(250, 250, 249, 0.2)", display: "block" }} />
            <h2 className="font-display" style={{ fontSize: "1.1rem", fontWeight: 700, color: "rgba(250, 250, 249, 0.85)", letterSpacing: "-0.02em" }}>
              Active Mentorships
            </h2>
            <span style={{
              marginLeft: "auto",
              fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.25em",
              textTransform: "uppercase", color: "rgba(250, 250, 249, 0.25)",
              fontFamily: "var(--font-mono, monospace)",
            }}>
              {activeThreads.length} active
            </span>
          </div>

          {activeThreads.length === 0 ? (
            <div style={{
              border: "1px dashed rgba(129, 140, 248, 0.1)",
              borderRadius: "16px", padding: "4rem 2rem", textAlign: "center",
              display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem",
            }}>
              <Clock size={20} color="rgba(250, 250, 249, 0.2)" />
              <div>
                <h3 className="font-display" style={{ fontSize: "1.2rem", fontWeight: 700, color: "rgba(250, 250, 249, 0.6)", marginBottom: "0.4rem", letterSpacing: "-0.02em" }}>
                  No active dialogues
                </h3>
                <p style={{ fontSize: "0.78rem", color: "rgba(250, 250, 249, 0.3)", maxWidth: "22rem", lineHeight: 1.7, fontFamily: "var(--font-sans)" }}>
                  Once you accept a request, it will appear here as an active mentorship thread.
                </p>
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "1.25rem" }}>
              {activeThreads.map((req) => (
                <ThreadCard key={req.id} request={req as any} viewerRole="professor" />
              ))}
            </div>
          )}
        </div>

        {/* ── Past Mentorships ─────────────────────────────────── */}
        {closedRequests.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{ width: "1rem", height: "1px", background: "rgba(250, 250, 249, 0.2)", display: "block" }} />
              <h2 className="font-display" style={{ fontSize: "1.1rem", fontWeight: 700, color: "rgba(250, 250, 249, 0.5)", letterSpacing: "-0.02em" }}>
                Past Mentorships
              </h2>
              <span style={{
                marginLeft: "auto",
                fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.25em",
                textTransform: "uppercase", color: "rgba(250, 250, 249, 0.15)",
                fontFamily: "var(--font-mono, monospace)",
              }}>
                {closedRequests.length} closed
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "1.25rem", opacity: 0.8 }}>
              {closedRequests.map((req) => (
                <ThreadCard key={req.id} request={req as any} viewerRole="professor" />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
