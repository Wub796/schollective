"use client";

import React from "react";
import Link from "next/link";
import { AccentBand, Eyebrow, PageSection, RowList, SectionHeading, Reveal } from "@/components/ui/PublicPage";
import { ShieldCheck, X, Check, GraduationCap } from "lucide-react";
import { PublicNav } from "@/components/ui/PublicNav";
import { Button } from "@/components/ui/Button";
import { PublicFooter } from "@/components/ui/PublicFooter";
import { ScrollProgress } from "@/components/ui/ScrollProgress";
import { BackToTop } from "@/components/ui/BackToTop";
import { MobileStickyBar } from "@/components/ui/MobileStickyBar";
import { SmoothScroll } from "@/components/ui/SmoothScroll";

/* ══════════════════════════════════════════════════════════════════════════
   INTERFACE PREVIEW
   A single, honest depiction of the product — no fake browser chrome and no
   invented faculty. Every row describes an interface element, not a person:
   naming a real university next to a made-up professor is a credibility
   problem, and an invented name is worse than a labelled gap.
   ══════════════════════════════════════════════════════════════════════════ */
const PREVIEW_RESULTS = [
  { field: "Computational neuroscience", meta: "Reviewed profile · 3 listed publications", tags: ["Memory", "fMRI"] },
  { field: "Neural circuits", meta: "Reviewed profile · 5 listed publications", tags: ["Circuits", "Optogenetics"] },
  { field: "Brain–computer interfaces", meta: "Reviewed profile · 2 listed publications", tags: ["BCI", "Signal processing"] },
];

/* The three fields the request form actually asks for. The panel below used to
   show a "paper breakdown" with an invented finding in it — a feature this app
   does not have. What it does have is a structured request, so that is what the
   preview shows. */
const REQUEST_FIELDS = [
  { label: "Topic", detail: "The area you want guidance on" },
  { label: "Background", detail: "Coursework, skills, current work" },
  { label: "Goals", detail: "What you want out of the reply" },
];

