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
    <div className="bg-[#111111] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 transition-all duration-200 hover:border-[rgba(255,255,255,0.1)]">
      {/* Student */}
      <div className="flex justify-between items-start gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.07)] flex items-center justify-center text-sm font-semibold text-[#6a6a6a]">
            {request.student.first_name[0]}{request.student.last_name?.[0] || ""}
          </div>
          <div>
            <div className="text-sm font-medium text-[#d4d4d2] leading-tight">
              {studentName} {request.student.last_name}
            </div>
            <div className="text-[0.62rem] text-[#4a4a4a] uppercase tracking-[0.12em] font-medium mt-0.5">
              {request.student.education_level?.replace("-", " ")}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[0.62rem] text-[#3a3a3a] uppercase tracking-widest font-medium">
          <Calendar size={10} className="opacity-60" />
          {new Date(request.created_at).toLocaleDateString()}
        </div>
      </div>

      {/* Topic */}
      <div className="mb-5">
        <div className="text-[0.58rem] text-[#3a3a3a] uppercase tracking-[0.18em] font-semibold mb-2">Topic</div>
        <p className="text-sm text-[#8a8a8a] leading-relaxed font-light italic">
          &ldquo;{request.topic}&rdquo;
        </p>
      </div>

      {/* Initial message preview */}
      {request.initial_message && (
        <div className="bg-[rgba(255,255,255,0.02)] rounded-xl p-4 border border-[rgba(255,255,255,0.05)] mb-5">
          <div className="flex items-center gap-1.5 text-[0.58rem] text-[#3a3a3a] uppercase tracking-[0.18em] font-semibold mb-2">
            <MessageSquare size={10} />
            Initial Message
          </div>
          <p className="text-[0.8rem] text-[#5a5a5a] leading-relaxed line-clamp-4 font-light">
            {request.initial_message}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3 pt-1">
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
          className="gap-2 h-10 rounded-lg text-[0.68rem] uppercase font-bold tracking-widest hover:bg-[rgba(255,80,80,0.08)] hover:text-[#ff6b6b] hover:border-[rgba(255,80,80,0.15)]"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
          Decline
        </Button>
      </div>
    </div>
  );
}
