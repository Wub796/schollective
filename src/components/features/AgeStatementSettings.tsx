"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  ADULT_AGE,
  GUARDIAN_CONSENT_STATEMENT,
  MINIMUM_AGE,
  SAFETY_REPORT_EMAIL,
  ageBandFor,
} from "@/lib/youth-protection";

/**
 * The date of birth, on the settings page.
 *
 * It exists because onboarding only asks the accounts created after this
 * feature: anybody who signed up earlier has no date of birth and would never be
 * asked for one, which would leave the published policy claiming something the
 * product does not do. So the same two questions live here too, and the card says
 * so out loud when an account still has not answered.
 *
 * Styled from the same three constants the settings surface already uses
 * (`card`, `labelStyle`, `fieldStyle`, as in FeedbackSettings and
 * AccountSecuritySettings) rather than from its own set: this sits directly
 * above the security panel, and a card with its own padding and radius next to
 * one that is right reads as a mistake.
 *
 * The rules themselves are enforced server-side by the endpoint onboarding also
 * uses (`/api/auth/profile/age`); this is the form, not the rule.
 */

interface AgeRecord {
  dateOfBirth: string | null;
  guardianName: string | null;
  guardianEmail: string | null;
  consentAt: string | null;
  isMinor: boolean;
  needsStatement: boolean;
}

