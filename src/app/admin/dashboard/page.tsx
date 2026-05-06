import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { AdminReviewTable } from "@/components/features/AdminReviewTable";
import { LayoutDashboard, Users, ShieldAlert, LogOut, Settings } from "lucide-react";

export default async function AdminDashboard() {
  const supabase = await createClient();

  // 1. Authenticate Session & Role
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    // If not admin, redirect to respective dashboard
    const fallback = profile?.role === 'professor' ? '/prof/dashboard' : '/dashboard';
    redirect(fallback);
  }

  // 2. Fetch Pending Professor Applications
  const { data: pendingProfessors, error } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, preferred_name, email, institution, expertise_fields")
    .eq("role", "professor")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Fetch pending professors error:", error);
  }

  return (
    <div className="flex min-h-screen bg-[var(--navy)] text-[var(--ivory)]">
      {/* Background Polish */}
      <div className="fixed inset-0 z-0 bg-[radial-gradient(circle_at_0%_0%,rgba(212,146,42,0.03),transparent_40%)] pointer-events-none"></div>

      {/* Sidebar */}
      <aside className="w-[280px] bg-[rgba(11,22,40,0.95)] border-r border-[rgba(155,175,192,0.1)] flex flex-col fixed inset-y-0 z-50">
        <div className="p-10">
          <Link href="/" className="font-serif text-2xl text-[var(--ivory)] hover:opacity-80 transition-opacity">
            Schol<span className="text-[var(--amber)]">lective</span>
          </Link>
        </div>

        <nav className="flex-grow px-6 space-y-1">
          <Link href="/admin/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[rgba(212,146,42,0.08)] text-[var(--ivory)] border border-[rgba(212,146,42,0.2)] transition-all">
            <LayoutDashboard size={18} className="text-[var(--amber)]" />
            <span className="text-sm font-medium">Approval Portal</span>
          </Link>
          <Link href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl text-[var(--text-muted)] hover:bg-[rgba(255,255,255,0.04)] hover:text-[var(--ivory)] transition-all">
            <Users size={18} />
            <span className="text-sm font-medium">User Directory</span>
          </Link>
          <Link href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl text-[var(--text-muted)] hover:bg-[rgba(255,255,255,0.04)] hover:text-[var(--ivory)] transition-all">
            <ShieldAlert size={18} />
            <span className="text-sm font-medium">Audit Logs</span>
          </Link>
          <Link href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl text-[var(--text-muted)] hover:bg-[rgba(255,255,255,0.04)] hover:text-[var(--ivory)] transition-all">
            <Settings size={18} />
            <span className="text-sm font-medium">Global Settings</span>
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
      <main className="flex-grow pl-[280px] relative z-10">
        <div className="p-12 lg:p-20 max-w-7xl mx-auto">
          
          {/* Header */}
          <header className="mb-16 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[0.75rem] font-bold tracking-[0.2em] text-[var(--amber)] uppercase mb-2">Internal Systems</div>
                <h1 className="font-serif text-4xl lg:text-5xl font-light text-[var(--ivory)] leading-tight">
                  Admin <em className="italic text-[var(--amber-light)]">Approval Portal</em>
                </h1>
                <p className="text-[var(--text-muted)] mt-4 text-lg font-light max-w-2xl">
                  Review and verify professor credentials to maintain the academic integrity of the Schollective network.
                </p>
              </div>
              <div className="hidden lg:flex items-center gap-4 bg-[rgba(17,34,64,0.5)] border border-[rgba(212,146,42,0.15)] rounded-2xl px-6 py-4 backdrop-blur-md">
                <div className="text-right">
                  <div className="text-[0.65rem] text-[var(--text-muted)] uppercase tracking-widest font-bold">Pending Count</div>
                  <div className="text-2xl font-serif text-[var(--amber)]">{pendingProfessors?.length || 0} Applicants</div>
                </div>
              </div>
            </div>
          </header>

          {/* Queue Section */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <Users size={20} className="text-[var(--amber)]" />
              <h2 className="text-xl font-serif text-[var(--ivory)] font-light">Application Queue</h2>
            </div>
            
            <AdminReviewTable applicants={(pendingProfessors || []) as any} />
          </section>

          {/* Footer Polish */}
          <footer className="mt-32 pt-12 border-t border-[rgba(155,175,192,0.05)] flex justify-between items-center text-[var(--text-muted)] text-xs uppercase tracking-widest opacity-50 font-medium">
            <div>Schollective Admin Engine v1.0</div>
            <div>Secure Environment · Academic Integrity First</div>
          </footer>
        </div>
      </main>
    </div>
  );
}
