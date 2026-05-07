import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { LottieReview } from "./LottieReview";
import { PendingActions } from "./PendingActions";
import { ShieldCheck, Info } from "lucide-react";

export default async function ProfessorPendingPage() {
  const supabase = await createClient();

  // 1. Authenticate Session
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/auth/login");

  // 2. Fetch Profile Status
  const { data: profile } = await supabase
    .from("profiles")
    .select("status, role, preferred_name, first_name")
    .eq("id", session.user.id)
    .single();

  if (!profile || profile.role !== 'professor') {
    redirect("/dashboard");
  }

  // 3. Routing Guard: If already approved, skip this page
  if (profile.status === 'approved') {
    redirect("/prof/dashboard");
  }

  const displayName = profile.preferred_name || profile.first_name || "Professor";

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8 bg-[var(--navy)] relative overflow-hidden">
      {/* Background Refinement */}
      <div className="fixed inset-0 z-0 bg-[radial-gradient(circle_at_50%_0%,rgba(212,146,42,0.04),transparent_50%),radial-gradient(circle_at_50%_100%,rgba(61,122,107,0.04),transparent_50%)] pointer-events-none"></div>

      <main className="relative z-10 w-full max-w-[580px] text-center">
        <div className="bg-[rgba(17,34,64,0.6)] border border-[rgba(212,146,42,0.16)] rounded-[48px] p-8 md:p-16 backdrop-blur-3xl shadow-[0_80px_160px_-20px_rgba(0,0,0,0.6)] animate-in fade-in zoom-in-95 duration-1000">
          
          <LottieReview />

          <header className="mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[rgba(212,146,42,0.08)] border border-[rgba(212,146,42,0.2)] text-[var(--amber)] text-[0.65rem] font-bold tracking-widest uppercase mb-8 shadow-inner">
              <ShieldCheck size={14} />
              Verification in Progress
            </div>
            <h1 className="font-serif text-4xl lg:text-5xl font-light text-[var(--ivory)] leading-tight mb-6">
              Application Under <em className="italic text-[var(--amber-light)]">Review</em>
            </h1>
            <p className="text-[var(--text-muted)] text-base lg:text-lg font-light leading-relaxed">
              Welcome, Dr. {displayName}. Your academic profile has been submitted for manual verification.
            </p>
          </header>

          <div className="bg-[rgba(61,122,107,0.05)] border border-[rgba(61,122,107,0.15)] rounded-2xl p-6 md:p-8 text-left mb-12 shadow-inner">
            <div className="flex items-start gap-4">
              <Info size={20} className="text-[var(--sage-light)] mt-1 shrink-0" />
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-[var(--ivory)] uppercase tracking-wider">Our Verification Process</h3>
                <p className="text-[var(--text-muted)] text-sm leading-relaxed opacity-90">
                  Schollective manually verifies institutional credentials and expertise fields to ensure the highest standard of academic mentorship. This typically takes 24-48 business hours.
                </p>
              </div>
            </div>
          </div>

          <PendingActions />
        </div>

        <p className="mt-16 text-[var(--text-muted)] text-[0.65rem] uppercase tracking-[0.4em] opacity-30 font-bold">
          Academic Integrity First · Schollective 2025
        </p>
      </main>
    </div>
  );
}
