"use client";

import React from "react";
import Link from "next/link";
import { PublicNav } from "@/components/ui/PublicNav";
import { PublicFooter } from "@/components/ui/PublicFooter";

export default function TermsPage() {
  const sections = [
    {
      title: "1. Acceptance of Terms",
      body: "By creating an account or using the Schollective platform, you agree to be bound by these Terms of Service. If you do not agree, please do not use the platform.",
    },
    {
      title: "2. Eligibility",
      body: "You must be at least 13 years old to use Schollective as a student. Professors must be currently employed or affiliated with a recognized academic institution and must provide accurate credential information during registration.",
    },
    {
      title: "3. Academic Integrity",
      body: "Schollective is a platform for genuine academic mentorship. Users may not misrepresent their credentials, impersonate others, or use the platform for commercial solicitation, plagiarism assistance, or any activity that violates institutional academic integrity policies.",
    },
    {
      title: "4. User Content",
      body: "Messages and content you send through Schollective remain your property. By submitting content, you grant Schollective a limited, non-exclusive license to store and display that content solely for the purpose of providing the service. We do not sell your messages to third parties.",
    },
    {
      title: "5. Professor Verification",
      body: "Schollective uses an algorithmic scoring system to assess professor applications. Approval is at the sole discretion of Schollective administrators. Verified status may be revoked if a professor is found to have provided false information.",
    },
    {
      title: "6. Prohibited Conduct",
      body: "You may not use Schollective to: harass, threaten, or abuse other users; share spam, malware, or phishing links; post content that is illegal, defamatory, or sexually explicit; or attempt to reverse-engineer or compromise platform security.",
    },
    {
      title: "7. Termination",
      body: "Schollective reserves the right to suspend or permanently remove any account that violates these Terms, without prior notice. You may delete your account at any time via the Account Settings page.",
    },
    {
      title: "8. Limitation of Liability",
      body: "Schollective is provided \"as is\" without warranties of any kind. We are not liable for the accuracy of professor credentials, the quality of mentorship sessions, or any indirect, incidental, or consequential damages arising from platform use.",
    },
    {
      title: "9. Changes to These Terms",
      body: "We may update these Terms at any time. Continued use of the platform after changes constitutes acceptance of the new Terms. Material changes will be announced via platform notifications.",
    },
    {
      title: "10. Contact",
      body: "Questions about these Terms? Reach us at legal@schollective.com.",
    },
  ];

  return (
    <div className="min-h-screen bg-transparent text-slate-900 dark:text-slate-100">
      <PublicNav />

      <div className="max-w-4xl mx-auto px-6 py-32 flex flex-col gap-12">
        {/* Eyebrow */}
        <div className="flex items-center gap-3">
          <span className="w-6 h-[2px] bg-indigo-500 block" />
          <span className="text-[0.62rem] font-extrabold tracking-[0.22em] uppercase text-indigo-600 dark:text-indigo-400 font-sans">Legal</span>
        </div>

        <div>
          <h1 className="font-display text-[clamp(2.4rem,5vw,3.8rem)] font-black tracking-[-0.04em] leading-[1.05] text-slate-900 dark:text-slate-100 mb-3">
            Terms of <em className="italic font-light text-indigo-600 dark:text-indigo-400">Service</em>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-sans">
            Last updated: May 2025
          </p>
        </div>

        <div className="h-px bg-slate-200/80 dark:bg-slate-800 my-2" />

        <div className="flex flex-col gap-8">
          {sections.map(({ title, body }) => (
            <div key={title} className="p-8 md:p-9 border border-slate-200/70 dark:border-slate-800 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-xs">
              <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100 tracking-[-0.015em] mb-3">{title}</h2>
              <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed font-sans">{body}</p>
            </div>
          ))}
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}
