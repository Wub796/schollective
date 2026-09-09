import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getCurrentUserAndProfile } from "@/lib/neon/profiles";
import { sql } from "@/lib/neon/db";
import { runAs } from "@/lib/neon/user-context";
import { toIso } from "@/lib/neon/social";
import { parseJsonbArray } from "@/lib/utils";
import { givenName } from "@/lib/people";
import { ThreadCard, type ThreadCardStatus } from "@/components/features/ThreadCard";
import { GroupInviteCard, type GroupInvite } from "@/components/features/GroupInviteCard";
import type { PersonSummary } from "@/components/features/PersonRow";
import {
  OPEN_TO_MEMBERS,
  PARTICIPANT_ONGOING,
  PARTICIPANT_PAST,
  PARTICIPANT_VISIBLE,
  asSqlArray,
  type RequestStatus,
} from "@/lib/status";
import { BookOpen, Search } from "lucide-react";

export const dynamic = "force-dynamic";

function SectionLabel({ text }: { text: string }) {
  return (
    <h2 className="font-display" style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.025em" }}>
      {text}
    </h2>
  );
}

interface ThreadRow {
  id: string;
  status: RequestStatus;
  topic: string;
  updated_at: string | Date;
  is_lead: boolean;
  professor: { first_name: string | null; last_name: string | null; preferred_name: string | null; honorific: string | null; expertise_fields: unknown } | null;
  lead: PersonSummary | null;
  collaborators: PersonSummary[];
  latest_content: string | null;
  latest_created_at: string | Date | null;
  has_unread: boolean;
}

interface InviteRow {
  id: string;
  status: GroupInvite["status"];
  topic: string;
  invited_at: string | Date;
  professor: GroupInvite["professor"];
  lead: PersonSummary;
  collaborators: PersonSummary[];
}

