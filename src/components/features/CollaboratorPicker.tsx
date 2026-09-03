"use client";

import React from "react";
import { Check } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { fullName } from "@/lib/people";
import type { PersonSummary } from "@/components/features/PersonRow";

interface CollaboratorPickerProps {
  /** Students who may be picked — the viewer's friends who are not already on the thread. */
  candidates: PersonSummary[];
  selected: string[];
  onChange: (ids: string[]) => void;
  /** How many may be selected in total. */
  max: number;
  /** When set, a hidden input per selected id lets a plain form submit the selection. */
  inputName?: string;
  disabled?: boolean;
  /** Shown instead of the chips when there is nobody to pick. */
  emptyMessage: React.ReactNode;
}

/** Toggle chips for choosing which friends to bring onto a mentorship request. */
export function CollaboratorPicker({
  candidates,
  selected,
  onChange,
  max,
  inputName,
  disabled = false,
  emptyMessage,
}: CollaboratorPickerProps) {
  if (candidates.length === 0) {
    return (
      <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", opacity: 0.8, lineHeight: 1.7, fontFamily: "var(--font-sans)" }}>
        {emptyMessage}
      </p>
    );
  }

  const atLimit = selected.length >= max;
  const toggle = (id: string) => {
    if (selected.includes(id)) onChange(selected.filter((existing) => existing !== id));
    else if (!atLimit) onChange([...selected, id]);
  };

  return (
    <div>
      <div role="group" aria-label="Collaborators" style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
        {candidates.map((person) => {
          const isSelected = selected.includes(person.id);
          const unavailable = disabled || (!isSelected && atLimit);
          return (
            <button
              key={person.id}
              type="button"
              aria-pressed={isSelected}
              disabled={unavailable}
              onClick={() => toggle(person.id)}
              className="btn-action"
              title={!isSelected && atLimit ? `A group can include up to ${max} collaborators` : undefined}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.55rem",
                padding: "0.3rem 0.95rem 0.3rem 0.3rem",
                borderRadius: "100px",
                border: isSelected ? "1px solid var(--accent)" : "1px solid rgba(99, 102, 241, 0.25)",
                background: isSelected ? "rgba(79, 70, 229, 0.1)" : "rgba(255, 255, 255, 0.85)",
                color: isSelected ? "var(--accent)" : "var(--text-primary)",
                fontSize: "0.78rem",
                fontWeight: 600,
                fontFamily: "var(--font-sans)",
                opacity: unavailable ? 0.45 : 1,
                cursor: unavailable ? "not-allowed" : "pointer",
              }}
            >
              <Avatar person={person} size={1.7} />
              {fullName(person)}
              {isSelected && <Check size={12} aria-hidden="true" />}
            </button>
          );
        })}
      </div>
      {inputName && selected.map((id) => <input key={id} type="hidden" name={inputName} value={id} />)}
    </div>
  );
}
