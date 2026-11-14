/** Display helpers. Clinical dates are unambiguous by default. */

const TODAY = new Date('2026-11-14T09:00:00');

export const today = () => TODAY;

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
  const d = new Date(dob + 'T12:00:00');
  let a = TODAY.getFullYear() - d.getFullYear();
  const m = TODAY.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && TODAY.getDate() < d.getDate())) a--;
  return a;
}

export function daysFrom(iso: string): number {
  const d = new Date(iso + 'T12:00:00');
  return Math.round((d.getTime() - TODAY.getTime()) / 86400000);
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
  const d = new Date(iso + 'T12:00:00');
  return Math.max(0, (TODAY.getFullYear() - d.getFullYear()) * 12 + TODAY.getMonth() - d.getMonth());
}

export const MEMBERSHIP_LABEL: Record<string, string> = {
  standard: 'Standard',
  'sliding-scale': 'Sliding scale',
  'pro-bono': 'Pro bono',
};
