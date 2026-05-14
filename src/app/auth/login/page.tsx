"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { toast } from "sonner";

export const dynamic = 'force-dynamic';

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
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      toast.success("Welcome back!");

      // Fetch user role from profiles table to determine redirection
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, status")
        .eq("id", data.user.id)
        .single();

      if (profileError) throw profileError;

      // Handle redirection based on role and status
      if (profile.role === "professor") {
        if (profile.status === "approved") {
          router.push("/prof/dashboard");
        } else {
          router.push("/prof/pending");
        }
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
    <div className="min-h-screen flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,rgba(212,146,42,0.05),transparent),radial-gradient(circle_at_bottom_left,rgba(61,122,107,0.05),transparent)]">
      <div className="w-full max-w-[440px] bg-[rgba(17,34,64,0.7)] border border-[rgba(212,146,42,0.16)] rounded-[32px] p-10 backdrop-blur-3xl shadow-[0_40px_100px_rgba(0,0,0,0.4)] animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6 hover:opacity-80 transition-opacity">
            <div className="font-serif text-2xl text-[var(--ivory)]">Schol<span className="text-[var(--amber)]">lective</span></div>
          </Link>
          <h1 className="font-serif text-3xl font-light text-[var(--ivory)] mb-2">Welcome back</h1>
          <p className="text-sm text-[var(--text-muted)]">Sign in to continue your academic journey.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1.5">
            <Label htmlFor="email">Institutional Email</Label>
            <Input id="email" name="email" type="email" placeholder="name@university.edu" required />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link href="#" className="text-xs text-[var(--text-muted)] hover:text-[var(--amber)] transition-colors mb-2">
                Forgot password?
              </Link>
            </div>
            <Input id="password" name="password" type="password" placeholder="••••••••" required />
          </div>

          {error && (
            <p className="text-red-400 text-xs mt-2">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <p className="text-center text-[var(--text-muted)] text-sm mt-8">
          Don&apos;t have an account?{" "}
          <Link href="/auth/signup" className="text-[var(--amber)] hover:underline font-medium">
            Join Schollective
          </Link>
        </p>
      </div>
    </div>
  );
}
