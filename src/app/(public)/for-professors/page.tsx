"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { PublicNav } from "@/components/ui/PublicNav";
import { PublicFooter } from "@/components/ui/PublicFooter";
import { Button } from "@/components/ui/Button";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const SECTION_STYLE = { paddingTop: "8rem", paddingBottom: "8rem" };
const HERO_STYLE = { paddingTop: "9rem", paddingBottom: "8rem" };

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
      <span className="w-6 h-[2px] bg-[#FFC20F] block flex-shrink-0" />
      <span className="text-[0.62rem] font-extrabold tracking-[0.22em] uppercase text-[#008CBB] font-sans">{children}</span>
      <span className="w-6 h-[2px] bg-[#FFC20F] block flex-shrink-0" />
    </div>
  );
}

const BENEFITS = [
  { n: "01", title: "Students Come Prepared", body: "Every request on Schollective is structured — students provide clear context, specific questions, and their academic background before you ever read a word. No more vague 'can I pick your brain?' emails." },
  { n: "02", title: "Total Control Over Your Time", body: "You choose which requests to accept, at what pace, and when. There are no obligations, no minimums, and no institutional pressure. Your expertise, your schedule." },
  { n: "03", title: "Focused, One-on-One Threads", body: "Every mentorship happens in a dedicated thread tied to a specific topic. No inbox clutter, no chain replies — just clean, purposeful academic dialogue." },
  { n: "04", title: "Verified Identity for Both Sides", body: "Students know they're talking to a real professor. You know students are serious learners, not spam accounts. Every profile is reviewed." },
  { n: "05", title: "Pay Expertise Forward", body: "Many of the students reaching out to you today are exactly where you were before your mentor changed your trajectory. Schollective makes that moment replicable at scale." },
];

const FIELDS = [
  "Biology & Life Sciences", "Computer Science & AI", "Mathematics", "Physics & Astrophysics",
  "Psychology & Cognitive Science", "Economics & Finance", "History & Humanities", "Environmental Science",
  "Engineering", "Political Science", "Chemistry", "Sociology & Anthropology",
];

const FAQ = [
  { q: "How long does verification take?", a: "Typically 24–72 hours after you submit your institutional email and professional profile. Our team manually reviews every professor application." },
  { q: "How much time does this require?", a: "As much or as little as you want. Some professors respond to one or two requests a month. Others are more active. There is no minimum commitment." },
  { q: "Are there any fees?", a: "Schollective is completely free for professors. We are funded to keep academic mentorship accessible, not monetized." },
  { q: "Can I end a mentorship thread?", a: "Yes — you can close any thread at any time. Students can also close threads once their question has been answered." },
  { q: "What if a student is inappropriate?", a: "We have a strict conduct policy. Any thread can be reported and reviewed. Accounts that violate our academic integrity standards are permanently removed." },
];

