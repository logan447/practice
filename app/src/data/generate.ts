/**
 * A panel, generated.
 *
 * Three tidy patients is the biggest tell that a clinical prototype is
 * a demo. A real panel is a hundred-odd people with years behind them,
 * co-occurring conditions, and records that arrived from four different
 * places in three different states of repair.
 *
 * So this builds roughly 120 adults with plausible condition clusters,
 * medication regimens that follow from them, lab series with history,
 * and encounters over several years. Then it dirties the result on
 * purpose, because no chart you inherit is clean and a design that only
 * works on clean data does not work.
 *
 * Shaped after what Synthea produces, without the Java. Prevalences are
 * in the right order of magnitude for an adult primary care panel and
 * are not meant to be epidemiology.
 */
import type {
  Allergy, CarePlan, ChartDocument, Condition, Encounter, Medication, Patient,
  PreventionItem, ResultPoint, ResultReport, ResultSeries, Specialist, Task,
} from '../domain/types';
import { addDays, ORIGIN } from '../lib/clock';

// ----------------------------------------------------------------- random

/** Seeded so the same panel comes back every time it is generated. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const FIRST_F = ['Maria', 'Linda', 'Aisha', 'Yolanda', 'Grace', 'Nadia', 'Ruth', 'Priya', 'Carmen', 'Hannah', 'Fatima', 'Elena', 'Joyce', 'Thandiwe', 'Mei', 'Rosa', 'Deborah', 'Ingrid', 'Samira', 'Claudia', 'Keisha', 'Noor', 'Birgit', 'Lucia', 'Agnes', 'Tamsin', 'Oksana', 'Beatrice'];
const FIRST_M = ['James', 'Hector', 'Kwame', 'Daniel', 'Yusuf', 'Arthur', 'Raj', 'Miguel', 'Peter', 'Omar', 'Lars', 'Terrence', 'Felix', 'Dmitri', 'Caleb', 'Hiroshi', 'Simon', 'Andre', 'Marcus', 'Joel', 'Ivan', 'Nathaniel', 'Bruno', 'Soren', 'Emeka', 'Walter', 'Tomas', 'Gideon'];
const LAST = ['Delgado', 'Okafor', 'Lindqvist', 'Whitfield', 'Nakamura', 'Alvarez', 'Boateng', 'Kaplan', 'Rosenthal', 'Mwangi', 'Bergström', 'Castellanos', 'Oyelaran', 'Vance', 'Dubois', 'Haddad', 'Pereira', 'Novak', 'Ferraro', 'Sandoval', 'Achebe', 'Moreau', 'Fitzgerald', 'Rahman', 'Sorensen', 'Villanueva', 'Brennan', 'Eze', 'Kowalski', 'Thornton', 'Iqbal', 'Mbeki', 'Calderón', 'Petrov', 'Lindgren', 'Abara'];

// ------------------------------------------------------------- conditions

interface Spec {
  name: string;
  code: string;
  /** Rough share of an adult panel. */
  p: number;
  /** Raises the chance of these, because conditions travel together. */
  pulls?: string[];
  meds?: { name: string; dose: string; sig: string }[];
  series?: string[];
}

