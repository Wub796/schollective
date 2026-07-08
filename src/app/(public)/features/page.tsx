"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { PublicNav } from "@/components/ui/PublicNav";
import { PublicFooter } from "@/components/ui/PublicFooter";
import {
  Lock,
  MessageSquare,
  ShieldCheck,
  BarChart3,
  Globe,
  Zap,
  Cpu,
} from "lucide-react";

export default function FeaturesPage() {
  return (
    <div className="page-bg" style={{ minHeight: "100vh", background: "transparent", color: "#141005" }}>
      <PublicNav />

      <main className="relative z-10 px-6 sm:px-8 py-20 lg:py-28">
        <div style={{ maxWidth: "960px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "7rem" }}>
          {/* Header */}
          <header className="text-center max-w-3xl mx-auto" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.25rem" }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#008CBB]/30 bg-[#008CBB]/10 text-[#008CBB] text-[0.62rem] font-extrabold tracking-widest uppercase mb-2 font-mono">
              <Cpu size={12} />
              Core Capabilities
            </div>
            <h1 className="font-display font-black text-[#141005]" style={{ fontSize: "clamp(2.6rem, 5.5vw, 4rem)", letterSpacing: "-0.035em", lineHeight: 1.05 }}>
              Engineered for{" "}
              <em className="italic font-light text-[#008CBB]">academic excellence</em>
            </h1>
            <p className="text-[#3b3527]/80 text-lg font-normal leading-relaxed max-w-2xl font-sans">
              We&apos;ve built a focused set of tools designed to remove the friction from intellectual
              mentorship while maintaining the highest standards of safety and integrity.
            </p>
          </header>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                i: Lock,
                t: "Role-Based Integrity",
                d: "Our architecture strictly separates Student and Professor domains. Roles are verified at onboarding and permanently locked to prevent impersonation or cross-role confusion.",
              },
              {
                i: MessageSquare,
                t: "Structured Request Flow",
                d: "Gone are the days of ambiguous cold emails. Every mentorship starts with a structured data model, ensuring professors have the context they need to say 'Yes'.",
              },
              {
                i: ShieldCheck,
                t: "Manual Academic Verification",
                d: "We don't just rely on email domains. Our admin team manually reviews institutional credentials for every professor application to ensure platform quality.",
              },
              {
                i: Globe,
                t: "Global Mentor Network",
                d: "Connect with verified experts regardless of their physical location or your institutional affiliation. Breaking down geographical barriers to knowledge.",
              },
              {
                i: Zap,
                t: "Real-Time Thread Sync",
                d: "Utilizing Postgres Change Data Capture (CDC), our messaging interface provides sub-second latency for academic dialogues without the need for constant polling.",
              },
              {
                i: BarChart3,
                t: "Progress Tracking",
                d: "Keep an organized history of your intellectual journey. Monitor the status of multiple concurrent requests and active mentorship threads in one hub.",
              },
            ].map((f, i) => (
              <div
                key={i}
                className="p-8 lg:p-10 flex flex-col group transition-all duration-300 bg-white border border-[#A1C5D1]/40 rounded-2xl shadow-xs hover:border-[#008CBB] hover:shadow-md"
              >
                <div className="w-12 h-12 rounded-xl bg-[#008CBB]/10 border border-[#008CBB]/25 flex items-center justify-center mb-6">
                  <f.i size={20} style={{ color: "#008CBB" }} />
                </div>
                <h3 className="font-display text-2xl text-[#141005] mb-3 font-bold leading-tight" style={{ fontSize: "1.3rem", letterSpacing: "-0.01em" }}>
                  {f.t}
                </h3>
                <p className="text-[0.92rem] text-[#3b3527]/80 leading-relaxed font-sans mt-auto">{f.d}</p>
              </div>
            ))}
          </div>

          {/* Security section */}
          <section className="border border-[#A1C5D1]/50 rounded-3xl p-10 lg:p-14 overflow-hidden relative bg-white/90 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8" style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
                <div>
                  <div className="inline-block text-[0.58rem] font-extrabold tracking-[0.22em] text-[#008CBB] uppercase mb-3 font-mono bg-[#008CBB]/10 px-3 py-1 rounded-full">
                    Security Infrastructure
                  </div>
                  <h2 className="font-display text-4xl lg:text-5xl font-black text-[#141005] leading-tight mb-4" style={{ fontSize: "clamp(1.8rem, 3.2vw, 2.5rem)", letterSpacing: "-0.03em" }}>
                    Safety by <em className="italic font-light text-[#008CBB]">Design</em>
                  </h2>
                  <p className="text-[#3b3527]/80 text-[0.95rem] font-normal leading-relaxed font-sans">
                    Schollective isn&apos;t just a directory; it&apos;s a controlled environment. We implement
                    Row Level Security (RLS) at the database layer to ensure your data and conversations
                    are strictly private and authorized.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="p-7 rounded-2xl bg-[#fafbfc] border border-[#A1C5D1]/40 flex flex-col gap-2">
                    <ShieldCheck size={22} style={{ color: "#008CBB" }} />
                    <h4 className="font-display text-base text-[#141005] font-bold" style={{ fontSize: "1rem" }}>Edge Guards</h4>
                    <p className="text-xs text-[#3b3527]/80 leading-relaxed font-sans">
                      Global routing guards enforce authentication at the edge before data loads.
                    </p>
                  </div>
                  <div className="p-7 rounded-2xl bg-[#fafbfc] border border-[#A1C5D1]/40 flex flex-col gap-2">
                    <Lock size={22} style={{ color: "#008CBB" }} />
                    <h4 className="font-display text-base text-[#141005] font-bold" style={{ fontSize: "1rem" }}>JWT Integrity</h4>
                    <p className="text-xs text-[#3b3527]/80 leading-relaxed font-sans">
                      Role-based metadata is encrypted within sessions to prevent privilege escalation.
                    </p>
                  </div>
                </div>
              </div>

              {/* Abstract visual */}
              <div className="relative aspect-square lg:block hidden">
                <div className="absolute inset-0 rounded-full border border-[#A1C5D1]/40" />
                <div className="absolute inset-10 border border-[#008CBB]/30 rounded-full border-dashed animate-[spin_40s_linear_infinite]" />
                <div className="absolute inset-20 border border-[#A1C5D1]/60 rounded-full flex items-center justify-center shadow-xl bg-white">
                  <ShieldCheck size={80} strokeWidth={1} style={{ color: "#008CBB" }} />
                </div>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="text-center p-12 lg:p-16 border border-[#A1C5D1]/50 rounded-3xl bg-[#A1C5D1]/10 flex flex-col items-center gap-8">
            <h2 className="font-display font-black text-[#141005] leading-tight" style={{ fontSize: "clamp(2rem, 3.5vw, 2.8rem)", letterSpacing: "-0.03em" }}>
              Ready to experience <em className="italic font-light text-[#008CBB]">Schollective?</em>
            </h2>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <Link href="/signup" style={{ textDecoration: "none" }}>
                <Button size="lg" variant="primary">Get Started Free →</Button>
              </Link>
              <Link href="/professors" style={{ textDecoration: "none" }}>
                <Button variant="ghost" size="lg">Explore Mentors</Button>
              </Link>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <PublicFooter />
    </div>
  );
}
