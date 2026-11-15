/**
 * The longitudinal layer: what a chart looks like after years of it.
 *
 * The generated panel gives people, problems, drugs and visits. This
 * adds the record those visits would have left behind: vitals at
 * every visit and some from their own cuff at home, lab panels that
 * come back as panels and not as loose numbers, examinations dated to
 * the day they were performed, imaging and procedures, the care
 * management and consent records billing would need, lifestyle
 * prescriptions with a status somebody has to keep current, and a
 * living summary that is deliberately a little out of date.
 *
 * Three things it is built to make visible.
 *
 * Depth varies. A member of three weeks has one visit and no series,
 * and the summary shows empty states rather than hiding them. A
 * member of five years has twenty visits and eight lab draws, which
 * is the case the longitudinal view exists for. Both are in the
 * panel, because a structure that only works at one depth is not a
 * structure.
 *
 * Numbers agree with each other. A1c, LDL, blood pressure and weight
 * follow one arc per patient, and the gauge on each problem is read
 * off that arc rather than drawn separately, so the assessment and
 * the results cannot contradict each other. BMI is computed from a
 * height and a weight. Nothing here is a real measurement; everything
 * here is internally consistent, which is what makes the screen worth
 * judging.
 *
 * The summary is stale on purpose. Every patient with a summary has
 * between one and five records newer than it, so the synthesis step
 * has real material and the header's count is not decoration.
 *
 * Fictional throughout. Assumptions owned: the prevalence of home
 * monitoring, how often care management is taken up, and the share of
 * charts whose examination predates the last visit are guesses in the
 * right order of magnitude, not measured rates.
 */
import type {
  CareLogEntry, Condition, ConditionTrend, DiagnosticStudy, EmRecord, Encounter, ExamRecord,
  LabPanel, LabValue, LifestyleDomain, LifestyleIntervention, LifestyleStatus,
  MasterPlan, Medication, MdmLevel, Patient, PreventionItem, ProblemCheckIn,
  CheckInFeeling, OnPlan, ServiceConsent, VitalsSet,
} from '../domain/types';
import { addDays, ORIGIN } from '../lib/clock';
import { composeStatement } from '../lib/synthesis';
import type { Depth, Panel } from './generate';

// ------------------------------------------------------------- random

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const OUTSIDE = ['Travis County Health', 'Capital Family Practice', 'St. David’s', 'Hill Country Clinic', 'Lone Star Imaging'];

export interface LongitudinalLayer {
  vitals: VitalsSet[];
  labPanels: LabPanel[];
  exams: ExamRecord[];
  studies: DiagnosticStudy[];
  masterPlans: MasterPlan[];
  lifestyle: LifestyleIntervention[];
  emRecords: EmRecord[];
  careLog: CareLogEntry[];
  consents: ServiceConsent[];
  checkIns: ProblemCheckIn[];
}

/** The direction a patient's numbers are moving overall. */
type Arc = 'improving' | 'holding' | 'slipping';

// ---------------------------------------------------------------- labs

const L = (
  key: string, name: string, value: number, unit: string,
  refLow?: number, refHigh?: number,
): LabValue => ({
  key, name, value, unit, refLow, refHigh,
  flag: refHigh !== undefined && value > refHigh ? 'high'
    : refLow !== undefined && value < refLow ? 'low' : 'normal',
});

const r1 = (v: number) => Math.round(v * 10) / 10;
const r2 = (v: number) => Math.round(v * 100) / 100;

const cbc = (id: string, pid: string, date: string, wbc: number, hgb: number, plt: number): LabPanel => ({
  id, patientId: pid, date, group: 'cbc', name: 'Complete blood count',
  values: [
    L('WBC', 'White cell count', r1(wbc), 'K/uL', 4.0, 11.0),
    L('Hgb', 'Haemoglobin', r1(hgb), 'g/dL', 12.0, 15.5),
    L('Hct', 'Haematocrit', Math.round(hgb * 2.98), '%', 36, 46),
    L('Plt', 'Platelets', Math.round(plt), 'K/uL', 150, 400),
  ],
});

const cmp = (
  id: string, pid: string, date: string,
  o: { na: number; k: number; bun: number; cr: number; glu: number; egfr: number; alt: number },
): LabPanel => ({
  id, patientId: pid, date, group: 'cmp', name: 'Comprehensive metabolic panel',
  values: [
    L('Na', 'Sodium', Math.round(o.na), 'mmol/L', 136, 145),
    L('K', 'Potassium', r1(o.k), 'mmol/L', 3.5, 5.1),
    L('Cl', 'Chloride', Math.round(o.na - 36), 'mmol/L', 98, 107),
    L('CO2', 'Bicarbonate', Math.round(24 + (o.egfr < 50 ? -2 : 1)), 'mmol/L', 22, 29),
    L('BUN', 'Urea nitrogen', Math.round(o.bun), 'mg/dL', 7, 20),
    L('Cr', 'Creatinine', r2(o.cr), 'mg/dL', 0.5, 1.1),
    L('Glu', 'Glucose', Math.round(o.glu), 'mg/dL', 70, 99),
    L('eGFR', 'eGFR', Math.round(o.egfr), 'mL/min/1.73m²', 60, undefined),
    L('ALT', 'Alanine aminotransferase', Math.round(o.alt), 'U/L', 7, 35),
    L('AST', 'Aspartate aminotransferase', Math.round(o.alt * 0.85), 'U/L', 8, 33),
    L('Alb', 'Albumin', r1(4.1), 'g/dL', 3.5, 5.0),
  ],
});

const lipid = (id: string, pid: string, date: string, ldl: number, hdl: number, tg: number): LabPanel => ({
  id, patientId: pid, date, group: 'lipid', name: 'Lipid panel',
  values: [
    L('TC', 'Total cholesterol', Math.round(ldl + hdl + tg / 5), 'mg/dL', undefined, 200),
    L('LDL', 'LDL cholesterol', Math.round(ldl), 'mg/dL', undefined, 100),
    L('HDL', 'HDL cholesterol', Math.round(hdl), 'mg/dL', 50, undefined),
    L('TG', 'Triglycerides', Math.round(tg), 'mg/dL', undefined, 150),
  ],
});

const metabolic = (id: string, pid: string, date: string, a1c: number, uacr?: number): LabPanel => ({
  id, patientId: pid, date, group: 'metabolic', name: 'Diabetes monitoring',
  values: [
    L('A1c', 'Haemoglobin A1c', r1(a1c), '%', 4.0, 5.6),
    ...(uacr !== undefined ? [L('UACR', 'Urine albumin/creatinine', Math.round(uacr), 'mg/g', undefined, 30)] : []),
  ],
});

