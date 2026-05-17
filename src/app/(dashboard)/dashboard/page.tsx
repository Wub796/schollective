import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { Button } from "@/components/ui/Button";
import { ThreadCard } from "@/components/features/ThreadCard";
import { PlusCircle, BookOpen } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function StudentDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");
  if (profile.role !== "student") {
    redirect(profile.role === "admin" ? "/admin/dashboard" : "/prof/dashboard");
  }

  const displayName = profile.preferred_name || profile.first_name || "Scholar";

  const { data: requests } = await supabase
    .from("requests")
    .select(`
      id, status, topic, updated_at,
      professor:professor_id ( first_name, last_name, preferred_name, expertise ),
      messages ( content, created_at )
    `)
    .eq("student_id", user.id)
    .order("updated_at", { ascending: false });

  const processedRequests = (requests || []).map((req: any) => {
    const prof = Array.isArray(req.professor) ? req.professor[0] : req.professor;
    return {
      ...req,
      participant: {
        first_name: prof.first_name,
        last_name: prof.last_name,
        preferred_name: prof.preferred_name,
        detail: prof.expertise,
      },
      latest_message:
        req.messages?.length > 0
          ? [...req.messages].sort(
              (a: any, b: any) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )[0]
          : undefined,
    };
  });

  return (
    <div className="py-10 lg:py-16 space-y-16">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <p className="text-[0.62rem] font-bold tracking-[0.25em] text-[#3a3a3a] uppercase mb-3">
            Student Portal
          </p>
          <h1 className="font-display text-4xl lg:text-5xl font-bold text-[#f2f2f0] leading-tight">
            Welcome back, <em className="italic text-[#5a5a5a]">{displayName}</em>
          </h1>
          <p className="text-[#4a4a4a] mt-4 text-base font-light max-w-xl leading-relaxed">
            Track your mentorship requests and active research dialogues.
          </p>
        </div>
        <Link href="/professors">
          <Button size="lg" className="flex gap-2 shrink-0">
            <PlusCircle size={16} />
            New Request
          </Button>
        </Link>
      </header>

      {/* Threads */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.05)] pb-4">
          <h2 className="font-display text-xl font-semibold text-[#d4d4d2]">
            Active Threads
          </h2>
          {processedRequests.length > 0 && (
            <span className="text-[0.62rem] text-[#3a3a3a] uppercase tracking-widest font-bold">
              {processedRequests.length} total
            </span>
          )}
        </div>

        {processedRequests.length === 0 ? (
          <div className="border border-[rgba(255,255,255,0.05)] border-dashed rounded-2xl p-20 text-center">
            <div className="w-14 h-14 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] flex items-center justify-center mx-auto mb-6">
              <BookOpen size={24} className="text-[#3a3a3a]" />
            </div>
            <h3 className="font-display text-2xl text-[#d4d4d2] mb-4 font-semibold">
              Your dashboard is waiting
            </h3>
            <p className="text-[#4a4a4a] max-w-sm mx-auto mb-10 text-sm leading-relaxed font-light">
              You haven&apos;t submitted any mentorship requests yet. Start by
              connecting with a verified professor.
            </p>
            <Link href="/professors">
              <Button variant="outline">Browse Professors</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {processedRequests.map((req) => (
              <ThreadCard key={req.id} request={req as any} viewerRole="student" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
