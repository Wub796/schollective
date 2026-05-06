import * as React from "react";
import { cn } from "@/lib/utils";

const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      "text-[0.7rem] font-medium leading-none uppercase tracking-widest text-[var(--text-muted)] mb-2 block",
      className
    )}
    {...props}
  />
));
Label.displayName = "Label";

export { Label };
