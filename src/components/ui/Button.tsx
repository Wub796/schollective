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


    const variants = {
      primary: "bg-indigo-600 text-white border-2 border-indigo-600 hover:bg-indigo-700 hover:border-indigo-700 shadow-sm transition-all duration-200",
      ghost: "bg-transparent backdrop-blur-md text-slate-900 border-2 border-slate-900 hover:border-indigo-600 hover:text-indigo-600 transition-all duration-200",
      outline: "bg-transparent text-indigo-600 border-2 border-indigo-600 hover:bg-indigo-600 hover:text-white transition-all duration-200",
      gold: "bg-indigo-500 text-slate-900 border-2 border-indigo-500 hover:bg-indigo-700 hover:border-indigo-700 shadow-sm transition-all duration-200",
    };

    const sizes = {
      sm: "px-5 py-2.5 text-xs font-semibold",
      md: "px-7 py-3.5 text-sm font-semibold",
      lg: "px-9 py-4.5 text-base font-semibold",
    };

    const mergedClassName = cn(
      "group relative inline-flex items-center justify-center rounded-full overflow-hidden whitespace-nowrap cursor-pointer",
      "transition-[background,border-color,opacity,transform] duration-300",
      "disabled:opacity-40 disabled:cursor-not-allowed",
      "active:scale-[0.98]",
      variants[variant],
      sizes[size],
      className
    );

    const content = (
      <span className="inline-flex items-center justify-center gap-2 relative z-[1]">
        {icon && <span className="flex-shrink-0 flex items-center justify-center">{icon}</span>}
        <span>{children}</span>
      </span>
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
