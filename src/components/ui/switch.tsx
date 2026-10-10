import React, { forwardRef, useId } from "react";
import { cn } from "@/lib/utils/cn";

export interface SwitchProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "onChange"
> {
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: string;
  description?: string;
}

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  ({ className, checked, onCheckedChange, label, description, id, disabled, ...props }, ref) => {
    const generatedId = useId();
    const switchId = id || generatedId;

    const toggle = () => {
      if (!disabled && onCheckedChange) {
        onCheckedChange(!checked);
      }
    };

    return (
      <div className="flex items-center justify-between gap-4 select-none">
        {(label || description) && (
          <label
            htmlFor={switchId}
            onClick={toggle}
            className={cn(
              "flex flex-col cursor-pointer",
              disabled && "opacity-50 pointer-events-none",
            )}
          >
            {label && <span className="text-sm font-semibold text-ink">{label}</span>}
            {description && <span className="text-xs text-ink-muted mt-0.5">{description}</span>}
          </label>
        )}

        <button
          ref={ref}
          id={switchId}
          type="button"
          role="switch"
          aria-checked={checked}
          disabled={disabled}
          onClick={toggle}
          className={cn(
            "relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
            "disabled:opacity-50 disabled:pointer-events-none",
            checked ? "bg-accent-fill" : "bg-white/20 dark:bg-white/20 border border-white/10",
            className,
          )}
          {...props}
        >
          <span
            className={cn(
              "pointer-events-none inline-block h-[22px] w-[22px] transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out my-auto ml-[3px]",
              checked ? "translate-x-5" : "translate-x-0",
            )}
          />
        </button>
      </div>
    );
  },
);

Switch.displayName = "Switch";
