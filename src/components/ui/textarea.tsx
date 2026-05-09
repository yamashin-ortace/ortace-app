import * as React from "react";
import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "min-h-32 w-full resize-none rounded-[12px] border border-input bg-[var(--bg-card)] px-3 py-2.5 text-[14px] leading-6 text-[var(--text-1)] outline-none transition-colors",
        "placeholder:text-[var(--text-4)] focus-visible:border-[var(--primary)] focus-visible:ring-3 focus-visible:ring-[var(--primary-shadow-soft)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
