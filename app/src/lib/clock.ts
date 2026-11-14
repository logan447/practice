/**
 * The clock.
 *
 * A prototype frozen at one instant cannot test longitudinal care: a
 * goal never ages, a follow-up never falls due, a result never lands
 * overnight. So the date is state, and it can be moved.
 *
 * The current date lives in a module variable as well as in the store.
 * The store writes it during its own render, which runs before any
 * child, so by the time a screen formats a date the variable is
 * correct. That is a prototype shortcut: a real build would thread the
 * clock through context rather than rely on render order.
 */

export const ORIGIN = '2026-11-14';

let current = ORIGIN;

export const now = (): string => current;
export const setNow = (iso: string): void => { current = iso; };

export const asDate = (iso: string): Date => new Date(iso + 'T12:00:00');

export const toIso = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function addDays(iso: string, days: number): string {
  const d = asDate(iso);
  d.setDate(d.getDate() + days);
  return toIso(d);
}

/** Whole days from `iso` to now. Negative is in the past. */
export function daysBetween(from: string, to: string): number {
  return Math.round((asDate(to).getTime() - asDate(from).getTime()) / 86400000);
}

export const isBefore = (a: string, b: string): boolean => a < b;
