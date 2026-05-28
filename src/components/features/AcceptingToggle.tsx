"use client";

import React, { useState, useTransition } from "react";
import { toggleAvailability } from "@/app/(dashboard)/prof/dashboard/actions";
import { toast } from "sonner";

interface AcceptingToggleProps {
  /** Initial value from the database */
  initialValue: boolean;
}

/**
 * A DB-backed availability toggle for professors.
 * Replaces the old hardcoded pulsing badge.
 */
export function AcceptingToggle({ initialValue }: AcceptingToggleProps) {
  const [accepting, setAccepting]   = useState(initialValue);
  const [isPending, startTransition] = useTransition();

  const toggle = () => {
    const next = !accepting;
    setAccepting(next); // optimistic update
    startTransition(async () => {
      const result = await toggleAvailability(next);
      if (result?.error) {
        setAccepting(!next); // revert
        toast.error("Failed to update availability.");
      } else {
        toast.success(next ? "Now accepting new requests." : "Requests paused.");
      }
    });
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isPending}
      title={accepting ? "Click to stop accepting requests" : "Click to accept requests"}
      className="btn-availability"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.6rem 1.25rem",
        border: `1px solid ${accepting ? "rgba(120,220,120,0.2)" : "rgba(15, 23, 42, 0.1)"}`,
        borderRadius: "100px",
        background: accepting ? "rgba(120,220,120,0.05)" : "rgba(15, 23, 42, 0.03)",
        cursor: isPending ? "wait" : "pointer",
        opacity: isPending ? 0.7 : 1,
        flexShrink: 0,
      }}
    >
      {/* Status dot */}
      <span style={{
        width: "6px",
        height: "6px",
        borderRadius: "50%",
        background: accepting ? "rgba(120,220,120,0.8)" : "rgba(15, 23, 42, 0.2)",
        animation: accepting ? "pulse 2s infinite" : "none",
        transition: "background 0.3s",
      }} />
      <span style={{
        fontSize: "0.6rem",
        fontWeight: 700,
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        color: accepting ? "rgba(15, 23, 42, 0.5)" : "rgba(15, 23, 42, 0.25)",
        fontFamily: "var(--font-sans, monospace)",
        transition: "color 0.3s",
      }}>
        {accepting ? "Accepting Requests" : "Requests Paused"}
      </span>
    </button>
  );
}
