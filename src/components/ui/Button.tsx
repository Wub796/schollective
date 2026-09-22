"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface BaseProps {
  variant?: "primary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  className?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

type ButtonAsButton = BaseProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseProps> & { href?: never };
type ButtonAsLink = BaseProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof BaseProps> & { href: string };

type ButtonProps = ButtonAsButton | ButtonAsLink;

/* Defined once at module scope rather than rebuilt on every render. The old
   `gold` variant was also unreachable: it was absent from the `variant` union,
   so no caller could select it. */
const VARIANTS: Record<NonNullable<BaseProps["variant"]>, string> = {
  primary: "bg-accent text-white border-2 border-accent hover:bg-accent-alt hover:border-accent-alt",
  ghost: "bg-transparent text-ink border-2 border-ink hover:border-accent hover:text-accent",
  outline: "bg-transparent text-accent border-2 border-accent hover:bg-accent hover:text-white",
};

const SIZES: Record<NonNullable<BaseProps["size"]>, string> = {
  sm: "px-5 py-2.5 text-xs font-semibold",
  md: "px-7 py-3.5 text-sm font-semibold",
  lg: "px-9 py-4.5 text-base font-semibold",
};

/* Focus ring lives on the shared class list: the button previously had none,
   so keyboard users got only the browser default on a `focus:`-styled control. */
const BASE =
  "group relative inline-flex items-center justify-center rounded-control whitespace-nowrap cursor-pointer " +
  "transition-[background,border-color,opacity,transform] duration-300 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper " +
  "disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]";

const Button = React.forwardRef<HTMLElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", icon, children, href, ...props }, ref) => {
    const mergedClassName = cn(BASE, VARIANTS[variant], SIZES[size], className);

    const content = (
      <span className="relative z-[1] inline-flex items-center justify-center gap-2">
        {icon && <span className="flex flex-shrink-0 items-center justify-center">{icon}</span>}
        <span>{children}</span>
      </span>
    );

    if (href) {
      return (
        <Link
          href={href}
          ref={ref as React.Ref<HTMLAnchorElement>}
          className={mergedClassName}
          {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
        >
          {content}
        </Link>
      );
    }

    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        className={mergedClassName}
        {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
      >
        {content}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button };
