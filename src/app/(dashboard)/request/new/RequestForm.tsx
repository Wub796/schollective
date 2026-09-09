"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { CollaboratorPicker } from "@/components/features/CollaboratorPicker";
import { submitMentorshipRequest } from "./actions";
import { Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import posthog from "posthog-js";
import { MAX_COLLABORATORS } from "@/lib/collaboration";
import type { StudentCard } from "@/lib/neon/social";
import { facultyName } from "@/lib/people";

interface RequestFormProps {
  professor: {
    id: string;
    first_name: string;
    last_name: string;
    preferred_name: string | null;
    /** The title this professor chose to be addressed by; null is read as "Dr.". */
    honorific?: string | null;
    institution: string | null;
  };
  requestsToday: number;
  /** The student's accepted friends — the only students who can be added as collaborators. */
  friends: StudentCard[];
}

function FormField({
  id,
  name,
  label,
  placeholder,
  required = false,
  type = "input",
}: {
  id: string;
  name: string;
  label: string;
  placeholder: string;
  required?: boolean;
  type?: "input" | "textarea";
}) {
  const [focused, setFocused] = useState(false);

  const baseInputStyle: React.CSSProperties = {
    width: "100%",
    background: focused ? "rgba(255, 255, 255, 0.95)" : "rgba(255, 255, 255, 0.6)",
    border: `1px solid ${focused ? "var(--accent)" : "var(--border)"}`,
    borderRadius: type === "textarea" ? "28px" : "100px",
    padding: type === "textarea" ? "1.25rem 1.75rem" : "0.95rem 1.75rem",
    fontSize: "0.875rem",
    color: "var(--text-primary)",
    outline: "none",
    transition: "border-color 0.25s ease, background-0.25s ease, box-shadow 0.25s ease",
    boxShadow: focused ? "0 0 0 4px rgba(79, 70, 229, 0.08)" : "none",
    fontFamily: "var(--font-sans)",
    lineHeight: 1.6,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
      <label
        htmlFor={id}
        style={{
          fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: focused ? "var(--accent)" : "var(--text-tertiary)",
          fontFamily: "var(--font-sans, monospace)",
          transition: "color 0.2s",
        }}
      >
        {label}
      </label>
      {type === "textarea" ? (
        <textarea
          id={id}
          name={name}
          required={required}
          placeholder={placeholder}
          rows={5}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            ...baseInputStyle,
            resize: "none",
            minHeight: "130px",
          }}
        />
      ) : (
        <input
          id={id}
          name={name}
          type="text"
          required={required}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={baseInputStyle}
        />
      )}
    </div>
  );
}

