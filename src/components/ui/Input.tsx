import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Base structure
          "flex h-11 w-full rounded-xl px-4 py-2 text-sm transition-all",
          // Charcoal surface
          "bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.07)]",
          // Text
          "text-[#f2f2f0] placeholder:text-[#4a4a4a]",
          // Focus — off-white ring
          "focus:outline-none focus:border-[rgba(232,232,230,0.4)] focus:bg-[rgba(255,255,255,0.05)]",
          "focus:ring-2 focus:ring-[rgba(232,232,230,0.08)]",
          // Disabled
          "disabled:cursor-not-allowed disabled:opacity-40",
          // File input
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
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
