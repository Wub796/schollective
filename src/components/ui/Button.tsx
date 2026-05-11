import * as React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const variants = {
      // Teal fill — highest contrast on navy
      primary:
        "bg-[#818cf8] text-[#09090b] font-semibold " +
        "shadow-[0_0_0_1px_rgba(129, 140, 248, 0.3),0_4px_20px_rgba(129, 140, 248, 0.25)] " +
        "hover:bg-[#6dd8e1] hover:shadow-[0_0_0_1px_rgba(129, 140, 248, 0.5),0_8px_28px_rgba(129, 140, 248, 0.35)] " +
        "hover:-translate-y-px",
      // Navy glass ghost — secondary actions
      ghost:
        "bg-[rgba(17, 17, 19, 0.6)] backdrop-blur-md text-[#a8b3cf] " +
        "border border-[rgba(129, 140, 248, 0.14)] " +
        "hover:bg-[rgba(17, 17, 19, 0.85)] hover:border-[rgba(129, 140, 248, 0.3)] hover:text-[#fafaf9] " +
        "hover:-translate-y-px",
      // Teal hairline outline — tertiary / destructive
      outline:
        "bg-transparent text-[#52525b] " +
        "border border-[rgba(129, 140, 248, 0.18)] " +
        "hover:bg-[rgba(129, 140, 248, 0.06)] hover:border-[rgba(129, 140, 248, 0.4)] hover:text-[#818cf8] " +
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