const thyroid = (id: string, pid: string, date: string, tsh: number): LabPanel => ({
  id, patientId: pid, date, group: 'thyroid', name: 'Thyroid',
  values: [L('TSH', 'Thyrotropin', r1(tsh), 'uIU/mL', 0.4, 4.5)],
});

// ------------------------------------------------------------- the exam

const EXAM_LINES: Record<string, string[]> = {
  General: ['Well, no distress.', 'Well. Comfortable at rest.', 'Looks better than at the last visit.'],
  Cardiovascular: [
    'Regular rate and rhythm. No murmur. No peripheral oedema.',
    'Regular rate and rhythm. Soft systolic murmur, unchanged.',
    'Regular rate and rhythm. Trace ankle oedema, both sides.',
  ],
  Respiratory: ['Clear to auscultation bilaterally.', 'Clear. No wheeze today.', 'Scattered expiratory wheeze, both bases.'],
  Feet: [
    'Monofilament intact at all sites. Pulses present. Skin intact.',
    'Monofilament reduced at two sites on the left. Pulses present.',
    'Pulses present. Callus under the right first metatarsal head, no ulceration.',
  ],
  Musculoskeletal: [
    'Crepitus on knee flexion, both sides. No effusion. Full range.',
    'Lumbar movement reduced in flexion. Straight leg raise negative.',
    'Knees unchanged. Walking without aid.',
  ],
  Abdomen: ['Soft, non-tender. No organomegaly.', 'Soft. Mild epigastric tenderness, no guarding.'],
  Neurological: ['Alert and oriented. Gait steady.', 'No focal deficit. Vibration reduced at both great toes.'],
  Mood: ['Bright and engaged.', 'Flat affect. Answers fully. No thoughts of self harm on asking.'],
};

// ------------------------------------------------------ lifestyle pool

const LIFESTYLE_POOL: Record<LifestyleDomain, string[]> = {
  nutrition: [
    'Protein at breakfast most days. One sweet drink a day swapped for water.',
    'Cook at home four nights a week, with two of them planned on the weekend.',
    'Half the plate vegetables at the evening meal, five days a week.',
    'No eating after nine on work nights.',
  ],
  activity: [
    'Twenty minutes of walking after the evening meal, five days a week.',
    'Thirty minutes of walking, five days a week, split into two if that is easier.',
    'Two sessions a week of resistance work with bands at home.',
    'Stand and walk for five minutes every hour of the shift.',
  ],
  sleep: [
    'In bed by eleven on work nights, phone out of the room.',
    'CPAP every night, including short nights.',
    'Same wake time seven days a week, weekends included.',
  ],
  stress: [
    'Ten minutes of breathing work before the shift, using the app already on the phone.',
    'One afternoon a week that belongs to nobody else.',
    'Keep the counselling appointments, including the ones that feel unnecessary.',
  ],
  connection: [
    'One social plan a week, in the diary before the week starts.',
    'Walk with a neighbour twice a week rather than alone.',
  ],
  substances: [
    'Two drink-free days a week to start, moving to four.',
    'Nicotine replacement from the quit date, with a follow-up call in two weeks.',
    'No alcohol on the nights before an early shift.',
  ],
};

const DOMAINS_FOR: Record<string, LifestyleDomain[]> = {
  'Essential hypertension': ['activity', 'nutrition', 'substances'],
  'Type 2 diabetes mellitus': ['nutrition', 'activity'],
  Prediabetes: ['nutrition', 'activity'],
  Obesity: ['nutrition', 'activity'],
  'Mixed hyperlipidemia': ['nutrition'],
  'Obstructive sleep apnea': ['sleep'],
  'Generalized anxiety disorder': ['stress', 'sleep'],
  'Major depressive disorder': ['connection', 'activity'],
  Osteoarthritis: ['activity'],
  'Chronic low back pain': ['activity'],
  'Coronary artery disease': ['activity', 'nutrition'],
  'Heart failure with preserved ejection fraction': ['nutrition', 'activity'],
  'Chronic kidney disease, stage 3a': ['nutrition'],
};

/**
 * What the patient says before the visit, in the first person.
 *
 * Asked per problem rather than once, because "how are you doing" gets
 * one answer and "how is the blood pressure going, and are you
 * managing the plan we agreed" gets six different ones. Keyed by how
 * they say it is going, so the words and the answer cannot disagree
 * with each other.
 */
const SAID: Record<CheckInFeeling, string[]> = {
  better: [
    'Honestly this one feels better than it did. I can tell from the stairs more than from any number.',
    'Better. I have been doing what we agreed and I think it is working.',
    'Much better since the change. I was not expecting it to make a difference that fast.',
    'Good. This is the one I am least worried about now.',
  ],
  same: [
    'About the same. Not worse, which I will take.',
    'No change that I can feel. I am doing the same things.',
    'Same as last time. I would like to understand whether that is good enough.',
    'Steady. Nothing new to report on this one.',
  ],
  worse: [
    'Worse, and I think I know why. Work has been relentless and the plan went out of the window.',
    'Worse. I have been meaning to call about it.',
    'Not good. I stopped one of the tablets because of how it made me feel and did not say.',
    'Going backwards. I would like to talk about this one properly rather than at the end of the visit.',
  ],
  unsure: [
    'I genuinely do not know. Nothing feels different but I do not know what the numbers say.',
    'Not sure. I cannot tell this one apart from everything else that is going on.',
    'No idea if this is better or worse. Tell me what you see.',
  ],
};

const SAID_OVERALL: Record<CheckInFeeling, string[]> = {
  better: [
    'Overall better than when I started here. The main thing is that I understand what we are doing now.',
    'Better. Still a lot of tablets, and that is the part I would like to work on.',
  ],
  same: [
    'Much the same. Work is the thing making everything harder, not the medicine.',
    'No real change. I would like one thing to focus on rather than five.',
  ],
  worse: [
    'Worse, and I think it is the sleep. Everything else follows that.',
    'Not a good few months. I have not kept up with any of it and I would rather say so than pretend.',
  ],
  unsure: [
    'Hard to say. Some days fine, some days not, and I cannot see the pattern.',
    'I do not know. I would like to go through the numbers together and decide.',
  ],
};

