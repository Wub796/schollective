"use client";

import React from "react";
import { AccentBand, PageHero, PageSection, RowList, SectionHeading } from "@/components/ui/PublicPage";
import { Button } from "@/components/ui/Button";
import { PublicNav } from "@/components/ui/PublicNav";
import { PublicFooter } from "@/components/ui/PublicFooter";
import { ScrollProgress } from "@/components/ui/ScrollProgress";
import {
  Lock,
  MessageSquare,
  ShieldCheck,
  Users,
  Bell,
  BarChart3,
} from "lucide-react";

/* Every entry here is something the code does. The version before this one
   described "Postgres Change Data Capture" (there is none), "role-based
   metadata encrypted within sessions" (a session is a signed row, not a
   ciphertext), and a "global mentor network". A features page that lists
   features the product does not have is the most expensive kind of copy. */
const FEATURES = [
  {
    icon: <Lock size={20} strokeWidth={2} aria-hidden="true" />,
    title: "Roles are set at signup",
    body: "Student and professor accounts are separate from the first screen, and only an admin can change a role afterwards.",
  },
  {
    icon: <MessageSquare size={20} strokeWidth={2} aria-hidden="true" />,
    title: "A request, not a blank email",
    body: "Every request carries three fields — topic, academic background, and goals — so a professor sees the context before deciding.",
  },
  {
    icon: <ShieldCheck size={20} strokeWidth={2} aria-hidden="true" />,
    title: "A person reviews every professor",
    body: "An admin checks each professor application before the profile joins the directory. Nothing appears there unreviewed.",
  },
  {
    icon: <Users size={20} strokeWidth={2} aria-hidden="true" />,
    title: "Group requests",
    body: "Work on one request with classmates. Everyone is on the same thread, and the professor can see that it is a group.",
  },
  {
    icon: <Bell size={20} strokeWidth={2} aria-hidden="true" />,
    title: "One thread per request",
    body: "Messages, replies and unread markers live in the request's own thread, so a conversation cannot drift into an inbox.",
  },
  {
    icon: <BarChart3 size={20} strokeWidth={2} aria-hidden="true" />,
    title: "States, not silence",
    body: "A request moves through named states — open, active, declined, past — so you can tell waiting from decided.",
  },
];

const ACCESS_RULES = [
  {
    title: "Gated before it renders",
    body: "Signed-in pages are turned away at the edge when there is no session, and server actions re-check the caller rather than trusting the page that called them.",
  },
  {
    title: "Roles come from the database",
    body: "Your role is read from your own profile row on the server. Nothing the browser sends can promote an account.",
  },
];

export default function FeaturesPage() {
  return (
    <div className="bg-paper font-sans text-ink min-h-screen">
      <ScrollProgress />
      <PublicNav />

      <PageHero
        eyebrow="What it does"
        title="The directory, the request, and the thread between them"
        lede="Six parts of the product, described without adjectives."
      >
        <Button href="/signup" variant="primary" size="lg">
          Get Started
        </Button>
        <Button href="/about" variant="ghost" size="lg">
          Why we built it
        </Button>
      </PageHero>

      <PageSection>
        <SectionHeading>Six decisions the product makes</SectionHeading>
        <RowList items={FEATURES} columns={3} className="mt-10" />
      </PageSection>

      <AccentBand
        icon={<Lock size={28} strokeWidth={1.75} aria-hidden="true" />}
        title="Who can read a thread"
        body="Row-level security is on for the tables that hold your data, so a request is readable by the student who sent it, the faculty member it was sent to, and the participants they invited. Not by anyone else, and not by us in a browser console."
      />

      <PageSection>
        <SectionHeading>How that is enforced</SectionHeading>
        <RowList items={ACCESS_RULES} columns={2} className="mt-10" />
      </PageSection>

      <PageSection>
        <div className="flex flex-col items-start gap-8 md:flex-row md:items-end md:justify-between">
          <SectionHeading className="md:max-w-xl">Start with one professor.</SectionHeading>
          <div className="shrink-0">
            <Button href="/signup" variant="primary" size="lg">
              Get Started
            </Button>
            <p className="mt-3 text-[0.8rem] text-ink-mute">Free for students and faculty.</p>
          </div>
        </div>
      </PageSection>

      <PublicFooter />
    </div>
  );
}
