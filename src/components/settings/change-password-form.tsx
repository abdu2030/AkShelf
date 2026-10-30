"use client";

import { useActionState, useState, useRef, useEffect } from "react";
import { changePasswordAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Lock, Eye, EyeOff, CheckCircle2, AlertTriangle } from "lucide-react";

export function ChangePasswordForm() {
  const [state, formAction, isPending] = useActionState(changePasswordAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
    }
  }, [state?.success]);

  return (
    <div className="pt-4 border-t border-white/10 dark:border-white/12 space-y-4">
      <div className="flex items-center gap-2 text-ink">
        <Lock className="h-4 w-4 text-accent" aria-hidden="true" />
        <h3 className="text-sm font-semibold">Change Password</h3>
      </div>
      <p className="text-xs text-ink-muted">
        Update your login password. Changes will take effect immediately in your database.
      </p>

      <form ref={formRef} action={formAction} className="space-y-4 max-w-md">
        {/* Current Password */}
        <div className="space-y-1.5">
          <label
            htmlFor="currentPassword"
            className="text-xs font-semibold text-ink-soft select-none block"
          >
            Current Password
          </label>
          <div className="relative flex items-center">
            <input
              id="currentPassword"
              name="currentPassword"
              type={showCurrent ? "text" : "password"}
              required
              autoComplete="current-password"
              placeholder="Enter current password"
              aria-label="Current Password"
              className="w-full h-10 rounded-[12px] px-3.5 pr-10 text-sm text-ink placeholder:text-ink-muted placeholder:font-normal bg-white/8 dark:bg-white/8 border border-white/15 dark:border-white/20 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              aria-label={showCurrent ? "Hide current password" : "Show current password"}
              className="absolute right-2.5 text-ink-soft hover:text-ink transition-colors p-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {showCurrent ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div className="space-y-1.5">
          <label
            htmlFor="newPassword"
            className="text-xs font-semibold text-ink-soft select-none block"
          >
            New Password
          </label>
          <div className="relative flex items-center">
            <input
              id="newPassword"
              name="newPassword"
              type={showNew ? "text" : "password"}
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="Enter at least 8 characters"
              aria-label="New Password"
              className="w-full h-10 rounded-[12px] px-3.5 pr-10 text-sm text-ink placeholder:text-ink-muted placeholder:font-normal bg-white/8 dark:bg-white/8 border border-white/15 dark:border-white/20 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              aria-label={showNew ? "Hide new password" : "Show new password"}
              className="absolute right-2.5 text-ink-soft hover:text-ink transition-colors p-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {showNew ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>
          <span className="text-[11px] text-ink-muted">Minimum 8 characters</span>
        </div>

        {/* Confirm New Password */}
        <div className="space-y-1.5">
          <label
            htmlFor="confirmPassword"
            className="text-xs font-semibold text-ink-soft select-none block"
          >
            Confirm New Password
          </label>
          <div className="relative flex items-center">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirm ? "text" : "password"}
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="Re-enter new password"
              aria-label="Confirm New Password"
              className="w-full h-10 rounded-[12px] px-3.5 pr-10 text-sm text-ink placeholder:text-ink-muted placeholder:font-normal bg-white/8 dark:bg-white/8 border border-white/15 dark:border-white/20 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
              className="absolute right-2.5 text-ink-soft hover:text-ink transition-colors p-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {showConfirm ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {state?.error && (
          <div
            role="alert"
            className="flex items-center gap-2 p-3 rounded-[12px] bg-red-500/15 border border-red-500/30 text-red-200 text-xs font-medium"
          >
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" aria-hidden="true" />
            <span>{state.error}</span>
          </div>
        )}

        {/* Success Alert */}
        {state?.success && (
          <div
            role="status"
            className="flex items-center gap-2 p-3 rounded-[12px] bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-xs font-medium"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
            <span>{state.message || "Password updated successfully."}</span>
          </div>
        )}

        <div className="pt-1">
          <Button type="submit" variant="primary" size="medium" isLoading={isPending}>
            Update password
          </Button>
        </div>
      </form>
    </div>
  );
}
