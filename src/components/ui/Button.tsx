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
        dot.style.width = `${width + 4}px`;
        dot.style.height = `${height + 4}px`;
        dot.style.borderRadius = "100px";
        dot.style.borderColor = variant === 'primary' ? 'var(--text-primary)' : 'var(--accent)';
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
      primary: "bg-[var(--accent)] text-[var(--bg-base)] border border-transparent shadow-sm",
      ghost: "bg-[rgba(15,23,42,0.04)] backdrop-blur-md text-slate-600 border border-[var(--accent-glow)] hover:bg-[rgba(15,23,42,0.08)]",
      outline: "bg-transparent text-slate-600 border border-[var(--accent-glow)] hover:bg-[var(--accent-dim)]",
    };

    const sizes = {
      sm: "px-5 py-2 text-xs",
      md: "px-6 py-2.5 text-sm",
      lg: "px-8 py-3.5 text-base",
    };

    // Determine rolling content.
    // If children is a string, split and roll char by char.
    // Otherwise roll the whole node.
    const isString = typeof children === "string";
    const chars = isString ? (children as string).split("") : [];

    const rollContent = isString ? (
      <>
        <span className="flex transition-transform duration-[430ms] ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:-translate-y-full" style={{ position: "absolute", inset: 0, alignItems: "center", justifyContent: "center", gap: icon ? "0.5rem" : "0" }}>
          {icon && <span className="flex-shrink-0">{icon}</span>}
          <span className="flex">
            {chars.map((ch, i) => (
              <span key={i} style={{ fontWeight: 600 }}>{ch === " " ? "\u00A0" : ch}</span>
            ))}
          </span>
        </span>
        <span className="flex translate-y-full group-hover:translate-y-0 transition-transform duration-[430ms] ease-[cubic-bezier(0.19,1,0.22,1)]" style={{ position: "absolute", inset: 0, alignItems: "center", justifyContent: "center", gap: icon ? "0.5rem" : "0", color: variant === 'primary' ? 'var(--bg-base)' : 'var(--text-primary)' }}>
          {icon && <span className="flex-shrink-0">{icon}</span>}
          <span className="flex">
            {chars.map((ch, i) => (
              <span key={i} style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 400 }}>{ch === " " ? "\u00A0" : ch}</span>
            ))}
          </span>
        </span>
        <span aria-hidden style={{ visibility: "hidden", display: "flex", alignItems: "center", gap: icon ? "0.5rem" : "0", fontWeight: 600 }}>
          {icon && <span className="flex-shrink-0">{icon}</span>}
          <span>{children}</span>
        </span>
      </>
    ) : (
      <>
        <span className="flex transition-transform duration-[430ms] ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:-translate-y-full" style={{ position: "absolute", inset: 0, alignItems: "center", justifyContent: "center", gap: icon ? "0.5rem" : "0" }}>
          {icon && <span className="flex-shrink-0">{icon}</span>}
          <span>{children}</span>
        </span>
        <span className="flex translate-y-full group-hover:translate-y-0 transition-transform duration-[430ms] ease-[cubic-bezier(0.19,1,0.22,1)]" style={{ position: "absolute", inset: 0, alignItems: "center", justifyContent: "center", gap: icon ? "0.5rem" : "0", color: variant === 'primary' ? 'var(--bg-base)' : 'var(--text-primary)' }}>
          {icon && <span className="flex-shrink-0">{icon}</span>}
          <span>{children}</span>
        </span>
        <span aria-hidden style={{ visibility: "hidden", display: "flex", alignItems: "center", gap: icon ? "0.5rem" : "0" }}>
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
        <span style={{ position: "relative", display: "flex", alignItems: "center", zIndex: 1, clipPath: "inset(0 -0.2em 0 -0.2em)", minHeight: "1.2em" }}>
          {rollContent}
        </span>
      </>
    );

    if (href) {
      return (
        <Link href={href} ref={resolvedRef as React.RefObject<HTMLAnchorElement>} className={mergedClassName} {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}>
          {content}
        </Link>
      );
    }

    return (
      <button ref={resolvedRef as React.RefObject<HTMLButtonElement>} className={mergedClassName} {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}>
        {content}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button };
