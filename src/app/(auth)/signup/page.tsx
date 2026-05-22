"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { motion, useSpring, useMotionValue } from "framer-motion";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";
import { toast } from "sonner";

export const dynamic = "force-dynamic";

type Role = "student" | "professor";

/* ── Global Cinematic Easing ── */
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/* ── 3D Tilt Container for the Form ── */
function TiltContainer({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const moveX = (e.clientX - centerX) / (rect.width / 2);
    const moveY = (e.clientY - centerY) / (rect.height / 2);
    rotateX.set(-moveY * 3); // Subtle 3deg max tilt for larger form
    rotateY.set(moveX * 3);
  };

  const handleMouseLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  const springRotateX = useSpring(rotateX, { stiffness: 100, damping: 40 });
  const springRotateY = useSpring(rotateY, { stiffness: 100, damping: 40 });

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX: springRotateX, rotateY: springRotateY, transformPerspective: 2500 }}
      className={`will-change-transform ${className}`}
    >
      {children}
    </motion.div>
  );
}

const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 1.2, ease: EASE } }
};

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
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6 relative overflow-hidden py-24">
      
      {/* ── Background Noise ── */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-screen" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')" }} />

      {/* Floating ambient orb */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 3, ease: EASE }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] bg-white opacity-[0.02] rounded-full blur-[100px] pointer-events-none"
      />

      <motion.div
        initial="hidden"
        animate="show"
        variants={staggerContainer}
        className="relative z-10 w-full max-w-[500px]"
      >
        <TiltContainer>
          <div className="bg-[rgba(15,15,15,0.6)] backdrop-blur-3xl border border-[rgba(255,255,255,0.05)] rounded-[2rem] p-10 md:p-14 shadow-[0_50px_100px_rgba(0,0,0,0.8)] relative overflow-hidden">
            
            {/* Minimal Header */}
            <motion.div variants={fadeUp} className="text-center mb-14 relative z-10">
              <Link href="/" className="inline-block no-underline group mb-8">
                <span className="font-display text-sm md:text-lg font-bold text-[#888] tracking-[0.3em] uppercase group-hover:text-white transition-colors duration-500">
                  Schollective
                </span>
              </Link>
              <h1 className="font-display text-3xl md:text-5xl font-bold text-white tracking-tighter leading-none">
                Create Account
              </h1>
            </motion.div>

            {/* Role selector */}
            <motion.div variants={fadeUp} className="flex gap-4 mb-10 relative z-10">
              {(["student", "professor"] as Role[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={[
                    "flex-1 h-14 rounded-xl text-xs uppercase tracking-[0.2em] font-bold transition-all duration-500 relative overflow-hidden group/btn",
                    role === r
                      ? "bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.15)]"
                      : "bg-[rgba(0,0,0,0.4)] text-[#666] border border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.05)] hover:text-white",
                  ].join(" ")}
                >
                  <span className="relative z-10">{r === "student" ? "Student" : "Professor"}</span>
                </button>
              ))}
            </motion.div>

            <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
              <div className="grid grid-cols-2 gap-6">
                <motion.div variants={fadeUp} className="space-y-4">
                  <Label htmlFor="first_name" className="text-[#666] text-[0.6rem] uppercase tracking-[0.2em] font-bold">First Name</Label>
                  <Input id="first_name" name="first_name" placeholder="Jane" required className="bg-[rgba(0,0,0,0.4)] border-[rgba(255,255,255,0.05)] focus:border-[rgba(255,255,255,0.2)] transition-all duration-500 h-14 text-white rounded-xl" />
                </motion.div>
                <motion.div variants={fadeUp} className="space-y-4">
                  <Label htmlFor="last_name" className="text-[#666] text-[0.6rem] uppercase tracking-[0.2em] font-bold">Last Name</Label>
                  <Input id="last_name" name="last_name" placeholder="Doe" required={role === "professor"} className="bg-[rgba(0,0,0,0.4)] border-[rgba(255,255,255,0.05)] focus:border-[rgba(255,255,255,0.2)] transition-all duration-500 h-14 text-white rounded-xl" />
                </motion.div>
              </div>

              <motion.div variants={fadeUp} className="space-y-4">
                <Label htmlFor="preferred_name" className="text-[#666] text-[0.6rem] uppercase tracking-[0.2em] font-bold">Preferred Name (optional)</Label>
                <Input id="preferred_name" name="preferred_name" placeholder="Janey" className="bg-[rgba(0,0,0,0.4)] border-[rgba(255,255,255,0.05)] focus:border-[rgba(255,255,255,0.2)] transition-all duration-500 h-14 text-white rounded-xl" />
              </motion.div>

              <motion.div variants={fadeUp} className="space-y-4">
                <Label htmlFor="email" className="text-[#666] text-[0.6rem] uppercase tracking-[0.2em] font-bold">{role === "professor" ? "Work Email" : "Institutional Email"}</Label>
                <Input id="email" name="email" type="email" placeholder="jane@university.edu" required className="bg-[rgba(0,0,0,0.4)] border-[rgba(255,255,255,0.05)] focus:border-[rgba(255,255,255,0.2)] transition-all duration-500 h-14 text-white rounded-xl" />
              </motion.div>

              {role === "student" ? (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-4 overflow-hidden">
                  <Label htmlFor="education_level" className="text-[#666] text-[0.6rem] uppercase tracking-[0.2em] font-bold">Education Level</Label>
                  <Select id="education_level" name="education_level" required className="bg-[rgba(0,0,0,0.4)] border-[rgba(255,255,255,0.05)] focus:border-[rgba(255,255,255,0.2)] transition-all duration-500 h-14 text-white rounded-xl text-sm">
                    <option value="high-school">High School</option>
                    <option value="college">College / Undergraduate</option>
                    <option value="graduate">Graduate (Masters/PhD)</option>
                  </Select>
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-8 overflow-hidden">
                  <div className="space-y-4">
                    <Label htmlFor="institution" className="text-[#666] text-[0.6rem] uppercase tracking-[0.2em] font-bold">Institution</Label>
                    <Input id="institution" name="institution" placeholder="e.g. Stanford University" required className="bg-[rgba(0,0,0,0.4)] border-[rgba(255,255,255,0.05)] focus:border-[rgba(255,255,255,0.2)] transition-all duration-500 h-14 text-white rounded-xl" />
                  </div>
                  <div className="space-y-4">
                    <Label htmlFor="expertise" className="text-[#666] text-[0.6rem] uppercase tracking-[0.2em] font-bold">Expertise Fields</Label>
                    <Input id="expertise" name="expertise" placeholder="e.g. Machine Learning, Bio-Ethics" required className="bg-[rgba(0,0,0,0.4)] border-[rgba(255,255,255,0.05)] focus:border-[rgba(255,255,255,0.2)] transition-all duration-500 h-14 text-white rounded-xl" />
                  </div>
                </motion.div>
              )}

              <motion.div variants={fadeUp} className="space-y-4">
                <Label htmlFor="password" className="text-[#666] text-[0.6rem] uppercase tracking-[0.2em] font-bold">Password</Label>
                <Input id="password" name="password" type="password" placeholder="••••••••" required className="bg-[rgba(0,0,0,0.4)] border-[rgba(255,255,255,0.05)] focus:border-[rgba(255,255,255,0.2)] transition-all duration-500 h-14 text-white rounded-xl" />
              </motion.div>

              {error && (
                <motion.p 
                  initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                  className="text-[#ff6b6b] text-xs leading-relaxed bg-[rgba(255,107,107,0.1)] p-4 rounded-xl border border-[rgba(255,107,107,0.2)]"
                >
                  {error}
                </motion.p>
              )}

              <motion.div variants={fadeUp}>
                <Button type="submit" className="w-full h-14 rounded-xl text-xs tracking-[0.2em] uppercase font-bold bg-white text-black hover:bg-gray-200 transition-all duration-500 shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] mt-6" disabled={loading}>
                  {loading
                    ? "Creating account…"
                    : "Enter Pipeline"}
                </Button>
              </motion.div>
            </form>

            <motion.p variants={fadeUp} className="text-center text-[#555] text-[0.65rem] uppercase tracking-[0.2em] font-bold mt-12 relative z-10">
              Already joined?{" "}
              <Link href="/login" className="text-white hover:text-gray-300 transition-colors">
                Log In
              </Link>
            </motion.p>
          </div>
        </TiltContainer>
      </motion.div>
    </div>
  );
}
