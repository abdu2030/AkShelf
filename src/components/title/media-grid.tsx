"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import { MediaCard, MediaCardProps, MediaCardSkeleton } from "./media-card";

export type GridDensity = "default" | "compact" | "spacious";

export interface MediaGridProps extends React.HTMLAttributes<HTMLElement> {
  items?: MediaCardProps[];
  renderItem?: (item: MediaCardProps, index: number) => React.ReactNode;
  children?: React.ReactNode;
  isLoading?: boolean;
  skeletonCount?: number;
  emptyState?: React.ReactNode;
  density?: GridDensity;
  as?: "div" | "section" | "ul";
}

export interface MediaGridSkeletonProps extends React.HTMLAttributes<HTMLElement> {
  count?: number;
  density?: GridDensity;
  as?: "div" | "section" | "ul";
}

const densityClasses: Record<GridDensity, string> = {
  default:
    "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 sm:gap-5 md:gap-6",
  compact:
    "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 sm:gap-4 md:gap-4",
  spacious:
    "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-5 sm:gap-6 md:gap-8",
};

/**
 * Skeleton loading state for the MediaGrid.
 * Renders multiple MediaCardSkeleton items across responsive column breakpoints.
 */
export function MediaGridSkeleton({
  count = 12,
  density = "default",
  className,
  as: Component = "div",
  ...props
}: MediaGridSkeletonProps) {
  return (
    <Component
      aria-busy="true"
      aria-label="Loading media library items"
      data-testid="media-grid-skeleton"
      className={cn("w-full", densityClasses[density], className)}
      {...props}
    >
      {Array.from({ length: count }).map((_, index) => (
        <MediaCardSkeleton key={`skeleton-${index}`} />
      ))}
    </Component>
  );
}

/**
 * Responsive grid container for MediaCard elements.
 * Adheres to UI/UX Spec 9.10, 8.2 & 16.1:
 * - Direct placement on aurora (zero extra blur budget).
 * - Breakpoint-aware columns: 2 on mobile (<480px), 3 on sm, 4 on md/lg, 5 on xl, 6 on 2xl.
 * - Built-in skeleton loading state and empty state support.
 */
export function MediaGrid({
  items,
  renderItem,
  children,
  isLoading = false,
  skeletonCount = 12,
  emptyState,
  density = "default",
  className,
  as: Component = "div",
  ...props
}: MediaGridProps) {
  // If in loading state, render the skeleton grid
  if (isLoading) {
    return (
      <MediaGridSkeleton
        count={skeletonCount}
        density={density}
        className={className}
        as={Component}
        {...props}
      />
    );
  }

  const hasItems = Boolean(items && items.length > 0);
  const hasChildren = Boolean(children);

  // If empty and emptyState is provided, render the empty state
  if (!hasItems && !hasChildren && emptyState) {
    return <div data-testid="media-grid-empty-container">{emptyState}</div>;
  }

  return (
    <Component
      data-testid="media-grid"
      className={cn("w-full", densityClasses[density], className)}
      {...props}
    >
      {hasChildren
        ? children
        : items?.map((item, index) =>
            renderItem ? (
              renderItem(item, index)
            ) : (
              <MediaCard key={item.id ?? `media-item-${index}`} {...item} />
            ),
          )}
    </Component>
  );
}

// Re-exports for convenience
export const TitleGrid = MediaGrid;
export const TitleGridSkeleton = MediaGridSkeleton;
