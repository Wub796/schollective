import * as React from "react";
import { cn } from "@/lib/utils";

const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        className={cn(
          "flex h-11 w-full rounded-xl border border-[rgba(155,175,192,0.15)] bg-[rgba(26,58,92,0.4)] px-4 py-2 text-sm text-[var(--ivory)] transition-all focus:outline-none focus:border-[var(--amber)] focus:bg-[rgba(26,58,92,0.6)] disabled:cursor-not-allowed disabled:opacity-50 appearance-none",
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
