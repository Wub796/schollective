"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { updateProfessorStatus, scoreApplication } from "@/app/admin/dashboard/actions";
import { CheckCircle, XCircle, Loader2, Mail, GraduationCap, RefreshCw } from "lucide-react";
import { scoreProfessorApplication, scoreLabel } from "@/lib/validators";

interface PendingProfessor {
  id: string;
  first_name: string;
  last_name: string;
  preferred_name: string | null;
  email: string;
  institution: string | null;
  expertise_fields: string[] | null;
  ai_score?: number | null;
  ai_level?: string | null;
  ai_flags?: string[] | null;
}

interface AdminReviewTableProps {
  applicants: PendingProfessor[];
}

/** Inline score badge rendered entirely client-side */
function ScoreBadge({ prof }: { prof: PendingProfessor }) {
  const [scoring, setScoring] = useState(false);
  const router = useRouter();

  // If already scored in DB, show stored value
  const stored = typeof prof.ai_score === "number";
  const score  = stored
    ? prof.ai_score!
    : scoreProfessorApplication({
        email:            prof.email,
        institution:      prof.institution,
        expertise_fields: prof.expertise_fields,
        first_name:       prof.first_name,
        last_name:        prof.last_name,
      }).score;

  const { label, color } = scoreLabel(score);

  const handleRescore = async () => {
    setScoring(true);
    await scoreApplication(prof.id);
    router.refresh();
    setScoring(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "flex-start" }}>
      {/* Score ring + number */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
        <div style={{ position: "relative", width: "2.2rem", height: "2.2rem" }}>
          <svg viewBox="0 0 36 36" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
            <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(15, 23, 42, 0.06)" strokeWidth="3" />
            <circle
              cx="18" cy="18" r="15"
              fill="none"
              stroke={color}
              strokeWidth="3"
              strokeDasharray={`${(score / 100) * 94.25} 94.25`}
              strokeLinecap="round"
            />
          </svg>
          <span style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "0.48rem", fontWeight: 800, color, fontFamily: "var(--font-sans)",
          }}>
            {score}
          </span>
        </div>
        <div>
          <div style={{ fontSize: "0.58rem", fontWeight: 700, color, letterSpacing: "0.06em", fontFamily: "var(--font-sans)" }}>
            {label}
          </div>
          <button
            onClick={handleRescore}
            disabled={scoring}
            className="btn-icon"
            style={{
              display: "flex", alignItems: "center", gap: "0.25rem",
              fontSize: "0.48rem", color: "rgba(15, 23, 42, 0.25)",
              background: "none", border: "none", cursor: "pointer",
              padding: 0, fontFamily: "var(--font-sans)", marginTop: "0.1rem",
            }}
          >
            {scoring
              ? <Loader2 size={8} style={{ animation: "spin 1s linear infinite" }} />
              : <RefreshCw size={8} />
            }
            {scoring ? "Scoring…" : "Rescore"}
          </button>
        </div>
      </div>

      {/* Flags */}
      {(prof.ai_flags ?? []).length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
          {(prof.ai_flags ?? []).slice(0, 2).map((flag, i) => (
            <div key={i} style={{ fontSize: "0.48rem", color: "rgba(255,120,60,0.75)", fontFamily: "var(--font-sans)" }}>
              ⚠ {flag}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function AdminReviewTable({ applicants }: AdminReviewTableProps) {
  const router = useRouter();
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Auto-score any applicants that haven't been scored yet
  useEffect(() => {
    const unscored = applicants.filter((a) => typeof a.ai_score !== "number");
    if (unscored.length === 0) return;
    (async () => {
      await Promise.all(unscored.map((a) => scoreApplication(a.id)));
      router.refresh();
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStatusChange = async (id: string, status: "approved" | "rejected") => {
    setProcessingId(id);
    try {
      const result = await updateProfessorStatus(id, status);
      if (result?.error) console.error(result.error);
      else router.refresh();
    } catch (error) {
      console.error("Failed to update professor status:", error);
    } finally {
      setProcessingId(null);
    }
  };

  if (applicants.length === 0) {
    return (
      <div style={{ border: "1px dashed rgba(15,23,42,0.08)", borderRadius: "16px", padding: "4rem 2rem", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "1.25rem" }}>
        <div style={{ width: "3rem", height: "3rem", borderRadius: "50%", background: "rgba(79,70,229,0.05)", border: "1px solid rgba(79,70,229,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <CheckCircle size={18} style={{ color: "rgba(79,70,229,0.5)" }} />
        </div>
        <div>
          <h3 className="font-display" style={{ fontSize: "1.2rem", fontWeight: 700, color: "rgba(15,23,42,0.7)", marginBottom: "0.5rem", letterSpacing: "-0.02em" }}>Queue Cleared</h3>
          <p style={{ fontSize: "0.8rem", color: "rgba(15,23,42,0.32)", maxWidth: "24rem", lineHeight: 1.7, fontFamily: "var(--font-sans)" }}>
            There are no pending professor applications currently awaiting review.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Desktop Table */}
      <div className="hidden lg:block" style={{ border: "1px solid rgba(15,23,42,0.06)", borderRadius: "14px", overflow: "hidden", background: "rgba(15,23,42,0.015)" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(15,23,42,0.05)" }}>
                {["Applicant", "Institution", "Expertise", "Confidence Score", "Actions"].map((h, i) => (
                  <th
                    key={h}
                    style={{ padding: "0.85rem 1.25rem", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(15,23,42,0.2)", fontFamily: "var(--font-sans, monospace)", whiteSpace: "nowrap", textAlign: i === 4 ? "right" : "left" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {applicants.map((prof) => {
                const displayName = prof.preferred_name || prof.first_name;
                const isProcessing = processingId === prof.id;
                return (
                  <tr
                    key={prof.id}
                    style={{ borderBottom: "1px solid rgba(15,23,42,0.04)", transition: "background 0.15s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(15,23,42,0.02)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "1rem 1.25rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div style={{ width: "2rem", height: "2rem", borderRadius: "8px", background: "rgba(15,23,42,0.04)", border: "1px solid rgba(15,23,42,0.07)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: 700, color: "rgba(15,23,42,0.4)", fontFamily: "var(--font-sans)", flexShrink: 0 }}>
                          {prof.first_name[0]}{prof.last_name[0]}
                        </div>
                        <div>
                          <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-sans)" }}>Dr. {displayName} {prof.last_name}</div>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.6rem", color: "rgba(15,23,42,0.3)", fontFamily: "var(--font-sans)", marginTop: "0.15rem" }}>
                            <Mail size={9} />
                            {prof.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "1rem 1.25rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.72rem", color: "rgba(15,23,42,0.4)", fontFamily: "var(--font-sans)" }}>
                        <GraduationCap size={12} style={{ flexShrink: 0, color: "rgba(15,23,42,0.25)" }} />
                        {prof.institution || <span style={{ fontStyle: "italic", color: "rgba(15,23,42,0.2)" }}>Not specified</span>}
                      </div>
                    </td>
                    <td style={{ padding: "1rem 1.25rem" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", maxWidth: "200px" }}>
                        {prof.expertise_fields?.map((field, idx) => (
                          <span key={idx} style={{ padding: "0.2rem 0.55rem", borderRadius: "6px", background: "var(--accent-dim)", border: "1px solid rgba(79,70,229,0.12)", color: "var(--accent)", fontSize: "0.58rem", fontWeight: 600, fontFamily: "var(--font-sans)" }}>
                            {field}
                          </span>
                        )) || <span style={{ fontSize: "0.72rem", fontStyle: "italic", color: "rgba(15,23,42,0.2)" }}>None</span>}
                      </div>
                    </td>
                    <td style={{ padding: "1rem 1.25rem" }}>
                      <ScoreBadge prof={prof} />
                    </td>
                    <td style={{ padding: "1rem 1.25rem", textAlign: "right" }}>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                        <Button size="sm" onClick={() => handleStatusChange(prof.id, "approved")} disabled={isProcessing}>
                          {isProcessing ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                          Approve
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleStatusChange(prof.id, "rejected")} disabled={isProcessing}>
                          {isProcessing ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
                          Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {applicants.map((prof) => {
          const displayName = prof.preferred_name || prof.first_name;
          const isProcessing = processingId === prof.id;
          return (
            <div key={prof.id} style={{ padding: "1.25rem", border: "1px solid rgba(15,23,42,0.06)", borderRadius: "12px", background: "rgba(15,23,42,0.015)", display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{ width: "2.2rem", height: "2.2rem", borderRadius: "8px", background: "rgba(15,23,42,0.04)", border: "1px solid rgba(15,23,42,0.07)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: 700, color: "rgba(15,23,42,0.4)", fontFamily: "var(--font-sans)", flexShrink: 0 }}>
                  {prof.first_name[0]}{prof.last_name[0]}
                </div>
                <div>
                  <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-sans)" }}>Dr. {displayName} {prof.last_name}</div>
                  <div style={{ fontSize: "0.6rem", color: "rgba(15,23,42,0.3)", fontFamily: "var(--font-sans)" }}>{prof.email}</div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.72rem", color: "rgba(15,23,42,0.4)", fontFamily: "var(--font-sans)" }}>
                  <GraduationCap size={12} style={{ flexShrink: 0, color: "rgba(15,23,42,0.25)" }} />{prof.institution}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                  {prof.expertise_fields?.map((field, idx) => (
                    <span key={idx} style={{ padding: "0.2rem 0.55rem", borderRadius: "6px", background: "var(--accent-dim)", border: "1px solid rgba(79,70,229,0.12)", color: "var(--accent)", fontSize: "0.58rem", fontWeight: 600, fontFamily: "var(--font-sans)" }}>{field}</span>
                  ))}
                </div>
                <ScoreBadge prof={prof} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
                <Button size="sm" onClick={() => handleStatusChange(prof.id, "approved")} disabled={isProcessing}>
                  {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                  Approve
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleStatusChange(prof.id, "rejected")} disabled={isProcessing}>
                  {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                  Reject
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
