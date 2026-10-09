import React, { forwardRef } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  icon?: React.ReactNode;
}

export const Chip = forwardRef<HTMLButtonElement, ChipProps>(
  ({ className, selected = false, icon, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        aria-pressed={selected}
        className={cn(
          "inline-flex items-center gap-2 h-10 px-4 rounded-full text-sm font-medium transition-all select-none cursor-pointer",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-base",
          "disabled:opacity-50 disabled:pointer-events-none active:scale-95",
          selected
            ? "bg-accent-fill text-white shadow-sm border border-white/20"
            : "glass-1 text-ink-soft hover:text-ink hover:glass-2 border border-white/12",
          className,
        )}
        {...props}
      >
        {selected ? (
          <Check className="h-4 w-4 shrink-0 text-white" aria-hidden="true" />
        ) : (
          icon && <span className="h-4 w-4 shrink-0 [&_svg]:h-4 [&_svg]:w-4">{icon}</span>
        )}
        <span>{children}</span>
      </button>
    );
  },
);

Chip.displayName = "Chip";
