"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { updateProfessorStatus } from "./actions";
import { CheckCircle, XCircle, Loader2, Mail, GraduationCap, Tag } from "lucide-react";

interface PendingProfessor {
  id: string;
  first_name: string;
  last_name: string;
  preferred_name: string | null;
  email: string;
  institution: string | null;
  expertise_fields: string[] | null;
}

interface AdminReviewTableProps {
  applicants: PendingProfessor[];
}

export function AdminReviewTable({ applicants }: AdminReviewTableProps) {
  const router = useRouter();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleStatusChange = async (id: string, status: 'approved' | 'rejected') => {
    setProcessingId(id);
    try {
      await updateProfessorStatus(id, status);
      router.refresh();
    } catch (error) {
      console.error("Failed to update professor status:", error);
    } finally {
      setProcessingId(null);
    }
  };

  if (applicants.length === 0) {
    return (
      <div className="bg-[rgba(17,34,64,0.3)] border border-dashed border-[rgba(155,175,192,0.15)] rounded-[32px] p-24 text-center backdrop-blur-sm animate-in zoom-in-95 duration-700">
        <div className="w-16 h-16 bg-[rgba(61,122,107,0.1)] rounded-full flex items-center justify-center mx-auto mb-6 border border-[rgba(61,122,107,0.2)]">
          <CheckCircle size={28} className="text-[var(--sage-light)]" />
        </div>
        <h3 className="font-serif text-2xl text-[var(--ivory)] mb-3 font-light">Queue Cleared</h3>
        <p className="text-[var(--text-muted)] max-w-[320px] mx-auto leading-relaxed">
          There are no pending professor applications currently awaiting review.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[rgba(17,34,64,0.6)] border border-[rgba(155,175,192,0.1)] rounded-[24px] overflow-hidden backdrop-blur-xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-[rgba(11,22,40,0.5)] border-b border-[rgba(155,175,192,0.1)]">
              <th className="px-8 py-5 text-[0.65rem] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em]">Applicant</th>
              <th className="px-8 py-5 text-[0.65rem] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em]">Institution</th>
              <th className="px-8 py-5 text-[0.65rem] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em]">Expertise</th>
              <th className="px-8 py-5 text-[0.65rem] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(155,175,192,0.05)]">
            {applicants.map((prof) => {
              const displayName = prof.preferred_name || prof.first_name;
              const isProcessing = processingId === prof.id;

              return (
                <tr key={prof.id} className="group hover:bg-[rgba(255,255,255,0.02)] transition-colors duration-300">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-[rgba(212,146,42,0.1)] text-[var(--amber)] flex items-center justify-center font-serif text-lg border border-[rgba(212,146,42,0.2)]">
                        {prof.first_name[0]}{prof.last_name[0]}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-[var(--ivory)]">Dr. {displayName} {prof.last_name}</div>
                        <div className="flex items-center gap-1.5 text-[0.7rem] text-[var(--text-muted)]">
                          <Mail size={12} className="opacity-70" />
                          {prof.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-sm text-[var(--ivory)]">
                      <GraduationCap size={16} className="text-[var(--amber)]" />
                      {prof.institution || "Not specified"}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-wrap gap-1.5">
                      {prof.expertise_fields?.map((field, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-full bg-[rgba(255,255,255,0.04)] text-[var(--text-muted)] border border-[rgba(155,175,192,0.1)] text-[0.6rem]">
                          {field}
                        </span>
                      )) || <span className="text-xs italic text-[var(--text-muted)]">None</span>}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-3">
                      <Button 
                        size="sm" 
                        onClick={() => handleStatusChange(prof.id, 'approved')}
                        disabled={isProcessing}
                        className="bg-[var(--sage)] hover:bg-[var(--sage-light)] text-white px-4 h-9 gap-2 shadow-none"
                      >
                        {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                        Approve
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleStatusChange(prof.id, 'rejected')}
                        disabled={isProcessing}
                        className="hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 px-4 h-9 gap-2"
                      >
                        {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                        Reject
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
