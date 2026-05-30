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
      padding: "2rem",
      border: "1px solid rgba(37, 99, 235, 0.08)",
      borderRadius: "14px",
      background: "rgba(37, 99, 235, 0.03)",
      display: "flex", flexDirection: "column", gap: "0.5rem",
    }}>
      <span className="font-display" style={{
        fontSize: "2.8rem", fontWeight: 900, color: "var(--text-primary)",
        letterSpacing: "-0.04em", lineHeight: 1,
      }}>
        {value}
      </span>
      <div>
        <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "rgba(15, 23, 42, 0.6)", fontFamily: "var(--font-sans)" }}>
          {label}
        </div>
        <div style={{ fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(37, 99, 235, 0.3)", fontFamily: "var(--font-sans, monospace)", marginTop: "0.2rem" }}>
          {sub}
        </div>
      </div>
    </div>
  );
}

function QuickAction({ href, title, sub, icon }: { href: string; title: string; sub: string; icon: React.ReactNode }) {
  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      <div className="quick-action-card" style={{
        padding: "1.5rem",
        border: "1px solid rgba(37, 99, 235, 0.08)",
        borderRadius: "14px",
        background: "var(--bg-surface-2)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        cursor: "pointer",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{
            width: "2.4rem", height: "2.4rem", borderRadius: "10px",
            background: "rgba(37, 99, 235, 0.06)", border: "1px solid rgba(37, 99, 235, 0.15)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            {icon}
          </div>
          <div>
            <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "rgba(15, 23, 42, 0.85)", fontFamily: "var(--font-sans)", marginBottom: "0.2rem" }}>
              {title}
            </div>
            <div style={{ fontSize: "0.62rem", color: "rgba(15, 23, 42, 0.35)", fontFamily: "var(--font-sans)" }}>
              {sub}
            </div>
          </div>
        </div>
        <ArrowRight size={14} color="rgba(15, 23, 42, 0.25)" style={{ flexShrink: 0 }} />
      </div>
    </Link>
  );
}

