/**
 * A full panel, for seeing physician time roll up.
 *
 * Fictional. Names are recombined from common first and last names and
 * belong to nobody. Phone numbers sit in the 555-0100 to 555-0199 block
 * reserved for fiction; email addresses are on example.com.
 *
 * Deterministic: the same seed gives the same panel every time, so a
 * screenshot taken today matches one taken next week.
 *
 * How much time each person takes is drawn from the intensity priors in
 * docs/strategy/unit-economics.md §3 (from the archived archetype work):
 * 55% light (~3.5 hr a year), 36% moderate (~6), 6% heavy (~14) and 3%
 * very heavy (~20), each jittered. Those are estimates, not observations;
 * this data exists to exercise the dashboard, not to predict the practice.
 * About 55% of time goes to visits and 45% to chart work, following the
 * weekly rhythm in the same document (~11 hr visits, ~9 hr messages,
 * results and per-patient admin).
 */
import type { ChartActivity, Condition, Patient, TimeEntry } from '../domain/types';
import { addDays, asDate, daysBetween } from '../lib/clock';

// ------------------------------------------------------------- the three

const V = (id: string, patientId: string, date: string, min: number, label: string, encounterId?: string): TimeEntry => ({
  id, patientId, date, kind: 'visit', label, encounterId, seconds: min * 60,
  source: encounterId ? 'ambient' : 'timer',
});
const C = (id: string, patientId: string, date: string, min: number, activity: ChartActivity, note?: string): TimeEntry => ({
  id, patientId, date, kind: 'chart', activity, seconds: min * 60, source: 'timer', note,
});

/** Hand-written histories that match the three example charts. */
export const exampleTime: TimeEntry[] = [
  // Marcus: steady, about on pace.
  V('te1', 'p1', '2026-02-09', 34, 'Follow-up'),
  C('te2', 'p1', '2026-02-09', 12, 'documentation'),
  C('te3', 'p1', '2026-03-03', 9, 'coordination', 'Sleep study referral and results'),
  C('te4', 'p1', '2026-04-27', 14, 'review', 'Before the annual'),
  V('te5', 'p1', '2026-05-04', 78, 'Annual physical', 'e3'),
  C('te6', 'p1', '2026-05-04', 16, 'documentation'),
  C('te7', 'p1', '2026-06-18', 8, 'results', 'A1c after stopping metformin'),
  C('te8', 'p1', '2026-07-22', 6, 'messages'),
  V('te9', 'p1', '2026-09-02', 41, 'Follow-up', 'e2'),
  C('te10', 'p1', '2026-09-02', 11, 'documentation'),
  C('te11', 'p1', '2026-10-28', 7, 'messages', 'Question about the tablet'),
  C('te12', 'p1', '2026-11-07', 10, 'results', 'Lipids and A1c'),

  // Dana: joined in January, lighter so far.
  V('te20', 'p2', '2026-01-21', 88, 'Initial visit'),
  C('te21', 'p2', '2026-01-21', 22, 'review', 'Outside records'),
  C('te22', 'p2', '2026-03-10', 8, 'messages'),
  V('te23', 'p2', '2026-05-12', 32, 'Follow-up'),
  C('te24', 'p2', '2026-05-12', 9, 'documentation'),
  V('te25', 'p2', '2026-08-14', 29, 'Follow-up'),
  C('te26', 'p2', '2026-11-12', 6, 'review', 'Sleep journal'),

  // Art: kidney function falling, potassium up, hard of hearing so every
  // contact is video or written. Well above allocation, and that is the
  // point of the note on the chart: care follows need.
  V('te40', 'p3', '2026-01-14', 52, 'Follow-up'),
  C('te41', 'p3', '2026-01-14', 18, 'documentation'),
  C('te42', 'p3', '2026-02-02', 24, 'coordination', 'Nephrology referral'),
  C('te43', 'p3', '2026-02-20', 15, 'results'),
  V('te44', 'p3', '2026-03-18', 46, 'Follow-up'),
  C('te45', 'p3', '2026-03-18', 14, 'documentation'),
  C('te46', 'p3', '2026-04-09', 28, 'coordination', 'Nephrology letter and medicines reconciliation'),
  C('te47', 'p3', '2026-05-06', 12, 'messages'),
  V('te48', 'p3', '2026-06-03', 61, 'Follow-up'),
  C('te49', 'p3', '2026-06-03', 17, 'documentation'),
  C('te50', 'p3', '2026-07-21', 20, 'results', 'Foot exam and labs'),
  V('te51', 'p3', '2026-07-21', 38, 'Follow-up'),
  C('te52', 'p3', '2026-08-25', 26, 'coordination', 'Ophthalmology, still not booked'),
  C('te53', 'p3', '2026-09-30', 14, 'messages'),
  V('te54', 'p3', '2026-10-14', 55, 'Follow-up'),
  C('te55', 'p3', '2026-10-14', 16, 'documentation'),
  C('te56', 'p3', '2026-11-11', 22, 'results', 'Potassium 5.3, eGFR down'),
  C('te57', 'p3', '2026-11-12', 15, 'messages', 'Arranged this week\'s visit by message'),
];

