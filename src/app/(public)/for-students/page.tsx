"use client";

import React from "react";
import { AccentBand, PageHero, PageSection, RowList, SectionHeading } from "@/components/ui/PublicPage";
import { ScrollProgress } from "@/components/ui/ScrollProgress";
import { PublicNav } from "@/components/ui/PublicNav";
import { PublicFooter } from "@/components/ui/PublicFooter";
import { Button } from "@/components/ui/Button";
import { FileText, Microscope, BookOpen, Users, ShieldCheck } from "lucide-react";

const STEPS = [
  {
    n: "01",
    title: "Fill in your profile once",
    body: "Coursework, projects, skills, and the areas you care about. That background is what goes out with every request you send.",
  },
  {
    n: "02",
    title: "Search by research area",
    body: "Filter the directory by subfield, or let the recommender rank faculty against the interests on your profile.",
  },
  {
    n: "03",
    title: "Read the profile before you write",
    body: "Each faculty page lists the publications its owner entered and the areas they work in, so you can tell what the group is doing now.",
  },
  {
    n: "04",
    title: "Send one request, not an essay",
    body: "Three fields — topic, background, goals — open a single thread with that professor. No template writes it for you.",
  },
];

const QUESTIONS = [
  {
    icon: <Microscope size={20} strokeWidth={2} aria-hidden="true" />,
    title: "A method you are trying to use",
    body: "Ask the author about a dataset, a protocol, or a limitation they mention in a paper.",
  },
  {
    icon: <Users size={20} strokeWidth={2} aria-hidden="true" />,
    title: "Whether they take students",
    body: "Ask whether a group takes high-school or early-undergraduate students, and what they would need from you.",
  },
  {
    icon: <FileText size={20} strokeWidth={2} aria-hidden="true" />,
    title: "Whether your approach holds up",
    body: "Get input on your method before you spend a term running something that will not answer your question.",
  },
  {
    icon: <BookOpen size={20} strokeWidth={2} aria-hidden="true" />,
    title: "Which subfield is yours",
    body: "Find the areas inside a broad major — and the people in them — before you have to pick one.",
  },
];

export default function ForStudentsPage() {
  return (
    <div className="bg-paper font-sans text-ink min-h-screen">
      <ScrollProgress />
      <PublicNav />

      <PageHero
        eyebrow="For high-school students"
        title={
          <>
            Reach out to the people{" "}
            {/* Ink for the statement, accent italic for the half that carries
                the point. The break is md-only: on a phone the clause flows
                instead of wrapping into rags. */}
            <br className="hidden md:inline" />
            <em className="font-light italic text-accent">behind the research you read.</em>
          </>
        }
        lede="Find researchers who list your area, read what they publish, and send a request short enough to answer."
      >
        <Button href="/signup" variant="primary" size="lg">
          Get Started
        </Button>
        <a href="#questions" className="link-underline text-sm font-semibold text-ink-soft hover:text-accent">
          See what students ask about
        </a>
      </PageHero>

      <PageSection>
        <SectionHeading>From your profile to a reply</SectionHeading>
        <p className="mt-3 max-w-md text-[0.95rem] leading-relaxed text-ink-soft text-pretty">
          Four things, in order. The writing stays yours.
        </p>
        <RowList items={STEPS} columns={2} className="mt-10" />
      </PageSection>

      <PageSection id="questions">
        <SectionHeading>What students ask about</SectionHeading>
        <p className="mt-3 max-w-lg text-[0.95rem] leading-relaxed text-ink-soft text-pretty">
          A request works when it asks something the person you are writing to can answer. These are the asks that do.
        </p>
        <RowList items={QUESTIONS} columns={2} className="mt-10" />
      </PageSection>

      <AccentBand
        icon={<ShieldCheck size={28} strokeWidth={1.75} aria-hidden="true" />}
        title="Every profile you read was reviewed by a person."
        body="Professors apply with an institutional address and an admin checks it before the profile joins the directory. Accounts that cannot be matched stay out, and students can only message faculty inside it."
      />

      <PageSection>
        <div className="flex flex-col items-start gap-8 md:flex-row md:items-end md:justify-between">
          <SectionHeading className="md:max-w-xl">
            Ask one question well, and the next one gets easier.
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
