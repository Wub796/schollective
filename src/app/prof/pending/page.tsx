import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
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
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--navy)]">
      {/* Background Refinement */}
      <div className="fixed inset-0 z-0 bg-[radial-gradient(circle_at_50%_0%,rgba(212,146,42,0.04),transparent_50%),radial-gradient(circle_at_50%_100%,rgba(61,122,107,0.04),transparent_50%)] pointer-events-none"></div>

      <main className="relative z-10 w-full max-w-[540px] text-center">
        <div className="bg-[rgba(17,34,64,0.7)] border border-[rgba(212,146,42,0.16)] rounded-[40px] p-10 md:p-14 backdrop-blur-3xl shadow-[0_40px_100px_rgba(0,0,0,0.4)] animate-in fade-in zoom-in-95 duration-1000">
          
          <LottieReview />

          <header className="mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[rgba(212,146,42,0.1)] border border-[rgba(212,146,42,0.2)] text-[var(--amber)] text-[0.65rem] font-bold tracking-widest uppercase mb-6">
              <ShieldCheck size={12} />
              Verification in Progress
            </div>
            <h1 className="font-serif text-4xl font-light text-[var(--ivory)] leading-tight mb-4">
              Application Under <em className="italic text-[var(--amber-light)]">Review</em>
            </h1>
            <p className="text-[var(--text-muted)] text-base font-light leading-relaxed">
              Welcome, Dr. {displayName}. Your academic profile has been submitted for manual verification.
            </p>
          </header>

          <div className="bg-[rgba(61,122,107,0.05)] border border-[rgba(61,122,107,0.15)] rounded-2xl p-6 text-left mb-10">
            <div className="flex items-start gap-3">
              <Info size={18} className="text-[var(--sage-light)] mt-1 shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-[var(--ivory)] mb-1">Our Verification Process</h3>
                <p className="text-[var(--text-muted)] text-[0.8rem] leading-relaxed">
                  Schollective manually verifies institutional credentials and expertise fields to ensure the highest standard of academic mentorship. This typically takes 24-48 business hours.
                </p>
              </div>
            </div>
          </div>

          <PendingActions />
        </div>

        <p className="mt-12 text-[var(--text-muted)] text-[0.65rem] uppercase tracking-[0.3em] opacity-40 font-bold">
          Academic Integrity First · Schollective 2025
        </p>
      </main>
    </div>
  );
}
