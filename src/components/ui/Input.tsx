import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-xl border border-[rgba(155,175,192,0.15)] bg-[rgba(26,58,92,0.4)] px-4 py-2 text-sm text-[var(--ivory)] transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--amber)] focus:bg-[rgba(26,58,92,0.6)] focus:ring-4 focus:ring-[rgba(212,146,42,0.1)] disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
