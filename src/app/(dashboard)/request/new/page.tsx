import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { RequestForm } from "./RequestForm";
import { ArrowLeft, GraduationCap } from "lucide-react";

export const dynamic = "force-dynamic";

interface RequestNewPageProps {
  searchParams: Promise<{
    prof_id?: string;
  }>;
}

export default async function RequestNewPage({ searchParams }: RequestNewPageProps) {
  const supabase = await createClient();
  const { prof_id } = await searchParams;

  if (!prof_id) redirect("/professors");

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

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
    <div className="page-bg">
      <main className="relative z-10 px-4 sm:px-6 lg:px-8 py-12 lg:py-24">
        <div className="max-w-3xl mx-auto">
          {/* Navigation */}
          <Link
            href="/professors"
            className="inline-flex items-center gap-2 text-[0.65rem] font-bold uppercase tracking-widest text-[#3a3a3a] hover:text-[#8a8a8a] transition-colors mb-12 group no-underline"
          >
            <ArrowLeft size={12} className="group-hover:-translate-x-0.5 transition-transform" />
            Back to Directory
          </Link>

          {/* Header */}
          <header className="mb-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)] text-[#6a6a6a] text-[0.62rem] font-bold tracking-widest uppercase mb-6">
              <GraduationCap size={12} />
              Mentorship Request
            </div>
            <h1 className="font-display text-4xl lg:text-5xl font-bold text-[#f2f2f0] leading-tight mb-6">
              Initiate your <em className="italic text-[#5a5a5a]">intellectual dialogue</em>
            </h1>
            <p className="text-[#4a4a4a] text-lg font-light leading-relaxed max-w-2xl">
              Every mentorship thread on Schollective starts with a focused request. Be specific
              about your needs to respect the professor&apos;s time.
            </p>
          </header>

          {/* Form Container */}
          <div className="bg-[#111111] border border-[rgba(255,255,255,0.06)] rounded-2xl p-8 md:p-14 shadow-[0_60px_120px_-20px_rgba(0,0,0,0.6)]">
            <RequestForm professor={professor as any} />
          </div>

          {/* Footer note */}
          <p className="mt-14 text-center text-[#2a2a2a] text-[0.6rem] uppercase tracking-[0.4em] font-bold">
            Powered by academic equity · Schollective 2025
          </p>
        </div>
      </main>
    </div>
  );
}
