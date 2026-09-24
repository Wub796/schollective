"use client";

import React from "react";
import { AccentBand, PageHero, PageSection, RowList, SectionHeading } from "@/components/ui/PublicPage";
import { ScrollProgress } from "@/components/ui/ScrollProgress";
import { PublicNav } from "@/components/ui/PublicNav";
import { PublicFooter } from "@/components/ui/PublicFooter";
import { Button } from "@/components/ui/Button";
import { ShieldCheck } from "lucide-react";

const BENEFITS = [
  {
    n: "01",
    title: "The background is already there",
    body: "Every request carries the student's topic, coursework, projects and goal, so you can tell what they have done without a follow-up email.",
  },
  {
    n: "02",
    title: "No obligation to answer",
    body: "Declining is one click, and a thread you are finished with can be closed. Nothing has to be left hanging.",
  },
  {
    n: "03",
    title: "Out of your university inbox",
    body: "Requests and replies live in the dashboard, not in the mail you are already behind on.",
  },
  {
    n: "04",
    title: "A daily cap on requests",
    body: "A student can send a handful of requests a day, which is what stops the same message arriving from forty accounts.",
  },
];

const AFTER_SIGNUP = [
  {
    n: "1",
    title: "Register",
    body: "Sign up as faculty with an institutional address, then enter your research areas and the publications you want listed.",
  },
  {
    n: "2",
    title: "Review",
    body: "An admin confirms the affiliation. A profile that cannot be matched to an institution stays out of the directory.",
  },
  {
    n: "3",
    title: "Requests",
    body: "An approved profile takes requests in the dashboard, each with the student's background attached and no obligation to accept.",
  },
];

const FIELDS = [
  "Biology & Life Sciences", "Computer Science & AI", "Mathematics", "Physics & Astrophysics",
  "Psychology & Cognitive Science", "Economics & Finance", "History & Humanities", "Environmental Science",
  "Engineering", "Political Science", "Chemistry", "Sociology & Anthropology",
];

const FAQ = [
  {
    title: "How much time does this take?",
    body: "Only what you choose. A request is one thread with one student, and you can decline it or close it whenever you like.",
  },
  {
    title: "Does this commit me to hosting a student in my group?",
    body: "No. The platform is for discrete academic questions. If a student impresses you and you happen to have a place going, that conversation is yours to start, and there is no expectation to take on an advisee.",
  },
  {
    title: "Can I close a thread?",
    body: "Yes. You can archive an inquiry, or close an active thread once the question has been addressed.",
  },
  {
    title: "Is there any cost?",
    body: "No. Schollective is free for faculty and for students.",
  },
];

export default function ForProfessorsPage() {
  return (
    <div className="bg-paper font-sans text-ink min-h-screen">
      <ScrollProgress />
      <PublicNav />

      <PageHero
        eyebrow="For faculty"
        title={
          <>
            Fewer generic emails,{" "}
            {/* Ink for the statement, accent italic for the half that carries
                the point. */}
            <br className="hidden md:inline" />
            <em className="font-light italic text-accent">from students who read your work first.</em>
          </>
        }
        lede="Requests arrive with the student's topic, coursework, projects and goal attached, in one thread you can answer, decline or close. None of it lands in your university inbox."
      >
        <Button href="/signup?role=professor" variant="primary" size="lg">
          Join as Faculty
        </Button>
        <a href="#verification" className="link-underline text-sm font-semibold text-ink-soft hover:text-accent">
          How verification works
        </a>
      </PageHero>

      <PageSection>
        <SectionHeading>Why faculty use this instead of an open inbox</SectionHeading>
        <RowList items={BENEFITS} columns={2} className="mt-10" />
      </PageSection>

      <PageSection>
        <SectionHeading>The areas students ask from</SectionHeading>
        <p className="mt-3 max-w-lg text-[0.95rem] leading-relaxed text-ink-soft text-pretty">
          These are the research areas students enter on their profiles. A request names one of them, rather than a whole department.
        </p>
        <div className="mt-10 flex flex-wrap gap-2.5">
          {FIELDS.map((field) => (
            <span
              key={field}
              className="pill rounded-full border border-line bg-surface px-4 py-2 text-[0.82rem] font-medium text-ink-soft"
            >
              {field}
            </span>
          ))}
        </div>
      </PageSection>

      <div id="verification">
        <AccentBand
          icon={<ShieldCheck size={28} strokeWidth={1.75} aria-hidden="true" />}
          title="An admin confirms your affiliation before students see you."
          body="Faculty registration requires an institutional address. There is no automated approval, and no promised turnaround to miss."
        />
      </div>

      <PageSection>
        <SectionHeading>What happens after you sign up</SectionHeading>
        <RowList items={AFTER_SIGNUP} columns={3} className="mt-10" />
      </PageSection>

      <PageSection>
        <SectionHeading>What faculty need to know</SectionHeading>
        <RowList items={FAQ} columns={1} className="mt-10" />
      </PageSection>

      <PageSection>
        <div className="flex flex-col items-start gap-8 md:flex-row md:items-end md:justify-between">
          <SectionHeading className="md:max-w-xl">
            Answer the students who read your work first.
          </SectionHeading>
          <div className="shrink-0">
            <Button href="/signup?role=professor" variant="primary" size="lg">
              Join as Faculty
            </Button>
            <p className="mt-3 text-[0.8rem] text-ink-mute">Free for faculty, and free for students.</p>
          </div>
        </div>
      </PageSection>

      <PublicFooter />
    </div>
  );
}
