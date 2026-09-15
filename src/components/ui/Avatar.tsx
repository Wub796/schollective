import React from "react";
import { initialsOf, type NamedPerson } from "@/lib/people";

type AvatarPerson = NamedPerson & { avatar_url?: string | null };

interface AvatarProps {
  person: AvatarPerson;
  /** Diameter in rem. */
  size?: number;
  /** `accent` is the indigo tint used on active cards; `neutral` for past or muted rows. */
  tone?: "accent" | "neutral";
}

/**
 * A person's photo, or their initials on the tinted disc the app's cards use.
 * No hooks, so it renders from server and client components alike.
 */
export function Avatar({ person, size = 2.6, tone = "accent" }: AvatarProps) {
  const accent = tone === "accent";
  return (
    <span
      aria-hidden="true"
      style={{
        width: `${size}rem`,
        height: `${size}rem`,
        borderRadius: "50%",
        flexShrink: 0,
        overflow: "hidden",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        background: accent ? "rgba(79, 70, 229, 0.1)" : "rgba(15, 23, 42, 0.05)",
        border: accent ? "1px solid rgba(79, 70, 229, 0.25)" : "1px solid rgba(15, 23, 42, 0.1)",
        fontSize: `${Math.max(0.6, size * 0.29)}rem`,
        fontWeight: 700,
        letterSpacing: "0.04em",
        color: accent ? "var(--accent)" : "rgba(15, 23, 42, 0.6)",
        fontFamily: "var(--font-sans)",
      }}
    >
      {person.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={person.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        initialsOf(person)
      )}
    </span>
  );
}

interface AvatarStackProps {
  people: AvatarPerson[];
  /** Diameter of each avatar in rem. */
  size?: number;
  /** Avatars drawn before the rest collapse into "+N". */
  max?: number;
}

/** Overlapping avatars for the students on a group thread. */
export function AvatarStack({ people, size = 1.9, max = 4 }: AvatarStackProps) {
  const shown = people.slice(0, max);
  const overflow = people.length - shown.length;

  return (
    <span style={{ display: "inline-flex", alignItems: "center" }}>
      {shown.map((person, index) => (
        <span
          key={index}
          style={{
            marginLeft: index === 0 ? 0 : `-${size * 0.3}rem`,
            borderRadius: "50%",
            boxShadow: "0 0 0 2px #ffffff",
            display: "inline-flex",
          }}
        >
          <Avatar person={person} size={size} />
        </span>
      ))}
      {overflow > 0 && (
        <span
          style={{
            marginLeft: `-${size * 0.3}rem`,
            width: `${size}rem`,
            height: `${size}rem`,
            borderRadius: "50%",
            boxShadow: "0 0 0 2px #ffffff",
            background: "var(--accent)",
            color: "#ffffff",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: `${Math.max(0.55, size * 0.27)}rem`,
            fontWeight: 800,
            fontFamily: "var(--font-sans)",
          }}
        >
          +{overflow}
        </span>
      )}
    </span>
  );
}
