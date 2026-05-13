"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";
import { toast } from "sonner";

type Role = "student" | "professor";

export default function SignupPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("student");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const firstName = formData.get("first_name") as string;
    const preferredName = formData.get("preferred_name") as string;
    const lastName = formData.get("last_name") as string;
    
    // Role-specific data
    const educationLevel = formData.get("education_level") as string;
    const institution = formData.get("institution") as string;
    const expertise = formData.get("expertise") as string;

    try {
      const { error: signUpError } = await supabase.auth.signUp({

        email,
        password,
        options: {
          data: {
            role,
            first_name: firstName,
            preferred_name: preferredName,
            last_name: lastName,
            education_level: educationLevel,
            institution: institution,
            expertise: expertise,
          },
        },
      });

      if (signUpError) throw signUpError;

      toast.success("Account created successfully!");

      // Handle post-signup routing
      if (role === "professor") {
        router.push("/prof/pending");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : "An error occurred during signup.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,rgba(212,146,42,0.05),transparent),radial-gradient(circle_at_bottom_left,rgba(61,122,107,0.05),transparent)]">
      <div className="w-full max-w-[500px] bg-[rgba(17,34,64,0.7)] border border-[rgba(212,146,42,0.16)] rounded-[32px] p-10 backdrop-blur-3xl shadow-[0_40px_100px_rgba(0,0,0,0.4)] animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6 hover:opacity-80 transition-opacity">
            <div className="font-serif text-2xl text-[var(--ivory)]">Schol<span className="text-[var(--amber)]">lective</span></div>
          </Link>
          <h1 className="font-serif text-3xl font-light text-[var(--ivory)] mb-2">Create account</h1>
          <p className="text-sm text-[var(--text-muted)]">Join a community of academic growth.</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <button
            type="button"
            onClick={() => setRole("student")}
            className={`p-4 rounded-2xl border transition-all duration-300 ${
              role === "student"
                ? "border-[var(--amber)] bg-[rgba(212,146,42,0.08)]"
                : "border-[rgba(155,175,192,0.1)] bg-[rgba(26,58,92,0.3)] hover:bg-[rgba(26,58,92,0.5)]"
            }`}
          >
            <div className="text-2xl mb-1">🎓</div>
            <div className="text-[0.7rem] uppercase tracking-wider font-bold text-[var(--ivory)]">Student</div>
          </button>
          <button
            type="button"
            onClick={() => setRole("professor")}
            className={`p-4 rounded-2xl border transition-all duration-300 ${
              role === "professor"
                ? "border-[var(--amber)] bg-[rgba(212,146,42,0.08)]"
                : "border-[rgba(155,175,192,0.1)] bg-[rgba(26,58,92,0.3)] hover:bg-[rgba(26,58,92,0.5)]"
            }`}
          >
            <div className="text-2xl mb-1">🧑‍🏫</div>
            <div className="text-[0.7rem] uppercase tracking-wider font-bold text-[var(--ivory)]">Professor</div>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="first_name">First Name</Label>
              <Input id="first_name" name="first_name" placeholder="Jane" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="last_name">Last Name {role === 'student' && '(Optional)'}</Label>
              <Input id="last_name" name="last_name" placeholder="Doe" required={role === 'professor'} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="preferred_name">Preferred Name (Optional)</Label>
            <Input id="preferred_name" name="preferred_name" placeholder="Janey" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">{role === 'professor' ? 'Work Email' : 'Institutional Email'}</Label>
            <Input id="email" name="email" type="email" placeholder="jane.doe@university.edu" required />
          </div>

          {role === 'student' ? (
            <div className="space-y-1.5">
              <Label htmlFor="education_level">Education Level</Label>
              <Select id="education_level" name="education_level" required>
                <option value="high-school">High School</option>
                <option value="college">College / Undergraduate</option>
                <option value="graduate">Graduate (Masters/PhD)</option>
              </Select>
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="institution">Current Institution</Label>
                <Input id="institution" name="institution" placeholder="e.g. Stanford University" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="expertise">Expertise Fields</Label>
                <Input id="expertise" name="expertise" placeholder="e.g. Machine Learning, Bio-Ethics" required />
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" placeholder="••••••••" required />
          </div>

          {error && (
            <p className="text-red-400 text-xs mt-2">{error}</p>
          )}

          <Button type="submit" className="w-full mt-4" disabled={loading}>
            {loading ? "Creating account..." : role === 'student' ? "Sign Up as Student" : "Apply as Professor"}
          </Button>
        </form>

        <p className="text-center text-[var(--text-muted)] text-sm mt-8">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-[var(--amber)] hover:underline font-medium">
            Log in here
          </Link>
        </p>
      </div>
    </div>
  );
}
