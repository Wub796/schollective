import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { GraduationCap, MapPin, Tag } from "lucide-react";

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
    <div className="bg-[rgba(17,34,64,0.4)] border border-[rgba(155,175,192,0.1)] rounded-[24px] p-7 transition-all duration-500 hover:border-[var(--amber)] hover:bg-[rgba(26,58,92,0.6)] hover:translate-y-[-4px] backdrop-blur-md shadow-lg group">
      <div className="flex items-start justify-between mb-6">
        <div className="w-14 h-14 rounded-2xl bg-[rgba(212,146,42,0.1)] flex items-center justify-center font-serif text-[var(--amber)] border border-[rgba(212,146,42,0.15)] text-xl group-hover:scale-110 transition-transform duration-500">
          {professor.first_name[0]}{professor.last_name[0]}
        </div>
        <div className="bg-[rgba(61,122,107,0.1)] text-[var(--sage-light)] text-[0.65rem] font-bold px-3 py-1 rounded-full border border-[rgba(61,122,107,0.2)] uppercase tracking-widest">
          Verified
        </div>
      </div>

      <div className="mb-6">
        <h3 className="font-serif text-2xl text-[var(--ivory)] mb-1 group-hover:text-[var(--amber-light)] transition-colors duration-300">
          Dr. {displayName} {professor.last_name}
        </h3>
        <div className="flex items-center gap-2 text-[var(--text-muted)] text-sm">
          <GraduationCap size={16} className="text-[var(--amber)]" />
          <span>{professor.institution || "Independent Researcher"}</span>
        </div>
      </div>

      <div className="space-y-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-[0.65rem] text-[var(--text-muted)] uppercase tracking-[0.15em] font-bold mb-2">
            <Tag size={12} />
            Expertise
          </div>
          <div className="flex flex-wrap gap-2">
            {professor.expertise_fields?.map((field, idx) => (
              <span 
                key={idx} 
                className="px-2.5 py-0.5 rounded-full bg-[rgba(255,255,255,0.04)] text-[var(--ivory)] border border-[rgba(155,175,192,0.1)] text-[0.7rem] transition-colors hover:border-[var(--amber)] hover:bg-[rgba(212,146,42,0.05)]"
              >
                {field}
              </span>
            )) || <span className="text-[0.7rem] italic text-[var(--text-muted)]">No fields specified</span>}
          </div>
        </div>
      </div>

      <Link href={`/request/new?prof_id=${professor.id}`} className="block">
        <Button className="w-full text-sm py-3 font-semibold tracking-wide">
          Request Mentorship
        </Button>
      </Link>
    </div>
  );
}
