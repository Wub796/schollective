"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { LogOut, Send, UserPlus, UserX, X } from "lucide-react";
import { toast } from "sonner";
import { ActionPill } from "@/components/ui/ActionPill";
import { AvatarStack } from "@/components/ui/Avatar";
import { PersonRow, RowBadge, type PersonSummary } from "@/components/features/PersonRow";
import { CollaboratorPicker } from "@/components/features/CollaboratorPicker";
import { inviteCollaborators, leaveThread, removeCollaborator } from "@/app/messages/[id]/actions";
import {
  MAX_COLLABORATORS,
  canInviteCollaborators,
  canLeaveThread,
  canRemoveMember,
  remainingCollaboratorSlots,
  type ThreadRole,
} from "@/lib/collaboration";
import { fullName } from "@/lib/people";
import type { ThreadMember } from "@/lib/neon/social";
import type { MemberStatus, RequestStatus } from "@/lib/status";

interface GroupMembersPanelProps {
  requestId: string;
  viewerId: string;
  role: ThreadRole;
  requestStatus: RequestStatus;
  lead: PersonSummary;
  professor: PersonSummary;
  /** Every student ever on the thread besides the lead, in invitation order. */
  members: ThreadMember[];
  /** The lead's friends who are not currently on the thread. Empty for everyone else. */
  invitableFriends: PersonSummary[];
}

const ENDED_LABEL: Partial<Record<MemberStatus, string>> = {
  declined: "Declined",
  left: "Left",
  removed: "Removed",
};

const sectionLabel: React.CSSProperties = {
  fontSize: "0.58rem",
  fontWeight: 800,
  letterSpacing: "0.2em",
  textTransform: "uppercase",
  color: "var(--accent)",
  fontFamily: "var(--font-sans, monospace)",
};

const note: React.CSSProperties = {
  fontSize: "0.78rem",
  color: "var(--text-secondary)",
  opacity: 0.8,
  lineHeight: 1.65,
  fontFamily: "var(--font-sans)",
};

/**
 * Who is on a thread, and the membership actions the viewer may take: the lead
 * invites friends, the lead and professor remove students, a collaborator
 * leaves. Opens as a side panel so the conversation stays in view behind it.
 */
