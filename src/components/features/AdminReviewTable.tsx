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
      <div className="border border-dashed border-[rgba(15, 23, 42, 0.06)] rounded-2xl p-24 flex flex-col items-center gap-4">
        <div className="w-14 h-14 bg-[rgba(15, 23, 42, 0.03)] rounded-xl flex items-center justify-center border border-[rgba(15, 23, 42, 0.06)]">
          <CheckCircle size={24} className="text-[#4a4a4a]" />
        </div>
        <h3 className="font-display text-2xl text-[#d4d4d2] font-semibold">Queue Cleared</h3>
        <p className="text-[#4a4a4a] max-w-[320px] leading-relaxed text-sm font-light text-center">
          There are no pending professor applications currently awaiting review.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Desktop Table */}
      <div className="hidden lg:block bg-[#111111] border border-[rgba(15, 23, 42, 0.06)] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-[rgba(15, 23, 42, 0.05)]">
                {["Applicant", "Institution", "Expertise", "Confidence Score", "Actions"].map((h, i) => (
                  <th
                    key={h}
                    className={`px-7 py-4 text-[0.6rem] font-bold text-[#3a3a3a] uppercase tracking-[0.2em]${i === 4 ? " text-right" : ""}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(15, 23, 42, 0.04)]">
              {applicants.map((prof) => {
                const displayName = prof.preferred_name || prof.first_name;
                const isProcessing = processingId === prof.id;
                return (
                  <tr key={prof.id} className="hover:bg-[rgba(15, 23, 42, 0.02)] transition-colors">
                    <td className="px-7 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[rgba(15, 23, 42, 0.04)] border border-[rgba(15, 23, 42, 0.07)] flex items-center justify-center text-sm font-semibold text-[#6a6a6a]">
                          {prof.first_name[0]}{prof.last_name[0]}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-[#d4d4d2]">Dr. {displayName} {prof.last_name}</div>
                          <div className="flex items-center gap-1.5 text-[0.68rem] text-[#4a4a4a] mt-0.5">
                            <Mail size={11} />
                            {prof.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-7 py-5">
                      <div className="flex items-center gap-1.5 text-xs text-[#8a8a8a] bg-[rgba(15, 23, 42, 0.03)] border border-[rgba(15, 23, 42, 0.06)] px-3 py-1.5 rounded-lg w-fit">
                        <GraduationCap size={13} />
                        {prof.institution || "Not specified"}
                      </div>
                    </td>
                    <td className="px-7 py-5">
                      <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                        {prof.expertise_fields?.map((field, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded-md bg-[rgba(15, 23, 42, 0.03)] text-[#5a5a5a] border border-[rgba(15, 23, 42, 0.05)] text-[0.6rem]">
                            {field}
                          </span>
                        )) || <span className="text-xs italic text-[#3a3a3a]">None</span>}
                      </div>
                    </td>
                    <td className="px-7 py-5">
                      <ScoreBadge prof={prof} />
                    </td>
                    <td className="px-7 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" onClick={() => handleStatusChange(prof.id, "approved")} disabled={isProcessing} className="gap-1.5 h-8 px-3 rounded-lg text-[0.65rem]">
                          {isProcessing ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                          Approve
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleStatusChange(prof.id, "rejected")} disabled={isProcessing} className="gap-1.5 h-8 px-3 rounded-lg text-[0.65rem] hover:bg-[rgba(255,80,80,0.08)] hover:text-[#ff6b6b]">
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
      <div className="lg:hidden space-y-3">
        {applicants.map((prof) => {
          const displayName = prof.preferred_name || prof.first_name;
          const isProcessing = processingId === prof.id;
          return (
            <div key={prof.id} className="bg-[#111111] border border-[rgba(15, 23, 42, 0.06)] rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-[rgba(15, 23, 42, 0.04)] border border-[rgba(15, 23, 42, 0.07)] flex items-center justify-center text-sm font-semibold text-[#6a6a6a]">
                  {prof.first_name[0]}{prof.last_name[0]}
                </div>
                <div>
                  <div className="text-sm font-medium text-[#d4d4d2]">Dr. {displayName} {prof.last_name}</div>
                  <div className="text-[0.68rem] text-[#4a4a4a]">{prof.email}</div>
                </div>
              </div>
              <div className="space-y-3 mb-5">
                <div className="flex items-center gap-1.5 text-xs text-[#6a6a6a]">
                  <GraduationCap size={13} />{prof.institution}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {prof.expertise_fields?.map((field, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded-md bg-[rgba(15, 23, 42, 0.03)] text-[#5a5a5a] border border-[rgba(15, 23, 42, 0.05)] text-[0.6rem]">{field}</span>
                  ))}
                </div>
                {/* Score on mobile */}
                <div className="pt-1">
                  <ScoreBadge prof={prof} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button size="sm" onClick={() => handleStatusChange(prof.id, "approved")} disabled={isProcessing} className="gap-2 h-10 rounded-lg text-xs">
                  {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                  Approve
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleStatusChange(prof.id, "rejected")} disabled={isProcessing} className="gap-2 h-10 rounded-lg text-xs hover:bg-[rgba(255,80,80,0.08)] hover:text-[#ff6b6b]">
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