const BARRIERS = [
  'Shift pattern makes the evenings unpredictable.',
  'Knees hurt by the end of it. Managing two or three days rather than five.',
  'Started well and stopped when work got busy. Wants to restart rather than change it.',
  'No plan for the weekends yet. That is where it comes apart.',
  'Cost. Has asked whether there is a cheaper version of this.',
];

// ------------------------------------------------------------- the work

export function longitudinal(panel: Panel, seed = 777): LongitudinalLayer {
  const r = rng(seed);
  const pick = <T,>(xs: T[]): T => xs[Math.floor(r() * xs.length)];
  const chance = (p: number) => r() < p;
  const between = (lo: number, hi: number) => lo + r() * (hi - lo);

  const out: LongitudinalLayer = {
    vitals: [], labPanels: [], exams: [], studies: [], masterPlans: [],
    lifestyle: [], emRecords: [], careLog: [], consents: [], checkIns: [],
  };

  let n = 0;
  const id = (p: string) => `${p}${(n++).toString(36)}`;

  const condsBy = new Map<string, Condition[]>();
  for (const c of panel.conditions) {
    const xs = condsBy.get(c.patientId) ?? [];
    xs.push(c);
    condsBy.set(c.patientId, xs);
  }
  const medsBy = new Map<string, Medication[]>();
  for (const m of panel.medications) {
    const xs = medsBy.get(m.patientId) ?? [];
    xs.push(m);
    medsBy.set(m.patientId, xs);
  }
  const prevBy = new Map<string, PreventionItem[]>();
  for (const x of panel.prevention) {
    const xs = prevBy.get(x.patientId) ?? [];
    xs.push(x);
    prevBy.set(x.patientId, xs);
  }

  for (const p of panel.patients) {
    const depth: Depth = panel.depth[p.id] ?? 'established';
    const visits = panel.visits[p.id] ?? [];
    const conds = (condsBy.get(p.id) ?? []).filter((c) => c.status === 'active');
    const managed = conds.filter((c) => c.managed !== false);
    const meds = (medsBy.get(p.id) ?? []).filter((m) => m.status === 'active');
    const has = (name: string) => conds.some((c) => c.name === name);
    const onDrug = (name: string) => meds.some((m) => m.name.toLowerCase().startsWith(name.toLowerCase()));
    const yearsOld = Math.max(18, Math.floor((Date.parse(ORIGIN) - Date.parse(p.dob)) / 31557600000));

    const arc: Arc = chance(0.36) ? 'improving' : chance(0.62) ? 'holding' : 'slipping';
    const step = arc === 'improving' ? -1 : arc === 'slipping' ? 1 : 0;

    // Height, so BMI is computed rather than asserted.
    const heightIn = Math.round(p.sex === 'female' ? between(60, 69) : between(64, 74));

    // ------------------------------------------------------- vitals
    const htn = has('Essential hypertension');
    const sysStart = (htn ? between(146, 168) : between(116, 136))
      + (has('Chronic kidney disease, stage 3a') ? 6 : 0);
    const wtStart = has('Obesity')
      ? between(heightIn * 3.3, heightIn * 4.1)
      : between(heightIn * 2.2, heightIn * 3.1);

    // Total movement drawn once, then interpolated. Rolling the size
    // of the change at every visit makes the series wander, and a
    // chart whose gauge says improving while the last two weights went
    // up is a chart nobody will trust twice.
    const sysDelta = step * between(14, 26);
    const wtDelta = step * between(6, 22);

    const officeVitals: VitalsSet[] = [];
    visits.forEach((visit, k) => {
      const through = visits.length > 1 ? k / (visits.length - 1) : 1;
      const sys = Math.round(sysStart + sysDelta * through + between(-2.5, 2.5));
      const dia = Math.round(sys * 0.57 + between(-3, 3));
      const wt = Math.round(wtStart + wtDelta * through + between(-1.2, 1.2));
      const v: VitalsSet = {
        id: id('v'), patientId: p.id, date: visit.date, source: 'office',
        encounterId: visit.id,
        systolic: sys, diastolic: dia,
        heartRate: Math.round(between(60, 88)),
        weightLb: wt,
        bmi: Math.round((703 * wt) / (heightIn * heightIn) * 10) / 10,
        ...(visit.kind !== 'follow-up' || chance(0.4)
          ? {
            temperatureF: Math.round(between(97.4, 98.9) * 10) / 10,
            spo2: Math.round(has('Obstructive sleep apnea') || has('Asthma') ? between(93, 97) : between(96, 99)),
            respRate: Math.round(between(12, 18)),
          }
          : {}),
      };
      officeVitals.push(v);
      out.vitals.push(v);
    });

    // Their own cuff. Lower than clinic, more often, and only for the
    // people who were actually asked to do it.
    const lastOffice = officeVitals[officeVitals.length - 1];
    if (htn && depth !== 'new' && lastOffice?.systolic && chance(0.5)) {
      const count = 3 + Math.floor(r() * 6);
      for (let k = count - 1; k >= 0; k--) {
        out.vitals.push({
          id: id('vh'), patientId: p.id, date: addDays(ORIGIN, -(k * 12 + Math.floor(between(1, 5)))),
          source: 'home',
          systolic: Math.round(lastOffice.systolic - between(4, 11) - (count - k) * 0.4),
          diastolic: Math.round(lastOffice.systolic * 0.56 - between(3, 8)),
          ...(chance(0.4) ? { heartRate: Math.round(between(58, 80)) } : {}),
        });
      }
    }

    // --------------------------------------------------- lab panels
    const draws = depth === 'new' ? (chance(0.5) ? 1 : 0)
      : depth === 'establishing' ? 1 + Math.floor(r() * 2)
        : depth === 'established' ? 3 + Math.floor(r() * 3)
          : 5 + Math.floor(r() * 4);

    // Bloods a few days before the visit they were discussed at, which
    // is how they actually arrive.
    const drawVisits = visits.slice(-draws);
    const dm = has('Type 2 diabetes mellitus');
    const pre = has('Prediabetes');
    const ckd = has('Chronic kidney disease, stage 3a');
    const hld = has('Mixed hyperlipidemia') || has('Coronary artery disease');

    const a1cStart = dm ? between(7.2, 9.6) : pre ? between(5.7, 6.4) : between(5.0, 5.6);
    const ldlStart = hld ? between(118, 192) : between(78, 132);
    const egfrStart = ckd ? between(42, 58) : between(68, 104) - Math.max(0, yearsOld - 60) * 0.3;
    const a1cDelta = step * between(0.5, 1.6);
    const onStatin = onDrug('Atorvastatin') || onDrug('Simvastatin');
    const ldlDelta = (onStatin ? -1 : step) * between(14, 46);

    drawVisits.forEach((visit, k) => {
      const through = drawVisits.length > 1 ? k / (drawVisits.length - 1) : 1;
      const date = addDays(visit.date, -Math.floor(between(2, 7)));
      const a1c = a1cStart + a1cDelta * through + between(-0.08, 0.08);
      const ldl = ldlStart + ldlDelta * through + between(-3, 3);
      const egfr = egfrStart - through * (ckd ? between(1, 5) : 0) * -step;
      const glu = (dm ? between(118, 178) : pre ? between(98, 116) : between(78, 98))
        + step * through * (dm ? 20 : 6);
      const fromOutside = chance(0.14);
      const panelFrom = fromOutside ? pick(OUTSIDE) : undefined;

      const made: LabPanel[] = [];
      if (visit.kind !== 'follow-up' || chance(0.55)) {
        made.push(cbc(id('lb'), p.id, date, between(4.5, 9.8), between(11.4, 15.2), between(170, 360)));
      }
      made.push(cmp(id('lb'), p.id, date, {
        na: between(136, 143), glu, egfr,
        k: between(3.6, 4.8) + (onDrug('Spironolactone') || onDrug('Lisinopril') ? 0.4 : 0),
        bun: ckd ? between(20, 32) : between(9, 19),
        cr: ckd ? between(1.2, 1.7) : between(0.6, 1.08),
        alt: between(14, 44),
      }));
      if (hld || dm || has('Essential hypertension') || has('Obesity')) {
        made.push(lipid(id('lb'), p.id, date, ldl, between(36, 62), between(88, 268)));
      }
      if (dm || pre || ckd) {
        made.push(metabolic(id('lb'), p.id, date, a1c,
          dm || ckd ? Math.round(between(6, 68)) : undefined));
      }
      if (has('Hypothyroidism') || onDrug('Levothyroxine')) {
        made.push(thyroid(id('lb'), p.id, date, between(0.6, 6.2)));
      }
      for (const m of made) {
        // Outside labs arrive without a reference range more often
        // than anyone would like.
        out.labPanels.push(panelFrom
          ? { ...m, from: panelFrom, values: m.values.map((x) => ({ ...x, refLow: undefined, refHigh: undefined, flag: 'normal' as const })) }
          : m);
      }
    });

    // -------------------------------------------------------- exams
    const systems = ['General', 'Cardiovascular', 'Respiratory',
      ...(dm ? ['Feet'] : []),
      ...(has('Osteoarthritis') || has('Chronic low back pain') ? ['Musculoskeletal'] : []),
      ...(has('Gastro-oesophageal reflux') ? ['Abdomen'] : []),
      ...(has('Major depressive disorder') || has('Generalized anxiety disorder') ? ['Mood'] : []),
      ...(ckd || dm ? ['Neurological'] : []),
    ];
    // Examined at most visits, and for about a quarter of charts not at
    // the most recent one, which is the case the summary has to flag
    // rather than carry the old findings forward silently.
    const examinable = depth === 'new' ? visits
      : chance(0.26) ? visits.slice(0, -1) : visits;
    const carried = new Map<string, string>();
    for (const visit of examinable) {
      if (depth !== 'new' && chance(0.22)) continue;
      const findings = systems
        .filter((sys) => sys === 'General' || sys === 'Cardiovascular' || chance(0.7))
        .map((sys) => {
          const existing = carried.get(sys);
          const text = existing && !chance(0.22) ? existing : pick(EXAM_LINES[sys]);
          carried.set(sys, text);
          return { system: sys, text };
        });
      if (findings.length === 0) continue;
      out.exams.push({
        id: id('ex'), patientId: p.id, encounterId: visit.id, date: visit.date,
        by: 'L. DuBose, MD', findings,
      });
    }

    // --------------------------------------------------- diagnostics
    const study = (
      kind: DiagnosticStudy['kind'], name: string, impression: string,
      significant: boolean, backLo: number, backHi: number, inOffice = false,
    ) => {
      out.studies.push({
        id: id('st'), patientId: p.id,
        date: addDays(ORIGIN, -Math.floor(between(backLo, backHi))),
        kind, name, from: inOffice ? 'In office' : pick(OUTSIDE),
        impression, significant,
      });
    };
    if (depth !== 'new') {
      if (p.sex === 'female' && yearsOld >= 40 && chance(0.7)) {
        study('screening', 'Screening mammogram',
          chance(0.86)
            ? 'BI-RADS 1. No evidence of malignancy. Routine screening in one year.'
            : 'BI-RADS 3. Probably benign. Short interval follow-up in six months.',
          chance(0.2), 120, 1000);
      }
      if (yearsOld >= 45 && chance(0.55)) {
        study('procedure', 'Screening colonoscopy',
          chance(0.6)
            ? 'No polyps. Repeat in ten years.'
            : 'Two diminutive tubular adenomas removed. Repeat in seven years.',
          true, 200, 2400);
      }
      if ((htn || hld || has('Coronary artery disease') || has('Atrial fibrillation')) && chance(0.6)) {
        study('cardiac', 'Electrocardiogram',
          has('Atrial fibrillation')
            ? 'Atrial fibrillation, rate 88. No acute ischaemic change.'
            : chance(0.7)
              ? 'Sinus rhythm. No acute change.'
              : 'Sinus rhythm. Left ventricular hypertrophy by voltage.',
          chance(0.4), 30, 900, true);
      }
      if (dm && chance(0.72)) {
        study('screening', 'Dilated diabetic eye examination',
          chance(0.8)
            ? 'No diabetic retinopathy. Repeat in one year.'
            : 'Mild non-proliferative diabetic retinopathy, both eyes. Repeat in six months.',
          chance(0.3), 60, 800);
      }
      if (has('Osteoarthritis') && chance(0.6)) {
        study('imaging', 'Knee radiographs, both',
          'Moderate medial compartment joint space narrowing, both knees. Osteophytes.',
          true, 300, 2000);
      }
      if (has('Obstructive sleep apnea') && chance(0.75)) {
        study('procedure', 'Home sleep study',
          `Apnoea hypopnoea index ${Math.round(between(14, 54))}. Moderate to severe obstructive sleep apnoea.`,
          true, 400, 2200);
      }
      if (p.sex === 'female' && yearsOld >= 65 && chance(0.5)) {
        study('screening', 'Bone density, DXA',
          chance(0.5) ? 'T score -1.6 at the femoral neck. Osteopenia.' : 'T score -0.8. Normal.',
          chance(0.5), 200, 1400);
      }
      if (has('Chronic low back pain') && chance(0.4)) {
        study('imaging', 'Lumbar spine MRI',
          'Degenerative disc disease at L4-L5 and L5-S1. No nerve root compression.',
          true, 200, 1600);
      }
    }

    // ----------------------------------------------- trends on gauges
    //
    // Read off the arc and the series rather than drawn separately, so
    // the gauge and the numbers under it cannot disagree.
    const governing: Record<string, boolean> = {
      'Essential hypertension': officeVitals.length >= 2,
      'Type 2 diabetes mellitus': draws >= 2,
      Prediabetes: draws >= 2,
      'Mixed hyperlipidemia': draws >= 2,
      Obesity: officeVitals.length >= 2,
      'Chronic kidney disease, stage 3a': draws >= 2,
    };
    const fromArc: ConditionTrend = arc === 'improving' ? 'improving'
      : arc === 'slipping' ? 'worsening' : 'stable';
    const lastVisitDate = visits[visits.length - 1]?.date;
    for (const c of managed) {
      if (depth === 'new' || !lastVisitDate) {
        c.trend = 'not-assessed';
        continue;
      }
      if (governing[c.name]) {
        c.trend = fromArc;
        c.trendAssessed = lastVisitDate;
        c.trendNote = fromArc === 'improving'
          ? 'Moving the right way on the last two sets of numbers.'
          : fromArc === 'worsening'
            ? 'Worse than at the previous review. Needs a change rather than a repeat.'
            : 'Holding where it was. No change indicated.';
        continue;
      }
      // No measure of its own. Assessed where somebody plausibly
      // would have, and left honestly unassessed where not.
      if (chance(0.55)) {
        c.trend = chance(0.6) ? 'stable' : fromArc;
        c.trendAssessed = lastVisitDate;
      } else {
        c.trend = 'not-assessed';
      }
    }

    // ---------------------------------------------- lifestyle medicine
    const wanted = [...new Set(managed.flatMap((c) => DOMAINS_FOR[c.name] ?? []))];
    const lsCount = depth === 'new' ? 0
      : depth === 'establishing' ? Math.min(wanted.length, 1 + Math.floor(r() * 2))
        : depth === 'established' ? Math.min(wanted.length, 2 + Math.floor(r() * 2))
          : Math.min(wanted.length, 3 + Math.floor(r() * 2));
    for (let k = 0; k < lsCount; k++) {
      const domain = wanted[k];
      if (!domain) break;
      const forConds = managed.filter((c) => (DOMAINS_FOR[c.name] ?? []).includes(domain)).map((c) => c.id);
      const st = r();
      const status: LifestyleStatus = st < 0.14 ? 'not-started'
        : st < 0.56 ? 'active' : st < 0.78 ? 'struggling' : 'achieved';
      const started = visits[Math.max(0, visits.length - 1 - Math.floor(between(0, 3)))]?.date
        ?? addDays(ORIGIN, -200);
      out.lifestyle.push({
        id: id('li'), patientId: p.id, domain,
        prescription: pick(LIFESTYLE_POOL[domain]),
        forConditions: forConds,
        status, started,
        reviewed: status === 'not-started' ? undefined : lastVisitDate,
        barrier: status === 'struggling' || status === 'not-started' ? pick(BARRIERS) : undefined,
      });
    }

    // ------------------------------------------- the E/M record per visit
    //
    // The elements, not a conclusion. Some left unselected because
    // that is the honest state of a chart on a Tuesday.
    if (depth !== 'new') {
      for (const visit of visits.slice(-Math.min(3, visits.length))) {
        const addressed = managed.slice(0, 1 + Math.floor(r() * 3));
        if (addressed.length === 0) continue;
        const nearPanels = out.labPanels.filter(
          (x) => x.patientId === p.id && x.date <= visit.date && x.date >= addDays(visit.date, -21),
        );
        const dataReviewed = [
          ...(nearPanels.length > 0 ? [`Reviewed ${nearPanels.map((x) => x.name).join(', ')}`] : []),
          ...(chance(0.5) ? ['Reviewed outside records'] : []),
          ...(chance(0.45) ? ['Ordered repeat bloods before the next visit'] : []),
        ];
        const lv = (nn: number): MdmLevel => (nn >= 3 ? 'high' : nn === 2 ? 'moderate' : 'low');
        const risk: MdmLevel = meds.some((m) => /warfarin|eliquis|insulin|spironolactone/i.test(m.name))
          ? 'high' : addressed.length >= 2 ? 'moderate' : 'low';
        const decided = chance(0.62);
        out.emRecords.push({
          encounterId: visit.id,
          problemsAddressed: addressed.map((c) => c.id),
          dataReviewed,
          problemsLevel: lv(addressed.length),
          dataLevel: dataReviewed.length >= 3 ? 'moderate' : dataReviewed.length >= 1 ? 'low' : 'straightforward',
          riskLevel: risk,
          totalMinutes: Math.round(between(18, 48)),
          ...(decided
            ? {
              selectedBy: (chance(0.7) ? 'mdm' : 'time') as 'mdm' | 'time',
              code: (addressed.length >= 3 && risk === 'high' ? '99215'
                : addressed.length >= 2 ? '99214' : '99213') as EmRecord['code'],
            }
            : {}),
        });
      }
    }

    // -------------------------------- care management, with its consent
    const chronic = managed.length;
    const month = ORIGIN.slice(0, 7);
    if (chronic >= 2 && (depth === 'established' || depth === 'deep') && chance(0.38)) {
      const consentDate = visits[Math.max(0, visits.length - 3)]?.date ?? addDays(ORIGIN, -300);
      out.consents.push({
        id: id('co'), patientId: p.id, program: 'ccm', date: consentDate, method: chance(0.8) ? 'verbal' : 'written',
        by: 'L. DuBose, MD',
        note: 'Explained what care management covers between visits, that only one practice can provide and be billed for it in a calendar month, that there may be cost sharing, and that it can be stopped at any time. Agreed.',
      });
      const entries = 2 + Math.floor(r() * 4);
      for (let k = 0; k < entries; k++) {
        out.careLog.push({
          id: id('cl'), patientId: p.id, program: 'ccm',
          date: `${month}-${String(2 + Math.floor(r() * 12)).padStart(2, '0')}`,
          minutes: Math.round(between(5, 16)),
          by: 'L. DuBose, MD', role: 'physician', countable: true,
          activity: pick([
            'Call about the blood pressure readings from home, plan agreed in the portal.',
            'Chased the specialist letter and spoke with their scheduler.',
            'Reviewed the repeat bloods and replied with what they mean.',
            'Sorted the pharmacy list against ours after two duplicates turned up.',
            'Call about the overdue screening and what is stopping it.',
          ]),
        });
      }
      // The entry that keeps the programme honest.
      out.careLog.push({
        id: id('cl'), patientId: p.id, program: 'ccm',
        date: `${month}-${String(9 + Math.floor(r() * 5)).padStart(2, '0')}`,
        minutes: Math.round(between(4, 9)),
        by: 'Assistant (automated)', role: 'automated', countable: false,
        excludedBecause: 'Time spent by software is not clinical staff time and cannot count toward a care management threshold.',
        activity: 'Drafted the longitudinal summary update from the latest results.',
      });

      if ((has('Generalized anxiety disorder') || has('Major depressive disorder')) && chance(0.6)) {
        out.consents.push({
          id: id('co'), patientId: p.id, program: 'bhi', date: consentDate, method: 'verbal',
          by: 'L. DuBose, MD',
          note: 'Explained behavioural health care management, the monthly check-in, the use of a questionnaire to track how things are going, and that it can be stopped at any time. Agreed.',
        });
        out.careLog.push({
          id: id('cl'), patientId: p.id, program: 'bhi',
          date: `${month}-${String(3 + Math.floor(r() * 10)).padStart(2, '0')}`,
          minutes: Math.round(between(10, 22)),
          by: 'L. DuBose, MD', role: 'physician', countable: true,
          activity: `PHQ-9 reviewed (score ${Math.round(between(3, 16))}). Safety screen negative. Plan unchanged.`,
        });
      }
    }

    // ------------------------------------- what they said beforehand
    //
    // Sent in before a visit, one answer per problem, plus one about
    // their health overall. Not everybody answers everything, and the
    // blanks are left blank rather than filled with "no concerns".
    const nextVisit = (panel.encounters.find(
      (e) => e.patientId === p.id && e.status === 'scheduled',
    ) ?? {}) as { id?: string; date?: string };
    const anchorVisit = nextVisit.date
      ? { id: nextVisit.id, date: nextVisit.date }
      : visits[visits.length - 1];
    if (anchorVisit && chance(depth === 'new' ? 0.4 : 0.78)) {
      // Sent a few days before the visit, but never dated in the
      // future: a chart that shows an answer from next month is a
      // chart whose dates nobody trusts.
      const ahead = anchorVisit.date > ORIGIN;
      const sentOn = ahead
        ? addDays(ORIGIN, -Math.floor(between(0, 5)))
        : addDays(anchorVisit.date, -Math.floor(between(1, 4)));
      const feel = (): CheckInFeeling => {
        const roll = r();
        if (arc === 'improving') return roll < 0.55 ? 'better' : roll < 0.85 ? 'same' : 'unsure';
        if (arc === 'slipping') return roll < 0.5 ? 'worse' : roll < 0.8 ? 'same' : 'unsure';
        return roll < 0.2 ? 'better' : roll < 0.72 ? 'same' : roll < 0.88 ? 'worse' : 'unsure';
      };
      const onPlan = (): OnPlan => (chance(0.42) ? 'yes' : chance(0.65) ? 'partly' : 'no');
      for (const c of managed) {
        // Somebody who answers four of six is the normal case.
        if (chance(0.22)) continue;
        const f = feel();
        out.checkIns.push({
          id: id('ci'), patientId: p.id, encounterId: anchorVisit.id, date: sentOn,
          about: { kind: 'condition', id: c.id },
          feeling: f, onPlan: onPlan(), text: pick(SAID[f]),
        });
      }
      for (const li of out.lifestyle.filter((x) => x.patientId === p.id)) {
        if (!chance(0.55)) continue;
        const f: CheckInFeeling = li.status === 'achieved' ? 'better'
          : li.status === 'struggling' ? 'worse' : li.status === 'not-started' ? 'unsure' : 'same';
        out.checkIns.push({
          id: id('ci'), patientId: p.id, encounterId: anchorVisit.id, date: sentOn,
          about: { kind: 'lifestyle', id: li.id },
          feeling: f,
          onPlan: li.status === 'achieved' ? 'yes' : li.status === 'not-started' ? 'no' : 'partly',
          text: pick(SAID[f]),
        });
      }
      for (const item of (prevBy.get(p.id) ?? []).filter((x) => x.status !== 'current')) {
        if (!chance(0.4)) continue;
        out.checkIns.push({
          id: id('ci'), patientId: p.id, encounterId: anchorVisit.id, date: sentOn,
          about: { kind: 'prevention', id: item.id },
          feeling: 'unsure',
          onPlan: 'no',
          text: pick([
            'I keep meaning to book this and then the week goes.',
            'I would rather not, if I am honest. Can we talk about it.',
            'I thought this had been done already. Nobody sent me anything.',
            'Tell me again why this one matters and I will book it.',
          ]),
        });
      }
      if (chance(0.82)) {
        const f = feel();
        out.checkIns.push({
          id: id('ci'), patientId: p.id, encounterId: anchorVisit.id, date: sentOn,
          about: { kind: 'overall' },
          feeling: f, text: pick(SAID_OVERALL[f]),
        });
      }
    }

    // ------------------------------------------------ the living summary
    if (depth !== 'new' && visits.length >= 2 && !(depth === 'establishing' && chance(0.25))) {
      out.masterPlans.push(buildMaster({
        p, depth, conds, managed, meds, visits,
        encounters: panel.encounters.filter((e) => e.patientId === p.id && e.status === 'signed'),
        checkIns: out.checkIns.filter((c) => c.patientId === p.id),
        prevention: prevBy.get(p.id) ?? [],
        lifestyle: out.lifestyle.filter((x) => x.patientId === p.id),
        panels: out.labPanels.filter((x) => x.patientId === p.id),
        vitals: out.vitals.filter((x) => x.patientId === p.id),
        studies: out.studies.filter((x) => x.patientId === p.id),
        exams: out.exams.filter((x) => x.patientId === p.id),
        arc, pick, between, chance,
      }));
    }
  }

  return out;
}

