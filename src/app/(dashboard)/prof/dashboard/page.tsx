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
    <div className="py-10 lg:py-16 space-y-16">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start gap-6">
        <div>
          <p className="text-[0.62rem] font-bold tracking-[0.25em] text-[#3a3a3a] uppercase mb-3">
            Academic Dashboard
          </p>
          <h1 className="font-display text-4xl lg:text-5xl font-bold text-[#f2f2f0] leading-tight">
            Welcome, Dr. <em className="italic text-[#5a5a5a]">{displayName}</em>
          </h1>
          <p className="text-[#4a4a4a] mt-4 text-base font-light max-w-xl leading-relaxed">
            Manage your student mentorship pipeline and active research dialogues.
          </p>
        </div>
        <div className="flex items-center gap-2 border border-[rgba(255,255,255,0.06)] rounded-xl px-5 py-2.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#5a5a5a] animate-pulse" />
          <span className="text-[0.65rem] font-semibold text-[#6a6a6a] uppercase tracking-widest">
            Accepting Requests
          </span>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
        {/* Request Queue */}
        <div className="xl:col-span-1 space-y-6">
          <div className="flex items-center gap-3 border-b border-[rgba(255,255,255,0.05)] pb-4">
            <Inbox size={16} className="text-[#4a4a4a]" />
            <h2 className="font-display text-lg font-semibold text-[#d4d4d2]">
              Request Queue
            </h2>
            <span className="ml-auto text-[0.62rem] text-[#3a3a3a] uppercase tracking-widest font-bold">
              {pendingRequests.length} pending
            </span>
          </div>
          {pendingRequests.length === 0 ? (
            <div className="border border-dashed border-[rgba(255,255,255,0.05)] rounded-2xl p-12 text-center">
              <p className="text-[#3a3a3a] text-sm italic font-light">No pending requests.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((req) => (
                <RequestQueueCard key={req.id} request={req as any} />
              ))}
            </div>
          )}
        </div>

        {/* Active Threads */}
        <div className="xl:col-span-2 space-y-6">
          <div className="flex items-center gap-3 border-b border-[rgba(255,255,255,0.05)] pb-4">
            <Clock size={16} className="text-[#4a4a4a]" />
            <h2 className="font-display text-lg font-semibold text-[#d4d4d2]">
              Active Mentorships
            </h2>
            <span className="ml-auto text-[0.62rem] text-[#3a3a3a] uppercase tracking-widest font-bold">
              {activeThreads.length} active
            </span>
          </div>
          {activeThreads.length === 0 ? (
            <div className="border border-dashed border-[rgba(255,255,255,0.05)] rounded-2xl p-20 text-center">
              <h3 className="font-display text-xl text-[#d4d4d2] mb-3 font-semibold">
                No active dialogues
              </h3>
              <p className="text-[#3a3a3a] text-sm font-light max-w-xs mx-auto leading-relaxed">
                Once you accept a request, it will appear here as an active thread.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
