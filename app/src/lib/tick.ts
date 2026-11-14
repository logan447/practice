/**
 * What happens while you are not looking.
 *
 * Advancing the clock is not just relabelling dates. Between Monday and
 * the Monday after, ordered labs come back, prevention goes overdue,
 * and patients who track at home add readings. Without that, a
 * longitudinal practice cannot be tested at all — every screen shows
 * the same instant forever.
 *
 * Results drift toward the target when a care-plan goal covering that
 * measure is on track, and away from it when nothing is being done.
 * That is a simulation, not a claim about medicine: it exists so the
 * chart answers back when the plan changes.
 */
import type {
  CarePlan, Order, PatientEntry, PreventionItem, ResultPoint, ResultReport,
  ResultSeries, Task,
} from '../domain/types';
import { addDays, daysBetween } from './clock';
import { newId } from './persist';

export interface TickInput {
  from: string;
  to: string;
  orders: Order[];
  resultSeries: ResultSeries[];
  resultReports: ResultReport[];
  prevention: PreventionItem[];
  carePlans: CarePlan[];
  patientEntries: PatientEntry[];
  tasks: Task[];
}

export interface TickOutput {
  resultSeries: ResultSeries[];
  resultReports: ResultReport[];
  prevention: PreventionItem[];
  patientEntries: PatientEntry[];
  tasks: Task[];
  orders: Order[];
  /** Plain-language account of what changed, for the clock panel. */
  events: string[];
}

/** Deterministic jitter so advancing twice does not give the same noise. */
function rand(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 1000) / 1000;
}

const round = (v: number, dp: number) => Math.round(v * 10 ** dp) / 10 ** dp;

function flagFor(s: ResultSeries, value: number): ResultPoint['flag'] {
  if (s.refHigh !== undefined && value > s.refHigh) return 'high';
  if (s.refLow !== undefined && value < s.refLow) return 'low';
  return 'normal';
}

/** Is a goal covering this measure being worked on? */
function onTrack(plans: CarePlan[], seriesId: string): boolean | undefined {
  for (const p of plans) {
    for (const g of p.goals) {
      if (g.measure?.seriesId === seriesId) {
        return g.status === 'on-track' || g.status === 'met';
      }
    }
  }
  return undefined;
}

function nextValue(s: ResultSeries, plans: CarePlan[], seed: string): number {
  const last = s.points[s.points.length - 1];
  const spread = Math.max(Math.abs(last.value) * 0.04, 0.1);
  const noise = (rand(seed) - 0.5) * spread;

  const tracked = onTrack(plans, s.id);
  let drift = 0;
  if (s.target) {
    const gap = s.target.value - last.value;
    const towardTarget = s.target.direction === 'below' ? Math.min(gap, 0) : Math.max(gap, 0);
    // improving moves a fifth of the way; neglected drifts back a little
    drift = tracked === false ? -towardTarget * 0.08 : towardTarget * 0.2;
  } else if (tracked === false) {
    drift = spread * 0.5;
  }

  const dp = Number.isInteger(last.value) ? 0 : 1;
  return round(last.value + drift + noise, dp);
}

export function tick(input: TickInput): TickOutput {
  const { from, to } = input;
  const events: string[] = [];

  let series = [...input.resultSeries];
  const reports = [...input.resultReports];
  const tasks = [...input.tasks];
  const entries = [...input.patientEntries];
  let orders = [...input.orders];

  // ---------------------------------------------- ordered labs come back
  const turnaround = 4;
  const landed = orders.filter((o) =>
    o.kind === 'lab' && daysBetween(o.created, to) >= turnaround && o.status !== 'placed');

  for (const o of landed) {
    const mine = series.filter((s) => s.patientId === o.patientId && s.source !== 'patient');
    if (mine.length === 0) continue;
    const resulted = addDays(o.created, turnaround);
    const touched: string[] = [];

    series = series.map((s) => {
      if (s.patientId !== o.patientId || s.source === 'patient') return s;
      if (s.points.some((p) => p.date === resulted)) return s;
      const value = nextValue(s, input.carePlans, s.id + resulted);
      touched.push(s.id);
      return { ...s, points: [...s.points, { date: resulted, value, flag: flagFor(s, value) }] };
    });

    if (touched.length === 0) continue;
    const worst = touched
      .map((id) => series.find((s) => s.id === id)!.points.slice(-1)[0].flag)
      .find((f) => f !== 'normal') ?? 'normal';

    reports.push({
      id: newId('rr'), patientId: o.patientId, panel: o.text,
      resulted, worstFlag: worst, acknowledged: false, seriesIds: touched,
    });
    tasks.push({
      id: newId('tk'), patientId: o.patientId, kind: 'result',
      text: `${o.text} back`, due: resulted, urgent: worst !== 'normal', done: false,
    });
    events.push(`Result back: ${o.text}`);
  }
  const landedIds = new Set(landed.map((o) => o.id));
  orders = orders.map((o) => (landedIds.has(o.id) ? { ...o, status: 'placed' as const } : o));

  // ------------------------------------------------- prevention goes stale
  const prevention = input.prevention.map((i) => {
    if (i.status === 'due' && i.dueBy && i.dueBy < to) {
      events.push(`Overdue: ${i.name}`);
      return { ...i, status: 'overdue' as const };
    }
    return i;
  });

  // ------------------------------------- patients who track keep tracking
  const gap = daysBetween(from, to);
  if (gap >= 5) {
    const trackers = [...new Set(series.filter((s) => s.source === 'patient').map((s) => s.patientId))];
    for (const pid of trackers) {
      const when = addDays(from, Math.max(1, Math.floor(gap / 2)));
      let added = false;
      series = series.map((s) => {
        if (s.patientId !== pid || s.source !== 'patient') return s;
        if (s.points.some((p) => p.date === when)) return s;
        const value = nextValue(s, input.carePlans, s.id + when + 'home');
        added = true;
        return { ...s, points: [...s.points, { date: when, value, flag: 'normal' }] };
      });
      if (added) {
        entries.push({
          id: newId('pe'), patientId: pid, date: when, kind: 'measurement',
          label: 'Readings', body: 'Logged from home while you were away.',
          provenance: { author: 'patient', by: 'Patient', recorded: when },
        });
        events.push('New home readings');
      }
    }
  }

  return { resultSeries: series, resultReports: reports, prevention, patientEntries: entries, tasks, orders, events };
}
