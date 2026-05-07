"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, useInView } from "framer-motion";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

/* ── Text Reveal Components ── */
function RevealText({ children, className = "", delay = 0 }: { children: string, className?: string, delay?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });
  
  // Split by words
  const words = children.split(" ");
  
  return (
    <h2 ref={ref} className={`flex flex-wrap ${className}`}>
      {words.map((word, i) => (
        <span key={i} className="overflow-hidden mr-[0.25em] mb-[0.1em]">
          <motion.span
            initial={{ y: "110%", rotate: 5 }}
            animate={isInView ? { y: "0%", rotate: 0 } : { y: "110%", rotate: 5 }}
            transition={{ duration: 1.2, ease: EASE, delay: delay + (i * 0.05) }}
            className="inline-block origin-top-left"
          >
            {word}
          </motion.span>
        </span>
      ))}
    </h2>
  );
}

function RevealParagraph({ children, className = "" }: { children: string, className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-20%" });

  return (
    <motion.p
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 1.5, ease: EASE, delay: 0.2 }}
      className={className}
    >
      {children}
    </motion.p>
  );
}

/* ── Horizontal Scroll Section ── */
function HorizontalMethodology() {
  const targetRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
  });

  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-75%"]);

  const steps = [
    { n: "01", t: "Create Profile", d: "Join as a student instantly. Professors undergo manual institutional verification." },
    { n: "02", t: "Find Mentor", d: "Search our vetted database by academic field and real-time availability." },
    { n: "03", t: "Submit Request", d: "Craft a highly focused, structured request using our academic templates." },
    { n: "04", t: "Guided Dialogue", d: "Communicate securely through organized one-on-one threads without giving out personal emails." },
  ];

  return (
    <section ref={targetRef} className="relative h-[300vh] bg-[#050505]">
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <motion.div style={{ x }} className="flex flex-nowrap w-max gap-16 md:gap-32 px-[10vw]">
          {/* Intro Slide */}
          <div className="w-[85vw] md:w-[50vw] flex-shrink-0 flex flex-col justify-center">
            <h2 className="font-display text-[clamp(4rem,8vw,8rem)] leading-[0.8] tracking-tighter font-bold text-[#fff]">
              The direct <br/> line to dialogue.
            </h2>
            <p className="mt-8 text-xl text-[#666] font-light max-w-md">
              Scroll horizontally to explore the Schollective methodology.
            </p>
          </div>

          {/* Step Slides */}
          {steps.map((step, i) => (
            <div key={i} className="w-[80vw] md:w-[50vw] flex-shrink-0 flex flex-col justify-center">
              <div className="text-[rgba(255,255,255,0.05)] font-display text-[clamp(8rem,20vw,20rem)] font-bold leading-none -mb-8 md:-mb-16">
                {step.n}
              </div>
              <h3 className="text-4xl md:text-6xl font-display font-bold mb-6 tracking-tight text-[#fff] relative z-10">
                {step.t}
              </h3>
              <p className="text-xl md:text-3xl text-[#888] font-light max-w-lg relative z-10">
                {step.d}
              </p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════
    PREMIUM LANDING PAGE
════════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  return (
    <div className="relative bg-[#050505] text-[#f2f2f0] overflow-x-clip selection:bg-[#f2f2f0] selection:text-[#050505] font-sans">
      
      {/* ── Background Noise Layer ── */}
      <div className="fixed inset-0 z-0 opacity-[0.03] pointer-events-none mix-blend-screen" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')" }} />

      {/* ════════════════════════════════════════════════════════════════
          FIXED HUD (Heads-Up Display)
      ════════════════════════════════════════════════════════════════ */}
      <div className="fixed inset-0 z-50 pointer-events-none p-6 md:p-10 flex flex-col justify-between mix-blend-difference">
        
        {/* Top Bar */}
        <div className="flex justify-between items-start w-full">
          {/* Top Left: Logo */}
          <div className="flex flex-col gap-2 font-mono text-[0.6rem] md:text-[0.65rem] uppercase tracking-widest font-bold text-white">
            <h1 className="font-display text-2xl md:text-3xl tracking-tighter normal-case mb-1">Schollective</h1>
            <p className="opacity-50">Schollective, Inc. © 2026</p>
          </div>

          {/* Top Right: Navigation Pills */}
          <div className="flex flex-wrap justify-end gap-3 pointer-events-auto">
            <Link href="/login" className="px-5 py-2 border border-white/20 rounded-full text-[0.6rem] font-bold uppercase tracking-[0.2em] text-white hover:bg-white hover:text-black transition-colors duration-500">
              Log In
            </Link>
            <Link href="/signup" className="px-5 py-2 border border-white rounded-full text-[0.6rem] font-bold uppercase tracking-[0.2em] bg-white text-black hover:bg-transparent hover:text-white transition-colors duration-500">
              Sign Up
            </Link>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex justify-between items-end w-full">
          {/* Bottom Left */}
          <div className="flex flex-col gap-2 font-mono text-[0.6rem] uppercase tracking-widest font-bold text-white opacity-50">
            <p>Scroll down to discover.</p>
          </div>

          {/* Bottom Right */}
          <div className="text-right font-mono text-[0.6rem] uppercase tracking-widest font-bold text-white max-w-[200px]">
            <p className="mb-2 opacity-50">////// Manifesto</p>
            <p className="opacity-80 leading-relaxed">
              Democratizing mentorship at the intersection of eager students and willing professors.
            </p>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          SCROLLING CONTENT SECTIONS
      ════════════════════════════════════════════════════════════════ */}
      <div className="relative z-10 w-full flex flex-col items-center">
        
        {/* SCENE 1: Massive Hero */}
        <section className="w-full h-screen flex flex-col items-center justify-center p-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, ease: EASE }}
            className="mb-12 font-mono text-[0.6rem] md:text-xs uppercase tracking-[0.4em] font-bold text-[#888]"
          >
            Direct Academic Mentorship
          </motion.div>

          <h1 className="font-display text-[clamp(4rem,15vw,15rem)] leading-[0.8] tracking-tighter font-black text-[#fff] flex flex-col items-center">
            <span className="overflow-hidden block"><motion.span initial={{ y: "100%" }} animate={{ y: "0%" }} transition={{ duration: 1.2, ease: EASE }} className="block">No More</motion.span></span>
            <span className="overflow-hidden block italic text-[rgba(255,255,255,0.4)]"><motion.span initial={{ y: "100%" }} animate={{ y: "0%" }} transition={{ duration: 1.2, ease: EASE, delay: 0.1 }} className="block">Cold Emails.</motion.span></span>
          </h1>
        </section>

        {/* SCENE 2: The Philosophy */}
        <section className="w-full min-h-screen flex items-center justify-center p-6 md:p-24 relative overflow-hidden my-32">
          <div className="max-w-5xl text-center md:text-left flex flex-col items-center md:items-start">
            <h2 className="font-mono text-[0.6rem] uppercase tracking-[0.4em] font-bold text-[#666] mb-12">Our Philosophy</h2>
            
            <RevealText className="font-display text-[clamp(2.5rem,6vw,6rem)] leading-[0.9] tracking-tighter font-bold text-[#fff] mb-16 justify-center md:justify-start">
              Academic research shouldn't be locked behind opaque institutional barriers.
            </RevealText>

            <RevealParagraph className="text-xl md:text-3xl font-light leading-relaxed max-w-3xl text-[#888]">
              Schollective replaces the anxiety of cold-emailing with a transparent, role-verified platform. Eager students and willing professors connect over shared academic passions. No spam. No guesswork. Just structured intellectual growth.
            </RevealParagraph>
          </div>
        </section>

        {/* SCENE 3: Horizontal Methodology */}
        <HorizontalMethodology />

        {/* SCENE 4: Infrastructure */}
        <section className="w-full min-h-screen flex flex-col justify-center p-6 md:p-24 lg:p-40 max-w-7xl mx-auto my-32">
          <div className="mb-32">
            <h2 className="font-mono text-[0.6rem] uppercase tracking-[0.4em] font-bold text-[#666] mb-8">Infrastructure</h2>
            <RevealText className="font-display text-[clamp(4rem,10vw,10rem)] leading-[0.8] tracking-tighter font-bold text-[#fff]">
              Total Control.
            </RevealText>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-20 md:gap-40 w-full">
            <div className="flex flex-col gap-6">
              <h3 className="text-3xl md:text-5xl font-display font-bold tracking-tight text-[#fff]">Role-Locked Security</h3>
              <p className="text-lg md:text-2xl text-[#888] font-light leading-relaxed">Roles are permanently assigned. Professor accounts undergo rigorous manual administrative review to ensure academic integrity.</p>
            </div>
            <div className="flex flex-col gap-6">
              <h3 className="text-3xl md:text-5xl font-display font-bold tracking-tight text-[#fff]">Structured Threads</h3>
              <p className="text-lg md:text-2xl text-[#888] font-light leading-relaxed">Every conversation is permanently tied to a specific mentorship request, mathematically preventing off-topic or unstructured spam.</p>
            </div>
            <div className="flex flex-col gap-6">
              <h3 className="text-3xl md:text-5xl font-display font-bold tracking-tight text-[#fff]">Institutional Verification</h3>
              <p className="text-lg md:text-2xl text-[#888] font-light leading-relaxed">We cross-reference global university databases to ensure the absolute authenticity of our entire academic network.</p>
            </div>
            <div className="flex flex-col gap-6">
              <h3 className="text-3xl md:text-5xl font-display font-bold tracking-tight text-[#fff]">Unified Dashboard</h3>
              <p className="text-lg md:text-2xl text-[#888] font-light leading-relaxed">Track open requests, manage past conversations, and review pending approvals from a single, beautiful interface.</p>
            </div>
          </div>
        </section>

        {/* SCENE 5: Massive CTA */}
        <section className="w-full min-h-screen flex flex-col items-center justify-center p-6 text-center mt-32 mb-40">
          <RevealText className="font-display text-[clamp(4rem,15vw,15rem)] leading-[0.8] tracking-tighter font-black text-[#fff] justify-center">
            Start Here.
          </RevealText>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 1.4, ease: EASE, delay: 0.5 }}
            className="mt-20 relative z-50 pointer-events-auto"
          >
            <Link href="/signup" className="px-16 py-6 border border-white/20 rounded-full text-sm md:text-lg font-bold uppercase tracking-[0.2em] bg-white text-black hover:bg-transparent hover:text-white transition-all duration-500">
              Create Account
            </Link>
          </motion.div>
        </section>

      </div>
    </div>
  );
}
