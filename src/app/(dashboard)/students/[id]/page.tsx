import React from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Globe, Lock } from "lucide-react";
import { getCurrentUserAndProfile, type SocialLinks } from "@/lib/neon/profiles";
import { sql } from "@/lib/neon/db";
import { runAs } from "@/lib/neon/user-context";
import { getRelationship, getStudentCards, type StudentCard } from "@/lib/neon/social";
import { isValidId, sanitiseUrl } from "@/lib/security";
import { parseJsonbArray } from "@/lib/utils";
import { educationLabel, friendshipStateFor, fullName, givenName } from "@/lib/people";
import { Avatar } from "@/components/ui/Avatar";
import { FriendshipControls, UnblockButton } from "@/components/features/FriendshipControls";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * The academic profile a connected viewer sees. Deliberately not the whole row:
 * grades, class rank, test scores and contact details stay between a student
 * and the professors they write to.
 */
interface ConnectedProfile extends StudentCard {
  status: string;
  bio: string | null;
  academic_interests: unknown;
  skills_and_tools: unknown;
  social_links: unknown;
  portfolio_url: string | null;
}

const labelStyle: React.CSSProperties = {
  fontSize: "0.62rem",
  fontWeight: 800,
  letterSpacing: "0.15em",
  textTransform: "uppercase",
  color: "var(--accent)",
  marginBottom: "0.4rem",
  fontFamily: "var(--font-sans, monospace)",
};

const cardStyle: React.CSSProperties = {
  background: "#ffffff",
  padding: "1rem 1.25rem",
  borderRadius: "12px",
  border: "1px solid rgba(99, 102, 241, 0.15)",
};

function parseLinks(value: unknown): SocialLinks {
  if (value && typeof value === "object") return value as SocialLinks;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
}

function externalHref(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url.replace(/^\/\//, "")}`;
}

function Chips({ items }: { items: string[] }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
      {items.map((item) => (
        <span key={item} style={{ padding: "0.4rem 0.9rem", border: "1px solid rgba(99, 102, 241, 0.25)", borderRadius: "100px", background: "rgba(99, 102, 241, 0.08)", fontSize: "0.78rem", fontWeight: 700, color: "var(--accent)", fontFamily: "var(--font-sans)" }}>
          {item}
        </span>
      ))}
    </div>
  );
}

