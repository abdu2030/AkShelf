import React, { forwardRef, useId } from "react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  (
    { className, label, helperText, errorMessage, startIcon, endIcon, id, disabled, ...props },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    const hasError = Boolean(errorMessage);

    return (
      <div className="w-full flex flex-col">
        {label && (
          <label htmlFor={inputId} className="text-sm font-semibold text-ink mb-2 select-none">
            {label}
          </label>
        )}

        <div className="relative flex items-center w-full">
          {startIcon && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-ink-muted">
              {startIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={hasError ? "true" : undefined}
            aria-describedby={hasError ? errorId : helperText ? helperId : undefined}
            className={cn(
              "w-full h-12 md:h-11 rounded-[12px] px-4 text-base text-ink placeholder:text-ink-soft/70 transition-all",
              "bg-white/8 dark:bg-white/8 border border-white/20 dark:border-white/25",
              "focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent",
              "disabled:opacity-50 disabled:pointer-events-none",
              startIcon && "pl-11",
              (endIcon || hasError) && "pr-11",
              hasError &&
                "border-red-500 focus:ring-red-500 text-red-100 placeholder:text-red-300/60",
              className,
            )}
            {...props}
          />

          {hasError && !endIcon && (
            <div
              className="absolute right-3.5 flex items-center pointer-events-none text-red-400"
              aria-hidden="true"
            >
              <AlertTriangle className="h-4 w-4" />
            </div>
          )}

          {endIcon && <div className="absolute right-3.5 flex items-center">{endIcon}</div>}
        </div>

        {hasError ? (
          <p
            id={errorId}
            role="alert"
            className="mt-2 text-xs font-medium text-red-400 flex items-center gap-1.5"
          >
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{errorMessage}</span>
          </p>
        ) : helperText ? (
          <p id={helperId} className="mt-2 text-xs text-ink-muted">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  },
);

TextField.displayName = "TextField";
