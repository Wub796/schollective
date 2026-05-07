import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { AdminReviewTable } from "@/components/features/AdminReviewTable";
import { ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const supabase = await createClient();

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    const fallback = profile?.role === "professor" ? "/prof/dashboard" : "/dashboard";
    redirect(fallback);
  }

  const { data: pendingProfessors, error } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, preferred_name, email, institution, expertise_fields")
    .eq("role", "professor")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error) console.error("Fetch pending professors error:", error);

  return (
    <div className="py-10 lg:py-16 space-y-12">
      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <p className="text-[0.62rem] font-bold tracking-[0.25em] text-[#3a3a3a] uppercase mb-3">
            Internal Systems
          </p>
          <h1 className="font-display text-4xl lg:text-5xl font-bold text-[#f2f2f0] leading-tight mb-4">
            Admin <em className="italic text-[#5a5a5a]">Approval Portal</em>
          </h1>
          <p className="text-[#4a4a4a] text-base font-light max-w-2xl leading-relaxed">
            Review and verify professor credentials to maintain the academic integrity of the
            Schollective network.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-[#111111] border border-[rgba(255,255,255,0.06)] rounded-xl px-5 py-4 self-start lg:self-end">
          <div>
            <div className="text-[0.6rem] text-[#3a3a3a] uppercase tracking-widest font-bold mb-0.5">
              Pending Queue
            </div>
            <div className="font-display text-2xl font-semibold text-[#d4d4d2]">
              {pendingProfessors?.length || 0} Applicants
            </div>
          </div>
        </div>
      </header>

      {/* Queue */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-[rgba(255,255,255,0.05)] pb-4">
          <ShieldCheck size={16} className="text-[#4a4a4a]" />
          <h2 className="font-display text-lg font-semibold text-[#d4d4d2]">Verification Queue</h2>
        </div>
        <AdminReviewTable applicants={(pendingProfessors || []) as any} />
      </section>

      <footer className="mt-24 pt-8 border-t border-[rgba(255,255,255,0.04)] flex flex-col md:flex-row justify-between items-center gap-3 text-[0.6rem] text-[#2a2a2a] uppercase tracking-widest font-bold">
        <span>Schollective Admin Engine v1.0</span>
        <span>Secure Environment · Academic Integrity First</span>
      </footer>
    </div>
  );
}
