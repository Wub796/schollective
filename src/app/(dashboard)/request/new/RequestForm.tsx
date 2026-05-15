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
    background: focused ? "rgba(17, 17, 22, 0.9)" : "rgba(17, 17, 22, 0.6)",
    border: `1px solid ${focused ? "rgba(129, 140, 248, 0.35)" : "rgba(129, 140, 248, 0.1)"}`,
    borderRadius: "12px",
    padding: "0.875rem 1.1rem",
    fontSize: "0.875rem",
    color: "rgba(250, 250, 249, 0.9)",
    outline: "none",
    transition: "border-color 0.2s, background 0.2s",
    fontFamily: "var(--font-sans)",
    lineHeight: 1.6,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
      <label
        htmlFor={id}
        style={{
          fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: focused ? "rgba(129, 140, 248, 0.6)" : "rgba(250, 250, 249, 0.3)",
          fontFamily: "var(--font-mono, monospace)",
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

export function RequestForm({ professor }: RequestFormProps) {
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
        padding: "1.25rem 1.5rem",
        background: "rgba(129, 140, 248, 0.04)",
        border: "1px solid rgba(129, 140, 248, 0.1)",
        borderRadius: "14px",
      }}>
        <div style={{
          width: "2.75rem", height: "2.75rem", borderRadius: "10px", flexShrink: 0,
          background: "rgba(129, 140, 248, 0.08)",
          border: "1px solid rgba(129, 140, 248, 0.18)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "0.85rem", fontWeight: 700, color: "rgba(129, 140, 248, 0.9)",
          fontFamily: "var(--font-sans)",
        }}>
          {professor.first_name[0]}{professor.last_name[0]}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontSize: "0.52rem", fontWeight: 700, letterSpacing: "0.22em",
            textTransform: "uppercase", color: "rgba(129, 140, 248, 0.4)",
            fontFamily: "var(--font-mono, monospace)", marginBottom: "0.3rem",
          }}>
            Receiving Professor
          </div>
          <div className="font-display" style={{
            fontSize: "1.05rem", fontWeight: 700,
            color: "rgba(250, 250, 249, 0.88)", letterSpacing: "-0.015em",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            Dr. {profDisplayName} {professor.last_name}
          </div>
          {professor.institution && (
            <div style={{
              fontSize: "0.72rem", color: "rgba(168, 179, 207, 0.4)",
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

      {/* Submit */}
      <Button
        type="submit"
        disabled={loading}
        style={{ width: "100%", padding: "1rem", fontSize: "0.78rem", gap: "0.75rem" }}
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin" size={15} />
            Sending Request…
          </>
        ) : (
          <>
            Send Mentorship Request
            <ArrowRight size={15} />
          </>
        )}
      </Button>
    </form>
  );
}
