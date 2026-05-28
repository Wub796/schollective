"use client";

import React from "react";
import Link from "next/link";
import { MessageSquare } from "lucide-react";

export function StudentRow({ req, status }: { req: any; status: "active" | "closed" }) {
  const student     = req.student;
  const displayName = student?.preferred_name || student?.first_name || "Student";
  const initials    = `${student?.first_name?.[0] ?? ""}${student?.last_name?.[0] ?? ""}`.toUpperCase() || "?";
  const isActive    = status === "active";

  return (
    <Link href={`/messages/${req.id}`} style={{ textDecoration: "none" }}>
      <div
        style={{
          display: "flex", alignItems: "center", gap: "1.25rem",
          padding: "1.25rem 1.5rem",
          border: "1px solid rgba(15, 23, 42, 0.07)",
          borderRadius: "14px",
          background: "rgba(15, 23, 42, 0.025)",
          cursor: "pointer", transition: "border-color 0.2s, background 0.2s",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.borderColor = "rgba(15, 23, 42, 0.14)";
          (e.currentTarget as HTMLElement).style.background  = "rgba(15, 23, 42, 0.04)";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.borderColor = "rgba(15, 23, 42, 0.07)";
          (e.currentTarget as HTMLElement).style.background  = "rgba(15, 23, 42, 0.025)";
        }}
      >
        {/* Avatar */}
        <div style={{
          width: "2.75rem", height: "2.75rem", borderRadius: "50%", flexShrink: 0,
          background: "rgba(15, 23, 42, 0.05)", border: "1px solid rgba(15, 23, 42, 0.1)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "0.78rem", fontWeight: 600, color: "rgba(15, 23, 42, 0.6)",
          fontFamily: "var(--font-sans)",
        }}>
          {initials}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "rgba(15, 23, 42, 0.85)", fontFamily: "var(--font-sans)", marginBottom: "0.2rem" }}>
            {displayName} {student?.last_name}
          </div>
          <div style={{ fontSize: "0.65rem", color: "rgba(15, 23, 42, 0.35)", fontFamily: "var(--font-sans)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {req.topic || "No topic specified"}
          </div>
        </div>

        {/* Institution */}
        {student?.institution && (
          <div className="hidden sm:block" style={{ fontSize: "0.62rem", color: "rgba(15, 23, 42, 0.28)", fontFamily: "var(--font-sans)" }}>
            {student.institution}
          </div>
        )}

        {/* Latest activity */}
        {req.latest && (
          <div style={{ flexShrink: 0, textAlign: "right" }}>
            <div style={{ fontSize: "0.58rem", color: "rgba(15, 23, 42, 0.2)", fontFamily: "var(--font-sans)" }}>
              {new Date(req.latest.created_at).toLocaleDateString()}
            </div>
          </div>
        )}

        {/* Status dot + Open thread button */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: isActive ? "rgba(120,220,120,0.8)" : "rgba(15, 23, 42, 0.2)" }} />
            <span style={{ fontSize: "0.48rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: isActive ? "rgba(15, 23, 42, 0.4)" : "rgba(15, 23, 42, 0.18)", fontFamily: "var(--font-mono, monospace)" }}>
              {isActive ? "Active" : "Closed"}
            </span>
          </div>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: "2rem", height: "2rem", borderRadius: "8px",
            border: "1px solid rgba(15, 23, 42, 0.1)", background: "rgba(15, 23, 42, 0.04)",
          }}>
            <MessageSquare size={12} color="rgba(15, 23, 42, 0.4)" />
          </div>
        </div>
      </div>
    </Link>
  );
}