const SPECS: Spec[] = [
  { name: 'Essential hypertension', code: 'I10', p: 0.34, pulls: ['Mixed hyperlipidemia', 'Obesity'],
    meds: [{ name: 'Lisinopril', dose: '10 mg', sig: 'One tablet each morning' },
      { name: 'Amlodipine', dose: '5 mg', sig: 'One tablet each morning' }],
    series: ['Systolic blood pressure'] },
  { name: 'Mixed hyperlipidemia', code: 'E78.2', p: 0.31, pulls: ['Essential hypertension'],
    meds: [{ name: 'Atorvastatin', dose: '20 mg', sig: 'One tablet at night' }],
    series: ['LDL cholesterol', 'Triglycerides'] },
  { name: 'Obesity', code: 'E66.9', p: 0.29, pulls: ['Prediabetes', 'Obstructive sleep apnea'],
    series: ['Weight'] },
  { name: 'Prediabetes', code: 'R73.03', p: 0.22, pulls: ['Obesity'],
    series: ['Hemoglobin A1c'] },
  { name: 'Type 2 diabetes mellitus', code: 'E11.9', p: 0.11, pulls: ['Essential hypertension', 'Mixed hyperlipidemia'],
    meds: [{ name: 'Metformin', dose: '1000 mg', sig: 'One tablet twice daily with food' }],
    series: ['Hemoglobin A1c'] },
  { name: 'Generalized anxiety disorder', code: 'F41.1', p: 0.16,
    meds: [{ name: 'Sertraline', dose: '50 mg', sig: 'One tablet each morning' }] },
  { name: 'Major depressive disorder', code: 'F33.1', p: 0.12, pulls: ['Generalized anxiety disorder'],
    meds: [{ name: 'Escitalopram', dose: '10 mg', sig: 'One tablet each morning' }] },
  { name: 'Obstructive sleep apnea', code: 'G47.33', p: 0.10, pulls: ['Obesity'] },
  { name: 'Hypothyroidism', code: 'E03.9', p: 0.08,
    meds: [{ name: 'Levothyroxine', dose: '75 mcg', sig: 'One tablet on an empty stomach' }] },
  { name: 'Asthma', code: 'J45.909', p: 0.08,
    meds: [{ name: 'Albuterol', dose: '90 mcg', sig: 'Two puffs as needed' }] },
  { name: 'Gastro-oesophageal reflux', code: 'K21.9', p: 0.11,
    meds: [{ name: 'Omeprazole', dose: '20 mg', sig: 'One capsule each morning' }] },
  { name: 'Osteoarthritis', code: 'M19.90', p: 0.14, pulls: ['Obesity'] },
  { name: 'Chronic kidney disease, stage 3a', code: 'N18.31', p: 0.05,
    pulls: ['Type 2 diabetes mellitus', 'Essential hypertension'], series: ['eGFR'] },
  { name: 'Atrial fibrillation', code: 'I48.91', p: 0.04, pulls: ['Essential hypertension'],
    meds: [{ name: 'Apixaban', dose: '5 mg', sig: 'One tablet twice daily' }] },
  { name: 'Vitamin D deficiency', code: 'E55.9', p: 0.18,
    meds: [{ name: 'Vitamin D3', dose: '2000 IU', sig: 'One capsule daily' }] },
];

interface SeriesSpec { unit: string; code: string; lo: number; hi: number; refLow?: number; refHigh?: number; dp: number }

const SERIES: Record<string, SeriesSpec> = {
  'Hemoglobin A1c': { unit: '%', code: '4548-4', lo: 5.2, hi: 9.4, refLow: 4.0, refHigh: 5.6, dp: 1 },
  'LDL cholesterol': { unit: 'mg/dL', code: '13457-7', lo: 58, hi: 186, refHigh: 100, dp: 0 },
  'Triglycerides': { unit: 'mg/dL', code: '2571-8', lo: 70, hi: 320, refHigh: 150, dp: 0 },
  'Systolic blood pressure': { unit: 'mmHg', code: '8480-6', lo: 108, hi: 168, refHigh: 130, dp: 0 },
  Weight: { unit: 'lb', code: '29463-7', lo: 128, hi: 288, dp: 0 },
  eGFR: { unit: 'mL/min/1.73m²', code: '98979-8', lo: 32, hi: 88, refLow: 60, dp: 0 },
  'Potassium': { unit: 'mmol/L', code: '2823-3', lo: 3.3, hi: 5.6, refLow: 3.5, refHigh: 5.1, dp: 1 },
};

const ALLERGY_POOL = [
  { substance: 'Penicillin', reaction: 'Rash', severity: 'moderate' as const },
  { substance: 'Sulfa drugs', reaction: 'Hives', severity: 'moderate' as const },
  { substance: 'Shellfish', reaction: 'Swelling of the lips', severity: 'severe' as const },
  { substance: 'Codeine', reaction: 'Nausea and vomiting', severity: 'mild' as const },
  { substance: 'Latex', reaction: 'Contact dermatitis', severity: 'mild' as const },
  { substance: 'Ibuprofen', reaction: 'Stomach bleeding', severity: 'severe' as const },
];

