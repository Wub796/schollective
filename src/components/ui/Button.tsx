import * as React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const variants = {
      // Indigo fill — primary CTA
      primary:
        "bg-blue-600 text-[var(--bg-base)] font-semibold " +
        "shadow-[0_0_0_1px_rgba(37, 99, 235,0.3),0_4px_20px_rgba(37, 99, 235,0.20)] " +
        "hover:bg-[#9399f5] " +
        "hover:shadow-[0_0_0_1px_rgba(37, 99, 235,0.55),0_8px_28px_rgba(37, 99, 235,0.4)] " +
        "hover:-translate-y-0.5",
      // Glass ghost — secondary actions
      ghost:
        "bg-[rgba(15,23,42,0.04)] backdrop-blur-md text-slate-600 " +
        "border border-[rgba(37, 99, 235,0.14)] " +
        "hover:bg-[rgba(15,23,42,0.08)] hover:border-[rgba(37, 99, 235,0.3)] hover:text-slate-900 " +
        "hover:-translate-y-0.5",
      // Hairline outline — tertiary
      outline:
        "bg-transparent text-[#52525b] " +
        "border border-[rgba(37, 99, 235,0.18)] " +
        "hover:bg-[rgba(37, 99, 235,0.06)] hover:border-[rgba(37, 99, 235,0.4)] hover:text-blue-600 " +
        "hover:-translate-y-0.5",
    };

    const sizes = {
      sm: "px-6 py-3 text-xs tracking-wide",
      md: "px-6 py-2.5 text-sm",
      lg: "px-8 py-3.5 text-sm",
    };

    return (
      <button
        ref={ref}
        className={cn(
          // Base layout
          "inline-flex items-center justify-center rounded-lg",
          // Unified animation — 280ms cubic-bezier(0.22, 1, 0.36, 1)
          "transition-[transform,box-shadow,background,border-color,color,opacity]",
          "duration-[280ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
          // Disabled + active states
          "disabled:opacity-40 disabled:cursor-not-allowed",
          "active:scale-[0.97] active:translate-y-0",
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
