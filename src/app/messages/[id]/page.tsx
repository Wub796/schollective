import React from "react";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { ChatThread } from "@/components/features/ChatThread";
import { CloseThreadButton } from "@/components/features/CloseThreadButton";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { markRead } from "./actions";

export const dynamic = "force-dynamic";

interface MessagePageProps {
  params: Promise<{ id: string }>;
}

export default async function MessagePage({ params }: MessagePageProps) {
  const supabase = await createClient();
  const { id: requestId } = await params;

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  // Mark incoming messages as read
  await markRead(requestId);

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
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "transparent", overflow: "hidden" }}>
      {/* Header */}
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 2rem", height: "70px",
        background: "rgba(255, 255, 255, 0.95)",
        borderBottom: "1.5px solid rgba(161, 197, 209, 0.5)",
        backdropFilter: "blur(24px)",
        flexShrink: 0, gap: "1rem",
      }}>
        {/* Left: back + participant */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", minWidth: 0 }}>
          <Link
            href={isProfessor ? "/prof/dashboard" : "/dashboard"}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: "2.2rem", height: "2.2rem", borderRadius: "100px", flexShrink: 0,
              border: "1px solid rgba(0, 140, 187, 0.3)",
              background: "rgba(0, 140, 187, 0.08)",
              color: "#008CBB",
              textDecoration: "none", transition: "all 0.2s",
            }}
          >
            <ArrowLeft size={14} />
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", minWidth: 0 }}>
            <div style={{
              width: "2.4rem", height: "2.4rem", borderRadius: "50%", flexShrink: 0,
              background: "rgba(0, 140, 187, 0.1)",
              border: "1px solid rgba(0, 140, 187, 0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.82rem", fontWeight: 800, color: "#008CBB",
              fontFamily: "var(--font-sans)",
            }}>
              {participant.first_name?.[0] ?? "?"}{participant.last_name?.[0] ?? ""}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span className="font-display" style={{ fontSize: "0.95rem", fontWeight: 800, color: "#141005", letterSpacing: "-0.015em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {participantTitle}
                </span>
                {participant.role === "professor" && <ShieldCheck size={12} style={{ color: "#008CBB", flexShrink: 0 }} />}
              </div>
              <div style={{ fontSize: "0.58rem", fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", color: "#008CBB", fontFamily: "var(--font-sans, monospace)" }}>
                {participant.role === "professor" ? (participant as any).expertise : "Student"}
              </div>
            </div>
          </div>
        </div>

        {/* Right: topic + status + close */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexShrink: 0 }}>
          <div className="hidden md:block" style={{ textAlign: "right" }}>
            <div style={{ fontSize: "0.52rem", color: "#008CBB", textTransform: "uppercase", letterSpacing: "0.22em", fontWeight: 800, fontFamily: "var(--font-sans, monospace)", marginBottom: "0.15rem" }}>Topic</div>
            <div className="font-display" style={{ fontSize: "0.85rem", color: "#141005", fontStyle: "italic", maxWidth: "240px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              &ldquo;{request.topic}&rdquo;
            </div>
          </div>
          <div style={{
            padding: "0.3rem 0.85rem", borderRadius: "100px",
            border: `1px solid ${request.status === "active" ? "rgba(255, 194, 15, 0.6)" : "rgba(20, 16, 5, 0.15)"}`,
            background: request.status === "active" ? "#FFC20F" : "rgba(20, 16, 5, 0.05)",
            fontSize: "0.58rem", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase" as const,
            color: "#141005",
            fontFamily: "var(--font-sans, monospace)",
          }}>
            {request.status}
          </div>
          {request.status === "active" && <CloseThreadButton requestId={request.id} />}
        </div>
      </header>

      {/* Chat — fills remaining height */}
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
