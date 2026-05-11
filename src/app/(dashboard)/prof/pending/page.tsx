import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { LottieReview } from "./LottieReview";
import { PendingActions } from "./PendingActions";
import { ShieldCheck, Info } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProfessorPendingPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("status, role, preferred_name, first_name")
    .eq("id", session.user.id)
    .single();

  if (!profile || profile.role !== "professor") redirect("/dashboard");
  if (profile.status === "approved") redirect("/prof/dashboard");

  const displayName = profile.preferred_name || profile.first_name || "Professor";

  return (
    <div className="page-bg flex items-center justify-center p-6" style={{ minHeight: "100vh" }}>

      <main className="relative z-10 w-full max-w-[520px] text-center">
        <div className="bg-[#111111] border border-[rgba(250, 250, 249, 0.07)] rounded-2xl p-10 md:p-16 shadow-[0_80px_160px_rgba(0,0,0,0.7)]">
          <LottieReview />

          <header className="mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[rgba(250, 250, 249, 0.03)] border border-[rgba(250, 250, 249, 0.07)] text-[#4a4a4a] text-[0.62rem] font-bold tracking-widest uppercase mb-6">
              <ShieldCheck size={12} />
              Verification in Progress
            </div>
            <h1 className="font-display text-3xl font-bold text-[#f2f2f0] leading-tight mb-4">
              Application Under <em className="italic text-[#5a5a5a]">Review</em>
            </h1>
            <p className="text-[#4a4a4a] text-sm font-light leading-relaxed">
              Welcome, Dr. {displayName}. Your academic profile has been submitted for
              manual verification.
            </p>
          </header>

          <div className="bg-[rgba(250, 250, 249, 0.02)] border border-[rgba(250, 250, 249, 0.05)] rounded-xl p-5 text-left mb-10">
            <div className="flex items-start gap-3">
              <Info size={16} className="text-[#4a4a4a] mt-0.5 shrink-0" />
              <div>
                <h3 className="text-[0.68rem] font-bold text-[#6a6a6a] uppercase tracking-wider mb-2">
                  Our Verification Process
                </h3>
                <p className="text-[#3a3a3a] text-xs leading-relaxed">
                  Schollective manually verifies institutional credentials and expertise
                  fields to ensure the highest standard of academic mentorship. This
                  typically takes 24–48 business hours.
                </p>
              </div>
            </div>
          </div>

          <PendingActions />
        </div>
      </main>
    </div>
  );
}
