import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { RequestForm } from "./RequestForm";
import { ArrowLeft, GraduationCap } from "lucide-react";

interface RequestNewPageProps {
  searchParams: Promise<{
    prof_id?: string;
  }>;
}

export default async function RequestNewPage({ searchParams }: RequestNewPageProps) {
  const supabase = await createClient();
  const { prof_id } = await searchParams;

  // 1. Validation Fallback
  if (!prof_id) {
    redirect("/professors");
  }

  // 2. Authenticate Session
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/auth/login");

  // 3. Fetch Professor Details for Verification
  const { data: professor, error } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, preferred_name, institution")
    .eq("id", prof_id)
    .eq("role", "professor")
    .eq("status", "approved")
    .single();

  if (error || !professor) {
    console.error("Invalid professor ID:", error);
    redirect("/professors");
  }

  return (
    <div className="min-h-screen bg-[var(--navy)] flex flex-col items-center justify-center p-6 py-24">
      {/* Background Glow */}
      <div className="fixed inset-0 z-0 bg-[radial-gradient(circle_at_50%_0%,rgba(212,146,42,0.04),transparent_50%)] pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-2xl">
        {/* Navigation */}
        <Link 
          href="/professors" 
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--ivory)] transition-colors mb-12 group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          Back to Directory
        </Link>

        {/* Header */}
        <header className="mb-10 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[rgba(212,146,42,0.1)] border border-[rgba(212,146,42,0.2)] text-[var(--amber)] text-[0.65rem] font-bold tracking-widest uppercase mb-4">
            <GraduationCap size={12} />
            Mentorship Request
          </div>
          <h1 className="font-serif text-[clamp(2rem,5vw,3rem)] font-light text-[var(--ivory)] leading-tight mb-4">
            Initiate your <em>intellectual dialogue</em>
          </h1>
          <p className="text-[var(--text-muted)] text-base font-light leading-relaxed max-w-lg">
            Every mentorship thread on Schollective starts with a focused request. Be specific about your needs to respect the professor's time.
          </p>
        </header>

        {/* Form Container */}
        <div className="bg-[rgba(17,34,64,0.7)] border border-[rgba(212,146,42,0.16)] rounded-[32px] p-8 md:p-12 backdrop-blur-3xl shadow-[0_40px_100px_rgba(0,0,0,0.4)]">
          <RequestForm professor={professor as any} />
        </div>

        {/* Footer Note */}
        <p className="mt-12 text-center text-[var(--text-muted)] text-xs opacity-50 uppercase tracking-[0.2em]">
          Powered by academic equity · Schollective 2025
        </p>
      </div>
    </div>
  );
}
