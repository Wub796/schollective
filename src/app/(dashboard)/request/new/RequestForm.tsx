"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { submitMentorshipRequest } from "./actions";
import { Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface RequestFormProps {
  professor: {
    id: string;
    first_name: string;
    last_name: string;
    preferred_name: string | null;
    institution: string | null;
  };
}

const textareaClass =
  "flex min-h-[140px] w-full rounded-xl border border-[rgba(250, 250, 249, 0.07)] " +
  "bg-[rgba(250, 250, 249, 0.03)] px-4 py-3 text-sm text-[#f2f2f0] outline-none " +
  "focus:border-[rgba(232,232,230,0.4)] focus:bg-[rgba(250, 250, 249, 0.05)] " +
  "focus:ring-2 focus:ring-[rgba(232,232,230,0.06)] placeholder:text-[#3a3a3a] " +
  "transition-all resize-none";

export function RequestForm({ professor }: RequestFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const profDisplayName = professor.preferred_name || professor.first_name;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      const result = await submitMentorshipRequest(formData);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Request sent successfully!");
        router.push("/dashboard");
      }
    } catch {
      toast.error("Failed to submit request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <input type="hidden" name="prof_id" value={professor.id} />

      {/* Professor preview */}
      <div className="bg-[rgba(250, 250, 249, 0.03)] border border-[rgba(250, 250, 249, 0.07)] rounded-xl p-5 flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-[rgba(250, 250, 249, 0.06)] border border-[rgba(250, 250, 249, 0.09)] flex items-center justify-center text-base font-semibold text-[#8a8a8a]">
          {professor.first_name[0]}{professor.last_name[0]}
        </div>
        <div>
          <div className="text-[0.6rem] text-[#3a3a3a] uppercase tracking-[0.2em] font-semibold mb-0.5">
            Receiving Professor
          </div>
          <div className="font-display text-lg text-[#d4d4d2]">
            Dr. {profDisplayName} {professor.last_name}
          </div>
          <div className="text-[0.72rem] text-[#4a4a4a] font-light">{professor.institution}</div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="topic">Mentorship Topic / Focus Area</Label>
          <Input
            id="topic"
            name="topic"
            placeholder="e.g. Research Methodology for Quantum Computing"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="background">Academic Background &amp; Current Progress</Label>
          <textarea
            id="background"
            name="background"
            required
            placeholder="Describe your current level of understanding…"
            className={textareaClass}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="goals">Specific Mentorship Goals</Label>
          <textarea
            id="goals"
            name="goals"
            required
            placeholder="What specifically are you hoping to achieve?"
            className={textareaClass}
          />
        </div>
      </div>

      <Button type="submit" disabled={loading} className="w-full py-4 text-sm gap-3">
        {loading ? (
          <>
            <Loader2 className="animate-spin" size={16} />
            Sending Request…
          </>
        ) : (
          <>
            Send Mentorship Request
            <ArrowRight size={16} />
          </>
        )}
      </Button>
    </form>
  );
}
