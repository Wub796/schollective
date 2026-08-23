"use client";

import React from "react";
import Link from "next/link";
import { PublicNav } from "@/components/ui/PublicNav";
import { PublicFooter } from "@/components/ui/PublicFooter";

export default function PrivacyPage() {
  const sections = [
    {
      title: "1. What We Collect",
      body: "We collect: (a) account information you provide at signup (name, email, institution, role); (b) profile content you choose to add; (c) messages exchanged through the platform; (d) usage metadata such as login timestamps and page views. We do not collect payment data.",
    },
    {
      title: "2. How We Use Your Data",
      body: "Your data is used to: operate and improve the Schollective service; verify professor credentials against our academic database; send system notifications about your requests and threads; and enforce our Terms of Service. We do not use your data for advertising.",
    },
    {
      title: "3. Data Sharing",
      body: "We do not sell your personal data. Your profile information (name, institution, expertise) is visible to other authenticated users. Messages are private between participants. We share data with Supabase (our database provider) under a data processing agreement, and with no other third parties.",
    },
    {
      title: "4. Cookies & Local Storage",
      body: "Schollective uses session cookies for authentication only. We do not use tracking pixels, advertising cookies, or cross-site identifiers.",
    },
    {
      title: "5. Data Retention",
      body: "Your account data is retained for as long as your account is active. You may request deletion at any time by emailing privacy@schollective.com. Deleted accounts are purged from active storage within 30 days, with audit logs retained for up to 90 days.",
    },
    {
      title: "6. Your Rights",
      body: "Depending on your jurisdiction, you may have rights to: access a copy of your data; correct inaccurate data; request deletion; and object to certain processing. To exercise these rights, email privacy@schollective.com.",
    },
    {
      title: "7. Security",
      body: "All data is transmitted over HTTPS. We use Supabase Row Level Security (RLS) policies to ensure users can only access their own data. Passwords are hashed and never stored in plaintext.",
    },
    {
      title: "8. Children's Privacy",
      body: "Schollective is not directed to children under 13. Students between 13 and 17 may use the platform with parental consent. We do not knowingly collect data from children under 13. If you believe a child has created an account, please contact us immediately.",
    },
    {
      title: "9. Changes to This Policy",
      body: "We may update this Privacy Policy periodically. We will notify you of material changes via in-platform notification. Your continued use constitutes acceptance.",
    },
    {
      title: "10. Contact",
      body: "Privacy questions or data requests: privacy@schollective.com.",
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
            Privacy <em className="italic font-light text-indigo-600 dark:text-indigo-400">Policy</em>
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
