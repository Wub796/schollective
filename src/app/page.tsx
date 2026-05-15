"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { 
  CheckCircle2, 
  Search, 
  MessageSquare, 
  ShieldCheck, 
  BarChart3, 
  Lock,
  ArrowRight,
  GraduationCap,
  Users
} from "lucide-react";

export default function LandingPage() {
  const heroRef = useRef<HTMLElement>(null);
  const clusterRef = useRef<HTMLDivElement>(null);
  const orbRef = useRef<HTMLDivElement>(null);
  const lottieRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const isTouch = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

    const handleMouseMove = (e: MouseEvent) => {
      if (isTouch || !heroRef.current || !clusterRef.current || !orbRef.current) return;

      const rect = heroRef.current.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width;
      const ny = (e.clientY - rect.top) / rect.height;
      const targetNX = (nx - 0.5) * 2;
      const targetNY = (ny - 0.5) * 2;

      orbRef.current.style.left = `${e.clientX}px`;
      orbRef.current.style.top = `${e.clientY}px`;

      const MAX_ROT = 8;
      const rotY = targetNX * MAX_ROT;
      const rotX = -targetNY * MAX_ROT * 0.6;
      clusterRef.current.style.transform = `rotateY(${rotY}deg) rotateX(${rotX}deg)`;

      const cards = clusterRef.current.querySelectorAll<HTMLDivElement>("[data-depth]");
      cards.forEach((card) => {
        const depth = parseFloat(card.getAttribute("data-depth") || "10");
        const tx = targetNX * depth;
        const ty = targetNY * depth;
        card.style.transform = `translateX(${tx}px) translateY(${ty}px)`;
      });
    };

    if (!isTouch) {
      window.addEventListener("mousemove", handleMouseMove);
    }

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
      <nav id="navbar" className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-4 sm:px-6 lg:px-8 py-5 bg-[rgba(11,22,40,0.72)] backdrop-blur-xl border-b border-[rgba(212,146,42,0.1)] transition-all">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 relative flex items-center justify-center bg-[var(--amber)] rounded-lg font-serif text-[var(--navy)] text-xl font-bold animate-pulse">S</div>
            <div className="font-serif text-2xl text-[var(--ivory)] font-medium">Schol<span className="text-[var(--amber)]">lective</span></div>
          </Link>
          <ul className="hidden lg:flex items-center gap-10 list-none">
            <li><Link href="#how" className="text-sm text-[var(--text-muted)] hover:text-[var(--ivory)] transition-colors">How it works</Link></li>
            <li><Link href="/professors" className="text-sm text-[var(--text-muted)] hover:text-[var(--ivory)] transition-colors">For students</Link></li>
            <li><Link href="#roles" className="text-sm text-[var(--text-muted)] hover:text-[var(--ivory)] transition-colors">For professors</Link></li>
            <li><Link href="/features" className="text-sm text-[var(--text-muted)] hover:text-[var(--ivory)] transition-colors">Features</Link></li>
          </ul>
          <div className="flex items-center gap-4">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <Link href="/auth/signup">
              <Button size="sm">Get started free</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex items-center px-4 sm:px-6 lg:px-8 pt-32 pb-24 overflow-hidden perspective-[1200px]">
        <div className="max-w-7xl mx-auto w-full relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
          <div className="absolute inset-0 z-[-1] bg-[radial-gradient(ellipse_80%_60%_at_70%_40%,rgba(212,146,42,0.07),transparent_70%),radial-gradient(ellipse_60%_80%_at_20%_70%,rgba(61,122,107,0.08),transparent_65%),linear-gradient(180deg,#0B1628,#0D1E35)] pointer-events-none">
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
            <p className="text-lg lg:text-xl font-light text-[var(--text-muted)] max-w-[520px] leading-relaxed mb-10">
              Schollective connects students directly with verified professors for structured guidance, research help, and intellectual mentorship &mdash; free of charge, free of barriers.
            </p>
            <div className="flex items-center gap-5 mb-5 flex-wrap">
              <Link href="/auth/signup">
                <Button size="lg">Start as a student</Button>
              </Link>
              <Link href="/auth/signup">
                <Button variant="ghost" size="lg">Join as a professor</Button>
              </Link>
            </div>
            <p className="text-xs text-[var(--text-muted)] opacity-60 font-medium tracking-wide italic">✦ Free for students &nbsp;·&nbsp; Volunteer-based &nbsp;·&nbsp; No cold emails</p>
          </div>

          <div className="w-[min(480px,40vw)] z-[2] hidden lg:block animate-in fade-in slide-in-from-bottom-12 delay-200 duration-1000 preserve-3d">
            <div ref={clusterRef} className="relative h-[480px] preserve-3d transition-transform duration-500 ease-out">
              <div data-depth="18" className="absolute top-[4%] right-[-10px] w-[210px] bg-[rgba(17,34,64,0.82)] border border-[rgba(212,146,42,0.14)] rounded-[18px] p-5 backdrop-blur-3xl shadow-2xl transition-all duration-500 hover:border-[rgba(212,146,42,0.3)] z-[2]">
                <div className="text-[0.68rem] font-medium tracking-widest text-[var(--text-muted)] uppercase mb-3">Professor profile</div>
                <div className="w-10 h-10 rounded-full bg-[rgba(212,146,42,0.18)] text-[var(--amber-light)] flex items-center justify-center font-serif text-lg mb-3 shadow-inner">RK</div>
                <div className="font-serif text-lg text-[var(--ivory)] mb-1">Dr. Rachel Kim</div>
                <div className="text-[0.78rem] text-[var(--text-muted)] mb-3">Computational Biology · MIT</div>
                <div className="flex gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[rgba(212,146,42,0.1)] text-[var(--amber-light)] border border-[rgba(212,146,42,0.18)] text-[0.68rem]">Available now</span>
                </div>
              </div>

              <div data-depth="8" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[290px] bg-[rgba(17,34,64,0.82)] border border-[rgba(212,146,42,0.28)] rounded-[18px] p-6 backdrop-blur-3xl shadow-2xl transition-all duration-500 hover:border-[rgba(212,146,42,0.5)] z-[3]">
                <div className="text-[0.68rem] font-medium tracking-widest text-[var(--text-muted)] uppercase mb-3">New mentorship request</div>
                <div className="h-px bg-[rgba(155,175,192,0.08)] my-3"></div>
                <div className="text-[0.82rem] text-[var(--text-muted)] leading-relaxed">
                  <strong className="text-[var(--ivory)] font-normal">Maya S.</strong> is asking for guidance on structuring a literature review for a machine learning thesis in healthcare applications.
                </div>
                <div className="flex gap-2 mt-4">
                  <Button size="sm" className="text-[0.75rem] px-4 py-1.5 shadow-none">Accept</Button>
                  <Button variant="ghost" size="sm" className="text-[0.75rem] px-4 py-1.5 shadow-none">View</Button>
                </div>
              </div>

              <div data-depth="13" className="absolute bottom-[6%] left-[-10px] w-[220px] bg-[rgba(17,34,64,0.82)] border border-[rgba(212,146,42,0.14)] rounded-[18px] p-5 backdrop-blur-3xl shadow-2xl transition-all duration-500 hover:border-[rgba(212,146,42,0.3)] z-[2]">
                <div className="w-10 h-10 rounded-full bg-[rgba(61,122,107,0.18)] text-[var(--sage-light)] flex items-center justify-center font-serif text-lg mb-3 shadow-inner">MS</div>
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
        </div>
      </section>

      {/* Stats Band */}
      <div className="relative z-10 bg-[rgba(17,34,64,0.55)] border-y border-[rgba(212,146,42,0.09)] px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-center items-center gap-12 lg:gap-8">
          {[
            { num: "100%", label: "Free for students" },
            { num: "0", label: "Cold emails needed" },
            { num: "∞", label: "Fields of expertise" },
            { num: "24h", label: "Avg. response time" },
          ].map((stat, i) => (
            <div key={i} className={`flex-1 text-center px-8 w-full md:w-auto ${i !== 3 ? 'md:border-r md:border-[rgba(155,175,192,0.08)]' : ''}`}>
              <div className="font-serif text-5xl lg:text-6xl font-light text-[var(--ivory)] mb-2">
                {stat.num.replace('%', '')}<span className="text-[var(--amber)]">{stat.num.includes('%') ? '%' : ''}</span>
              </div>
              <div className="text-[0.7rem] lg:text-[0.78rem] tracking-[0.2em] text-[var(--text-muted)] uppercase font-bold">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* How It Works Section */}
      <section id="how" className="py-24 lg:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden relative">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-12">
            <div>
              <div className="text-[0.7rem] font-bold tracking-[0.2em] text-[var(--amber)] uppercase mb-4">The Methodology</div>
              <h2 className="font-serif text-4xl lg:text-5xl font-light text-[var(--ivory)] leading-tight mb-6">
                From sign-up to<br /><em className="italic text-[var(--amber-light)]">meaningful dialogue</em>
              </h2>
              <p className="text-lg text-[var(--text-muted)] font-light leading-relaxed max-w-lg">
                We replaced academic cold-email culture with a system designed for clarity, safety, and genuine intellectual connection.
              </p>
            </div>

            <div className="space-y-10">
              {[
                { n: "1", t: "Create your profile", d: "Students sign up instantly. Professors apply and are manually verified using their institutional email address." },
                { n: "2", t: "Discover the right mentor", d: "Browse professors by academic field, research area, and current availability. Find someone who works in your domain." },
                { n: "3", t: "Submit a structured request", d: "Craft a focused mentorship request &mdash; not a cold email. The structure helps professors respond efficiently." },
                { n: "4", t: "Engage in guided dialogue", d: "Communicate through organized one-on-one threads. Real academic guidance, on your terms." },
              ].map((step) => (
                <div key={step.n} className="flex gap-6 animate-in fade-in slide-in-from-left-4 duration-700">
                  <div className="w-10 h-10 rounded-full border border-[var(--amber)]/30 flex items-center justify-center text-[var(--amber)] font-serif text-lg shrink-0 mt-1">
                    {step.n}
                  </div>
                  <div>
                    <h3 className="text-lg font-serif font-medium text-[var(--ivory)] mb-1.5">{step.t}</h3>
                    <p className="text-[var(--text-muted)] text-sm font-light leading-relaxed max-w-sm">{step.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative group lg:block hidden animate-in fade-in slide-in-from-right-8 duration-1000">
            <div className="absolute -inset-4 bg-[var(--amber)]/5 blur-3xl rounded-full transition-all group-hover:bg-[var(--amber)]/10" />
            <div className="relative bg-[rgba(17,34,64,0.6)] border border-[rgba(212,146,42,0.15)] rounded-[40px] p-8 backdrop-blur-3xl shadow-2xl">
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-[rgba(155,175,192,0.08)]">
                <div className="font-serif text-lg text-[var(--ivory)]">Incoming Requests</div>
                <div className="w-2 h-2 rounded-full bg-[var(--sage-light)] animate-pulse" />
              </div>
              
              <div className="space-y-4">
                {[
                  { n: "Alex T. · Undergrad", t: "2h ago", s: "new", c: "Guidance on quantum error correction for senior thesis" },
                  { n: "Priya M. · Graduate", t: "Yesterday", s: "pending", c: "Research methodology for cross-cultural NLP dataset" },
                  { n: "James L. · High school", t: "3 days ago", s: "done", c: "Feedback on biology olympiad research paper draft" },
                ].map((req, i) => (
                  <div key={i} className="bg-[rgba(26,58,92,0.4)] border border-[rgba(155,175,192,0.1)] rounded-2xl p-5 hover:border-[var(--amber)]/30 transition-colors">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[0.75rem] font-medium text-[var(--ivory)]">{req.n}</span>
                      <span className="text-[0.65rem] text-[var(--text-muted)]">{req.t}</span>
                    </div>
                    <p className="text-sm text-[var(--text-muted)] font-light leading-relaxed mb-3">&quot;{req.c}&quot;</p>
                    <div className={cn(
                      "inline-block px-2.5 py-0.5 rounded-full text-[0.6rem] font-bold uppercase tracking-wider border",
                      req.s === 'new' ? "bg-[rgba(61,122,107,0.1)] text-[var(--sage-light)] border-[rgba(61,122,107,0.2)]" :
                      req.s === 'pending' ? "bg-[rgba(212,146,42,0.1)] text-[var(--amber)] border-[rgba(212,146,42,0.2)]" :
                      "bg-[rgba(155,175,192,0.05)] text-[var(--text-muted)] border-[rgba(155,175,192,0.1)]"
                    )}>
                      {req.s === 'new' ? 'New Request' : req.s === 'pending' ? 'Awaiting Reply' : 'Resolved'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section id="roles" className="py-24 lg:py-32 px-4 sm:px-6 lg:px-8 relative bg-[rgba(17,34,64,0.3)]">
        <div className="max-w-7xl mx-auto text-center space-y-16">
          <div className="max-w-2xl mx-auto">
            <div className="text-[0.7rem] font-bold tracking-[0.2em] text-[var(--amber)] uppercase mb-4">Built forDialogue</div>
            <h2 className="font-serif text-4xl lg:text-5xl font-light text-[var(--ivory)] leading-tight mb-6">
              Built for <em>both sides</em><br />of the conversation
            </h2>
            <p className="text-lg text-[var(--text-muted)] font-light">Whether you&apos;re seeking knowledge or sharing it, Schollective structures the experience around you.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 text-left">
            {/* Students */}
            <div className="bg-[rgba(11,22,40,0.6)] border border-[rgba(155,175,192,0.1)] rounded-[40px] p-10 lg:p-12 transition-all hover:border-[var(--amber)]/20 hover:bg-[rgba(11,22,40,0.8)] relative group overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[var(--sage)] to-transparent opacity-50" />
              <div className="w-14 h-14 rounded-2xl bg-[rgba(61,122,107,0.1)] flex items-center justify-center text-2xl mb-8 border border-[rgba(61,122,107,0.2)]">🎓</div>
              <h3 className="font-serif text-3xl text-[var(--ivory)] mb-4 font-light">For Students</h3>
              <p className="text-[var(--text-muted)] font-light leading-relaxed mb-8">High school, undergraduate, or graduate &mdash; get direct access to professors without cold-emailing into the void.</p>
              <ul className="space-y-4 mb-10">
                {[
                  "Instant sign-up, no approval required",
                  "Browse professors by field and availability",
                  "Submit structured mentorship requests",
                  "Receive research feedback and guidance",
                ].map((f, i) => (
                  <li key={i} className="flex gap-3 text-sm text-[var(--text-muted)] font-light items-start">
                    <CheckCircle2 size={18} className="text-[var(--sage-light)] mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/auth/signup">
                <Button className="w-full py-4 text-sm font-bold uppercase tracking-widest shadow-none">Join as a student &rarr;</Button>
              </Link>
            </div>

            {/* Professors */}
            <div className="bg-[rgba(11,22,40,0.6)] border border-[rgba(155,175,192,0.1)] rounded-[40px] p-10 lg:p-12 transition-all hover:border-[var(--amber)]/20 hover:bg-[rgba(11,22,40,0.8)] relative group overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[var(--amber)] to-transparent opacity-50" />
              <div className="w-14 h-14 rounded-2xl bg-[rgba(212,146,42,0.1)] flex items-center justify-center text-2xl mb-8 border border-[rgba(212,146,42,0.2)]">🧑‍🏫</div>
              <h3 className="font-serif text-3xl text-[var(--ivory)] mb-4 font-light">For Professors</h3>
              <p className="text-[var(--text-muted)] font-light leading-relaxed mb-8">Volunteer-based. Share expertise on your own schedule, with full control over availability and topics.</p>
              <ul className="space-y-4 mb-10">
                {[
                  "Verified via institutional credentials",
                  "Set your own availability and limits",
                  "No spam &mdash; only structured requests",
                  "Expand academic impact beyond your institution",
                ].map((f, i) => (
                  <li key={i} className="flex gap-3 text-sm text-[var(--text-muted)] font-light items-start">
                    <CheckCircle2 size={18} className="text-[var(--amber)] mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/auth/signup">
                <Button variant="ghost" className="w-full py-4 text-sm font-bold uppercase tracking-widest border-2">Apply as a professor &rarr;</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section id="features" className="py-24 lg:py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="text-[0.7rem] font-bold tracking-[0.2em] text-[var(--amber)] uppercase mb-4">Core Infrastructure</div>
          <h2 className="font-serif text-4xl lg:text-5xl font-light text-[var(--ivory)] leading-tight mb-16">
            Everything you need,<br /><em className="italic text-[var(--amber-light)]">nothing you don&apos;t</em>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {[
              { i: Lock, t: "Role-locked accounts", d: "Roles are permanently assigned at onboarding &mdash; no confusion. The system always knows your domain." },
              { i: MessageSquare, t: "Structured messaging", d: "No unstructured spam. All communication happens through organized threads tied to specific requests." },
              { i: ShieldCheck, t: "Admin verification", d: "Every professor is manually approved using their institutional credentials &mdash; know who you're talking to." },
              { i: BarChart3, t: "Unified dashboard", d: "Track all requests, active conversations, and responses in one clean hub &mdash; tailored to your academic role." },
              { i: Search, t: "Professor discovery", d: "Browse and filter professors by field of expertise, institution, and real-time availability settings." },
              { i: ShieldCheck, t: "Safe, controlled access", d: "Same-role messaging is blocked by design. Professors decide whether to engage with each request." },
            ].map((f, i) => (
              <div key={i} className="bg-[rgba(17,34,64,0.4)] border border-[rgba(155,175,192,0.1)] rounded-[32px] p-8 text-left transition-all hover:border-[var(--amber)]/20 hover:bg-[rgba(17,34,64,0.6)] animate-in fade-in duration-700 delay-75 group">
                <f.i className="text-[var(--amber)] mb-6 transition-transform group-hover:scale-110" size={32} strokeWidth={1.5} />
                <h3 className="font-serif text-xl text-[var(--ivory)] mb-3 font-medium tracking-tight">{f.t}</h3>
                <p className="text-sm text-[var(--text-muted)] font-light leading-relaxed" dangerouslySetInnerHTML={{ __html: f.d }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative text-center px-4 sm:px-6 lg:px-8 py-32 lg:py-48 overflow-hidden bg-[radial-gradient(ellipse_70%_70%_at_50%_50%,rgba(212,146,42,0.055),transparent_70%)]">
        <div className="max-w-7xl mx-auto relative z-10">
          <div ref={lottieRef} className="mx-auto mb-10 w-[200px] h-[200px] relative z-10 filter drop-shadow-[0_0_18px_rgba(212,146,42,0.22)]"></div>
          
          <div className="text-[0.73rem] font-medium tracking-[0.25em] text-[var(--amber)] uppercase mb-6">Join Schollective</div>
          <h2 className="font-serif text-5xl lg:text-6xl font-light text-[var(--ivory)] mb-8 max-w-[800px] mx-auto leading-tight">
            The conversation<br /><em className="italic text-[var(--amber-light)]">starts here</em>
          </h2>
          <p className="text-[var(--text-muted)] max-w-[540px] mx-auto mb-12 text-lg lg:text-xl font-light leading-relaxed">
            Whether you&apos;re a student looking for guidance or a professor ready to give it &mdash; there&apos;s a place for you. Free, structured, built for real academic growth.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-5 mb-20">
            <Link href="/auth/signup" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto min-w-[240px] py-5 font-bold uppercase tracking-widest shadow-xl">Get started &mdash; it&apos;s free</Button>
            </Link>
            <Button variant="ghost" size="lg" className="w-full sm:w-auto min-w-[180px] py-5 font-bold uppercase tracking-widest border-2">Learn more</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 text-left">
             <div className="bg-[rgba(17,34,64,0.7)] border border-[rgba(155,175,192,0.1)] rounded-[24px] p-8 backdrop-blur-md transition-all hover:translate-y-[-4px]">
                <GraduationCap className="text-[var(--sage-light)] mb-4" size={24} />
                <h4 className="font-serif text-xl text-[var(--ivory)] mb-2 font-medium">For Students</h4>
                <p className="text-sm text-[var(--text-muted)] font-light leading-relaxed opacity-80">Instant sign-up · No approval needed · Direct mentor discovery</p>
             </div>
             <div className="bg-[rgba(17,34,64,0.7)] border border-[rgba(155,175,192,0.1)] rounded-[24px] p-8 backdrop-blur-md transition-all hover:translate-y-[-4px]">
                <Users className="text-[var(--amber)] mb-4" size={24} />
                <h4 className="font-serif text-xl text-[var(--ivory)] mb-2 font-medium">For Professors</h4>
                <p className="text-sm text-[var(--text-muted)] font-light leading-relaxed opacity-80">Apply today · Full control of schedule · Manual verification</p>
             </div>
             <div className="bg-[rgba(17,34,64,0.7)] border border-[rgba(155,175,192,0.1)] rounded-[24px] p-8 backdrop-blur-md transition-all hover:translate-y-[-4px]">
                <ShieldCheck className="text-[var(--ivory)] mb-4 opacity-50" size={24} />
                <h4 className="font-serif text-xl text-[var(--ivory)] mb-2 font-medium">Nonprofit Mission</h4>
                <p className="text-sm text-[var(--text-muted)] font-light leading-relaxed opacity-80">Free forever · Data privacy first · Purely academic impact</p>
             </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-4 sm:px-6 lg:px-8 pt-24 pb-12 bg-[rgba(11,22,40,0.95)] border-t border-[rgba(155,175,192,0.07)]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-16 mb-16 pb-16 border-b border-[rgba(155,175,192,0.07)]">
            <div className="lg:col-span-2 space-y-6">
              <div className="font-serif text-3xl text-[var(--ivory)]">Schol<span className="text-[var(--amber)]">lective</span></div>
              <p className="text-[var(--text-muted)] leading-relaxed max-w-[320px] font-light text-lg">
                A structured academic bridge connecting students and professors for meaningful, barrier-free mentorship.
              </p>
            </div>
            <div>
              <h4 className="text-[0.7rem] font-bold tracking-[0.25em] text-[var(--text-muted)] uppercase mb-8">Platform</h4>
              <ul className="flex flex-col gap-4 list-none p-0 text-sm text-[var(--text-muted)] font-medium">
                <li><Link href="#how" className="hover:text-[var(--ivory)] transition-colors">How it works</Link></li>
                <li><Link href="/professors" className="hover:text-[var(--ivory)] transition-colors">For students</Link></li>
                <li><Link href="#roles" className="hover:text-[var(--ivory)] transition-colors">For professors</Link></li>
                <li><Link href="/features" className="hover:text-[var(--ivory)] transition-colors">Features</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[0.7rem] font-bold tracking-[0.25em] text-[var(--text-muted)] uppercase mb-8">Account</h4>
              <ul className="flex flex-col gap-4 list-none p-0 text-sm text-[var(--text-muted)] font-medium">
                <li><Link href="/auth/signup" className="hover:text-[var(--ivory)] transition-colors">Sign up free</Link></li>
                <li><Link href="/auth/login" className="hover:text-[var(--ivory)] transition-colors">Log in</Link></li>
                <li><Link href="/prof/pending" className="hover:text-[var(--ivory)] transition-colors">Verification Status</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[0.7rem] font-bold tracking-[0.25em] text-[var(--text-muted)] uppercase mb-8">Organization</h4>
              <ul className="flex flex-col gap-4 list-none p-0 text-sm text-[var(--text-muted)] font-medium">
                <li><Link href="#" className="hover:text-[var(--ivory)] transition-colors">About us</Link></li>
                <li><Link href="#" className="hover:text-[var(--ivory)] transition-colors">Nonprofit Mission</Link></li>
                <li><Link href="#" className="hover:text-[var(--ivory)] transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-[var(--ivory)] transition-colors">Contact</Link></li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-[0.75rem] text-[var(--text-muted)] uppercase tracking-[0.3em] font-bold opacity-40">
            <div>© 2025 Schollective. All rights reserved.</div>
            <div>Built with <span className="text-[var(--amber)] opacity-100">♥</span> for academic equity</div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
