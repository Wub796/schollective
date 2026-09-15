"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { ActionPill } from "@/components/ui/ActionPill";
import { AvatarStack } from "@/components/ui/Avatar";
import { respondToGroupInvite } from "@/app/(dashboard)/threads/actions";
import { facultyName, fullName, listNames, type NamedPerson } from "@/lib/people";
import type { PersonSummary } from "@/components/features/PersonRow";

export interface GroupInvite {
  requestId: string;
  topic: string;
  status: "pending" | "viewed" | "active";
  invitedAt: string;
  professor: NamedPerson & { institution: string | null };
  lead: PersonSummary;
  /** Students who have already joined, not counting the lead. */
  collaborators: PersonSummary[];
}

const REQUEST_STAGE: Record<GroupInvite["status"], string> = {
  pending: "Awaiting professor",
  viewed: "Seen by professor",
  active: "Accepted by professor",
};

export function GroupInviteCard({ invite }: { invite: GroupInvite }) {
  const router = useRouter();
  const [running, setRunning] = useState<"accept" | "decline" | null>(null);
  const students = [invite.lead, ...invite.collaborators];

  const respond = async (decision: "accept" | "decline") => {
    setRunning(decision);
    try {
      const result = await respondToGroupInvite(invite.requestId, decision);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      if (decision === "accept") {
        toast.success("You've joined the group.");
        router.push(`/messages/${invite.requestId}`);
      } else {
        toast.success("Invitation declined.");
        router.refresh();
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setRunning(null);
    }
  };

  return (
    <div
      style={{
        position: "relative",
        background: "rgba(255, 255, 255, 0.98)",
        border: "1px solid rgba(79, 70, 229, 0.4)",
        borderRadius: "16px",
        padding: "1.75rem 2rem",
        display: "flex",
        flexDirection: "column",
        gap: "1.1rem",
        overflow: "hidden",
        boxShadow: "0 8px 30px rgba(79, 70, 229, 0.08)",
      }}
    >
      {/* Top shimmer line */}
      <div style={{
        position: "absolute", insetInline: 0, top: 0, height: "2px",
        background: "linear-gradient(90deg, transparent, var(--accent), var(--accent-blue), transparent)",
      }} />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
        <span style={{ fontSize: "0.58rem", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--accent)", fontFamily: "var(--font-sans, monospace)" }}>
          Collaboration Invite
        </span>
        <span style={{ fontSize: "0.62rem", color: "var(--text-secondary)", opacity: 0.7, fontWeight: 600, fontFamily: "var(--font-sans)" }}>
          {new Date(invite.invitedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </span>
      </div>

      <div>
        <p style={{ fontSize: "0.92rem", lineHeight: 1.55, color: "var(--text-primary)", fontFamily: "var(--font-sans)" }}>
          <strong>{fullName(invite.lead)}</strong> invited you to work with{" "}
          <strong>{facultyName(invite.professor)}</strong>
        </p>
        {invite.professor.institution && (
          <p style={{ fontSize: "0.72rem", color: "var(--text-secondary)", opacity: 0.75, marginTop: "0.15rem", fontFamily: "var(--font-sans)" }}>
            {invite.professor.institution}
          </p>
        )}
      </div>

      <div>
        <div style={{ fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--text-secondary)", opacity: 0.6, marginBottom: "0.4rem", fontFamily: "var(--font-sans, monospace)" }}>
          Research Topic
        </div>
        <p className="font-display" style={{ fontSize: "0.95rem", lineHeight: 1.6, color: "var(--text-primary)", fontStyle: "italic", fontWeight: 500 }}>
          &ldquo;{invite.topic}&rdquo;
        </p>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "0.7rem", flexWrap: "wrap", paddingTop: "0.9rem", borderTop: "1px solid rgba(99, 102, 241, 0.25)" }}>
        <AvatarStack people={students} size={1.7} />
        <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)", fontFamily: "var(--font-sans)", flex: "1 1 10rem", minWidth: 0 }}>
          {listNames(students)} · {students.length} student{students.length === 1 ? "" : "s"} so far
        </span>
        <span style={{ fontSize: "0.52rem", fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--accent)", background: "rgba(79, 70, 229, 0.08)", border: "1px solid rgba(79, 70, 229, 0.25)", padding: "0.25rem 0.65rem", borderRadius: "100px", fontFamily: "var(--font-sans, monospace)" }}>
          {REQUEST_STAGE[invite.status]}
        </span>
      </div>

      <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
        <ActionPill
          tone="primary"
          icon={<Check size={12} aria-hidden="true" />}
          loading={running === "accept"}
          disabled={running !== null}
          onClick={() => respond("accept")}
        >
          Join Group
        </ActionPill>
        <ActionPill
          tone="quiet"
          icon={<X size={12} aria-hidden="true" />}
          loading={running === "decline"}
          disabled={running !== null}
          onClick={() => respond("decline")}
        >
          Decline
        </ActionPill>
      </div>
    </div>
  );
}
