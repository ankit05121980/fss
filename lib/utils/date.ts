import { differenceInHours, format, formatDistanceStrict, parseISO } from "date-fns";

/**
 * DEMO_NOW is the application's fixed notion of "now".
 *
 * The entire dataset is generated relative to this constant and every relative
 * time calculation ("active", "delayed", "last week", ETAs) uses it instead of
 * `Date.now()`. This guarantees the demo is fully deterministic — AskMe,
 * Do You Know and Predictive return identical answers on every run.
 */
export const DEMO_NOW = new Date("2026-06-25T12:00:00.000Z");

/** Milliseconds in one hour. */
export const HOUR_MS = 60 * 60 * 1000;
/** Milliseconds in one day. */
export const DAY_MS = 24 * HOUR_MS;

export function nowMs(): number {
  return DEMO_NOW.getTime();
}

/** Returns an ISO string for `DEMO_NOW + hours`. */
export function isoFromNow(hours: number): string {
  return new Date(DEMO_NOW.getTime() + hours * HOUR_MS).toISOString();
}

/** True when `iso` is within the last `days` days relative to DEMO_NOW. */
export function isWithinLastDays(iso: string, days: number): boolean {
  const t = parseISO(iso).getTime();
  return t <= DEMO_NOW.getTime() && t >= DEMO_NOW.getTime() - days * DAY_MS;
}

/** Hours between two ISO timestamps (b - a). */
export function hoursBetween(aIso: string, bIso: string): number {
  return differenceInHours(parseISO(bIso), parseISO(aIso));
}

export function fmtDate(iso: string): string {
  return format(parseISO(iso), "dd MMM yyyy");
}

export function fmtDateTime(iso: string): string {
  return format(parseISO(iso), "dd MMM yyyy, HH:mm");
}

export function fmtTime(iso: string): string {
  return format(parseISO(iso), "HH:mm");
}

/** Human distance from DEMO_NOW, e.g. "3 days ago" / "in 18 hours". */
export function fromNow(iso: string): string {
  const d = parseISO(iso);
  const suffix = d.getTime() >= DEMO_NOW.getTime() ? "from now" : "ago";
  return `${formatDistanceStrict(d, DEMO_NOW)} ${suffix}`;
}
