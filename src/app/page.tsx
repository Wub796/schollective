"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function LandingPage() {
  const heroRef = useRef<HTMLElement>(null);
  const clusterRef = useRef<HTMLDivElement>(null);
  const orbRef = useRef<HTMLDivElement>(null);
  const lottieRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Mouse Parallax System
    const handleMouseMove = (e: MouseEvent) => {
      if (!heroRef.current || !clusterRef.current || !orbRef.current) return;

      const rect = heroRef.current.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width;
      const ny = (e.clientY - rect.top) / rect.height;
      const targetNX = (nx - 0.5) * 2;
      const targetNY = (ny - 0.5) * 2;

      // Orb movement
      orbRef.current.style.left = `${e.clientX}px`;
      orbRef.current.style.top = `${e.clientY}px`;

      // Card Cluster 3D Rotation
      const MAX_ROT = 8;
      const rotY = targetNX * MAX_ROT;
      const rotX = -targetNY * MAX_ROT * 0.6;
      clusterRef.current.style.transform = `rotateY(${rotY}deg) rotateX(${rotX}deg)`;

      // Per-card translation based on data-depth
      const cards = clusterRef.current.querySelectorAll<HTMLDivElement>("[data-depth]");
      cards.forEach((card) => {
        const depth = parseFloat(card.getAttribute("data-depth") || "10");
        const tx = targetNX * depth;
        const ty = targetNY * depth;
        card.style.transform = `translateX(${tx}px) translateY(${ty}px)`;
      });
    };

    window.addEventListener("mousemove", handleMouseMove);

    // 2. Lottie Animation System
    let lottieInstance: any;
    if (typeof window !== "undefined") {
      import("lottie-web").then((lottie) => {
        if (lottieRef.current) {
          lottieInstance = lottie.default.loadAnimation({
            container: lottieRef.current,
            renderer: "svg",
            loop: true,
            autoplay: true,
            animationData: {
              v: '5.9.0', fr: 60, ip: 0, op: 240, w: 200, h: 200, nm: 'schollective-orbit', ddd: 0, assets: [],
              layers: [
                { ddd: 0, ind: 1, ty: 4, nm: 'ring-outer', sr: 1, bm: 0, ks: { o: { a: 0, k: 25 }, r: { a: 1, k: [{ t: 0, s: [0], e: [-360] }, { t: 240, s: [-360] }] }, p: { a: 0, k: [100, 100, 0] }, a: { a: 0, k: [0, 0, 0] }, s: { a: 0, k: [100, 100, 100] } }, shapes: [{ ty: 'el', nm: 'outer-el', s: { a: 0, k: [168, 168] }, p: { a: 0, k: [0, 0] } }, { ty: 'st', nm: 'outer-st', c: { a: 0, k: [0.239, 0.478, 0.416, 1] }, o: { a: 0, k: 100 }, w: { a: 0, k: 1 }, lc: 2, lj: 2, d: [{ n: 'd', v: { a: 0, k: 6 } }, { n: 'g', v: { a: 0, k: 16 } }] }], ip: 0, op: 240, st: 0 },
                { ddd: 0, ind: 2, ty: 4, nm: 'ring-inner', sr: 1, bm: 0, ks: { o: { a: 0, k: 45 }, r: { a: 1, k: [{ t: 0, s: [0], e: [360] }, { t: 240, s: [360] }] }, p: { a: 0, k: [100, 100, 0] }, a: { a: 0, k: [0, 0, 0] }, s: { a: 0, k: [100, 100, 100] } }, shapes: [{ ty: 'el', nm: 'inner-el', s: { a: 0, k: [104, 104] }, p: { a: 0, k: [0, 0] } }, { ty: 'st', nm: 'inner-st', c: { a: 0, k: [0.831, 0.573, 0.165, 1] }, o: { a: 0, k: 100 }, w: { a: 0, k: 1.5 }, lc: 2, lj: 2, d: [{ n: 'd', v: { a: 0, k: 18 } }, { n: 'g', v: { a: 0, k: 8 } }] }], ip: 0, op: 240, st: 0 },
                { ddd: 0, ind: 5, ty: 4, nm: 'center-dot', sr: 1, bm: 0, ks: { o: { a: 0, k: 100 }, r: { a: 0, k: 0 }, p: { a: 0, k: [100, 100, 0] }, a: { a: 0, k: [0, 0, 0] }, s: { a: 1, k: [{ t: 0, s: [100, 100], e: [118, 118] }, { t: 120, s: [118, 118], e: [100, 100] }, { t: 240, s: [100, 100] }] } }, shapes: [{ ty: 'el', s: { a: 0, k: [26, 26] }, p: { a: 0, k: [0, 0] } }, { ty: 'fl', c: { a: 0, k: [0.831, 0.573, 0.165, 1] }, o: { a: 0, k: 100 }, r: 1 }], ip: 0, op: 240, st: 0 }
              ]
            }
          });
          lottieInstance.setSpeed(0.7);
        }
      });
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (lottieInstance) lottieInstance.destroy();
    };
  }, []);

  return (
    <div className="relative">
      {/* Navigation */}
      <nav id="navbar" className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-16 py-5 bg-[rgba(11,22,40,0.72)] backdrop-blur-xl border-b border-[rgba(212,146,42,0.1)] transition-all">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 relative flex items-center justify-center bg-[var(--amber)] rounded-lg font-serif text-[var(--navy)] text-xl font-bold animate-pulse">S</div>
          <div className="font-serif text-2xl text-[var(--ivory)] font-medium">Schol<span className="text-[var(--amber)]">lective</span></div>
        </Link>
        <ul className="hidden lg:flex items-center gap-10 list-none">
          <li><Link href="#how" className="text-sm text-[var(--text-muted)] hover:text-[var(--ivory)] transition-colors">How it works</Link></li>
          <li><Link href="/professors" className="text-sm text-[var(--text-muted)] hover:text-[var(--ivory)] transition-colors">Browse Professors</Link></li>
          <li><Link href="#features" className="text-sm text-[var(--text-muted)] hover:text-[var(--ivory)] transition-colors">Features</Link></li>
        </ul>
        <div className="flex items-center gap-4">
          <Link href="/auth/login">
            <Button variant="ghost" size="sm">Log in</Button>
          </Link>
          <Link href="/auth/signup">
            <Button size="sm">Get started free</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex items-center px-16 pt-32 pb-24 overflow-hidden perspective-[1200px]">
        <div className="absolute inset-0 z-[-1] bg-[radial-gradient(ellipse_80%_60%_at_70%_40%,rgba(212,146,42,0.07),transparent_70%),radial-gradient(ellipse_60%_80%_at_20%_70%,rgba(61,122,107,0.08),transparent_65%),linear-gradient(180deg,#0B1628,#0D1E35)]">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(212,146,42,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(212,146,42,0.035)_1px,transparent_1px)] bg-[size:80px_80px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black,transparent)]"></div>
        </div>
        
        <div ref={orbRef} className="absolute w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(212,146,42,0.04),transparent_70%)] pointer-events-none -translate-x-1/2 -translate-y-1/2 transition-[left,top] duration-[1200ms] ease-out z-0"></div>

        <div className="max-w-[680px] relative z-[2] animate-in fade-in slide-in-from-bottom-12 duration-1000">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[rgba(212,146,42,0.09)] border border-[rgba(212,146,42,0.22)] text-[var(--amber)] text-[0.78rem] font-medium tracking-widest uppercase mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--amber)] animate-pulse"></span>
            Now open for students & professors
          </div>
          <h1 className="font-serif text-[clamp(3rem,5.5vw,5.2rem)] font-light leading-[1.08] text-[var(--ivory)] mb-7">
            Academic mentorship,<br /><em className="italic text-[var(--amber-light)]">finally democratized</em>
          </h1>
          <p className="text-lg font-light text-[var(--text-muted)] max-w-[520px] leading-relaxed mb-10">
            Schollective connects students directly with verified professors for structured guidance, research help, and intellectual mentorship — free of charge, free of barriers.
          </p>
          <div className="flex items-center gap-5 mb-5 flex-wrap">
            <Link href="/auth/signup">
              <Button size="lg">Start as a student</Button>
            </Link>
            <Link href="/auth/signup">
              <Button variant="ghost" size="lg">Join as a professor</Button>
            </Link>
          </div>
          <p className="text-xs text-[var(--text-muted)] opacity-60">✦ Free for students &nbsp;·&nbsp; Volunteer-based &nbsp;·&nbsp; No cold emails</p>
        </div>

        {/* 3D Card Cluster */}
        <div className="absolute right-16 top-1/2 -translate-y-1/2 w-[min(480px,40vw)] z-[2] hidden lg:block animate-in fade-in slide-in-from-bottom-12 delay-200 duration-1000 preserve-3d">
          <div ref={clusterRef} className="relative h-[480px] preserve-3d transition-transform duration-500 ease-out">
            
            {/* Dr. Rachel Kim Card */}
            <div data-depth="18" className="absolute top-[4%] right-[-10px] w-[210px] bg-[rgba(17,34,64,0.82)] border border-[rgba(212,146,42,0.14)] rounded-[18px] p-5 backdrop-blur-3xl shadow-2xl transition-all duration-500 hover:border-[rgba(212,146,42,0.3)] z-[2]">
              <div className="text-[0.68rem] font-medium tracking-widest text-[var(--text-muted)] uppercase mb-3">Professor profile</div>
              <div className="w-10 h-10 rounded-full bg-[rgba(212,146,42,0.18)] text-[var(--amber-light)] flex items-center justify-center font-serif text-lg mb-3">DR</div>
              <div className="font-serif text-lg text-[var(--ivory)] mb-1">Dr. Rachel Kim</div>
              <div className="text-[0.78rem] text-[var(--text-muted)] mb-3">Computational Biology · MIT</div>
              <div className="flex gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[rgba(212,146,42,0.1)] text-[var(--amber-light)] border border-[rgba(212,146,42,0.18)] text-[0.68rem]">Available now</span>
              </div>
            </div>

            {/* Main Request Card */}
            <div data-depth="8" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[290px] bg-[rgba(17,34,64,0.82)] border border-[rgba(212,146,42,0.28)] rounded-[18px] p-6 backdrop-blur-3xl shadow-2xl transition-all duration-500 hover:border-[rgba(212,146,42,0.5)] z-[3]">
              <div className="text-[0.68rem] font-medium tracking-widest text-[var(--text-muted)] uppercase mb-3">New mentorship request</div>
              <div className="h-px bg-[rgba(155,175,192,0.08)] my-3"></div>
              <div className="text-[0.82rem] text-[var(--text-muted)] leading-relaxed">
                <strong className="text-[var(--ivory)] font-normal">Maya S.</strong> is asking for guidance on structuring a literature review for a machine learning thesis in healthcare applications.
              </div>
              <div className="flex gap-2 mt-4">
                <Button size="sm" className="text-[0.75rem] px-4 py-1.5">Accept</Button>
                <Button variant="ghost" size="sm" className="text-[0.75rem] px-4 py-1.5">View</Button>
              </div>
            </div>

            {/* Maya S. Card */}
            <div data-depth="13" className="absolute bottom-[6%] left-[-10px] w-[220px] bg-[rgba(17,34,64,0.82)] border border-[rgba(212,146,42,0.14)] rounded-[18px] p-5 backdrop-blur-3xl shadow-2xl transition-all duration-500 hover:border-[rgba(212,146,42,0.3)] z-[2]">
              <div className="w-10 h-10 rounded-full bg-[rgba(61,122,107,0.18)] text-[var(--sage-light)] flex items-center justify-center font-serif text-lg mb-3">MS</div>
              <div className="font-serif text-lg text-[var(--ivory)] mb-1">Maya S.</div>
              <div className="text-[0.78rem] text-[var(--text-muted)]">Graduate · CS</div>
              <div className="h-px bg-[rgba(155,175,192,0.08)] my-3"></div>
              <div className="text-[0.68rem] font-medium tracking-widest text-[var(--text-muted)] uppercase mb-2">Interests</div>
              <div className="flex gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[rgba(61,122,107,0.1)] text-[var(--sage-light)] border border-[rgba(91,160,144,0.18)] text-[0.68rem]">ML / AI</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Stats Band */}
      <div className="relative z-10 bg-[rgba(17,34,64,0.55)] border-y border-[rgba(212,146,42,0.09)] px-16 py-12 flex justify-center items-center">
        {[
          { num: "100%", label: "Free for students" },
          { num: "0", label: "Cold emails needed" },
          { num: "∞", label: "Fields of expertise" },
          { num: "24h", label: "Avg. response time" },
        ].map((stat, i) => (
          <div key={i} className={`flex-1 text-center px-8 ${i !== 3 ? 'border-r border-[rgba(155,175,192,0.08)]' : ''}`}>
            <div className="font-serif text-5xl font-light text-[var(--ivory)] mb-1">{stat.num.replace('%', '')}<span className="text-[var(--amber)]">{stat.num.includes('%') ? '%' : ''}</span></div>
            <div className="text-[0.78rem] tracking-widest text-[var(--text-muted)] uppercase">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* CTA Section */}
      <section className="relative text-center px-16 py-32 overflow-hidden bg-[radial-gradient(ellipse_70%_70%_at_50%_50%,rgba(212,146,42,0.055),transparent_70%)]">
        <div ref={lottieRef} className="mx-auto mb-8 w-[200px] h-[200px] relative z-10 filter drop-shadow-[0_0_18px_rgba(212,146,42,0.22)]"></div>
        
        <div className="relative z-10">
          <div className="text-[0.73rem] font-medium tracking-[0.12em] text-[var(--amber)] uppercase mb-4">Join Schollective</div>
          <h2 className="font-serif text-5xl font-light text-[var(--ivory)] mb-6 max-w-[700px] mx-auto leading-tight">
            The conversation<br /><em className="italic text-[var(--amber-light)]">starts here</em>
          </h2>
          <p className="text-[var(--text-muted)] max-w-[480px] mx-auto mb-10 text-lg leading-relaxed">
            Whether you're a student looking for guidance or a professor ready to give it — there's a place for you. Free, structured, built for real academic growth.
          </p>
          <div className="flex justify-center gap-5">
            <Link href="/signup">
              <Button size="lg">Get started — it's free</Button>
            </Link>
            <Button variant="ghost" size="lg">Learn more</Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-16 pt-16 pb-12 bg-[rgba(11,22,40,0.9)] border-t border-[rgba(155,175,192,0.07)]">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 mb-12 pb-12 border-b border-[rgba(155,175,192,0.07)]">
          <div className="lg:col-span-2">
            <div className="font-serif text-2xl text-[var(--ivory)] mb-4">Schol<span className="text-[var(--amber)]">lective</span></div>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed max-w-[280px]">
              A structured academic bridge connecting students and professors for meaningful, barrier-free mentorship.
            </p>
          </div>
          <div>
            <h4 className="text-[0.73rem] font-bold tracking-widest text-[var(--text-muted)] uppercase mb-5">Platform</h4>
            <ul className="flex flex-col gap-3 text-sm text-[var(--text-muted)]">
              <li><Link href="#" className="hover:text-[var(--ivory)] transition-colors">How it works</Link></li>
              <li><Link href="/professors" className="hover:text-[var(--ivory)] transition-colors">For students</Link></li>
              <li><Link href="#" className="hover:text-[var(--ivory)] transition-colors">For professors</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[0.73rem] font-bold tracking-widest text-[var(--text-muted)] uppercase mb-5">Account</h4>
            <ul className="flex flex-col gap-3 text-sm text-[var(--text-muted)]">
              <li><Link href="/signup" className="hover:text-[var(--ivory)] transition-colors">Sign up free</Link></li>
              <li><Link href="/login" className="hover:text-[var(--ivory)] transition-colors">Log in</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[0.73rem] font-bold tracking-widest text-[var(--text-muted)] uppercase mb-5">Contact</h4>
            <ul className="flex flex-col gap-3 text-sm text-[var(--text-muted)]">
              <li><Link href="#" className="hover:text-[var(--ivory)] transition-colors">About us</Link></li>
              <li><Link href="#" className="hover:text-[var(--ivory)] transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-[0.8rem] text-[var(--text-muted)] opacity-50">
          <div>© 2025 Schollective. All rights reserved.</div>
          <div>Built with <span className="text-[var(--amber)] opacity-100">♥</span> for academic equity</div>
        </div>
      </footer>
    </div>
  );
}
