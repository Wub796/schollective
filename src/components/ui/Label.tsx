import * as React from "react";
import { cn } from "@/lib/utils";

const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      "text-[0.68rem] font-semibold leading-none uppercase tracking-[0.18em] text-[rgba(250,250,249,0.45)] mb-2 block",
      className
    )}
    {...props}
  />
));
Label.displayName = "Label";

export { Label };
