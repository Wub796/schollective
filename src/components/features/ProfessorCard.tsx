"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";

interface ProfessorCardProps {
  professor: {
    id: string;
    first_name: string;
    last_name: string;
    preferred_name: string | null;
    institution: string | null;
    expertise_fields: string[] | null;
    is_accepting_requests?: boolean | null;
  };
}

export function ProfessorCard({ professor }: ProfessorCardProps) {
  const displayName = professor.preferred_name || professor.first_name;
  const initials = `${professor.first_name[0]}${professor.last_name[0]}`;
  const isAccepting = professor.is_accepting_requests !== false;

  return (
    <motion.div
      whileHover={{
        y: -5,
        borderColor: "#4f46e5",
        background: "rgba(255, 255, 255, 1)",
        boxShadow: "0 12px 32px rgba(79, 70, 229, 0.12)",
      }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: "relative",
        background: "rgba(255, 255, 255, 0.85)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(99, 102, 241, 0.45)",
        borderRadius: "16px",
        padding: "2rem",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        transition: "all 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
        boxShadow: "0 4px 14px rgba(0, 0, 0, 0.03)",
        opacity: isAccepting ? 1 : 0.7,
      }}
    >
      {/* Top shimmer line */}
      <div style={{
        position: "absolute", insetInline: 0, top: 0, height: "2px",
        background: "linear-gradient(90deg, transparent, #4f46e5, #6366f1, transparent)",
      }} />

      {/* Header row: avatar + verified badge */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", marginBottom: "1.5rem" }}>
        {/* Avatar */}
        <div style={{
          width: "3.2rem", height: "3.2rem", borderRadius: "50%",
          background: "rgba(79, 70, 229, 0.1)",
          border: "1px solid rgba(79, 70, 229, 0.25)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "0.85rem", fontWeight: 800,
          color: "#4f46e5",
          letterSpacing: "0.04em",
          flexShrink: 0,
          fontFamily: "var(--font-sans)",
        }}>
          {initials}
        </div>

        {/* Pills wrapper */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.4rem" }}>
          {/* Verified pill (Gold #6366f1) */}
          <div style={{
            display: "flex", alignItems: "center", gap: "0.35rem",
            padding: "0.35rem 0.75rem", borderRadius: "100px",
            border: "1px solid rgba(79, 70, 229, 0.6)",
            background: "rgba(79, 70, 229, 0.2)",
            flexShrink: 0,
          }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#0f172a", flexShrink: 0 }} />
            <span style={{
              fontSize: "0.58rem", fontWeight: 800, letterSpacing: "0.2em",
              textTransform: "uppercase", color: "#0f172a",
              fontFamily: "var(--font-sans, monospace)",
            }}>
              Verified
            </span>
          </div>

          {/* Availability pill */}
          <div style={{
            display: "flex", alignItems: "center", gap: "0.35rem",
            padding: "0.35rem 0.75rem", borderRadius: "100px",
            border: isAccepting ? "1px solid rgba(79, 70, 229, 0.3)" : "1px solid rgba(220, 38, 38, 0.3)",
            background: isAccepting ? "rgba(79, 70, 229, 0.08)" : "rgba(220, 38, 38, 0.08)",
            flexShrink: 0,
          }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: isAccepting ? "#4f46e5" : "#dc2626", flexShrink: 0 }} />
            <span style={{
              fontSize: "0.58rem", fontWeight: 800, letterSpacing: "0.2em",
              textTransform: "uppercase", color: isAccepting ? "#4f46e5" : "#dc2626",
              fontFamily: "var(--font-sans, monospace)",
            }}>
              {isAccepting ? "Active" : "Busy"}
            </span>
          </div>
        </div>
      </div>

      {/* Name + institution */}
      <div style={{ marginBottom: "1.5rem", minWidth: 0 }}>
        <h3 className="font-display" style={{
          fontSize: "1.25rem", fontWeight: 800,
          color: "#0f172a", lineHeight: 1.3,
          marginBottom: "0.4rem", letterSpacing: "-0.02em",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
        }}>
          Dr. {displayName} {professor.last_name}
        </h3>
        <div style={{
          fontSize: "0.72rem", color: "#475569", opacity: 0.75,
          fontFamily: "var(--font-sans)", lineHeight: 1.5,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
        }}>
          {professor.institution || "Independent Researcher"}
        </div>
      </div>

      {/* Hairline */}
      <div style={{ height: "1px", background: "rgba(99, 102, 241, 0.4)", marginBottom: "1.25rem" }} />

      {/* Expertise tags */}
      <div style={{ flex: 1, marginBottom: "1.75rem" }}>
        <div style={{
          fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.25em",
          textTransform: "uppercase", color: "#4f46e5",
          marginBottom: "0.75rem", fontFamily: "var(--font-sans, monospace)",
        }}>
          Focus Areas
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
          {professor.expertise_fields?.slice(0, 4).map((field, idx) => (
            <span
              key={idx}
              style={{
                padding: "0.35rem 0.75rem",
                borderRadius: "100px",
                border: "1px solid rgba(99, 102, 241, 0.5)",
                background: "rgba(99, 102, 241, 0.15)",
                fontSize: "0.68rem",
                fontWeight: 600,
                color: "#0f172a",
                fontFamily: "var(--font-sans)",
                lineHeight: 1.4,
              }}
            >
              {field}
            </span>
          )) || (
            <span style={{ fontSize: "0.75rem", fontStyle: "italic", color: "#475569", opacity: 0.6, fontFamily: "var(--font-sans)" }}>
              Open to all topics
            </span>
          )}
        </div>
      </div>

      {/* CTA */}
      <Link
        href={`/professors/${professor.id}`}
        style={{ marginTop: "auto", textDecoration: "none" }}
      >
        <motion.div
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          style={{
            width: "100%",
            padding: "0.85rem 1.5rem",
            background: "#4f46e5",
            border: "1px solid #4f46e5",
            borderRadius: "100px",
            textAlign: "center",
            fontSize: "0.62rem",
            fontWeight: 800,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "#ffffff",
            fontFamily: "var(--font-sans)",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(79, 70, 229, 0.2)",
            transition: "all 0.2s cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          View Profile &rarr;
        </motion.div>
      </Link>
    </motion.div>
  );
}
