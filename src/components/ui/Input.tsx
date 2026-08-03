import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Base structure
          "flex h-13 w-full rounded-full px-8 py-3.5 text-sm transition-all",
          // Dark surface, near-invisible border
          "bg-[rgba(17,17,19,0.5)] border border-[rgba(79, 70, 229,0.07)]",
          // Text
          "text-slate-900 placeholder:text-[#3d5070]",
          // Focus — indigo ring
          "focus:outline-none focus:border-[rgba(79, 70, 229, 0.5)] focus:bg-[rgba(17, 17, 19, 0.85)]",
          "focus:ring-2 focus:ring-[rgba(79, 70, 229, 0.12)]",
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
