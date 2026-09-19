"use client";

import React, { useState } from "react";
import { ChevronDown, Eye } from "lucide-react";
import {
  DEFAULT_FACULTY_HONORIFIC,
  HONORIFIC_CHOICES,
  fullName,
  normaliseHonorific,
  withTitle,
  type NamedPerson,
} from "@/lib/people";
import { LIMITS } from "@/lib/security";

/**
 * The select value that reveals the free-text field. It is UI state, never
 * stored: what gets stored is whatever is typed into the field it opens.
 */
const CUSTOM = "__custom__";

interface PreferredTitlePickerProps {
  /** Form field name, so a plain submit carries the choice. */
  name: string;
  /** The stored title: one we offer, NO_HONORIFIC, or a short title of their own. */
  value: string;
  onChange: (value: string) => void;
  /** The name the title is attached to, so the preview reads like the real thing. */
  person: NamedPerson;
  label?: string;
  style?: React.CSSProperties;
}

/**
 * "How should students see your name?" — the titles we offer, the choice to
 * appear with none, or a short title of the account's own.
 *
 * A professor's title is the one part of their name the product used to decide
 * for them: every faculty profile read "Dr." whatever the account wanted, and
 * the list of titles people actually use is longer than any list we would write,
 * so the free-text option is part of the control rather than an afterthought.
 */
export function PreferredTitlePicker({
  name,
  value,
  onChange,
  person,
  label = "Display Title",
  style,
}: PreferredTitlePickerProps) {
  const normalised = normaliseHonorific(value);
  const offered = HONORIFIC_CHOICES.find((choice) => choice.value === normalised);
  const [mode, setMode] = useState<string>(
    offered?.value ?? (normalised === null ? DEFAULT_FACULTY_HONORIFIC : CUSTOM),
  );

  const chooseMode = (next: string) => {
    setMode(next);
    // Opening the free-text field clears the stored title rather than seeding it
    // with the previous one, which would be saved unchanged if it was left alone.
    onChange(next === CUSTOM ? "" : next);
  };

  // What a student sees: the offered title, the title they typed, or the same
  // name with no title in front of it.
  const shownAs = withTitle({ honorific: value }, fullName(person, "Professor"));

  return (
    <div style={style}>
      <label
        htmlFor={`${name}-title`}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
          fontSize: "0.72rem",
          fontWeight: 800,
          color: "var(--text-primary)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: "0.5rem",
        }}
      >
        <Eye size={15} /> {label}
      </label>

      <div style={{ position: "relative" }}>
        <select
          id={`${name}-title`}
          value={mode}
          onChange={(e) => chooseMode(e.target.value)}
          style={{
            width: "100%",
            background: "#ffffff",
            border: "1px solid rgba(99, 102, 241, 0.18)",
            borderRadius: "100px",
            padding: "0.75rem 2.5rem 0.75rem 1.25rem",
            fontSize: "0.88rem",
            color: "var(--text-primary)",
            outline: "none",
            fontFamily: "var(--font-sans)",
            appearance: "none",
            cursor: "pointer",
          }}
        >
          {HONORIFIC_CHOICES.map((choice) => (
            <option key={choice.value} value={choice.value}>
              {choice.label}
            </option>
          ))}
          <option value={CUSTOM}>Other title…</option>
        </select>
        <ChevronDown
          size={15}
          aria-hidden
          style={{ position: "absolute", right: "1.1rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--text-tertiary)" }}
        />
      </div>

      {mode === CUSTOM ? (
        <input
          aria-label="Your title"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={LIMITS.honorific}
          placeholder="e.g. Rev., Assoc. Prof."
          style={{
            width: "100%",
            marginTop: "0.6rem",
            background: "#ffffff",
            border: "1px solid rgba(99, 102, 241, 0.18)",
            borderRadius: "100px",
            padding: "0.75rem 1.25rem",
            fontSize: "0.88rem",
            color: "var(--text-primary)",
            outline: "none",
            fontFamily: "var(--font-sans)",
          }}
        />
      ) : null}

      <p
        aria-live="polite"
        style={{
          margin: "0.45rem 0 0",
          fontSize: "0.72rem",
          fontWeight: 600,
          color: "var(--text-tertiary)",
          fontFamily: "var(--font-sans)",
        }}
      >
        Students see <strong style={{ color: "var(--text-secondary)" }}>{shownAs}</strong>
      </p>

      {/* The choice travels with a normal submit; the select above is only the control. */}
      <input type="hidden" name={name} value={value} />
    </div>
  );
}
