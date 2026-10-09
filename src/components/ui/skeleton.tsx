import React from "react";
import { cn } from "@/lib/utils/cn";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  aspectRatio?: "poster" | "video" | "square";
}

export function Skeleton({ className, aspectRatio, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative overflow-hidden rounded-[12px] bg-white/6 dark:bg-white/6",
        "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.6s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent",
        aspectRatio === "poster" && "aspect-[2/3]",
        aspectRatio === "video" && "aspect-[16/9]",
        aspectRatio === "square" && "aspect-square",
        className,
      )}
      {...props}
    />
  );
}
