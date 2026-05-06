"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Check, X } from "lucide-react";
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
    <div className="bg-[rgba(17,34,64,0.6)] border border-[var(--amber)]/20 rounded-2xl p-6 backdrop-blur-md shadow-xl transition-all duration-300 hover:border-[var(--amber)]/40 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[rgba(212,146,42,0.1)] flex items-center justify-center font-serif text-[var(--amber)] border border-[rgba(212,146,42,0.2)] text-lg">
            {request.student.first_name[0]}{request.student.last_name?.[0] || ''}
          </div>
          <div>
            <div className="text-base font-medium text-[var(--ivory)]">
              {studentName} {request.student.last_name}
            </div>
            <div className="text-[0.75rem] text-[var(--amber)] uppercase tracking-widest font-bold">
              {request.student.education_level?.replace('-', ' ')}
            </div>
          </div>
        </div>
        <div className="text-[0.7rem] text-[var(--text-muted)]">
          {new Date(request.created_at).toLocaleDateString()}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="text-[0.65rem] text-[var(--text-muted)] uppercase tracking-[0.2em] font-bold mb-1">Proposed Topic</div>
          <p className="text-[var(--ivory)] text-sm leading-relaxed">{request.topic}</p>
        </div>

        {request.initial_message && (
          <div className="bg-[rgba(26,58,92,0.3)] rounded-xl p-4 border border-[rgba(155,175,192,0.05)]">
            <div className="text-[0.65rem] text-[var(--text-muted)] uppercase tracking-widest font-bold mb-2">Message</div>
            <p className="text-[var(--text-muted)] text-sm italic leading-relaxed">
              &quot;{request.initial_message}&quot;
            </p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button 
            onClick={() => handleAction('active')} 
            disabled={loading}
            className="flex-1 gap-2"
          >
            <Check size={16} />
            Accept Request
          </Button>
          <Button 
            onClick={() => handleAction('closed')} 
            disabled={loading}
            variant="ghost" 
            className="flex-1 gap-2 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20"
          >
            <X size={16} />
            Decline
          </Button>
        </div>
      </div>
    </div>
  );
}
