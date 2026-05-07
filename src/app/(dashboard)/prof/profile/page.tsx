import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProfessorProfilePage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .single();

  if (!profile || profile.role !== "professor") redirect("/dashboard");

  return (
    <div className="py-10 lg:py-16 space-y-10">
      {/* Header */}
      <header>
        <p className="text-[0.62rem] font-bold tracking-[0.25em] text-[#3a3a3a] uppercase mb-3">
          Profile Management
        </p>
        <h1 className="font-display text-4xl lg:text-5xl font-bold text-[#f2f2f0] leading-tight mb-4">
          Edit Academic <em className="italic text-[#5a5a5a]">Credentials</em>
        </h1>
        <p className="text-[#4a4a4a] text-base font-light max-w-xl leading-relaxed">
          Update your expertise, institution, and availability to help students find you more effectively.
        </p>
      </header>

      {/* Form */}
      <div className="bg-[#111111] border border-[rgba(255,255,255,0.06)] rounded-2xl p-8 md:p-12 max-w-2xl">
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
            <Label>Expertise Fields (comma separated)</Label>
            <Input
              defaultValue={profile.expertise_fields?.join(", ")}
              placeholder="e.g. Quantum Computing, AI Ethics"
            />
          </div>
          <div className="pt-2">
            <Button>Save Changes</Button>
          </div>
        </form>
      </div>

      {/* Verification status */}
      <div className="flex items-center justify-between gap-6 max-w-2xl bg-[#111111] border border-[rgba(255,255,255,0.06)] rounded-xl p-5">
        <div className="flex items-center gap-3">
          <ShieldCheck size={20} className="text-[#4a4a4a]" />
          <div>
            <div className="text-xs font-semibold text-[#d4d4d2] uppercase tracking-widest mb-0.5">
              Account Status
            </div>
            <div className="text-[0.72rem] text-[#5a5a5a]">Verified Professor</div>
          </div>
        </div>
        <div className="text-[0.65rem] text-[#2e2e2e] font-light">
          Last verified: {new Date(profile.updated_at).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}