// ------------------------------------------------------- the summary text

interface MasterInput {
  p: Patient;
  depth: Depth;
  conds: Condition[];
  managed: Condition[];
  meds: Medication[];
  visits: { id: string; date: string; kind: string }[];
  encounters: Encounter[];
  checkIns: ProblemCheckIn[];
  prevention: PreventionItem[];
  lifestyle: LifestyleIntervention[];
  panels: LabPanel[];
  vitals: VitalsSet[];
  studies: DiagnosticStudy[];
  exams: ExamRecord[];
  arc: Arc;
  pick: <T>(xs: T[]) => T;
  between: (lo: number, hi: number) => number;
  chance: (p: number) => boolean;
}

const GOAL_LINES = [
  'Wants to stay off insulin, and wants to understand the numbers rather than be told they are fine.',
  'Wants the medicine list as short as it can honestly be.',
  'Wants to be able to do the stairs at work without stopping.',
  'Wants to get to the grandchildren’s age without a stroke, which is how it was put.',
  'Wants one change at a time. Has been overwhelmed by a plan before and said so.',
  'Wants to keep working the shifts. Everything else fits around that.',
];

const CONTEXT_LINES = [
  'Shift work, three on and four off. Any plan has to survive that rota.',
  'Caring for a parent three evenings a week. That is the fixed constraint every plan has had to fit around.',
  'Drives for a living. Eating happens at the wheel unless it is planned the night before.',
  'Away for work a week in four. The weeks at home are the ones worth planning with.',
  'Lost a job in the spring and the insurance with it. Cost is part of every decision here.',
  'Two young children. Appointments need to be short and the plan needs to be simple.',
];

