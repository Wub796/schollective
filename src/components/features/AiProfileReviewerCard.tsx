"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  Plus,
  GraduationCap,
  Target,
  Compass,
  FileCheck,
  Clock,
  Check,
} from "lucide-react";
import { ProfileReviewOutput } from "@/lib/ai/types";
import type { StudentProfileData } from "@/lib/ai/profile-reviewer";
import { toast } from "sonner";

interface Props {
  profileData?: StudentProfileData | Record<string, unknown> | null;
  onAddAcademicInterest?: (tag: string) => boolean;
}

type ReviewJobStatus = "pending" | "processing" | "completed" | "error";

interface ReviewJob {
  id: string;
  status: ReviewJobStatus;
  result: ProfileReviewOutput | null;
  error: string | null;
}

function waitForNextPoll(ms: number, signal: AbortSignal): Promise<boolean> {
  return new Promise((resolve) => {
    if (signal.aborted) {
      resolve(false);
      return;
    }

    const timeout = window.setTimeout(() => {
      signal.removeEventListener("abort", abort);
      resolve(true);
    }, ms);
    const abort = () => {
      window.clearTimeout(timeout);
      resolve(false);
    };
    signal.addEventListener("abort", abort, { once: true });
  });
}

function getPillarTierLabel(score: number): { label: string; color: string } {
  if (score >= 92) return { label: "Top 5% Tier", color: "#059669" };
  if (score >= 78) return { label: "Lab Ready", color: "#10b981" };
  if (score >= 65) return { label: "Competitive", color: "#4f46e5" };
  if (score >= 40) return { label: "Developing", color: "#d97706" };
  return { label: "Needs Data", color: "#e11d48" };
}