// ---------------------------------------------------------- the generator

/** mulberry32: small, fast, and the same everywhere. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST_F = ['Maria', 'Grace', 'Aisha', 'Lauren', 'Rosa', 'Mei', 'Hannah', 'Fatima', 'Nicole', 'Sofia',
  'Keisha', 'Emily', 'Lucia', 'Anjali', 'Rachel', 'Tamara', 'Elena', 'Joy', 'Ruth', 'Yolanda', 'Ines', 'Brenda',
  'Naomi', 'Leah', 'Carmen', 'Diane', 'Ana', 'Kim', 'Patricia', 'Monique'];
const FIRST_M = ['James', 'Luis', 'David', 'Kwame', 'Ethan', 'Raj', 'Samuel', 'Andre', 'Miguel', 'Thomas',
  'Hiro', 'Daniel', 'Omar', 'Paul', 'Carlos', 'Isaac', 'Victor', 'Malik', 'Robert', 'Nathan', 'Tuan', 'Gary',
  'Felix', 'Wesley', 'Hector', 'Dennis', 'Ray', 'Aaron', 'Joel', 'Curtis'];
const LAST = ['Alvarez', 'Bennett', 'Chen', 'Delgado', 'Ellis', 'Fontaine', 'Garza', 'Hughes', 'Ibarra', 'Jensen',
  'Kim', 'Lopez', 'Mensah', 'Nguyen', 'Ortiz', 'Patel', 'Quinn', 'Ramos', 'Sato', 'Turner', 'Underwood',
  'Varga', 'Washington', 'Xu', 'Young', 'Zamora', 'Adeyemi', 'Brooks', 'Castillo', 'Dubois', 'Estrada',
  'Fischer', 'Gomez', 'Hale', 'Iyer', 'Jackson', 'Kowalski', 'Moreno', 'Novak', 'Price'];

const CONDITIONS: [string, string][] = [
  ['Essential hypertension', 'I10'], ['Prediabetes', 'R73.03'], ['Type 2 diabetes', 'E11.9'],
  ['Mixed hyperlipidemia', 'E78.2'], ['Obesity', 'E66.9'], ['Obstructive sleep apnea', 'G47.33'],
  ['Generalized anxiety disorder', 'F41.1'], ['Major depressive disorder, recurrent', 'F33.1'],
  ['Hypothyroidism', 'E03.9'], ['Osteoarthritis of knee', 'M17.9'], ['Chronic low back pain', 'M54.50'],
  ['Asthma', 'J45.909'], ['GERD', 'K21.9'], ['Insomnia', 'G47.00'], ['Migraine', 'G43.909'],
  ['Chronic kidney disease, stage 3a', 'N18.31'], ['Atrial fibrillation', 'I48.91'], ['Heart failure', 'I50.9'],
];

type Archetype = { share: number; hours: number; label: string; conditions: [number, number] };
const ARCHETYPES: Archetype[] = [
  { share: 0.55, hours: 3.5, label: 'light', conditions: [0, 2] },
  { share: 0.36, hours: 6, label: 'moderate', conditions: [1, 3] },
  { share: 0.06, hours: 14, label: 'heavy', conditions: [2, 4] },
  { share: 0.03, hours: 20, label: 'very heavy', conditions: [3, 5] },
];

const pick = <T,>(r: () => number, xs: T[]) => xs[Math.floor(r() * xs.length)];

/**
 * Thirteen weeks away a year (39 working, per the base case), as weeks
 * counted from 1 January. Spread the way a year usually goes: a week
 * after New Year, spring break, summer, Thanksgiving, the holidays.
 */
const AWAY_WEEKS = new Set([0, 10, 11, 21, 25, 26, 27, 34, 35, 43, 46, 50, 51]);
/** Monday-anchored week of the year, matching the weekly chart. */
function weekOfYear(iso: string): number {
  const jan1 = `${iso.slice(0, 4)}-01-01`;
  const firstMonday = addDays(jan1, -((asDate(jan1).getDay() + 6) % 7));
  return Math.floor(daysBetween(firstMonday, iso) / 7);
}

const isWorkday = (iso: string) => {
  const dow = asDate(iso).getDay();
  return dow !== 0 && dow !== 6 && !AWAY_WEEKS.has(weekOfYear(iso));
};

/** The first working day on or after `iso`, for a member's first visit. */
function workday(iso: string): string {
  let d = iso;
  for (let i = 0; i < 30 && !isWorkday(d); i++) d = addDays(d, 1);
  return d;
}

export interface GeneratedPanel {
  patients: Patient[];
  conditions: Condition[];
  timeEntries: TimeEntry[];
}

/**
 * `count` more members, with their time this year up to `today`.
 * Clocks are only ever stopped on past days, so nothing lands in the future.
 */
