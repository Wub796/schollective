import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Base structure
          "flex h-12 w-full rounded-xl px-5 py-3 text-sm transition-all",
          // Dark surface, near-invisible border
          "bg-[rgba(17,17,19,0.5)] border border-[rgba(129,140,248,0.07)]",
          // Text
          "text-[#fafaf9] placeholder:text-[#3d5070]",
          // Focus — teal ring
          "focus:outline-none focus:border-[rgba(129, 140, 248, 0.5)] focus:bg-[rgba(17, 17, 19, 0.85)]",
          "focus:ring-2 focus:ring-[rgba(129, 140, 248, 0.12)]",
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
