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
      className="block group"
    >
      <div className="bg-[rgba(17,34,64,0.4)] border border-[rgba(155,175,192,0.1)] rounded-2xl p-6 transition-all duration-300 hover:border-[var(--amber)] hover:bg-[rgba(26,58,92,0.6)] hover:translate-y-[-2px] backdrop-blur-sm">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center font-serif border",
              viewerRole === 'student' ? "bg-[rgba(212,146,42,0.15)] text-[var(--amber)] border-[rgba(212,146,42,0.2)]" : "bg-[rgba(61,122,107,0.15)] text-[var(--sage-light)] border-[rgba(61,122,107,0.2)]"
            )}>
              {request.participant.first_name[0]}{request.participant.last_name?.[0] || ''}
            </div>
            <div>
              <div className="text-sm font-medium text-[var(--ivory)] group-hover:text-[var(--amber-light)] transition-colors">
                {prefix}{displayName} {request.participant.last_name}
              </div>
              <div className="text-[0.7rem] text-[var(--text-muted)] uppercase tracking-wider">
                {request.participant.detail}
              </div>
            </div>
          </div>
          <div className={cn(
            "px-2.5 py-0.5 rounded-full border text-[0.65rem] font-medium uppercase tracking-wider",
            statusStyles[request.status]
          )}>
            {statusLabels[request.status]}
          </div>
        </div>

        <div className="mb-4">
          <div className="text-[0.7rem] text-[var(--text-muted)] uppercase tracking-widest mb-1.5 font-bold">Topic</div>
          <p className="text-sm text-[var(--ivory)] leading-relaxed line-clamp-2">
            {request.topic}
          </p>
        </div>

        {request.latest_message && (
          <div className="pt-4 border-t border-[rgba(155,175,192,0.08)]">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[0.65rem] text-[var(--text-muted)] uppercase font-bold tracking-widest">Latest Message</span>
              <span className="text-[0.65rem] text-[var(--text-muted)]">
                {new Date(request.latest_message.created_at).toLocaleDateString()}
              </span>
            </div>
            <p className="text-[0.8rem] text-[var(--text-muted)] italic truncate">
              "{request.latest_message.content}"
            </p>
          </div>
        )}
      </div>
    </Link>
  );
}
