import * as React from "react";
import { cn } from "@/lib/utils";

const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <select
          className={cn(
            "flex h-12 w-full rounded-full pl-7 pr-12 py-3 text-sm transition-all appearance-none cursor-pointer outline-none",
            "bg-white/90 border border-indigo-500/20 text-slate-900 shadow-xs",
            "focus:outline-none focus:border-indigo-500/50 focus:bg-white",
            "focus:ring-4 focus:ring-indigo-500/10",
            "disabled:cursor-not-allowed disabled:opacity-40",
            // Clean option styling for dropdown choices
            "[&>option]:bg-white [&>option]:text-slate-900 [&>option]:py-2",
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-500/60">
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 1l4 4 4-4" />
          </svg>
        </div>
      </div>
    );
  }
);
Select.displayName = "Select";

export { Select };
