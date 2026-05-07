import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { ThreadCard } from "@/components/features/ThreadCard";
import { RequestQueueCard } from "@/components/features/RequestQueueCard";
import { Sidebar } from "@/components/layout/Sidebar";
import { LayoutDashboard, Inbox, Clock } from "lucide-react";

export default async function ProfessorDashboard() {
  const supabase = await createClient();

  // 1. Authenticate Session
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // 2. Fetch Profile & Verification Status
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "professor") {
    const fallback = profile?.role === 'admin' ? '/admin/dashboard' : '/dashboard';
    redirect(fallback);
  }
  
  // Verification Guard
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
    .eq("professor_id", user.id)
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
    <div className="flex min-h-screen bg-[var(--navy)]">
      <Sidebar role="professor" />

      {/* Main Content */}
      <main className="flex-grow lg:pl-[280px]">
        <div className="dashboard-container py-12 lg:py-24">
          
          {/* Header */}
          <header className="flex flex-col md:flex-row justify-between items-start gap-8 mb-24 animate-in fade-in slide-in-from-top-4 duration-700">
            <div>
              <div className="text-[0.8rem] font-bold tracking-[0.2em] text-[var(--amber)] uppercase mb-3">Academic Dashboard</div>
              <h1 className="font-serif text-5xl lg:text-6xl font-light text-[var(--ivory)] leading-tight">
                Welcome, Dr. <em className="italic text-[var(--amber-light)]">{displayName}</em>
              </h1>
              <p className="text-[var(--text-muted)] mt-6 text-xl font-light max-w-2xl leading-relaxed">
                Manage your student mentorship pipeline and active research dialogues.
              </p>
            </div>
            <div className="flex items-center gap-4 bg-[rgba(17,34,64,0.5)] border border-[rgba(212,146,42,0.15)] rounded-2xl px-8 py-4 backdrop-blur-md shadow-xl">
              <div className="w-3 h-3 rounded-full bg-[var(--sage-light)] animate-pulse"></div>
              <span className="text-xs font-bold text-[var(--ivory)] tracking-[0.2em] uppercase">Accepting Requests</span>
            </div>
          </header>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-16 lg:gap-20">
            
            {/* Left Column: Request Queue */}
            <div className="xl:col-span-1 space-y-12">
              <div className="flex items-center gap-4 border-b border-[rgba(155,175,192,0.1)] pb-6">
                <Inbox size={24} className="text-[var(--amber)]" />
                <h2 className="text-2xl font-serif text-[var(--ivory)] font-light">Request Queue</h2>
                <span className="ml-auto bg-[rgba(212,146,42,0.1)] text-[var(--amber-light)] text-[0.75rem] font-bold px-4 py-1.5 rounded-full border border-[var(--amber)]/20 shadow-inner">
                  {pendingRequests.length} Pending
                </span>
              </div>

              {pendingRequests.length === 0 ? (
                <div className="bg-[rgba(17,34,64,0.2)] border border-dashed border-[rgba(155,175,192,0.1)] rounded-[32px] p-12 text-center backdrop-blur-sm">
                  <p className="text-[var(--text-muted)] text-base italic font-light opacity-60">No pending requests at this time.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-8">
                  {pendingRequests.map(req => (
                    <RequestQueueCard key={req.id} request={req as any} />
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Active Threads */}
            <div className="xl:col-span-2 space-y-12">
              <div className="flex items-center gap-4 border-b border-[rgba(155,175,192,0.1)] pb-6">
                <Clock size={24} className="text-[var(--sage-light)]" />
                <h2 className="text-2xl font-serif text-[var(--ivory)] font-light">Active Mentorships</h2>
                <span className="ml-auto bg-[rgba(91,160,144,0.1)] text-[var(--sage-light)] text-[0.75rem] font-bold px-4 py-1.5 rounded-full border border-[var(--sage)]/20 shadow-inner">
                  {activeThreads.length} Active
                </span>
              </div>

              {activeThreads.length === 0 ? (
                <div className="bg-[rgba(17,34,64,0.3)] border border-[rgba(155,175,192,0.1)] rounded-[48px] p-24 text-center backdrop-blur-sm">
                  <h3 className="font-serif text-3xl text-[var(--ivory)] mb-4 font-light">No active dialogues</h3>
                  <p className="text-[var(--text-muted)] text-lg max-w-[360px] mx-auto leading-relaxed font-light opacity-80">
                    Once you accept a request from the queue, it will appear here as an active thread.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
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
