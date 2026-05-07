"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { motion, useSpring, useMotionValue } from "framer-motion";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { toast } from "sonner";

export const dynamic = "force-dynamic";

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
    rotateX.set(-moveY * 5); // Subtle 5deg max tilt
    rotateY.set(moveX * 5);
  };

  const handleMouseLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  const springRotateX = useSpring(rotateX, { stiffness: 100, damping: 30 });
  const springRotateY = useSpring(rotateY, { stiffness: 100, damping: 30 });

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX: springRotateX, rotateY: springRotateY, transformPerspective: 2000 }}
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
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6 relative overflow-hidden">
      
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
        className="relative z-10 w-full max-w-[440px]"
      >
        <TiltContainer>
          <div className="bg-[rgba(15,15,15,0.6)] backdrop-blur-3xl border border-[rgba(255,255,255,0.05)] rounded-[2rem] p-12 md:p-16 shadow-[0_50px_100px_rgba(0,0,0,0.8)] relative overflow-hidden">
            
            {/* Minimal Header */}
            <motion.div variants={fadeUp} className="text-center mb-16 relative z-10">
              <Link href="/" className="inline-block no-underline group mb-10">
                <span className="font-display text-lg font-bold text-[#888] tracking-[0.3em] uppercase group-hover:text-white transition-colors duration-500">
                  Schollective
                </span>
              </Link>
              <h1 className="font-display text-4xl md:text-5xl font-bold text-white tracking-tighter leading-none">
                Log In
              </h1>
            </motion.div>

            <form onSubmit={handleSubmit} className="space-y-10 relative z-10">
              
              <motion.div variants={fadeUp} className="space-y-4">
                <Label htmlFor="email" className="text-[#666] text-[0.65rem] uppercase tracking-[0.2em] font-bold">Institutional Email</Label>
                <Input 
                  id="email" 
                  name="email" 
                  type="email" 
                  placeholder="name@university.edu" 
                  required 
                  className="bg-[rgba(0,0,0,0.4)] border-[rgba(255,255,255,0.05)] focus:border-[rgba(255,255,255,0.2)] focus:ring-[rgba(255,255,255,0.05)] transition-all duration-500 h-14 text-white text-base rounded-xl"
                />
              </motion.div>

              <motion.div variants={fadeUp} className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-[#666] text-[0.65rem] uppercase tracking-[0.2em] font-bold">Password</Label>
                  <Link href="#" className="text-[0.6rem] uppercase tracking-[0.1em] text-[#555] hover:text-[#aaa] transition-colors font-bold">
                    Forgot?
                  </Link>
                </div>
                <Input 
                  id="password" 
                  name="password" 
                  type="password" 
                  placeholder="••••••••" 
                  required 
                  className="bg-[rgba(0,0,0,0.4)] border-[rgba(255,255,255,0.05)] focus:border-[rgba(255,255,255,0.2)] focus:ring-[rgba(255,255,255,0.05)] transition-all duration-500 h-14 text-white text-base rounded-xl"
                />
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
                <Button type="submit" className="w-full h-14 rounded-xl text-xs tracking-[0.2em] uppercase font-bold bg-white text-black hover:bg-gray-200 transition-all duration-500 shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] mt-4" disabled={loading}>
                  {loading ? "Authenticating…" : "Enter"}
                </Button>
              </motion.div>
            </form>

            <motion.p variants={fadeUp} className="text-center text-[#555] text-[0.65rem] uppercase tracking-[0.2em] font-bold mt-12 relative z-10">
              New here?{" "}
              <Link href="/signup" className="text-white hover:text-gray-300 transition-colors">
                Create Account
              </Link>
            </motion.p>
          </div>
        </TiltContainer>
      </motion.div>
    </div>
  );
}
