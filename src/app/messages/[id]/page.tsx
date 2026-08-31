import React from "react";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { sql } from "@/lib/neon/db";
import { getCurrentUserAndProfile } from "@/lib/neon/profiles";
import { ChatThread } from "@/components/features/ChatThread";
import { CloseThreadButton } from "@/components/features/CloseThreadButton";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { getThreadAccess, isSuspended } from "@/lib/authz";
import { parseJsonbArray } from "@/lib/utils";
import { markRead } from "./actions";

export const dynamic = "force-dynamic";

interface MessagePageProps {
  params: Promise<{ id: string }>;
}

export default async function MessagePage({ params }: MessagePageProps) {
  const { id: requestId } = await params;
  const { session, user, profile } = await getCurrentUserAndProfile();
  if (!session || !user) redirect("/login");
  // This route is outside the (dashboard) group, so it carries its own gate.
  if (isSuspended(profile)) redirect("/suspended");

  // A thread belongs to its student and professor alone. Anyone else gets the
  // same 404 as a thread that does not exist, so ids cannot be probed.
  const { request, isParticipant } = await getThreadAccess(requestId, user.id);
  if (!request || !isParticipant) return notFound();

  // Mark incoming messages as read
  await markRead(requestId);

  const [studentRows, professorRows] = await Promise.all([
    sql`SELECT id, first_name, last_name, preferred_name, role FROM profiles WHERE id = ${request.student_id} LIMIT 1;`,
    sql`SELECT id, first_name, last_name, preferred_name, role, expertise_fields FROM profiles WHERE id = ${request.professor_id} LIMIT 1;`,
  ]);

  const studentProfile = studentRows[0];
  const professorProfile = professorRows[0];

  const isProfessor = user.id === request.professor_id;
  const student = (studentProfile ?? {}) as any;
  const professor = (professorProfile ?? {}) as any;
  const participant = (isProfessor ? student : professor) as any;
  const participantName = participant.preferred_name || participant.first_name || "Unknown";
  const participantTitle =
    participant.role === "professor"
      ? `Dr. ${participantName} ${participant.last_name ?? ""}`
      : `${participantName} ${participant.last_name ?? ""}`;

  const messages = await sql`
    SELECT *
    FROM messages
    WHERE request_id = ${requestId}
    ORDER BY created_at ASC;
  `;



  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "transparent", overflow: "hidden" }}>
      {/* Header */}
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 2rem", height: "70px",
        background: "rgba(255, 255, 255, 0.95)",
        borderBottom: "1.5px solid rgba(99, 102, 241, 0.5)",
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
              border: "1px solid rgba(79, 70, 229, 0.3)",
              background: "rgba(79, 70, 229, 0.08)",
              color: "#4f46e5",
              textDecoration: "none", transition: "all 0.2s",
            }}
          >
            <ArrowLeft size={14} />
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", minWidth: 0 }}>
            <div style={{
              width: "2.4rem", height: "2.4rem", borderRadius: "50%", flexShrink: 0,
              background: "rgba(79, 70, 229, 0.1)",
              border: "1px solid rgba(79, 70, 229, 0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.82rem", fontWeight: 800, color: "#4f46e5",
              fontFamily: "var(--font-sans)",
            }}>
              {participant.first_name?.[0] ?? "?"}{participant.last_name?.[0] ?? ""}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span className="font-display" style={{ fontSize: "0.95rem", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.015em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {participantTitle}
                </span>
                {participant.role === "professor" && <ShieldCheck size={12} style={{ color: "#4f46e5", flexShrink: 0 }} />}
              </div>
              <div style={{ fontSize: "0.58rem", fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", color: "#4f46e5", fontFamily: "var(--font-sans, monospace)" }}>
                {participant.role === "professor" ? (parseJsonbArray((participant as any).expertise_fields)[0] || "Faculty") : "Student"}
              </div>
            </div>
          </div>
        </div>

        {/* Right: topic + status + close */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexShrink: 0 }}>
          <div className="hidden md:block" style={{ textAlign: "right" }}>
            <div style={{ fontSize: "0.52rem", color: "#4f46e5", textTransform: "uppercase", letterSpacing: "0.22em", fontWeight: 800, fontFamily: "var(--font-sans, monospace)", marginBottom: "0.15rem" }}>Topic</div>
            <div className="font-display" style={{ fontSize: "0.85rem", color: "#0f172a", fontStyle: "italic", maxWidth: "240px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              &ldquo;{request.topic}&rdquo;
            </div>
          </div>
          <div style={{
            padding: "0.3rem 0.85rem", borderRadius: "100px",
            border: `1px solid ${request.status === "active" ? "rgba(79, 70, 229, 0.6)" : "rgba(15, 23, 42, 0.15)"}`,
            background: request.status === "active" ? "#6366f1" : "rgba(15, 23, 42, 0.05)",
            fontSize: "0.58rem", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase" as const,
            color: "#0f172a",
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
