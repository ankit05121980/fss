import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind/utility class names with conflict resolution.
 * Used by every UI primitive (shadcn convention).
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
