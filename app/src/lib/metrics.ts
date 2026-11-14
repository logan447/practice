/**
 * Measuring the thing being decided.
 *
 * The question behind this whole build is whether a self-made record
 * beats a bought one, and that question is settled in minutes per
 * patient, not in features. So the prototype times itself from the
 * first visit: how long a note takes, how much of it was clicking, how
 * long the chart was open beforehand, and how much AI-drafted text
 * survived to signature unedited.
 *
 * Wall-clock time here is real time, not the simulated clinic date.
 * Both matter and they are not the same thing.
 */
import { load, save } from './persist';

const KEY = 'dlm-emr-metrics-v1';

export interface VisitMetric {
  encounterId: string;
  patientId: string;
  patientName: string;
  /** Real epoch ms, not clinic date. */
  openedAt: number;
  signedAt?: number;
  /** Seconds spent on the chart immediately before opening the visit. */
  chartSecondsBefore: number;
  clicks: number;
  keystrokes: number;
  /** Sections the assistant filled during this visit. */
  aiSections: number;
  /** Of those, how many the physician then changed. */
  aiEdited: number;
}

interface Store {
  visits: VisitMetric[];
}

function read(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Store) : { visits: [] };
  } catch {
    return { visits: [] };
  }
}

function write(s: Store): void {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

let active: string | null = null;
let chartOpenedAt: number | null = null;
const listeners = new Set<() => void>();

const notify = () => listeners.forEach((f) => f());

export function subscribe(f: () => void): () => void {
  listeners.add(f);
  return () => listeners.delete(f);
}

export const allVisits = (): VisitMetric[] => read().visits;

/** Chart opened. Time here is the chart review that precedes a visit. */
export function markChartOpen(): void {
  chartOpenedAt = Date.now();
}

export function startVisit(encounterId: string, patientId: string, patientName: string): void {
  const s = read();
  if (s.visits.some((v) => v.encounterId === encounterId && !v.signedAt)) {
    active = encounterId;
    return;
  }
  const before = chartOpenedAt ? Math.round((Date.now() - chartOpenedAt) / 1000) : 0;
  s.visits.push({
    encounterId, patientId, patientName,
    openedAt: Date.now(), chartSecondsBefore: Math.min(before, 3600),
    clicks: 0, keystrokes: 0, aiSections: 0, aiEdited: 0,
  });
  write(s);
  active = encounterId;
  chartOpenedAt = null;
  notify();
}

export function endVisit(): void {
  active = null;
}

function bump(fn: (v: VisitMetric) => void): void {
  if (!active) return;
  const s = read();
  const v = s.visits.find((x) => x.encounterId === active && !x.signedAt);
  if (!v) return;
  fn(v);
  write(s);
}

export const countClick = (): void => bump((v) => { v.clicks += 1; });
export const countKey = (): void => bump((v) => { v.keystrokes += 1; });
export const countAiSection = (n: number): void => bump((v) => { v.aiSections += n; });
export const countAiEdit = (): void => bump((v) => { v.aiEdited += 1; });

export function signVisit(encounterId: string): void {
  const s = read();
  const v = s.visits.find((x) => x.encounterId === encounterId && !x.signedAt);
  if (v) { v.signedAt = Date.now(); write(s); notify(); }
  active = null;
}

export function clearMetrics(): void {
  write({ visits: [] });
  notify();
}

// ------------------------------------------------------------- summarise

export interface Summary {
  n: number;
  medianMinutes: number;
  medianClicks: number;
  medianChartSeconds: number;
  aiKeptPct: number | null;
}

const median = (xs: number[]): number => {
  if (xs.length === 0) return 0;
  const a = [...xs].sort((x, y) => x - y);
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
};

export function summarise(visits: VisitMetric[]): Summary {
  const done = visits.filter((v) => v.signedAt);
  const mins = done.map((v) => (v.signedAt! - v.openedAt) / 60000);
  const ai = done.filter((v) => v.aiSections > 0);
  const kept = ai.length
    ? ai.reduce((acc, v) => acc + (v.aiSections - v.aiEdited) / v.aiSections, 0) / ai.length
    : null;
  return {
    n: done.length,
    medianMinutes: Math.round(median(mins) * 10) / 10,
    medianClicks: Math.round(median(done.map((v) => v.clicks))),
    medianChartSeconds: Math.round(median(done.map((v) => v.chartSecondsBefore))),
    aiKeptPct: kept === null ? null : Math.round(kept * 100),
  };
}

/** Persisted alongside the clinical store, under its own key. */
export const _debug = { read, write, load, save };
