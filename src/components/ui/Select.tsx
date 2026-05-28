import * as React from "react";
import { cn } from "@/lib/utils";

const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <select
          className={cn(
            "flex h-12 w-full rounded-full px-8 py-3.5 text-sm transition-all appearance-none cursor-pointer",
            "bg-[rgba(15, 23, 42, 0.02)] border border-[rgba(15, 23, 42, 0.08)]",
            "text-slate-900",
            "focus:outline-none focus:border-[rgba(147,51,234,0.4)] focus:bg-[rgba(15, 23, 42, 0.04)]",
            "focus:ring-2 focus:ring-[rgba(147,51,234,0.1)]",
            "disabled:cursor-not-allowed disabled:opacity-40",
            // Clean option styling for dropdown choices
            "[&>option]:bg-white [&>option]:text-slate-900",
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-[rgba(15, 23, 42,0.3)]">
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 1l4 4 4-4" />
          </svg>
        </div>
      </div>
    );
  }
);
Select.displayName = "Select";

export { Select };
