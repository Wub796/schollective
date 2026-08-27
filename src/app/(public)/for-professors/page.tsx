"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ScrollProgress } from "@/components/ui/ScrollProgress";
import { PublicNav } from "@/components/ui/PublicNav";
import { PublicFooter } from "@/components/ui/PublicFooter";
import { Button } from "@/components/ui/Button";

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


const BENEFITS = [
  { n: "01", title: "Verified academic background upfront", body: "Before a student can message you, they must list their completed coursework, technical skills, and current projects so you can gauge their preparation in seconds." },
  { n: "02", title: "Zero response obligations", body: "You choose whether to respond. Decline or archive inquiries with a single click without cluttering your institutional inbox." },
  { n: "03", title: "Isolated from your university email", body: "Keep student questions contained in an external dashboard rather than wading through lengthy email threads." },
  { n: "04", title: "No copy-pasted templates", body: "The outreach editor rejects generic mass messages, requiring students to cite specific papers or methods relevant to your group." },
];

const FIELDS = [
  "Biology & Life Sciences", "Computer Science & AI", "Mathematics", "Physics & Astrophysics",
  "Psychology & Cognitive Science", "Economics & Finance", "History & Humanities", "Environmental Science",
  "Engineering", "Political Science", "Chemistry", "Sociology & Anthropology",
];

const FAQ = [
  { q: "How much time does this take?", a: "Only what you choose. Most participating faculty spend five to ten minutes a month answering an occasional inquiry about literature or experimental methodology." },
  { q: "Does this commit me to hosting a student in my group?", a: "No. The platform supports discrete academic questions. If a standout student contacts you and you happen to have an open position, you may choose to discuss it, but there is no expectation to take on advisees." },
  { q: "Can I close a thread?", a: "Yes. You can archive an inquiry or close an active thread whenever a question has been addressed." },
  { q: "Is there any cost?", a: "Schollective is free for faculty and students." },
];

