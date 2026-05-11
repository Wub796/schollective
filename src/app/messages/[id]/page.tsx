import React from "react";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { ChatThread } from "@/components/features/ChatThread";
import { ArrowLeft, MoreVertical, ShieldCheck, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessagePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function MessagePage({ params }: MessagePageProps) {
  const supabase = await createClient();
  const { id: requestId } = await params;

  // 1. Authenticate Session
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/auth/login");

  // 2. Verify Authorization & Fetch Request Data
  // RLS handles the security, so we just need to fetch and check if it exists
  const { data: request, error: requestError } = await supabase
    .from("requests")
    .select(`
      id,
      status,
      topic,
      student_id,
      professor_id,
      student:student_id (
        id,
        first_name,
        last_name,
        preferred_name,
        role
      ),
      professor:professor_id (
        id,
        first_name,
        last_name,
        preferred_name,
        role,
        expertise
      )
    `)
    .eq("id", requestId)
    .single();

  if (requestError || !request) {
    console.error("Request access error:", requestError);
    return notFound();
  }

  // Determine participant info based on who is viewing
  const isProfessor = session.user.id === request.professor_id;
  const participant = isProfessor ? request.student : request.professor;
  const participantName = participant.preferred_name || participant.first_name;
  const participantTitle = participant.role === 'professor' ? `Dr. ${participantName} ${participant.last_name}` : `${participantName} ${participant.last_name}`;

  // 3. Fetch Initial Messages
  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("request_id", requestId)
    .order("created_at", { ascending: true });

  const statusStyles = {
    pending: "bg-[rgba(212,146,42,0.1)] text-[var(--amber-light)] border-[rgba(212,146,42,0.18)]",
    active: "bg-[rgba(61,122,107,0.14)] text-[var(--sage-light)] border-[rgba(61,122,107,0.22)]",
    closed: "bg-[rgba(155,175,192,0.07)] text-[var(--text-muted)] border-[rgba(155,175,192,0.13)]",
  };

  return (
    <div className="flex flex-col h-screen bg-[var(--navy)] overflow-hidden">
      {/* Background Refinement */}
      <div className="fixed inset-0 z-0 bg-[radial-gradient(circle_at_100%_0%,rgba(212,146,42,0.03),transparent_40%)] pointer-events-none"></div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-8 py-5 bg-[rgba(11,22,40,0.85)] border-b border-[rgba(155,175,192,0.1)] backdrop-blur-xl">
        <div className="flex items-center gap-6">
          <Link 
            href={isProfessor ? "/prof/dashboard" : "/dashboard"}
            className="p-2.5 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(155,175,192,0.1)] text-[var(--text-muted)] hover:text-[var(--ivory)] transition-all group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
          </Link>
          
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-11 h-11 rounded-2xl flex items-center justify-center font-serif text-lg border",
              participant.role === 'professor' 
                ? "bg-[rgba(212,146,42,0.1)] text-[var(--amber)] border-[rgba(212,146,42,0.2)]" 
                : "bg-[rgba(61,122,107,0.1)] text-[var(--sage-light)] border-[rgba(61,122,107,0.2)]"
            )}>
              {participant.first_name[0]}{participant.last_name[0]}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h2 className="text-base font-medium text-[var(--ivory)]">{participantTitle}</h2>
                {participant.role === 'professor' && <ShieldCheck size={14} className="text-[var(--sage-light)]" />}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[0.65rem] text-[var(--text-muted)] uppercase tracking-[0.15em] font-bold">
                  {participant.role === 'professor' ? (participant as any).expertise : "Mentorship Thread"}
                </span>
                <div className={cn(
                  "px-2 py-0.5 rounded-full border text-[0.6rem] font-bold uppercase tracking-wider",
                  statusStyles[request.status as keyof typeof statusStyles]
                )}>
                  {request.status}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:block text-right mr-4">
            <div className="text-[0.65rem] text-[var(--text-muted)] uppercase tracking-widest font-bold mb-0.5">Thread Topic</div>
            <div className="text-sm text-[var(--ivory)] font-light italic truncate max-w-[300px]">"{request.topic}"</div>
          </div>
          <button className="p-2.5 rounded-xl hover:bg-[rgba(255,255,255,0.05)] text-[var(--text-muted)] transition-colors">
            <MoreVertical size={20} />
          </button>
        </div>
      </header>

      {/* Main Messaging Area */}
      <main className="relative z-10 flex-grow max-w-5xl w-full mx-auto shadow-2xl">
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
