"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";

interface ThreadCardProps {
  request: {
    id: string;
    status: 'pending' | 'viewed' | 'active' | 'declined' | 'closed';
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
  hasUnread?: boolean;
}

const statusConfig = {
  pending:  { label: "Awaiting Reply", color: "#141005", glow: "rgba(255, 194, 15, 0.35)", bg: "#FFC20F" },
  viewed:   { label: "Viewed",         color: "#141005", glow: "rgba(161, 197, 209, 0.4)", bg: "#A1C5D1" },
  active:   { label: "Active",         color: "#008CBB", glow: "rgba(0, 140, 187, 0.18)", bg: "#008CBB" },
  declined: { label: "Declined",       color: "rgba(220, 38, 38, 0.9)", glow: "rgba(220, 38, 38, 0.12)", bg: "#ef4444" },
  closed:   { label: "Closed",         color: "rgba(20, 16, 5, 0.5)", glow: "rgba(20, 16, 5, 0.08)", bg: "#141005" },
};

export function ThreadCard({ request, viewerRole, hasUnread }: ThreadCardProps) {
  const displayName = request.participant.preferred_name || request.participant.first_name;
  const prefix = viewerRole === "student" ? "Dr. " : "";
  const status = statusConfig[request.status];
  const initials = `${request.participant.first_name[0]}${request.participant.last_name?.[0] ?? ""}`;

  return (
    <Link href={`/messages/${request.id}`} style={{ display: "block", height: "100%", textDecoration: "none" }}>
      <motion.div
        whileHover={{
          y: -4,
          borderColor: "#008CBB",
          background: "rgba(255, 255, 255, 1)",
          boxShadow: "0 12px 32px rgba(0, 140, 187, 0.12)",
        }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: "relative",
          background: request.status === "active" ? "rgba(255, 255, 255, 0.98)" : "rgba(255, 255, 255, 0.85)",
          backdropFilter: "blur(12px)",
          border: request.status === "active" ? "1px solid #008CBB" : "1px solid rgba(161, 197, 209, 0.45)",
          borderRadius: "16px",
          padding: "2rem",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          overflow: "hidden",
          transition: "all 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
          boxShadow: request.status === "active" ? "0 8px 30px rgba(0, 140, 187, 0.08)" : "0 4px 14px rgba(0, 0, 0, 0.03)",
          cursor: "pointer",
        }}
      >
        {/* Top shimmer line */}
        <div style={{
          position: "absolute", insetInline: 0, top: 0, height: "2px",
          background: "linear-gradient(90deg, transparent, #008CBB, #FFC20F, transparent)",
        }} />

        {/* Header row */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", marginBottom: "1.25rem" }}>
          {/* Avatar + name */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.875rem", minWidth: 0, flex: 1 }}>
            <div style={{
              width: "2.6rem", height: "2.6rem", borderRadius: "50%",
              background: "rgba(0, 140, 187, 0.1)",
              border: "1px solid rgba(0, 140, 187, 0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.75rem", fontWeight: 700, color: "#008CBB",
              letterSpacing: "0.05em", flexShrink: 0,
              fontFamily: "var(--font-sans)",
            }}>
              {initials}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span className="font-display" style={{ 
                  fontSize: "0.92rem", fontWeight: 700, color: "#141005", 
                  lineHeight: 1.3, fontFamily: "var(--font-sans)",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                }}>
                  {prefix}{displayName} {request.participant.last_name}
                </span>
                {hasUnread && (
                  <span style={{
                    width: "9px",
                    height: "9px",
                    borderRadius: "50%",
                    backgroundColor: "#FFC20F",
                    border: "1px solid #141005",
                    flexShrink: 0,
                    boxShadow: "0 0 8px rgba(255, 194, 15, 0.6)"
                  }} />
                )}
              </div>
              <div style={{
                fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.2em",
                textTransform: "uppercase", color: "#008CBB",
                marginTop: "0.25rem", fontFamily: "var(--font-sans, monospace)",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
              }}>
                {request.participant.detail}
              </div>
            </div>
          </div>

          {/* Status badge */}
          <div style={{
            display: "flex", alignItems: "center", gap: "0.4rem",
            padding: "0.35rem 0.8rem", borderRadius: "100px",
            border: `1px solid ${status.glow}`,
            background: status.glow,
            flexShrink: 0,
            whiteSpace: "nowrap"
          }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: status.bg, flexShrink: 0 }} />
            <span style={{
              fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.2em",
              textTransform: "uppercase", color: status.color,
              fontFamily: "var(--font-sans, monospace)",
            }}>
              {status.label}
            </span>
          </div>
        </div>

        {/* Topic */}
        <div style={{ flex: 1, marginBottom: "1.25rem" }}>
          <div style={{
            fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.25em",
            textTransform: "uppercase", color: "#3b3527", opacity: 0.6,
            marginBottom: "0.5rem", fontFamily: "var(--font-sans, monospace)",
          }}>
            Research Topic
          </div>
          <p className="font-display" style={{
            fontSize: "0.95rem", lineHeight: 1.6,
            color: "#141005", fontStyle: "italic", fontWeight: 500,
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
            borderTop: "1px solid rgba(161, 197, 209, 0.4)",
            marginTop: "auto",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
              <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#008CBB", fontFamily: "var(--font-sans, monospace)" }}>
                Last activity
              </span>
              <span style={{ fontSize: "0.62rem", color: "#3b3527", opacity: 0.7, fontFamily: "var(--font-sans)", fontWeight: 600 }}>
                {new Date(request.latest_message.created_at).toLocaleDateString()}
              </span>
            </div>
            <p style={{
              fontSize: "0.78rem", color: "#141005", opacity: 0.75,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              fontFamily: "var(--font-sans)", lineHeight: 1.5,
            }}>
              {request.latest_message.content}
            </p>
          </div>
        ) : (
          <div style={{ marginTop: "auto", paddingTop: "1rem", borderTop: "1px solid rgba(161, 197, 209, 0.4)" }}>
            <span style={{ fontSize: "0.65rem", color: "#3b3527", opacity: 0.6, fontFamily: "var(--font-sans)", fontStyle: "italic" }}>
              No messages yet
            </span>
          </div>
        )}
      </motion.div>
    </Link>
  );
}