export default function ForProfessorsPage() {
  return (
    <div className="bg-transparent text-slate-900 min-h-screen">
      <ScrollProgress />
      <PublicNav />

      {/* ── HERO ──────────────────────────────────────────── */}
      <section className="relative z-10 px-8 min-h-[75vh] flex flex-col items-center justify-center pt-36 md:pt-44 pb-20">
        <div className="w-full max-w-[820px] mx-auto flex flex-col items-center text-center">
          <FadeIn className="w-full flex flex-col items-center">
            <h1 className="font-display text-[clamp(2.65rem,5.7vw,4.65rem)] font-black tracking-[-0.04em] leading-[1.08] mb-8 text-slate-900 text-center">
              Fewer generic cold emails.<br />
              <em className="italic font-light text-indigo-600">Better questions from students who actually read your work.</em>
            </h1>
          </FadeIn>
          <FadeIn delay={0.15} className="w-full flex flex-col items-center">
            <p style={{ textAlign: "center" }} className="text-[clamp(1.05rem,1.4vw,1.25rem)] text-slate-600 leading-relaxed max-w-[640px] mb-10">
              Schollective replaces unvetted email blasts with structured academic inquiries that include verified coursework,
              technical background, and direct questions about your research.
            </p>
          </FadeIn>
          <FadeIn delay={0.2} className="w-full flex justify-center">
            <div className="flex justify-center gap-4 flex-wrap">
              <Button href="/signup?role=professor" variant="primary" size="lg">
                Join as Faculty →
              </Button>
              <Button href="/about" variant="ghost" size="lg">
                Learn About Us
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── WHY SCHOLLECTIVE ─────────────────────────────── */}
      <section className="relative z-10 flex flex-col items-center text-center px-8 border-t border-indigo-300/40" style={{ paddingTop: "9rem", paddingBottom: "9rem" }}>
        <div className="w-full max-w-[920px] mx-auto">
          <FadeIn>
            <h2 className="font-display text-[clamp(2.2rem,4vw,3.5rem)] font-black tracking-[-0.04em] leading-[1.05] mb-14 text-slate-900">
              Why faculty use Schollective<br /><em className="italic font-light text-indigo-600">instead of an open inbox.</em>
            </h2>
          </FadeIn>
          <div className="w-full">
            {BENEFITS.map((b, i) => (
              <FadeIn key={b.n} delay={i * 0.06}>
                <div className="grid grid-cols-[2.5rem_1fr] md:grid-cols-[3rem_1fr] gap-6 md:gap-8 p-8 md:p-10 mb-6 border border-indigo-300/40 rounded-2xl bg-white/90 text-left items-start shadow-xs">
                  <span className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-600 font-sans font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">{b.n}</span>
                  <div>
                    <h3 className="font-display text-[1.35rem] font-bold text-slate-900 tracking-[-0.02em] mb-2">{b.title}</h3>
                    <p className="text-[0.95rem] text-slate-600/80 leading-relaxed font-sans">{b.body}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── FIELDS ───────────────────────────────────────── */}
      <section className="relative z-10 flex flex-col items-center text-center px-8 border-t border-indigo-300/40" style={{ paddingTop: "9rem", paddingBottom: "9rem" }}>
        <div className="w-full max-w-[920px] mx-auto">
          <FadeIn>
            <h2 className="font-display text-[clamp(2.2rem,3vw,3.2rem)] font-black tracking-[-0.04em] leading-[1.05] mb-12 text-slate-900">
              Students seeking guidance across<br /><em className="italic font-light text-indigo-600">every discipline.</em>
            </h2>
            <div className="flex flex-wrap gap-3 justify-center">
              {FIELDS.map((f) => (
                <span key={f} className="px-5 py-2.5 border border-indigo-300/50 rounded-full text-[0.85rem] text-slate-900 bg-white font-sans shadow-2xs font-semibold">
                  {f}
                </span>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── VERIFICATION ─────────────────────────────────── */}
      <section className="relative z-10 flex flex-col items-center text-center px-8 border-t border-indigo-300/40" style={{ paddingTop: "9rem", paddingBottom: "9rem" }}>
        <div className="w-full max-w-[920px] mx-auto">
          <FadeIn>
            <div className="border border-indigo-300/50 rounded-3xl bg-white/90 shadow-sm w-full px-8 md:px-16" style={{ paddingTop: "6.5rem", paddingBottom: "6.5rem" }}>
              <h2 className="font-display font-black text-[clamp(1.8rem,2.8vw,2.4rem)] tracking-[-0.03em] text-slate-900 mb-6">
                Faculty Verification
              </h2>
              <div className="w-full flex flex-col items-center justify-center text-center">
                <p className="text-center text-[1rem] text-slate-600/80 leading-relaxed max-w-[620px] mb-12 font-sans">
                  To prevent impersonation, faculty registration requires an active .edu or accredited institutional email address
                  and a link to your official department profile. Our team confirms institutional affiliation within 24 to 48 hours.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                {[
                  { step: "1", label: "Institutional Profile", desc: "Register with your active .edu or accredited institutional email and official department URL." },
                  { step: "2", label: "Affiliation Check", desc: "Our team confirms your institutional profile and department standing within 24 to 48 hours." },
                  { step: "3", label: "Direct Inquiries", desc: "Once verified, receive structured student questions directly in your dashboard on your terms." },
                ].map(({ step, label, desc }) => (
                  <div key={step} className="p-7 bg-[#faf9f7] rounded-xl border border-indigo-300/40 flex flex-col gap-2">
                    <div className="text-[0.6rem] font-bold tracking-[0.25em] uppercase text-indigo-600 font-sans">Step {step}</div>
                    <div className="font-display font-bold text-[1.1rem] text-slate-900">{label}</div>
                    <p className="text-[0.88rem] text-slate-600/80 leading-relaxed font-sans mt-1">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────── */}
      <section className="relative z-10 flex flex-col items-center text-center px-8 border-t border-indigo-300/40" style={{ paddingTop: "9rem", paddingBottom: "9rem" }}>
        <div className="w-full max-w-[920px] mx-auto">
          <FadeIn>
            <h2 className="font-display text-[clamp(2.2rem,3.5vw,3rem)] font-black tracking-[-0.04em] leading-[1.05] mb-14 text-slate-900">
              Everything you need<br /><em className="italic font-light text-indigo-600">to know.</em>
            </h2>
          </FadeIn>
          <div className="w-full text-left">
            {FAQ.map((item, i) => (
              <FadeIn key={i} delay={i * 0.05}>
                <div className="p-8 md:p-10 mb-6 border border-indigo-300/40 rounded-2xl bg-white/90 shadow-xs">
                  <h3 className="font-display text-[1.25rem] font-bold text-slate-900 tracking-[-0.02em] mb-3">{item.q}</h3>
                  <p className="text-[0.95rem] text-slate-600/80 leading-relaxed max-w-[680px] font-sans">{item.a}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="relative z-10 flex flex-col items-center text-center px-8 border-t border-indigo-300/40" style={{ paddingTop: "9rem", paddingBottom: "9rem" }}>
        <div className="w-full max-w-[920px] mx-auto">
          <FadeIn>
            <div className="border border-indigo-300/50 rounded-3xl bg-indigo-300/10 flex flex-col items-center gap-10 text-center w-full px-8 md:px-16" style={{ paddingTop: "6.5rem", paddingBottom: "6.5rem" }}>
              <div className="flex flex-col gap-4">
                <h2 className="font-display font-black text-[clamp(2rem,3vw,2.8rem)] tracking-[-0.04em] text-slate-900 leading-tight">
                  Engage with students who actually read your work.
                </h2>
              </div>
              <Button href="/signup?role=professor" variant="primary" size="lg">
                Join Schollective as Faculty →
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
