import React, { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export const buttonVariants = cva(
  "inline-flex items-center justify-center font-semibold transition-all select-none relative cursor-pointer " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas " +
    "disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] active:duration-100",
  {
    variants: {
      variant: {
        primary:
          "bg-accent-fill text-white shadow-[0_4px_14px_rgba(79,70,229,0.35)] hover:bg-accent-fill-hover border border-white/20",
        secondary: "glass-1 text-ink hover:glass-2 border border-white/12 dark:border-white/16",
        ghost: "bg-transparent text-ink-soft hover:text-ink hover:bg-white/6 dark:hover:bg-white/6",
        danger: "bg-danger-fill text-white hover:bg-red-700 shadow-sm border border-red-500/20",
      },
      size: {
        large: "h-12 px-5 text-base rounded-[12px] min-h-[48px]",
        medium: "h-10 px-4 text-sm rounded-[12px] min-h-[40px]",
        small:
          "h-8 px-3 text-sm rounded-[8px] min-h-[32px] before:absolute before:inset-[-6px] before:content-['']",
      },
      fullWidth: {
        true: "w-full",
      },
      pill: {
        true: "rounded-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "medium",
      fullWidth: false,
      pill: false,
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, fullWidth, pill, isLoading = false, disabled, children, ...props },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        aria-busy={isLoading || undefined}
        aria-disabled={disabled || isLoading || undefined}
        className={cn(buttonVariants({ variant, size, fullWidth, pill }), className)}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin shrink-0 mr-2" aria-hidden="true" />
            <span>{children}</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  },
);

Button.displayName = "Button";
