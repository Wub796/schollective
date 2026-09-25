import type { Metadata } from "next";
import Link from "next/link";
import {
  AccentBand,
  PageHero,
  PageSection,
  RowList,
  SectionHeading,
} from "@/components/ui/PublicPage";
import { ScrollProgress } from "@/components/ui/ScrollProgress";
import { PublicNav } from "@/components/ui/PublicNav";
import { PublicFooter } from "@/components/ui/PublicFooter";
import { Button } from "@/components/ui/Button";
import { ShieldAlert } from "lucide-react";
import {
  ADULT_AGE,
  MINIMUM_AGE,
  SAFETY_REPORT_EMAIL,
  YOUTH_SAFETY_SECTIONS,
} from "@/lib/youth-protection";

/**
 * The published Youth Protection Policy.
 *
 * Built from the shared public-page primitives (`PageHero`, `PageSection`,
 * `RowList`, `AccentBand`) rather than from the bordered card per section that
 * /terms and /privacy still use. Those two pages are the last ones on the old
 * treatment; src/components/ui/PublicPage.tsx exists because a page of repeated
 * bordered, shadowed boxes reads as a form rather than a page, and a numbered
 * policy is exactly what a hairline list is for.
 *
 * Still a server component, so it keeps its own `metadata` — the pages built on
 * this toolkit are client components and have to declare theirs in a sibling
 * layout.
 *
 * The prose is not here. It is read from src/lib/youth-protection.ts, so the
 * rules a mentor agrees to and the rules the send action enforces are the same
 * strings, and a test fails if this page grows its own copy.
 */
export const metadata: Metadata = {
  title: "Youth Protection Policy",
  description:
    "How Schollective protects students in one-to-one mentorships: on-platform contact, prohibited conduct, guardian consent, and how to report a concern.",
  openGraph: {
    title: "Youth Protection Policy | Schollective",
    description:
      "How Schollective protects students in one-to-one mentorships, and how to report a concern.",
  },
  twitter: {
    title: "Youth Protection Policy | Schollective",
    description:
      "How Schollective protects students in one-to-one mentorships, and how to report a concern.",
  },
};

export default function SafetyPage() {
  return (
    <div className="min-h-screen bg-paper font-sans text-ink">
      <ScrollProgress />
      <PublicNav />

      <PageHero
        eyebrow="Youth protection"
        title={
          <>
            One mentor, one student, and rules that assume the student is{" "}
            <em className="font-light italic text-accent">someone&apos;s child.</em>
          </>
        }
        lede="Most conversations here are one professor and one student, and many of those students are in high school. This is what keeps a thread safe, what a mentor may not do, and what to do when something feels wrong."
      >
        <Button href={`mailto:${SAFETY_REPORT_EMAIL}`} variant="primary" size="lg">
          Report a concern
        </Button>
        <a href="#rules" className="link-underline text-sm font-semibold text-ink-soft hover:text-accent">
          Read the rules
        </a>
      </PageHero>

      <PageSection id="rules">
        <SectionHeading>What every thread is held to</SectionHeading>
        <p className="mt-3 max-w-lg text-[0.95rem] leading-relaxed text-ink-soft text-pretty">
          Seven rules, in the order they matter. They apply to a professor and to a student
          alike, and the platform refuses a message that breaks them before it is sent.
        </p>
        <RowList
          items={YOUTH_SAFETY_SECTIONS.map(({ n, title, body }) => ({ n, title, body }))}
          columns={1}
          className="mt-10"
        />
      </PageSection>

      <AccentBand
        icon={<ShieldAlert size={28} strokeWidth={1.75} aria-hidden="true" />}
        title="A person reads every report, and the messages are kept so they still exist by then."
        body={`Report from inside the thread — the button is on every mentorship thread — or email ${SAFETY_REPORT_EMAIL}. A report made from a thread copies that thread's messages into the report, so deleting an account afterwards does not remove what was said. If someone is in immediate danger, contact local emergency services first.`}
      />

      <PageSection>
        <SectionHeading>Who this covers, and where the rest of it lives</SectionHeading>
        <p className="mt-3 max-w-2xl text-[0.95rem] leading-relaxed text-ink-soft text-pretty">
          Every student gives a date of birth when they set their account up. It is stored where
          only the student and an administrator can read it, it is never shown on a profile, and
          what it decides is which of the rules above apply. Students under {MINIMUM_AGE} may not
          use Schollective at all; students from {MINIMUM_AGE} to {ADULT_AGE - 1} may use it only
          with a parent or guardian&apos;s consent, which is recorded when the account is set up.
          A student who has given no date of birth is treated as a minor if their education level
          says high school, so the fallback is always the cautious one.
        </p>
        <p className="mt-5 max-w-2xl text-[0.95rem] leading-relaxed text-ink-soft text-pretty">
          This policy is part of the{" "}
          <Link href="/terms" className="link-underline font-semibold text-accent">
            Terms of Service
          </Link>
          . How we handle the data these rules depend on — including how a parent or guardian asks
          what is held about their child — is in the{" "}
          <Link href="/privacy" className="link-underline font-semibold text-accent">
            Privacy Policy
          </Link>
          .
        </p>
      </PageSection>

      <PublicFooter />
    </div>
  );
}
