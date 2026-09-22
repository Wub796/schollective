"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { ShieldCheck, X, Check } from "lucide-react";
import { PublicNav } from "@/components/ui/PublicNav";
import { Button } from "@/components/ui/Button";
import { PublicFooter } from "@/components/ui/PublicFooter";
import { ScrollProgress } from "@/components/ui/ScrollProgress";
import { BackToTop } from "@/components/ui/BackToTop";
import { MobileStickyBar } from "@/components/ui/MobileStickyBar";

const EASE: [number, number, number, number] = [0.19, 1, 0.22, 1];

function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-5%" });
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.65, ease: EASE, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Section shell ────────────────────────────────────────────────────────
 * One paddings-and-rule wrapper so every section shares the same vertical
 * rhythm instead of each one re-deciding its own py-36/py-44/border.
 * ──────────────────────────────────────────────────────────────────────── */
function Section({
  children,
  id,
  rule = true,
  className = "",
}: {
  children: React.ReactNode;
  id?: string;
  rule?: boolean;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={`px-6 py-24 md:py-32 ${rule ? "border-t border-line" : ""} ${className}`}
    >
      <div className="mx-auto w-full max-w-5xl">{children}</div>
    </section>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-5 font-sans text-[0.68rem] font-bold uppercase tracking-[0.18em] text-ink-mute">
      {children}
    </p>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   INTERFACE PREVIEW
   A single, honest depiction of the product — no fake browser chrome and no
   invented faculty. Every row describes an interface element, not a person:
   naming a real university next to a made-up professor is a credibility
   problem, and an invented name is worse than a labelled gap.
   ══════════════════════════════════════════════════════════════════════════ */
const PREVIEW_RESULTS = [
  { field: "Computational neuroscience", meta: "Verified faculty · 3 recent papers", tags: ["Memory", "fMRI"] },
  { field: "Neural circuits", meta: "Verified faculty · 5 recent papers", tags: ["Circuits", "Optogenetics"] },
  { field: "Brain–computer interfaces", meta: "Verified faculty · 2 recent papers", tags: ["BCI", "Signal processing"] },
];

function AppPreview() {
  return (
    <figure className="m-0">
      <div className="overflow-hidden rounded-surface border border-line bg-surface shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        {/* Search bar */}
        <div className="flex flex-col gap-3 border-b border-line px-5 py-4 sm:flex-row sm:items-center">
          <div className="flex h-10 flex-1 items-center gap-2.5 rounded-control border border-line bg-paper px-4">
            <span className="text-[0.8rem] text-ink-soft">memory consolidation</span>
            <span className="ml-auto h-4 w-px animate-pulse bg-line-strong" aria-hidden="true" />
          </div>
          <div className="flex gap-2">
            <span className="rounded-control border border-accent/25 bg-accent/8 px-3.5 py-2 text-[0.72rem] font-semibold text-accent">
              Neuroscience
            </span>
            <span className="rounded-control border border-line px-3.5 py-2 text-[0.72rem] font-medium text-ink-mute">
              Accepting students
            </span>
          </div>
        </div>

        {/* Results */}
        <ul className="divide-y divide-line">
          {PREVIEW_RESULTS.map((result) => (
            <li key={result.field} className="flex flex-col gap-2.5 px-5 py-4 sm:flex-row sm:items-center sm:gap-4">
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-accent/8 text-[0.6rem] font-bold uppercase tracking-wide text-accent"
                aria-hidden="true"
              >
                Faculty
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-[0.95rem] font-semibold text-ink">{result.field}</span>
                <span className="block text-[0.75rem] text-ink-mute">{result.meta}</span>
              </span>
              <span className="flex shrink-0 gap-1.5">
                {result.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-control bg-paper px-2 py-1 text-[0.62rem] font-medium text-ink-soft ring-1 ring-line"
                  >
                    {tag}
                  </span>
                ))}
              </span>
            </li>
          ))}
        </ul>

        {/* Expanded paper summary */}
        <div className="border-t border-line bg-paper px-5 py-5">
          <p className="mb-2 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-accent">
            Paper breakdown
          </p>
          <p className="max-w-prose text-[0.85rem] leading-relaxed text-ink-soft text-pretty">
            Sleep-dependent memory consolidation is studied by tracking neural activity overnight and
            testing recall the next day. The recent work finds that a specific rhythm during REM sleep
            tracks with how well participants recalled what they had learned.
          </p>
        </div>
      </div>

      <figcaption className="mt-3 text-center text-[0.72rem] text-ink-mute">
        Illustrative preview of the directory and paper summaries.
      </figcaption>
    </figure>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   LANDING PAGE
   ══════════════════════════════════════════════════════════════════════════ */
const PROBLEM_REASONS = [
  {
    title: "They read as generated.",
    body: "Generic phrasing and soft flattery read as one of a mass send, so the reply never comes.",
  },
  {
    title: "They name papers they have not read.",
    body: "Citing a title without engaging with the method is worse than citing nothing at all.",
  },
  {
    title: "They ignore what a lab actually works on.",
    body: "Faculty change direction between papers. A directory built from stale department pages will not show that.",
  },
];

const COMPARISON_ROWS = [
  {
    bad: "Invites you to invent citations and contact details.",
    good: "Faculty profiles built from current rosters and recent publications.",
  },
  {
    bad: "Produces a template that reads like a template.",
    good: "An editor that asks what you actually want to ask, then helps you phrase it.",
  },
  {
    bad: "Leaves you stitching together search engines and chatbots.",
    good: "Search, paper summaries and the draft itself in one place.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Search by subfield, not by school",
    body: "Look up the topic — memory consolidation, computational linguistics — and see who is publishing in it this year.",
  },
  {
    n: "02",
    title: "Read what the lab actually found",
    body: "Each recent paper is reduced to the question, the method and the finding, in plain language.",
  },
  {
    n: "03",
    title: "Write the email yourself",
    body: "The editor prompts you for a specific connection to the work, a real question, and your availability.",
  },
];

export default function LandingPage() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative bg-paper font-sans text-ink">
      <ScrollProgress />
      <PublicNav />

      {/* ══ HERO ══════════════════════════════════════════════════════════
          Left-aligned and set on the page rather than floated in the middle
          of an empty viewport. The italic accent is the page's one signature
          typographic move; every other heading on the site is set plainly. */}
      <section className="border-b border-line px-6 pt-36 pb-20 md:pt-44 md:pb-24">
        <div className="mx-auto grid w-full max-w-5xl gap-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:items-center lg:gap-16">
          <div>
            <Eyebrow>Academic outreach, without the spray-and-pray</Eyebrow>
            <h1 className="font-display text-[clamp(2.4rem,5.2vw,4rem)] font-black leading-[1.05] tracking-[-0.035em] text-ink text-pretty">
              Find professors doing research{" "}
              <em className="font-light italic text-accent">you actually care about.</em>
            </h1>
            <p className="mt-6 max-w-lg text-[1.05rem] leading-relaxed text-ink-soft text-pretty">
              Schollective helps high schoolers find faculty who are publishing right now, understand
              what they found, and write an email that does not get deleted.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Button href="/signup" variant="primary" size="lg">
                Get Started
              </Button>
              <Link
                href="/for-professors"
                className="link-underline text-sm font-semibold text-ink-soft hover:text-accent"
              >
                I am a professor
              </Link>
            </div>
          </div>

          <Reveal delay={0.1}>
            <AppPreview />
          </Reveal>
        </div>
      </section>

      {/* ══ PROBLEM ═══════════════════════════════════════════════════════
          A numbered list on hairlines, not three bordered cards holding one
          sentence each. The heading carries the claim; the list carries the
          reasons. */}
      <Section className="border-t-0">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] lg:gap-16">
          <h2 className="font-display text-[clamp(1.85rem,3.4vw,2.6rem)] font-bold leading-[1.15] tracking-[-0.02em] text-ink text-pretty">
            Most student outreach is deleted before the first line is finished.
          </h2>

          <ol className="m-0 list-none p-0">
            {PROBLEM_REASONS.map((reason) => (
              <li key={reason.title} className="border-t border-line py-6 first:border-t-0 first:pt-0">
                <div className="flex items-start gap-4">
                  <X size={16} strokeWidth={2.5} className="mt-1 shrink-0 text-red-500" aria-hidden="true" />
                  <div>
                    <h3 className="font-display text-[1.05rem] font-semibold text-ink">{reason.title}</h3>
                    <p className="mt-1.5 max-w-prose text-[0.9rem] leading-relaxed text-ink-soft text-pretty">
                      {reason.body}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      {/* ══ VERIFICATION — the page's one full-bleed moment ═══════════════
          This replaces a testimonials block. Invented quotes attributed to
          named people at real universities are a credibility risk, and there
          is a true, checkable claim to make instead. */}
      <section className="bg-accent px-6 py-20 text-white md:py-24">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 md:flex-row md:items-start md:gap-14">
          <ShieldCheck size={30} strokeWidth={1.75} className="shrink-0 text-white/90" aria-hidden="true" />
          <div>
            <h2 className="font-display text-[clamp(1.6rem,2.8vw,2.15rem)] font-bold leading-[1.2] tracking-[-0.02em] text-pretty">
              Every faculty profile is reviewed by a person.
            </h2>
            <p className="mt-4 max-w-2xl text-[0.95rem] leading-relaxed text-white/85 text-pretty">
              Professors apply, and an admin checks the institutional credentials against a current
              university roster before the profile becomes visible to students. Accounts that cannot be
              matched do not appear in the directory, and students cannot message faculty outside it.
            </p>
          </div>
        </div>
      </section>

      {/* ══ COMPARISON ════════════════════════════════════════════════════ */}
      <Section>
        <h2 className="font-display text-[clamp(1.7rem,3vw,2.3rem)] font-bold leading-[1.15] tracking-[-0.02em] text-ink">
          Why not just use a chatbot?
        </h2>

        <div className="mt-10 overflow-hidden rounded-surface border border-line">
          <div className="hidden border-b border-line md:grid md:grid-cols-2">
            <p className="m-0 px-6 py-3.5 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-ink-mute">
              A general chatbot
            </p>
            <p className="m-0 border-l border-line bg-accent/5 px-6 py-3.5 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-accent">
              Schollective
            </p>
          </div>

          {COMPARISON_ROWS.map((row) => (
            <div
              key={row.bad}
              className="grid border-b border-line last:border-b-0 md:grid-cols-2"
            >
              <div className="flex items-start gap-3 px-6 py-5">
                <X size={15} strokeWidth={2.5} className="mt-1 shrink-0 text-red-500" aria-hidden="true" />
                <p className="m-0 text-[0.88rem] leading-relaxed text-ink-mute text-pretty">{row.bad}</p>
              </div>
              <div className="flex items-start gap-3 border-t border-line bg-accent/5 px-6 py-5 md:border-t-0 md:border-l">
                <Check size={15} strokeWidth={2.5} className="mt-1 shrink-0 text-accent" aria-hidden="true" />
                <p className="m-0 text-[0.88rem] font-medium leading-relaxed text-ink text-pretty">{row.good}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ══ STEPS ═════════════════════════════════════════════════════════
          Three columns of equal weight. The old version alternated
          text/mockup left-right-left, which is one composition repeated with
          the mirror flipped, and each panel was a fixed 480px tall. */}
      <Section>
        <h2 className="font-display text-[clamp(1.7rem,3vw,2.3rem)] font-bold leading-[1.15] tracking-[-0.02em] text-ink">
          How it works
        </h2>
        <p className="mt-3 max-w-md text-[0.95rem] leading-relaxed text-ink-soft text-pretty">
          Three steps, designed so that the second half of the work is the part that matters.
        </p>

        <motion.ol
          className="m-0 mt-12 grid list-none gap-10 p-0 md:grid-cols-3 md:gap-8"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: reduceMotion ? 0 : 0.1 } } }}
        >
          {STEPS.map((step) => (
            <motion.li
              key={step.n}
              variants={{
                hidden: reduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
              }}
              className="border-t-2 border-ink pt-5"
            >
              <span className="font-mono text-[0.7rem] font-semibold tracking-[0.14em] text-accent">
                {step.n}
              </span>
              <h3 className="mt-3 font-display text-[1.15rem] font-semibold leading-snug text-ink text-pretty">
                {step.title}
              </h3>
              <p className="mt-2.5 text-[0.9rem] leading-relaxed text-ink-soft text-pretty">{step.body}</p>
            </motion.li>
          ))}
        </motion.ol>
      </Section>

      {/* ══ CLOSING ═══════════════════════════════════════════════════════ */}
      <Section>
        <div className="flex flex-col items-start gap-8 md:flex-row md:items-end md:justify-between">
          <h2 className="max-w-xl font-display text-[clamp(1.9rem,3.8vw,2.9rem)] font-bold leading-[1.1] tracking-[-0.025em] text-ink text-pretty">
            Send the email that shows you did the reading.
          </h2>
          <div className="shrink-0">
            <Button href="/signup" variant="primary" size="lg">
              Get Started
            </Button>
            <p className="mt-3 text-[0.8rem] text-ink-mute">Free for students. No card.</p>
          </div>
        </div>
      </Section>

      <PublicFooter />

      <BackToTop />
      <MobileStickyBar />
    </div>
  );
}
