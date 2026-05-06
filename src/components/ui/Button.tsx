import * as React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const variants = {
      primary: "bg-[var(--amber)] text-[var(--navy)] hover:bg-[var(--amber-light)] shadow-[0_8px_28px_rgba(212,146,42,0.25)]",
      ghost: "bg-transparent text-[var(--text-muted)] border border-[rgba(155,175,192,0.25)] hover:text-[var(--ivory)] hover:border-[rgba(155,175,192,0.5)] hover:bg-[rgba(255,255,255,0.04)]",
      outline: "bg-transparent text-[var(--amber)] border border-[var(--amber)] hover:bg-[rgba(212,146,42,0.05)]",
    };

    const sizes = {
      sm: "px-4 py-2 text-xs",
      md: "px-6 py-2.5 text-sm font-medium",
      lg: "px-8 py-3.5 text-base font-medium",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-full transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
