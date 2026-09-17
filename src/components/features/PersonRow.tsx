import React from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { educationLabel, fullName, type NamedPerson } from "@/lib/people";

export type PersonSummary = NamedPerson & {
  id: string;
  avatar_url?: string | null;
  institution?: string | null;
  major?: string | null;
  education_level?: string | null;
};

/** "Computer Science · MIT", falling back to the education level when there is no major. */
export function personDetail(person: PersonSummary): string {
  return [person.major || educationLabel(person.education_level), person.institution]
    .filter(Boolean)
    .join(" · ");
}

interface PersonRowProps {
  person: PersonSummary;
  /** Makes the name a link, usually to the student's profile. */
  href?: string;
  /** A short tag beside the name, such as "Lead" or "Invited". */
  badge?: React.ReactNode;
  /** Replaces the default major · institution line. */
  detail?: React.ReactNode;
  actions?: React.ReactNode;
  /** Past or inactive relationships render quieter. */
  muted?: boolean;
}

/**
 * One person with their actions: the row shape shared by the friends page,
 * student search and a group thread's member list. No hooks, so a server page
 * can render it with client action buttons slotted in.
 */
export function PersonRow({ person, href, badge, detail, actions, muted = false }: PersonRowProps) {
  const name = (
    <span
      className="font-display"
      style={{
        fontSize: "0.95rem",
        fontWeight: 700,
        color: muted ? "rgba(15, 23, 42, 0.6)" : "var(--text-primary)",
        letterSpacing: "-0.01em",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}
    >
      {fullName(person)}
    </span>
  );

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        flexWrap: "wrap",
        padding: "1rem 1.25rem",
        border: muted ? "1px solid rgba(15, 23, 42, 0.07)" : "1px solid rgba(99, 102, 241, 0.18)",
        borderRadius: "14px",
        background: muted ? "rgba(255, 255, 255, 0.55)" : "rgba(255, 255, 255, 0.9)",
      }}
    >
      <Avatar person={person} size={2.6} tone={muted ? "neutral" : "accent"} />

      <div style={{ flex: "1 1 12rem", minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 0 }}>
          {href ? (
            <Link href={href} className="link-underline" style={{ textDecoration: "none", minWidth: 0, display: "inline-flex" }}>
              {name}
            </Link>
          ) : (
            name
          )}
          {badge}
        </div>
        <div
          style={{
            fontSize: "0.72rem",
            color: "var(--text-secondary)",
            opacity: 0.8,
            fontFamily: "var(--font-sans)",
            marginTop: "0.1rem",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {detail ?? (personDetail(person) || "Student")}
        </div>
      </div>

      {actions && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginLeft: "auto" }}>
          {actions}
        </div>
      )}
    </div>
  );
}

/** The small uppercase tag beside a name. `.pill` keeps a longer tag — "Invited",
 *  a translated label — inside the capsule at phone widths. */
export function RowBadge({ children, tone = "accent" }: { children: React.ReactNode; tone?: "accent" | "neutral" }) {
  const accent = tone === "accent";
  return (
    <span
      className="pill"
      style={{
        flexShrink: 0,
        padding: "0.18rem 0.55rem",
        borderRadius: "100px",
        border: accent ? "1px solid rgba(79, 70, 229, 0.3)" : "1px solid rgba(15, 23, 42, 0.12)",
        background: accent ? "rgba(79, 70, 229, 0.08)" : "rgba(15, 23, 42, 0.04)",
        color: accent ? "var(--accent)" : "var(--text-tertiary)",
        fontSize: "0.5rem",
        fontWeight: 800,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        fontFamily: "var(--font-sans, monospace)",
        lineHeight: 1.4,
      }}
    >
      {children}
    </span>
  );
}