export function generatePanel(count: number, today: string, seed = 20261114): GeneratedPanel {
  const r = rng(seed);
  const patients: Patient[] = [];
  const conditions: Condition[] = [];
  const timeEntries: TimeEntry[] = [];
  const year = today.slice(0, 4);
  const jan1 = `${year}-01-01`;
  let te = 0;

  for (let i = 0; i < count; i++) {
    const id = `g${String(i + 1).padStart(3, '0')}`;
    const female = r() < 0.54;
    const first = pick(r, female ? FIRST_F : FIRST_M);
    const last = pick(r, LAST);
    const ageYears = 24 + Math.floor(r() ** 0.9 * 56);
    const dob = addDays(`${Number(year) - ageYears}-01-01`, Math.floor(r() * 364));

    // The panel grew: about 60% were members before this year.
    const memberSince = r() < 0.6
      ? addDays(`${Number(year) - 1}-01-15`, Math.floor(r() * 330))
      : addDays(jan1, Math.floor(r() * Math.max(1, daysBetween(jan1, addDays(today, -21)))));

    const m = r();
    const membership: Patient['membership'] = m < 0.8 ? 'standard' : m < 0.94 ? 'sliding-scale' : 'pro-bono';

    // Archetype by the documented mix.
    let roll = r();
    let a = ARCHETYPES[0];
    for (const x of ARCHETYPES) { if (roll < x.share) { a = x; break; } roll -= x.share; }

    patients.push({
      id, name: `${first} ${last}`, preferredName: first, dob,
      sex: female ? 'female' : 'male', pronouns: female ? 'she/her' : 'he/him',
      membership, memberSince, photoTone: Math.floor(r() * 6),
      phone: `(512) 555-01${String(Math.floor(r() * 100)).padStart(2, '0')}`,
      email: `${first[0].toLowerCase()}.${last.toLowerCase()}@example.com`,
    });

    const nCond = a.conditions[0] + Math.floor(r() * (a.conditions[1] - a.conditions[0] + 1));
    const used = new Set<number>();
    for (let k = 0; k < nCond; k++) {
      // heavier patients reach further down the list, into the conditions that take more time
      const span = a.label === 'light' ? 11 : a.label === 'moderate' ? 15 : CONDITIONS.length;
      const c = Math.floor(r() * span);
      if (used.has(c)) continue;
      used.add(c);
      conditions.push({
        id: `${id}c${k}`, patientId: id, name: CONDITIONS[c][0], code: CONDITIONS[c][1],
        status: 'active', onset: memberSince,
        provenance: { author: 'clinician', by: 'L. DuBose, MD', recorded: memberSince },
      });
    }

    // ---- this year's time
    const from = memberSince > jan1 ? memberSince : jan1;
    const span = daysBetween(from, today);
    if (span < 1) continue;
    const annualMin = a.hours * 60 * (0.75 + r() * 0.5);
    const budget = annualMin * (span / 365);
    // A random working day in their time this year. Redrawn rather than
    // shifted, so weeks away do not pile their work into the week after.
    const at = (): string => {
      let d = from;
      for (let i = 0; i < 40; i++) {
        d = addDays(from, Math.floor(r() * span));
        if (isWorkday(d)) return d;
      }
      return d;
    };
    const push = (e: Omit<TimeEntry, 'id' | 'patientId'>) => {
      if (e.date > today) return;
      timeEntries.push({ ...e, id: `gt${(te++).toString(36)}`, patientId: id });
    };

    let visitBudget = budget * 0.55;
    let chartBudget = budget * 0.45;

    // A first visit for anyone who joined this year. It comes out of their
    // time rather than on top of it: the priors are whole-year figures.
    if (memberSince >= jan1) {
      const intake = 80 + r() * 25;
      const records = 15 + r() * 20;
      push({ date: workday(memberSince), kind: 'visit', label: 'Initial visit', seconds: Math.round(intake * 60), source: 'ambient' });
      push({ date: workday(memberSince), kind: 'chart', activity: 'review', seconds: Math.round(records * 60), source: 'timer', note: 'Outside records' });
      visitBudget -= intake;
      chartBudget -= records;
    }
    let gotAnnual = false;
    while (visitBudget > 0) {
      const annual: boolean = !gotAnnual && span > 120 && r() < 0.35;
      const acute = !annual && r() < 0.25;
      const min = annual ? 70 + r() * 15 : acute ? 15 + r() * 12 : 25 + r() * 18;
      // The last visit happens with a chance in proportion to what is left,
      // so on average the total matches the budget instead of overshooting it.
      if (min > visitBudget && r() > visitBudget / min) break;
      gotAnnual = gotAnnual || annual;
      push({
        date: at(), kind: 'visit', seconds: Math.round(min * 60), source: r() < 0.85 ? 'ambient' : 'timer',
        label: annual ? 'Annual physical' : acute ? 'Acute concern' : 'Follow-up',
      });
      visitBudget -= min;
    }
    const acts: ChartActivity[] = ['documentation', 'documentation', 'results', 'results', 'messages', 'messages', 'review', 'coordination', 'other'];
    while (chartBudget > 0) {
      const min = 4 + r() * 18;
      if (min > chartBudget && r() > chartBudget / min) break;
      push({ date: at(), kind: 'chart', activity: pick(r, acts), seconds: Math.round(min * 60), source: 'timer' });
      chartBudget -= min;
    }
  }

  return { patients, conditions, timeEntries };
}
