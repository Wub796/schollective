import React from "react";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { ChatThread } from "@/components/features/ChatThread";
import { CloseThreadButton } from "@/components/features/CloseThreadButton";
import { ArrowLeft, ShieldCheck } from "lucide-react";

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
    .select("id, status, topic, student_id, professor_id")
    .eq("id", requestId)
    .single();

  if (requestError || !request) return notFound();

  // Fetch profiles separately so a failing join doesn't kill the whole page
  const [{ data: studentProfile }, { data: professorProfile }] = await Promise.all([
    supabase.from("profiles").select("id, first_name, last_name, preferred_name, role").eq("id", request.student_id).single(),
    supabase.from("profiles").select("id, first_name, last_name, preferred_name, role, expertise").eq("id", request.professor_id).single(),
  ]);

  const isProfessor = session.user.id === request.professor_id;
  const student   = (studentProfile   ?? {}) as any;
  const professor = (professorProfile ?? {}) as any;
  const participant = (isProfessor ? student : professor) as any;
  const participantName = participant.preferred_name || participant.first_name || "Unknown";
  const participantTitle =
    participant.role === "professor"
      ? `Dr. ${participantName} ${participant.last_name ?? ""}`
      : `${participantName} ${participant.last_name ?? ""}`;

  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("request_id", requestId)
    .order("created_at", { ascending: true });



  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "var(--bg-base)", overflow: "hidden" }}>
      {/* Header */}
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 1.75rem", height: "60px",
        background: "rgba(255, 255, 255, 0.96)",
        borderBottom: "1px solid rgba(37, 99, 235, 0.08)",
        backdropFilter: "blur(24px)",
        flexShrink: 0, gap: "1rem",
      }}>
        {/* Left: back + participant */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", minWidth: 0 }}>
          <Link
            href={isProfessor ? "/prof/dashboard" : "/dashboard"}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: "2rem", height: "2rem", borderRadius: "8px", flexShrink: 0,
              border: "1px solid rgba(37, 99, 235, 0.1)",
              background: "rgba(37, 99, 235, 0.04)",
              color: "rgba(15, 23, 42, 0.4)",
              textDecoration: "none", transition: "all 0.2s",
            }}
          >
            <ArrowLeft size={14} />
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", minWidth: 0 }}>
            <div style={{
              width: "2rem", height: "2rem", borderRadius: "8px", flexShrink: 0,
              background: "rgba(37, 99, 235, 0.08)",
              border: "1px solid rgba(37, 99, 235, 0.18)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.72rem", fontWeight: 700, color: "rgba(37, 99, 235, 0.9)",
              fontFamily: "var(--font-sans)",
            }}>
              {participant.first_name?.[0] ?? "?"}{participant.last_name?.[0] ?? ""}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span className="font-display" style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.015em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {participantTitle}
                </span>
                {participant.role === "professor" && <ShieldCheck size={10} style={{ color: "rgba(37, 99, 235, 0.5)", flexShrink: 0 }} />}
              </div>
              <div style={{ fontSize: "0.52rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(37, 99, 235, 0.4)", fontFamily: "var(--font-mono, monospace)" }}>
                {participant.role === "professor" ? (participant as any).expertise : "Student"}
              </div>
            </div>
          </div>
        </div>

        {/* Right: topic + status + close */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.875rem", flexShrink: 0 }}>
          <div className="hidden md:block" style={{ textAlign: "right" }}>
            <div style={{ fontSize: "0.48rem", color: "rgba(37, 99, 235, 0.3)", textTransform: "uppercase", letterSpacing: "0.2em", fontWeight: 700, fontFamily: "var(--font-mono, monospace)", marginBottom: "0.15rem" }}>Thread</div>
            <div className="font-display" style={{ fontSize: "0.78rem", color: "rgba(15, 23, 42, 0.55)", fontStyle: "italic", maxWidth: "240px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              &ldquo;{request.topic}&rdquo;
            </div>
          </div>
          <div style={{
            padding: "0.2rem 0.65rem", borderRadius: "100px",
            border: `1px solid ${request.status === "active" ? "rgba(37, 99, 235,0.2)" : "rgba(15, 23, 42,0.07)"}`,
            background: request.status === "active" ? "rgba(37, 99, 235,0.06)" : "transparent",
            fontSize: "0.48rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase" as const,
            color: request.status === "active" ? "rgba(37, 99, 235,0.7)" : "rgba(15, 23, 42,0.25)",
            fontFamily: "var(--font-mono, monospace)",
          }}>
            {request.status}
          </div>
          {request.status === "active" && <CloseThreadButton requestId={request.id} />}
        </div>
      </header>

      {/* Chat — fills remaining height, no max-width centering */}
      <main style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
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