export default function ForProfessorsPage() {
  return (
    <div className="bg-transparent text-[#141005] min-h-screen">
      <PublicNav />

      {/* ── HERO ──────────────────────────────────────────── */}
      <section className="relative z-10 px-8 min-h-[75vh] flex flex-col items-center justify-center py-20">
        <div className="w-full max-w-[760px] mx-auto flex flex-col items-center text-center">
          <FadeIn className="w-full flex flex-col items-center">
            <Eyebrow>For Professors</Eyebrow>
            <h1 className="font-display text-[clamp(2.8rem,6.5vw,5rem)] font-black tracking-[-0.04em] leading-[1.05] mb-8 text-[#141005] text-center">
              Your expertise.<br />
              <em className="italic font-light text-[#008CBB]">Their breakthrough.</em>
            </h1>
          </FadeIn>
          <FadeIn delay={0.15} className="w-full flex flex-col items-center">
            <p style={{ textAlign: "center" }} className="text-[clamp(1.05rem,1.4vw,1.25rem)] text-[#3b3527] leading-relaxed max-w-[620px] mb-10">
              Schollective gives professors a structured, low-friction way to mentor motivated students from anywhere
              in the world — without the noise of unsolicited cold emails, on a schedule that respects your time.
            </p>
          </FadeIn>
          <FadeIn delay={0.2} className="w-full flex justify-center">
            <div className="flex justify-center gap-4 flex-wrap">
              <Button href="/signup" variant="primary" size="lg">
                Apply to Join →
              </Button>
              <Button href="/about" variant="ghost" size="lg">
                Learn About Us
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── WHY SCHOLLECTIVE ─────────────────────────────── */}
      <section className="relative z-10 flex flex-col items-center text-center px-8 border-t border-[#A1C5D1]/40" style={{ paddingTop: "9rem", paddingBottom: "9rem" }}>
        <div className="w-full max-w-[920px] mx-auto">
          <FadeIn>
            <h2 className="font-display text-[clamp(2.2rem,4vw,3.5rem)] font-black tracking-[-0.04em] leading-[1.05] mb-14 text-[#141005]">
              Mentorship on<br /><em className="italic font-light text-[#008CBB]">your terms.</em>
            </h2>
          </FadeIn>
          <div className="w-full">
            {BENEFITS.map((b, i) => (
              <FadeIn key={b.n} delay={i * 0.06}>
                <div className="grid grid-cols-[3.5rem_1fr] gap-8 p-8 md:p-10 mb-6 border border-[#A1C5D1]/40 rounded-2xl bg-white/90 text-left items-start shadow-xs">
                  <span className="font-mono text-[0.68rem] font-bold tracking-[0.2em] text-[#141005] bg-[#FFC20F] px-2.5 py-1 rounded-full text-center mt-1">{b.n}</span>
                  <div>
                    <h3 className="font-display text-[1.35rem] font-bold text-[#141005] tracking-[-0.02em] mb-2">{b.title}</h3>
                    <p className="text-[0.95rem] text-[#3b3527]/80 leading-relaxed font-sans">{b.body}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── FIELDS ───────────────────────────────────────── */}
      <section className="relative z-10 flex flex-col items-center text-center px-8 border-t border-[#A1C5D1]/40" style={{ paddingTop: "9rem", paddingBottom: "9rem" }}>
        <div className="w-full max-w-[920px] mx-auto">
          <FadeIn>
            <h2 className="font-display text-[clamp(2.2rem,3vw,3.2rem)] font-black tracking-[-0.04em] leading-[1.05] mb-12 text-[#141005]">
              Students seeking guidance across<br /><em className="italic font-light text-[#008CBB]">every discipline.</em>
            </h2>
            <div className="flex flex-wrap gap-3 justify-center">
              {FIELDS.map((f) => (
                <span key={f} className="px-5 py-2.5 border border-[#A1C5D1]/50 rounded-full text-[0.85rem] text-[#141005] bg-white font-sans shadow-2xs font-semibold">
                  {f}
                </span>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── VERIFICATION ─────────────────────────────────── */}
      <section className="relative z-10 flex flex-col items-center text-center px-8 border-t border-[#A1C5D1]/40" style={{ paddingTop: "9rem", paddingBottom: "9rem" }}>
        <div className="w-full max-w-[920px] mx-auto">
          <FadeIn>
            <div className="p-12 md:p-16 border border-[#A1C5D1]/50 rounded-3xl bg-white/90 shadow-sm w-full">
              <h2 className="font-display font-black text-[clamp(1.8rem,2.8vw,2.4rem)] tracking-[-0.03em] text-[#141005] mb-6">
                Rigorous by design.
              </h2>
              <div className="w-full flex flex-col items-center justify-center text-center">
                <p className="text-center text-[1rem] text-[#3b3527]/80 leading-relaxed max-w-[560px] mb-12 font-sans">
                  To protect students and maintain the integrity of the platform, every professor application is manually
                  reviewed. We cross-reference university directories, faculty pages, and institutional email addresses
                  before approving any account.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                {[
                  { step: "1", label: "Submit Application", desc: "Complete your professor profile with your institutional email and faculty page URL." },
                  { step: "2", label: "Manual Review", desc: "Our team verifies your identity against university records. Takes 24–72 hours." },
                  { step: "3", label: "Approval & Access", desc: "Once approved, you can browse incoming requests and start accepting mentorships." },
                ].map(({ step, label, desc }) => (
                  <div key={step} className="p-7 bg-[#fafbfc] rounded-xl border border-[#A1C5D1]/40 flex flex-col gap-2">
                    <div className="text-[0.6rem] font-bold tracking-[0.25em] uppercase text-[#008CBB] font-mono">Step {step}</div>
                    <div className="font-display font-bold text-[1.1rem] text-[#141005]">{label}</div>
                    <p className="text-[0.88rem] text-[#3b3527]/80 leading-relaxed font-sans mt-1">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────── */}
      <section className="relative z-10 flex flex-col items-center text-center px-8 border-t border-[#A1C5D1]/40" style={{ paddingTop: "9rem", paddingBottom: "9rem" }}>
        <div className="w-full max-w-[920px] mx-auto">
          <FadeIn>
            <h2 className="font-display text-[clamp(2.2rem,3.5vw,3rem)] font-black tracking-[-0.04em] leading-[1.05] mb-14 text-[#141005]">
              Everything you need<br /><em className="italic font-light text-[#008CBB]">to know.</em>
            </h2>
          </FadeIn>
          <div className="w-full text-left">
            {FAQ.map((item, i) => (
              <FadeIn key={i} delay={i * 0.05}>
                <div className="p-8 md:p-10 mb-6 border border-[#A1C5D1]/40 rounded-2xl bg-white/90 shadow-xs">
                  <h3 className="font-display text-[1.25rem] font-bold text-[#141005] tracking-[-0.02em] mb-3">{item.q}</h3>
                  <p className="text-[0.95rem] text-[#3b3527]/80 leading-relaxed max-w-[680px] font-sans">{item.a}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="relative z-10 flex flex-col items-center text-center px-8 border-t border-[#A1C5D1]/40" style={{ paddingTop: "9rem", paddingBottom: "9rem" }}>
        <div className="w-full max-w-[920px] mx-auto">
          <FadeIn>
            <div className="p-12 md:p-16 border border-[#A1C5D1]/50 rounded-3xl bg-[#A1C5D1]/10 flex flex-col items-center gap-10 text-center w-full">
              <div className="flex flex-col gap-3">
                <h2 className="font-display font-black text-[clamp(2rem,3vw,2.8rem)] tracking-[-0.04em] text-[#141005] leading-tight">
                  Ready to make an impact?
                </h2>
                <p className="text-[1rem] text-[#3b3527]/80 leading-relaxed max-w-[480px] mx-auto font-sans text-center">
                  Apply today. Manual verification means the students you meet have already been filtered for seriousness of purpose.
                </p>
              </div>
              <Button href="/signup" variant="primary" size="lg">
                Apply as Professor →
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
