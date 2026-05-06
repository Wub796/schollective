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
    } catch (error) {
      toast.error("Failed to submit request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <input type="hidden" name="prof_id" value={professor.id} />

      <div className="bg-[rgba(212,146,42,0.05)] border border-[rgba(212,146,42,0.2)] rounded-2xl p-6 flex items-center gap-5">
        <div className="w-12 h-12 rounded-full bg-[var(--amber)] text-[var(--navy)] flex items-center justify-center font-serif text-xl font-bold">
          {professor.first_name[0]}{professor.last_name[0]}
        </div>
        <div>
          <div className="text-[0.65rem] text-[var(--amber)] uppercase tracking-[0.2em] font-bold mb-0.5">Recieving Professor</div>
          <div className="text-[var(--ivory)] font-serif text-xl">Dr. {profDisplayName} {professor.last_name}</div>
          <div className="text-[var(--text-muted)] text-xs">{professor.institution}</div>
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
          <Label htmlFor="background">Academic Background & Current Progress</Label>
          <textarea
            id="background"
            name="background"
            required
            placeholder="Describe your current level of understanding..."
            className="flex min-h-[140px] w-full rounded-xl border border-[rgba(155,175,192,0.15)] bg-[rgba(26,58,92,0.4)] px-4 py-3 text-sm text-[var(--ivory)] outline-none focus:border-[var(--amber)] placeholder:text-[var(--text-muted)]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="goals">Specific Mentorship Goals</Label>
          <textarea
            id="goals"
            name="goals"
            required
            placeholder="What specifically are you hoping to achieve?"
            className="flex min-h-[140px] w-full rounded-xl border border-[rgba(155,175,192,0.15)] bg-[rgba(26,58,92,0.4)] px-4 py-3 text-sm text-[var(--ivory)] outline-none focus:border-[var(--amber)] placeholder:text-[var(--text-muted)]"
          />
        </div>
      </div>

      <div className="pt-4">
        <Button 
          type="submit" 
          disabled={loading} 
          className="w-full py-6 text-base gap-3"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Sending Request...
            </>
          ) : (
            <>
              Send Mentorship Request
              <ArrowRight size={20} />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