function AppPreview() {
  return (
    <figure className="m-0">
      <div className="overflow-hidden rounded-surface border border-line bg-surface shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        {/* Search bar */}
        <div className="flex flex-col gap-3 border-b border-line px-5 py-4 sm:flex-row sm:items-center">
          <div className="flex h-10 min-w-0 flex-1 items-center gap-2.5 rounded-control border border-line bg-paper px-4">
            <span className="truncate text-[0.8rem] text-ink-soft">sleep and memory</span>
            <span className="ml-auto h-4 w-px shrink-0 animate-pulse bg-line-strong" aria-hidden="true" />
          </div>
          {/* These two wrap rather than push each other out of the card, which is
              what they did below the `sm` breakpoint. */}
          <div className="flex flex-wrap gap-2">
            <span className="pill rounded-control border border-accent/30 bg-accent/8 px-3.5 py-2 text-[0.72rem] font-semibold text-accent">
              Neuroscience
            </span>
            <span className="pill rounded-control border border-line px-3.5 py-2 text-[0.72rem] font-medium text-ink-soft">
              Accepting students
            </span>
          </div>
        </div>

        {/* Results */}
        <ul className="divide-y divide-line">
          {PREVIEW_RESULTS.map((result) => (
            <li key={result.field} className="flex flex-col gap-2.5 px-5 py-4 sm:flex-row sm:items-center sm:gap-4">
              {/* An icon, not the word "Faculty": at 0.6rem with letter-spacing
                  the label was wider than the 36px box holding it. */}
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-accent/8 text-accent"
                aria-hidden="true"
              >
                <GraduationCap size={16} strokeWidth={2} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-[0.95rem] font-semibold text-ink">{result.field}</span>
                <span className="block text-[0.75rem] text-ink-mute">{result.meta}</span>
              </span>
              <span className="flex flex-wrap gap-1.5">
                {result.tags.map((tag) => (
                  <span
                    key={tag}
                    className="pill rounded-control bg-paper px-2 py-1 text-[0.62rem] font-medium text-ink-soft ring-1 ring-line"
                  >
                    {tag}
                  </span>
                ))}
              </span>
            </li>
          ))}
        </ul>

        {/* What a request is made of */}
        <div className="border-t border-line bg-paper px-5 py-5">
          <p className="mb-3 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-accent">
            What a request asks for
          </p>
          <dl className="m-0 grid gap-3 sm:grid-cols-3">
            {REQUEST_FIELDS.map((field) => (
              <div key={field.label}>
                <dt className="text-[0.78rem] font-semibold text-ink">{field.label}</dt>
                <dd className="m-0 text-[0.72rem] leading-snug text-ink-mute">{field.detail}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <figcaption className="mt-3 text-[0.72rem] text-ink-mute">
        Illustrative preview of the directory and the request form.
      </figcaption>
    </figure>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   LANDING PAGE
   ══════════════════════════════════════════════════════════════════════════ */
const PROBLEM_REASONS = [
  {
    title: "Generic from the first line.",
    body: "Soft flattery and a résumé dump read as one of a mass send, so the reply never comes.",
  },
  {
    title: "Papers named, not read.",
    body: "Citing a title without engaging with the method is worse than citing nothing at all.",
  },
  {
    title: "A directory that was already stale.",
    body: "Faculty change direction between papers. A department page last updated years ago will not show that.",
  },
];

const COMPARISON_ROWS = [
  {
    bad: "Will draft a citation, or an email address, that does not exist.",
    good: "Every faculty profile is reviewed by an admin before it appears.",
  },
  {
    bad: "Produces a template, and the template reads like one.",
    good: "A request form with three questions: what you want, what you have done, what you are after.",
  },
  {
    bad: "Leaves you stitching together search engines, department pages and a chatbot.",
    good: "One directory, one thread per professor, and nothing invented in either.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Search by subfield, not by school",
    body: "Look up the topic — memory consolidation, computational linguistics — and see who lists it.",
  },
  {
    n: "02",
    title: "Read the profile, not the ranking",
    body: "Each professor's page carries their own bio, the publications they list, and what kinds of students they take.",
  },
  {
    n: "03",
    title: "Send a request, not a template",
    body: "Three fields: what you want guidance on, what you have already done, and what you are hoping to get back.",
  },
];

export default function LandingPage() {
  return (
    <div className="relative bg-paper font-sans text-ink">
      <SmoothScroll />
      <ScrollProgress />
      <PublicNav />

      {/* ══ HERO ══════════════════════════════════════════════════════════
          Left-aligned and set on the page rather than floated in the middle
          of an empty viewport. The italic accent is the page's one signature
          typographic move; every other heading on the site is set plainly. */}
      <section className="border-b border-line px-6 pt-36 pb-20 md:pt-44 md:pb-24">
        <div className="mx-auto grid w-full max-w-5xl gap-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:items-center lg:gap-16">
          <div>
            <Eyebrow>For high-school students writing to faculty</Eyebrow>
            <h1 className="max-w-[40rem] font-display text-[clamp(2.4rem,5.2vw,3.8rem)] font-black leading-[1.06] tracking-[-0.035em] text-ink text-pretty">
              Find professors doing research{" "}
              <em className="font-light italic text-accent">you actually care about.</em>
            </h1>
            <p className="mt-6 max-w-xl text-[1.05rem] leading-relaxed text-ink-soft text-pretty">
              Search a reviewed faculty directory, read what each professor publishes, and send a
              request that says what you want and what you have already done.
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
          A list on hairlines, not three bordered cards holding one sentence
          each. The heading carries the claim; the list carries the reasons. */}
      <PageSection rule={false}>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] lg:gap-16">
          <SectionHeading>Most student outreach is deleted before the first line is finished.</SectionHeading>
          <RowList items={PROBLEM_REASONS} columns={1} className="mt-0" />
        </div>
      </PageSection>

      {/* ══ VERIFICATION — the page's one full-bleed moment ═══════════════
          This replaces a testimonials block. Invented quotes attributed to
          named people at real universities are a credibility risk, and there
          is a true, checkable claim to make instead. */}
      <AccentBand
        icon={<ShieldCheck size={30} strokeWidth={1.75} aria-hidden="true" />}
        title="Every faculty profile is reviewed by a person."
        body="Professors apply with an institutional address, and an admin checks it before the profile appears in the directory. Accounts that cannot be matched stay out, and students can only message faculty inside it."
      />

      {/* ══ COMPARISON ════════════════════════════════════════════════════ */}
      <PageSection>
        <SectionHeading>Why not just use a chatbot?</SectionHeading>

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
            <div key={row.bad} className="grid border-b border-line last:border-b-0 md:grid-cols-2">
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
      </PageSection>

      {/* ══ STEPS ═════════════════════════════════════════════════════════ */}
      <PageSection>
        <SectionHeading>How it works</SectionHeading>
        <p className="mt-3 max-w-md text-[0.95rem] leading-relaxed text-ink-soft text-pretty">
          Three steps, and the writing is still yours.
        </p>
        <RowList items={STEPS} columns={3} accent className="mt-12" />
      </PageSection>

      {/* ══ CLOSING ═══════════════════════════════════════════════════════ */}
      <PageSection>
        <div className="flex flex-col items-start gap-8 md:flex-row md:items-end md:justify-between">
          <SectionHeading className="md:max-w-xl">
            Send the email that shows you did the reading.
          </SectionHeading>
          <div className="shrink-0">
            <Button href="/signup" variant="primary" size="lg">
              Get Started
            </Button>
            <p className="mt-3 text-[0.8rem] text-ink-mute">Free for students. No card.</p>
          </div>
        </div>
      </PageSection>

      <PublicFooter />

      <BackToTop />
      <MobileStickyBar />
    </div>
  );
}
