"use client";

import React from "react";
import { Reveal, Eyebrow } from "@/components/ui/PublicPage";
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
} from "lucide-react";

const FEATURES = [
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
];

export default function FeaturesPage() {
  return (
    <div className="bg-transparent text-ink min-h-screen">
      <PublicNav />

      {/* ── HERO ──────────────────────────────────────────── */}
      <section className="relative z-10 px-8 min-h-[75vh] flex flex-col items-center justify-center pt-36 md:pt-44 pb-20">
        <div className="w-full max-w-[760px] mx-auto flex flex-col items-center text-center">
          <Reveal className="w-full flex flex-col items-center">
            <Eyebrow>Core Capabilities</Eyebrow>
            <h1 className="font-display text-[clamp(2.65rem,5.7vw,4.65rem)] font-black tracking-[-0.04em] leading-[1.08] mb-8 text-ink text-center">
              Engineered for academic excellence
            </h1>
          </Reveal>
          <Reveal delay={0.15} className="w-full flex flex-col items-center">
            <p style={{ textAlign: "center" }} className="text-[clamp(1.05rem,1.4vw,1.25rem)] text-ink-soft leading-relaxed max-w-[620px]">
              We&apos;ve built a focused set of tools designed to remove the friction from intellectual
              mentorship while maintaining the highest standards of safety and integrity.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── FEATURE GRID ─────────────────────────────────── */}
      <section className="relative z-10 flex flex-col items-center text-center px-8 border-t border-indigo-300/40" style={{ paddingTop: "9rem", paddingBottom: "9rem" }}>
        <div className="w-full max-w-[920px] mx-auto">
          <Reveal>
            <h2 className="font-display text-[clamp(2.2rem,4vw,3.5rem)] font-black tracking-[-0.04em] leading-[1.05] mb-14 text-ink">
              Everything you need, nothing you don&apos;t
            </h2>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
            {FEATURES.map((f, i) => (
              <Reveal key={f.t} delay={i * 0.05}>
                <div className="p-8 border border-indigo-300/40 rounded-2xl bg-white h-full transition-all duration-300 hover:shadow-md hover:border-indigo-600 text-left flex flex-col">
                  <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-600/25 flex items-center justify-center mb-6">
                    <f.i size={20} style={{ color: "var(--accent)" }} />
                  </div>
                  <h3 className="font-display text-[1.15rem] font-bold text-ink tracking-[-0.02em] mb-2">{f.t}</h3>
                  <p className="text-[0.88rem] text-ink-soft/80 leading-relaxed font-sans mt-auto">{f.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECURITY ──────────────────────────────────────── */}
      <section className="relative z-10 flex flex-col items-center text-center px-8 border-t border-indigo-300/40" style={{ paddingTop: "9rem", paddingBottom: "9rem" }}>
        <div className="w-full max-w-[920px] mx-auto">
          <Reveal>
            <div className="border border-indigo-300/50 rounded-3xl bg-white/90 shadow-sm w-full px-8 md:px-16" style={{ paddingTop: "6.5rem", paddingBottom: "6.5rem" }}>
              <h2 className="font-display font-black text-[clamp(1.8rem,2.8vw,2.4rem)] tracking-[-0.03em] text-ink mb-6">
                Safety by design
              </h2>
              <div className="w-full flex flex-col items-center justify-center text-center">
                <p className="text-center text-[1rem] text-ink-soft/80 leading-relaxed max-w-[560px] mb-12 font-sans">
                  Schollective isn&apos;t just a directory; it&apos;s a controlled environment. We implement
                  Row Level Security (RLS) at the database layer to ensure your data and conversations
                  are strictly private and authorized.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                <div className="p-7 bg-[#faf9f7] rounded-xl border border-indigo-300/40 flex flex-col gap-2">
                  <ShieldCheck size={22} style={{ color: "var(--accent)" }} />
                  <div className="font-display font-bold text-[1.1rem] text-ink">Edge Guards</div>
                  <p className="text-[0.88rem] text-ink-soft/80 leading-relaxed font-sans mt-1">
                    Global routing guards enforce authentication at the edge before data loads.
                  </p>
                </div>
                <div className="p-7 bg-[#faf9f7] rounded-xl border border-indigo-300/40 flex flex-col gap-2">
                  <Lock size={22} style={{ color: "var(--accent)" }} />
                  <div className="font-display font-bold text-[1.1rem] text-ink">JWT Integrity</div>
                  <p className="text-[0.88rem] text-ink-soft/80 leading-relaxed font-sans mt-1">
                    Role-based metadata is encrypted within sessions to prevent privilege escalation.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="relative z-10 flex flex-col items-center text-center px-8 border-t border-indigo-300/40" style={{ paddingTop: "9rem", paddingBottom: "9rem" }}>
        <div className="w-full max-w-[920px] mx-auto">
          <Reveal>
            <div className="border border-indigo-300/50 rounded-3xl bg-indigo-300/10 flex flex-col items-center gap-12 text-center w-full px-8 md:px-16" style={{ paddingTop: "6.5rem", paddingBottom: "6.5rem" }}>
              <div className="flex flex-col gap-5">
                <h2 className="font-display font-black text-[clamp(2rem,3vw,2.8rem)] tracking-[-0.04em] text-ink leading-tight">
                  Ready to try Schollective?
                </h2>
                <p className="text-[1rem] text-ink-soft/80 leading-relaxed max-w-[480px] mx-auto font-sans text-center">
                  Join the platform where serious students meet verified professors.
                </p>
              </div>
              <div className="flex gap-4 flex-wrap justify-center">
                <Button href="/signup" variant="primary" size="lg">
                  Get Started
                </Button>
                <Button href="/" variant="ghost" size="lg">
                  Back to Home
                </Button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
