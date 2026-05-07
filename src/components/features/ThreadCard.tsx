"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
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
      detail: string;
    };
    latest_message?: {
      content: string;
      created_at: string;
    };
    updated_at: string;
  };
  viewerRole: 'student' | 'professor';
}

const statusConfig = {
  pending: {
    label: "Awaiting Reply",
    dot: "bg-[#5a5a5a]",
    text: "text-[#6a6a6a]",
    border: "border-[rgba(255,255,255,0.04)]",
  },
  active: {
    label: "Active",
    dot: "bg-[#d4d4d2]",
    text: "text-[#d4d4d2]",
    border: "border-[rgba(255,255,255,0.04)]",
  },
  closed: {
    label: "Closed",
    dot: "bg-[#2e2e2e]",
    text: "text-[#3a3a3a]",
    border: "border-[rgba(255,255,255,0.02)]",
  },
};

export function ThreadCard({ request, viewerRole }: ThreadCardProps) {
  const displayName =
    request.participant.preferred_name || request.participant.first_name;
  const prefix = viewerRole === "student" ? "Dr. " : "";
  const status = statusConfig[request.status];

  return (
    <Link href={`/messages/${request.id}`} className="block group h-full">
      <motion.div
        whileHover={{ y: -3, borderColor: "rgba(255,255,255,0.12)" }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="relative bg-[#111111] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 flex flex-col h-full overflow-hidden"
      >
        {/* Subtle top gradient on hover */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.08)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Header */}
        <div className="flex justify-between items-start mb-5">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="w-9 h-9 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.07)] flex items-center justify-center text-[0.7rem] font-semibold text-[#8a8a8a]">
              {request.participant.first_name[0]}
              {request.participant.last_name?.[0] || ""}
            </div>
            <div>
              <div className="text-sm font-medium text-[#d4d4d2] leading-tight group-hover:text-[#f2f2f0] transition-colors">
                {prefix}{displayName} {request.participant.last_name}
              </div>
              <div className="text-[0.62rem] text-[#4a4a4a] uppercase tracking-[0.12em] font-medium mt-0.5">
                {request.participant.detail}
              </div>
            </div>
          </div>

          {/* Status pill */}
          <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full border", status.border)}>
            <span className={cn("w-1.5 h-1.5 rounded-full", status.dot)} />
            <span className={cn("text-[0.6rem] font-semibold uppercase tracking-widest", status.text)}>
              {status.label}
            </span>
          </div>
        </div>

        {/* Topic */}
        <div className="flex-grow mb-5">
          <div className="text-[0.58rem] text-[#3a3a3a] uppercase tracking-[0.18em] font-semibold mb-2">
            Topic
          </div>
          <p className="text-sm text-[#8a8a8a] leading-relaxed line-clamp-3 font-light italic">
            &ldquo;{request.topic}&rdquo;
          </p>
        </div>

        {/* Latest message */}
        {request.latest_message && (
          <div className="pt-4 border-t border-[rgba(255,255,255,0.05)] mt-auto">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[0.58rem] text-[#3a3a3a] uppercase font-semibold tracking-[0.15em]">
                Last activity
              </span>
              <span className="text-[0.62rem] text-[#3a3a3a]">
                {new Date(request.latest_message.created_at).toLocaleDateString()}
              </span>
            </div>
            <p className="text-[0.78rem] text-[#4a4a4a] truncate leading-relaxed">
              {request.latest_message.content}
            </p>
          </div>
        )}
      </motion.div>
    </Link>
  );
}
