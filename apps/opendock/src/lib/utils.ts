import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combine Tailwind class names with runtime conditions.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
