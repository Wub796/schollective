import * as React from "react";
import { cn } from "@/lib/utils";

const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        className={cn(
          "flex h-11 w-full rounded-xl px-4 py-2 text-sm transition-all appearance-none cursor-pointer",
          "bg-[rgba(250, 250, 249, 0.03)] border border-[rgba(250, 250, 249, 0.07)]",
          "text-[#f2f2f0]",
          "focus:outline-none focus:border-[rgba(232,232,230,0.4)] focus:bg-[rgba(250, 250, 249, 0.05)]",
          "focus:ring-2 focus:ring-[rgba(232,232,230,0.08)]",
          "disabled:cursor-not-allowed disabled:opacity-40",
          // Dark option background for browser compatibility
          "[&>option]:bg-[#161616] [&>option]:text-[#f2f2f0]",
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
    );
  }
);
Select.displayName = "Select";

export { Select };
