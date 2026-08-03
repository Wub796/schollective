"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
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

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-6%" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 28 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.9, ease: EASE, delay }} className={className}>
      {children}
    </motion.div>
  );
}

function Eyebrow({ children }: { children: string }) {
  return (
    <div className="flex items-center justify-center gap-3 mb-6">
      <span className="w-6 h-[2px] bg-indigo-500 block flex-shrink-0" />
      <span className="text-[0.62rem] font-extrabold tracking-[0.22em] uppercase text-indigo-600 font-sans">{children}</span>
      <span className="w-6 h-[2px] bg-indigo-500 block flex-shrink-0" />
    </div>
  );
}

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
    <div className="bg-transparent text-slate-900 min-h-screen">
      <PublicNav />

      {/* ── HERO ──────────────────────────────────────────── */}
      <section className="relative z-10 px-8 min-h-[75vh] flex flex-col items-center justify-center py-20">
        <div className="w-full max-w-[760px] mx-auto flex flex-col items-center text-center">
          <FadeIn className="w-full flex flex-col items-center">
            <Eyebrow>Core Capabilities</Eyebrow>
            <h1 className="font-display text-[clamp(2.8rem,6.5vw,5rem)] font-black tracking-[-0.04em] leading-[1.05] mb-8 text-slate-900 text-center">
              Engineered for<br />
              <em className="italic font-light text-indigo-600">academic excellence.</em>
            </h1>
          </FadeIn>
          <FadeIn delay={0.15} className="w-full flex flex-col items-center">
            <p style={{ textAlign: "center" }} className="text-[clamp(1.05rem,1.4vw,1.25rem)] text-slate-600 leading-relaxed max-w-[620px]">
              We&apos;ve built a focused set of tools designed to remove the friction from intellectual
              mentorship while maintaining the highest standards of safety and integrity.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ── FEATURE GRID ─────────────────────────────────── */}
      <section className="relative z-10 flex flex-col items-center text-center px-8 border-t border-indigo-300/40" style={{ paddingTop: "9rem", paddingBottom: "9rem" }}>
        <div className="w-full max-w-[920px] mx-auto">
          <FadeIn>
            <h2 className="font-display text-[clamp(2.2rem,4vw,3.5rem)] font-black tracking-[-0.04em] leading-[1.05] mb-14 text-slate-900">
              Everything you need,<br /><em className="italic font-light text-indigo-600">nothing you don&apos;t.</em>
            </h2>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
            {FEATURES.map((f, i) => (
              <FadeIn key={f.t} delay={i * 0.05}>
                <div className="p-8 border border-indigo-300/40 rounded-2xl bg-white h-full transition-all duration-300 hover:shadow-md hover:border-indigo-600 text-left flex flex-col">
                  <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-600/25 flex items-center justify-center mb-6">
                    <f.i size={20} style={{ color: "#4f46e5" }} />
                  </div>
                  <h3 className="font-display text-[1.15rem] font-bold text-slate-900 tracking-[-0.02em] mb-2">{f.t}</h3>
                  <p className="text-[0.88rem] text-slate-600/80 leading-relaxed font-sans mt-auto">{f.d}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECURITY ──────────────────────────────────────── */}
      <section className="relative z-10 flex flex-col items-center text-center px-8 border-t border-indigo-300/40" style={{ paddingTop: "9rem", paddingBottom: "9rem" }}>
        <div className="w-full max-w-[920px] mx-auto">
          <FadeIn>
            <div className="border border-indigo-300/50 rounded-3xl bg-white/90 shadow-sm w-full px-8 md:px-16" style={{ paddingTop: "6.5rem", paddingBottom: "6.5rem" }}>
              <h2 className="font-display font-black text-[clamp(1.8rem,2.8vw,2.4rem)] tracking-[-0.03em] text-slate-900 mb-6">
                Safety by <em className="italic font-light text-indigo-600">Design.</em>
              </h2>
              <div className="w-full flex flex-col items-center justify-center text-center">
                <p className="text-center text-[1rem] text-slate-600/80 leading-relaxed max-w-[560px] mb-12 font-sans">
                  Schollective isn&apos;t just a directory; it&apos;s a controlled environment. We implement
                  Row Level Security (RLS) at the database layer to ensure your data and conversations
                  are strictly private and authorized.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                <div className="p-7 bg-[#faf9f7] rounded-xl border border-indigo-300/40 flex flex-col gap-2">
                  <ShieldCheck size={22} style={{ color: "#4f46e5" }} />
                  <div className="font-display font-bold text-[1.1rem] text-slate-900">Edge Guards</div>
                  <p className="text-[0.88rem] text-slate-600/80 leading-relaxed font-sans mt-1">
                    Global routing guards enforce authentication at the edge before data loads.
                  </p>
                </div>
                <div className="p-7 bg-[#faf9f7] rounded-xl border border-indigo-300/40 flex flex-col gap-2">
                  <Lock size={22} style={{ color: "#4f46e5" }} />
                  <div className="font-display font-bold text-[1.1rem] text-slate-900">JWT Integrity</div>
                  <p className="text-[0.88rem] text-slate-600/80 leading-relaxed font-sans mt-1">
                    Role-based metadata is encrypted within sessions to prevent privilege escalation.
                  </p>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="relative z-10 flex flex-col items-center text-center px-8 border-t border-indigo-300/40" style={{ paddingTop: "9rem", paddingBottom: "9rem" }}>
        <div className="w-full max-w-[920px] mx-auto">
          <FadeIn>
            <div className="border border-indigo-300/50 rounded-3xl bg-indigo-300/10 flex flex-col items-center gap-12 text-center w-full px-8 md:px-16" style={{ paddingTop: "6.5rem", paddingBottom: "6.5rem" }}>
              <div className="flex flex-col gap-5">
                <h2 className="font-display font-black text-[clamp(2rem,3vw,2.8rem)] tracking-[-0.04em] text-slate-900 leading-tight">
                  Ready to experience <em className="italic font-light text-indigo-600">Schollective?</em>
                </h2>
                <p className="text-[1rem] text-slate-600/80 leading-relaxed max-w-[480px] mx-auto font-sans text-center">
                  Join the platform where serious students meet verified professors.
                </p>
              </div>
              <div className="flex gap-4 flex-wrap justify-center">
                <Button href="/signup" variant="primary" size="lg">
                  Get Started Free →
                </Button>
                <Button href="/" variant="ghost" size="lg">
                  Back to Home
                </Button>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
