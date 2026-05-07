import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { User, ShieldCheck } from "lucide-react";

export default async function ProfessorProfilePage() {
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

  if (!profile || profile.role !== 'professor') {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen bg-[var(--navy)]">
      <Sidebar role="professor" />

      {/* Main Content */}
      <main className="flex-grow lg:pl-[280px]">
        <div className="content-container py-12 lg:py-20">
          
          {/* Header */}
          <header className="mb-16 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[rgba(212,146,42,0.1)] border border-[rgba(212,146,42,0.2)] text-[var(--amber)] text-[0.65rem] font-bold tracking-widest uppercase mb-4 w-fit">
              <User size={12} />
              Profile Management
            </div>
            <h1 className="font-serif text-4xl lg:text-5xl font-light text-[var(--ivory)] leading-tight">
              Edit Academic <em className="italic text-[var(--amber-light)]">Credentials</em>
            </h1>
            <p className="text-[var(--text-muted)] mt-4 text-lg font-light max-w-2xl">
              Update your expertise, institution, and availability to help students find you more effectively.
            </p>
          </header>

          {/* Form Section */}
          <div className="bg-[rgba(17,34,64,0.6)] border border-[rgba(155,175,192,0.1)] rounded-[32px] p-8 md:p-12 backdrop-blur-3xl shadow-2xl">
            <form className="space-y-8 max-w-2xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input defaultValue={profile.first_name} />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input defaultValue={profile.last_name} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Institution</Label>
                <Input defaultValue={profile.institution} placeholder="e.g. Stanford University" />
              </div>

              <div className="space-y-2">
                <Label>Expertise Fields (Comma separated)</Label>
                <Input defaultValue={profile.expertise_fields?.join(', ')} placeholder="e.g. Quantum Computing, AI Ethics" />
              </div>

              <div className="pt-4">
                <Button className="w-full md:w-auto px-10">Save Changes</Button>
              </div>
            </form>
          </div>

          {/* Verification Status */}
          <div className="mt-12 bg-[rgba(61,122,107,0.05)] border border-[rgba(61,122,107,0.15)] rounded-2xl p-6 flex items-center justify-between gap-6 max-w-2xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[rgba(61,122,107,0.1)] flex items-center justify-center text-[var(--sage-light)] border border-[rgba(61,122,107,0.2)]">
                <ShieldCheck size={24} />
              </div>
              <div>
                <div className="text-sm font-bold text-[var(--ivory)] uppercase tracking-wider">Account Status</div>
                <div className="text-[var(--sage-light)] text-sm font-medium">Verified Professor</div>
              </div>
            </div>
            <div className="text-[0.7rem] text-[var(--text-muted)] italic font-light">
              Last verified: {new Date(profile.updated_at).toLocaleDateString()}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