export function GroupMembersPanel({
  requestId,
  viewerId,
  role,
  requestStatus,
  lead,
  professor,
  members,
  invitableFriends,
}: GroupMembersPanelProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [running, setRunning] = useState<string | null>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  const joined = members.filter((member) => member.status === "joined");
  const invited = members.filter((member) => member.status === "invited");
  const past = members.filter((member) => ENDED_LABEL[member.status]);
  const students = [lead, ...joined];
  const isGroup = members.length > 0;
  const mayInvite = canInviteCollaborators(role, requestStatus);
  const slots = remainingCollaboratorSlots(joined.length + invited.length);

  useEffect(() => {
    if (!open) return;
    closeButton.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const close = () => {
    setOpen(false);
    trigger.current?.focus();
  };

  const run = async (
    key: string,
    action: () => Promise<{ error?: string } | undefined>,
    successMessage: string,
    after?: () => void,
  ) => {
    setRunning(key);
    try {
      const result = await action();
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success(successMessage);
      if (after) after();
      else router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setRunning(null);
    }
  };

  const busy = running !== null;

  const removeAction = (member: ThreadMember) =>
    canRemoveMember(role, member.status) && member.id !== viewerId ? (
      <ActionPill
        tone="quiet"
        icon={<UserX size={12} aria-hidden="true" />}
        loading={running === `remove:${member.id}`}
        disabled={busy}
        onClick={() => {
          const name = fullName(member);
          const question = member.status === "invited"
            ? `Withdraw ${name}'s invitation?`
            : `Remove ${name} from this thread? They will no longer be able to read or post in it.`;
          if (confirm(question)) {
            void run(`remove:${member.id}`, () => removeCollaborator(requestId, member.id),
              member.status === "invited" ? "Invitation withdrawn." : `${name} was removed.`);
          }
        }}
      >
        {member.status === "invited" ? "Withdraw" : "Remove"}
      </ActionPill>
    ) : undefined;

  return (
    <>
      <button
        ref={trigger}
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={isGroup ? `Group members, ${students.length} students` : "Add collaborators"}
        className="btn-action"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.55rem",
          padding: isGroup ? "0.25rem 0.85rem 0.25rem 0.3rem" : "0.5rem 0.9rem",
          borderRadius: "100px",
          border: "1px solid rgba(79, 70, 229, 0.3)",
          background: "rgba(79, 70, 229, 0.06)",
          color: "var(--accent)",
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        {isGroup ? <AvatarStack people={students} size={1.55} max={3} /> : <UserPlus size={13} aria-hidden="true" />}
        <span className="hidden sm:inline" style={{ fontSize: "0.58rem", fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", fontFamily: "var(--font-sans, monospace)" }}>
          {isGroup ? `${students.length} Student${students.length === 1 ? "" : "s"}` : "Add Collaborators"}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={close}
              aria-hidden="true"
              style={{ position: "fixed", inset: 0, background: "rgba(9, 9, 11, 0.45)", backdropFilter: "blur(4px)", zIndex: 100 }}
            />
            <motion.aside
              key="panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby="group-panel-title"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 260 }}
              style={{
                position: "fixed",
                top: 0,
                right: 0,
                bottom: 0,
                width: "min(440px, 100vw)",
                background: "var(--bg-base)",
                borderLeft: "1px solid var(--border)",
                boxShadow: "-20px 0 48px -12px rgba(15, 23, 42, 0.16)",
                zIndex: 101,
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Header */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", padding: "1.5rem 1.5rem 1.25rem", borderBottom: "1px solid rgba(99, 102, 241, 0.2)" }}>
                <div>
                  <h2 id="group-panel-title" className="font-display" style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                    {isGroup ? "Group" : "Collaborators"}
                  </h2>
                  <p style={{ ...note, marginTop: "0.2rem" }}>
                    {isGroup
                      ? `${students.length} student${students.length === 1 ? "" : "s"} working with the professor on this request.`
                      : "Bring friends onto this request to work with the professor together."}
                  </p>
                </div>
                <button
                  ref={closeButton}
                  type="button"
                  onClick={close}
                  aria-label="Close"
                  className="btn-icon"
                  style={{ width: "2rem", height: "2rem", borderRadius: "50%", border: "1px solid var(--border)", background: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
                >
                  <X size={14} aria-hidden="true" />
                </button>
              </div>

              {/* Body */}
              <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "2rem" }}>
                <section style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                  <span style={sectionLabel}>Professor</span>
                  <PersonRow person={professor} detail={professor.institution || "Faculty"} badge={role === "professor" ? <RowBadge>You</RowBadge> : undefined} />
                </section>

                <section style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                  <span style={sectionLabel}>Students</span>
                  <PersonRow
                    person={lead}
                    href={lead.id === viewerId ? undefined : `/students/${lead.id}`}
                    badge={<RowBadge>{lead.id === viewerId ? "You · Lead" : "Lead"}</RowBadge>}
                  />
                  {joined.map((member) => (
                    <PersonRow
                      key={member.id}
                      person={member}
                      href={member.id === viewerId ? undefined : `/students/${member.id}`}
                      badge={member.id === viewerId ? <RowBadge>You</RowBadge> : undefined}
                      actions={removeAction(member)}
                    />
                  ))}
                  {invited.map((member) => (
                    <PersonRow
                      key={member.id}
                      person={member}
                      muted
                      badge={<RowBadge tone="neutral">Invited</RowBadge>}
                      actions={removeAction(member)}
                    />
                  ))}
                </section>

                {mayInvite && (
                  <section style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "1rem" }}>
                      <span style={sectionLabel}>Invite Friends</span>
                      <span style={{ fontSize: "0.62rem", color: "var(--text-tertiary)", fontFamily: "var(--font-sans)" }}>
                        {slots} of {MAX_COLLABORATORS} spots open
                      </span>
                    </div>
                    {slots === 0 ? (
                      <p style={note}>This group is full. Withdraw an invitation or remove a student to make room.</p>
                    ) : (
                      <>
                        <CollaboratorPicker
                          candidates={invitableFriends}
                          selected={selected}
                          onChange={setSelected}
                          max={slots}
                          disabled={busy}
                          emptyMessage="All of your friends are already on this thread. Add more friends from your network to invite them."
                        />
                        {invitableFriends.length > 0 && (
                          <div>
                            <ActionPill
                              tone="primary"
                              icon={<Send size={12} aria-hidden="true" />}
                              loading={running === "invite"}
                              disabled={busy || selected.length === 0}
                              onClick={() =>
                                run(
                                  "invite",
                                  () => inviteCollaborators(requestId, selected),
                                  selected.length === 1 ? "Invitation sent." : `${selected.length} invitations sent.`,
                                  () => {
                                    setSelected([]);
                                    router.refresh();
                                  },
                                )
                              }
                            >
                              Send {selected.length > 1 ? `${selected.length} Invites` : "Invite"}
                            </ActionPill>
                          </div>
                        )}
                      </>
                    )}
                  </section>
                )}

                {past.length > 0 && (
                  <section style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                    <span style={{ ...sectionLabel, color: "var(--text-tertiary)" }}>No Longer on the Thread</span>
                    {past.map((member) => (
                      <PersonRow
                        key={member.id}
                        person={member}
                        muted
                        badge={<RowBadge tone="neutral">{ENDED_LABEL[member.status]}</RowBadge>}
                      />
                    ))}
                  </section>
                )}
              </div>

              {canLeaveThread(role) && (
                <div style={{ padding: "1.25rem 1.5rem", borderTop: "1px solid rgba(99, 102, 241, 0.2)" }}>
                  <ActionPill
                    tone="danger"
                    icon={<LogOut size={12} aria-hidden="true" />}
                    loading={running === "leave"}
                    disabled={busy}
                    onClick={() => {
                      if (confirm("Leave this group? You'll lose access to the conversation unless you're invited back.")) {
                        void run("leave", () => leaveThread(requestId), "You left the group.", () => router.push("/threads"));
                      }
                    }}
                  >
                    Leave Group
                  </ActionPill>
                </div>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