export default async function StudentProfilePage({ params }: PageProps) {
  const { id } = await params;
  const { user, profile: viewer } = await getCurrentUserAndProfile();
  if (!user || !viewer) redirect("/login");
  if (!isValidId(id)) notFound();

  const isSelf = id === user.id;
  const isAdmin = viewer.role === "admin";
  const relationship = isSelf ? null : await getRelationship(user.id, id);

  // Someone who has blocked the viewer does not exist, as far as the viewer can tell.
  if (relationship?.blocked && !relationship.blockedByViewer) notFound();

  // The full academic profile is for the student themself, people they are
  // connected to (friends, a request sent to the viewer, a shared thread) and
  // admins. RLS enforces the same rule; this decides what to ask for.
  const canSeeProfile = isSelf || isAdmin || (relationship?.connected && !relationship.blockedByViewer);

  let student: StudentCard | null = null;
  let details: ConnectedProfile | null = null;

  if (canSeeProfile) {
    const rows = await runAs(user.id, async () => sql`
      SELECT id, status, first_name, last_name, preferred_name, avatar_url, institution,
             education_level, major, graduation_year, bio, academic_interests,
             skills_and_tools, social_links, portfolio_url
      FROM profiles
      WHERE id = ${id} AND role = 'student'
      LIMIT 1;
    `);
    details = (rows[0] as ConnectedProfile | undefined) ?? null;
    if (details?.status === "suspended" && !isAdmin) details = null;
    student = details;
  }

  if (!student) {
    // Not connected: the safe card, if this is a student the viewer may name at all.
    student = (await getStudentCards(user.id, [id])).get(id) ?? null;
  }
  if (!student) notFound();

  const name = fullName(student);
  const given = givenName(student);
  const state = friendshipStateFor(relationship?.friendship, user.id);
  const showFriendControls = !isSelf && viewer.role === "student" && !relationship?.blockedByViewer;

  const back =
    viewer.role === "professor" ? { href: "/prof/students", label: "Back to Students" }
    : isAdmin ? { href: "/admin/users", label: "Back to Users" }
    : { href: "/friends", label: "Back to Friends" };

  const interests = details ? parseJsonbArray(details.academic_interests) : [];
  const skills = details ? parseJsonbArray(details.skills_and_tools) : [];
  const socials = details ? parseLinks(details.social_links) : {};
  const links = details
    ? [
        { label: "Portfolio", url: socials.portfolio_url || socials.portfolio || details.portfolio_url },
        { label: "GitHub", url: socials.github_url || socials.github },
        { label: "LinkedIn", url: socials.linkedin_url || socials.linkedin },
      ]
        .map((link) => ({ ...link, url: sanitiseUrl(link.url) }))
        .filter((link) => link.url)
    : [];

  const facts = [
    { label: "Institution", value: student.institution },
    { label: "Major", value: student.major },
    { label: "Education", value: educationLabel(student.education_level) },
    { label: "Graduating", value: student.graduation_year ? `Class of ${student.graduation_year}` : null },
  ].filter((fact) => fact.value);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "3rem", maxWidth: "720px", paddingBottom: "5rem" }}>
      {/* ── Back ── */}
      <Link
        href={back.href}
        style={{
          display: "inline-flex", alignItems: "center", gap: "0.6rem", textDecoration: "none", width: "fit-content",
          padding: "0.4rem 0.8rem", borderRadius: "100px", background: "rgba(79, 70, 229, 0.08)", border: "1px solid rgba(79, 70, 229, 0.2)",
        }}
      >
        <ArrowLeft size={12} style={{ color: "var(--accent)" }} aria-hidden="true" />
        <span style={{ fontSize: "0.58rem", fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--accent)", fontFamily: "var(--font-sans, monospace)" }}>
          {back.label}
        </span>
      </Link>

      {/* ── Header ── */}
      <header style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1.75rem", flexWrap: "wrap" }}>
          <Avatar person={student} size={5} />
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", minWidth: 0 }}>
            <h1 className="font-display" style={{ fontSize: "clamp(2.2rem, 4vw, 3rem)", fontWeight: 900, color: "var(--text-primary)", letterSpacing: "-0.035em", lineHeight: 1.05 }}>
              {given}{student.last_name ? " " : ""}
              {student.last_name && <em style={{ fontStyle: "italic", color: "var(--accent)", fontWeight: 300 }}>{student.last_name}</em>}
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
              {isSelf && <StatusPill>You</StatusPill>}
              {state === "friends" && <StatusPill>Friends</StatusPill>}
              {state === "incoming" && <StatusPill>Wants to be friends</StatusPill>}
              {relationship?.blockedByViewer && <StatusPill tone="danger">Blocked</StatusPill>}
            </div>
          </div>
        </div>

        {showFriendControls && (
          <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
            <FriendshipControls studentId={student.id} studentName={name} initialState={state} showBlock={state !== "none" || Boolean(details)} />
          </div>
        )}
        {relationship?.blockedByViewer && viewer.role === "student" && (
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)", fontFamily: "var(--font-sans)" }}>
              You&apos;ve blocked {given}. They can&apos;t find you or contact you.
            </span>
            <UnblockButton studentId={student.id} studentName={name} />
          </div>
        )}
      </header>

      <div style={{ height: "1px", background: "rgba(99, 102, 241, 0.2)" }} />

      {/* ── Facts ── */}
      {facts.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
          {facts.map((fact) => (
            <div key={fact.label} style={cardStyle}>
              <div style={labelStyle}>{fact.label}</div>
              <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-sans)" }}>{fact.value}</div>
            </div>
          ))}
        </div>
      )}

      {details ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {isSelf && (
            <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.7, fontFamily: "var(--font-sans)" }}>
              This is how your friends and collaborators see your profile. Your grades, test scores and contact
              details are never shown here.{" "}
              <Link href="/dashboard" style={{ color: "var(--accent)", fontWeight: 700, textDecoration: "none" }}>Edit your profile</Link>
            </p>
          )}

          {details.bio && (
            <div style={{ ...cardStyle, padding: "1.5rem" }}>
              <div style={labelStyle}>About</div>
              <p style={{ fontSize: "0.9rem", color: "#334155", lineHeight: 1.7, margin: 0, fontFamily: "var(--font-sans)", whiteSpace: "pre-line" }}>{details.bio}</p>
            </div>
          )}

          {interests.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
              <div style={labelStyle}>Academic Interests</div>
              <Chips items={interests} />
            </div>
          )}

          {skills.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
              <div style={labelStyle}>Skills &amp; Tools</div>
              <Chips items={skills} />
            </div>
          )}

          {links.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
              <div style={labelStyle}>Links</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
                {links.map((link) => (
                  <a
                    key={link.label}
                    href={externalHref(link.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem", padding: "0.5rem 1rem", borderRadius: "100px", border: "1px solid var(--border)", background: "#ffffff", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-primary)", textDecoration: "none", fontFamily: "var(--font-sans)" }}
                  >
                    <Globe size={13} style={{ color: "var(--accent)" }} aria-hidden="true" />
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          )}

          {!details.bio && interests.length === 0 && skills.length === 0 && links.length === 0 && (
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", opacity: 0.7, fontStyle: "italic", fontFamily: "var(--font-sans)" }}>
              {isSelf ? "Your profile doesn't have an About section, interests or skills yet." : `${given} hasn't added an About section, interests or skills yet.`}
            </p>
          )}
        </div>
      ) : (
        !relationship?.blockedByViewer && (
          <div style={{
            padding: "1.75rem 2rem", border: "1px dashed rgba(99, 102, 241, 0.45)", borderRadius: "16px",
            background: "rgba(255, 255, 255, 0.7)", display: "flex", alignItems: "flex-start", gap: "1rem",
          }}>
            <Lock size={16} style={{ color: "var(--accent)", flexShrink: 0, marginTop: "0.2rem" }} aria-hidden="true" />
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.7, margin: 0, fontFamily: "var(--font-sans)" }}>
              {state === "outgoing"
                ? `Your friend request is waiting for ${given} to accept. Their full academic profile appears here once you're friends.`
                : `Only friends can see ${given}'s full academic profile. Send a friend request to connect.`}
            </p>
          </div>
        )
      )}
    </div>
  );
}

function StatusPill({ children, tone = "accent" }: { children: React.ReactNode; tone?: "accent" | "danger" }) {
  const danger = tone === "danger";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "0.35rem",
      padding: "0.3rem 0.8rem", borderRadius: "100px",
      border: danger ? "1px solid rgba(220, 38, 38, 0.3)" : "1px solid rgba(79, 70, 229, 0.3)",
      background: danger ? "rgba(220, 38, 38, 0.06)" : "rgba(79, 70, 229, 0.08)",
      fontSize: "0.55rem", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase",
      color: danger ? "#dc2626" : "var(--accent)", fontFamily: "var(--font-sans, monospace)",
    }}>
      <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: danger ? "#dc2626" : "var(--accent)" }} />
      {children}
    </span>
  );
}
