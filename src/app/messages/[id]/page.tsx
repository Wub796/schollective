import React from "react";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { sql } from "@/lib/neon/db";
import { runAs } from "@/lib/neon/user-context";
import { getCurrentUserAndProfile } from "@/lib/neon/profiles";
import { getFriendNetwork, getThreadMembers, recordThreadRead } from "@/lib/neon/social";
import { ChatThread, type ThreadParticipant } from "@/components/features/ChatThread";
import { CloseThreadButton } from "@/components/features/CloseThreadButton";
import { GroupMembersPanel } from "@/components/features/GroupMembersPanel";
import type { PersonSummary } from "@/components/features/PersonRow";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { getThreadAccess, requireParticipant, isSuspended } from "@/lib/authz";
import type { ChatThreadProps } from "@/components/features/ChatThread";
import { canCloseThread, canInviteCollaborators } from "@/lib/collaboration";
import { MEMBER_CAN_VIEW_REQUEST } from "@/lib/status";
import { facultyName, fullName } from "@/lib/people";
import { parseJsonbArray } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface MessagePageProps {
  params: Promise<{ id: string }>;
}

interface ParticipantRow extends PersonSummary {
  role: string;
  expertise_fields?: unknown;
}

interface MessageRow {
  id: string;
  request_id: string;
  sender_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

export default async function MessagePage({ params }: MessagePageProps) {
  const { id: requestId } = await params;
  const { session, user, profile } = await getCurrentUserAndProfile();
  if (!session || !user) redirect("/login");
  // This route is outside the (dashboard) group, so it carries its own gate.
  if (isSuspended(profile)) redirect("/suspended");

  // A thread belongs to its lead student, its professor and the students who
  // have joined it, and an admin soft-delete hides it from all of them. Every
  // other case gets the same 404 as a thread that does not exist, so ids cannot
  // be probed.
  const access = await requireParticipant(requestId, user.id);
  if (!access.ok) {
    // An invitee arriving from a shared link decides on their invitations list;
    // they do not get to read the conversation before joining it.
    const { request: invitedTo, memberStatus } = await getThreadAccess(requestId, user.id);
    if (invitedTo && memberStatus === "invited") redirect("/threads");
    return notFound();
  }
  const { request, role } = access;

  // Opening the thread is reading it. This used to call a markRead server action
  // mid-render, which also revalidated paths — not something a render may do.
  // Reads are recorded here and by the message poll, so that action is gone.
  await recordThreadRead(requestId, user.id);

  const [leadRows, professorRows, members, messages] = await Promise.all([
    runAs(user.id, async () => sql`
      SELECT id, first_name, last_name, preferred_name, role, avatar_url, institution, major, education_level
      FROM profiles WHERE id = ${request.student_id} LIMIT 1;
    `),
    runAs(user.id, async () => sql`
      SELECT id, first_name, last_name, preferred_name, role, avatar_url, institution, expertise_fields
      FROM profiles WHERE id = ${request.professor_id} LIMIT 1;
    `),
    getThreadMembers(requestId, user.id),
    // RLS scopes messages to thread participants: the query must run under the
    // signed-in user's database identity or every row is filtered out.
    runAs(user.id, async () => sql`
      SELECT *
      FROM messages
      WHERE request_id = ${requestId}
      ORDER BY created_at ASC;
    `),
  ]) as [ParticipantRow[], ParticipantRow[], Awaited<ReturnType<typeof getThreadMembers>>, MessageRow[]];

  const unknownPerson = (id: string, fallbackRole: string): ParticipantRow => ({
    id, first_name: null, last_name: null, preferred_name: null, role: fallbackRole,
  });
  const lead = leadRows[0] ?? unknownPerson(request.student_id, "student");
  const professor = professorRows[0] ?? unknownPerson(request.professor_id, "professor");

  const isProfessor = role === "professor";
  const isGroup = members.length > 0;
  const joinedCount = members.filter((member) => member.status === "joined").length;

  // The person shown in the header: the professor for students, the lead for the professor.
  const participant = isProfessor ? lead : professor;
  const participantTitle = isProfessor ? fullName(participant) : facultyName(participant);
  const participantDetail = isProfessor
    ? (isGroup ? `Group · ${joinedCount + 1} students` : "Student")
    : (parseJsonbArray(professor.expertise_fields)[0] || "Faculty");

  // Names for every author, so a group thread can say who wrote what. Former
  // members stay in the map: their earlier messages are still on the thread.
  const participants: Record<string, ThreadParticipant> = {
    [request.student_id]: { name: fullName(lead), role: "lead" },
    [request.professor_id]: { name: facultyName(professor), role: "professor" },
  };
  for (const member of members) {
    participants[member.id] ??= { name: fullName(member), role: "member" };
  }

  // The lead can bring friends onto an open thread, including a one-to-one
  // thread that has not been a group until now.
  const mayInvite = canInviteCollaborators(role, request.status);
  const onThread = new Set(members.filter((member) => MEMBER_CAN_VIEW_REQUEST.includes(member.status)).map((member) => member.id));
  const invitableFriends = mayInvite
    ? (await getFriendNetwork(user.id)).friends.map((entry) => entry.person).filter((person) => !onThread.has(person.id))
    : [];

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
            href={isProfessor ? "/prof/dashboard" : "/threads"}
            aria-label={isProfessor ? "Back to dashboard" : "Back to threads"}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: "2.2rem", height: "2.2rem", borderRadius: "100px", flexShrink: 0,
              border: "1px solid rgba(79, 70, 229, 0.3)",
              background: "rgba(79, 70, 229, 0.08)",
              color: "var(--accent)",
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
              fontSize: "0.82rem", fontWeight: 800, color: "var(--accent)",
              fontFamily: "var(--font-sans)",
            }}>
              {participant.first_name?.[0] ?? "?"}{participant.last_name?.[0] ?? ""}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span className="font-display" style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.015em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {participantTitle}
                </span>
                {participant.role === "professor" && <ShieldCheck size={12} style={{ color: "var(--accent)", flexShrink: 0 }} />}
              </div>
              <div style={{ fontSize: "0.58rem", fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--accent)", fontFamily: "var(--font-sans, monospace)" }}>
                {participantDetail}
              </div>
            </div>
          </div>
        </div>

        {/* Right: group + topic + status + close */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexShrink: 0 }}>
          {(isGroup || mayInvite) && (
            <GroupMembersPanel
              requestId={request.id}
              viewerId={user.id}
              role={role}
              requestStatus={request.status}
              lead={lead}
              professor={professor}
              members={members}
              invitableFriends={invitableFriends}
            />
          )}
          <div className="hidden md:block" style={{ textAlign: "right" }}>
            <div style={{ fontSize: "0.52rem", color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.22em", fontWeight: 800, fontFamily: "var(--font-sans, monospace)", marginBottom: "0.15rem" }}>Topic</div>
            <div className="font-display" style={{ fontSize: "0.85rem", color: "var(--text-primary)", fontStyle: "italic", maxWidth: "240px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              &ldquo;{request.topic}&rdquo;
            </div>
          </div>
          <div style={{
            padding: "0.3rem 0.85rem", borderRadius: "100px",
            border: `1px solid ${request.status === "active" ? "rgba(79, 70, 229, 0.6)" : "rgba(15, 23, 42, 0.15)"}`,
            background: request.status === "active" ? "var(--accent-blue)" : "rgba(15, 23, 42, 0.05)",
            fontSize: "0.58rem", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase" as const,
            color: "var(--text-primary)",
            fontFamily: "var(--font-sans, monospace)",
          }}>
            {request.status}
          </div>
          {request.status === "active" && canCloseThread(role, request.status) && (
            <CloseThreadButton requestId={request.id} isGroup={isGroup} />
          )}
        </div>
      </header>

      {/* Chat — fills remaining height */}
      <main style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
        <ChatThread
          requestId={requestId}
          initialMessages={messages}
          currentUserId={session.user.id}
          status={request.status as ChatThreadProps["status"]}
          participants={isGroup ? participants : undefined}
        />
      </main>
    </div>
  );
}
