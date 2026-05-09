import React from "react";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { ChatThread } from "@/components/features/ChatThread";
import { CloseThreadButton } from "@/components/features/CloseThreadButton";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface MessagePageProps {
  params: Promise<{ id: string }>;
}

export default async function MessagePage({ params }: MessagePageProps) {
  const supabase = await createClient();
  const { id: requestId } = await params;

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  const { data: request, error: requestError } = await supabase
    .from("requests")
    .select(`
      id, status, topic, student_id, professor_id,
      student:student_id ( id, first_name, last_name, preferred_name, role ),
      professor:professor_id ( id, first_name, last_name, preferred_name, role, expertise )
    `)
    .eq("id", requestId)
    .single();

  if (requestError || !request) return notFound();

  const isProfessor = session.user.id === request.professor_id;
  const student = (Array.isArray(request.student) ? request.student[0] : request.student) as any;
  const professor = (Array.isArray(request.professor) ? request.professor[0] : request.professor) as any;
  const participant = isProfessor ? student : professor;
  const participantName = participant.preferred_name || participant.first_name;
  const participantTitle =
    participant.role === "professor"
      ? `Dr. ${participantName} ${participant.last_name}`
      : `${participantName} ${participant.last_name}`;

  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("request_id", requestId)
    .order("created_at", { ascending: true });

  const statusStyles = {
    pending: "bg-[rgba(255,255,255,0.04)] text-[#5a5a5a] border-[rgba(255,255,255,0.07)]",
    active:  "bg-[rgba(255,255,255,0.06)] text-[#d4d4d2] border-[rgba(255,255,255,0.1)]",
    closed:  "bg-[rgba(255,255,255,0.02)] text-[#3a3a3a] border-[rgba(255,255,255,0.04)]",
  };

  return (
    <div className="flex flex-col h-screen bg-[#0d0d0d] overflow-hidden">
      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 bg-[rgba(13,13,13,0.92)] border-b border-[rgba(255,255,255,0.05)] backdrop-blur-xl flex-shrink-0">
        <div className="flex items-center gap-5">
          <Link
            href={isProfessor ? "/prof/dashboard" : "/dashboard"}
            className="p-2 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.07)] text-[#4a4a4a] hover:text-[#f2f2f0] transition-all group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          </Link>

          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.07)] flex items-center justify-center text-sm font-semibold text-[#6a6a6a]">
              {participant.first_name[0]}{participant.last_name[0]}
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <h2 className="text-sm font-medium text-[#d4d4d2]">{participantTitle}</h2>
                {participant.role === "professor" && (
                  <ShieldCheck size={12} className="text-[#4a4a4a]" />
                )}
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-[0.6rem] text-[#4a4a4a] uppercase tracking-[0.15em] font-semibold">
                  {participant.role === "professor" ? (participant as any).expertise : "Student"}
                </span>
                <div className={cn(
                  "px-2 py-0.5 rounded-full border text-[0.58rem] font-bold uppercase tracking-wider",
                  statusStyles[request.status as keyof typeof statusStyles]
                )}>
                  {request.status}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:block text-right mr-3">
            <div className="text-[0.58rem] text-[#3a3a3a] uppercase tracking-widest font-bold mb-0.5">Thread Topic</div>
            <div className="text-xs text-[#6a6a6a] font-light italic truncate max-w-[280px]">
              &quot;{request.topic}&quot;
            </div>
          </div>
          {request.status === "active" && (
            <CloseThreadButton requestId={request.id} />
          )}
        </div>
      </header>

      {/* Chat area */}
      <main className="relative z-10 flex-grow min-h-0 max-w-5xl w-full mx-auto shadow-2xl">
        <ChatThread
          requestId={requestId}
          initialMessages={messages as any[]}
          currentUserId={session.user.id}
          status={request.status as any}
        />
      </main>
    </div>
  );
}
