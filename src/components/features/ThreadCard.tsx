import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ThreadCardProps {
  request: {
    id: string;
    status: 'pending' | 'active' | 'closed';
    topic: string;
    participant: {
      first_name: string;
      last_name: string | null;
      preferred_name: string | null;
      detail: string; // Education level for students, Expertise for professors
    };
    latest_message?: {
      content: string;
      created_at: string;
    };
    updated_at: string;
  };
  viewerRole: 'student' | 'professor';
}

export function ThreadCard({ request, viewerRole }: ThreadCardProps) {
  const displayName = request.participant.preferred_name || request.participant.first_name;
  const prefix = viewerRole === 'student' ? 'Dr. ' : '';
  
  const statusStyles = {
    pending: "bg-[rgba(212,146,42,0.1)] text-[var(--amber-light)] border-[rgba(212,146,42,0.18)]",
    active: "bg-[rgba(61,122,107,0.14)] text-[var(--sage-light)] border-[rgba(61,122,107,0.22)]",
    closed: "bg-[rgba(155,175,192,0.07)] text-[var(--text-muted)] border-[rgba(155,175,192,0.13)]",
  };

  const statusLabels = {
    pending: "Awaiting Reply",
    active: "Active Dialogue",
    closed: "Closed Thread",
  };

  return (
    <Link 
      href={`/messages/${request.id}`}
      className="block group h-full"
    >
      <div className="bg-[rgba(17,34,64,0.4)] border border-[rgba(155,175,192,0.1)] rounded-[24px] p-6 transition-all duration-300 hover:border-[var(--amber)] hover:bg-[rgba(26,58,92,0.6)] hover:translate-y-[-4px] backdrop-blur-md shadow-lg flex flex-col h-full">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-11 h-11 rounded-2xl flex items-center justify-center font-serif border shadow-inner",
              viewerRole === 'student' ? "bg-[rgba(212,146,42,0.15)] text-[var(--amber)] border-[rgba(212,146,42,0.2)]" : "bg-[rgba(61,122,107,0.15)] text-[var(--sage-light)] border-[rgba(61,122,107,0.2)]"
            )}>
              {request.participant.first_name[0]}{request.participant.last_name?.[0] || ''}
            </div>
            <div>
              <div className="text-[0.95rem] font-medium text-[var(--ivory)] group-hover:text-[var(--amber-light)] transition-colors">
                {prefix}{displayName} {request.participant.last_name}
              </div>
              <div className="text-[0.65rem] text-[var(--text-muted)] uppercase tracking-[0.15em] font-bold">
                {request.participant.detail}
              </div>
            </div>
          </div>
          <div className={cn(
            "px-2.5 py-0.5 rounded-full border text-[0.6rem] font-bold uppercase tracking-widest",
            statusStyles[request.status]
          )}>
            {statusLabels[request.status]}
          </div>
        </div>

        <div className="flex-grow space-y-2 mb-6">
          <div className="text-[0.6rem] text-[var(--text-muted)] uppercase tracking-[0.2em] font-bold opacity-60">Mentorship Topic</div>
          <p className="text-sm text-[var(--ivory)] leading-relaxed line-clamp-3 font-light italic">
            &quot;{request.topic}&quot;
          </p>
        </div>

        {request.latest_message && (
          <div className="pt-5 border-t border-[rgba(155,175,192,0.08)] mt-auto">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[0.6rem] text-[var(--text-muted)] uppercase font-bold tracking-[0.15em] opacity-60">Latest Activity</span>
              <span className="text-[0.65rem] text-[var(--text-muted)]">
                {new Date(request.latest_message.created_at).toLocaleDateString()}
              </span>
            </div>
            <p className="text-[0.8rem] text-[var(--text-muted)] italic truncate opacity-90 leading-relaxed">
              &quot;{request.latest_message.content}&quot;
            </p>
          </div>
        )}
      </div>
    </Link>
  );
}
