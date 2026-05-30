"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { submitMentorshipRequest } from "./actions";
import { Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface RequestFormProps {
  professor: {
    id: string;
    first_name: string;
    last_name: string;
    preferred_name: string | null;
    institution: string | null;
  };
  requestsToday: number;
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
    boxShadow: focused ? "0 0 0 4px rgba(37, 99, 235, 0.08)" : "none",
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

export function RequestForm({ professor, requestsToday }: RequestFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const profDisplayName = professor.preferred_name || professor.first_name;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      const result = await submitMentorshipRequest(formData);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Request sent successfully!");
        router.push("/dashboard");
      }
    } catch {
      toast.error("Failed to submit request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
      <input type="hidden" name="prof_id" value={professor.id} />

      {/* Professor preview strip */}
      <div style={{
        display: "flex", alignItems: "center", gap: "1.25rem",
        padding: "1.25rem 1.75rem",
        background: "rgba(37, 99, 235, 0.04)",
        border: "1px solid rgba(37, 99, 235, 0.1)",
        borderRadius: "20px",
      }}>
        <div style={{
          width: "2.75rem", height: "2.75rem", borderRadius: "100px", flexShrink: 0,
          background: "rgba(37, 99, 235, 0.08)",
          border: "1px solid rgba(37, 99, 235, 0.18)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "0.85rem", fontWeight: 700, color: "rgba(37, 99, 235, 0.9)",
          fontFamily: "var(--font-sans)",
        }}>
          {professor.first_name[0]}{professor.last_name[0]}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontSize: "0.52rem", fontWeight: 700, letterSpacing: "0.22em",
            textTransform: "uppercase", color: "rgba(37, 99, 235, 0.4)",
            fontFamily: "var(--font-sans, monospace)", marginBottom: "0.3rem",
          }}>
            Receiving Professor
          </div>
          <div className="font-display" style={{
            fontSize: "1.05rem", fontWeight: 700,
            color: "rgba(15, 23, 42, 0.88)", letterSpacing: "-0.015em",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            Dr. {profDisplayName} {professor.last_name}
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
          label="Mentorship Topic / Focus Area"
          placeholder="e.g. Research Methodology for Quantum Computing"
          required
        />
        <FormField
          id="background"
          name="background"
          label="Academic Background & Current Progress"
          placeholder="Describe your current level of understanding and what you've explored so far…"
          required
          type="textarea"
        />
        <FormField
          id="goals"
          name="goals"
          label="Specific Mentorship Goals"
          placeholder="What specifically are you hoping to achieve through this mentorship?"
          required
          type="textarea"
        />
      </div>

      {/* Rate limit counter and warning */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "1rem 1.5rem",
        borderRadius: "14px",
        background: requestsToday >= 5 ? "rgba(239, 68, 68, 0.05)" : "rgba(37, 99, 235, 0.04)",
        border: requestsToday >= 5 ? "1px solid rgba(239, 68, 68, 0.2)" : "1px solid rgba(37, 99, 235, 0.1)",
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
          <span style={{ fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(37, 99, 235, 0.5)", fontFamily: "var(--font-sans, monospace)" }}>
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
