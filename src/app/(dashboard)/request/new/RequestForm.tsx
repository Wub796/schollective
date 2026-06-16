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
  "flex min-h-[160px] w-full rounded-xl border border-[rgba(129,140,248,0.07)] " +
  "bg-[rgba(17,17,19,0.5)] px-5 py-4 text-sm text-[#fafaf9] outline-none " +
  "focus:border-[rgba(129,140,248,0.3)] focus:bg-[rgba(17,17,19,0.7)] " +
  "focus:ring-2 focus:ring-[rgba(129,140,248,0.06)] placeholder:text-[rgba(250,250,249,0.18)] " +
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
    <form onSubmit={handleSubmit} className="space-y-10">
      <input type="hidden" name="prof_id" value={professor.id} />

      {/* Professor preview */}
      <div className="bg-[rgba(250,250,249,0.02)] border border-[rgba(129,140,248,0.08)] rounded-2xl p-6 flex items-center gap-5">
        <div className="w-12 h-12 rounded-xl bg-[rgba(129,140,248,0.06)] border border-[rgba(129,140,248,0.1)] flex items-center justify-center text-base font-semibold text-[rgba(250,250,249,0.5)]">
          {professor.first_name[0]}{professor.last_name[0]}
        </div>
        <div>
          <div className="text-[0.6rem] text-[rgba(250,250,249,0.25)] uppercase tracking-[0.2em] font-semibold mb-0.5">
            Receiving Professor
          </div>
          <div className="font-display text-lg text-[rgba(250,250,249,0.9)]">
            Dr. {profDisplayName} {professor.last_name}
          </div>
          <div className="text-[0.72rem] text-[rgba(250,250,249,0.35)] font-light">{professor.institution}</div>
        </div>
      </div>

      <div className="space-y-8">
        <div className="space-y-3">
          <Label htmlFor="topic">Mentorship Topic / Focus Area</Label>
          <Input
            id="topic"
            name="topic"
            placeholder="e.g. Research Methodology for Quantum Computing"
            required
          />
        </div>

        <div className="space-y-3">
          <Label htmlFor="background">Academic Background &amp; Current Progress</Label>
          <textarea
            id="background"
            name="background"
            required
            placeholder="Describe your current level of understanding…"
            className={textareaClass}
          />
        </div>

        <div className="space-y-3">
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
