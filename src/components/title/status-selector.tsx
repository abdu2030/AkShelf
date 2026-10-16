"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, BookmarkPlus, Check, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { StatusBadge, WatchStatusType, statusConfig } from "@/components/ui/status-badge";
import { updateTitleStatusAction } from "@/actions/tracking";

export interface StatusSelectorProps {
  currentStatus?: WatchStatusType | null;
  titleExternalSource?: "tmdb" | "anilist";
  titleExternalId?: string;
  titleName?: string;
  mediaType?: "MOVIE" | "TV" | "ANIME";
  onStatusChange?: (newStatus: WatchStatusType | null) => void;
  className?: string;
}

const ALL_STATUSES: WatchStatusType[] = [
  "WATCHING",
  "WATCHED",
  "PLAN_TO_WATCH",
  "ON_HOLD",
  "DROPPED",
];

export function StatusSelector({
  currentStatus,
  titleExternalSource,
  titleExternalId,
  titleName,
  mediaType,
  onStatusChange,
  className,
}: StatusSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [prevPropStatus, setPrevPropStatus] = useState(currentStatus);
  const [status, setStatus] = useState<WatchStatusType | null | undefined>(currentStatus);
  const [isPending, setIsPending] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync internal state if prop changes externally
  if (prevPropStatus !== currentStatus) {
    setPrevPropStatus(currentStatus);
    setStatus(currentStatus);
  }

  // Close dropdown on click outside or Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }

    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = async (newStatus: WatchStatusType | null) => {
    const previousStatus = status;
    // Optimistic update
    setStatus(newStatus);
    setIsOpen(false);
    onStatusChange?.(newStatus);

    if (titleExternalSource && titleExternalId) {
      setIsPending(true);
      try {
        const result = await updateTitleStatusAction({
          titleExternalSource,
          titleExternalId,
          status: newStatus,
          titleName,
          mediaType,
        });

        if (!result.success) {
          // Revert optimistic update on failure
          setStatus(previousStatus);
          onStatusChange?.(previousStatus ?? null);
        }
      } catch (err) {
        console.error("[StatusSelector] Failed to update status:", err);
        setStatus(previousStatus);
        onStatusChange?.(previousStatus ?? null);
      } finally {
        setIsPending(false);
      }
    }
  };

  return (
    <div ref={containerRef} className={cn("relative inline-block text-left", className)}>
      {/* Trigger Button */}
      {status ? (
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          disabled={isPending}
          aria-haspopup="menu"
          aria-expanded={isOpen}
          aria-label={`Change watch status, currently ${statusConfig[status].label}`}
          className={cn(
            "group inline-flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full text-xs font-semibold",
            "glass-1 hover:glass-2 border border-white/10 hover:border-white/20 transition-all cursor-pointer select-none",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
            "min-h-[36px]",
            isPending && "opacity-75 cursor-wait",
          )}
        >
          <StatusBadge status={status} />
          {isPending ? (
            <Loader2 className="w-3.5 h-3.5 text-accent animate-spin" aria-hidden="true" />
          ) : (
            <ChevronDown
              className={cn(
                "w-3.5 h-3.5 text-ink-muted group-hover:text-ink transition-transform duration-200",
                isOpen && "rotate-180",
              )}
              aria-hidden="true"
            />
          )}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          disabled={isPending}
          aria-haspopup="menu"
          aria-expanded={isOpen}
          aria-label="Add title to shelf"
          className={cn(
            "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold",
            "bg-accent-fill hover:bg-accent-fill-hover text-white shadow-sm transition-all cursor-pointer select-none",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
            "min-h-[36px]",
            isPending && "opacity-75 cursor-wait",
          )}
        >
          {isPending ? (
            <Loader2 className="w-3.5 h-3.5 text-white animate-spin" aria-hidden="true" />
          ) : (
            <BookmarkPlus className="w-3.5 h-3.5" aria-hidden="true" />
          )}
          <span>+ Add to Shelf</span>
          <ChevronDown
            className={cn(
              "w-3.5 h-3.5 text-white/80 transition-transform duration-200",
              isOpen && "rotate-180",
            )}
            aria-hidden="true"
          />
        </button>
      )}

      {/* Glass Dropdown Menu */}
      {isOpen && (
        <div
          role="menu"
          aria-label="Select watch status"
          className={cn(
            "absolute left-0 mt-2 w-56 rounded-2xl glass-3 p-1.5 z-50 shadow-2xl",
            "border border-white/20 backdrop-blur-2xl animate-in fade-in-0 zoom-in-95 duration-150",
          )}
        >
          <div className="px-2.5 py-1.5 text-[11px] font-semibold text-ink-muted uppercase tracking-wider">
            Update Status
          </div>

          <div className="space-y-0.5">
            {ALL_STATUSES.map((statKey) => {
              const cfg = statusConfig[statKey];
              const Icon = cfg.icon;
              const isSelected = status === statKey;

              return (
                <button
                  key={statKey}
                  type="button"
                  role="menuitem"
                  onClick={() => handleSelect(statKey)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer text-left",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                    isSelected
                      ? "bg-white/15 text-ink font-semibold"
                      : "text-ink-soft hover:text-ink hover:bg-white/10",
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={cn("w-4 h-4 shrink-0", cfg.dotClass)} aria-hidden="true" />
                    <span>{cfg.label}</span>
                  </div>
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-accent shrink-0" aria-hidden="true" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Remove from shelf option if currently tracked */}
          {status && (
            <>
              <div className="my-1.5 border-t border-white/10" />
              <button
                type="button"
                role="menuitem"
                onClick={() => handleSelect(null)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 transition-colors cursor-pointer text-left"
              >
                <Trash2 className="w-4 h-4 shrink-0 text-rose-400" aria-hidden="true" />
                <span>Remove from Shelf</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
