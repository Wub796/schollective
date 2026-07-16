"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowUpRight, RefreshCw, CheckCircle } from "lucide-react";
import Link from "next/link";

interface ProfessorMatchEnriched {
  professorId: string;
  matchScore: number;
  matchTier?: "Best Fit" | "Strong Match" | "Potential Alignment";
  matchReasons: string[];
  keyOverlaps: string[];
  suggestedOutreachAngle: string;
  professor?: {
    id: string;
    name: string;
    institution?: string;
    department?: string;
    expertise_fields?: string[] | string;
    is_accepting_requests?: boolean;
  } | null;
}

export function AiProfessorRecommendations() {
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<ProfessorMatchEnriched[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/recommendations");
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to load recommendations");
      }
      setRecommendations(data.recommendations || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Unable to fetch AI recommendations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  return (
    <div style={{ marginBottom: "2.5rem" }}>
      {/* Header matching site style */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "1.25rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.25rem" }}>
            <span style={{ width: "1.2rem", height: "2px", background: "#6366f1", display: "block" }} />
            <span style={{ fontSize: "0.62rem", fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", color: "#4f46e5", fontFamily: "var(--font-sans, monospace)" }}>
              AI Matchmaker
            </span>
          </div>
          <h3 className="font-display" style={{ fontSize: "1.35rem", fontWeight: 800, color: "#0f172a", margin: 0, letterSpacing: "-0.025em" }}>
            Recommended <em style={{ fontStyle: "italic", color: "#4f46e5", fontWeight: 300 }}>Professors</em>
          </h3>
        </div>

        <button
          onClick={fetchRecommendations}
          disabled={loading}
          style={{
            background: "rgba(99, 102, 241, 0.08)",
            border: "1px solid rgba(99, 102, 241, 0.3)",
            borderRadius: "100px",
            padding: "0.4rem 0.85rem",
            fontSize: "0.75rem",
            fontWeight: 700,
            color: "#4f46e5",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.35rem",
            transition: "all 0.2s ease",
          }}
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.25rem" }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                height: "170px",
                borderRadius: "14px",
                background: "rgba(99, 102, 241, 0.06)",
                border: "1px solid rgba(99, 102, 241, 0.15)",
              }}
            />
          ))}
        </div>
      ) : error ? (
        <div style={{ padding: "1.25rem", borderRadius: "12px", background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", fontSize: "0.82rem" }}>
          {error}
        </div>
      ) : recommendations.length === 0 ? (
        <div style={{ padding: "2rem", textAlign: "center", background: "#ffffff", border: "1px dashed rgba(99, 102, 241, 0.4)", borderRadius: "14px", color: "#64748b", fontSize: "0.85rem" }}>
          No recommendations found. Complete your research interests on your profile to generate matches!
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.25rem" }}>
          {recommendations.map((rec, idx) => {
            const prof = rec.professor;
            if (!prof) return null;

            return (
              <motion.div
                key={rec.professorId || idx}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: idx * 0.06 }}
                style={{
                  background: "#ffffff",
                  border: "1px solid rgba(99, 102, 241, 0.15)",
                  borderRadius: "14px",
                  padding: "1.35rem",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "0 4px 14px rgba(99, 102, 241, 0.06)",
                }}
              >
                <div>
                  {/* Top Bar: Match Score & Tier */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <span
                        style={{
                          background: rec.matchScore >= 88 ? "#10b981" : "#6366f1",
                          color: "#ffffff",
                          fontWeight: 800,
                          fontSize: "0.72rem",
                          padding: "0.2rem 0.6rem",
                          borderRadius: "100px",
                          letterSpacing: "0.02em",
                        }}
                      >
                        {rec.matchScore}% Match
                      </span>
                      {rec.matchTier && (
                        <span
                          style={{
                            background: "rgba(99, 102, 241, 0.08)",
                            color: "#4f46e5",
                            fontSize: "0.68rem",
                            fontWeight: 800,
                            padding: "0.15rem 0.5rem",
                            borderRadius: "100px",
                          }}
                        >
                          {rec.matchTier}
                        </span>
                      )}
                    </div>
                    {prof.is_accepting_requests && (
                      <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "#166534", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                        <CheckCircle size={12} color="#166534" /> Accepting
                      </span>
                    )}
                  </div>

                  <h4 className="font-display" style={{ fontSize: "1.05rem", fontWeight: 800, color: "#0f172a", margin: "0 0 0.15rem 0" }}>
                    {prof.name}
                  </h4>
                  <p style={{ fontSize: "0.78rem", color: "#64748b", margin: "0 0 0.75rem 0" }}>
                    {prof.department ? `${prof.department} • ` : ""}{prof.institution || "Faculty Member"}
                  </p>

                  {/* Overlaps */}
                  {rec.keyOverlaps.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", marginBottom: "0.75rem" }}>
                      {rec.keyOverlaps.map((ov, i) => (
                        <span
                          key={i}
                          style={{
                            background: "rgba(99, 102, 241, 0.08)",
                            color: "#4f46e5",
                            fontSize: "0.68rem",
                            fontWeight: 700,
                            padding: "0.15rem 0.5rem",
                            borderRadius: "6px",
                          }}
                        >
                          {ov}
                        </span>
                      ))}
                    </div>
                  )}

                  <p style={{ fontSize: "0.76rem", color: "#475569", lineHeight: 1.5, fontStyle: "italic", margin: "0 0 1rem 0" }}>
                    "{rec.suggestedOutreachAngle}"
                  </p>
                </div>

                <Link
                  href={`/professors/${prof.id}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.35rem",
                    width: "100%",
                    background: "rgba(79, 70, 229, 0.08)",
                    color: "#4f46e5",
                    border: "1px solid rgba(79, 70, 229, 0.25)",
                    borderRadius: "100px",
                    padding: "0.55rem 1rem",
                    fontSize: "0.78rem",
                    fontWeight: 800,
                    letterSpacing: "0.03em",
                    textDecoration: "none",
                    transition: "all 0.2s ease",
                  }}
                >
                  View Profile <ArrowUpRight size={14} />
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