/**
 * Plan goals by problem.
 *
 * Written in the patient's terms rather than the problem's, because
 * that is what the plan is for. The measure ties a goal to a trend, so
 * the clock simulation can move the number when the goal is on track.
 */
const GOALS: Record<string, {
  title: string; why: string;
  domain: 'nutrition' | 'movement' | 'sleep' | 'stress' | 'substances' | 'medical' | 'connection';
  measure?: string; actions: string[];
}[]> = {
  'Essential hypertension': [{
    title: 'Get the blood pressure under 130',
    why: 'Lower pressure over years is what protects the heart, the kidneys and the brain.',
    domain: 'medical', measure: 'Systolic blood pressure',
    actions: ['Take the morning tablet before breakfast', 'Check it at home twice a week and write it down'],
  }],
  'Prediabetes': [{
    title: 'Bring the A1c back under 5.7',
    why: 'This is the point where the change still comes from how you eat and move, not from medicine.',
    domain: 'nutrition', measure: 'Hemoglobin A1c',
    actions: ['Protein with breakfast most days', 'Swap one sweet drink a day for water'],
  }],
  'Type 2 diabetes mellitus': [{
    title: 'Hold the A1c under 7',
    why: 'Steady numbers over years are what keep the eyes, kidneys and feet well.',
    domain: 'medical', measure: 'Hemoglobin A1c',
    actions: ['Metformin twice a day with food', 'Walk after the evening meal'],
  }],
  Obesity: [{
    title: 'Lose five per cent of body weight and keep it off',
    why: 'Five per cent is enough to change blood pressure, sugar and sleep. It does not need to be more than that.',
    domain: 'movement', measure: 'Weight',
    actions: ['Walk thirty minutes, five days a week', 'Cook at home four nights a week'],
  }],
  'Mixed hyperlipidemia': [{
    title: 'Get the LDL under 100',
    why: 'This is the number the long-term heart risk follows most closely.',
    domain: 'medical', measure: 'LDL cholesterol',
    actions: ['Statin at night', 'Fish or beans twice a week in place of red meat'],
  }],
  'Obstructive sleep apnea': [{
    title: 'Use the CPAP every night',
    why: 'Sleep that is actually restful changes the blood pressure, the weight and the mood together.',
    domain: 'sleep',
    actions: ['Mask on every night, even short nights', 'Bring the usage report to the next visit'],
  }],
  'Generalized anxiety disorder': [{
    title: 'Fewer days taken up by worry',
    why: 'The aim is the days back, not a score.',
    domain: 'stress',
    actions: ['Twenty minutes outdoors daily', 'Keep the counselling appointments'],
  }],
  'Major depressive disorder': [{
    title: 'Get back to two things that used to matter',
    why: 'Doing comes before feeling like doing. That order is the treatment.',
    domain: 'connection',
    actions: ['One social plan a week, in the diary', 'Medicine at the same time each morning'],
  }],
  'Chronic kidney disease, stage 3a': [{
    title: 'Keep the kidney function steady',
    why: 'At this stage the job is to hold the line, and blood pressure is most of how that is done.',
    domain: 'medical', measure: 'eGFR',
    actions: ['No ibuprofen or naproxen', 'Blood test every six months'],
  }],
};

const OUTSIDE = ['Travis County Health', 'Capital Family Practice', 'St. David’s', 'Hill Country Clinic', 'Riverside Urgent Care', 'Lone Star Imaging'];

export interface Panel {
  patients: Patient[];
  conditions: Condition[];
  medications: Medication[];
  allergies: Allergy[];
  documents: ChartDocument[];
  resultSeries: ResultSeries[];
  resultReports: ResultReport[];
  encounters: Encounter[];
  prevention: PreventionItem[];
  specialists: Specialist[];
  carePlans: CarePlan[];
  tasks: Task[];
}