export function RequestForm({ professor, requestsToday, friends }: RequestFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [collaboratorIds, setCollaboratorIds] = useState<string[]>([]);
  const professorName = facultyName(professor);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      const result = await submitMentorshipRequest(formData);
      if (result?.error) {
        toast.error(result.error);
      } else {
        posthog.capture("request_form_submitted", {
          professor_id: professor.id,
          professor_institution: professor.institution ?? undefined,
          collaborator_count: collaboratorIds.length,
        });
        if (result?.invitesFailed) {
          toast.warning("Request sent, but your collaborators couldn't be invited. You can invite them from the thread.");
        } else {
          toast.success(collaboratorIds.length > 0 ? "Request sent. Your collaborators have been invited." : "Request sent successfully!");
        }
        // The thread list is where the new request, and the group's invitations, show up.
        router.push("/threads");
      }
    } catch {
      toast.error("Failed to submit request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} method="post" style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
      <input type="hidden" name="prof_id" value={professor.id} />

      {/* Professor preview strip */}
      <div style={{
        display: "flex", alignItems: "center", gap: "1.25rem",
        padding: "1.25rem 1.75rem",
        background: "rgba(79, 70, 229, 0.04)",
        border: "1px solid rgba(79, 70, 229, 0.1)",
        borderRadius: "20px",
      }}>
        <div style={{
          width: "2.75rem", height: "2.75rem", borderRadius: "100px", flexShrink: 0,
          background: "rgba(79, 70, 229, 0.08)",
          border: "1px solid rgba(79, 70, 229, 0.18)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "0.85rem", fontWeight: 700, color: "rgba(79, 70, 229, 0.9)",
          fontFamily: "var(--font-sans)",
        }}>
          {professor.first_name[0]}{professor.last_name[0]}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontSize: "0.52rem", fontWeight: 700, letterSpacing: "0.22em",
            textTransform: "uppercase", color: "rgba(79, 70, 229, 0.4)",
            fontFamily: "var(--font-sans, monospace)", marginBottom: "0.3rem",
          }}>
            Receiving Professor
          </div>
          <div className="font-display" style={{
            fontSize: "1.05rem", fontWeight: 700,
            color: "rgba(15, 23, 42, 0.88)", letterSpacing: "-0.015em",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {professorName}
          </div>
          {professor.institution && (
            <div style={{
              fontSize: "0.72rem", color: "rgba(15, 23, 42, 0.4)",
              fontFamily: "var(--font-sans)", marginTop: "0.15rem",
            }}>
              {professor.institution}
            </div>
          )}
        </div>
      </div>

      {/* Fields */}
      <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        <FormField
          id="topic"
          name="topic"
          label="Mentorship Topic / Research Focus"
          placeholder="e.g. Science Fair Guidance in Machine Learning & Bioengineering"
          required
        />
        <FormField
          id="background"
          name="background"
          label="Academic Background & Current Progress (AP/IB/Coursework, Skills, Projects)"
          placeholder="e.g. High School Senior (12th Grade). Completed AP Computer Science A & AP Physics C. Built a custom neural net for image classification. Seeking guidance on paper structure and research methodology..."
          required
          type="textarea"
        />
        <FormField
          id="goals"
          name="goals"
          label="Specific Mentorship Goals (Science Fair, College Prep Portfolio, REU/Lab Skills)"
          placeholder="e.g. Seeking expert feedback on my science fair project design, research paper draft, or advice on university lab research..."
          required
          type="textarea"
        />
      </div>

      {/* Collaborators */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
          <span style={{
            fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.22em",
            textTransform: "uppercase", color: "var(--text-tertiary)",
            fontFamily: "var(--font-sans, monospace)",
          }}>
            Collaborators (Optional)
          </span>
          {friends.length > 0 && (
            <span style={{ fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(79, 70, 229, 0.6)", fontFamily: "var(--font-sans, monospace)" }}>
              {collaboratorIds.length} of {MAX_COLLABORATORS} added
            </span>
          )}
        </div>
        <p style={{ fontSize: "0.8rem", color: "rgba(15, 23, 42, 0.5)", lineHeight: 1.7, fontFamily: "var(--font-sans)" }}>
          Working on this with classmates? Add friends and they&apos;ll be invited to join the thread.
          {professorName} will see that this is a group request.
        </p>
        <CollaboratorPicker
          candidates={friends}
          selected={collaboratorIds}
          onChange={setCollaboratorIds}
          max={MAX_COLLABORATORS}
          inputName="collaborator_ids"
          disabled={loading}
          emptyMessage={
            <>
              You haven&apos;t added any friends yet.{" "}
              <Link href="/friends" style={{ color: "var(--accent)", fontWeight: 700, textDecoration: "none" }}>
                Find classmates
              </Link>{" "}
              to collaborate with on a request.
            </>
          }
        />
      </div>

      {/* Rate limit counter and warning */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "1rem 1.5rem",
        borderRadius: "14px",
        background: requestsToday >= 5 ? "rgba(239, 68, 68, 0.05)" : "rgba(79, 70, 229, 0.04)",
        border: requestsToday >= 5 ? "1px solid rgba(239, 68, 68, 0.2)" : "1px solid rgba(79, 70, 229, 0.1)",
        marginTop: "1rem"
      }}>
        <span style={{ fontSize: "0.8rem", color: requestsToday >= 5 ? "#ef4444" : "rgba(15, 23, 42, 0.5)", fontFamily: "var(--font-sans)" }}>
          {requestsToday >= 5 ? (
            <strong>Daily request limit reached (5 of 5 used today)</strong>
          ) : (
            <>You have used <strong>{requestsToday}</strong> of <strong>5</strong> daily requests.</>
          )}
        </span>
        {requestsToday < 5 && (
          <span style={{ fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(79, 70, 229, 0.5)", fontFamily: "var(--font-sans, monospace)" }}>
            {5 - requestsToday} remaining
          </span>
        )}
      </div>

      {/* Submit */}
      {requestsToday >= 5 ? (
        <div style={{
          textAlign: "center",
          padding: "1.25rem",
          borderRadius: "100px",
          background: "rgba(15, 23, 42, 0.03)",
          border: "1px dashed rgba(15, 23, 42, 0.12)",
          color: "rgba(15, 23, 42, 0.4)",
          fontSize: "0.78rem",
          fontWeight: 600,
          fontFamily: "var(--font-sans)",
          cursor: "not-allowed",
        }}>
          You've reached your daily limit of 5 requests. Please try again tomorrow.
        </div>
      ) : (
        <Button
          type="submit"
          disabled={loading}
          size="lg"
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={15} />
              Sending Request…
            </>
          ) : (
            <>
              Send Mentorship Request
              <ArrowRight size={15} style={{ marginLeft: "0.5rem" }} />
            </>
          )}
        </Button>
      )}
    </form>
  );
}