export default async function ThreadsPage() {
  const { user, profile } = await getCurrentUserAndProfile();
  if (!user || !profile) redirect("/login");

  // Allow admins to preview as student
  const cookieStore = await cookies();
  const isAdminPreviewing = profile.role === "admin" && cookieStore.get("x-admin-view-as")?.value === "student";

  if (!isAdminPreviewing && profile.role !== "student") redirect("/prof/dashboard");

  // RLS scopes requests to their participants: the queries must run under the
  // signed-in user's database identity or every row is filtered out.
  //
  // A thread belongs on this list when the student leads it or has joined it.
  // Unread is measured from the student's own read position (thread_reads), so
  // a groupmate opening the thread does not clear it here.
  const [threadRows, inviteRows] = await runAs(user.id, async () => Promise.all([
    sql`
      SELECT
        r.id, r.status, r.topic, r.updated_at,
        (r.student_id = ${user.id}) AS is_lead,
        json_build_object(
          'first_name', p.first_name,
          'last_name', p.last_name,
          'preferred_name', p.preferred_name,
          'honorific', p.honorific,
          'expertise_fields', p.expertise_fields
        ) AS professor,
        json_build_object(
          'id', lead.id,
          'first_name', lead.first_name,
          'last_name', lead.last_name,
          'preferred_name', lead.preferred_name,
          'avatar_url', lead.avatar_url
        ) AS lead,
        COALESCE((
          SELECT json_agg(json_build_object(
            'id', mp.id,
            'first_name', mp.first_name,
            'last_name', mp.last_name,
            'preferred_name', mp.preferred_name,
            'avatar_url', mp.avatar_url
          ) ORDER BY m.invited_at, m.student_id)
          FROM request_members m
          JOIN profiles mp ON mp.id = m.student_id
          WHERE m.request_id = r.id AND m.status = 'joined'
        ), '[]'::json) AS collaborators,
        latest.content AS latest_content,
        latest.created_at AS latest_created_at,
        EXISTS (
          SELECT 1 FROM messages um
          WHERE um.request_id = r.id
            AND um.sender_id <> ${user.id}
            AND um.created_at > COALESCE(tr.last_read_at, '-infinity'::timestamptz)
        ) AS has_unread
      FROM requests r
      LEFT JOIN profiles p ON p.id = r.professor_id
      LEFT JOIN profiles lead ON lead.id = r.student_id
      LEFT JOIN thread_reads tr ON tr.request_id = r.id AND tr.user_id = ${user.id}
      LEFT JOIN LATERAL (
        SELECT lm.content, lm.created_at
        FROM messages lm
        WHERE lm.request_id = r.id
        ORDER BY lm.created_at DESC NULLS LAST
        LIMIT 1
      ) latest ON true
      WHERE r.status = ANY(${asSqlArray(PARTICIPANT_VISIBLE)})
        AND (
          r.student_id = ${user.id}
          OR EXISTS (
            SELECT 1 FROM request_members me
            WHERE me.request_id = r.id AND me.student_id = ${user.id} AND me.status = 'joined'
          )
        )
      ORDER BY r.updated_at DESC;
    `,
    sql`
      SELECT
        r.id, r.status, r.topic, m.invited_at,
        json_build_object(
          'first_name', p.first_name,
          'last_name', p.last_name,
          'preferred_name', p.preferred_name,
          'honorific', p.honorific,
          'institution', p.institution
        ) AS professor,
        json_build_object(
          'id', lead.id,
          'first_name', lead.first_name,
          'last_name', lead.last_name,
          'preferred_name', lead.preferred_name,
          'avatar_url', lead.avatar_url
        ) AS lead,
        COALESCE((
          SELECT json_agg(json_build_object(
            'id', jp.id,
            'first_name', jp.first_name,
            'last_name', jp.last_name,
            'preferred_name', jp.preferred_name,
            'avatar_url', jp.avatar_url
          ) ORDER BY jm.invited_at, jm.student_id)
          FROM request_members jm
          JOIN profiles jp ON jp.id = jm.student_id
          WHERE jm.request_id = r.id AND jm.status = 'joined'
        ), '[]'::json) AS collaborators
      FROM request_members m
      JOIN requests r ON r.id = m.request_id
      LEFT JOIN profiles p ON p.id = r.professor_id
      LEFT JOIN profiles lead ON lead.id = r.student_id
      WHERE m.student_id = ${user.id}
        AND m.status = 'invited'
        AND r.status = ANY(${asSqlArray(OPEN_TO_MEMBERS)})
      ORDER BY m.invited_at DESC;
    `,
  ])) as [ThreadRow[], InviteRow[]];

  const processed = (threadRows || []).map((row) => ({
    request: {
      id: row.id,
      // The query only returns participant-visible statuses.
      status: row.status as ThreadCardStatus,
      topic: row.topic,
      updated_at: toIso(row.updated_at),
      participant: {
        first_name: row.professor?.first_name ?? "Unknown",
        last_name: row.professor?.last_name ?? null,
        preferred_name: row.professor?.preferred_name ?? null,
        honorific: row.professor?.honorific ?? null,
        detail: parseJsonbArray(row.professor?.expertise_fields).join(", ") || "Professor",
      },
      latest_message: row.latest_content
        ? { content: row.latest_content, created_at: toIso(row.latest_created_at) }
        : undefined,
    },
    // Only a thread you can still post in may carry an unread marker.
    hasUnread: row.status === "active" && row.has_unread,
    // The other students, seen from this viewer: the lead unless that is them,
    // then every joined member except them.
    groupmates: [
      ...(!row.is_lead && row.lead ? [row.lead] : []),
      ...(row.collaborators || []).filter((person) => person.id !== user.id),
    ],
  }));

  const invites: GroupInvite[] = (inviteRows || []).map((row) => ({
    requestId: row.id,
    topic: row.topic,
    status: row.status,
    invitedAt: toIso(row.invited_at),
    professor: row.professor,
    lead: row.lead,
    collaborators: row.collaborators || [],
  }));

  // Bucketed against the explicit status lists rather than "anything that is not
  // closed". The old negative test put `declined`, `viewed` and admin-`deleted`
  // threads in the ongoing list — none of which accept messages, so the student
  // saw live-looking conversations they could not use and could not clear.
  const ongoing = processed.filter((t) => PARTICIPANT_ONGOING.includes(t.request.status));
  const past    = processed.filter((t) => PARTICIPANT_PAST.includes(t.request.status));
  const displayName = givenName(profile, "Scholar");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "3.5rem" }}>

      {/* ── Header ── */}
      <header style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "2rem", flexWrap: "wrap" }}>
          <h1 className="font-display" style={{ fontSize: "clamp(2.4rem, 4.5vw, 3.6rem)", fontWeight: 900, color: "var(--text-primary)", letterSpacing: "-0.035em", lineHeight: 1.1 }}>
            {displayName}&apos;s{" "}
            <em style={{ fontStyle: "italic", color: "var(--accent)", fontWeight: 300 }}>threads</em>
          </h1>
          <Link href="/professors" style={{ textDecoration: "none", flexShrink: 0 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              padding: "0.75rem 1.5rem",
              border: "2px solid var(--accent)", background: "var(--accent)", borderRadius: "100px",
              fontSize: "0.62rem", fontWeight: 800, letterSpacing: "0.15em",
              textTransform: "uppercase", color: "#ffffff",
              fontFamily: "var(--font-sans)", cursor: "pointer",
              boxShadow: "0 4px 14px rgba(79, 70, 229, 0.2)",
              transition: "all 0.2s cubic-bezier(0.22, 1, 0.36, 1)",
            }}>
              <Search size={14} />
              Find a Mentor
            </div>
          </Link>
        </div>
        <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", opacity: 0.75, fontWeight: 400, maxWidth: "42rem", lineHeight: 1.8, fontFamily: "var(--font-sans)", marginTop: "0.25rem" }}>
          All your mentorship threads in one place — ongoing dialogues, group collaborations and completed sessions.
        </p>
      </header>

      {/* ── Stats strip ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.25rem" }}>
        {[
          { value: processed.length, label: "Total Threads", sub: "Lifetime" },
          { value: ongoing.length,   label: "Ongoing",        sub: "Active + Pending" },
          { value: past.length,      label: "Completed",      sub: "Past Sessions" },
        ].map(({ value, label, sub }) => (
          <div key={label} style={{
            padding: "2.25rem 2.5rem",
            border: "1px solid rgba(99, 102, 241, 0.45)",
            borderRadius: "14px",
            background: "rgba(99, 102, 241, 0.12)",
            display: "flex", flexDirection: "column", gap: "0.5rem",
          }}>
            <span className="font-display" style={{ fontSize: "2.8rem", fontWeight: 900, color: "var(--text-primary)", letterSpacing: "-0.04em", lineHeight: 1 }}>
              {value}
            </span>
            <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-sans)", lineHeight: 1.4 }}>{label}</div>
            <div style={{
              display: "inline-block", fontSize: "0.58rem", fontWeight: 800, letterSpacing: "0.2em",
              textTransform: "uppercase", color: "var(--text-primary)", background: "var(--accent-blue)",
              padding: "0.25rem 0.75rem", borderRadius: "100px", width: "fit-content", marginTop: "0.5rem",
              fontFamily: "var(--font-sans, monospace)", border: "1px solid rgba(79, 70, 229, 0.6)"
            }}>
              {sub}
            </div>
          </div>
        ))}
      </div>

      {/* ── Hairline ── */}
      <div style={{ height: "1px", background: "rgba(99, 102, 241, 0.4)" }} />

      {/* ── Collaboration invites ── */}
      {invites.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <SectionLabel text="Collaboration Invites" />
            <span style={{
              marginLeft: "auto", fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.22em",
              textTransform: "uppercase", color: "var(--text-primary)", background: "rgba(79, 70, 229, 0.35)",
              padding: "0.3rem 0.8rem", borderRadius: "100px", fontFamily: "var(--font-sans, monospace)"
            }}>
              {invites.length} waiting
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem" }}>
            {invites.map((invite) => (
              <GroupInviteCard key={invite.requestId} invite={invite} />
            ))}
          </div>
        </div>
      )}

      {/* ── Empty state (no threads at all) ── */}
      {processed.length === 0 && (
        <div style={{
          border: "1px dashed rgba(99, 102, 241, 0.6)", borderRadius: "16px",
          padding: "4rem 2rem", textAlign: "center",
          display: "flex", flexDirection: "column", alignItems: "center", gap: "1.25rem",
          background: "rgba(255, 255, 255, 0.7)",
        }}>
          <div style={{
            width: "3.5rem", height: "3.5rem", borderRadius: "50%",
            background: "rgba(79, 70, 229, 0.25)", border: "1px solid rgba(79, 70, 229, 0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <BookOpen size={20} style={{ color: "var(--text-primary)" }} />
          </div>
          <div>
            <h3 className="font-display" style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.5rem", letterSpacing: "-0.02em" }}>
              No threads yet
            </h3>
            <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", opacity: 0.75, maxWidth: "26rem", lineHeight: 1.7, fontFamily: "var(--font-sans)" }}>
              Threads appear here once you send a mentorship request or join a friend&apos;s group.
              Start by finding a mentor in the directory.
            </p>
          </div>
          <Link href="/professors" style={{ textDecoration: "none" }}>
            <div style={{
              padding: "0.8rem 2rem", border: "2px solid var(--accent)", background: "var(--accent)",
              borderRadius: "100px", fontSize: "0.62rem", fontWeight: 800,
              letterSpacing: "0.18em", textTransform: "uppercase",
              color: "#ffffff", fontFamily: "var(--font-sans)", cursor: "pointer",
              boxShadow: "0 4px 14px rgba(79, 70, 229, 0.25)",
            }}>
              Browse Professors
            </div>
          </Link>
        </div>
      )}

      {/* ── Ongoing threads ── */}
      {ongoing.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <SectionLabel text="Ongoing" />
            <span style={{
              marginLeft: "auto", fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.22em",
              textTransform: "uppercase", color: "var(--text-primary)", background: "rgba(79, 70, 229, 0.35)",
              padding: "0.3rem 0.8rem", borderRadius: "100px", fontFamily: "var(--font-sans, monospace)"
            }}>
              {ongoing.length} thread{ongoing.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem" }}>
            {ongoing.map((thread) => (
              <ThreadCard key={thread.request.id} request={thread.request} viewerRole="student" hasUnread={thread.hasUnread} groupmates={thread.groupmates} />
            ))}
          </div>
        </div>
      )}

      {/* ── Past threads ── */}
      {past.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <h2 className="font-display" style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-primary)", opacity: 0.6, letterSpacing: "-0.025em" }}>
              Past Sessions
            </h2>
            <span style={{ marginLeft: "auto", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--text-secondary)", opacity: 0.5, fontFamily: "var(--font-sans, monospace)" }}>
              {past.length} completed
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem", opacity: 0.8 }}>
            {past.map((thread) => (
              <ThreadCard key={thread.request.id} request={thread.request} viewerRole="student" hasUnread={thread.hasUnread} groupmates={thread.groupmates} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