/**
 * The summary, written from the record rather than from a template
 * with the name swapped in. Every number in it is one that is on the
 * chart, which is the only way a summary like this can be checked.
 */
function buildMaster(i: MasterInput): MasterPlan {
  const { p, managed, meds, visits, prevention, lifestyle, panels, vitals, studies, exams, arc } = i;
  const he = p.pronouns?.startsWith('she') ? 'She' : p.pronouns?.startsWith('he') ? 'He' : 'They';
  const them = he === 'She' ? 'her' : he === 'He' ? 'him' : 'them';

  const office = vitals.filter((v) => v.source === 'office')
    .sort((a, b) => b.date.localeCompare(a.date));
  const home = vitals.filter((v) => v.source === 'home');
  const byDateDesc = <T extends { date: string }>(xs: T[]) => [...xs].sort((a, b) => b.date.localeCompare(a.date));
  // --- which records the summary is allowed to know about. Every one
  //     after this date is what the synthesis step will offer.
  const allDates = [
    ...visits.map((v) => v.date), ...panels.map((x) => x.date),
    ...office.map((x) => x.date), ...studies.map((x) => x.date),
  ].sort((a, b) => b.localeCompare(a));
  const behindBy = Math.min(allDates.length - 1, 1 + Math.floor(i.between(0, i.depth === 'deep' ? 5 : 3)));
  const cutoff = allDates[Math.max(0, behindBy)] ?? visits[visits.length - 1].date;
  const updated = addDays(cutoff, -1);
  const known = <T extends { date: string }>(xs: T[]) => xs.filter((x) => x.date <= updated);

  const kOffice = known(office);
  const kPanels = known(panels);
  const kVal = (key: string, nth = 0) => {
    const hits = byDateDesc(kPanels).filter((x) => x.values.some((v) => v.key === key));
    const panel = hits[nth];
    if (!panel) return undefined;
    return { v: panel.values.find((x) => x.key === key)!, date: panel.date };
  };

  // ------------------------------------------------------- subjective
  //
  // The opening statement first: where the work stands today across
  // everything, in one paragraph with no heading over it. Then a
  // chart review per problem, built from that problem's own measure,
  // its own drug history and the notes that actually mentioned it.
  // The opening paragraph is written by the same function the live
  // synthesis uses, over only the records the summary is supposed to
  // know about. That is what makes the staleness real: the paragraph
  // is a correct summary of the chart as it stood, and the records
  // that arrived since are exactly what the review step will offer.
  const composed = composeStatement({
    patientId: p.id, now: updated, master: undefined,
    conditions: i.conds, medications: meds,
    encounters: i.encounters.filter((e) => e.date <= updated),
    exams: known(exams), vitals: known(vitals), panels: kPanels,
    studies: known(studies), specialists: [], prevention,
    entries: [], checkIns: i.checkIns.filter((c) => c.date <= updated),
    lifestyle,
  });
  const history = composed?.text ?? '';

  // One chart review per problem, from that problem's own record.
  const MEASURE: Record<string, string> = {
    'Type 2 diabetes mellitus': 'A1c',
    Prediabetes: 'A1c',
    'Mixed hyperlipidemia': 'LDL',
    'Chronic kidney disease, stage 3a': 'eGFR',
  };
  const notesAbout = (c: Condition) => {
    const terms = [
      ...c.name.toLowerCase().split(/[\s,]+/).filter((w) => w.length > 4),
      ...meds.filter((m) => m.indication === c.name).map((m) => m.name.toLowerCase()),
    ];
    return byDateDesc(i.encounters).filter((e) => {
      const t = `${e.note?.subjective.additional ?? ''}`.toLowerCase();
      return terms.some((term) => t.includes(term));
    });
  };

  const byProblemS: Record<string, string> = {};
  for (const c of managed) {
    const parts: string[] = [];
    const key = MEASURE[c.name];
    if (key) {
      const nowV = kVal(key);
      const thenV = kVal(key, Math.max(1, kPanels.filter((x) => x.values.some((v) => v.key === key)).length - 1));
      if (nowV && thenV && thenV.date !== nowV.date) {
        parts.push(`${key} ${thenV.v.value} in ${short(thenV.date)} to ${nowV.v.value} in ${short(nowV.date)}.`);
      } else if (nowV) {
        parts.push(`${key} ${nowV.v.value} on ${fmt(nowV.date)}, the only value on file.`);
      } else {
        parts.push(`No ${key} on file for this.`);
      }
    } else if (c.name === 'Essential hypertension' && kOffice.length >= 2) {
      const a = kOffice[kOffice.length - 1];
      const b = kOffice[0];
      parts.push(`${a.systolic}/${a.diastolic} in ${short(a.date)} to ${b.systolic}/${b.diastolic} in ${short(b.date)}.`);
    } else if (c.name === 'Obesity' && kOffice.length >= 2) {
      const a = kOffice[kOffice.length - 1];
      const b = kOffice[0];
      parts.push(`Weight ${a.weightLb} lb in ${short(a.date)}, ${b.weightLb} lb in ${short(b.date)}.`);
    }
    const mine = meds.filter((m) => m.indication === c.name);
    if (mine.length > 0) {
      parts.push(`On ${mine.map((m) => `${m.name}${m.dose ? ` ${m.dose}` : ''}`).join(' and ')} since ${short(mine[0].started)}.`);
    }
    const said = notesAbout(c)[0];
    if (said) parts.push(`${fmt(said.date)}: ${said.note?.subjective.additional}`);
    if (parts.length === 0) {
      parts.push('Nothing in the notes on file speaks to this problem directly. It has been carried rather than reviewed.');
    }
    byProblemS[c.id] = parts.join(' ');
  }
  for (const item of prevention.filter((x) => x.status !== 'current')) {
    byProblemS[`prevention:${item.id}`] = item.lastDone
      ? `Last done ${fmt(item.lastDone)}.${item.dueBy ? ` Due ${fmt(item.dueBy)}.` : ''} ${item.status === 'overdue' ? 'Overdue since then and not booked.' : 'Not yet booked.'}`
      : `Never done in this chart.${item.dueBy ? ` Due ${fmt(item.dueBy)}.` : ''}`;
  }
  for (const li of lifestyle) {
    byProblemS[`lifestyle:${li.id}`] = `Prescribed ${fmt(li.started)}.${
      li.reviewed ? ` Reviewed ${fmt(li.reviewed)}.` : ' Not reviewed since.'
    }${li.barrier ? ` ${li.barrier}` : ''}`;
  }

  // ------------------------------------------------------- objective
  const lastExam = byDateDesc(exams)[0];
  const objective = [
    lastExam
      ? `Examined ${fmt(lastExam.date)}: ${lastExam.findings.slice(0, 2).map((f) => f.text.replace(/\.$/, '')).join('; ')}.`
      : 'No examination recorded in this chart yet.',
    home.length > 0
      ? `Taking ${he.toLowerCase() === 'they' ? 'their' : them === 'her' ? 'her' : 'his'} own blood pressure at home, ${home.length} readings on file.`
      : 'No home readings on file.',
    studies.some((s) => s.significant)
      ? `${byDateDesc(studies.filter((s) => s.significant))[0].name}, ${fmt(byDateDesc(studies.filter((s) => s.significant))[0].date)}: ${byDateDesc(studies.filter((s) => s.significant))[0].impression}`
      : '',
  ].filter(Boolean).join(' ');

  // ------------------------------------------------------- assessment
  const a1c = kVal('A1c');
  const a1cPrior = kVal('A1c', 1);
  const ldl = kVal('LDL');
  const egfr = kVal('eGFR');
  const bp = kOffice[0];
  const gaps = prevention.filter((x) => x.status === 'overdue');
  const assessment = [
    a1c ? `A1c ${a1c.v.value}% on ${fmt(a1c.date)}${a1cPrior ? `, from ${a1cPrior.v.value}% on ${fmt(a1cPrior.date)}` : ''}.` : '',
    bp?.systolic ? `Blood pressure ${bp.systolic}/${bp.diastolic} in clinic on ${fmt(bp.date)}.` : '',
    ldl ? `LDL ${ldl.v.value}${ldl.v.flag === 'high' ? ', still above target' : ', at target'}.` : '',
    egfr && egfr.v.value < 60 ? `eGFR ${egfr.v.value}, which is the number to watch.` : '',
    arc === 'improving' ? 'The direction is right on the measures we have.'
      : arc === 'slipping' ? 'The direction is wrong on the measures we have, and one change is overdue.'
        : 'Holding steady on the measures we have.',
    gaps.length > 0
      ? `The outstanding risk on this chart is not metabolic: ${gaps.map((x) => x.name.toLowerCase()).join(' and ')} ${gaps.length > 1 ? 'are' : 'is'} overdue.`
      : '',
  ].filter(Boolean).join(' ');

  // ------------------------------------------------------------- plan
  const byProblem: Record<string, string> = {};
  for (const c of managed) {
    const mine = meds.filter((m) => m.indication === c.name);
    const parts = [
      mine.length > 0 ? mine.map((m) => `${m.name}${m.dose ? ` ${m.dose}` : ''}`).join(' and ') + '.' : 'No drug treatment for this at the moment.',
      c.trend === 'worsening' ? 'Needs a change rather than a repeat. One change, reviewed in six weeks.'
        : c.trend === 'improving' ? 'Keep going as we are. The change is coming from the plan, not from a new drug.'
          : c.trend === 'stable' ? 'Hold. Review with the next bloods.'
            : 'Not assessed at the last visit. Needs a look at the next one.',
    ];
    byProblem[c.id] = parts.join(' ');
  }
  const due = prevention.filter((x) => x.status === 'due' || x.status === 'overdue');
  const prevention_ = due.length > 0
    ? `${due.map((x) => `${x.name} ${x.status}`).join('. ')}.${gaps.length > 0 ? ' Agreed twice and not booked.' : ''}`
    : 'Everything on the preventative list is current.';
  const lifestyleText = lifestyle.length > 0
    ? lifestyle.map((x) => `${x.prescription}${x.barrier ? ` ${x.barrier}` : ''}`).join(' ')
    : 'Nothing prescribed here yet.';
  const followUp = i.pick([
    'Three months, with bloods done beforehand.',
    'Four months, with A1c and lipids done the week before.',
    'Six weeks, to see whether the change did anything.',
    'Annual review, earlier if the home readings drift.',
  ]);

  return {
    id: `mp-${p.id}`, patientId: p.id, updated, updatedBy: 'L. DuBose, MD',
    subjective: {
      history,
      byProblem: byProblemS,
      goals: i.pick(GOAL_LINES),
      context: p.pinned ?? (i.chance(0.55) ? i.pick(CONTEXT_LINES) : ''),
    },
    objective: { narrative: objective },
    assessment: { narrative: assessment },
    plan: { byProblem, prevention: prevention_, lifestyle: lifestyleText, followUp },
  };
}

const fmt = (iso: string) => new Date(iso + 'T12:00:00')
  .toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

/** Month and year, for a trajectory that spans several of them. */
const short = (iso: string) => new Date(iso + 'T12:00:00')
  .toLocaleString('en-GB', { month: 'short', year: 'numeric' });
