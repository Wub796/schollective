import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { 
  Lock, 
  MessageSquare, 
  ShieldCheck, 
  BarChart3, 
  Search, 
  Globe, 
  Zap, 
  Cpu, 
  ArrowLeft,
  GraduationCap
} from "lucide-react";

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-[var(--navy)] relative overflow-x-hidden">
      {/* Background Polish */}
      <div className="fixed inset-0 z-0 bg-[radial-gradient(circle_at_50%_0%,rgba(212,146,42,0.05),transparent_50%)] pointer-events-none" />

      {/* Navigation */}
      <nav className="relative z-50 flex items-center justify-between px-4 sm:px-6 lg:px-8 py-8 bg-transparent">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center bg-[var(--amber)] rounded-lg font-serif text-[var(--navy)] text-xl font-bold">S</div>
            <div className="font-serif text-2xl text-[var(--ivory)] font-medium">Schol<span className="text-[var(--amber)]">lective</span></div>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft size={16} />
              Back to Home
            </Button>
          </Link>
        </div>
      </nav>

      <main className="relative z-10 px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <header className="mb-24 text-center max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[rgba(212,146,42,0.08)] border border-[rgba(212,146,42,0.2)] text-[var(--amber)] text-[0.65rem] font-bold tracking-widest uppercase mb-6">
              <Cpu size={12} />
              Core Capabilities
            </div>
            <h1 className="font-serif text-5xl lg:text-7xl font-light text-[var(--ivory)] leading-tight mb-8">
              Engineered for <br /><em className="italic text-[var(--amber-light)]">academic excellence</em>
            </h1>
            <p className="text-[var(--text-muted)] text-xl font-light leading-relaxed">
              We&apos;ve built a focused set of tools designed to remove the friction from intellectual mentorship while maintaining the highest standards of safety and integrity.
            </p>
          </header>

          {/* Deep Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 mb-32">
            {[
              {
                i: Lock,
                t: "Role-Based Integrity",
                d: "Our architecture strictly separates Student and Professor domains. Roles are verified at onboarding and permanently locked to prevent impersonation or cross-role confusion.",
                color: "amber"
              },
              {
                i: MessageSquare,
                t: "Structured Request Flow",
                d: "Gone are the days of ambiguous cold emails. Every mentorship starts with a structured data model, ensuring professors have the context they need to say 'Yes'.",
                color: "sage"
              },
              {
                i: ShieldCheck,
                t: "Manual Academic Verification",
                d: "We don't just rely on email domains. Our admin team manually reviews institutional credentials for every professor application to ensure platform quality.",
                color: "ivory"
              },
              {
                i: Globe,
                t: "Global Mentor Network",
                d: "Connect with verified experts regardless of their physical location or your institutional affiliation. Breaking down geographical barriers to knowledge.",
                color: "amber"
              },
              {
                i: Zap,
                t: "Real-Time Thread Sync",
                d: "Utilizing Postgres Change Data Capture (CDC), our messaging interface provides sub-second latency for academic dialogues without the need for constant polling.",
                color: "sage"
              },
              {
                i: BarChart3,
                t: "Progress Tracking",
                d: "Keep an organized history of your intellectual journey. Monitor the status of multiple concurrent requests and active mentorship threads in one hub.",
                color: "ivory"
              }
            ].map((f, i) => (
              <div key={i} className="bg-[rgba(17,34,64,0.5)] border border-[rgba(155,175,192,0.1)] rounded-[40px] p-10 lg:p-14 backdrop-blur-3xl shadow-2xl transition-all hover:border-[var(--amber)]/20 hover:bg-[rgba(17,34,64,0.7)] group">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 border transition-transform duration-500 group-hover:scale-110 ${
                  f.color === 'amber' ? "bg-[rgba(212,146,42,0.1)] border-[rgba(212,146,42,0.2)] text-[var(--amber)]" :
                  f.color === 'sage' ? "bg-[rgba(61,122,107,0.1)] border-[rgba(61,122,107,0.2)] text-[var(--sage-light)]" :
                  "bg-[rgba(255,255,255,0.05)] border-[rgba(155,175,192,0.15)] text-[var(--ivory)]"
                }`}>
                  <f.i size={28} strokeWidth={1.5} />
                </div>
                <h3 className="font-serif text-3xl text-[var(--ivory)] mb-5 font-light tracking-tight">{f.t}</h3>
                <p className="text-lg text-[var(--text-muted)] font-light leading-relaxed">{f.d}</p>
              </div>
            ))}
          </div>

          {/* Detailed Section: Security */}
          <section className="bg-[rgba(17,34,64,0.3)] border border-[rgba(212,146,42,0.1)] rounded-[48px] p-12 lg:p-24 mb-32 overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--amber)]/5 blur-[120px] pointer-events-none transition-all group-hover:bg-[var(--amber)]/10" />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
              <div className="space-y-8">
                <div>
                  <div className="text-[0.65rem] font-bold tracking-[0.25em] text-[var(--amber)] uppercase mb-4">Security Infrastructure</div>
                  <h2 className="font-serif text-4xl lg:text-5xl font-light text-[var(--ivory)] leading-tight mb-6">
                    Safety by <em className="italic text-[var(--amber-light)]">Design</em>
                  </h2>
                  <p className="text-lg text-[var(--text-muted)] font-light leading-relaxed">
                    Schollective isn&apos;t just a directory; it&apos;s a controlled environment. We implement Row Level Security (RLS) at the database layer to ensure that your data and conversations are strictly private and authorized.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="p-6 bg-[rgba(11,22,40,0.5)] border border-[rgba(155,175,192,0.1)] rounded-2xl">
                    <ShieldCheck className="text-[var(--sage-light)] mb-4" size={24} />
                    <h4 className="font-serif text-xl text-[var(--ivory)] mb-2">Edge Guards</h4>
                    <p className="text-xs text-[var(--text-muted)] font-light">Global routing guards enforce authentication at the edge before data loads.</p>
                  </div>
                  <div className="p-6 bg-[rgba(11,22,40,0.5)] border border-[rgba(155,175,192,0.1)] rounded-2xl">
                    <Lock className="text-[var(--amber)] mb-4" size={24} />
                    <h4 className="font-serif text-xl text-[var(--ivory)] mb-2">JWT Integrity</h4>
                    <p className="text-xs text-[var(--text-muted)] font-light">Role-based metadata is encrypted within sessions to prevent privilege escalation.</p>
                  </div>
                </div>
              </div>

              <div className="relative aspect-square lg:block hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--amber)]/20 to-transparent rounded-full animate-pulse" />
                <div className="absolute inset-10 border border-[var(--amber)]/20 rounded-full border-dashed animate-[spin_20s_linear_infinite]" />
                <div className="absolute inset-20 bg-[rgba(17,34,64,0.8)] border border-[var(--amber)]/30 rounded-full flex items-center justify-center shadow-2xl backdrop-blur-xl">
                  <ShieldCheck size={120} strokeWidth={1} className="text-[var(--amber)]" />
                </div>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="text-center py-20 bg-[radial-gradient(circle_at_50%_50%,rgba(212,146,42,0.05),transparent_70%)] rounded-[48px] border border-[rgba(155,175,192,0.05)]">
            <h2 className="font-serif text-4xl lg:text-5xl font-light text-[var(--ivory)] mb-8">Ready to experience Schollective?</h2>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-5">
               <Link href="/auth/signup">
                 <Button size="lg" className="px-10">Get Started Free</Button>
               </Link>
               <Link href="/professors">
                 <Button variant="ghost" size="lg" className="px-10 border-2">Explore Mentors</Button>
               </Link>
            </div>
          </section>
        </div>
      </main>

      {/* Simplified Footer */}
      <footer className="py-12 border-t border-[rgba(155,175,192,0.1)] text-center">
         <div className="font-serif text-2xl text-[var(--ivory)] mb-4 opacity-80">Schol<span>lective</span></div>
         <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest font-bold opacity-40">Connecting Aspiration with Expertise Since 2025</p>
      </footer>
    </div>
  );
}
