/**
 * Physician time: the arithmetic.
 *
 * Pure functions only, so the numbers on the chart strip, the patient
 * list and the practice dashboard come from one place and agree.
 *
 * The allocation is a planning benchmark, not a limit. A patient above
 * it is not a problem to be fixed; a panel whose average sits above it
 * is a sustainability question for the physician.
 *
 * The year is the calendar year of the clinic date. Patients who joined
 * during the year are measured against the part of the year they have
 * been members for, so a September joiner is not reported as "under".
 */
import type { CapacitySettings, ChartActivity, Patient, RunningTimer, TimeEntry } from '../domain/types';
import { addDays, asDate, daysBetween } from './clock';

/**
 * Defaults.
 * 30 hr/week and 39 weeks are the base case in docs/strategy/unit-economics.md
 * (D-018). 60% is the owner's worked example (700 hours, 140 patients,
 * 300 minutes each). Note the unit-economics weekly rhythm (about 20 of
 * 30 hours on visits, messages, results and per-patient admin) implies
 * nearer 67%. Both are assumptions; the screen lets you change them.
 * 140 is the planned panel at maturity.
 */
export const DEFAULT_CAPACITY: CapacitySettings = {
  hoursPerWeek: 30,
  weeksPerYear: 39,
  carePercent: 60,
  panelSize: 140,
};

/** Clocks shorter than this are an accidental click, not care. */
export const MIN_SECONDS = 5;

export interface Capacity {
  workingHours: number;
  careHours: number;
  panel: number;
  /** Planning benchmark per patient per year. */
  perPatientMin: number;
}

export function capacity(c: CapacitySettings, recordCount: number): Capacity {
  const workingHours = c.hoursPerWeek * c.weeksPerYear;
  const careHours = workingHours * (c.carePercent / 100);
  const panel = c.panelSize === 'record' ? recordCount : c.panelSize;
  return { workingHours, careHours, panel, perPatientMin: panel > 0 ? (careHours * 60) / panel : 0 };
}

// ------------------------------------------------------------------ year

export function yearBounds(today: string) {
  const y = today.slice(0, 4);
  const start = `${y}-01-01`;
  const end = `${y}-12-31`;
  const days = daysBetween(start, end) + 1;
  const elapsed = daysBetween(start, today) + 1;
  return { start, end, days, elapsed, fraction: elapsed / days };
}

const inYear = (e: TimeEntry, start: string, today: string) => e.date >= start && e.date <= today;

// --------------------------------------------------------------- patient

export type PaceStatus = 'new' | 'well-above' | 'above' | 'near' | 'below' | 'well-below';

export interface PatientTime {
  allocationMin: number;
  usedMin: number;
  visitMin: number;
  chartMin: number;
  remainingMin: number;
  pctUsed: number;
  /** Where a patient using exactly their allocation would be by today. */
  expectedMin: number;
  /** Their pace over a full year, once there is enough history to say. */
  projectedMin: number | null;
  status: PaceStatus;
  byActivity: Record<ChartActivity, number>;
  entries: TimeEntry[];
}

/** Days of the year so far this person has been a member. */
function memberDaysThisYear(p: Patient, today: string): number {
  const { start } = yearBounds(today);
  const from = p.memberSince > start ? p.memberSince : start;
  return Math.max(0, daysBetween(from, today) + 1);
}

export function patientTime(
  p: Patient, entries: TimeEntry[], allocationMin: number, today: string,
): PatientTime {
  const { start, days } = yearBounds(today);
  const mine = entries.filter((e) => inYear(e, start, today));
  const byActivity: Record<ChartActivity, number> = {
    review: 0, documentation: 0, results: 0, coordination: 0, messages: 0, other: 0,
  };
  let visit = 0;
  let chart = 0;
  for (const e of mine) {
    const m = e.seconds / 60;
    if (e.kind === 'visit') visit += m;
    else { chart += m; byActivity[e.activity ?? 'other'] += m; }
  }
  const used = visit + chart;
  const memberDays = memberDaysThisYear(p, today);
  const expected = allocationMin * (memberDays / days);
  // The initial visit happens once, so it is counted once rather than
  // extrapolated as if it recurred. Under two months of membership the
  // projection would still be noise, so say so instead of guessing.
  const oneOff = mine.filter((e) => e.kind === 'visit' && e.label === 'Initial visit')
    .reduce((acc, e) => acc + e.seconds / 60, 0);
  const projected = memberDays >= 60 ? oneOff + ((used - oneOff) / memberDays) * days : null;
  const ratio = projected !== null && allocationMin > 0 ? projected / allocationMin : null;
  const status: PaceStatus = ratio === null ? 'new'
    : ratio >= 1.5 ? 'well-above'
      : ratio >= 1.15 ? 'above'
        : ratio > 0.85 ? 'near'
          : ratio > 0.5 ? 'below' : 'well-below';

  return {
    allocationMin, usedMin: used, visitMin: visit, chartMin: chart,
    remainingMin: allocationMin - used,
    pctUsed: allocationMin > 0 ? (used / allocationMin) * 100 : 0,
    expectedMin: expected, projectedMin: projected, status, byActivity,
    entries: mine.slice().sort((a, b) => b.date.localeCompare(a.date)),
  };
}

