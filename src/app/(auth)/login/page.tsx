"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { toast } from "sonner";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      toast.success("Welcome back.");

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, status")
        .eq("id", data.user.id)
        .single();

      if (!profile) throw new Error("Profile not found.");

      if (profile.role === "professor") {
        router.push(profile.status === "approved" ? "/prof/dashboard" : "/prof/pending");
      } else if (profile.role === "admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : "An error occurred during sign in.";
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
        className="relative z-10 w-full max-w-[420px] bg-[#111111] border border-[rgba(255,255,255,0.07)] rounded-2xl p-10 shadow-[0_48px_100px_rgba(0,0,0,0.7)]"
      >
        {/* Wordmark */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-block no-underline">
            <span className="font-display text-2xl font-bold text-[#f2f2f0]">
              Schollective
            </span>
          </Link>
          <h1 className="font-display text-2xl font-semibold text-[#d4d4d2] mt-5 mb-2">
            Welcome back
          </h1>
          <p className="text-sm text-[#4a4a4a] font-light">
            Sign in to continue your academic journey.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Institutional Email</Label>
            <Input id="email" name="email" type="email" placeholder="name@university.edu" required />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link href="#" className="text-[0.65rem] text-[#3a3a3a] hover:text-[#8a8a8a] transition-colors mb-2">
                Forgot?
              </Link>
            </div>
            <Input id="password" name="password" type="password" placeholder="••••••••" required />
          </div>

          {error && (
            <p className="text-[#ff6b6b] text-xs leading-relaxed">{error}</p>
          )}

          <Button type="submit" className="w-full mt-2" disabled={loading}>
            {loading ? "Signing in…" : "Sign In"}
          </Button>
        </form>

        <p className="text-center text-[#3a3a3a] text-xs mt-8">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-[#8a8a8a] hover:text-[#f2f2f0] transition-colors font-medium">
            Join Schollective
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