export function AgeStatementSettings({ role }: { role?: string | null }) {
  const [record, setRecord] = useState<AgeRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);

  const [dateOfBirth, setDateOfBirth] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [guardianEmail, setGuardianEmail] = useState("");
  const [guardianAttested, setGuardianAttested] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch("/api/auth/profile/age", { cache: "no-store" });
        if (!response.ok) {
          setUnavailable(true);
          return;
        }
        const data = (await response.json()) as AgeRecord;
        setRecord(data);
        setDateOfBirth(data.dateOfBirth ?? "");
        setGuardianName(data.guardianName ?? "");
        setGuardianEmail(data.guardianEmail ?? "");
        // A consent already on file counts as agreed. The box is only on screen
        // to record a NEW agreement, and pre-ticking it would let a save that
        // changed nothing look like a fresh consent.
        setGuardianAttested(false);
      } catch {
        setUnavailable(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Faculty are not asked for a birth date; see needsAgeStatement in
  // src/lib/youth-protection.ts.
  if (role && role !== "student") return null;

  const band = ageBandFor(dateOfBirth || null);
  const needsGuardian = band === "minor";
  const tooYoung = band === "under-minimum";

  const save = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/auth/profile/age", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dateOfBirth, guardianName, guardianEmail, guardianAttested }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        toast.error(data?.error || "We could not save your date of birth.");
        return;
      }

      toast.success("Date of birth saved.");
      setRecord((prev) =>
        prev
          ? {
              ...prev,
              dateOfBirth,
              guardianName: data?.guardianRecorded ? guardianName : prev.guardianName,
              guardianEmail: data?.guardianRecorded ? guardianEmail : prev.guardianEmail,
              isMinor: data?.isMinor === true,
              needsStatement: false,
            }
          : prev,
      );
      setGuardianAttested(false);
    } catch {
      toast.error("We could not reach the server. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const card: React.CSSProperties = {
    background: "rgba(255, 255, 255, 0.9)",
    borderRadius: "16px",
    padding: "2rem",
    border: "1px solid rgba(99, 102, 241, 0.18)",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "0.65rem", fontWeight: 800, color: "var(--text-secondary)",
    textTransform: "uppercase", display: "block", marginBottom: "0.45rem",
    letterSpacing: "0.15em",
  };

  const fieldStyle: React.CSSProperties = {
    width: "100%", padding: "0.8rem 1rem", borderRadius: "100px",
    border: "1.5px solid rgba(99, 102, 241, 0.4)",
    background: "rgba(255, 255, 255, 0.95)", fontSize: "0.9rem",
    color: "var(--text-primary)", outline: "none", fontFamily: "var(--font-sans)",
  };

  return (
    <div style={card} id="safety">
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.3rem" }}>
        <ShieldCheck size={20} color="#4f46e5" />
        <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
          Safety &amp; Age
        </h3>
      </div>
      <p style={{
        margin: "0 0 1.5rem", fontSize: "0.85rem", lineHeight: 1.7,
        color: "var(--text-secondary)", maxWidth: "46rem",
      }}>
        This decides which youth protection rules apply to your mentorship threads. It is never
        shown on your profile, and no professor or classmate can see it.
      </p>

      {loading ? (
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.78rem", color: "var(--text-tertiary)" }}>
          <Loader2 size={14} className="animate-spin" />
          Loading your record…
        </div>
      ) : unavailable ? (
        <p style={{
          margin: 0, display: "flex", gap: "0.5rem", alignItems: "flex-start",
          padding: "0.85rem 1rem", borderRadius: "var(--radius-inset)",
          background: "rgba(217, 119, 6, 0.08)", border: "1px solid rgba(217, 119, 6, 0.28)",
          fontSize: "0.8rem", lineHeight: 1.6, color: "#b45309",
        }}>
          <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: "0.15rem" }} />
          <span>We could not load your date of birth. If this is about a safety concern, email {SAFETY_REPORT_EMAIL}.</span>
        </p>
      ) : (
        <form
          onSubmit={(event) => { event.preventDefault(); void save(); }}
          style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
        >
          {record?.needsStatement && (
            <p style={{
              margin: 0, display: "flex", gap: "0.5rem", alignItems: "flex-start",
              padding: "0.85rem 1rem", borderRadius: "var(--radius-inset)",
              background: "rgba(217, 119, 6, 0.08)", border: "1px solid rgba(217, 119, 6, 0.28)",
              fontSize: "0.8rem", lineHeight: 1.6, color: "#b45309",
            }}>
              <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: "0.15rem" }} />
              <span>
                We do not have a date of birth for this account, so your threads are protected by
                the cautious default: a high-school education level is treated as a minor. Adding
                it lets us apply the right rules.
              </span>
            </p>
          )}

          {record && !record.needsStatement && (
            <p style={{ margin: 0, display: "flex", alignItems: "center", gap: "0.45rem", fontSize: "0.82rem", color: "var(--text-secondary)" }}>
              <CheckCircle2 size={14} color="#4f46e5" />
              {record.isMinor
                ? `Recorded as under ${ADULT_AGE}${record.consentAt ? ", with a parent or guardian's consent on file" : ""}.`
                : "Recorded as an adult, so the one-to-one rules for minors do not apply to your threads."}
            </p>
          )}

          <div style={{ maxWidth: "20rem" }}>
            <label htmlFor="settings_date_of_birth" style={labelStyle}>Date of Birth</label>
            <input
              id="settings_date_of_birth"
              type="date"
              value={dateOfBirth}
              onChange={(event) => setDateOfBirth(event.target.value)}
              style={{
                ...fieldStyle,
                borderColor: tooYoung ? "#ef4444" : "rgba(99, 102, 241, 0.4)",
              }}
            />
          </div>

          {tooYoung && (
            <p style={{ margin: 0, fontSize: "0.8rem", lineHeight: 1.6, color: "#ef4444" }}>
              Schollective is for students aged {MINIMUM_AGE} and over. If that is wrong for this
              account, contact us and we will fix it.
            </p>
          )}

          {needsGuardian && (
            <div style={{
              display: "flex", flexDirection: "column", gap: "1.15rem",
              padding: "1.35rem", borderRadius: "var(--radius-inset)",
              border: "1px solid rgba(99, 102, 241, 0.28)",
              background: "rgba(99, 102, 241, 0.05)",
            }}>
              <p style={{ margin: 0, fontSize: "0.82rem", lineHeight: 1.7, color: "var(--text-secondary)" }}>
                Because this account is under {ADULT_AGE}, a parent or guardian has to agree.
                {record?.consentAt ? " A consent is already on file; fill this in only if it has changed." : ""}
              </p>

              <div className="grid-2" style={{ gap: "1.25rem" }}>
                <div>
                  <label htmlFor="settings_guardian_name" style={labelStyle}>Parent / Guardian Name</label>
                  <input
                    id="settings_guardian_name"
                    type="text"
                    value={guardianName}
                    onChange={(event) => setGuardianName(event.target.value)}
                    placeholder="Alex Rivera"
                    style={fieldStyle}
                  />
                </div>
                <div>
                  <label htmlFor="settings_guardian_email" style={labelStyle}>Parent / Guardian Email</label>
                  <input
                    id="settings_guardian_email"
                    type="email"
                    value={guardianEmail}
                    onChange={(event) => setGuardianEmail(event.target.value)}
                    placeholder="alex@example.com"
                    style={fieldStyle}
                  />
                </div>
              </div>

              <label style={{
                display: "flex", gap: "0.7rem", alignItems: "flex-start",
                fontSize: "0.82rem", lineHeight: 1.65, color: "var(--text-secondary)",
                cursor: "pointer",
              }}>
                <input
                  type="checkbox"
                  checked={guardianAttested}
                  onChange={(event) => setGuardianAttested(event.target.checked)}
                  style={{ marginTop: "0.25rem", accentColor: "#4f46e5", flexShrink: 0 }}
                />
                <span>{GUARDIAN_CONSENT_STATEMENT}</span>
              </label>
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
            <Button
              type="submit"
              disabled={saving || tooYoung || !dateOfBirth || (needsGuardian && !guardianAttested)}
              variant="primary"
              size="md"
            >
              {saving ? "Saving…" : "Save date of birth"}
            </Button>
            <span style={{ fontSize: "0.78rem", color: "var(--text-tertiary)" }}>
              The rules this decides are published in the{" "}
              <Link href="/safety" className="link-underline font-semibold text-accent">
                Youth Protection Policy
              </Link>
              .
            </span>
          </div>
        </form>
      )}
    </div>
  );
}
