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
    <div className="p-8 border border-blue-600/8 rounded-[14px] bg-blue-600/[0.03] flex flex-col gap-2">
      <span className="font-display text-[2.8rem] font-black text-[var(--text-primary)] tracking-[-0.04em] leading-none">
        {value}
      </span>
      <div>
        <div className="text-[0.78rem] font-semibold text-slate-900/60 font-sans">
          {label}
        </div>
        <div className="text-[0.6rem] font-semibold tracking-[0.2em] uppercase text-blue-600/30 font-sans mt-1">
          {sub}
        </div>
      </div>
    </div>
  );
}

function QuickAction({ href, title, sub, icon }: { href: string; title: string; sub: string; icon: React.ReactNode }) {
  return (
    <Link href={href} className="no-underline">
      <div className="quick-action-card p-6 border border-blue-600/8 rounded-[14px] bg-[var(--bg-surface-2)] flex items-center justify-between cursor-pointer transition-all duration-200 hover:border-blue-600/20 hover:shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-[2.4rem] h-[2.4rem] rounded-[10px] bg-blue-600/[0.06] border border-blue-600/15 flex items-center justify-center flex-shrink-0">
            {icon}
          </div>
          <div>
            <div className="text-[0.85rem] font-semibold text-slate-900/85 font-sans mb-1">
              {title}
            </div>
            <div className="text-[0.62rem] text-slate-900/35 font-sans">
              {sub}
            </div>
          </div>
        </div>
        <ArrowRight size={14} className="text-slate-900/25 flex-shrink-0" />
      </div>
    </Link>
  );
}

function StepItem({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <div className="flex gap-5">
      <div className="w-7 h-7 rounded-full flex-shrink-0 border border-blue-600/15 flex items-center justify-center text-[0.58rem] font-bold text-slate-900/45 font-mono mt-0.5">
        {n}
      </div>
      <div>
        <div className="text-[0.85rem] font-semibold text-slate-900/80 font-sans mb-1">
          {title}
        </div>
        <div className="text-[0.76rem] text-slate-900/38 font-sans leading-1.6">
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
    <div className="flex flex-col gap-32">

      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <span className="w-6 h-[1px] bg-slate-900/20 block" />
          <span className="text-[0.62rem] font-bold tracking-[0.2em] uppercase text-slate-900/30 font-sans">
            Student Portal
          </span>
        </div>
        <div className="flex items-end justify-between gap-8 flex-wrap">
          <h1 className="font-display text-[clamp(2.6rem,5vw,4rem)] font-black text-[var(--text-primary)] tracking-[-0.035em] leading-[1.05]">
            Welcome back,{" "}
            <em className="italic text-slate-900/35">{displayName}</em>
          </h1>
        </div>
        <p className="text-[0.95rem] text-slate-900/40 font-light max-w-[42rem] leading-1.8 font-sans mt-1">
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
      <div className="h-[1px] bg-blue-600/7" />

      {/* ── Two-column body ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-12 items-start">

        {/* Left: quick actions + how it works */}
        <div className="flex flex-col gap-10">

          {/* Quick actions */}
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <span className="w-4 h-[1px] bg-slate-900/20 block" />
              <h2 className="font-display text-[1.2rem] font-bold text-slate-900/75 tracking-[-0.025em]">
                Quick Actions
              </h2>
            </div>
            <div className="flex flex-col gap-2.5">
              <QuickAction
                href="/professors"
                title="Browse Mentors"
                sub={requestsToday >= 5 ? "Daily limit reached (5/5)" : `${requestsToday} of 5 requests used today`}
                icon={<Search size={14} className="text-slate-900/50" />}
              />
              <QuickAction
                href="/profile"
                title="Your Profile"
                sub="Edit name & institution"
                icon={<User size={14} className="text-slate-900/50" />}
              />
            </div>
          </div>

          {/* Hairline */}
          <div className="h-[1px] bg-blue-600/7" />

          {/* How it works */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <span className="w-4 h-[1px] bg-slate-900/20 block" />
              <h2 className="font-display text-[1.2rem] font-bold text-slate-900/75 tracking-[-0.025em]">
                How It Works
              </h2>
            </div>
            <div className="flex flex-col gap-6">
              <StepItem n={1} title="Browse the directory" desc="Find professors by discipline, institution, or name." />
              <StepItem n={2} title="Send a focused request" desc="Describe your research question or learning goal clearly." />
              <StepItem n={3} title="Begin your dialogue" desc="Once accepted, your thread opens for ongoing mentorship." />
            </div>
          </div>
        </div>

        {/* Right: threads */}
        <div className="flex flex-col gap-7">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-4 h-[1px] bg-slate-900/20 block" />
              <h2 className="font-display text-[1.2rem] font-bold text-slate-900/85 tracking-[-0.025em]">
                Your Threads
              </h2>
            </div>
            {!isEmpty && (
              <span className="text-[0.6rem] font-bold tracking-[0.28em] uppercase text-slate-900/25 font-mono">
                {totalRequests} total
              </span>
            )}
          </div>

          {isEmpty ? (
            <div className="border border-dashed border-blue-600/12 rounded-2xl py-16 px-8 text-center flex flex-col items-center gap-5">
              <div className="w-12 h-12 rounded-full bg-blue-600/5 border border-blue-600/12 flex items-center justify-center">
                <BookOpen size={18} className="text-slate-900/30" />
              </div>
              <div>
                <h3 className="font-display text-[1.2rem] font-bold text-slate-900/70 mb-2 tracking-[-0.02em]">
                  Find your first research mentor
                </h3>
                <p className="text-[0.8rem] text-slate-900/32 max-w-[24rem] leading-1.7 font-sans">
                  Connect with verified faculty members. Your active mentorship threads will appear here.
                </p>
              </div>
              <Link href="/professors" className="mt-1 no-underline">
                <div className="py-3 px-7 border border-blue-600/25 rounded-full text-[0.58rem] font-bold tracking-[0.22em] uppercase text-[var(--accent)] font-sans cursor-pointer transition-colors hover:bg-blue-600/5">
                  Find a Mentor &rarr;
                </div>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-12">
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
                <div className="flex flex-col gap-5">
                  <div className="flex items-center gap-3">
                    <span className="w-4 h-[1px] bg-slate-900/20 block" />
                    <h2 className="font-display text-[1.2rem] font-bold text-slate-900/50 tracking-[-0.025em]">
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
