/**
 * External dependencies
 */
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Internal dependencies
 */

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
