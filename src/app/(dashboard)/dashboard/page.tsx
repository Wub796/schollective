import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { ThreadCard } from "@/components/features/ThreadCard";
import { FeedbackPrompt } from "@/components/features/FeedbackPrompt";
import { PlusCircle, BookOpen, MessageSquare, Search, ArrowRight, User } from "lucide-react";

export const dynamic = "force-dynamic";

// ── Sub-components (server-safe, no "use client") ──────────────────────────

function StatCard({ value, label, sub }: { value: string | number; label: string; sub: string }) {
  return (
    <div style={{
      padding: "2.25rem 2.5rem",
      border: "1px solid rgba(99, 102, 241, 0.45)",
      borderRadius: "14px",
      background: "rgba(99, 102, 241, 0.12)",
      display: "flex", flexDirection: "column", gap: "0.5rem",
    }}>
      <span className="font-display" style={{ fontSize: "2.8rem", fontWeight: 900, color: "#0f172a", letterSpacing: "-0.04em", lineHeight: 1 }}>
        {value}
      </span>
      <div>
        <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#0f172a", fontFamily: "var(--font-sans)", lineHeight: 1.4 }}>
          {label}
        </div>
        <div style={{
          display: "inline-block", fontSize: "0.58rem", fontWeight: 800, letterSpacing: "0.2em",
          textTransform: "uppercase", color: "#0f172a", background: "#6366f1",
          padding: "0.25rem 0.75rem", borderRadius: "100px", marginTop: "0.5rem",
          fontFamily: "var(--font-sans, monospace)", border: "1px solid rgba(79, 70, 229, 0.6)"
        }}>
          {sub}
        </div>
      </div>
    </div>
  );
}

