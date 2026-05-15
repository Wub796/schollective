"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/Button";
import {
  CheckCircle2,
  Search,
  MessageSquare,
  ShieldCheck,
  BarChart3,
  Lock,
  GraduationCap,
  Users,
  ArrowRight,
} from "lucide-react";

/* ── Framer Motion shared variants ──────────────────────────────── */
// Typed as a 4-tuple so TS satisfies Framer Motion's Easing constraint
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: EASE },
  },
};

const staggerGrid = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const cardItem = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: EASE },
  },
};

/* ── Section wrapper with viewport entrance ─────────────────────── */
function Section({
  id,
  children,
  className = "",
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.section
      id={id}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

/* ── Eyebrow label ───────────────────────────────────────────────── */
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={fadeUp}
      className="text-[0.62rem] font-bold tracking-[0.3em] text-[#3a3a3a] uppercase mb-5"
    >
      {children}
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════════
   LANDING PAGE
   ════════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const gridOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const gridY       = useTransform(scrollYProgress, [0, 1], ["0%", "12%"]);

  return (
    <div className="relative min-h-screen bg-[#0d0d0d] text-[#f2f2f0] overflow-x-hidden">

      {/* ══════════════════════════════════════════════════════════
          NAV
      ══════════════════════════════════════════════════════════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between py-5 bg-[rgba(13,13,13,0.88)] backdrop-blur-2xl border-b border-[rgba(255,255,255,0.05)]">
        <div className="content-container flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group no-underline">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#e8e8e6] text-[#0d0d0d] text-xs font-bold transition-opacity group-hover:opacity-80">
              S
            </span>
            <span className="text-sm font-semibold tracking-tight text-[#f2f2f0]">Schollective</span>
          </Link>

          <ul className="hidden lg:flex items-center gap-10 list-none">
            {[
              ["#how",      "Methodology"],
              ["#roles",    "Who It&apos;s For"],
              ["#features", "Infrastructure"],
            ].map(([href, label]) => (
              <li key={href}>
                <Link
                  href={href}
                  className="text-[0.72rem] font-medium text-[#4a4a4a] hover:text-[#f2f2f0] transition-colors uppercase tracking-widest no-underline"
                  dangerouslySetInnerHTML={{ __html: label }}
                />
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden sm:block">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ══════════════════════════════════════════════════════════
          HERO — Perspective grid + cinematic type
      ══════════════════════════════════════════════════════════ */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex flex-col items-center justify-center pt-24 pb-32 overflow-hidden"
      >
        {/* CSS Perspective Grid */}
        <motion.div
          className="perspective-grid-wrap"
          style={{ opacity: gridOpacity, y: gridY }}
          aria-hidden="true"
        >
          <div className="perspective-grid-plane" />
          {/* Radial fade from center */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 70% 60% at 50% 100%, rgba(13,13,13,0) 0%, rgba(13,13,13,0.9) 70%, rgba(13,13,13,1) 100%)",
            }}
          />
        </motion.div>

        {/* Subtle ambient glow */}
        <div
          className="absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(ellipse, rgba(255,255,255,0.018) 0%, transparent 70%)",
          }}
          aria-hidden="true"
        />

        <div className="content-container relative z-10 text-center max-w-5xl mx-auto flex flex-col items-center">
          {/* Status badge */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.025)] text-[#6a6a6a] text-[0.65rem] font-semibold tracking-[0.2em] uppercase mb-14 backdrop-blur-md"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#5a5a5a] animate-pulse" />
            Now open for students &amp; professors
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-[clamp(3.2rem,9vw,8rem)] font-bold text-[#f2f2f0] leading-[1.03] tracking-tight mb-10"
          >
            Academic mentorship,{" "}
            <em className="italic text-[#5a5a5a] font-bold">democratized.</em>
          </motion.h1>

          {/* Sub-headline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="text-lg md:text-xl text-[#5a5a5a] max-w-2xl mx-auto leading-relaxed mb-16 font-light"
          >
            Schollective connects students directly with verified professors for
            structured guidance, research help, and intellectual mentorship —
            completely free of charge.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-md mx-auto"
          >
            <Link href="/signup" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full flex items-center justify-center gap-2 group"
              >
                Start as a Student
                <ArrowRight
                  size={16}
                  className="group-hover:translate-x-0.5 transition-transform"
                />
              </Button>
            </Link>
            <Link href="/signup" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full">
                Join as a Professor
              </Button>
            </Link>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          aria-hidden="true"
        >
          <div className="w-px h-10 bg-gradient-to-b from-transparent to-[rgba(255,255,255,0.1)]" />
          <span className="text-[0.58rem] tracking-[0.3em] text-[#2e2e2e] uppercase font-bold">Scroll</span>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          STATS BAND
      ══════════════════════════════════════════════════════════ */}
      <Section className="border-y border-[rgba(255,255,255,0.05)]">
        <div className="content-container py-20">
          <motion.div
            variants={staggerGrid}
            className="flex flex-col md:flex-row justify-between items-center gap-10 text-center"
          >
            {[
              { num: "100%", label: "Free for students" },
              { num: "0",   label: "Cold emails needed" },
              { num: "∞",   label: "Fields of expertise" },
              { num: "<24h", label: "Avg. response time" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                variants={cardItem}
                className="flex-1 w-full"
              >
                <div className="font-display text-4xl lg:text-5xl font-bold text-[#d4d4d2] mb-2 tracking-tight">
                  {stat.num}
                </div>
                <div className="text-[0.62rem] tracking-[0.25em] text-[#3a3a3a] uppercase font-bold">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </Section>



      {/* ─────────────────────────────────────────────────────────
          METHODOLOGY
          Steps 01 → 04: Create Profile · Find Mentor · Submit Request · Guided Dialogue
      ───────────────────────────────────────────────────────── */}
      <Section id="how" className="py-40 lg:py-64 scroll-mt-24">
        <div className="content-container">
          <div className="max-w-2xl mx-auto text-center mb-24">
            <Eyebrow>Methodology</Eyebrow>
            <motion.h2
              variants={fadeUp}
              className="font-display text-4xl md:text-6xl font-bold text-[#f2f2f0] tracking-tight mb-8 leading-tight"
            >
              From sign-up to{" "}
              <em className="italic text-[#5a5a5a]">meaningful dialogue</em>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-lg text-[#4a4a4a] leading-relaxed font-light">
              We replaced academic cold-email culture with a system designed for
              clarity, safety, and genuine intellectual connection.
            </motion.p>
          </div>

          <motion.div
            variants={staggerGrid}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-[rgba(255,255,255,0.05)]"
          >
            {/* Step 01 — Create Profile */
            /* Step 02 — Find Mentor     */
            /* Step 03 — Submit Request  */
            /* Step 04 — Guided Dialogue */}
            {[
              {
                n: "01",
                t: "Create Profile",
                d: "Students sign up instantly. Professors apply and are manually verified via their institution.",
              },
              {
                n: "02",
                t: "Find Mentor",
                d: "Browse professors by academic field, research area, and current availability.",
              },
              {
                n: "03",
                t: "Submit Request",
                d: "Craft a focused mentorship request using our structured template, ensuring clarity.",
              },
              {
                n: "04",
                t: "Guided Dialogue",
                d: "Communicate through organized one-on-one threads. Real academic guidance, on your terms.",
              },
            ].map((step, i) => (
              <motion.div
                key={i}
                variants={cardItem}
                className="bg-[#0d0d0d] p-12 lg:p-16 flex flex-col items-start group hover:bg-[#111111] transition-colors duration-300"
              >
                {/* Step number */}
                <div className="font-display text-5xl font-bold text-[#1c1c1c] mb-10 group-hover:text-[#222222] transition-colors duration-300">
                  {step.n}
                </div>
                {/* Step title */}
                <h3 className="font-display text-2xl font-semibold text-[#d4d4d2] mb-4 leading-tight">
                  {step.t}
                </h3>
                {/* Step description */}
                <p className="text-sm text-[#4a4a4a] leading-relaxed font-light">
                  {step.d}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </Section>



      {/* ─────────────────────────────────────────────────────────
          THE COMMUNITY
          For Students · For Professors
      ───────────────────────────────────────────────────────── */}
      <Section
        id="roles"
        className="py-40 lg:py-64 border-y border-[rgba(255,255,255,0.05)] scroll-mt-24"
      >
        <div className="content-container">
          <div className="max-w-2xl mx-auto text-center mb-24">
            <Eyebrow>The Community</Eyebrow>
            <motion.h2
              variants={fadeUp}
              className="font-display text-4xl md:text-6xl font-bold text-[#f2f2f0] tracking-tight leading-tight"
            >
              Built for <em className="italic text-[#5a5a5a]">both sides</em> of the
              conversation
            </motion.h2>
          </div>

          {/* ── For Students block ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-[rgba(255,255,255,0.05)]">
            {/* Student panel */}
            <motion.div
              variants={fadeUp}
              className="bg-[#0d0d0d] p-14 lg:p-24 flex flex-col h-full group hover:bg-[#0f0f0f] transition-colors duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.07)] flex items-center justify-center mb-12 text-[#5a5a5a] group-hover:text-[#8a8a8a] transition-colors">
                <GraduationCap size={22} strokeWidth={1.5} />
              </div>
              <h3 className="font-display text-4xl font-bold text-[#f2f2f0] mb-6 leading-tight">
                For Students
              </h3>
              <p className="text-lg text-[#4a4a4a] leading-relaxed mb-12 flex-grow font-light max-w-md">
                High school, undergraduate, or graduate — get direct access to
                professors without cold-emailing into the void.
              </p>
              <ul className="space-y-5 mb-14">
                {[
                  "Instant sign-up, no approval required",
                  "Browse professors by field and availability",
                  "Submit structured mentorship requests",
                  "Receive research feedback and guidance",
                ].map((f, i) => (
                  <li key={i} className="flex gap-4 text-base text-[#5a5a5a] items-start">
                    <CheckCircle2
                      size={16}
                      className="text-[#2e2e2e] shrink-0 mt-1"
                      strokeWidth={1.5}
                    />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/signup">
                <Button className="w-full">Join as a Student</Button>
              </Link>
            </motion.div>

            {/* ── For Professors block ── */}
            <motion.div
              variants={fadeUp}
              className="bg-[#0d0d0d] p-14 lg:p-24 flex flex-col h-full group hover:bg-[#0f0f0f] transition-colors duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] flex items-center justify-center mb-12 text-[#3a3a3a] group-hover:text-[#6a6a6a] transition-colors">
                <Users size={22} strokeWidth={1.5} />
              </div>
              <h3 className="font-display text-4xl font-bold text-[#f2f2f0] mb-6 leading-tight">
                For Professors
              </h3>
              <p className="text-lg text-[#4a4a4a] leading-relaxed mb-12 flex-grow font-light max-w-md">
                Volunteer-based. Share expertise on your own schedule, with full
                control over availability and topics.
              </p>
              <ul className="space-y-5 mb-14">
                {[
                  "Verified via institutional credentials",
                  "Set your own availability and limits",
                  "No spam — only structured requests",
                  "Expand academic impact beyond your institution",
                ].map((f, i) => (
                  <li key={i} className="flex gap-4 text-base text-[#5a5a5a] items-start">
                    <CheckCircle2
                      size={16}
                      className="text-[#2e2e2e] shrink-0 mt-1"
                      strokeWidth={1.5}
                    />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/signup">
                <Button variant="outline" className="w-full">
                  Apply as a Professor
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </Section>



      {/* ─────────────────────────────────────────────────────────
          INFRASTRUCTURE
          Role-Locked Accounts · Structured Messaging · Admin Verification
          Unified Dashboard · Professor Discovery · Safe Access
      ───────────────────────────────────────────────────────── */}
      <Section id="features" className="py-40 lg:py-64 scroll-mt-24">
        <div className="content-container">
          <div className="max-w-2xl mx-auto text-center mb-24">
            <Eyebrow>Infrastructure</Eyebrow>
            <motion.h2
              variants={fadeUp}
              className="font-display text-4xl md:text-6xl font-bold text-[#f2f2f0] tracking-tight leading-tight"
            >
              Everything you need,{" "}
              <em className="italic text-[#5a5a5a]">nothing you don&apos;t</em>
            </motion.h2>
          </div>

          <motion.div
            variants={staggerGrid}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-[rgba(255,255,255,0.05)]"
          >
            {[
              {
                i: Lock,
                t: "Role-Locked Accounts",
                d: "Roles are permanently assigned at onboarding. The system always knows your domain.",
              },
              {
                i: MessageSquare,
                t: "Structured Messaging",
                d: "No unstructured spam. All communication happens through organized threads tied to specific requests.",
              },
              {
                i: ShieldCheck,
                t: "Admin Verification",
                d: "Every professor is manually approved using their institutional credentials.",
              },
              {
                i: BarChart3,
                t: "Unified Dashboard",
                d: "Track all requests, active conversations, and responses in one clean hub.",
              },
              {
                i: Search,
                t: "Professor Discovery",
                d: "Browse and filter professors by field of expertise, institution, and real-time availability.",
              },
              {
                i: ShieldCheck,
                t: "Safe Access",
                d: "Same-role messaging is blocked by design. Professors decide whether to engage with each request.",
              },
            ].map((f, i) => (
              <motion.div
                key={i}
                variants={cardItem}
                className="bg-[#0d0d0d] p-12 lg:p-14 flex flex-col group hover:bg-[#111111] transition-colors duration-300"
              >
                {/* Feature icon */}
                <div className="w-10 h-10 rounded-lg bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] flex items-center justify-center mb-8 text-[#3a3a3a] group-hover:text-[#6a6a6a] transition-colors">
                  <f.i size={18} strokeWidth={1.5} />
                </div>
                {/* Feature title — sub-heading */}
                <h3 className="font-display text-xl font-semibold text-[#d4d4d2] mb-3 leading-tight">
                  {f.t}
                </h3>
                {/* Feature description — anchored directly below title */}
                <p className="text-sm text-[#4a4a4a] leading-relaxed font-light">
                  {f.d}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </Section>



      {/* ─────────────────────────────────────────────────────────
          "The conversation starts here."
          Final call-to-action — single Get Started CTA
      ───────────────────────────────────────────────────────── */}
      <Section className="py-40 lg:py-64 border-t border-[rgba(255,255,255,0.05)] relative overflow-hidden">
        {/* Grid behind the CTA */}
        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg,rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
          aria-hidden="true"
        />
        <div className="content-container relative z-10 text-center max-w-3xl mx-auto">
          <motion.h2
            variants={fadeUp}
            className="font-display text-5xl md:text-7xl font-bold text-[#f2f2f0] mb-8 tracking-tight leading-tight"
          >
            The conversation <em className="italic text-[#5a5a5a]">starts here.</em>
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="text-lg md:text-xl text-[#4a4a4a] mb-16 leading-relaxed font-light"
          >
            Whether you&apos;re a student looking for guidance or a professor
            ready to give it — there&apos;s a place for you.
          </motion.p>
          <motion.div
            variants={fadeUp}
            className="flex flex-col sm:flex-row justify-center items-center gap-4"
          >
            <Link href="/signup" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full flex items-center justify-center gap-2 group"
              >
                Get Started
                <ArrowRight
                  size={16}
                  className="group-hover:translate-x-0.5 transition-transform"
                />
              </Button>
            </Link>
          </motion.div>
        </div>
      </Section>



      {/* ─────────────────────────────────────────────────────────
          PLATFORM footer
          PLATFORM links · ACCOUNT links · Copyright + tagline
      ───────────────────────────────────────────────────────── */}
      <footer className="py-20 border-t border-[rgba(255,255,255,0.05)]">
        <div className="content-container">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 lg:gap-20 mb-16">
            <div className="md:col-span-2">
              <div className="font-display text-3xl font-bold text-[#f2f2f0] mb-5 tracking-tight">
                Schollective
              </div>
              <p className="text-sm text-[#3a3a3a] leading-relaxed max-w-sm font-light">
                A structured academic bridge connecting students and professors
                for meaningful, barrier-free mentorship.
              </p>
            </div>
            {/* PLATFORM links */}
            <div>
              <h4 className="text-[0.62rem] font-bold tracking-[0.25em] text-[#2e2e2e] uppercase mb-6">
                Platform
              </h4>
              <ul className="space-y-3 text-sm text-[#3a3a3a] list-none">
                <li><Link href="#how"      className="hover:text-[#8a8a8a] transition-colors">Methodology</Link></li>
                <li><Link href="#roles"    className="hover:text-[#8a8a8a] transition-colors">For Students</Link></li>
                <li><Link href="#roles"    className="hover:text-[#8a8a8a] transition-colors">For Professors</Link></li>
                <li><Link href="#features" className="hover:text-[#8a8a8a] transition-colors">Infrastructure</Link></li>
              </ul>
            </div>

            {/* ACCOUNT links */}
            <div>
              <h4 className="text-[0.62rem] font-bold tracking-[0.25em] text-[#2e2e2e] uppercase mb-6">
                Account
              </h4>
              <ul className="space-y-3 text-sm text-[#3a3a3a] list-none">
                <li><Link href="/signup" className="hover:text-[#8a8a8a] transition-colors">Sign up</Link></li>
                <li><Link href="/login"  className="hover:text-[#8a8a8a] transition-colors">Log in</Link></li>
              </ul>
            </div>
          </div>

          {/* Copyright + tagline — isolated at absolute bottom */}
          <div className="pt-6 border-t border-[rgba(255,255,255,0.04)] flex flex-col md:flex-row justify-between items-center gap-3 text-[0.7rem] text-[#2a2a2a] uppercase tracking-widest font-medium">
            <span>© 2025 Schollective. All rights reserved.</span>
            <span>Built for academic equity.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
