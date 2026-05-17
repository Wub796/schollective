"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Check, X, Loader2, Calendar, MessageSquare } from "lucide-react";
import { updateRequestStatus } from "@/app/prof/dashboard/actions";
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

  const handleAction = async (status: 'active' | 'closed') => {
    setLoading(true);
    try {
      const result = await updateRequestStatus(request.id, status);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(status === 'active' ? "Request accepted!" : "Request declined.");
        router.refresh();
      }
    } catch (error) {
      toast.error("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[rgba(17,34,64,0.6)] border border-[var(--amber)]/20 rounded-3xl p-6 md:p-8 backdrop-blur-md shadow-xl transition-all duration-300 hover:border-[var(--amber)]/40 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[rgba(212,146,42,0.1)] flex items-center justify-center font-serif text-[var(--amber)] border border-[rgba(212,146,42,0.25)] text-xl shadow-inner">
            {request.student.first_name[0]}{request.student.last_name?.[0] || ''}
          </div>
          <div>
            <div className="text-lg font-medium text-[var(--ivory)] leading-tight">
              {studentName} {request.student.last_name}
            </div>
            <div className="text-[0.65rem] text-[var(--amber)] uppercase tracking-[0.2em] font-bold mt-1.5 opacity-80">
              {request.student.education_level?.replace('-', ' ')}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[0.65rem] text-[var(--text-muted)] uppercase tracking-widest font-bold">
          <Calendar size={12} className="opacity-60" />
          {new Date(request.created_at).toLocaleDateString()}
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <div className="text-[0.6rem] text-[var(--text-muted)] uppercase tracking-[0.25em] font-bold mb-2 opacity-60">Proposed Topic</div>
          <p className="text-[var(--ivory)] text-sm md:text-base leading-relaxed font-light italic">
            &quot;{request.topic}&quot;
          </p>
        </div>

        {request.initial_message && (
          <div className="bg-[rgba(26,58,92,0.4)] rounded-2xl p-5 border border-[rgba(155,175,192,0.1)] shadow-inner">
            <div className="flex items-center gap-2 text-[0.6rem] text-[var(--text-muted)] uppercase tracking-[0.25em] font-bold mb-3 opacity-60">
              <MessageSquare size={12} />
              Initial Message
            </div>
            <p className="text-[var(--text-muted)] text-sm leading-relaxed line-clamp-4 font-light">
              {request.initial_message}
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 pt-4">
          <Button 
            onClick={() => handleAction('active')} 
            disabled={loading}
            className="gap-2 h-12 rounded-xl text-xs uppercase font-bold tracking-widest"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            Accept
          </Button>
          <Button 
            onClick={() => handleAction('closed')} 
            disabled={loading}
            variant="ghost" 
            className="gap-2 h-12 rounded-xl text-xs uppercase font-bold tracking-widest hover:bg-red-500/10 hover:text-red-400"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />}
            Decline
          </Button>
        </div>
      </div>
    </div>
  );
}