export function generatePanel(n = 120, seed = 20261114): Panel {
  const r = rng(seed);
  const pick = <T,>(xs: T[]): T => xs[Math.floor(r() * xs.length)];
  const chance = (p: number) => r() < p;
  const between = (lo: number, hi: number) => lo + r() * (hi - lo);
  const round = (v: number, dp: number) => Math.round(v * 10 ** dp) / 10 ** dp;

  const out: Panel = {
    patients: [], conditions: [], medications: [], allergies: [], documents: [],
    resultSeries: [], resultReports: [], encounters: [], prevention: [],
    specialists: [], carePlans: [], tasks: [],
  };

  let n_ = 0;
  const id = (p: string) => `${p}${(n_++).toString(36)}`;

  for (let i = 0; i < n; i++) {
    const sex: Patient['sex'] = chance(0.52) ? 'female' : 'male';
    const first = pick(sex === 'female' ? FIRST_F : FIRST_M);
    const name = `${first} ${pick(LAST)}`;
    const pid = `g${i}`;

    // adult panel, weighted to middle age
    const yearsOld = Math.round(22 + Math.pow(r(), 0.75) * 58);
    const dob = addDays(ORIGIN, -(yearsOld * 365 + Math.floor(r() * 365)));
    const tenureDays = Math.floor(r() * 900);

    out.patients.push({
      id: pid, name, preferredName: first, dob, sex,
      pronouns: sex === 'female' ? 'she/her' : 'he/him',
      membership: chance(0.18) ? (chance(0.3) ? 'pro-bono' : 'sliding-scale') : 'standard',
      memberSince: addDays(ORIGIN, -tenureDays),
      photoTone: i % 6,
      phone: `(512) 555-0${String(100 + (i % 899)).padStart(3, '0')}`,
      email: `${first.toLowerCase()}.${name.split(' ')[1].toLowerCase().replace(/[^a-z]/g, '')}@example.com`,
      pinned: chance(0.12) ? pick([
        'Works nights. Mornings do not suit.',
        'Hard of hearing. Message rather than call.',
        'Caring for a parent. Appointments need to be short.',
        'Very anxious about blood draws.',
        'Prefers to bring her daughter to visits.',
      ]) : undefined,
    });

    // --- conditions, with clustering
    const have = new Set<string>();
    for (const spec of SPECS) {
      const ageLift = yearsOld > 60 ? 1.5 : yearsOld > 45 ? 1.15 : 0.6;
      const pull = spec.pulls?.some((x) => have.has(x)) ? 2.4 : 1;
      if (chance(Math.min(spec.p * ageLift * pull, 0.9))) have.add(spec.name);
    }

    const seriesNames = new Set<string>();
    for (const name2 of have) {
      const spec = SPECS.find((x) => x.name === name2)!;
      const onset = addDays(ORIGIN, -Math.floor(between(200, 4000)));
      out.conditions.push({
        id: id('cd'), patientId: pid, name: spec.name, code: spec.code,
        status: chance(0.07) ? 'resolved' : 'active', onset,
        provenance: chance(0.4)
          ? { author: 'source', by: pick(OUTSIDE), recorded: onset }
          : { author: 'clinician', by: 'L. DuBose, MD', recorded: onset },
      });
      for (const m of spec.meds ?? []) {
        if (!chance(0.72)) continue;
        out.medications.push({
          id: id('md'), patientId: pid, name: m.name, dose: m.dose, sig: m.sig,
          started: addDays(onset, Math.floor(between(0, 120))),
          status: chance(0.12) ? 'stopped' : 'active',
          indication: spec.name,
          changeNote: chance(0.12) ? 'Stopped for side effects.' : undefined,
          provenance: { author: 'clinician', by: 'L. DuBose, MD', recorded: onset },
        });
      }
      for (const sn of spec.series ?? []) seriesNames.add(sn);
    }
    if (seriesNames.size === 0 && chance(0.6)) seriesNames.add('Weight');

    // --- lab history
    for (const sn of seriesNames) {
      const spec = SERIES[sn];
      const count = 2 + Math.floor(r() * 5);
      let value = between(spec.lo, spec.hi);
      const trend = between(-0.06, 0.03);
      const points: ResultPoint[] = [];
      for (let k = count - 1; k >= 0; k--) {
        const date = addDays(ORIGIN, -(k * Math.floor(between(70, 200)) + Math.floor(r() * 20)));
        value = value * (1 + trend) + between(-1, 1) * (spec.hi - spec.lo) * 0.03;
        const v = round(Math.max(spec.lo * 0.8, Math.min(spec.hi * 1.1, value)), spec.dp);
        points.push({
          date, value: v,
          flag: spec.refHigh !== undefined && v > spec.refHigh ? 'high'
            : spec.refLow !== undefined && v < spec.refLow ? 'low' : 'normal',
        });
      }
      points.sort((a, b) => a.date.localeCompare(b.date));
      out.resultSeries.push({
        id: id('rs'), patientId: pid, name: sn, code: spec.code, unit: spec.unit,
        refLow: spec.refLow, refHigh: spec.refHigh, points,
      });
    }

    // --- an unreviewed report for some
    const mine = out.resultSeries.filter((s) => s.patientId === pid);
    if (mine.length > 0 && chance(0.22)) {
      const resulted = mine[0].points[mine[0].points.length - 1].date;
      const worst = mine.map((s) => s.points[s.points.length - 1].flag).find((f) => f !== 'normal') ?? 'normal';
      out.resultReports.push({
        id: id('rr'), patientId: pid, panel: 'Routine panel',
        resulted, worstFlag: worst, acknowledged: false, seriesIds: mine.map((s) => s.id),
      });
      out.tasks.push({
        id: id('tk'), patientId: pid, kind: 'result', text: 'Routine panel back',
        due: resulted, urgent: worst !== 'normal', done: false,
      });
    }

    // --- allergies
    if (chance(0.34)) {
      const a = pick(ALLERGY_POOL);
      const when = addDays(ORIGIN, -Math.floor(between(300, 3000)));
      out.allergies.push({
        id: id('al'), patientId: pid, substance: a.substance, reaction: a.reaction,
        severity: a.severity, recorded: when,
        provenance: { author: 'source', by: pick(OUTSIDE), recorded: when },
      });
    }

    // --- encounters
    //
    // Each one carries a short signed note. A signed encounter with no
    // note in it would read as a bug, and the history is most of what
    // makes a chart worth navigating in the first place.
    const problemList = [...have].slice(0, 3).join(', ') || 'no active problems';
    const visits = Math.min(6, Math.floor(tenureDays / 110));
    for (let v = 0; v < visits; v++) {
      const date = addDays(ORIGIN, -Math.floor(between(20, tenureDays || 60)));
      const reason = pick(['Routine review', 'Medication review', 'Results review', 'New symptom', 'Annual physical']);
      out.encounters.push({
        id: id('en'), patientId: pid, date,
        kind: v === visits - 1 ? 'initial' : chance(0.2) ? 'annual' : 'follow-up',
        reason,
        status: 'signed', duration: pick([20, 30, 45, 75]), signedAt: date,
        note: {
          subjective: {
            oneLiner: `${first}, ${yearsOld}, with ${problemList}.`,
            reason, chartReview: '', diagnostics: '', specialists: '',
            additional: pick([
              'Doing broadly what we agreed. Sticking points are the evenings and the weekends.',
              'No new symptoms. Tablets taken as written, with the occasional missed day.',
              'Reports feeling steadier than at the last visit. Sleep still broken.',
              'Busy stretch at work and the walking stopped. Wants to restart rather than change the plan.',
            ]),
          },
          objective: {
            homeMeasures: '', vitals: `BP ${Math.round(between(112, 148))}/${Math.round(between(68, 92))}. Weight ${Math.round(between(140, 272))} lb.`,
            exam: 'Well. Heart sounds normal, chest clear, no oedema.',
          },
          assessment: {
            oneLiner: '',
            overall: pick([
              'Stable. Continue as we are and review in three months.',
              'Moving in the right direction, slowly, which is the only way it moves.',
              'Not where we want it. Worth one change rather than three.',
            ]),
          },
          plan: { problems: [], overall: pick(['Continue. Review in three months.', 'Repeat bloods before the next visit.', 'One change, reviewed in six weeks.']) },
        },
      });
    }

    // --- the next visit, for some. A panel with nothing booked in it
    //     is a panel nobody is running.
    if (chance(0.34)) {
      const when = addDays(ORIGIN, Math.floor(between(1, 70)));
      const kind = chance(0.18) ? 'annual' : chance(0.15) ? 'acute' : 'follow-up';
      out.encounters.push({
        id: id('en'), patientId: pid, date: when, kind,
        reason: pick(['Routine review', 'Medication review', 'Results review', 'Annual physical']),
        status: 'scheduled', duration: kind === 'annual' ? 75 : kind === 'acute' ? 20 : 30,
      });
    }

    // --- prevention
    for (const item of ['Influenza vaccine', 'Lipid panel', 'Colonoscopy', 'Blood pressure check']) {
      if (!chance(0.65)) continue;
      const st = r();
      out.prevention.push({
        id: id('pv'), patientId: pid, name: item,
        status: st < 0.14 ? 'overdue' : st < 0.32 ? 'due' : 'current',
        lastDone: st >= 0.32 ? addDays(ORIGIN, -Math.floor(between(30, 700))) : undefined,
        dueBy: st < 0.32 ? addDays(ORIGIN, Math.floor(between(-180, 120))) : undefined,
      });
    }

    // --- a specialist for some
    if (chance(0.26)) {
      out.specialists.push({
        id: id('sp'), patientId: pid,
        name: `Dr. ${pick(FIRST_F.concat(FIRST_M))} ${pick(LAST)}`,
        specialty: pick(['Cardiology', 'Endocrinology', 'Nephrology', 'Gastroenterology', 'Orthopaedics', 'Psychiatry']),
        practice: pick(OUTSIDE), phone: '(512) 555-03' + String(10 + (i % 89)),
        lastSeen: addDays(ORIGIN, -Math.floor(between(40, 900))),
        findings: 'See the letter on file.',
        outstanding: chance(0.4) ? 'Awaiting their follow-up letter.' : 'None.',
      });
    }

    // --- a care plan, which is the screen this record opens on
    const goalSpecs = [...have].flatMap((c) => GOALS[c] ?? []).slice(0, 3);
    if (goalSpecs.length > 0 && chance(0.82)) {
      const signed = chance(0.84);
      const updated = addDays(ORIGIN, -Math.floor(between(10, 300)));
      out.carePlans.push({
        id: id('cp'), patientId: pid, version: 1 + Math.floor(r() * 3), updated,
        signed, signedBy: signed ? 'L. DuBose, MD' : undefined,
        summary: pick([
          'Hold the ground we have gained and keep the medicine list as short as it can be.',
          'One change at a time, reviewed every six weeks.',
          'The numbers are moving. The work now is keeping it going without it taking over your life.',
        ]),
        goals: goalSpecs.map((g) => {
          const st2 = r();
          const sid = g.measure
            ? out.resultSeries.find((x) => x.patientId === pid && x.name === g.measure)?.id
            : undefined;
          return {
            id: id('gl'), title: g.title, why: g.why, domain: g.domain,
            status: st2 < 0.52 ? 'on-track' : st2 < 0.78 ? 'needs-attention'
              : st2 < 0.92 ? 'not-started' : 'met',
            measure: sid && g.measure ? { seriesId: sid, label: g.measure } : undefined,
            actions: g.actions.map((t) => ({
              id: id('ac'), text: t, owner: 'patient' as const, done: chance(0.4),
            })),
          };
        }),
        provenance: { author: 'clinician', by: 'L. DuBose, MD', recorded: updated },
      });
    }

    // --- outside documents, in three states of repair
    const docs = Math.floor(r() * 3);
    for (let d = 0; d < docs; d++) {
      const st = r();
      const status: ChartDocument['status'] = st < 0.62 ? 'parsed' : st < 0.88 ? 'scanned' : 'failed';
      const date = addDays(ORIGIN, -Math.floor(between(30, 2000)));
      out.documents.push({
        id: id('dc'), patientId: pid, from: pick(OUTSIDE), date, status,
        ...pick([
          { kind: 'referral' as const, title: 'Referral letter' },
          { kind: 'discharge' as const, title: 'Discharge summary' },
          { kind: 'consult' as const, title: 'Consultation note' },
          { kind: 'imaging' as const, title: 'Imaging report' },
          { kind: 'lab' as const, title: 'Outside labs' },
        ]),
        text: status === 'parsed'
          ? 'Seen in clinic. History and examination as documented. Plan discussed with the patient and a copy sent to the primary care physician.'
          : status === 'failed'
            ? 'PÅTIENT NÅME: ####  D.O.B //// ILLEGIBLE ////  rn1l1gram5 qd  <<OCR CONFIDENCE 0.31>>'
            : undefined,
        reviewed: chance(0.55),
      });
    }
  }

  dirty(out, rng(seed ^ 0x5eed));
  return out;
}