export const STATUS_LABEL: Record<PaceStatus, string> = {
  new: 'Too new to project',
  'well-above': 'Well above',
  above: 'Above',
  near: 'Near allocation',
  below: 'Below',
  'well-below': 'Well below',
};

// -------------------------------------------------------------- practice

export interface PracticeTime {
  cap: Capacity;
  members: number;
  allocatedHours: number;
  usedHours: number;
  visitHours: number;
  chartHours: number;
  remainingHours: number;
  yearFraction: number;
  avgPerPatientHours: number;
  /** Hours per patient per year at the pace of the last twelve weeks. */
  paceHoursPerPatient: number;
  projectedYearHours: number;
  /** How many patients the care hours cover at that pace. */
  sustainablePanel: number;
  weeks: { start: string; visit: number; chart: number }[];
  /** Planned patient-care hours in a working week. */
  plannedWeekHours: number;
}

const WINDOW_DAYS = 84;

export function practiceTime(
  c: CapacitySettings, patients: Patient[], entries: TimeEntry[], today: string,
): PracticeTime {
  const cap = capacity(c, patients.length);
  const { start, days, fraction } = yearBounds(today);
  const ytd = entries.filter((e) => inYear(e, start, today));
  let visit = 0;
  let chart = 0;
  for (const e of ytd) (e.kind === 'visit' ? (visit += e.seconds) : (chart += e.seconds));
  const usedHours = (visit + chart) / 3600;

  // Pace from the recent window, because the panel has been growing and
  // January's smaller panel says little about next month.
  const windowStart = addDays(today, -(WINDOW_DAYS - 1));
  const recentHours = entries
    .filter((e) => e.date >= windowStart && e.date <= today)
    .reduce((a, e) => a + e.seconds, 0) / 3600;
  const perDay = recentHours / WINDOW_DAYS;
  const daysLeft = days - daysBetween(start, today) - 1;
  const members = patients.length;
  const paceHoursPerPatient = members ? (perDay * 365) / members : 0;

  // Weekly totals for the last 26 weeks, Monday starts.
  const d = asDate(today);
  const monday = addDays(today, -((d.getDay() + 6) % 7));
  const weeks = Array.from({ length: 26 }, (_, i) => ({ start: addDays(monday, -7 * (25 - i)), visit: 0, chart: 0 }));
  const first = weeks[0].start;
  for (const e of entries) {
    if (e.date < first || e.date > today) continue;
    const w = Math.floor(daysBetween(first, e.date) / 7);
    if (w >= 0 && w < weeks.length) weeks[w][e.kind] += e.seconds / 3600;
  }

  return {
    cap, members,
    allocatedHours: (cap.perPatientMin * members) / 60,
    usedHours, visitHours: visit / 3600, chartHours: chart / 3600,
    remainingHours: cap.careHours - usedHours,
    yearFraction: fraction,
    avgPerPatientHours: members ? usedHours / members : 0,
    paceHoursPerPatient,
    projectedYearHours: usedHours + perDay * daysLeft,
    sustainablePanel: paceHoursPerPatient > 0 ? cap.careHours / paceHoursPerPatient : 0,
    weeks,
    plannedWeekHours: c.weeksPerYear > 0 ? cap.careHours / c.weeksPerYear : 0,
  };
}

// ----------------------------------------------------------------- clocks

export const elapsedMs = (t: RunningTimer, at = Date.now()): number =>
  t.bankedMs + (t.runningSince !== null ? at - t.runningSince : 0);

// ---------------------------------------------------------------- format

/** "4:07" under an hour, "1:02:07" over. For live clocks. */
export function fmtClock(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}

/** Whole minutes, with a floor that does not round a real minute to zero. */
export function fmtMin(min: number): string {
  if (min > 0 && min < 1) return '<1';
  return Math.round(min).toLocaleString();
}

export const fmtHours = (h: number): string =>
  h >= 100 ? Math.round(h).toLocaleString() : (Math.round(h * 10) / 10).toLocaleString();
