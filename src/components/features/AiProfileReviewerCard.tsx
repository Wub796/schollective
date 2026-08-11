"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, CheckCircle2, AlertTriangle, RefreshCw, ShieldCheck, Copy, Plus, Lightbulb } from "lucide-react";
import { ProfileReviewResult } from "@/lib/ai/types";
import { toast } from "sonner";

interface Props {
  profileData?: any;
}

export function AiProfileReviewerCard({ profileData }: Props) {
  const [loading, setLoading] = useState(false);
  const [review, setReview] = useState<ProfileReviewResult | null>(null);
  const [appliedBio, setAppliedBio] = useState(false);

  const handleReview = async () => {
    setLoading(true);
    setAppliedBio(false);
    try {
      const bioEl = typeof document !== "undefined" ? (document.getElementById("bio") as HTMLTextAreaElement) : null;
      const instEl = typeof document !== "undefined" ? (document.getElementById("institution") as HTMLInputElement) : null;
      const levelEl = typeof document !== "undefined" ? (document.getElementById("education_level") as HTMLSelectElement) : null;
      const interestsEl = typeof document !== "undefined" ? (document.getElementById("academic_interests") as HTMLInputElement) : null;
      const extrasEl = typeof document !== "undefined" ? (document.getElementById("extracurriculars") as HTMLInputElement) : null;

      const dynamicPayload = {
        ...profileData,
        bio: bioEl ? bioEl.value : profileData?.bio,
        institution: instEl ? instEl.value : profileData?.institution,
        education_level: levelEl ? levelEl.value : profileData?.education_level,
        academic_interests: interestsEl ? interestsEl.value : profileData?.academic_interests,
        extracurriculars: extrasEl ? extrasEl.value : profileData?.extracurriculars,
      };

      const res = await fetch("/api/ai/review-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dynamicPayload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Review failed");
      }

      setReview(data.review);
      toast.success("AI Profile Review complete!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to analyze profile.");
    } finally {
      setLoading(false);
    }
  };

  const applySuggestedBio = () => {
    if (!review?.suggestedBioRewrite) return;
    const bioEl = document.getElementById("bio") as HTMLTextAreaElement;
    if (bioEl) {
      bioEl.value = review.suggestedBioRewrite;
      bioEl.dispatchEvent(new Event("change", { bubbles: true }));
      setAppliedBio(true);
      toast.success("AI polished bio applied to your profile!");
    }
  };

  const addInterestTag = (tag: string) => {
    const interestsEl = document.getElementById("academic_interests") as HTMLInputElement;
    if (interestsEl) {
      const current = interestsEl.value.trim();
      const newInterests = current ? `${current}, ${tag}` : tag;
      interestsEl.value = newInterests;
      interestsEl.dispatchEvent(new Event("change", { bubbles: true }));
      toast.success(`Added "${tag}" to Academic Interests!`);
    }
  };

  return (
    <div
      style={{
        background: "rgba(99, 102, 241, 0.06)",
        border: "1px solid rgba(99, 102, 241, 0.15)",
        borderRadius: "16px",
        padding: "1.75rem 2rem",
        marginBottom: "2.5rem",
        position: "relative",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1.25rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <span style={{ width: "1.2rem", height: "2px", background: "#6366f1", display: "block" }} />
            <span
              style={{
                fontSize: "0.62rem",
                fontWeight: 800,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "#4f46e5",
                fontFamily: "var(--font-sans, monospace)",
              }}
            >
              AI Academic Advisor
            </span>
          </div>

          <h3 className="font-display" style={{ fontSize: "1.35rem", fontWeight: 800, color: "#0f172a", margin: 0, letterSpacing: "-0.02em" }}>
            Profile <em style={{ fontStyle: "italic", color: "#4f46e5", fontWeight: 300 }}>Reviewer</em>
          </h3>
          <p style={{ fontSize: "0.85rem", color: "#475569", margin: 0, opacity: 0.85 }}>
            Real-time evaluation of your Bio, Academic Interests, Extracurriculars, & Education Level.
          </p>
        </div>

        <button
          type="button"
          onClick={handleReview}
          disabled={loading}
          style={{
            background: "#6366f1",
            color: "#ffffff",
            border: "1px solid rgba(79, 70, 229, 0.6)",
            borderRadius: "100px",
            padding: "0.65rem 1.35rem",
            fontSize: "0.8rem",
            fontWeight: 800,
            letterSpacing: "0.03em",
            fontFamily: "var(--font-sans)",
            cursor: loading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            boxShadow: "0 4px 12px rgba(99, 102, 241, 0.25)",
            transition: "all 0.2s ease",
          }}
        >
          {loading ? (
            <>
              <RefreshCw size={14} className="animate-spin" /> Analyzing...
            </>
          ) : (
            <>
              <Sparkles size={14} /> {review ? "Re-Analyze Profile" : "Analyze Profile"}
            </>
          )}
        </button>
      </div>

      <AnimatePresence>
        {review && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35 }}
            style={{ marginTop: "1.75rem", borderTop: "1px solid rgba(99, 102, 241, 0.2)", paddingTop: "1.5rem" }}
          >
            {/* Score Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: "0.85rem", marginBottom: "1.5rem" }}>
              <ScoreBadge label="Overall" score={review.overallScore} isPrimary />
              <ScoreBadge label="Completeness" score={review.completenessScore} />
              <ScoreBadge label="Academic Tone" score={review.academicToneScore} />
              <ScoreBadge label="Clarity" score={review.clarityScore} />
              <ScoreBadge label="Alignment" score={review.alignmentScore} />
            </div>

            {/* 1-Click AI Bio Polish Box */}
            {review.suggestedBioRewrite && (
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: "14px",
                  padding: "1.1rem 1.25rem",
                  border: "1px solid rgba(99, 102, 241, 0.25)",
                  marginBottom: "1.25rem",
                  boxShadow: "0 4px 16px rgba(99, 102, 241, 0.06)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#4f46e5", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    <Sparkles size={14} /> AI Polished Bio Suggestion
                  </span>
                  <button
                    type="button"
                    onClick={applySuggestedBio}
                    disabled={appliedBio}
                    style={{
                      background: appliedBio ? "rgba(16, 185, 129, 0.1)" : "#4f46e5",
                      color: appliedBio ? "#10b981" : "#ffffff",
                      border: "none",
                      borderRadius: "100px",
                      padding: "0.35rem 0.75rem",
                      fontSize: "0.72rem",
                      fontWeight: 800,
                      cursor: appliedBio ? "default" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.3rem",
                    }}
                  >
                    {appliedBio ? <CheckCircle2 size={13} /> : <Copy size={13} />}
                    {appliedBio ? "Bio Applied" : "1-Click Apply Bio"}
                  </button>
                </div>
                <p style={{ fontSize: "0.85rem", color: "#334155", fontStyle: "italic", margin: 0, lineHeight: 1.6 }}>
                  "{review.suggestedBioRewrite}"
                </p>
              </div>
            )}

            {/* Suggested Academic Interest Tags */}
            {review.suggestedInterests && review.suggestedInterests.length > 0 && (
              <div style={{ marginBottom: "1.25rem" }}>
                <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: "0.4rem" }}>
                  Suggested Academic Interest Tags (Click to add)
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                  {review.suggestedInterests.map((tag, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => addInterestTag(tag)}
                      style={{
                        background: "#ffffff",
                        border: "1px solid rgba(99, 102, 241, 0.3)",
                        color: "#4f46e5",
                        borderRadius: "100px",
                        padding: "0.25rem 0.65rem",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.25rem",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <Plus size={12} /> {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Summary Banner */}
            <div
              style={{
                background: "#ffffff",
                borderRadius: "12px",
                padding: "1rem 1.25rem",
                border: `1px solid ${review.outreachReadiness === "ready" ? "rgba(16, 185, 129, 0.4)" : "rgba(245, 158, 11, 0.4)"}`,
                marginBottom: "1.25rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                {review.outreachReadiness === "ready" ? (
                  <ShieldCheck size={16} color="#10b981" />
                ) : (
                  <AlertTriangle size={16} color="#f59e0b" />
                )}
                <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "#0f172a" }}>
                  Status: {review.outreachReadiness === "ready" ? "Outreach Ready ✓" : "Refinement Recommended"}
                </span>
              </div>
              <p style={{ fontSize: "0.85rem", color: "#475569", margin: 0, lineHeight: 1.6 }}>{review.summary}</p>
              {review.outreachTip && (
                <div style={{ marginTop: "0.6rem", paddingTop: "0.6rem", borderTop: "1px solid #f1f5f9", fontSize: "0.78rem", color: "#4f46e5", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  <Lightbulb size={14} color="#4f46e5" /> <strong>Outreach Advice:</strong> {review.outreachTip}
                </div>
              )}
            </div>

            {/* Strengths & Improvements */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem" }}>
              {/* Strengths */}
              {review.strengths?.length > 0 && (
                <div style={{ background: "#ffffff", borderRadius: "12px", padding: "1.1rem 1.25rem", border: "1px solid rgba(226, 232, 240, 0.9)" }}>
                  <h4 style={{ fontSize: "0.82rem", fontWeight: 800, color: "#166534", margin: "0 0 0.65rem 0", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <CheckCircle2 size={15} color="#166534" /> Key Strengths
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: "1.1rem", fontSize: "0.8rem", color: "#334155", lineHeight: 1.6 }}>
                    {review.strengths.map((str, idx) => (
                      <li key={idx} style={{ marginBottom: "0.3rem" }}>{str}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Improvements */}
              {review.improvements?.length > 0 && (
                <div style={{ background: "#ffffff", borderRadius: "12px", padding: "1.1rem 1.25rem", border: "1px solid rgba(226, 232, 240, 0.9)" }}>
                  <h4 style={{ fontSize: "0.82rem", fontWeight: 800, color: "#991b1b", margin: "0 0 0.65rem 0", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <AlertTriangle size={15} color="#991b1b" /> Actionable Improvements
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
                    {review.improvements.map((imp, idx) => (
                      <div key={idx} style={{ fontSize: "0.78rem" }}>
                        <span style={{ fontWeight: 800, color: "#0f172a" }}>{imp.field}: </span>
                        <span style={{ color: "#475569" }}>{imp.suggestion}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ScoreBadge({ label, score, isPrimary = false }: { label: string; score: number; isPrimary?: boolean }) {
  const color = score >= 75 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <div
      style={{
        background: isPrimary ? "#ffffff" : "rgba(255, 255, 255, 0.75)",
        borderRadius: "12px",
        padding: "0.75rem 0.5rem",
        textAlign: "center",
        border: `1px solid ${isPrimary ? "#6366f1" : "rgba(226, 232, 240, 0.8)"}`,
      }}
    >
      <div style={{ fontSize: "1.3rem", fontWeight: 900, color: isPrimary ? "#4f46e5" : color, lineHeight: 1 }}>
        {score}%
      </div>
      <div style={{ fontSize: "0.6rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: "0.3rem" }}>
        {label}
      </div>
    </div>
  );
}