function QuickAction({ href, title, sub, icon }: { href: string; title: string; sub: string; icon: React.ReactNode }) {
  return (
    <Link href={href} className="no-underline">
      <div
        className="quick-action-card"
        style={{
          padding: "1.5rem 1.75rem",
          border: "1px solid rgba(99, 102, 241, 0.45)",
          borderRadius: "14px",
          background: "#ffffff",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          cursor: "pointer", transition: "all 0.2s cubic-bezier(0.22, 1, 0.36, 1)",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.02)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
          <div style={{
            width: "2.75rem", height: "2.75rem", borderRadius: "12px",
            background: "rgba(79, 70, 229, 0.1)", border: "1px solid rgba(79, 70, 229, 0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, color: "#4f46e5",
          }}>
            {icon}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#0f172a", fontFamily: "var(--font-sans)", lineHeight: 1.3 }}>
              {title}
            </div>
            <div style={{ fontSize: "0.7rem", color: "#475569", opacity: 0.75, fontFamily: "var(--font-sans)", lineHeight: 1.5 }}>
              {sub}
            </div>
          </div>
        </div>
        <ArrowRight size={16} style={{ color: "#4f46e5", flexShrink: 0, marginLeft: "1rem" }} />
      </div>
    </Link>
  );
}

function StepItem({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <div
      style={{
        padding: "1.25rem 1.5rem",
        borderRadius: "12px",
        border: "1px solid rgba(99, 102, 241, 0.35)",
        background: "rgba(255, 255, 255, 0.7)",
        display: "flex", gap: "1.25rem", alignItems: "flex-start",
      }}
    >
      <div style={{
        width: "2rem", height: "2rem", borderRadius: "50%",
        border: "2px solid #6366f1", background: "rgba(79, 70, 229, 0.25)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "0.68rem", fontWeight: 800, color: "#0f172a",
        fontFamily: "var(--font-sans, monospace)", flexShrink: 0, marginTop: "0.1rem",
      }}>
        {n}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
        <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#0f172a", fontFamily: "var(--font-sans)", lineHeight: 1.3 }}>
          {title}
        </div>
        <div style={{ fontSize: "0.78rem", color: "#475569", opacity: 0.78, fontFamily: "var(--font-sans)", lineHeight: 1.6 }}>
          {desc}
        </div>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default async function StudentDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  // Allow admins to preview as student
  const cookieStore = await cookies();
  const isAdminPreviewing = profile.role === "admin" && cookieStore.get("x-admin-view-as")?.value === "student";

  if (!isAdminPreviewing && profile.role !== "student") {
    redirect(profile.role === "admin" ? "/admin/dashboard" : "/prof/dashboard");
  }

  const displayName = profile.preferred_name || profile.first_name || "Scholar";

  const { data: requests } = await supabase
    .from("requests")
    .select(`
      id, status, topic, updated_at,
      professor:professor_id ( first_name, last_name, preferred_name, expertise ),
      messages ( content, created_at, read_at, sender_id )
    `)
    .eq("student_id", user.id)
    .order("updated_at", { ascending: false });

  // Query 24-hour rate limit count for the dashboard indicator
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count: requestsTodayCount } = await supabase
    .from("requests")
    .select("id", { count: "exact", head: true })
    .eq("student_id", user.id)
    .gt("created_at", twentyFourHoursAgo);

  const requestsToday = requestsTodayCount || 0;

  const processedRequests = (requests || []).map((req: any) => {
    const prof = Array.isArray(req.professor) ? req.professor[0] : req.professor;
    return {
      ...req,
      participant: {
        first_name: prof?.first_name ?? "Unknown",
        last_name:  prof?.last_name  ?? null,
        preferred_name: prof?.preferred_name ?? null,
        detail: prof?.expertise ?? "Professor",
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

  const totalRequests = processedRequests.length;
  const activeCount   = processedRequests.filter((r: any) => r.status === "active").length;
  const pendingCount  = processedRequests.filter((r: any) => r.status === "pending" || r.status === "viewed").length;
  const isEmpty       = totalRequests === 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "3.5rem" }}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <header style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ width: "1.5rem", height: "2px", background: "#6366f1", display: "block" }} />
          <span style={{
            fontSize: "0.62rem", fontWeight: 800, letterSpacing: "0.22em",
            textTransform: "uppercase", color: "#4f46e5", fontFamily: "var(--font-sans, monospace)",
          }}>
            Student Portal
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "2rem", flexWrap: "wrap" }}>
          <h1 className="font-display" style={{
            fontSize: "clamp(2.4rem, 4.5vw, 3.6rem)", fontWeight: 900,
            color: "#0f172a", letterSpacing: "-0.035em", lineHeight: 1.1,
          }}>
            Welcome back,{" "}
            <em style={{ fontStyle: "italic", color: "#4f46e5", fontWeight: 300 }}>{displayName}</em>
          </h1>
        </div>
        <p style={{
          fontSize: "0.95rem", color: "#475569", opacity: 0.75, fontWeight: 400,
          maxWidth: "42rem", lineHeight: 1.8, fontFamily: "var(--font-sans)", marginTop: "0.25rem",
        }}>
          Track your mentorship requests and active research dialogues below.
        </p>
      </header>

      {activeCount > 0 && <FeedbackPrompt />}

      {/* ── Stats row ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard value={totalRequests} label="Total Requests" sub="Lifetime"  />
        <StatCard value={activeCount}   label="Active Threads" sub="Ongoing"   />
        <StatCard value={pendingCount}  label="Awaiting Reply" sub="Pending"   />
      </div>

      {/* ── Hairline ───────────────────────────────────────────── */}
      <div style={{ height: "1px", background: "rgba(99, 102, 241, 0.4)" }} />

      {/* ── Two-column body ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-10 items-start">

        {/* Left: quick actions + how it works */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>

          {/* Quick actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{ width: "1rem", height: "2px", background: "#6366f1", display: "block" }} />
              <h2 className="font-display" style={{ fontSize: "1.2rem", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.025em" }}>
                Quick Actions
              </h2>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <QuickAction
                href="/professors"
                title="Browse Mentors"
                sub={requestsToday >= 5 ? "Daily limit reached (5/5)" : `${requestsToday} of 5 requests used today`}
                icon={<Search size={16} />}
              />
              <QuickAction
                href="/profile"
                title="Your Profile"
                sub="Edit name & institution"
                icon={<User size={16} />}
              />
            </div>
          </div>

          {/* Hairline */}
          <div style={{ height: "1px", background: "rgba(99, 102, 241, 0.4)" }} />

          {/* How it works */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{ width: "1rem", height: "2px", background: "#6366f1", display: "block" }} />
              <h2 className="font-display" style={{ fontSize: "1.2rem", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.025em" }}>
                How It Works
              </h2>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <StepItem n={1} title="Browse the directory" desc="Find professors by discipline, institution, or name." />
              <StepItem n={2} title="Send a focused request" desc="Describe your research question or learning goal clearly." />
              <StepItem n={3} title="Begin your dialogue" desc="Once accepted, your thread opens for ongoing mentorship." />
            </div>
          </div>
        </div>

        {/* Right: threads */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{ width: "1rem", height: "2px", background: "#6366f1", display: "block" }} />
              <h2 className="font-display" style={{ fontSize: "1.2rem", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.025em" }}>
                Your Threads
              </h2>
            </div>
            {!isEmpty && (
              <span style={{
                fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.22em",
                textTransform: "uppercase", color: "#0f172a", background: "rgba(79, 70, 229, 0.35)",
                padding: "0.3rem 0.8rem", borderRadius: "100px", fontFamily: "var(--font-sans, monospace)"
              }}>
                {totalRequests} total
              </span>
            )}
          </div>

          {isEmpty ? (
            <div style={{
              border: "1px dashed rgba(99, 102, 241, 0.6)",
              borderRadius: "16px", padding: "3.5rem 2rem", textAlign: "center",
              display: "flex", flexDirection: "column", alignItems: "center", gap: "1.25rem",
              background: "rgba(255, 255, 255, 0.7)",
            }}>
              <div style={{
                width: "3.5rem", height: "3.5rem", borderRadius: "50%",
                background: "rgba(79, 70, 229, 0.25)", border: "1px solid rgba(79, 70, 229, 0.5)",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <BookOpen size={20} style={{ color: "#0f172a" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <h3 className="font-display" style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em" }}>
                  Find your first research mentor
                </h3>
                <p style={{ fontSize: "0.82rem", color: "#475569", opacity: 0.75, maxWidth: "24rem", lineHeight: 1.7, fontFamily: "var(--font-sans)", margin: "0 auto" }}>
                  Connect with verified faculty members. Your active mentorship threads will appear here.
                </p>
              </div>
              <Link href="/professors" style={{ marginTop: "0.5rem", textDecoration: "none" }}>
                <div style={{
                  padding: "0.8rem 2rem", border: "2px solid #4f46e5", background: "#4f46e5",
                  borderRadius: "100px", fontSize: "0.65rem", fontWeight: 800,
                  letterSpacing: "0.18em", textTransform: "uppercase", color: "#ffffff",
                  fontFamily: "var(--font-sans)", cursor: "pointer", boxShadow: "0 4px 14px rgba(79, 70, 229, 0.25)"
                }}>
                  Find a Mentor &rarr;
                </div>
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              {/* Ongoing Threads */}
              {processedRequests.filter((r: any) => r.status !== "closed").length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {processedRequests.filter((r: any) => r.status !== "closed").map((req: any) => (
                    <ThreadCard key={req.id} request={req} viewerRole="student" hasUnread={req.hasUnread} />
                  ))}
                </div>
              )}

              {/* Closed Threads */}
              {processedRequests.filter((r: any) => r.status === "closed").length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{ width: "1rem", height: "2px", background: "#818cf8", display: "block" }} />
                    <h2 className="font-display" style={{ fontSize: "1.2rem", fontWeight: 700, color: "#0f172a", opacity: 0.6, letterSpacing: "-0.025em" }}>
                      Past Mentorships
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 opacity-80">
                    {processedRequests.filter((r: any) => r.status === "closed").map((req: any) => (
                      <ThreadCard key={req.id} request={req} viewerRole="student" hasUnread={req.hasUnread} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
