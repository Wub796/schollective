import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { ThreadCard } from "@/components/features/ThreadCard";
import { RequestQueueCard } from "@/components/features/RequestQueueCard";
import { LayoutDashboard, MessageSquare, User, Settings, LogOut, Inbox, Clock } from "lucide-react";

export default async function ProfessorDashboard() {
  const supabase = await createClient();

  // 1. Authenticate Session
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/auth/login");

  // 2. Fetch Profile & Verification Status
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .single();

  if (!profile || profile.role !== "professor") redirect("/auth/login");
  
  // Middleware should handle this, but as a secondary guard:
  if (profile.status !== "approved") redirect("/prof/pending");

  const displayName = profile.preferred_name || profile.first_name || "Professor";

  // 3. Fetch All Requests
  const { data: allRequests } = await supabase
    .from("requests")
    .select(`
      id,
      status,
      topic,
      created_at,
      updated_at,
      student:student_id (
        first_name,
        last_name,
        preferred_name,
        education_level
      ),
      messages (
        content,
        created_at
      )
    `)
    .eq("professor_id", session.user.id)
    .order("created_at", { ascending: false });

  // 4. Split into Queues
  const pendingRequests = (allRequests || [])
    .filter(req => req.status === "pending")
    .map((req: any) => {
      const student = Array.isArray(req.student) ? req.student[0] : req.student;
      return {
        ...req,
        student,
        initial_message: req.messages && req.messages.length > 0 
          ? req.messages.sort((a: any, b: any) => 
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            )[0].content 
          : undefined
      };
    });

  const activeThreads = (allRequests || [])
    .filter(req => req.status === "active")
    .map((req: any) => {
      const student = Array.isArray(req.student) ? req.student[0] : req.student;
      return {
        ...req,
        participant: {
          first_name: student.first_name,
          last_name: student.last_name,
          preferred_name: student.preferred_name,
          detail: student.education_level?.replace('-', ' ')
        },
        latest_message: req.messages && req.messages.length > 0 
          ? req.messages.sort((a: any, b: any) => 
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )[0] 
          : undefined
      };
    });

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-[280px] bg-[rgba(11,22,40,0.95)] border-r border-[rgba(155,175,192,0.1)] flex flex-col fixed inset-y-0 z-50">
        <div className="p-10">
          <Link href="/" className="font-serif text-2xl text-[var(--ivory)] hover:opacity-80 transition-opacity">
            Schol<span className="text-[var(--amber)]">lective</span>
          </Link>
        </div>

        <nav className="flex-grow px-6 space-y-1">
          <Link href="/prof/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[rgba(212,146,42,0.08)] text-[var(--ivory)] border border-[rgba(212,146,42,0.2)]">
            <LayoutDashboard size={18} className="text-[var(--amber)]" />
            <span className="text-sm font-medium">Professor Portal</span>
          </Link>
          <Link href="/messages" className="flex items-center gap-3 px-4 py-3 rounded-xl text-[var(--text-muted)] hover:bg-[rgba(255,255,255,0.04)] hover:text-[var(--ivory)] transition-all">
            <MessageSquare size={18} />
            <span className="text-sm font-medium">All Messages</span>
          </Link>
          <Link href="/prof/profile" className="flex items-center gap-3 px-4 py-3 rounded-xl text-[var(--text-muted)] hover:bg-[rgba(255,255,255,0.04)] hover:text-[var(--ivory)] transition-all">
            <User size={18} />
            <span className="text-sm font-medium">My Profile</span>
          </Link>
          <Link href="/prof/settings" className="flex items-center gap-3 px-4 py-3 rounded-xl text-[var(--text-muted)] hover:bg-[rgba(255,255,255,0.04)] hover:text-[var(--ivory)] transition-all">
            <Settings size={18} />
            <span className="text-sm font-medium">Settings</span>
          </Link>
        </nav>

        <div className="p-6 border-t border-[rgba(155,175,192,0.05)]">
          <button className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-[var(--text-muted)] hover:bg-red-500/10 hover:text-red-400 transition-all">
            <LogOut size={18} />
            <span className="text-sm font-medium">Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow pl-[280px]">
        <div className="p-12 max-w-7xl mx-auto">
          
          {/* Header */}
          <header className="flex justify-between items-start mb-16 animate-in fade-in slide-in-from-top-4 duration-700">
            <div>
              <div className="text-[0.75rem] font-bold tracking-[0.15em] text-[var(--amber)] uppercase mb-2">Academic Dashboard</div>
              <h1 className="font-serif text-4xl font-light text-[var(--ivory)]">
                Welcome, Dr. <em className="italic text-[var(--amber-light)]">{displayName}</em>
              </h1>
              <p className="text-[var(--text-muted)] mt-2">Manage your student mentorship pipeline and active research dialogues.</p>
            </div>
            <div className="flex items-center gap-4 bg-[rgba(17,34,64,0.5)] border border-[rgba(212,146,42,0.15)] rounded-full px-5 py-2.5 backdrop-blur-md">
              <div className="w-2.5 h-2.5 rounded-full bg-[var(--sage-light)] animate-pulse"></div>
              <span className="text-xs font-medium text-[var(--ivory)] tracking-wide uppercase">Accepting Requests</span>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            
            {/* Left Column: Request Queue */}
            <div className="lg:col-span-1 space-y-8">
              <div className="flex items-center gap-3">
                <Inbox size={20} className="text-[var(--amber)]" />
                <h2 className="text-xl font-serif text-[var(--ivory)] font-light">Request Queue</h2>
                <span className="bg-[rgba(212,146,42,0.1)] text-[var(--amber-light)] text-[0.65rem] font-bold px-2 py-0.5 rounded-full border border-[var(--amber)]/20">
                  {pendingRequests.length}
                </span>
              </div>

              {pendingRequests.length === 0 ? (
                <div className="bg-[rgba(17,34,64,0.2)] border border-dashed border-[rgba(155,175,192,0.1)] rounded-3xl p-10 text-center">
                  <p className="text-[var(--text-muted)] text-sm italic">No pending requests at this time.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {pendingRequests.map(req => (
                    <RequestQueueCard key={req.id} request={req as any} />
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Active Threads */}
            <div className="lg:col-span-2 space-y-8">
              <div className="flex items-center gap-3">
                <Clock size={20} className="text-[var(--sage-light)]" />
                <h2 className="text-xl font-serif text-[var(--ivory)] font-light">Active Mentorships</h2>
                <span className="bg-[rgba(91,160,144,0.1)] text-[var(--sage-light)] text-[0.65rem] font-bold px-2 py-0.5 rounded-full border border-[var(--sage)]/20">
                  {activeThreads.length}
                </span>
              </div>

              {activeThreads.length === 0 ? (
                <div className="bg-[rgba(17,34,64,0.3)] border border-rgba(155,175,192,0.1)] rounded-[32px] p-16 text-center backdrop-blur-sm">
                  <h3 className="font-serif text-xl text-[var(--ivory)] mb-2 font-light">No active dialogues</h3>
                  <p className="text-[var(--text-muted)] text-sm max-w-[300px] mx-auto leading-relaxed">
                    Once you accept a request from the queue, it will appear here as an active thread.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {activeThreads.map(req => (
                    <ThreadCard key={req.id} request={req as any} viewerRole="professor" />
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
