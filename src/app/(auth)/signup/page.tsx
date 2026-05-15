"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";
import { toast } from "sonner";

export const dynamic = "force-dynamic";

type Role = "student" | "professor";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [role, setRole] = useState<Role>("student");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email: formData.get("email") as string,
        password: formData.get("password") as string,
        options: {
          data: {
            role,
            first_name: formData.get("first_name") as string,
            preferred_name: formData.get("preferred_name") as string,
            last_name: formData.get("last_name") as string,
            education_level: formData.get("education_level") as string,
            institution: formData.get("institution") as string,
            expertise: formData.get("expertise") as string,
          },
        },
      });

      if (signUpError) throw signUpError;
      toast.success("Account created!");
      router.push(role === "professor" ? "/prof/pending" : "/dashboard");
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : "An error occurred during signup.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Static grid bg */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg,rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
        aria-hidden="true"
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-[480px] bg-[#111111] border border-[rgba(255,255,255,0.07)] rounded-2xl p-10 shadow-[0_48px_100px_rgba(0,0,0,0.7)] my-10"
      >
        {/* Wordmark */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block no-underline">
            <span className="font-display text-2xl font-bold text-[#f2f2f0]">Schollective</span>
          </Link>
          <h1 className="font-display text-2xl font-semibold text-[#d4d4d2] mt-5 mb-2">
            Create account
          </h1>
          <p className="text-sm text-[#4a4a4a] font-light">Join a community of academic growth.</p>
        </div>

        {/* Role selector */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {(["student", "professor"] as Role[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={[
                "p-4 rounded-xl border text-left transition-all duration-200",
                role === r
                  ? "border-[rgba(255,255,255,0.18)] bg-[rgba(255,255,255,0.06)]"
                  : "border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.04)]",
              ].join(" ")}
            >
              <div className="text-lg mb-1">{r === "student" ? "🎓" : "🧑‍🏫"}</div>
              <div className="text-[0.7rem] uppercase tracking-widest font-bold text-[#8a8a8a]">
                {r === "student" ? "Student" : "Professor"}
              </div>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name</Label>
              <Input id="first_name" name="first_name" placeholder="Jane" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input id="last_name" name="last_name" placeholder="Doe" required={role === "professor"} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="preferred_name">Preferred Name (optional)</Label>
            <Input id="preferred_name" name="preferred_name" placeholder="Janey" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{role === "professor" ? "Work Email" : "Institutional Email"}</Label>
            <Input id="email" name="email" type="email" placeholder="jane@university.edu" required />
          </div>

          {role === "student" ? (
            <div className="space-y-2">
              <Label htmlFor="education_level">Education Level</Label>
              <Select id="education_level" name="education_level" required>
                <option value="high-school">High School</option>
                <option value="college">College / Undergraduate</option>
                <option value="graduate">Graduate (Masters/PhD)</option>
              </Select>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="institution">Institution</Label>
                <Input id="institution" name="institution" placeholder="e.g. Stanford University" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expertise">Expertise Fields</Label>
                <Input id="expertise" name="expertise" placeholder="e.g. Machine Learning, Bio-Ethics" required />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" placeholder="••••••••" required />
          </div>

          {error && <p className="text-[#ff6b6b] text-xs leading-relaxed">{error}</p>}

          <Button type="submit" className="w-full mt-2" disabled={loading}>
            {loading
              ? "Creating account…"
              : role === "student"
                ? "Sign Up as Student"
                : "Apply as Professor"}
          </Button>
        </form>

        <p className="text-center text-[#3a3a3a] text-xs mt-8">
          Already have an account?{" "}
          <Link href="/login" className="text-[#8a8a8a] hover:text-[#f2f2f0] transition-colors font-medium">
            Log in here
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
