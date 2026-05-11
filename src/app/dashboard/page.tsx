import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { Button } from "@/components/ui/Button";
import { ThreadCard } from "@/components/features/ThreadCard";
import { Search, PlusCircle, MessageSquare, BookOpen, LogOut } from "lucide-react";

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
  
  const displayName = profile.preferred_name || profile.first_name || "Scholar";

  // 3. Fetch Requests with Joins
  // Note: We join with profiles for professor info and order by update_at
  const { data: requests, error: requestsError } = await supabase
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

  // Post-process requests to get the latest message snippet and map to polymorphic participant
  const processedRequests = (requests || []).map((req: any) => ({
    ...req,
    participant: {
      first_name: req.professor.first_name,
      last_name: req.professor.last_name,
      preferred_name: req.professor.preferred_name,
      detail: req.professor.expertise
    },
    latest_message: req.messages && req.messages.length > 0 
      ? req.messages.sort((a: any, b: any) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0] 
      : undefined
  }));

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-[280px] bg-[rgba(11,22,40,0.95)] border-r border-[rgba(155,175,192,0.1)] flex flex-col fixed inset-y-0 z-50">
        <div className="p-10">
          <Link href="/" className="font-serif text-2xl text-[var(--ivory)] hover:opacity-80 transition-opacity">
            Schol<span className="text-[var(--amber)]">lective</span>
          </Link>
        </div>

        <nav className="flex-grow px-6 space-y-1">
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[rgba(212,146,42,0.08)] text-[var(--ivory)] border border-[rgba(212,146,42,0.2)]">
            <BookOpen size={18} className="text-[var(--amber)]" />
            <span className="text-sm font-medium">Dashboard</span>
          </Link>
          <Link href="/professors" className="flex items-center gap-3 px-4 py-3 rounded-xl text-[var(--text-muted)] hover:bg-[rgba(255,255,255,0.04)] hover:text-[var(--ivory)] transition-all">
            <Search size={18} />
            <span className="text-sm font-medium">Browse Professors</span>
          </Link>
          <Link href="/messages" className="flex items-center gap-3 px-4 py-3 rounded-xl text-[var(--text-muted)] hover:bg-[rgba(255,255,255,0.04)] hover:text-[var(--ivory)] transition-all">
            <MessageSquare size={18} />
            <span className="text-sm font-medium">Messages</span>
          </Link>
        </nav>

        <div className="p-6 border-t border-[rgba(155,175,192,0.05)]">
          <button className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-[var(--text-muted)] hover:bg-red-500/10 hover:text-red-400 transition-all">
            <LogOut size={18} />
            <span className="text-sm font-medium">Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow pl-[280px]">
        <div className="p-12 max-w-7xl mx-auto">
          {/* Header */}
          <header className="flex justify-between items-end mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
            <div>
              <div className="text-[0.75rem] font-bold tracking-[0.15em] text-[var(--amber)] uppercase mb-2">Student Portal</div>
              <h1 className="font-serif text-4xl font-light text-[var(--ivory)]">
                Welcome back, <em className="italic text-[var(--amber-light)]">{displayName}</em>
              </h1>
              <p className="text-[var(--text-muted)] mt-2">Track your mentorship requests and active dialogues.</p>
            </div>
            <Link href="/request">
              <Button className="flex gap-2">
                <PlusCircle size={18} />
                New Request
              </Button>
            </Link>
          </header>

          {/* Active Threads Grid */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-serif text-[var(--ivory)] font-light">Active Mentorship Threads</h2>
              {processedRequests.length > 0 && (
                <span className="text-[0.7rem] text-[var(--text-muted)] uppercase tracking-widest">{processedRequests.length} total</span>
              )}
            </div>

            {processedRequests.length === 0 ? (
              /* Empty State */
              <div className="bg-[rgba(17,34,64,0.3)] border border-dashed border-[rgba(155,175,192,0.2)] rounded-[32px] p-16 text-center backdrop-blur-sm animate-in zoom-in-95 duration-700">
                <div className="w-16 h-16 bg-[rgba(212,146,42,0.1)] rounded-full flex items-center justify-center mx-auto mb-6 border border-[rgba(212,146,42,0.2)]">
                  <BookOpen size={28} className="text-[var(--amber)]" />
                </div>
                <h3 className="font-serif text-2xl text-[var(--ivory)] mb-3 font-light">Your dashboard is waiting</h3>
                <p className="text-[var(--text-muted)] max-w-[400px] mx-auto mb-8 leading-relaxed">
                  You haven't submitted any mentorship requests yet. Start your academic journey by connecting with one of our verified professors.
                </p>
                <Link href="/professors">
                  <Button variant="outline">Browse the Directory</Button>
                </Link>
              </div>
            ) : (
              /* Threads List */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
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
