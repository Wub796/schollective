import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { ThreadCard } from "@/components/features/ThreadCard";
import { RequestQueueCard } from "@/components/features/RequestQueueCard";
import { AcceptingToggle } from "@/components/features/AcceptingToggle";
import { Inbox, Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";


export const dynamic = "force-dynamic";

function StatCard({ value, label, sub }: { value: string | number; label: string; sub: string }) {
  return (
    <div style={{
      padding: "2rem",
      border: "1px solid rgba(37, 99, 235, 0.08)",
      borderRadius: "14px",
      background: "rgba(37, 99, 235, 0.03)",
      display: "flex", flexDirection: "column", gap: "0.5rem",
    }}>
      <span className="font-display" style={{ fontSize: "2.8rem", fontWeight: 900, color: "var(--text-primary)", letterSpacing: "-0.04em", lineHeight: 1 }}>
        {value}
      </span>
      <div>
        <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "rgba(15, 23, 42, 0.6)", fontFamily: "var(--font-sans)" }}>{label}</div>
        <div style={{ fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(37, 99, 235, 0.3)", fontFamily: "var(--font-sans, monospace)", marginTop: "0.2rem" }}>
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
      messages ( content, created_at, read_at, sender_id )
    `)
    .eq("professor_id", user.id)
    .order("created_at", { ascending: false });

  const pendingRequests = (allRequests || [])
    .filter((r) => r.status === "pending")
    .map((req: any) => {
      const student = Array.isArray(req.student) ? req.student[0] : req.student;
      return {
        ...req,
        student: student ?? { first_name: "Unknown", last_name: "", preferred_name: null, education_level: "" },
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
          first_name: student?.first_name ?? "Unknown",
          last_name: student?.last_name ?? "",
          preferred_name: student?.preferred_name ?? null,
          detail: student?.education_level?.replace("-", " "),
        },
        latest_message:
          req.messages?.length > 0
            ? [...req.messages].sort(
                (a: any, b: any) =>
                  new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              )[0]
            : undefined,
        hasUnread: req.messages?.some((msg: any) => msg.sender_id !== user.id && !msg.read_at),
      };
    });

  const closedRequests = (allRequests || [])
    .filter((r) => r.status === "closed")
    .map((req: any) => {
      const student = Array.isArray(req.student) ? req.student[0] : req.student;
      return {
        ...req,
        participant: {
          first_name: student?.first_name ?? "Unknown",
          last_name: student?.last_name ?? "",
          preferred_name: student?.preferred_name ?? null,
          detail: student?.education_level?.replace("-", " "),
        },
        latest_message:
          req.messages?.length > 0
            ? [...req.messages].sort(
                (a: any, b: any) =>
                  new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              )[0]
            : undefined,
        hasUnread: req.messages?.some((msg: any) => msg.sender_id !== user.id && !msg.read_at),
      };
    });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "5rem" }}>

      {/* ── Header ──────────────────────────────────────────────── */}
      <header style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ width: "1.5rem", height: "1px", background: "rgba(15, 23, 42, 0.2)", display: "block" }} />
          <span style={{
            fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.2em",
            textTransform: "uppercase", color: "rgba(15, 23, 42, 0.3)",
            fontFamily: "var(--font-sans, monospace)",
          }}>
            Faculty Portal
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "2rem", flexWrap: "wrap" }}>
          <h1 className="font-display" style={{
            fontSize: "clamp(2.6rem, 5vw, 4rem)", fontWeight: 900,
            color: "var(--text-primary)", letterSpacing: "-0.035em", lineHeight: 1.05,
          }}>
            Dr. <em style={{ fontStyle: "italic", color: "rgba(15, 23, 42, 0.35)" }}>{displayName}</em>
          </h1>

          {/* DB-backed availability toggle */}
          <AcceptingToggle initialValue={isAccepting} />
        </div>

        <p style={{
          fontSize: "0.95rem", color: "rgba(15, 23, 42, 0.4)", fontWeight: 300,
          maxWidth: "42rem", lineHeight: 1.8, fontFamily: "var(--font-sans)", marginTop: "0.25rem",
        }}>
          Manage your student mentorship pipeline and active research dialogues.
        </p>
      </header>

      {profile.profile_complete === false && (
        <div style={{
          padding: "1.75rem 2rem",
          border: "1px solid rgba(245, 158, 11, 0.2)",
          borderRadius: "14px",
          background: "rgba(245, 158, 11, 0.04)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "2rem",
          flexWrap: "wrap",
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", maxWidth: "32rem", textAlign: "left" }}>
            <h3 className="font-display" style={{ fontSize: "1.1rem", fontWeight: 700, color: "#d97706", display: "flex", alignItems: "center", gap: "0.5rem", margin: 0 }}>
              <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: "#f59e0b" }} />
              Your Profile is Incomplete
            </h3>
            <p style={{ fontSize: "0.82rem", color: "rgba(15, 23, 42, 0.5)", lineHeight: 1.6, fontFamily: "var(--font-sans)", margin: 0 }}>
              To receive outreach requests from students, you must complete your profile. Please add your first name, last name, institution, and at least one expertise field.
            </p>
          </div>
          <Button href="/profile" variant="outline" size="sm">
            Complete Profile
          </Button>
        </div>
      )}

      {/* ── Stats row ──────────────────────────────────────────── */}
      <div className="dash-stat-grid">
        <StatCard value={allRequests?.length || 0} label="Total Requests" sub="Lifetime" />
        <StatCard value={activeThreads.length}     label="Active Dialogues" sub="Ongoing" />
        <StatCard value={pendingRequests.length}   label="Pending Approval" sub="In Queue" />
      </div>

      {/* ── Hairline ─────────────────────────────────────────────── */}
      <div style={{ height: "1px", background: "rgba(37, 99, 235, 0.07)" }} />

      {/* ── Stacked Layout ─────────────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "5rem" }}>

        {/* ── Request Queue ─────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ width: "1rem", height: "1px", background: "rgba(15, 23, 42, 0.2)", display: "block" }} />
            <h2 className="font-display" style={{ fontSize: "1.2rem", fontWeight: 700, color: "rgba(15, 23, 42, 0.85)", letterSpacing: "-0.025em" }}>
              Request Queue
            </h2>
            <span style={{
              marginLeft: "auto",
              fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.2em",
              textTransform: "uppercase", color: "rgba(15, 23, 42, 0.25)",
              fontFamily: "var(--font-sans, monospace)",
            }}>
              {pendingRequests.length} pending
            </span>
          </div>

          {pendingRequests.length === 0 ? (
            <div style={{
              border: "1px dashed rgba(37, 99, 235, 0.1)",
              borderRadius: "16px", padding: "3rem 1.5rem", textAlign: "center",
            }}>
              <Inbox size={20} color="rgba(120, 220, 120, 0.4)" style={{ margin: "0 auto 0.75rem" }} />
              <h3 className="font-display" style={{ fontSize: "1rem", fontWeight: 700, color: "rgba(15, 23, 42, 0.7)", margin: "0 0 0.3rem" }}>
                You&apos;re all caught up!
              </h3>
              <p style={{ fontSize: "0.78rem", color: "rgba(15, 23, 42, 0.35)", fontFamily: "var(--font-sans)", margin: 0 }}>
                No pending mentorship requests in your queue.
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "1.5rem" }}>
              {pendingRequests.map((req) => (
                <RequestQueueCard key={req.id} request={req as any} />
              ))}
            </div>
          )}
        </div>

        {/* ── Active Threads ───────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ width: "1rem", height: "1px", background: "rgba(15, 23, 42, 0.2)", display: "block" }} />
            <h2 className="font-display" style={{ fontSize: "1.2rem", fontWeight: 700, color: "rgba(15, 23, 42, 0.85)", letterSpacing: "-0.025em" }}>
              Active Mentorships
            </h2>
            <span style={{
              marginLeft: "auto",
              fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.2em",
              textTransform: "uppercase", color: "rgba(15, 23, 42, 0.25)",
              fontFamily: "var(--font-sans, monospace)",
            }}>
              {activeThreads.length} active
            </span>
          </div>

          {activeThreads.length === 0 ? (
            <div style={{
              border: "1px dashed rgba(37, 99, 235, 0.1)",
              borderRadius: "16px", padding: "4rem 2rem", textAlign: "center",
              display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem",
            }}>
              <Clock size={20} color="rgba(15, 23, 42, 0.2)" />
              <div>
                <h3 className="font-display" style={{ fontSize: "1.2rem", fontWeight: 700, color: "rgba(15, 23, 42, 0.6)", marginBottom: "0.4rem", letterSpacing: "-0.02em" }}>
                  No active dialogues
                </h3>
                <p style={{ fontSize: "0.78rem", color: "rgba(15, 23, 42, 0.3)", maxWidth: "22rem", lineHeight: 1.7, fontFamily: "var(--font-sans)" }}>
                  Once you accept a request, it will appear here as an active mentorship thread.
                </p>
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "1.5rem" }}>
              {activeThreads.map((req) => (
                <ThreadCard key={req.id} request={req as any} viewerRole="professor" hasUnread={req.hasUnread} />
              ))}
            </div>
          )}
        </div>

        {/* ── Past Mentorships ─────────────────────────────────── */}
        {closedRequests.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{ width: "1rem", height: "1px", background: "rgba(15, 23, 42, 0.2)", display: "block" }} />
              <h2 className="font-display" style={{ fontSize: "1.2rem", fontWeight: 700, color: "rgba(15, 23, 42, 0.5)", letterSpacing: "-0.025em" }}>
                Past Mentorships
              </h2>
              <span style={{
                marginLeft: "auto",
                fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.2em",
                textTransform: "uppercase", color: "rgba(15, 23, 42, 0.15)",
                fontFamily: "var(--font-sans, monospace)",
              }}>
                {closedRequests.length} closed
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "1.5rem", opacity: 0.8 }}>
              {closedRequests.map((req) => (
                <ThreadCard key={req.id} request={req as any} viewerRole="professor" hasUnread={req.hasUnread} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
