import * as React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const variants = {
      // Off-white fill — highest contrast on charcoal
      primary:
        "bg-[#e8e8e6] text-[#0d0d0d] font-semibold " +
        "shadow-[0_0_0_1px_rgba(255,255,255,0.12),0_4px_16px_rgba(0,0,0,0.4)] " +
        "hover:bg-[#f2f2f0] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.2),0_8px_24px_rgba(0,0,0,0.5)] " +
        "hover:-translate-y-px",
      // Glass ghost — secondary actions
      ghost:
        "bg-white/[0.04] backdrop-blur-md text-[#c8c8c6] " +
        "border border-white/[0.08] " +
        "hover:bg-white/[0.08] hover:border-white/[0.14] hover:text-[#f2f2f0] " +
        "hover:-translate-y-px",
      // Hairline outline — tertiary / destructive
      outline:
        "bg-transparent text-[#8a8a8a] " +
        "border border-[rgba(255,255,255,0.1)] " +
        "hover:bg-white/[0.04] hover:border-[rgba(255,255,255,0.18)] hover:text-[#f2f2f0] " +
        "hover:-translate-y-px",
    };

    const sizes = {
      sm: "px-4 py-2 text-xs tracking-wide",
      md: "px-6 py-2.5 text-sm",
      lg: "px-8 py-3.5 text-sm",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-lg transition-all duration-200",
          "disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]",
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
