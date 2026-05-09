import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
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
    <div className="page-bg">

      {/* Nav */}
      <nav className="relative z-50 flex items-center justify-between px-10 md:px-16" style={{ height: "4.5rem", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(8,12,20,0.92)", backdropFilter: "blur(20px)" }}>
        <Link href="/" className="flex items-center gap-3 no-underline">
          <span className="font-display font-bold text-white" style={{ fontSize: "1.1rem", letterSpacing: "-0.02em" }}>Schollective</span>
          <span className="font-mono uppercase hidden sm:block" style={{ fontSize: "0.42rem", letterSpacing: "0.38em", color: "rgba(255,255,255,0.35)", paddingTop: "2px" }}>Academic Mentorship</span>
        </Link>
        <Link href="/" className="no-underline">
          <span className="font-mono uppercase text-white rounded-full px-5 py-2 transition-all" style={{ fontSize: "0.52rem", letterSpacing: "0.22em", border: "1px solid rgba(255,255,255,0.25)" }}>← Home</span>
        </Link>
      </nav>

      <main className="relative z-10 px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <header className="mb-24 text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)] text-[#6a6a6a] text-[0.62rem] font-bold tracking-widest uppercase mb-6">
              <Cpu size={11} />
              Core Capabilities
            </div>
            <h1 className="font-display text-5xl lg:text-7xl font-bold text-[#f2f2f0] leading-tight mb-8">
              Engineered for{" "}
              <em className="italic text-[#7a8aa5]">academic excellence</em>
            </h1>
            <p className="text-[#6a7a9a] text-xl font-light leading-relaxed">
              We&apos;ve built a focused set of tools designed to remove the friction from intellectual
              mentorship while maintaining the highest standards of safety and integrity.
            </p>
          </header>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[rgba(255,255,255,0.05)] mb-32">
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
                className="bg-[#0d0d0d] p-12 lg:p-16 flex flex-col group hover:bg-[#111111] transition-colors duration-300"
              >
                <div className="w-11 h-11 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] flex items-center justify-center mb-8 text-[#6a7a9a] group-hover:text-[#8a8a8a] transition-colors duration-300">
                  <f.i size={22} strokeWidth={1.5} />
                </div>
                <h3 className="font-display text-2xl text-[#d4d4d2] mb-4 font-semibold leading-tight">
                  {f.t}
                </h3>
                <p className="text-base text-[#6a7a9a] font-light leading-relaxed">{f.d}</p>
              </div>
            ))}
          </div>

          {/* Security section */}
          <section className="bg-[#111111] border border-[rgba(255,255,255,0.06)] rounded-2xl p-12 lg:p-20 mb-24 overflow-hidden relative">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                <div>
                  <div className="text-[0.6rem] font-bold tracking-[0.28em] text-[#888] uppercase mb-4">
                    Security Infrastructure
                  </div>
                  <h2 className="font-display text-4xl lg:text-5xl font-bold text-[#f2f2f0] leading-tight mb-6">
                    Safety by <em className="italic text-[#7a8aa5]">Design</em>
                  </h2>
                  <p className="text-base text-[#6a7a9a] font-light leading-relaxed">
                    Schollective isn&apos;t just a directory; it&apos;s a controlled environment. We implement
                    Row Level Security (RLS) at the database layer to ensure your data and conversations
                    are strictly private and authorized.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-5 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-xl">
                    <ShieldCheck className="text-[#6a7a9a] mb-4" size={20} />
                    <h4 className="font-display text-base text-[#d4d4d2] mb-2 font-semibold">Edge Guards</h4>
                    <p className="text-xs text-[#888] font-light leading-relaxed">
                      Global routing guards enforce authentication at the edge before data loads.
                    </p>
                  </div>
                  <div className="p-5 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-xl">
                    <Lock className="text-[#6a7a9a] mb-4" size={20} />
                    <h4 className="font-display text-base text-[#d4d4d2] mb-2 font-semibold">JWT Integrity</h4>
                    <p className="text-xs text-[#888] font-light leading-relaxed">
                      Role-based metadata is encrypted within sessions to prevent privilege escalation.
                    </p>
                  </div>
                </div>
              </div>

              {/* Abstract visual */}
              <div className="relative aspect-square lg:block hidden">
                <div className="absolute inset-0 rounded-full border border-[rgba(255,255,255,0.04)]" />
                <div className="absolute inset-10 border border-[rgba(255,255,255,0.06)] rounded-full border-dashed animate-[spin_20s_linear_infinite]" />
                <div className="absolute inset-20 bg-[#0f0f0f] border border-[rgba(255,255,255,0.08)] rounded-full flex items-center justify-center shadow-2xl">
                  <ShieldCheck size={100} strokeWidth={0.8} className="text-[#2a2a2a]" />
                </div>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="text-center py-20 border border-[rgba(255,255,255,0.05)] rounded-2xl">
            <h2 className="font-display text-4xl lg:text-5xl font-bold text-[#f2f2f0] mb-8 leading-tight">
              Ready to experience <em className="italic text-[#7a8aa5]">Schollective?</em>
            </h2>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <Link href="/signup">
                <Button size="lg" className="px-10">Get Started Free</Button>
              </Link>
              <Link href="/professors">
                <Button variant="ghost" size="lg" className="px-10">Explore Mentors</Button>
              </Link>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-[rgba(255,255,255,0.04)] text-center">
        <div className="font-display text-xl text-[#f2f2f0] mb-3 font-bold">Schollective</div>
        <p className="text-[0.62rem] text-[#2a2a2a] uppercase tracking-widest font-bold">
          Connecting Aspiration with Expertise Since 2025
        </p>
      </footer>
    </div>
  );
}
