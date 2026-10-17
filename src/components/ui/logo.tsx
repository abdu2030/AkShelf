import React from "react";
import { cn } from "@/lib/utils/cn";

export interface LogoMarkProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
  bare?: boolean;
}

/**
 * Obsidian Film Gate LogoMark (A24 / Criterion inspired)
 * Matte obsidian black rounded badge, smoked specular rim, stark white floating shelves, and cinema play caret.
 */
export function LogoMark({ size = 32, className, bare = false, ...props }: LogoMarkProps) {
  if (bare) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn("shrink-0", className)}
        aria-hidden="true"
        {...props}
      >
        <rect x="6" y="7" width="20" height="2.5" rx="1.25" fill="currentColor" />
        <path
          d="M13 12C13 11.2 13.9 10.8 14.5 11.2L20 15.2C20.6 15.6 20.6 16.4 20 16.8L14.5 20.8C13.9 21.2 13 20.8 13 20Z"
          fill="currentColor"
        />
        <rect x="6" y="22.5" width="20" height="2.5" rx="1.25" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 drop-shadow-md", className)}
      aria-hidden="true"
      {...props}
    >
      <defs>
        <linearGradient
          id="akshelf-gate-bg"
          x1="0"
          y1="0"
          x2="32"
          y2="32"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#1e2029" />
          <stop offset="1" stopColor="#0a0b0e" />
        </linearGradient>
      </defs>
      {/* Matte obsidian black badge */}
      <rect width="32" height="32" rx="8" fill="url(#akshelf-gate-bg)" />
      {/* Smoked specular rim */}
      <rect x="0.5" y="0.5" width="31" height="31" rx="7.5" stroke="rgba(255,255,255,0.14)" />
      {/* Top shelf */}
      <rect x="6" y="7" width="20" height="2.5" rx="1.25" fill="#f4f4f5" />
      {/* Cinema play caret */}
      <path
        d="M13 12C13 11.2 13.9 10.8 14.5 11.2L20 15.2C20.6 15.6 20.6 16.4 20 16.8L14.5 20.8C13.9 21.2 13 20.8 13 20Z"
        fill="#e4e4e7"
      />
      {/* Bottom shelf */}
      <rect x="6" y="22.5" width="20" height="2.5" rx="1.25" fill="#f4f4f5" />
    </svg>
  );
}

export interface LogoProps {
  size?: number;
  showSubtitle?: boolean;
  className?: string;
  textClassName?: string;
}

/**
 * Full AkShelf Logo with Obsidian Film Gate mark and typography.
 */
export function Logo({ size = 36, showSubtitle = true, className, textClassName }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-3 select-none", className)}>
      <LogoMark size={size} />
      <div className={textClassName}>
        <span className="font-display font-bold text-lg text-ink tracking-tight block leading-tight">
          AkShelf
        </span>
        {showSubtitle && (
          <span className="block text-[11px] text-ink-muted -mt-0.5 font-semibold tracking-wide">
            Watch Tracker
          </span>
        )}
      </div>
    </div>
  );
}
