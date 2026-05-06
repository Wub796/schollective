import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { AdminReviewTable } from "@/components/features/AdminReviewTable";
import { Sidebar } from "@/components/layout/Sidebar";
import { ShieldCheck } from "lucide-react";

export default async function AdminDashboard() {
  const supabase = await createClient();

  // 1. Authenticate Session & Role
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    // If not admin, redirect to respective dashboard
    const fallback = profile?.role === 'professor' ? '/prof/dashboard' : '/dashboard';
    redirect(fallback);
  }

  // 2. Fetch Pending Professor Applications
  const { data: pendingProfessors, error } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, preferred_name, email, institution, expertise_fields")
    .eq("role", "professor")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Fetch pending professors error:", error);
  }

  return (
    <div className="flex min-h-screen bg-[var(--navy)] text-[var(--ivory)]">
      <Sidebar role="admin" />

      {/* Main Content */}
      <main className="flex-grow lg:pl-[280px] relative z-10">
        <div className="content-container py-12 lg:py-20">
          
          {/* Header */}
          <header className="mb-16 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              <div>
                <div className="text-[0.75rem] font-bold tracking-[0.2em] text-[var(--amber)] uppercase mb-2">Internal Systems</div>
                <h1 className="font-serif text-4xl lg:text-5xl font-light text-[var(--ivory)] leading-tight">
                  Admin <em className="italic text-[var(--amber-light)]">Approval Portal</em>
                </h1>
                <p className="text-[var(--text-muted)] mt-4 text-lg font-light max-w-2xl leading-relaxed">
                  Review and verify professor credentials to maintain the academic integrity of the Schollective network.
                </p>
              </div>
              <div className="flex items-center gap-4 bg-[rgba(17,34,64,0.5)] border border-[rgba(212,146,42,0.15)] rounded-2xl px-6 py-4 backdrop-blur-md shadow-xl self-start lg:self-center">
                <div className="text-right">
                  <div className="text-[0.6rem] text-[var(--text-muted)] uppercase tracking-widest font-bold mb-0.5">Pending Queue</div>
                  <div className="text-2xl font-serif text-[var(--amber)]">{pendingProfessors?.length || 0} Applicants</div>
                </div>
              </div>
            </div>
          </header>

          {/* Queue Section */}
          <section className="space-y-8">
            <div className="flex items-center gap-3 border-b border-[rgba(155,175,192,0.1)] pb-4">
              <ShieldCheck size={20} className="text-[var(--amber)]" />
              <h2 className="text-xl font-serif text-[var(--ivory)] font-light">Verification Queue</h2>
            </div>
            
            <AdminReviewTable applicants={(pendingProfessors || []) as any} />
          </section>

          {/* Footer Polish */}
          <footer className="mt-32 pt-12 border-t border-[rgba(155,175,192,0.05)] flex flex-col md:flex-row justify-between items-center gap-4 text-[var(--text-muted)] text-[0.65rem] uppercase tracking-[0.25em] opacity-40 font-bold">
            <div>Schollective Admin Engine v1.0</div>
            <div>Secure Environment · Academic Integrity First</div>
          </footer>
        </div>
      </main>
    </div>
  );
}
