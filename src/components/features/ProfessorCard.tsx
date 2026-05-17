import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { GraduationCap, Tag } from "lucide-react";

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
    <div className="bg-[rgba(17,34,64,0.4)] border border-[rgba(155,175,192,0.1)] rounded-[32px] p-8 transition-all duration-500 hover:border-[var(--amber)] hover:bg-[rgba(26,58,92,0.6)] hover:translate-y-[-6px] backdrop-blur-md shadow-lg group flex flex-col h-full">
      <div className="flex items-start justify-between mb-8">
        <div className="w-16 h-16 rounded-2xl bg-[rgba(212,146,42,0.1)] flex items-center justify-center font-serif text-[var(--amber)] border border-[rgba(212,146,42,0.15)] text-2xl group-hover:scale-105 transition-transform duration-500 shadow-inner">
          {professor.first_name[0]}{professor.last_name[0]}
        </div>
        <div className="bg-[rgba(61,122,107,0.1)] text-[var(--sage-light)] text-[0.65rem] font-bold px-3 py-1 rounded-full border border-[rgba(61,122,107,0.2)] uppercase tracking-[0.15em]">
          Verified
        </div>
      </div>

      <div className="mb-6">
        <h3 className="font-serif text-2xl lg:text-3xl text-[var(--ivory)] mb-2 group-hover:text-[var(--amber-light)] transition-colors duration-300">
          Dr. {displayName} {professor.last_name}
        </h3>
        <div className="flex items-center gap-2 text-[var(--text-muted)] text-sm font-medium">
          <GraduationCap size={16} className="text-[var(--amber)] opacity-70" />
          <span className="truncate">{professor.institution || "Independent Researcher"}</span>
        </div>
      </div>

      <div className="flex-grow space-y-4 mb-10">
        <div>
          <div className="flex items-center gap-2 text-[0.6rem] text-[var(--text-muted)] uppercase tracking-[0.2em] font-bold mb-3 opacity-60">
            <Tag size={12} />
            Focus Areas
          </div>
          <div className="flex flex-wrap gap-2">
            {professor.expertise_fields?.slice(0, 4).map((field, idx) => (
              <span 
                key={idx} 
                className="px-3 py-1 rounded-full bg-[rgba(255,255,255,0.03)] text-[var(--ivory)] border border-[rgba(155,175,192,0.1)] text-[0.7rem] transition-all hover:border-[var(--amber)] hover:bg-[rgba(212,146,42,0.05)]"
              >
                {field}
              </span>
            )) || <span className="text-[0.7rem] italic text-[var(--text-muted)]">Open to requests</span>}
          </div>
        </div>
      </div>

      <Link href={`/request/new?prof_id=${professor.id}`} className="mt-auto">
        <Button className="w-full text-xs uppercase tracking-widest font-bold py-4 shadow-xl shadow-[var(--amber)]/5">
          Request Mentorship
        </Button>
      </Link>
    </div>
  );
}