export const AiProfileReviewerCard = React.memo(function AiProfileReviewerCard({
  profileData,
  onAddAcademicInterest,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [review, setReview] = useState<ProfileReviewOutput | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const pollAbortRef = useRef<AbortController | null>(null);

  // Rate limiting: track recent clicks and cooldown
  const clickTimestampsRef = useRef<number[]>([]);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const cooldownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Track which recommended topics have been added (so they stay visible with a checkmark)
  const [addedTopics, setAddedTopics] = useState<Set<string>>(new Set());

  const existingInterests = React.useMemo(() => {
    const raw = (profileData as any)?.academic_interests;
    if (Array.isArray(raw)) return new Set(raw.map((s: string) => String(s).toLowerCase().trim()));
    if (typeof raw === "string") return new Set(raw.split(",").map((s: string) => s.toLowerCase().trim()));
    return new Set<string>();
  }, [profileData]);

  const applyJob = (job: ReviewJob) => {
    setJobId(job.id);
    setReview(job.result);
    return job;
  };

  const pollJob = async (
    id: string,
    signal: AbortSignal,
    notifyOnError: boolean,
  ): Promise<void> => {
    while (!signal.aborted) {
      if (!(await waitForNextPoll(1500, signal))) return;

      try {
        const res = await fetch(`/api/ai/review-profile?jobId=${encodeURIComponent(id)}`, {
          headers: { Accept: "application/json" },
          cache: "no-store",
          signal,
        });
        const contentType = res.headers.get("content-type") || "";
        const data = contentType.includes("application/json") ? await res.json() : null;

        if (!res.ok || !data?.success || !data.job) {
          if (res.status === 408 || res.status === 429 || res.status >= 500) {
            const retryAfter = Number(res.headers.get("retry-after"));
            const retryDelay = Number.isFinite(retryAfter)
              ? Math.min(30_000, Math.max(1_500, retryAfter * 1_000))
              : 2_000;
            if (!(await waitForNextPoll(retryDelay, signal))) return;
            continue;
          }

          if (notifyOnError) toast.error(data?.error || `Review status failed (${res.status})`);
          setLoading(false);
          return;
        }
        if (signal.aborted) return;

        const job = applyJob(data.job as ReviewJob);
        if (job.status === "completed") {
          setLoading(false);
          if (notifyOnError) toast.success("AI Profile Review complete!");
          return;
        }
        if (job.status === "error") {
          setLoading(false);
          if (notifyOnError) toast.error(job.error || "Failed to analyze profile.");
          return;
        }
      } catch (error: any) {
        if (signal.aborted || error?.name === "AbortError") return;
        console.error("[AiProfileReviewer] Status poll error:", error);
        if (!(await waitForNextPoll(2_000, signal))) return;
      }
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    pollAbortRef.current = controller;

    const restoreLatestReview = async () => {
      try {
        const res = await fetch("/api/ai/review-profile", {
          headers: { Accept: "application/json" },
          cache: "no-store",
          signal: controller.signal,
        });
        const contentType = res.headers.get("content-type") || "";
        const data = contentType.includes("application/json") ? await res.json() : null;
        if (!res.ok || !data?.success || !data.job || controller.signal.aborted) return;

        const job = applyJob(data.job as ReviewJob);
        if (job.status === "pending" || job.status === "processing") {
          setLoading(true);
          await pollJob(job.id, controller.signal, false);
        }
      } catch (error: any) {
        if (error?.name !== "AbortError") {
          console.error("[AiProfileReviewer] Failed to restore review:", error);
        }
      }
    };

    void restoreLatestReview();
    return () => {
      controller.abort();
      pollAbortRef.current?.abort();
      pollAbortRef.current = null;
    };
  }, []);

  const startCooldown = (seconds: number) => {
    setCooldownSeconds(seconds);
    if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
    cooldownIntervalRef.current = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) {
          if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
          cooldownIntervalRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Cleanup cooldown interval on unmount
  useEffect(() => {
    return () => {
      if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
    };
  }, []);

  const handleReview = async () => {
    // Client-side rate limiting: 3 clicks per 60 seconds
    const now = Date.now();
    clickTimestampsRef.current = clickTimestampsRef.current.filter((t) => now - t < 60_000);
    clickTimestampsRef.current.push(now);

    if (clickTimestampsRef.current.length > 3) {
      startCooldown(30);
      toast.error("Slow down — you can analyze your profile up to 3 times per minute.", {
        id: "ai-rate-limit",
      });
      return;
    }

    if (cooldownSeconds > 0) {
      toast.error(`Please wait ${cooldownSeconds}s before analyzing again.`, {
        id: "ai-rate-limit",
      });
      return;
    }

    pollAbortRef.current?.abort();
    const controller = new AbortController();
    pollAbortRef.current = controller;
    setLoading(true);

    try {
      const bioEl = typeof document !== "undefined" ? (document.getElementById("bio") as HTMLTextAreaElement) : null;
      const instEl = typeof document !== "undefined" ? (document.getElementById("institution") as HTMLInputElement) : null;
      const levelEl = typeof document !== "undefined" ? (document.getElementById("education_level") as HTMLSelectElement) : null;
      const interestsEl = typeof document !== "undefined" ? (document.getElementById("academic_interests") as HTMLInputElement) : null;
      const extrasEl = typeof document !== "undefined" ? (document.getElementById("extracurriculars") as HTMLInputElement) : null;

      const dynamicPayload = {
        ...profileData,
        bio: bioEl ? bioEl.value : profileData?.bio,
        institution: instEl ? instEl.value : profileData?.institution,
        education_level: levelEl ? levelEl.value : profileData?.education_level,
        academic_interests: interestsEl ? interestsEl.value : profileData?.academic_interests,
        extracurriculars: extrasEl ? extrasEl.value : profileData?.extracurriculars,
      };

      const res = await fetch("/api/ai/review-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dynamicPayload),
        signal: controller.signal,
      });

      const contentType = res.headers.get("content-type") || "";
      const data = contentType.includes("application/json") ? await res.json() : null;
      if (!res.ok || !data?.success || !data.job) {
        if (res.status === 429) {
          const retryAfter = Number(res.headers.get("retry-after")) || 30;
          startCooldown(retryAfter);
          toast.error(data?.error || `Rate limit reached. Please wait ${retryAfter}s before trying again.`, { id: "ai-rate-limit" });
          setLoading(false);
          return;
        }
        throw new Error(data?.error || `Review failed (${res.status})`);
      }

      const job = applyJob(data.job as ReviewJob);
      if (job.status === "completed" && job.result) {
        setLoading(false);
        toast.success("AI Profile Review complete!");
        return;
      }

      await pollJob(job.id, controller.signal, true);
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      console.error(err);
      setLoading(false);
      toast.error(err.message || "Failed to start profile review.");
    }
  };

  const addInterestTag = (tag: string) => {
    // Already added — do nothing
    if (addedTopics.has(tag) || existingInterests.has(tag.toLowerCase().trim())) return;

    let added = false;

    // 1. Direct React state callback (cleanest & preferred)
    if (onAddAcademicInterest) {
      added = onAddAcademicInterest(tag);
    } else {
      // 2. DOM backward-compatible fallback
      const interestsEl = document.getElementById("academic_interests") as HTMLInputElement;
      if (interestsEl) {
        const current = interestsEl.value.trim();
        const existing = current ? current.split(",").map((s) => s.trim()) : [];
        if (existing.length >= 5) {
          toast.error("You can select up to 5 academic interests.", { id: "interests-limit" });
          return;
        }
        if (!existing.includes(tag)) {
          const newInterests = current ? `${current}, ${tag}` : tag;
          interestsEl.value = newInterests;
          interestsEl.dispatchEvent(new Event("input", { bubbles: true }));
          interestsEl.dispatchEvent(new Event("change", { bubbles: true }));
          added = true;
        }
      }
    }

    if (!added) return;

    toast.success(`Added "${tag}" to Academic Interests!`, { id: `tag-${tag}` });

    // Mark as added — pill stays visible with a checkmark instead of disappearing
    setAddedTopics((prev) => new Set(prev).add(tag));
  };

  const addAllInterestTags = () => {
    review?.recommended_topics?.forEach((topic) => addInterestTag(topic));
  };

  return (
    <div className="mb-10 space-y-6">
      {/* Top Action Header Bar */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(248, 250, 252, 0.9) 100%)",
          border: "1px solid rgba(99, 102, 241, 0.18)",
          borderRadius: "16px",
          padding: "1.5rem 1.75rem",
          boxShadow: "0 4px 20px rgba(99, 102, 241, 0.04)",
        }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[0.65rem] font-black uppercase tracking-wider bg-indigo-100 text-indigo-700">
              Admissions Calibration
            </span>
            <h3 className="font-display text-xl font-extrabold text-slate-900 m-0 tracking-tight">
              AI Profile <span className="font-light italic text-indigo-600">Reviewer</span>
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 m-0">
            Calibrated on Harvard admissions 1–6 rubric: Academic Rigor, Domain Alignment, Leadership, & Completeness.
          </p>
        </div>

        <button
          type="button"
          onClick={handleReview}
          disabled={loading || cooldownSeconds > 0}
          style={{
            background: cooldownSeconds > 0
              ? "linear-gradient(135deg, #d97706 0%, #f59e0b 100%)"
              : "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
            boxShadow: cooldownSeconds > 0
              ? "0 4px 14px rgba(217, 119, 6, 0.25)"
              : "0 4px 14px rgba(79, 70, 229, 0.25)",
          }}
          className="w-full sm:w-auto text-white rounded-full px-5 py-2.5 text-xs font-extrabold tracking-wide cursor-pointer flex items-center justify-center gap-2 transition-all hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {cooldownSeconds > 0 ? (
            <>
              <Clock size={14} /> Wait {cooldownSeconds}s
            </>
          ) : loading ? (
            <>
              <RefreshCw size={14} className="animate-spin" /> Analyzing Rubric...
            </>
          ) : (
            <>
              <Sparkles size={14} /> {review ? "Re-Analyze Profile" : "Analyze Profile"}
            </>
          )}
        </button>
      </div>

      <AnimatePresence>
        {review && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-5"
          >
            {/* CARD 1: Executive Verdict & 4-Pillar Grid */}
            <div
              style={{
                background: "#ffffff",
                borderRadius: "16px",
                border: "1px solid rgba(226, 232, 240, 0.9)",
                boxShadow: "0 4px 24px rgba(0, 0, 0, 0.03)",
                padding: "1.75rem",
              }}
              className="space-y-6"
            >
              {/* Verdict Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2.5 rounded-xl ${
                      review.status === "Ready for Outreach"
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                        : "bg-amber-50 text-amber-600 border border-amber-200"
                    }`}
                  >
                    {review.status === "Ready for Outreach" ? (
                      <ShieldCheck size={24} />
                    ) : (
                      <AlertTriangle size={24} />
                    )}
                  </div>
                  <div>
                    <div className="text-[0.7rem] font-bold text-slate-500 uppercase tracking-wider">
                      Executive Outreach Status
                    </div>
                    <div
                      className={`text-lg font-black tracking-tight ${
                        review.status === "Ready for Outreach" ? "text-emerald-700" : "text-amber-700"
                      }`}
                    >
                      {review.status === "Ready for Outreach"
                        ? "Ready for Faculty Outreach ✓"
                        : "Edits Recommended Before Outreach"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">Outreach Gate:</span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                      review.status === "Ready for Outreach"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {review.status}
                  </span>
                </div>
              </div>

              {/* 2-Sentence Mentor Summary */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1 text-slate-700 font-bold text-xs">
                  <Compass size={14} className="text-indigo-600" /> Mentor Assessment
                </div>
                <p className="text-sm text-slate-700 leading-relaxed m-0 font-normal">
                  {review.summary}
                </p>
              </div>

              {/* 4-Pillar Grid */}
              <div>
                <div className="text-[0.7rem] font-extrabold uppercase tracking-wider text-slate-400 mb-3">
                  4-Pillar Admissions Calibration Grid
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  <PillarMeter
                    title="Academic Rigor"
                    subtitle="Coursework & STEM depth"
                    icon={<GraduationCap size={16} />}
                    score={review.pillar_scores.academic_rigor}
                  />
                  <PillarMeter
                    title="Domain Alignment"
                    subtitle="Interests vs. activities"
                    icon={<Target size={16} />}
                    score={review.pillar_scores.domain_alignment}
                  />
                  <PillarMeter
                    title="Leadership & Initiative"
                    subtitle="Agency & sustained craft"
                    icon={<Sparkles size={16} />}
                    score={review.pillar_scores.leadership_initiative}
                  />
                  <PillarMeter
                    title="Profile Completeness"
                    subtitle="Faculty-evaluation readiness"
                    icon={<FileCheck size={16} />}
                    score={review.pillar_scores.completeness}
                  />
                </div>
              </div>
            </div>

            {/* CARD 2: Admissions Mentorship Breakdown (Split Strengths vs Flags) */}
            <div
              style={{
                background: "#ffffff",
                borderRadius: "16px",
                border: "1px solid rgba(226, 232, 240, 0.9)",
                boxShadow: "0 4px 24px rgba(0, 0, 0, 0.03)",
                padding: "1.75rem",
              }}
            >
              <div className="text-[0.7rem] font-extrabold uppercase tracking-wider text-slate-400 mb-4">
                Admissions Mentorship Breakdown
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* High-Impact Hooks (Strengths) */}
                <div className="bg-emerald-50/50 border border-emerald-200/70 rounded-xl p-4.5 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-sm">
                    <CheckCircle2 size={17} className="text-emerald-600" />
                    High-Impact Hooks (Strengths)
                  </div>
                  <ul className="space-y-2 m-0 p-0 list-none">
                    {review.strengths.map((str, idx) => (
                      <li key={idx} className="text-xs text-slate-700 flex items-start gap-2 leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Areas to Tighten (Flags) */}
                <div className="bg-amber-50/50 border border-amber-200/70 rounded-xl p-4.5 space-y-3">
                  <div className="flex items-center gap-2 text-amber-900 font-extrabold text-sm">
                    <AlertTriangle size={17} className="text-amber-600" />
                    Areas to Tighten (Critiques)
                  </div>
                  <ul className="space-y-2 m-0 p-0 list-none">
                    {review.flags.map((flag, idx) => (
                      <li key={idx} className="text-xs text-slate-700 flex items-start gap-2 leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                        <span>{flag}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* CARD 3: Actionable Next Steps & Interactive Topic Pills */}
            <div
              style={{
                background: "#ffffff",
                borderRadius: "16px",
                border: "1px solid rgba(226, 232, 240, 0.9)",
                boxShadow: "0 4px 24px rgba(0, 0, 0, 0.03)",
                padding: "1.75rem",
              }}
              className="space-y-5"
            >
              <div className="text-[0.7rem] font-extrabold uppercase tracking-wider text-slate-400">
                Actionable Next Steps & Curriculum Expansion
              </div>

              {/* Concrete Rewrites List */}
              <div className="space-y-2.5">
                {review.next_steps.map((step, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 leading-relaxed"
                  >
                    <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-black text-[0.65rem] flex items-center justify-center flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <div>{step}</div>
                  </div>
                ))}
              </div>

              {/* Interactive Recommended Topic Pills */}
              {review.recommended_topics && review.recommended_topics.length > 0 && (
                <div className="pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2.5">
                    <button
                      type="button"
                      onClick={addAllInterestTags}
                      className="text-xs font-bold text-slate-600 flex items-center gap-1.5 cursor-pointer hover:text-indigo-700 transition-colors"
                    >
                      <Sparkles size={13} className="text-indigo-600" />
                      Recommended Technical Sub-Fields (Click to append to interests)
                    </button>
                    <span className="text-[0.65rem] text-slate-400 font-medium">
                      Adds directly to active pitch
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {review.recommended_topics.map((topic, i) => {
                      const isAdded = addedTopics.has(topic) || existingInterests.has(topic.toLowerCase().trim());
                      return (
                        <button
                          key={topic || i}
                          type="button"
                          onClick={() => addInterestTag(topic)}
                          disabled={isAdded}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm ${
                            isAdded
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default opacity-80"
                              : "bg-indigo-50/80 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300 cursor-pointer active:scale-95"
                          }`}
                        >
                          {isAdded ? (
                            <Check size={12} className="text-emerald-600" />
                          ) : (
                            <Plus size={12} className="text-indigo-600" />
                          )}
                          {topic}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

interface PillarMeterProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  score: number;
}

function PillarMeter({ title, subtitle, icon, score }: PillarMeterProps) {
  const { label, color } = getPillarTierLabel(score);

  return (
    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col justify-between gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-800">
            <span className="text-indigo-600">{icon}</span>
            <span>{title}</span>
          </div>
          <p className="text-[0.65rem] text-slate-500 m-0 leading-tight line-clamp-1">{subtitle}</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between">
          <span className="text-xl font-black tracking-tight" style={{ color }}>
            {score}%
          </span>
          <span
            className="text-[0.65rem] font-bold px-2 py-0.5 rounded-full"
            style={{ color, background: `${color}15` }}
          >
            {label}
          </span>
        </div>

        {/* Meter bar */}
        <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.max(5, Math.min(100, score))}%`, background: color }}
          />
        </div>
      </div>
    </div>
  );
}
