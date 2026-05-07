import * as React from "react";
import { cn } from "@/lib/utils";

const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      "text-[0.68rem] font-semibold leading-none uppercase tracking-[0.18em] text-[#4a4a4a] mb-2 block",
      className
    )}
    {...props}
  />
));
Label.displayName = "Label";

export { Label };
