import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility to merge conditional Tailwind CSS class names cleanly.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
