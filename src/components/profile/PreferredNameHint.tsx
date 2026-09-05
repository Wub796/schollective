"use client";

import React from "react";
import { UserCheck } from "lucide-react";
import { nameParts, preferredNameKind } from "@/lib/people";

interface PreferredNameHintProps {
  firstName: string;
  lastName: string;
  preferredName: string;
  /** How the name is prefixed on screen, e.g. "Dr." for faculty. */
  honorific?: string;
  style?: React.CSSProperties;
}

/**
 * Says how a preferred name was read (a first name, or a whole name) and how it
 * will appear, so nobody discovers "Jane Doe Doe" on a card after saving.
 */
export function PreferredNameHint({ firstName, lastName, preferredName, honorific, style }: PreferredNameHintProps) {
  const kind = preferredNameKind(preferredName, lastName);
  const { given, family } = nameParts({ first_name: firstName, last_name: lastName, preferred_name: preferredName });
  const shownAs = [honorific, given, family].filter(Boolean).join(" ");

  return (
    <p
      aria-live="polite"
      style={{
        display: kind === "none" ? "none" : "flex",
        alignItems: "center",
        gap: "0.35rem",
        margin: "0.45rem 0 0",
        fontSize: "0.72rem",
        fontWeight: 600,
        color: "var(--text-tertiary)",
        fontFamily: "var(--font-sans)",
        ...style,
      }}
    >
      {kind === "none" ? null : <UserCheck size={13} aria-hidden style={{ color: "var(--accent)", flexShrink: 0 }} />}
      {kind === "none" ? null : kind === "full" ? (
        <span>
          Full name detected. You’ll appear as <strong style={{ color: "var(--text-secondary)" }}>{shownAs}</strong>
          {given ? <> and be greeted as {given}</> : null}.
        </span>
      ) : (
        <span>
          Used as your first name. You’ll appear as <strong style={{ color: "var(--text-secondary)" }}>{shownAs}</strong>.
        </span>
      )}
    </p>
  );
}
