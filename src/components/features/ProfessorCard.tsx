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
  };
}

export function ProfessorCard({ professor }: ProfessorCardProps) {
  const displayName = professor.preferred_name || professor.first_name;
  const initials = `${professor.first_name[0]}${professor.last_name[0]}`;

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: "relative",
        background: "rgba(17, 17, 19, 0.65)",
        border: "1px solid rgba(129, 140, 248, 0.1)",
        borderRadius: "16px",
        padding: "2rem",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        transition: "border-color 0.3s",
      }}
      onHoverStart={(e: any) => {
        const el = e.target?.closest?.("[data-prof-card]") as HTMLElement | null;
        if (el) el.style.borderColor = "rgba(129, 140, 248, 0.28)";
      }}
      onHoverEnd={(e: any) => {
        const el = e.target?.closest?.("[data-prof-card]") as HTMLElement | null;
        if (el) el.style.borderColor = "rgba(129, 140, 248, 0.1)";
      }}
    >
      {/* Ambient teal shimmer — top edge */}
      <div style={{
        position: "absolute", insetInline: 0, top: 0, height: "1px",
        background: "linear-gradient(90deg, transparent, rgba(129, 140, 248, 0.2), transparent)",
      }} />

      {/* Header row: avatar + verified badge */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        {/* Avatar */}
        <div style={{
          width: "3rem", height: "3rem", borderRadius: "50%",
          background: "rgba(129, 140, 248, 0.07)",
          border: "1px solid rgba(129, 140, 248, 0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "0.85rem", fontWeight: 600,
          color: "#818cf8",
          letterSpacing: "0.04em",
          fontFamily: "var(--font-sans)",
        }}>
          {initials}
        </div>

        {/* Verified pill */}
        <div style={{
          display: "flex", alignItems: "center", gap: "0.35rem",
          padding: "0.3rem 0.7rem", borderRadius: "100px",
          border: "1px solid rgba(129, 140, 248, 0.15)",
          background: "rgba(129, 140, 248, 0.05)",
        }}>
          <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "rgba(129, 140, 248, 0.8)" }} />
          <span style={{
            fontSize: "0.5rem", fontWeight: 700, letterSpacing: "0.22em",
            textTransform: "uppercase", color: "rgba(129, 140, 248, 0.6)",
            fontFamily: "var(--font-mono, monospace)",
          }}>
            Verified
          </span>
        </div>
      </div>

      {/* Name + institution */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h3 className="font-display" style={{
          fontSize: "1.2rem", fontWeight: 700,
          color: "rgba(250, 250, 249, 0.92)", lineHeight: 1.2,
          marginBottom: "0.4rem", letterSpacing: "-0.02em",
        }}>
          Dr. {displayName} {professor.last_name}
        </h3>
        <div style={{
          fontSize: "0.68rem", color: "rgba(82, 82, 91, 0.7)",
          fontFamily: "var(--font-sans)", lineHeight: 1.4,
        }}>
          {professor.institution || "Independent Researcher"}
        </div>
      </div>

      {/* Hairline */}
      <div style={{ height: "1px", background: "rgba(129, 140, 248, 0.08)", marginBottom: "1.25rem" }} />

      {/* Expertise tags */}
      <div style={{ flex: 1, marginBottom: "1.75rem" }}>
        <div style={{
          fontSize: "0.5rem", fontWeight: 700, letterSpacing: "0.28em",
          textTransform: "uppercase", color: "rgba(129, 140, 248, 0.4)",
          marginBottom: "0.75rem", fontFamily: "var(--font-mono, monospace)",
        }}>
          Focus Areas
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
          {professor.expertise_fields?.slice(0, 4).map((field, idx) => (
            <span
              key={idx}
              style={{
                padding: "0.3rem 0.7rem",
                borderRadius: "100px",
                border: "1px solid rgba(129, 140, 248, 0.15)",
                background: "rgba(129, 140, 248, 0.05)",
                fontSize: "0.65rem",
                color: "rgba(168, 179, 207, 0.65)",
                fontFamily: "var(--font-sans)",
              }}
            >
              {field}
            </span>
          )) || (
            <span style={{ fontSize: "0.72rem", fontStyle: "italic", color: "rgba(82, 82, 91, 0.5)", fontFamily: "var(--font-sans)" }}>
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
            background: "rgba(129, 140, 248, 0.08)",
            border: "1px solid rgba(129, 140, 248, 0.22)",
            borderRadius: "100px",
            textAlign: "center",
            fontSize: "0.58rem",
            fontWeight: 700,
            letterSpacing: "0.24em",
            textTransform: "uppercase",
            color: "#818cf8",
            fontFamily: "var(--font-sans)",
            cursor: "pointer",
            transition: "background 0.2s, border-color 0.2s, color 0.2s",
          }}
        >
          View Profile
        </motion.div>
      </Link>
    </motion.div>
  );
}
