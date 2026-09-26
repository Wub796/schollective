"use client";

import React from "react";
import { PageHero, PageSection, RowList, SectionHeading } from "@/components/ui/PublicPage";
import { LayeredText } from "@/components/ui/LayeredText";
import { ImageSphere, type SphereImage } from "@/components/ui/ImageSphere";
import { ScrollProgress } from "@/components/ui/ScrollProgress";
import { PublicNav } from "@/components/ui/PublicNav";
import { PublicFooter } from "@/components/ui/PublicFooter";
import { Button } from "@/components/ui/Button";

/**
 * The ribbon in the hero's right column: the title's other half. The title says
 * research should not depend on who you know; this is what it should depend on
 * instead. The bands chain — each line's second word is the next line's first —
 * so hovering slides one list a notch rather than flipping seven words in place.
 */
const WHAT_IT_RUNS_ON = [
  { top: "\u00A0", bottom: "CURIOSITY" },
  { top: "CURIOSITY", bottom: "MERIT" },
  { top: "MERIT", bottom: "READING" },
  { top: "READING", bottom: "CRAFT" },
  { top: "CRAFT", bottom: "EVIDENCE" },
  { top: "EVIDENCE", bottom: "ACCESS" },
  { top: "ACCESS", bottom: "\u00A0" },
];

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
  { name: "Aiden Raj", role: "Product and faculty outreach.", image: "/team/aiden.jpg" },
  { name: "Ayaan Siddiqui", role: "Student community and school partnerships.", image: "/team/ayaan.jpg" },
  { name: "Benjamin Wu", role: "Frontend and onboarding flows.", image: "/team/ben.jpg" },
  { name: "Joseph Hu", role: "Application architecture, AI review services, data.", image: "/team/joseph.jpg" },
  { name: "Michelle Truong", role: "Research resources and academic workshops.", image: "/team/michelle.jpg" },
];

/** The team, in the shape the sphere wants: one face per person, with the name
 *  and role carried on the image so the caption and the dialog can use them. */
const TEAM_FACES: SphereImage[] = TEAM.map((member) => ({
  id: member.name,
  src: member.image,
  alt: member.name,
  title: member.name,
  description: member.role,
}));

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
        aside={<LayeredText lines={WHAT_IT_RUNS_ON} />}
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
        {/* The same two columns as the hero above: the copy in the title's own
            40rem, the faces in what is left of the 1024px container. */}
        <div className="lg:grid lg:grid-cols-[minmax(0,40rem)_minmax(0,1fr)] lg:items-center lg:gap-16">
          <div>
            {/* Capped at the page title's own 40rem so the two read as the same
                column, which at `lg` is what the grid column already is. */}
            <SectionHeading className="max-w-[40rem]">Built by students who lived the problem</SectionHeading>
            <p className="mt-3 max-w-lg text-[0.95rem] leading-relaxed text-ink-soft text-pretty">
              Five people, all of whom have written an email to a professor and waited.
            </p>
          </div>

          <div className="mt-12 lg:mt-0">
            <ImageSphere images={TEAM_FACES} />
          </div>
        </div>
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
