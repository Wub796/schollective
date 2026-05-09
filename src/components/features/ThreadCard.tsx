"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";

interface ThreadCardProps {
  request: {
    id: string;
    status: 'pending' | 'active' | 'closed';
    topic: string;
    participant: {
      first_name: string;
      last_name: string | null;
      preferred_name: string | null;
      detail: string;
    };
    latest_message?: {
      content: string;
      created_at: string;
    };
    updated_at: string;
  };
  viewerRole: 'student' | 'professor';
}

const statusConfig = {
  pending: { label: "Awaiting Reply", color: "rgba(255,255,255,0.25)", glow: "rgba(255,255,255,0.06)" },
  active:  { label: "Active",         color: "rgba(120,180,255,0.8)",  glow: "rgba(60,120,255,0.12)"  },
  closed:  { label: "Closed",         color: "rgba(255,255,255,0.15)", glow: "rgba(255,255,255,0.03)" },
};

export function ThreadCard({ request, viewerRole }: ThreadCardProps) {
  const displayName = request.participant.preferred_name || request.participant.first_name;
  const prefix = viewerRole === "student" ? "Dr. " : "";
  const status = statusConfig[request.status];
  const initials = `${request.participant.first_name[0]}${request.participant.last_name?.[0] ?? ""}`;

  return (
    <Link href={`/messages/${request.id}`} style={{ display: "block", height: "100%", textDecoration: "none" }}>
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: "relative",
          background: "rgba(255,255,255,0.025)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "16px",
          padding: "1.75rem",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          overflow: "hidden",
          transition: "border-color 0.3s",
          cursor: "pointer",
        }}
        onHoverStart={e => {
          (e.target as HTMLElement).closest('[data-thread-card]')
            ?.setAttribute('style', 'border-color: rgba(255,255,255,0.15)');
        }}
      >
        {/* Top shimmer line on hover */}
        <div style={{
          position: "absolute", insetInline: 0, top: 0, height: "1px",
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)",
          opacity: 0, transition: "opacity 0.3s",
        }} className="thread-shimmer" />

        {/* Header row */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.25rem" }}>
          {/* Avatar + name */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
            <div style={{
              width: "2.5rem", height: "2.5rem", borderRadius: "50%",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.72rem", fontWeight: 600, color: "rgba(255,255,255,0.6)",
              letterSpacing: "0.05em", flexShrink: 0,
              fontFamily: "var(--font-sans)",
            }}>
              {initials}
            </div>
            <div>
              <div style={{ fontSize: "0.88rem", fontWeight: 500, color: "rgba(255,255,255,0.85)", lineHeight: 1.2, fontFamily: "var(--font-sans)" }}>
                {prefix}{displayName} {request.participant.last_name}
              </div>
              <div style={{
                fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.22em",
                textTransform: "uppercase", color: "rgba(255,255,255,0.28)",
                marginTop: "0.25rem", fontFamily: "var(--font-mono, monospace)",
              }}>
                {request.participant.detail}
              </div>
            </div>
          </div>

          {/* Status badge */}
          <div style={{
            display: "flex", alignItems: "center", gap: "0.4rem",
            padding: "0.3rem 0.75rem", borderRadius: "100px",
            border: `1px solid ${status.glow}`,
            background: status.glow,
            flexShrink: 0,
          }}>
            <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: status.color, flexShrink: 0 }} />
            <span style={{
              fontSize: "0.5rem", fontWeight: 700, letterSpacing: "0.22em",
              textTransform: "uppercase", color: status.color,
              fontFamily: "var(--font-mono, monospace)",
            }}>
              {status.label}
            </span>
          </div>
        </div>

        {/* Topic */}
        <div style={{ flex: 1, marginBottom: "1.25rem" }}>
          <div style={{
            fontSize: "0.5rem", fontWeight: 700, letterSpacing: "0.28em",
            textTransform: "uppercase", color: "rgba(255,255,255,0.2)",
            marginBottom: "0.5rem", fontFamily: "var(--font-mono, monospace)",
          }}>
            Research Topic
          </div>
          <p className="font-display" style={{
            fontSize: "0.95rem", lineHeight: 1.5,
            color: "rgba(255,255,255,0.65)", fontStyle: "italic",
            display: "-webkit-box", WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical", overflow: "hidden",
          }}>
            &ldquo;{request.topic}&rdquo;
          </p>
        </div>

        {/* Latest message */}
        {request.latest_message ? (
          <div style={{
            paddingTop: "1rem",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            marginTop: "auto",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
              <span style={{ fontSize: "0.5rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)", fontFamily: "var(--font-mono, monospace)" }}>
                Last activity
              </span>
              <span style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.2)", fontFamily: "var(--font-sans)" }}>
                {new Date(request.latest_message.created_at).toLocaleDateString()}
              </span>
            </div>
            <p style={{
              fontSize: "0.78rem", color: "rgba(255,255,255,0.38)",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              fontFamily: "var(--font-sans)",
            }}>
              {request.latest_message.content}
            </p>
          </div>
        ) : (
          <div style={{ marginTop: "auto", paddingTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <span style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.18)", fontFamily: "var(--font-sans)", fontStyle: "italic" }}>
              No messages yet
            </span>
          </div>
        )}
      </motion.div>
    </Link>
  );
}
