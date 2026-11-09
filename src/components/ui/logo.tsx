import React from "react";
import { cn } from "@/lib/utils/cn";
import mark from "@/lib/brand/mark.json";

export interface LogoMarkProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
  bare?: boolean;
}

/** An archive monogram: an amber A resting above an ivory shelf. */
export function LogoMark({ size = 32, className, bare = false, ...props }: LogoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={mark.viewBox}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden="true"
      {...props}
    >
      {!bare && (
        <rect
          x="0.5"
          y="0.5"
          width="47"
          height="47"
          rx="11.5"
          fill={mark.background}
          stroke={mark.border}
        />
      )}
      <path d={mark.monogram} fill={bare ? "currentColor" : mark.accent} fillRule="evenodd" />
      <path d={mark.shelfPath} fill={bare ? "currentColor" : mark.shelf} />
    </svg>
  );
}

export interface LogoProps {
  size?: number;
  showSubtitle?: boolean;
  className?: string;
  textClassName?: string;
}

export function Logo({ size = 36, showSubtitle = true, className, textClassName }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5 select-none text-ink", className)}>
      <LogoMark size={size} />
      <div className={textClassName}>
        <span className="block [font-family:Georgia,serif] text-[25px] font-normal tracking-[-0.05em] leading-none">
          AkShelf
        </span>
        {showSubtitle && (
          <span className="block text-[9px] text-ink-muted mt-1.5 font-medium uppercase tracking-[0.16em]">
            Private archive
          </span>
        )}
      </div>
    </div>
  );
}
