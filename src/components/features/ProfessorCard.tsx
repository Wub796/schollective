"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { GraduationCap } from "lucide-react";

interface ProfessorCardProps {
  professor: {
    id: string;
    first_name: string;
    last_name: string;
    preferred_name: string | null;
    institution: string | null;
    expertise_fields: string[] | null;
  };
}

export function ProfessorCard({ professor }: ProfessorCardProps) {
  const displayName = professor.preferred_name || professor.first_name;

  return (
    <motion.div
      whileHover={{ y: -4, borderColor: "rgba(255,255,255,0.12)" }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="bg-[#111111] border border-[rgba(255,255,255,0.06)] rounded-2xl p-7 flex flex-col h-full group relative overflow-hidden"
    >
      {/* Hover gradient reveal */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.1)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Header */}
      <div className="flex items-start justify-between mb-7">
        {/* Avatar */}
        <div className="w-14 h-14 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.07)] flex items-center justify-center text-lg font-semibold text-[#6a6a6a] transition-colors duration-300 group-hover:text-[#c8c8c6] group-hover:border-[rgba(255,255,255,0.12)]">
          {professor.first_name[0]}{professor.last_name[0]}
        </div>
        {/* Verified badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#4a4a4a]" />
          <span className="text-[0.58rem] font-semibold uppercase tracking-widest text-[#4a4a4a]">
            Verified
          </span>
        </div>
      </div>

      {/* Name & institution */}
      <div className="mb-6">
        <h3 className="font-display text-xl text-[#d4d4d2] mb-1.5 leading-tight group-hover:text-[#f2f2f0] transition-colors duration-300">
          Dr. {displayName} {professor.last_name}
        </h3>
        <div className="flex items-center gap-1.5 text-[#4a4a4a] text-xs">
          <GraduationCap size={12} />
          <span className="truncate">{professor.institution || "Independent Researcher"}</span>
        </div>
      </div>

      {/* Expertise tags */}
      <div className="flex-grow mb-8">
        <div className="text-[0.58rem] text-[#3a3a3a] uppercase tracking-[0.18em] font-semibold mb-3">
          Focus Areas
        </div>
        <div className="flex flex-wrap gap-1.5">
          {professor.expertise_fields?.slice(0, 4).map((field, idx) => (
            <span
              key={idx}
              className="px-2.5 py-1 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] text-[0.68rem] text-[#6a6a6a] transition-colors hover:text-[#c8c8c6] hover:border-[rgba(255,255,255,0.1)]"
            >
              {field}
            </span>
          )) || (
            <span className="text-[0.7rem] italic text-[#3a3a3a]">Open to requests</span>
          )}
        </div>
      </div>

      {/* CTA */}
      <Link href={`/request/new?prof_id=${professor.id}`} className="mt-auto">
        <Button className="w-full text-[0.7rem] uppercase tracking-widest font-bold py-3">
          Request Mentorship
        </Button>
      </Link>
    </motion.div>
  );
}