// ------------------------------------------------------------- the mess

/**
 * Deliberate damage.
 *
 * Every one of these is something that turns up in a real chart on a
 * normal day. They are introduced here so the interface has to cope
 * with them rather than assume them away.
 */
function dirty(panel: Panel, r: () => number): void {
  const pick = <T,>(xs: T[]): T => xs[Math.floor(r() * xs.length)];
  const some = <T,>(xs: T[], n: number): T[] => {
    const out: T[] = [];
    for (let i = 0; i < n && xs.length; i++) out.push(pick(xs));
    return [...new Set(out)];
  };

  // 1. the same medicine, twice, from two sources, spelled differently
  for (const m of some(panel.medications.filter((x) => x.status === 'active'), 14)) {
    panel.medications.push({
      ...m,
      id: m.id + '-dup',
      name: m.name.toLowerCase(),
      dose: m.dose.replace(' ', ''),
      sig: m.sig.toLowerCase() + ' (per outside list)',
      provenance: { author: 'source', by: pick(OUTSIDE), recorded: m.started },
    });
  }

  // 2. the same allergy recorded twice, disagreeing about how bad it is
  for (const a of some(panel.allergies, 8)) {
    panel.allergies.push({
      ...a,
      id: a.id + '-dup',
      substance: a.substance === 'Penicillin' ? 'PCN' : a.substance.toUpperCase(),
      reaction: 'Anaphylaxis',
      severity: 'severe',
      provenance: { author: 'source', by: pick(OUTSIDE), recorded: a.recorded },
    });
  }

  // 3. a medicine with no dose, because the sending system had none
  for (const m of some(panel.medications, 9)) {
    m.dose = '';
  }

  // 4. results from an outside lab with no reference range
  for (const s of some(panel.resultSeries, 11)) {
    s.from = pick(OUTSIDE);
    s.refLow = undefined;
    s.refHigh = undefined;
    s.points = s.points.map((p) => ({ ...p, flag: 'normal' }));
  }

  // 5. a medicine started before the condition it treats was recorded
  for (const m of some(panel.medications.filter((x) => x.indication), 7)) {
    m.started = '2011-03-02';
  }

  // 6. two charts for what may be the same person: the registration a
  //    front desk makes when a search for the surname came back empty.
  for (const p of panel.patients.slice(0, 2)) {
    const [first, ...rest] = p.name.split(' ');
    panel.patients.push({
      ...p,
      id: p.id + '-alt',
      // same surname, same birthday, the first name shortened the way
      // somebody writes it when they are reading it off a form
      name: [`${first.slice(0, 1)}.`, ...rest].join(' '),
      preferredName: undefined,
      email: '',
      pinned: undefined,
    });
  }
}

const OUTSIDE_NAMES = OUTSIDE;
export { OUTSIDE_NAMES };
