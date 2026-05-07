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
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/auth/login");

  // 2. Fetch Profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
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
    .eq("student_id", session.user.id)
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
        <div className="content-container py-12">
          {/* Header */}
          <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-16 animate-in fade-in slide-in-from-top-4 duration-700">
            <div>
              <div className="text-[0.75rem] font-bold tracking-[0.15em] text-[var(--amber)] uppercase mb-2">Student Portal</div>
              <h1 className="font-serif text-4xl lg:text-5xl font-light text-[var(--ivory)] leading-tight">
                Welcome back, <em className="italic text-[var(--amber-light)]">{displayName}</em>
              </h1>
              <p className="text-[var(--text-muted)] mt-4 text-lg font-light">Track your mentorship requests and active dialogues.</p>
            </div>
            <Link href="/professors">
              <Button className="flex gap-2 w-full md:w-auto">
                <PlusCircle size={18} />
                New Request
              </Button>
            </Link>
          </header>

          {/* Active Threads Grid */}
          <div className="space-y-8">
            <div className="flex items-center justify-between border-b border-[rgba(155,175,192,0.1)] pb-4">
              <h2 className="text-xl font-serif text-[var(--ivory)] font-light">Active Mentorship Threads</h2>
              {processedRequests.length > 0 && (
                <span className="text-[0.7rem] text-[var(--text-muted)] uppercase tracking-widest bg-[rgba(255,255,255,0.03)] px-3 py-1 rounded-full border border-[rgba(155,175,192,0.1)]">
                  {processedRequests.length} total
                </span>
              )}
            </div>

            {processedRequests.length === 0 ? (
              /* Empty State */
              <div className="bg-[rgba(17,34,64,0.3)] border border-dashed border-[rgba(155,175,192,0.2)] rounded-[32px] p-16 lg:p-24 text-center backdrop-blur-sm animate-in zoom-in-95 duration-700">
                <div className="w-16 h-16 bg-[rgba(212,146,42,0.1)] rounded-full flex items-center justify-center mx-auto mb-6 border border-[rgba(212,146,42,0.2)]">
                  <BookOpen size={28} className="text-[var(--amber)]" />
                </div>
                <h3 className="font-serif text-3xl text-[var(--ivory)] mb-4 font-light">Your dashboard is waiting</h3>
                <p className="text-[var(--text-muted)] max-w-[440px] mx-auto mb-10 text-lg leading-relaxed font-light">
                  You haven&apos;t submitted any mentorship requests yet. Start your academic journey by connecting with one of our verified professors.
                </p>
                <Link href="/professors">
                  <Button variant="outline" size="lg">Browse the Directory</Button>
                </Link>
              </div>
            ) : (
              /* Threads List */
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
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
