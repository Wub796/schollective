"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface BaseProps {
  variant?: 'primary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

type ButtonAsButton = BaseProps & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseProps> & { href?: never };
type ButtonAsLink = BaseProps & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof BaseProps> & { href: string };

type ButtonProps = ButtonAsButton | ButtonAsLink;

const Button = React.forwardRef<HTMLElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', icon, children, href, ...props }, ref) => {
    
    // We need a local ref to attach event listeners if 'ref' is not provided
    const localRef = React.useRef<HTMLElement>(null);
    const resolvedRef = (ref as React.RefObject<HTMLElement>) || localRef;
    const borderRef = React.useRef<HTMLSpanElement>(null);

    React.useEffect(() => {
      const el = resolvedRef.current;
      const dot = borderRef.current;
      if (!el || !dot) return;

      const enter = () => {
        const { width, height } = el.getBoundingClientRect();
        dot.style.width = `${width + 24}px`;
        dot.style.height = `${height + 18}px`;
        dot.style.borderRadius = "100px";
        dot.style.borderColor = variant === 'primary' ? 'rgba(79,70,229,0.6)' : 'rgba(79,70,229,0.8)';
      };
      const leave = () => {
        dot.style.width = "10px";
        dot.style.height = "10px";
        dot.style.borderRadius = "50%";
        dot.style.borderColor = "transparent";
      };

      el.addEventListener("mouseenter", enter);
      el.addEventListener("mouseleave", leave);
      return () => {
        el.removeEventListener("mouseenter", enter);
        el.removeEventListener("mouseleave", leave);
      };
    }, [resolvedRef, variant]);

    const variants = {
      primary: "bg-indigo-600 text-white border-2 border-indigo-600 hover:bg-indigo-700 hover:border-indigo-700 shadow-sm transition-all duration-200",
      ghost: "bg-transparent backdrop-blur-md text-slate-900 border-2 border-slate-900 hover:border-indigo-600 hover:text-indigo-600 transition-all duration-200",
      outline: "bg-transparent text-indigo-600 border-2 border-indigo-600 hover:bg-indigo-600 hover:text-white transition-all duration-200",
    };

    const sizes = {
      sm: "px-7 py-3 text-xs",
      md: "px-9 py-3.5 text-sm",
      lg: "px-12 py-5 text-base",
    };

    // Determine rolling content.
    // If children is a string, split and roll char by char.
    // Otherwise roll the whole node.
    const isString = typeof children === "string";
    const chars = isString ? (children as string).split("") : [];

    const rollContent = isString ? (
      <>
        {/* Layer 1 — slides up and out (IN NORMAL FLOW) */}
        <span className="flex relative" style={{ alignItems: "center", justifyContent: "center", gap: icon ? "0.5rem" : "0" }}>
          {icon && <span className="flex-shrink-0">{icon}</span>}
          <span className="flex" style={{ overflow: "hidden", padding: "0.1em 0.1em" }}>
            {chars.map((ch, i) => (
              <span 
                key={i} 
                className="inline-block transition-transform duration-[450ms] ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:-translate-y-[110%]"
                style={{ fontWeight: 600, transitionDelay: `${i * 12}ms`, willChange: "transform" }}
              >
                {ch === " " ? "\u00A0" : ch}
              </span>
            ))}
          </span>
        </span>
        
        {/* Layer 2 — slides up and in (ABSOLUTE) */}
        <span className="flex" style={{ position: "absolute", inset: 0, alignItems: "center", justifyContent: "center", gap: icon ? "0.5rem" : "0", color: "#4f46e5", pointerEvents: "none" }}>
          {icon && <span className="flex-shrink-0">{icon}</span>}
          <span className="flex" style={{ overflow: "hidden", padding: "0.1em 0.1em" }}>
            {chars.map((ch, i) => (
              <span 
                key={i} 
                className="inline-block translate-y-[110%] group-hover:translate-y-0 transition-transform duration-[450ms] ease-[cubic-bezier(0.19,1,0.22,1)]"
                style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 400, transitionDelay: `${i * 12}ms`, willChange: "transform" }}
              >
                {ch === " " ? "\u00A0" : ch}
              </span>
            ))}
          </span>
        </span>
      </>
    ) : (
      <>
        <span className="flex transition-transform duration-[450ms] ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:-translate-y-full" style={{ alignItems: "center", justifyContent: "center", gap: icon ? "0.5rem" : "0" }}>
          {icon && <span className="flex-shrink-0">{icon}</span>}
          <span>{children}</span>
        </span>
        <span className="flex translate-y-full group-hover:translate-y-0 transition-transform duration-[450ms] ease-[cubic-bezier(0.19,1,0.22,1)]" style={{ position: "absolute", inset: 0, alignItems: "center", justifyContent: "center", gap: icon ? "0.5rem" : "0", color: 'var(--accent)', pointerEvents: "none" }}>
          {icon && <span className="flex-shrink-0">{icon}</span>}
          <span>{children}</span>
        </span>
      </>
    );

    const mergedClassName = cn(
      "group relative inline-flex items-center justify-center rounded-full overflow-visible",
      "transition-[background,border-color,opacity,transform] duration-300",
      "disabled:opacity-40 disabled:cursor-not-allowed",
      "active:scale-[0.98]",
      variants[variant],
      sizes[size],
      className
    );

    const content = (
      <>
        <span
          ref={borderRef}
          aria-hidden
          style={{
            pointerEvents: "none", position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
            width: "10px", height: "10px", borderRadius: "50%", border: "1.5px solid transparent",
            transition: "width 520ms cubic-bezier(0.19,1,0.22,1), height 520ms cubic-bezier(0.19,1,0.22,1), border-radius 520ms cubic-bezier(0.19,1,0.22,1), border-color 200ms ease",
            zIndex: 0,
          }}
        />
        <span style={{ position: "relative", display: "flex", alignItems: "center", zIndex: 1 }}>
          {rollContent}
        </span>
      </>
    );

    if (href) {
      return (
        <Link href={href} ref={resolvedRef as React.RefObject<HTMLAnchorElement>} className={mergedClassName} data-cursor-engulf="true" {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}>
          {content}
        </Link>
      );
    }

    return (
      <button ref={resolvedRef as React.RefObject<HTMLButtonElement>} className={mergedClassName} data-cursor-engulf="true" {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}>
        {content}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button };
