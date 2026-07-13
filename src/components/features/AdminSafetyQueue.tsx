"use client";

import React, { useState } from "react";
import { ShieldAlert, CheckCircle, UserX } from "lucide-react";
import { toast } from "sonner";

interface FlaggedAccount {
  id: string;
  first_name?: string;
  last_name?: string;
  email: string;
  role: string;
  ai_score?: number;
  ai_flags?: string[];
  ai_level?: string;
  created_at: string;
}

interface Props {
  initialFlaggedAccounts?: FlaggedAccount[];
}

export function AdminSafetyQueue({ initialFlaggedAccounts = [] }: Props) {
  const [accounts, setAccounts] = useState<FlaggedAccount[]>(initialFlaggedAccounts);
  const [filterRole, setFilterRole] = useState<string>("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleSuspend = async (accountId: string) => {
    setActionLoading(accountId);
    try {
      await fetch("/api/ai/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "suspend", targetUserId: accountId }),
      });
      setAccounts((prev) => prev.filter((a) => a.id !== accountId));
      toast.success("Account suspended.");
    } catch (err) {
      toast.error("Failed to update status.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDismissFlag = async (accountId: string) => {
    setAccounts((prev) => prev.filter((a) => a.id !== accountId));
    toast.success("Flag cleared.");
  };

  const filtered = accounts.filter((a) => {
    if (filterRole === "all") return true;
    return a.role === filterRole;
  });

  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: "14px",
        border: "1px solid rgba(99, 102, 241, 0.45)",
        padding: "1.75rem",
        marginBottom: "2rem",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.25rem" }}>
            <span style={{ width: "1.2rem", height: "2px", background: "#ef4444", display: "block" }} />
            <span style={{ fontSize: "0.62rem", fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", color: "#ef4444", fontFamily: "var(--font-sans, monospace)" }}>
              Internal Security
            </span>
          </div>
          <h3 className="font-display" style={{ fontSize: "1.35rem", fontWeight: 800, color: "#0f172a", margin: 0, letterSpacing: "-0.025em" }}>
            Safety & <em style={{ fontStyle: "italic", color: "#ef4444", fontWeight: 300 }}>Bot Moderation</em> Queue
          </h3>
        </div>

        <div style={{ display: "flex", gap: "0.4rem" }}>
          {["all", "student", "professor"].map((role) => (
            <button
              key={role}
              onClick={() => setFilterRole(role)}
              style={{
                background: filterRole === role ? "#0f172a" : "rgba(241, 245, 249, 0.9)",
                color: filterRole === role ? "#ffffff" : "#475569",
                border: "none",
                borderRadius: "100px",
                padding: "0.35rem 0.85rem",
                fontSize: "0.75rem",
                fontWeight: 800,
                cursor: "pointer",
                textTransform: "capitalize",
              }}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ padding: "2.5rem 1rem", textAlign: "center", color: "#64748b", background: "rgba(248, 250, 252, 0.8)", borderRadius: "12px", border: "1px dashed #e2e8f0" }}>
          <CheckCircle size={28} color="#10b981" style={{ margin: "0 auto 0.5rem auto", display: "block" }} />
          <h4 style={{ fontSize: "0.9rem", fontWeight: 800, color: "#0f172a", margin: "0 0 0.25rem 0" }}>
            Zero Active Flags
          </h4>
          <p style={{ fontSize: "0.8rem", margin: 0 }}>All user activity passes automated safety checks.</p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.82rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #e2e8f0", color: "#64748b" }}>
                <th style={{ padding: "0.75rem 0.5rem", fontWeight: 800 }}>User Account</th>
                <th style={{ padding: "0.75rem 0.5rem", fontWeight: 800 }}>Role</th>
                <th style={{ padding: "0.75rem 0.5rem", fontWeight: 800 }}>AI Legitimacy</th>
                <th style={{ padding: "0.75rem 0.5rem", fontWeight: 800 }}>AI Flags</th>
                <th style={{ padding: "0.75rem 0.5rem", fontWeight: 800, textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((acc) => (
                <tr key={acc.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "0.85rem 0.5rem" }}>
                    <div style={{ fontWeight: 800, color: "#0f172a" }}>
                      {acc.first_name || acc.last_name ? `${acc.first_name || ""} ${acc.last_name || ""}` : "Unnamed Account"}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{acc.email}</div>
                  </td>

                  <td style={{ padding: "0.85rem 0.5rem" }}>
                    <span
                      style={{
                        background: acc.role === "professor" ? "rgba(99, 102, 241, 0.1)" : "rgba(16, 185, 129, 0.1)",
                        color: acc.role === "professor" ? "#4f46e5" : "#059669",
                        fontWeight: 800,
                        fontSize: "0.68rem",
                        padding: "0.15rem 0.55rem",
                        borderRadius: "100px",
                        textTransform: "capitalize",
                      }}
                    >
                      {acc.role}
                    </span>
                  </td>

                  <td style={{ padding: "0.85rem 0.5rem" }}>
                    <span
                      style={{
                        fontWeight: 900,
                        color: (acc.ai_score ?? 100) < 45 ? "#ef4444" : "#f59e0b",
                      }}
                    >
                      {acc.ai_score ?? "N/A"}/100 ({acc.ai_level || "Flagged"})
                    </span>
                  </td>

                  <td style={{ padding: "0.85rem 0.5rem" }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
                      {(acc.ai_flags || ["Suspicious pattern"]).map((flag, idx) => (
                        <span
                          key={idx}
                          style={{
                            background: "#fef2f2",
                            color: "#991b1b",
                            border: "1px solid #fecaca",
                            fontSize: "0.68rem",
                            fontWeight: 700,
                            padding: "0.15rem 0.45rem",
                            borderRadius: "4px",
                          }}
                        >
                          {flag}
                        </span>
                      ))}
                    </div>
                  </td>

                  <td style={{ padding: "0.85rem 0.5rem", textAlign: "right" }}>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.35rem" }}>
                      <button
                        onClick={() => handleDismissFlag(acc.id)}
                        style={{
                          background: "#f1f5f9",
                          color: "#475569",
                          border: "none",
                          borderRadius: "100px",
                          padding: "0.35rem 0.75rem",
                          fontSize: "0.72rem",
                          fontWeight: 800,
                          cursor: "pointer",
                        }}
                      >
                        Dismiss
                      </button>
                      <button
                        onClick={() => handleSuspend(acc.id)}
                        disabled={actionLoading === acc.id}
                        style={{
                          background: "#ef4444",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "100px",
                          padding: "0.35rem 0.75rem",
                          fontSize: "0.72rem",
                          fontWeight: 800,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.25rem",
                        }}
                      >
                        <UserX size={12} /> Suspend
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