function StepItem({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <div style={{ display: "flex", gap: "1.25rem" }}>
      <div style={{
        width: "1.75rem", height: "1.75rem", borderRadius: "50%", flexShrink: 0,
        border: "1px solid rgba(37, 99, 235, 0.15)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "0.58rem", fontWeight: 700, color: "rgba(15, 23, 42, 0.45)",
        fontFamily: "var(--font-sans, monospace)", marginTop: "0.1rem",
      }}>
        {n}
      </div>
      <div>
        <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "rgba(15, 23, 42, 0.8)", fontFamily: "var(--font-sans)", marginBottom: "0.3rem" }}>
          {title}
        </div>
        <div style={{ fontSize: "0.76rem", color: "rgba(15, 23, 42, 0.38)", fontFamily: "var(--font-sans)", lineHeight: 1.6 }}>
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
    <div style={{ display: "flex", flexDirection: "column", gap: "8rem" }}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <header style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ width: "1.5rem", height: "1px", background: "rgba(15, 23, 42, 0.2)", display: "block" }} />
          <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(15, 23, 42, 0.3)", fontFamily: "var(--font-sans, monospace)" }}>
            Student Portal
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "2rem", flexWrap: "wrap" }}>
          <h1 className="font-display" style={{ fontSize: "clamp(2.6rem, 5vw, 4rem)", fontWeight: 900, color: "var(--text-primary)", letterSpacing: "-0.035em", lineHeight: 1.05 }}>
            Welcome back,{" "}
            <em style={{ fontStyle: "italic", color: "rgba(15, 23, 42, 0.35)" }}>{displayName}</em>
          </h1>
        </div>
        <p style={{ fontSize: "0.95rem", color: "rgba(15, 23, 42, 0.4)", fontWeight: 300, maxWidth: "42rem", lineHeight: 1.8, fontFamily: "var(--font-sans)", marginTop: "0.25rem" }}>
          Track your mentorship requests and active research dialogues below.
        </p>
      </header>

      {activeCount > 0 && <FeedbackPrompt />}

      {/* ── Stats row ──────────────────────────────────────────── */}
      <div className="dash-stat-grid">
        <StatCard value={totalRequests} label="Total Requests" sub="Lifetime"  />
        <StatCard value={activeCount}   label="Active Threads" sub="Ongoing"   />
        <StatCard value={pendingCount}  label="Awaiting Reply" sub="Pending"   />
      </div>

      {/* ── Hairline ───────────────────────────────────────────── */}
      <div style={{ height: "1px", background: "rgba(37, 99, 235, 0.07)" }} />

      {/* ── Two-column body ────────────────────────────────────── */}
      <div className="dash-two-col">

        {/* Left: quick actions + how it works */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>

          {/* Quick actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{ width: "1rem", height: "1px", background: "rgba(15, 23, 42, 0.2)", display: "block" }} />
              <h2 className="font-display" style={{ fontSize: "1.2rem", fontWeight: 700, color: "rgba(15, 23, 42, 0.75)", letterSpacing: "-0.025em" }}>
                Quick Actions
              </h2>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              <QuickAction
                href="/professors"
                title="Browse Mentors"
                sub={requestsToday >= 5 ? "Daily limit reached (5/5)" : `${requestsToday} of 5 requests used today`}
                icon={<Search size={14} color="rgba(15, 23, 42, 0.5)" />}
              />
              <QuickAction
                href="/profile"
                title="Your Profile"
                sub="Edit name & institution"
                icon={<User size={14} color="rgba(15, 23, 42, 0.5)" />}
              />
            </div>
          </div>

          {/* Hairline */}
          <div style={{ height: "1px", background: "rgba(37, 99, 235, 0.07)" }} />

          {/* How it works */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{ width: "1rem", height: "1px", background: "rgba(15, 23, 42, 0.2)", display: "block" }} />
              <h2 className="font-display" style={{ fontSize: "1.2rem", fontWeight: 700, color: "rgba(15, 23, 42, 0.75)", letterSpacing: "-0.025em" }}>
                How It Works
              </h2>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <StepItem n={1} title="Browse the directory" desc="Find professors by discipline, institution, or name." />
              <StepItem n={2} title="Send a focused request" desc="Describe your research question or learning goal clearly." />
              <StepItem n={3} title="Begin your dialogue" desc="Once accepted, your thread opens for ongoing mentorship." />
            </div>
          </div>
        </div>

        {/* Right: threads */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{ width: "1rem", height: "1px", background: "rgba(15, 23, 42, 0.2)", display: "block" }} />
              <h2 className="font-display" style={{ fontSize: "1.2rem", fontWeight: 700, color: "rgba(15, 23, 42, 0.85)", letterSpacing: "-0.025em" }}>
                Your Threads
              </h2>
            </div>
            {!isEmpty && (
              <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(15, 23, 42, 0.25)", fontFamily: "var(--font-sans, monospace)" }}>
                {totalRequests} total
              </span>
            )}
          </div>

          {isEmpty ? (
            <div style={{ border: "1px dashed rgba(37, 99, 235, 0.12)", borderRadius: "16px", padding: "4rem 2rem", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "1.25rem" }}>
              <div style={{ width: "3rem", height: "3rem", borderRadius: "50%", background: "rgba(37, 99, 235, 0.05)", border: "1px solid rgba(37, 99, 235, 0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <BookOpen size={18} color="rgba(15, 23, 42, 0.3)" />
              </div>
              <div>
                <h3 className="font-display" style={{ fontSize: "1.2rem", fontWeight: 700, color: "rgba(15, 23, 42, 0.7)", marginBottom: "0.5rem", letterSpacing: "-0.02em" }}>
                  Find your first research mentor
                </h3>
                <p style={{ fontSize: "0.8rem", color: "rgba(15, 23, 42, 0.32)", maxWidth: "24rem", lineHeight: 1.7, fontFamily: "var(--font-sans)" }}>
                  Connect with verified faculty members. Your active mentorship threads will appear here.
                </p>
              </div>
              <Link href="/professors" style={{ textDecoration: "none", marginTop: "0.25rem" }}>
                <div style={{ padding: "0.75rem 1.75rem", border: "1px solid rgba(37, 99, 235, 0.25)", borderRadius: "100px", fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--accent)", fontFamily: "var(--font-sans)", cursor: "pointer" }}>
                  Find a Mentor &rarr;
                </div>
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "3rem" }}>
              {/* Ongoing Threads */}
              {processedRequests.filter((r: any) => r.status !== "closed").length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.25rem" }}>
                  {processedRequests.filter((r: any) => r.status !== "closed").map((req: any) => (
                    <ThreadCard key={req.id} request={req} viewerRole="student" hasUnread={req.hasUnread} />
                  ))}
                </div>
              )}

              {/* Closed Threads */}
              {processedRequests.filter((r: any) => r.status === "closed").length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{ width: "1rem", height: "1px", background: "rgba(15, 23, 42, 0.2)", display: "block" }} />
                    <h2 className="font-display" style={{ fontSize: "1.2rem", fontWeight: 700, color: "rgba(15, 23, 42, 0.5)", letterSpacing: "-0.025em" }}>
                      Past Mentorships
                    </h2>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.25rem", opacity: 0.8 }}>
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
