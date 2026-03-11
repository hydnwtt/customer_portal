import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { differenceInDays, formatDistanceToNow, format } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Returns days remaining until a future date. Negative if in the past. */
export function daysUntil(date: Date | string): number {
  return differenceInDays(new Date(date), new Date())
}

/** Formats a date as "Mar 11, 2026" */
export function formatDate(date: Date | string): string {
  return format(new Date(date), "MMM d, yyyy")
}

/** Formats a date relative to now, e.g. "3 days ago" */
export function timeAgo(date: Date | string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

/** Reserved slugs that cannot be used for customer accounts */
export const RESERVED_SLUGS = ["admin", "auth", "api", "health"] as const

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.includes(slug as (typeof RESERVED_SLUGS)[number])
}

export function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50)
}
