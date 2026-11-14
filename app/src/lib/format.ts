/** Display helpers. Clinical dates are unambiguous by default. */
import { now, asDate, daysBetween } from './clock';

export const today = () => asDate(now());

/** The clinic's "today" as yyyy-mm-dd, for date inputs and new records. */
export const todayIso = (): string => now();

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** 6 Nov 2026 — never 11/6, which means two different days either side of the Atlantic. */
export function fmtDate(iso: string, opts: { year?: boolean } = {}): string {
  const d = new Date(iso + 'T12:00:00');
  const y = opts.year === false ? '' : ` ${d.getFullYear()}`;
  return `${d.getDate()} ${MONTHS[d.getMonth()]}${y}`;
}

export function fmtDateShort(iso: string): string {
  const d = new Date(iso + 'T12:00:00');
  return `${MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
}

export function age(dob: string): number {
  const t = asDate(now());
  const d = asDate(dob);
  let a = t.getFullYear() - d.getFullYear();
  const m = t.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < d.getDate())) a--;
  return a;
}

export function daysFrom(iso: string): number {
  return daysBetween(now(), iso);
}

/** "today", "3 days ago", "in 2 weeks" — relative where it helps, absolute where it does not. */
export function relative(iso: string): string {
  const n = daysFrom(iso);
  if (n === 0) return 'today';
  if (n === -1) return 'yesterday';
  if (n === 1) return 'tomorrow';
  if (n < 0 && n > -31) return `${-n} days ago`;
  if (n > 0 && n < 31) return `in ${n} days`;
  return fmtDate(iso);
}

export function initials(name: string): string {
  return name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
}

/** Months between two dates, for membership tenure. */
export function monthsSince(iso: string): number {
  const t = asDate(now());
  const d = asDate(iso);
  return Math.max(0, (t.getFullYear() - d.getFullYear()) * 12 + t.getMonth() - d.getMonth());
}

export const MEMBERSHIP_LABEL: Record<string, string> = {
  standard: 'Standard',
  'sliding-scale': 'Sliding scale',
  'pro-bono': 'Pro bono',
};
