import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { Button } from "@/components/ui/Button";
import { ThreadCard } from "@/components/features/ThreadCard";
import { Sidebar } from "@/components/layout/Sidebar";
import { PlusCircle, BookOpen } from "lucide-react";

export default async function StudentDashboard() {
  const supabase = await createClient();

  // 1. Authenticate Session
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // 2. Fetch Profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/auth/login");
  
  // RBAC Double-Check
  if (profile.role !== 'student') {
    const fallback = profile.role === 'admin' ? '/admin/dashboard' : '/prof/dashboard';
    redirect(fallback);
  }

  const displayName = profile.preferred_name || profile.first_name || "Scholar";

  // 3. Fetch Requests with Joins
  const { data: requests } = await supabase
    .from("requests")
    .select(`
      id,
      status,
      topic,
      updated_at,
      professor:professor_id (
        first_name,
        last_name,
        preferred_name,
        expertise
      ),
      messages (
        content,
        created_at
      )
    `)
    .eq("student_id", user.id)
    .order("updated_at", { ascending: false });

  // Post-process requests to handle potential array types and map to polymorphic participant
  const processedRequests = (requests || []).map((req: any) => {
    const prof = Array.isArray(req.professor) ? req.professor[0] : req.professor;
    
    return {
      ...req,
      participant: {
        first_name: prof.first_name,
        last_name: prof.last_name,
        preferred_name: prof.preferred_name,
        detail: prof.expertise
      },
      latest_message: req.messages && req.messages.length > 0 
        ? req.messages.sort((a: any, b: any) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0] 
        : undefined
    };
  });

  return (
    <div className="flex min-h-screen bg-[var(--navy)]">
      <Sidebar role="student" />

      {/* Main Content */}
      <main className="flex-grow lg:pl-[280px]">
        <div className="dashboard-container py-12 lg:py-20">
          {/* Header */}
          <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-20 animate-in fade-in slide-in-from-top-4 duration-700">
            <div>
              <div className="text-[0.8rem] font-bold tracking-[0.2em] text-[var(--amber)] uppercase mb-3">Student Portal</div>
              <h1 className="font-serif text-5xl lg:text-6xl font-light text-[var(--ivory)] leading-tight">
                Welcome back, <em className="italic text-[var(--amber-light)]">{displayName}</em>
              </h1>
              <p className="text-[var(--text-muted)] mt-6 text-xl font-light max-w-2xl leading-relaxed">Track your mentorship requests and active research dialogues.</p>
            </div>
            <Link href="/professors">
              <Button size="lg" className="flex gap-3 w-full md:w-auto px-8 py-6 text-base font-bold shadow-2xl">
                <PlusCircle size={20} />
                New Mentorship Request
              </Button>
            </Link>
          </header>

          {/* Active Threads Grid */}
          <div className="space-y-12">
            <div className="flex items-center justify-between border-b border-[rgba(155,175,192,0.1)] pb-6">
              <h2 className="text-2xl font-serif text-[var(--ivory)] font-light tracking-tight">Active Mentorship Threads</h2>
              {processedRequests.length > 0 && (
                <span className="text-[0.75rem] text-[var(--text-muted)] uppercase tracking-[0.2em] font-bold bg-[rgba(255,255,255,0.04)] px-4 py-1.5 rounded-full border border-[rgba(155,175,192,0.15)] shadow-inner">
                  {processedRequests.length} total
                </span>
              )}
            </div>

            {processedRequests.length === 0 ? (
              /* Empty State */
              <div className="bg-[rgba(17,34,64,0.3)] border border-dashed border-[rgba(155,175,192,0.2)] rounded-[48px] p-20 lg:p-32 text-center backdrop-blur-sm animate-in zoom-in-95 duration-700">
                <div className="w-20 h-20 bg-[rgba(212,146,42,0.1)] rounded-full flex items-center justify-center mx-auto mb-8 border border-[rgba(212,146,42,0.2)] shadow-inner">
                  <BookOpen size={36} className="text-[var(--amber)]" />
                </div>
                <h3 className="font-serif text-3xl text-[var(--ivory)] mb-6 font-light">Your dashboard is waiting</h3>
                <p className="text-[var(--text-muted)] max-w-[480px] mx-auto mb-12 text-lg lg:text-xl leading-relaxed font-light opacity-80">
                  You haven&apos;t submitted any mentorship requests yet. Start your academic journey by connecting with one of our verified professors.
                </p>
                <Link href="/professors">
                  <Button variant="outline" size="lg" className="px-10 py-5 text-base border-2 font-bold tracking-widest uppercase">Browse the Directory</Button>
                </Link>
              </div>
            ) : (
              /* Threads List - Increased gaps */
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 lg:gap-10 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                {processedRequests.map((req) => (
                  <ThreadCard key={req.id} request={req as any} viewerRole="student" />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
