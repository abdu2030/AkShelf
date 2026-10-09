import React, { forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  "aria-label": string;
  variant?: "ghost" | "glass" | "subtle";
  size?: "default" | "sm";
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      className,
      "aria-label": ariaLabel,
      variant = "ghost",
      size = "default",
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        type="button"
        aria-label={ariaLabel}
        disabled={disabled}
        className={cn(
          "relative inline-flex items-center justify-center rounded-full transition-all select-none cursor-pointer",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-base",
          "disabled:opacity-50 disabled:pointer-events-none active:scale-95",
          size === "default"
            ? "h-11 w-11 min-w-[44px] min-h-[44px]"
            : "h-9 w-9 min-w-[36px] min-h-[36px]",
          variant === "ghost" &&
            "bg-transparent text-ink-soft hover:text-ink hover:bg-white/8 dark:hover:bg-white/10",
          variant === "glass" &&
            "glass-2 text-ink hover:bg-white/15 shadow-sm border border-white/16",
          variant === "subtle" && "bg-white/6 text-ink-soft hover:text-ink hover:bg-white/12",
          className,
        )}
        title={ariaLabel}
        {...props}
      >
        <span className="flex items-center justify-center [&_svg]:h-5 [&_svg]:w-5">{children}</span>
      </button>
    );
  },
);

IconButton.displayName = "IconButton";
