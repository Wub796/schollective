"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Check, X, Loader2, Calendar, MessageSquare } from "lucide-react";
import { updateRequestStatus } from "@/app/(dashboard)/prof/dashboard/actions";
import { toast } from "sonner";

interface RequestQueueCardProps {
  request: {
    id: string;
    topic: string;
    student: {
      first_name: string;
      last_name: string | null;
      preferred_name: string | null;
      education_level: string;
    };
    initial_message?: string;
    created_at: string;
  };
}

export function RequestQueueCard({ request }: RequestQueueCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const studentName = request.student.preferred_name || request.student.first_name;

  const handleAction = async (status: "active" | "closed") => {
    setLoading(true);
    try {
      const result = await updateRequestStatus(request.id, status);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(status === "active" ? "Request accepted!" : "Request declined.");
        router.refresh();
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        background: "rgba(17, 17, 19, 0.65)",
        border: "1px solid rgba(129, 140, 248, 0.1)",
        borderRadius: "16px",
        padding: "1.5rem",
        transition: "border-color 0.2s",
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(129, 140, 248, 0.22)")}
      onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(129, 140, 248, 0.1)")}
    >
      {/* Student */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{
            width: "2.5rem", height: "2.5rem", borderRadius: "10px",
            background: "rgba(129, 140, 248, 0.07)", border: "1px solid rgba(129, 140, 248, 0.18)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "0.85rem", fontWeight: 600, color: "#818cf8",
          }}>
            {request.student.first_name[0]}{request.student.last_name?.[0] || ""}
          </div>
          <div>
            <div style={{ fontSize: "0.88rem", fontWeight: 500, color: "rgba(250, 250, 249, 0.88)", lineHeight: 1.25, fontFamily: "var(--font-sans)" }}>
              {studentName} {request.student.last_name}
            </div>
            <div style={{ fontSize: "0.58rem", color: "rgba(129, 140, 248, 0.5)", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 600, marginTop: "0.2rem", fontFamily: "var(--font-mono, monospace)" }}>
              {request.student.education_level?.replace("-", " ")}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.58rem", color: "rgba(82, 82, 91, 0.5)", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 600, fontFamily: "var(--font-mono, monospace)", flexShrink: 0 }}>
          <Calendar size={10} style={{ opacity: 0.6 }} />
          {new Date(request.created_at).toLocaleDateString()}
        </div>
      </div>

      {/* Topic */}
      <div style={{ marginBottom: "1.25rem" }}>
        <div style={{ fontSize: "0.5rem", color: "rgba(129, 140, 248, 0.4)", textTransform: "uppercase", letterSpacing: "0.18em", fontWeight: 700, marginBottom: "0.5rem", fontFamily: "var(--font-mono, monospace)" }}>Topic</div>
        <p className="font-display" style={{ fontSize: "0.88rem", color: "rgba(168, 179, 207, 0.7)", lineHeight: 1.5, fontStyle: "italic" }}>
          &ldquo;{request.topic}&rdquo;
        </p>
      </div>

      {/* Initial message preview */}
      {request.initial_message && (
        <div style={{ background: "rgba(9, 9, 11, 0.5)", borderRadius: "12px", padding: "1rem", border: "1px solid rgba(129, 140, 248, 0.08)", marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.5rem", color: "rgba(129, 140, 248, 0.4)", textTransform: "uppercase", letterSpacing: "0.18em", fontWeight: 700, marginBottom: "0.5rem", fontFamily: "var(--font-mono, monospace)" }}>
            <MessageSquare size={10} />
            Initial Message
          </div>
          <p style={{ fontSize: "0.8rem", color: "rgba(168, 179, 207, 0.55)", lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {request.initial_message}
          </p>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", paddingTop: "0.25rem" }}>
        <Button
          onClick={() => handleAction("active")}
          disabled={loading}
          className="gap-2 h-10 rounded-lg text-[0.68rem] uppercase font-bold tracking-widest"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          Accept
        </Button>
        <Button
          onClick={() => handleAction("closed")}
          disabled={loading}
          variant="ghost"
          className="gap-2 h-10 rounded-lg text-[0.68rem] uppercase font-bold tracking-widest hover:bg-[rgba(255,80,80,0.08)] hover:text-[#ff8080] hover:border-[rgba(255,80,80,0.18)]"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
          Decline
        </Button>
      </div>
    </div>
  );
}
