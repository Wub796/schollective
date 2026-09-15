import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Users } from "lucide-react";
import { getCurrentUserAndProfile } from "@/lib/neon/profiles";
import { getClassmateSuggestions, getFriendNetwork } from "@/lib/neon/social";
import { ADMIN_VIEW_AS_COOKIE } from "@/lib/authz";
import { fullName, givenName } from "@/lib/people";
import { PersonRow, RowBadge } from "@/components/features/PersonRow";
import { FriendshipControls, UnblockButton } from "@/components/features/FriendshipControls";
import { StudentSearch } from "@/components/features/StudentSearch";

export const dynamic = "force-dynamic";

function SectionHeader({ title, count, muted = false }: { title: string; count?: string; muted?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
      <h2
        className="font-display"
        style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-primary)", opacity: muted ? 0.6 : 1, letterSpacing: "-0.025em" }}
      >
        {title}
      </h2>
      {count && (
        <span
          style={{
            marginLeft: "auto",
            fontSize: "0.6rem",
            fontWeight: 800,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: muted ? "var(--text-secondary)" : "var(--text-primary)",
            background: muted ? "transparent" : "rgba(79, 70, 229, 0.18)",
            opacity: muted ? 0.6 : 1,
            padding: "0.3rem 0.8rem",
            borderRadius: "100px",
            fontFamily: "var(--font-sans, monospace)",
          }}
        >
          {count}
        </span>
      )}
    </div>
  );
}

function formatSince(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function FriendsPage() {
  const { user, profile } = await getCurrentUserAndProfile();
  if (!user || !profile) redirect("/login");

  const cookieStore = await cookies();
  const isAdminPreviewing = profile.role === "admin" && cookieStore.get(ADMIN_VIEW_AS_COOKIE)?.value === "student";
  if (!isAdminPreviewing && profile.role !== "student") {
    redirect(profile.role === "admin" ? "/admin/dashboard" : "/prof/dashboard");
  }

  const [network, suggestions] = await Promise.all([
    getFriendNetwork(user.id),
    getClassmateSuggestions(user.id),
  ]);
  const { friends, incoming, outgoing, blocked } = network;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "3.5rem", paddingBottom: "4rem" }}>

      {/* ── Header ── */}
      <header style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <h1 className="font-display" style={{ fontSize: "clamp(2.4rem, 4.5vw, 3.6rem)", fontWeight: 900, color: "var(--text-primary)", letterSpacing: "-0.035em", lineHeight: 1.1 }}>
          {givenName(profile, "Scholar")}&apos;s{" "}
          <em style={{ fontStyle: "italic", color: "var(--accent)", fontWeight: 300 }}>network</em>
        </h1>
        <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", opacity: 0.75, fontWeight: 400, maxWidth: "42rem", lineHeight: 1.8, fontFamily: "var(--font-sans)", marginTop: "0.25rem" }}>
          Find classmates and keep track of friend requests. Friends can be added as collaborators
          when you request mentorship, so you can work with a professor together.
        </p>
      </header>

      {/* ── Stats strip ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.25rem" }}>
        {[
          { value: friends.length,  label: "Friends",  sub: "Your Network" },
          { value: incoming.length, label: "Requests", sub: "Waiting on You" },
          { value: outgoing.length, label: "Sent",     sub: "Awaiting Reply" },
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
              fontFamily: "var(--font-sans, monospace)", border: "1px solid rgba(79, 70, 229, 0.6)",
            }}>
              {sub}
            </div>
          </div>
        ))}
      </div>

      {/* ── Hairline ── */}
      <div style={{ height: "1px", background: "rgba(99, 102, 241, 0.4)" }} />

      {/* ── Incoming requests ── */}
      {incoming.length > 0 && (
        <section style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <SectionHeader title="Friend Requests" count={`${incoming.length} waiting`} />
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {incoming.map(({ friendshipId, person }) => (
              <PersonRow
                key={friendshipId}
                person={person}
                href={`/students/${person.id}`}
                badge={<RowBadge>New</RowBadge>}
                actions={<FriendshipControls studentId={person.id} studentName={fullName(person)} initialState="incoming" showBlock />}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Friends ── */}
      <section style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <SectionHeader title="Friends" count={friends.length > 0 ? `${friends.length} friend${friends.length === 1 ? "" : "s"}` : undefined} />
        {friends.length === 0 ? (
          <div style={{
            border: "1px dashed rgba(99, 102, 241, 0.6)", borderRadius: "16px",
            padding: "3rem 2rem", textAlign: "center",
            display: "flex", flexDirection: "column", alignItems: "center", gap: "1.1rem",
            background: "rgba(255, 255, 255, 0.7)",
          }}>
            <div style={{
              width: "3.5rem", height: "3.5rem", borderRadius: "50%",
              background: "rgba(79, 70, 229, 0.25)", border: "1px solid rgba(79, 70, 229, 0.5)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Users size={20} style={{ color: "var(--text-primary)" }} aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-display" style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.5rem", letterSpacing: "-0.02em" }}>
                No friends yet
              </h3>
              <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", opacity: 0.75, maxWidth: "28rem", lineHeight: 1.7, fontFamily: "var(--font-sans)" }}>
                Search for classmates below. Once they accept, you can bring them onto a
                mentorship request and work with a professor as a group.
              </p>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {friends.map(({ friendshipId, person, since }) => (
              <PersonRow
                key={friendshipId}
                person={person}
                href={`/students/${person.id}`}
                actions={
                  <>
                    <span className="hidden sm:inline" style={{ fontSize: "0.62rem", color: "var(--text-tertiary)", fontFamily: "var(--font-sans)", marginRight: "0.25rem" }}>
                      Since {formatSince(since)}
                    </span>
                    <FriendshipControls studentId={person.id} studentName={fullName(person)} initialState="friends" showBlock />
                  </>
                }
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Find classmates ── */}
      <section style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <SectionHeader title="Find Classmates" />
        <StudentSearch suggestions={suggestions} institution={profile.institution ?? null} />
      </section>

      {/* ── Sent requests ── */}
      {outgoing.length > 0 && (
        <section style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <SectionHeader title="Sent Requests" count={`${outgoing.length} pending`} muted />
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {outgoing.map(({ friendshipId, person }) => (
              <PersonRow
                key={friendshipId}
                person={person}
                href={`/students/${person.id}`}
                muted
                actions={<FriendshipControls studentId={person.id} studentName={fullName(person)} initialState="outgoing" />}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Blocked ── */}
      {blocked.length > 0 && (
        <section style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <SectionHeader title="Blocked" count={`${blocked.length} blocked`} muted />
          <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", opacity: 0.7, lineHeight: 1.7, fontFamily: "var(--font-sans)", marginTop: "-0.5rem" }}>
            Blocked students can&apos;t find you, send you friend requests or invite you to collaborate. They aren&apos;t told.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {blocked.map((person) => (
              <PersonRow
                key={person.id}
                person={person}
                muted
                actions={<UnblockButton studentId={person.id} studentName={fullName(person)} />}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Collaboration pointer ── */}
      {friends.length > 0 && (
        <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", opacity: 0.8, lineHeight: 1.7, fontFamily: "var(--font-sans)" }}>
          Working on something together?{" "}
          <Link href="/professors" style={{ color: "var(--accent)", fontWeight: 700, textDecoration: "none" }}>
            Find a mentor
          </Link>{" "}
          and add your friends as collaborators on the request.
        </p>
      )}
    </div>
  );
}
