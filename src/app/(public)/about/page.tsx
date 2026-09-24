"use client";

import React from "react";
import Image from "next/image";
import { PageHero, PageSection, RowList, SectionHeading } from "@/components/ui/PublicPage";
import { ScrollProgress } from "@/components/ui/ScrollProgress";
import { PublicNav } from "@/components/ui/PublicNav";
import { PublicFooter } from "@/components/ui/PublicFooter";
import { Button } from "@/components/ui/Button";

const PROBLEM = [
  {
    title: "For students",
    body: "Finding a professor who takes high-schoolers means weeks in faculty directories last updated years ago, and most emails go unanswered because they never say what the student has actually done.",
  },
  {
    title: "For professors",
    body: "Labs get copy-pasted emails every week, and reading each one to work out whether a student has relevant skills is not a good use of an afternoon.",
  },
];

const VALUES = [
  {
    n: "01",
    title: "Free for students",
    body: "No subscription, no paywall, no paid tier. Nothing behind a card.",
  },
  {
    n: "02",
    title: "Reviewed by a person",
    body: "An admin checks each faculty application before the profile appears in the directory.",
  },
  {
    n: "03",
    title: "Specific requests only",
    body: "A request has to say what you have done and what you want. That is the difference between a question and a broadcast.",
  },
];

const TEAM = [
  { initials: "AR", name: "Aiden Raj", desc: "Product and faculty outreach.", image: "/team/aiden.jpg" },
  { initials: "AS", name: "Ayaan Siddiqui", desc: "Student community and school partnerships.", image: "/team/ayaan.jpg" },
  { initials: "BW", name: "Benjamin Wu", desc: "Frontend and onboarding flows.", image: "/team/ben.jpg" },
  { initials: "JH", name: "Joseph Hu", desc: "Application architecture, AI review services, data.", image: "/team/joseph.jpg" },
  { initials: "MT", name: "Michelle Truong", desc: "Research resources and academic workshops.", image: "/team/michelle.jpg" },
];

export default function AboutPage() {
  return (
    <div className="bg-paper font-sans text-ink min-h-screen">
      <ScrollProgress />
      <PublicNav />

      <PageHero
        eyebrow="About"
        title={
          <>
            Research shouldn&apos;t depend on{" "}
            {/* The accent italic clause is the site's one typographic move: ink
                for the statement, accent for the part that carries the point.
                The break is md-only so the clause does not wrap into rags on a
                phone. */}
            <br className="hidden md:inline" />
            <em className="font-light italic text-accent">who you know.</em>
          </>
        }
        lede="Most students have no family tie to a lab and no research programme at their school. Schollective is for anyone willing to read a paper first: find the people who wrote it, see what else they publish, and ask them something specific."
      >
        <Button href="/signup" variant="primary" size="lg">
          Get Started
        </Button>
        <Button href="/features" variant="ghost" size="lg">
          See what it does
        </Button>
      </PageHero>

      <PageSection>
        <SectionHeading>Why cold emailing is broken for both sides</SectionHeading>
        <RowList items={PROBLEM} columns={2} className="mt-10" />
      </PageSection>

      <PageSection>
        <SectionHeading>How we run Schollective</SectionHeading>
        <RowList items={VALUES} columns={3} className="mt-10" />
      </PageSection>

      <PageSection>
        <SectionHeading>Built by students who lived the problem</SectionHeading>
        <p className="mt-3 max-w-lg text-[0.95rem] leading-relaxed text-ink-soft text-pretty">
          Five people, all of whom have written an email to a professor and waited.
        </p>

        <ul className="m-0 mt-10 grid list-none gap-x-10 gap-y-8 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {TEAM.map((member) => (
            <li key={member.name} className="flex items-start gap-4 border-t border-line pt-5">
              <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-line bg-accent/8">
                {member.image ? (
                  <Image src={member.image} alt={member.name} width={44} height={44} className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center bg-accent font-display text-[0.8rem] font-black text-white">
                    {member.initials}
                  </span>
                )}
              </span>
              <span className="min-w-0">
                <span className="block font-display text-[1.02rem] font-semibold tracking-[-0.01em] text-ink">
                  {member.name}
                </span>
                <span className="mt-1 block text-[0.86rem] leading-relaxed text-ink-soft">{member.desc}</span>
              </span>
            </li>
          ))}
        </ul>
      </PageSection>

      <PageSection>
        <div className="flex flex-col items-start gap-8 md:flex-row md:items-end md:justify-between">
          <SectionHeading className="md:max-w-xl">
            Read a paper. Write to the person who wrote it.
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
    </div>
  );
}
