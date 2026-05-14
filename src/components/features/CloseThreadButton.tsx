"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { closeRequest } from "@/app/(dashboard)/messages/[id]/actions";
import { toast } from "sonner";

interface CloseThreadButtonProps {
  requestId: string;
}

export function CloseThreadButton({ requestId }: CloseThreadButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClose = async () => {
    if (!confirm("Are you sure you want to conclude this mentorship? The thread will be closed for further messages.")) return;

    setLoading(true);
    try {
      const result = await closeRequest(requestId);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Mentorship successfully concluded!");
        router.refresh();
      }
    } catch {
      toast.error("Failed to close thread.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClose}
      disabled={loading}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[rgba(255,80,80,0.15)] bg-[rgba(255,80,80,0.05)] text-[0.65rem] font-bold uppercase tracking-widest text-[#ff6b6b] hover:bg-[rgba(255,80,80,0.1)] disabled:opacity-50 btn-action-danger"
      title="Conclude Mentorship"
    >
      {loading ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
      <span className="hidden sm:inline">Close Thread</span>
    </button>
  );
}
