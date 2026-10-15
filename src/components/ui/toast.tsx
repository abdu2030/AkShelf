"use client";

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type ToastType = "success" | "info" | "warning" | "error";

export interface ToastItem {
  id: string;
  type?: ToastType;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  duration?: number; // ms, default 6000ms for undo toasts
}

export interface ToastProps {
  id?: string;
  type?: ToastType;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  onClose?: () => void;
  duration?: number;
  className?: string;
}

/**
 * Toast component implementing UI spec section 9.17 & 17.4:
 * - Glass level 3 surface with rounded-xl, 14px by 16px padding, max width 420px
 * - Types: success (after server confirms), info, warning, error
 * - Semantic icon and accent color
 * - Optional action button (e.g. "Undo", "Try again")
 * - 6-second default duration with pause on hover/focus
 * - Accessible polite live-region for success/info, assertive for errors
 */
export function Toast({
  type = "success",
  message,
  actionLabel,
  onAction,
  onClose,
  duration = 6000,
  className,
}: ToastProps) {
  const [isPaused, setIsPaused] = useState(false);
  const remainingTimeRef = useRef(duration);
  const startTimeRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // If duration is 0 or error without explicit duration, do not auto-dismiss
    if (duration <= 0 || (type === "error" && duration === 6000)) {
      return;
    }

    if (isPaused) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    startTimeRef.current = Date.now();
    timerRef.current = setTimeout(() => {
      onClose?.();
    }, remainingTimeRef.current);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPaused, duration, onClose, type]);

  const handleMouseEnter = () => {
    if (duration <= 0) return;
    const now = Date.now();
    const elapsed = startTimeRef.current != null ? now - startTimeRef.current : 0;
    remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);
    setIsPaused(true);
  };

  const handleMouseLeave = () => {
    if (duration <= 0) return;
    setIsPaused(false);
  };

  const handleFocus = () => {
    handleMouseEnter();
  };

  const handleBlur = () => {
    handleMouseLeave();
  };

  const isAssertive = type === "error";

  return (
    <div
      role={isAssertive ? "alert" : "status"}
      aria-live={isAssertive ? "assertive" : "polite"}
      aria-atomic="true"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={cn(
        "glass-3 z-[60] flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl border border-white/20 shadow-xl",
        "w-full max-w-[420px] transition-all duration-200 select-none",
        className,
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        {type === "success" && (
          <CheckCircle2
            className="w-4 h-4 shrink-0 text-emerald-400 stroke-[2.2]"
            aria-hidden="true"
          />
        )}
        {type === "info" && (
          <Info className="w-4 h-4 shrink-0 text-sky-400 stroke-[2.2]" aria-hidden="true" />
        )}
        {type === "warning" && (
          <AlertTriangle
            className="w-4 h-4 shrink-0 text-amber-400 stroke-[2.2]"
            aria-hidden="true"
          />
        )}
        {type === "error" && (
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400 stroke-[2.2]" aria-hidden="true" />
        )}

        <p className="text-sm font-medium text-ink truncate leading-tight">{message}</p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {actionLabel && onAction && (
          <button
            type="button"
            onClick={() => {
              onAction();
              onClose?.();
            }}
            className="text-xs sm:text-sm font-bold text-accent hover:text-accent-fill transition-colors cursor-pointer px-2 py-1 rounded-md hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {actionLabel}
          </button>
        )}

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Dismiss notification"
            className="p-1 rounded-md text-ink-muted hover:text-ink hover:bg-white/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <X className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Toast Context and Provider (Stack up to 2 toasts per spec section 9.17)
// -----------------------------------------------------------------------------

interface ToastContextType {
  toasts: ToastItem[];
  showToast: (toast: Omit<ToastItem, "id">) => string;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((item: Omit<ToastItem, "id">) => {
    const id = "toast-" + Math.random().toString(36).substring(2, 9);
    const newToast: ToastItem = { ...item, id };

    setToasts((prev) => {
      // At most two toasts stack (Section 9.17)
      const updated = [...prev, newToast];
      if (updated.length > 2) {
        return updated.slice(updated.length - 2);
      }
      return updated;
    });

    return id;
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
      {children}
      {/* Toast viewport container: bottom center on desktop, 12-16px above bottom bar on mobile */}
      {toasts.length > 0 && (
        <div
          aria-label="Notifications"
          className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-[60] flex flex-col gap-2 pointer-events-none w-[calc(100vw-32px)] max-w-[420px]"
        >
          {toasts.map((toast) => (
            <div key={toast.id} className="pointer-events-auto w-full">
              <Toast
                id={toast.id}
                type={toast.type}
                message={toast.message}
                actionLabel={toast.actionLabel}
                onAction={toast.onAction}
                onClose={() => dismissToast(toast.id)}
                duration={toast.duration}
              />
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      toasts: [],
      showToast: () => "",
      dismissToast: () => {},
    };
  }
  return context;
}
