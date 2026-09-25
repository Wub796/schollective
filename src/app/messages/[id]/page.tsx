import React from "react";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { sql } from "@/lib/neon/db";
import { runAs } from "@/lib/neon/user-context";
import { getCurrentUserAndProfile } from "@/lib/neon/profiles";
import { getFriendNetwork, getThreadMembers, recordThreadRead } from "@/lib/neon/social";
import { ChatThread, type ThreadParticipant } from "@/components/features/ChatThread";
import { MinorAnalyticsGuard } from "@/components/analytics/MinorAnalyticsGuard";
import { CloseThreadButton } from "@/components/features/CloseThreadButton";
import { ReportSafetyConcern } from "@/components/features/ReportSafetyConcern";
import { GroupMembersPanel } from "@/components/features/GroupMembersPanel";
import type { PersonSummary } from "@/components/features/PersonRow";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { getThreadAccess, requireParticipant, isSuspended } from "@/lib/authz";
import type { ChatThreadProps } from "@/components/features/ChatThread";
import { canCloseThread, canInviteCollaborators } from "@/lib/collaboration";
import { MEMBER_CAN_VIEW_REQUEST } from "@/lib/status";
import { facultyName, fullName } from "@/lib/people";
import { minorThreadNotice, threadInvolvesMinor, SAFETY_REPORT_EMAIL } from "@/lib/youth-protection";
import { parseJsonbArray } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface MessagePageProps {
  params: Promise<{ id: string }>;
}

interface ParticipantRow extends PersonSummary {
  role: string;
  expertise_fields?: unknown;
  /** Derived from the date of birth; see db/migrations/0014. */
  is_minor?: boolean | null;
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
      SELECT id, first_name, last_name, preferred_name, role, avatar_url, institution, major,
             education_level, is_minor
      FROM profiles WHERE id = ${request.student_id} LIMIT 1;
    `),
    runAs(user.id, async () => sql`
      SELECT id, first_name, last_name, preferred_name, honorific, role, avatar_url, institution, expertise_fields
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
    id, first_name: null, last_name: null, preferred_name: null, honorific: null, role: fallbackRole,
    is_minor: null,
  });
  const lead = leadRows[0] ?? unknownPerson(request.student_id, "student");
  const professor = professorRows[0] ?? unknownPerson(request.professor_id, "professor");

  const isProfessor = role === "professor";
  const isGroup = members.length > 0;
  const joinedCount = members.filter((member) => member.status === "joined").length;

  // A minor on the thread changes what may be written on it, so the rule is
  // stated where the conversation happens rather than only on a policy page
  // nobody opens. The education levels are already loaded for the header, so
  // this costs no extra query. The same rule is enforced server-side in
  // sendMessage — this notice explains a refusal, it is not the guard itself.
  const involvesMinor =
    lead.is_minor === true ||
    members.some((member) => member.is_minor === true) ||
    threadInvolvesMinor([lead.education_level, ...members.map((member) => member.education_level)]);
  const safetyNotice = involvesMinor ? minorThreadNotice(isProfessor ? "professor" : "student") : null;

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
      {/* This route sits outside the (dashboard) group, so it carries its own
          copy of what that layout does for a minor account. */}
      <MinorAnalyticsGuard isMinor={profile?.is_minor === true} />

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
          {/* Available to every participant, in every status, including a
              declined or closed thread: the report is often about what happened
              before it ended, and a thread that cannot be reported is a thread
              that cannot be reported. */}
          <ReportSafetyConcern requestId={request.id} reportedName={participantTitle} />
          {request.status === "active" && canCloseThread(role, request.status) && (
            <CloseThreadButton requestId={request.id} isGroup={isGroup} />
          )}
        </div>
      </header>

      {/* Youth protection notice — only on a thread with a high-school student
          on it, so an all-adult thread is unmarked. */}
      {safetyNotice && (
        <div
          role="note"
          style={{
            display: "flex", alignItems: "flex-start", gap: "0.7rem",
            padding: "0.7rem 2rem", flexShrink: 0,
            background: "var(--accent-dim)",
            borderBottom: "1px solid rgba(79, 70, 229, 0.18)",
          }}
        >
          <ShieldCheck size={14} style={{ color: "var(--accent)", flexShrink: 0, marginTop: "0.15rem" }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-sans)" }}>
              {safetyNotice.headline}
            </div>
            <div style={{ fontSize: "0.66rem", color: "var(--text-secondary)", opacity: 0.85, lineHeight: 1.6, fontFamily: "var(--font-sans)", marginTop: "0.15rem" }}>
              {safetyNotice.detail}{" "}
              <Link
                href="/safety"
                className="link-underline"
                style={{ color: "var(--accent)", fontWeight: 700, textDecoration: "none" }}
              >
                Youth Protection Policy
              </Link>
              {" — report a concern to "}
              <a
                href={`mailto:${SAFETY_REPORT_EMAIL}`}
                className="link-underline"
                style={{ color: "var(--accent)", fontWeight: 700, textDecoration: "none" }}
              >
                {SAFETY_REPORT_EMAIL}
              </a>
              .
            </div>
          </div>
        </div>
      )}

      {/* Chat — fills remaining height. A div, not a `main`: the root layout
          already provides this page's main landmark. */}
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
        <ChatThread
          requestId={requestId}
          initialMessages={messages}
          currentUserId={session.user.id}
          status={request.status as ChatThreadProps["status"]}
          participants={isGroup ? participants : undefined}
        />
      </div>
    </div>
  );
}
