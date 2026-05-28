"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { PublicNav } from "@/components/ui/PublicNav";
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
    <div className="page-bg" style={{ minHeight: "100vh", background: "var(--bg-base)", color: "var(--text-primary)" }}>
      <PublicNav />

      {/* Ambient glow */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse 80% 60% at 80% 20%, rgba(99,102,241,0.06) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 20% 80%, rgba(37, 99, 235,0.04) 0%, transparent 60%)", zIndex: 0 }} />

      <main className="relative z-10 px-6 sm:px-8 py-32 lg:py-40">
        <div style={{ maxWidth: "960px", margin: "0 auto" }}>
          {/* Header */}
          <header className="mb-24 text-center max-w-3xl mx-auto" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[rgba(37, 99, 235,0.15)] bg-[rgba(37, 99, 235,0.04)] text-var(--accent) text-[0.62rem] font-bold tracking-widest uppercase mb-6" style={{ fontFamily: "var(--font-sans)", color: "var(--accent)" }}>
              <Cpu size={11} />
              Core Capabilities
            </div>
            <h1 className="font-display text-5xl lg:text-7xl font-bold text-var(--text-primary) leading-tight mb-8" style={{ fontSize: "clamp(2.6rem, 6vw, 4rem)", letterSpacing: "-0.03em" }}>
              Engineered for{" "}
              <em className="italic" style={{ fontStyle: "italic", color: "var(--accent)" }}>academic excellence</em>
            </h1>
            <p className="text-var(--text-secondary) text-lg font-light leading-relaxed max-w-2xl" style={{ color: "var(--text-secondary)", lineHeight: 1.8 }}>
              We&apos;ve built a focused set of tools designed to remove the friction from intellectual
              mentorship while maintaining the highest standards of safety and integrity.
            </p>
          </header>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-32">
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
                className="p-8 lg:p-10 flex flex-col group transition-all duration-300"
                style={{
                  background: "var(--bg-surface-1)",
                  border: "1px solid var(--border)",
                  borderRadius: "16px",
                }}
              >
                <div className="w-11 h-11 rounded-xl bg-[rgba(37, 99, 235,0.05)] border border-[rgba(37, 99, 235,0.12)] flex items-center justify-center mb-8 text-var(--text-secondary) group-hover:text-var(--accent) transition-colors duration-300">
                  <f.i size={20} strokeWidth={1.5} style={{ color: "var(--accent)" }} />
                </div>
                <h3 className="font-display text-2xl text-var(--text-primary) mb-4 font-semibold leading-tight" style={{ fontSize: "1.3rem", letterSpacing: "-0.01em" }}>
                  {f.t}
                </h3>
                <p className="text-base text-var(--text-secondary) font-light leading-relaxed" style={{ fontSize: "0.92rem", lineHeight: 1.75 }}>{f.d}</p>
              </div>
            ))}
          </div>

          {/* Security section */}
          <section className="border border-var(--border) rounded-2xl p-10 lg:p-16 mb-32 overflow-hidden relative" style={{ background: "var(--bg-surface-1)", border: "1px solid var(--border)" }}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-8" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                <div>
                  <div className="text-[0.55rem] font-bold tracking-[0.38em] text-var(--accent) uppercase mb-4" style={{ fontFamily: "var(--font-sans)", color: "var(--accent)", opacity: 0.8 }}>
                    Security Infrastructure
                  </div>
                  <h2 className="font-display text-4xl lg:text-5xl font-bold text-var(--text-primary) leading-tight mb-6" style={{ fontSize: "clamp(2rem, 3.5vw, 2.6rem)", letterSpacing: "-0.03em" }}>
                    Safety by <em className="italic" style={{ fontStyle: "italic", color: "var(--accent)" }}>Design</em>
                  </h2>
                  <p className="text-base text-var(--text-secondary) font-light leading-relaxed" style={{ fontSize: "0.95rem", lineHeight: 1.8 }}>
                    Schollective isn&apos;t just a directory; it&apos;s a controlled environment. We implement
                    Row Level Security (RLS) at the database layer to ensure your data and conversations
                    are strictly private and authorized.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-5 rounded-xl" style={{ background: "var(--bg-base)", border: "1px solid var(--border)" }}>
                    <ShieldCheck className="text-var(--accent) mb-4" size={20} style={{ color: "var(--accent)" }} />
                    <h4 className="font-display text-base text-var(--text-primary) mb-2 font-semibold" style={{ fontSize: "1rem" }}>Edge Guards</h4>
                    <p className="text-xs text-var(--text-secondary) font-light leading-relaxed" style={{ fontSize: "0.8rem", lineHeight: 1.7 }}>
                      Global routing guards enforce authentication at the edge before data loads.
                    </p>
                  </div>
                  <div className="p-5 rounded-xl" style={{ background: "var(--bg-base)", border: "1px solid var(--border)" }}>
                    <Lock className="text-var(--accent) mb-4" size={20} style={{ color: "var(--accent)" }} />
                    <h4 className="font-display text-base text-var(--text-primary) mb-2 font-semibold" style={{ fontSize: "1rem" }}>JWT Integrity</h4>
                    <p className="text-xs text-var(--text-secondary) font-light leading-relaxed" style={{ fontSize: "0.8rem", lineHeight: 1.7 }}>
                      Role-based metadata is encrypted within sessions to prevent privilege escalation.
                    </p>
                  </div>
                </div>
              </div>

              {/* Abstract visual */}
              <div className="relative aspect-square lg:block hidden">
                <div className="absolute inset-0 rounded-full border border-var(--border)" style={{ border: "1px solid var(--border)", opacity: 0.5 }} />
                <div className="absolute inset-10 border border-var(--border) rounded-full border-dashed animate-[spin_40s_linear_infinite]" style={{ border: "1px dashed var(--border)", opacity: 0.3 }} />
                <div className="absolute inset-20 border border-var(--border) rounded-full flex items-center justify-center shadow-2xl" style={{ background: "var(--bg-base)", border: "1px solid var(--border)" }}>
                  <ShieldCheck size={80} strokeWidth={0.8} style={{ color: "var(--accent)", opacity: 0.25 }} />
                </div>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="text-center py-20 border rounded-2xl" style={{ border: "1px solid var(--border)", background: "rgba(99, 102, 241, 0.04)" }}>
            <h2 className="font-display text-4xl lg:text-5xl font-bold text-var(--text-primary) mb-8 leading-tight" style={{ fontSize: "clamp(2rem, 3.5vw, 2.8rem)", letterSpacing: "-0.03em" }}>
              Ready to experience <em className="italic" style={{ fontStyle: "italic", color: "var(--accent)" }}>Schollective?</em>
            </h2>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <Link href="/signup" style={{ textDecoration: "none" }}>
                <Button size="lg" className="px-10 py-4" style={{ borderRadius: "100px", padding: "1rem 2.5rem", background: "var(--accent)", color: "var(--bg-base)", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase" }}>Get Started Free</Button>
              </Link>
              <Link href="/professors" style={{ textDecoration: "none" }}>
                <Button variant="ghost" size="lg" className="px-10 py-4" style={{ borderRadius: "100px", padding: "1rem 2.5rem", border: "1px solid var(--border)", color: "var(--text-secondary)", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase" }}>Explore Mentors</Button>
              </Link>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t text-center" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="font-display text-xl text-var(--text-primary) mb-3 font-bold" style={{ fontSize: "1.2rem", letterSpacing: "-0.02em" }}>Schollective</div>
        <p className="text-[0.62rem] text-var(--text-tertiary) uppercase tracking-widest font-bold" style={{ color: "var(--text-tertiary)" }}>
          Connecting Aspiration with Expertise Since 2025
        </p>
      </footer>
    </div>
  );
}
