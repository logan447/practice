/**
 * Raymond Teal, one patient across one whole year.
 *
 * The other demo charts show a moment: Priya's first morning, Sharon's
 * fourth year, Nina's empty record. None of them shows the shape the
 * practice actually sells, which is a year: a long first visit that
 * finds what is wrong and plans the twelve months, the planned visits
 * happening, one unplanned illness in the middle of them, and an
 * annual at the end that reviews the year and prices the next one.
 *
 * So this is five signed encounters, in order, with the same patient
 * and one continuous clinical thread:
 *
 *   18 Nov 2025  initial, 90 minutes, pro bono, quotes the year
 *   17 Feb 2026  three month review
 *   24 Mar 2026  acute, gout flare, not in the quote
 *   19 May 2026  six month review
 *   17 Nov 2026  annual, reviews the year and quotes the next
 *
 * The numbers move the way numbers move: an A1c that falls fast at
 * first and then slows, a weight that comes off at two to three
 * pounds a month and stalls twice, an albuminuria that takes two
 * drugs and six months to turn. Nothing here improves on schedule,
 * because nothing does.
 *
 * It is also the only chart that exercises the billing section
 * properly. A first visit quotes three visits and a membership is
 * dearer than that. Then he gets gout, the year holds four visits
 * instead of three, and the membership is the cheaper of the two by
 * the time the annual comes round. That reversal is the argument for
 * a membership, and it is not an argument anybody can make honestly
 * on a chart where nothing unplanned happens.
 */
import type {
  Condition, InstrumentScore, LabPanel, LifestyleIntervention,
  Medication, Patient, PreventionItem, Specialist, VitalsSet,
} from '../domain/types';

const P = 'p10';

const MD = (recorded: string) => ({
  author: 'clinician' as const, by: 'Logan L. DuBose, MD, MBA', recorded,
});
const SELF = (recorded: string) => ({
  author: 'patient' as const, by: 'Raymond Teal', recorded,
});

/**
 * Fifty-two, and nobody had looked properly.
 *
 * He is the common case and not the interesting one: a man with a
 * desk job, a family history he knows about, and four problems that
 * each sat just under the threshold at which a ten minute visit does
 * something. The first visit's work is almost entirely finding them.
 */
export const teal: Patient = {
  id: P, name: 'Raymond Teal', dob: '1973-08-04', sex: 'male', pronouns: 'he/him',
  membership: 'standard', memberSince: '2025-11-18',
  services: { preventative: true, lifestyle: true }, photoTone: 5,
  phone: '(512) 555-0174', email: 'r.teal@example.com',
  // Offered at the first visit and answered. Three people on one
  // income, which is the part a tax bracket would have missed.
  household: { income: 85000, size: 3, asked: '2025-11-18' },
  history: {
    family: [
      {
        relation: 'Father', condition: 'Myocardial infarction',
        note: 'First at 55. Died at 61. It is why he joined and he said so in the '
          + 'first minute of the first visit.',
      },
      { relation: 'Mother', condition: 'Type 2 diabetes', note: 'Diagnosed in her sixties.' },
    ],
    social: {
      tobacco: 'Twenty pack years. Stopped 2011.',
      alcohol: 'Three or four beers most evenings at the first visit, two evenings a '
        + 'week by the annual.',
      work: 'Regional logistics manager. Desk, phone, four hours a week in a car.',
      living: 'Lives with his wife and a nineteen year old at home.',
    },
  },
};

/* ------------------------------------------------------------------ */
/* the problem list, as it stood by the annual                         */
/* ------------------------------------------------------------------ */

/**
 * Five problems, four of them found at the first visit.
 *
 * He arrived believing he had one: blood pressure, treated once at an
 * urgent care in 2024 and not followed up. The diabetes, the
 * albuminuria, the lipids and the sleep apnoea were all there and all
 * unnamed, which is the usual finding when somebody with this
 * phenotype has not had an hour of anybody's time.
 */
export const tealConditions: Condition[] = [
  {
    id: 'tc1', patientId: P, name: 'Type 2 diabetes mellitus', code: 'E11.9',
    status: 'active', managed: true, owner: 'ours', onset: '2025-11-18',
    goal: 'at-goal', goalAssessed: '2026-11-17', provenance: MD('2025-11-18'),
    goalNote: 'A1c 6.1 at the annual, from 7.9 at diagnosis. Target under 7.0 and he is '
      + 'well inside it on metformin and empagliflozin with no hypoglycaemia.',
    note: 'Diagnosed here on the first visit. A1c 7.9. He had been told twice that he '
      + 'was "a bit borderline" and never given a number.',
  },
  {
    id: 'tc2', patientId: P, name: 'Hypertension', code: 'I10',
    status: 'active', managed: true, owner: 'ours', onset: '2024-03-01',
    goal: 'at-goal', goalAssessed: '2026-11-17', provenance: SELF('2025-11-18'),
    goalNote: 'Home average 124/76 over fourteen days. Target under 130/80 given the '
      + 'diabetes and the albuminuria, and he is at it.',
    note: 'Started on hydrochlorothiazide at an urgent care in 2024 with no follow-up. '
      + 'Changed to lisinopril here because of the albuminuria.',
  },
  {
    id: 'tc3', patientId: P, name: 'Albuminuria in diabetes', code: 'E11.21',
    status: 'active', managed: true, owner: 'ours', onset: '2025-11-18',
    goal: 'needs-improvement', goalAssessed: '2026-11-17', provenance: MD('2025-11-18'),
    goalNote: 'Urine albumin to creatinine 14 mg/g, from 42 at diagnosis. Under 30 is '
      + 'normal, so this has come back into range and the job now is keeping it there.',
    note: 'Found on the first visit. It is the reason the blood pressure drug is an ACE '
      + 'inhibitor and the reason the second diabetes drug is empagliflozin.',
  },
  {
    id: 'tc4', patientId: P, name: 'Mixed hyperlipidaemia', code: 'E78.2',
    status: 'active', managed: true, owner: 'ours', onset: '2025-11-18',
    goal: 'at-goal', goalAssessed: '2026-11-17', provenance: MD('2025-11-18'),
    goalNote: 'LDL 78 on atorvastatin 40, from 162 untreated. Target under 100, and '
      + 'under 70 would be better with the family history, which is the thing to '
      + 'decide at six months rather than to do today.',
    note: 'LDL 162 untreated at the first visit, with a father who had a myocardial '
      + 'infarction at 55.',
  },
  {
    id: 'tc5', patientId: P, name: 'Obstructive sleep apnoea', code: 'G47.33',
    status: 'active', managed: true, owner: 'shared', onset: '2026-01-29',
    goal: 'at-goal', goalAssessed: '2026-11-17', provenance: MD('2026-01-29'),
    goalNote: 'Apnoea hypopnoea index 22 on the diagnostic study, moderate. Epworth 4 at '
      + 'the annual from 14, and the machine reports 6.1 hours a night.',
    note: 'Suspected at the first visit on the history and the neck circumference. Study '
      + 'arranged, read by sleep medicine, treated with CPAP since February.',
  },
  {
    id: 'tc6', patientId: P, name: 'Obesity', code: 'E66.9',
    status: 'active', managed: true, owner: 'ours', onset: '2025-11-18',
    goal: 'needs-improvement', goalAssessed: '2026-11-17', provenance: MD('2025-11-18'),
    goalNote: '211 lb and a body mass index of 30.3, from 238 lb and 34.1. Twenty seven '
      + 'pounds in a year, which is eleven per cent, and the first five per cent is what '
      + 'the metabolic numbers followed.',
    note: 'Heaviest recorded weight 241 lb in 2024.',
  },
  /*
   * The one that was not planned for and not caused by anything we
   * did. It is on the list as acute because it has happened once, and
   * once is not a disease to be treated for life.
   */
  {
    id: 'tc7', patientId: P, name: 'Gout', code: 'M10.072',
    status: 'active', managed: true, owner: 'ours', acuity: 'acute',
    onset: '2026-03-24', goal: 'at-goal', goalAssessed: '2026-11-17',
    provenance: MD('2026-03-24'),
    goalNote: 'One flare, in March, settled in nine days. None since. Urate 6.4 at the '
      + 'annual, from 8.9 during the flare.',
    note: 'First metatarsophalangeal joint, left. First flare, so treated and not put on '
      + 'urate lowering therapy.',
  },
  {
    id: 'tc8', patientId: P, name: 'Former tobacco use', code: 'Z87.891',
    status: 'resolved', managed: false, onset: '2011-06-01',
    provenance: SELF('2025-11-18'),
    note: 'Twenty pack years. Stopped in 2011 and has not smoked since.',
  },
];

/* ------------------------------------------------------------------ */
/* medicines, as they stood by the annual                              */
/* ------------------------------------------------------------------ */

export const tealMeds: Medication[] = [
  {
    id: 'tm1', patientId: P, name: 'Metformin', rxcui: '6809', dose: '1000 mg',
    sig: 'One tablet twice daily with food', started: '2025-11-18', status: 'active',
    indication: 'Type 2 diabetes mellitus', provenance: MD('2025-11-18'),
    adherence: { status: 'taking', reported: '2026-11-17', by: 'patient' },
    changeNote: 'Started at 500 mg once daily and increased over six weeks. Loose stools '
      + 'for the first fortnight and then nothing.',
  },
  {
    id: 'tm2', patientId: P, name: 'Empagliflozin', rxcui: '1545653', dose: '10 mg',
    sig: 'One tablet each morning', started: '2026-02-17', status: 'active',
    indication: 'Albuminuria in diabetes', provenance: MD('2026-02-17'),
    adherence: { status: 'taking', reported: '2026-11-17', by: 'patient' },
    changeNote: 'Added at the three month review for the albuminuria, not for the sugar.',
  },
  {
    id: 'tm3', patientId: P, name: 'Lisinopril', rxcui: '29046', dose: '20 mg',
    sig: 'One tablet each morning', started: '2025-11-18', status: 'active',
    indication: 'Hypertension', provenance: MD('2025-11-18'),
    adherence: { status: 'taking', reported: '2026-11-17', by: 'patient' },
    changeNote: 'Started at 10 mg and doubled at the three month review. Replaced the '
      + 'hydrochlorothiazide, which was stopped the same day.',
  },
  {
    id: 'tm4', patientId: P, name: 'Atorvastatin', rxcui: '83367', dose: '40 mg',
    sig: 'One tablet at night', started: '2025-11-18', status: 'active',
    indication: 'Mixed hyperlipidaemia', provenance: MD('2025-11-18'),
    adherence: { status: 'taking', reported: '2026-11-17', by: 'patient' },
  },
  {
    id: 'tm5', patientId: P, name: 'Hydrochlorothiazide', rxcui: '5487', dose: '25 mg',
    sig: 'One tablet each morning', started: '2024-03-14', status: 'stopped',
    stopped: '2025-11-18', indication: 'Hypertension', provenance: SELF('2025-11-18'),
    changeNote: 'Stopped at the first visit. An ACE inhibitor was the better first drug '
      + 'here because of the albuminuria.',
  },
  {
    id: 'tm6', patientId: P, name: 'Prednisone', rxcui: '8640', dose: '40 mg',
    sig: 'One tablet daily for five days, then 20 mg daily for five days, then stop',
    started: '2026-03-24', status: 'stopped', stopped: '2026-04-03',
    indication: 'Gout', provenance: MD('2026-03-24'),
    changeNote: 'A ten day course for the flare. Chosen over a non-steroidal because of '
      + 'the albuminuria and the ACE inhibitor.',
  },
];

/* ------------------------------------------------------------------ */
/* the numbers, visit by visit                                         */
/* ------------------------------------------------------------------ */

/**
 * Five lab draws, one per visit, so every panel has the one before it
 * in brackets and the trend is the thing you read rather than the
 * thing you reconstruct.
 */
export const tealPanels: LabPanel[] = [
  // ---- initial, 18 Nov 2025
  {
    id: 'tp1', patientId: P, date: '2025-11-18', group: 'metabolic',
    name: 'Diabetes monitoring', from: 'Quest',
    values: [
      { key: 'A1c', name: 'Haemoglobin A1c', value: 7.9, unit: '%', refLow: 4.0, refHigh: 5.6, flag: 'high' },
    ],
  },
  {
    id: 'tp2', patientId: P, date: '2025-11-18', group: 'cmp',
    name: 'Comprehensive metabolic panel', from: 'Quest',
    values: [
      { key: 'Na', name: 'Sodium', value: 138, unit: 'mmol/L', refLow: 135, refHigh: 145, flag: 'normal' },
      { key: 'K', name: 'Potassium', value: 4.0, unit: 'mmol/L', refLow: 3.5, refHigh: 5.1, flag: 'normal' },
      { key: 'Cl', name: 'Chloride', value: 101, unit: 'mmol/L', refLow: 98, refHigh: 107, flag: 'normal' },
      { key: 'CO2', name: 'Bicarbonate', value: 26, unit: 'mmol/L', refLow: 22, refHigh: 29, flag: 'normal' },
      { key: 'BUN', name: 'Urea nitrogen', value: 16, unit: 'mg/dL', refLow: 7, refHigh: 20, flag: 'normal' },
      { key: 'Cr', name: 'Creatinine', value: 1.02, unit: 'mg/dL', refLow: 0.7, refHigh: 1.3, flag: 'normal' },
      { key: 'Glu', name: 'Glucose', value: 162, unit: 'mg/dL', refLow: 70, refHigh: 99, flag: 'high' },
      { key: 'ALT', name: 'Alanine aminotransferase', value: 62, unit: 'U/L', refLow: 7, refHigh: 55, flag: 'high' },
      { key: 'AST', name: 'Aspartate aminotransferase', value: 41, unit: 'U/L', refLow: 8, refHigh: 48, flag: 'normal' },
    ],
  },
  {
    id: 'tp3', patientId: P, date: '2025-11-18', group: 'lipid',
    name: 'Lipid panel', from: 'Quest',
    values: [
      { key: 'TC', name: 'Total cholesterol', value: 248, unit: 'mg/dL', refHigh: 200, flag: 'high' },
      { key: 'LDL', name: 'LDL cholesterol', value: 162, unit: 'mg/dL', refHigh: 100, flag: 'high' },
      { key: 'HDL', name: 'HDL cholesterol', value: 38, unit: 'mg/dL', refLow: 40, flag: 'low' },
      { key: 'TG', name: 'Triglycerides', value: 240, unit: 'mg/dL', refHigh: 150, flag: 'high' },
    ],
  },
  {
    id: 'tp4', patientId: P, date: '2025-11-18', group: 'other',
    name: 'Urine albumin to creatinine ratio', from: 'Quest',
    values: [
      { key: 'ACR', name: 'Albumin to creatinine ratio', value: 42, unit: 'mg/g', refHigh: 30, flag: 'high' },
      { key: 'eGFR', name: 'Estimated GFR', value: 84, unit: 'mL/min/1.73m2', refLow: 60, flag: 'normal' },
    ],
  },
  // ---- three month, 17 Feb 2026
  {
    id: 'tp5', patientId: P, date: '2026-02-17', group: 'metabolic',
    name: 'Diabetes monitoring', from: 'Quest',
    values: [
      { key: 'A1c', name: 'Haemoglobin A1c', value: 7.1, unit: '%', refLow: 4.0, refHigh: 5.6, flag: 'high' },
    ],
  },
  {
    id: 'tp6', patientId: P, date: '2026-02-17', group: 'lipid',
    name: 'Lipid panel', from: 'Quest',
    values: [
      { key: 'TC', name: 'Total cholesterol', value: 162, unit: 'mg/dL', refHigh: 200, flag: 'normal' },
      { key: 'LDL', name: 'LDL cholesterol', value: 88, unit: 'mg/dL', refHigh: 100, flag: 'normal' },
      { key: 'HDL', name: 'HDL cholesterol', value: 40, unit: 'mg/dL', refLow: 40, flag: 'normal' },
      { key: 'TG', name: 'Triglycerides', value: 168, unit: 'mg/dL', refHigh: 150, flag: 'high' },
    ],
  },
  {
    id: 'tp7', patientId: P, date: '2026-02-17', group: 'other',
    name: 'Urine albumin to creatinine ratio', from: 'Quest',
    values: [
      { key: 'ACR', name: 'Albumin to creatinine ratio', value: 38, unit: 'mg/g', refHigh: 30, flag: 'high' },
      { key: 'eGFR', name: 'Estimated GFR', value: 86, unit: 'mL/min/1.73m2', refLow: 60, flag: 'normal' },
    ],
  },
  // ---- acute, 24 Mar 2026
  {
    id: 'tp8', patientId: P, date: '2026-03-24', group: 'other',
    name: 'Serum urate', from: 'Quest',
    values: [
      { key: 'Urate', name: 'Uric acid', value: 8.9, unit: 'mg/dL', refHigh: 7.2, flag: 'high' },
    ],
  },
  // ---- six month, 19 May 2026
  {
    id: 'tp9', patientId: P, date: '2026-05-19', group: 'metabolic',
    name: 'Diabetes monitoring', from: 'Quest',
    values: [
      { key: 'A1c', name: 'Haemoglobin A1c', value: 6.5, unit: '%', refLow: 4.0, refHigh: 5.6, flag: 'high' },
    ],
  },
  {
    id: 'tp10', patientId: P, date: '2026-05-19', group: 'other',
    name: 'Urine albumin to creatinine ratio', from: 'Quest',
    values: [
      { key: 'ACR', name: 'Albumin to creatinine ratio', value: 22, unit: 'mg/g', refHigh: 30, flag: 'normal' },
      { key: 'eGFR', name: 'Estimated GFR', value: 88, unit: 'mL/min/1.73m2', refLow: 60, flag: 'normal' },
    ],
  },
  {
    id: 'tp11', patientId: P, date: '2026-05-19', group: 'lipid',
    name: 'Lipid panel', from: 'Quest',
    values: [
      { key: 'TC', name: 'Total cholesterol', value: 155, unit: 'mg/dL', refHigh: 200, flag: 'normal' },
      { key: 'LDL', name: 'LDL cholesterol', value: 82, unit: 'mg/dL', refHigh: 100, flag: 'normal' },
      { key: 'HDL', name: 'HDL cholesterol', value: 43, unit: 'mg/dL', refLow: 40, flag: 'normal' },
      { key: 'TG', name: 'Triglycerides', value: 148, unit: 'mg/dL', refHigh: 150, flag: 'normal' },
    ],
  },
  // ---- annual, 17 Nov 2026
  {
    id: 'tp12', patientId: P, date: '2026-11-17', group: 'metabolic',
    name: 'Diabetes monitoring', from: 'Quest',
    values: [
      { key: 'A1c', name: 'Haemoglobin A1c', value: 6.1, unit: '%', refLow: 4.0, refHigh: 5.6, flag: 'high' },
    ],
  },
  {
    id: 'tp13', patientId: P, date: '2026-11-17', group: 'cmp',
    name: 'Comprehensive metabolic panel', from: 'Quest',
    values: [
      { key: 'Na', name: 'Sodium', value: 139, unit: 'mmol/L', refLow: 135, refHigh: 145, flag: 'normal' },
      { key: 'K', name: 'Potassium', value: 4.3, unit: 'mmol/L', refLow: 3.5, refHigh: 5.1, flag: 'normal' },
      { key: 'Cl', name: 'Chloride', value: 103, unit: 'mmol/L', refLow: 98, refHigh: 107, flag: 'normal' },
      { key: 'CO2', name: 'Bicarbonate', value: 25, unit: 'mmol/L', refLow: 22, refHigh: 29, flag: 'normal' },
      { key: 'BUN', name: 'Urea nitrogen', value: 18, unit: 'mg/dL', refLow: 7, refHigh: 20, flag: 'normal' },
      { key: 'Cr', name: 'Creatinine', value: 1.08, unit: 'mg/dL', refLow: 0.7, refHigh: 1.3, flag: 'normal' },
      { key: 'Glu', name: 'Glucose', value: 108, unit: 'mg/dL', refLow: 70, refHigh: 99, flag: 'high' },
      { key: 'ALT', name: 'Alanine aminotransferase', value: 31, unit: 'U/L', refLow: 7, refHigh: 55, flag: 'normal' },
      { key: 'AST', name: 'Aspartate aminotransferase', value: 26, unit: 'U/L', refLow: 8, refHigh: 48, flag: 'normal' },
    ],
  },
  {
    id: 'tp14', patientId: P, date: '2026-11-17', group: 'lipid',
    name: 'Lipid panel', from: 'Quest',
    values: [
      { key: 'TC', name: 'Total cholesterol', value: 149, unit: 'mg/dL', refHigh: 200, flag: 'normal' },
      { key: 'LDL', name: 'LDL cholesterol', value: 78, unit: 'mg/dL', refHigh: 100, flag: 'normal' },
      { key: 'HDL', name: 'HDL cholesterol', value: 45, unit: 'mg/dL', refLow: 40, flag: 'normal' },
      { key: 'TG', name: 'Triglycerides', value: 128, unit: 'mg/dL', refHigh: 150, flag: 'normal' },
    ],
  },
  {
    id: 'tp15', patientId: P, date: '2026-11-17', group: 'other',
    name: 'Urine albumin to creatinine ratio', from: 'Quest',
    values: [
      { key: 'ACR', name: 'Albumin to creatinine ratio', value: 14, unit: 'mg/g', refHigh: 30, flag: 'normal' },
      { key: 'eGFR', name: 'Estimated GFR', value: 85, unit: 'mL/min/1.73m2', refLow: 60, flag: 'normal' },
    ],
  },
  {
    id: 'tp16', patientId: P, date: '2026-11-17', group: 'other',
    name: 'Serum urate', from: 'Quest',
    values: [
      { key: 'Urate', name: 'Uric acid', value: 6.4, unit: 'mg/dL', refHigh: 7.2, flag: 'normal' },
    ],
  },
];

/**
 * Office weights and pressures at each visit, and the home series he
 * started keeping after the first one.
 */
export const tealVitals: VitalsSet[] = [
  {
    id: 'tv1', patientId: P, date: '2025-11-18', source: 'office',
    systolic: 148, diastolic: 92, heartRate: 78, weightLb: 238, bmi: 34.1,
  },
  {
    id: 'tv2', patientId: P, date: '2026-02-17', source: 'office',
    systolic: 134, diastolic: 84, heartRate: 74, weightLb: 229, bmi: 32.9,
  },
  {
    id: 'tv3', patientId: P, date: '2026-03-24', source: 'office',
    systolic: 138, diastolic: 86, heartRate: 82, weightLb: 227, bmi: 32.6,
  },
  {
    id: 'tv4', patientId: P, date: '2026-05-19', source: 'office',
    systolic: 128, diastolic: 78, heartRate: 70, weightLb: 220, bmi: 31.6,
  },
  {
    id: 'tv5', patientId: P, date: '2026-11-17', source: 'office',
    systolic: 124, diastolic: 76, heartRate: 66, weightLb: 211, bmi: 30.3,
  },
  {
    id: 'tv6', patientId: P, date: '2026-11-10', source: 'home',
    systolic: 124, diastolic: 76,
    note: 'Fourteen day average, morning and evening, twenty six readings.',
  },
];

/**
 * The screens, every visit, and the long forms only where a short one
 * asked for them.
 *
 * The drinking screen was positive at the first visit and is the one
 * that changed most, which is worth seeing next to the gout.
 */
export const tealScores: InstrumentScore[] = [
  { id: 'ts1', patientId: P, instrument: 'phq-2', date: '2025-11-18', score: 1, by: 'patient' },
  { id: 'ts2', patientId: P, instrument: 'gad-2', date: '2025-11-18', score: 0, by: 'patient' },
  {
    id: 'ts3', patientId: P, instrument: 'audit-c', date: '2025-11-18', score: 6, by: 'patient',
    note: 'Positive screen. Three or four beers most evenings, more at the weekend.',
  },
  { id: 'ts4', patientId: P, instrument: 'tobacco', date: '2025-11-18', score: 0, by: 'patient' },
  { id: 'ts5', patientId: P, instrument: 'drug-use', date: '2025-11-18', score: 0, by: 'patient' },
  { id: 'ts6', patientId: P, instrument: 'flourishing', date: '2025-11-18', score: 58, by: 'patient' },

  { id: 'ts7', patientId: P, instrument: 'phq-2', date: '2026-02-17', score: 0, by: 'patient' },
  { id: 'ts8', patientId: P, instrument: 'gad-2', date: '2026-02-17', score: 0, by: 'patient' },
  { id: 'ts9', patientId: P, instrument: 'audit-c', date: '2026-02-17', score: 5, by: 'patient' },

  { id: 'ts10', patientId: P, instrument: 'phq-2', date: '2026-05-19', score: 0, by: 'patient' },
  { id: 'ts11', patientId: P, instrument: 'gad-2', date: '2026-05-19', score: 0, by: 'patient' },
  {
    id: 'ts12', patientId: P, instrument: 'audit-c', date: '2026-05-19', score: 3, by: 'patient',
    note: 'Below the cut-off for the first time. Two evenings a week instead of five.',
  },

  { id: 'ts13', patientId: P, instrument: 'phq-2', date: '2026-11-17', score: 0, by: 'patient' },
  { id: 'ts14', patientId: P, instrument: 'gad-2', date: '2026-11-17', score: 0, by: 'patient' },
  { id: 'ts15', patientId: P, instrument: 'audit-c', date: '2026-11-17', score: 2, by: 'patient' },
  { id: 'ts16', patientId: P, instrument: 'tobacco', date: '2026-11-17', score: 0, by: 'patient' },
  { id: 'ts17', patientId: P, instrument: 'drug-use', date: '2026-11-17', score: 0, by: 'patient' },
  { id: 'ts18', patientId: P, instrument: 'flourishing', date: '2026-11-17', score: 78, by: 'patient' },
];

/**
 * Seven pillars, one entry each, written at the first visit and
 * revised twice.
 *
 * They are not all going well. The financial one never moved, and a
 * set of lifestyle prescriptions where everything worked is a set
 * nobody should believe.
 */
export const tealLifestyle: LifestyleIntervention[] = [
  {
    id: 'tl1', patientId: P, domain: 'activity', status: 'active',
    forConditions: ['Type 2 diabetes mellitus', 'Obesity', 'Hypertension'],
    started: '2025-11-18', reviewed: '2026-11-17',
    prescription: 'Walk thirty minutes after dinner, five evenings a week. Add two '
      + 'sessions a week of resistance work with bands from June.',
    barrier: 'Walking has held since January, about five evenings a week on his phone '
      + 'count. The resistance work lasted six weeks and stopped in August.',
  },
  {
    id: 'tl2', patientId: P, domain: 'nutrition', status: 'active',
    forConditions: ['Type 2 diabetes mellitus', 'Obesity', 'Mixed hyperlipidaemia'],
    started: '2025-11-18', reviewed: '2026-11-17',
    prescription: 'Breakfast that is not a pastry. One meat free dinner a week to start, '
      + 'then three. Stop drinking calories: the two sodas a day were about 300.',
    barrier: 'The sodas went in the first month and have not come back. Three meat free '
      + 'dinners most weeks since the spring, which his wife drove more than he did.',
  },
  {
    id: 'tl3', patientId: P, domain: 'sleep', status: 'active',
    forConditions: ['Obstructive sleep apnoea', 'Hypertension'],
    started: '2025-11-18', reviewed: '2026-11-17',
    prescription: 'Sleep study first, because no amount of sleep advice fixes an apnoea. '
      + 'Then CPAP every night and a fixed rise time.',
    barrier: 'Study in January, CPAP since February, 6.1 hours a night on the machine '
      + 'report. Epworth 4 from 14. This is the one that changed how he feels.',
  },
  {
    id: 'tl4', patientId: P, domain: 'stress', status: 'active',
    forConditions: ['Hypertension'],
    started: '2026-02-17', reviewed: '2026-11-17',
    prescription: 'Keep the phone out of the bedroom. Take the full lunch break away '
      + 'from the desk twice a week.',
    barrier: 'The phone is out. The lunch breaks happen in quiet weeks and not in busy '
      + 'ones, which he describes accurately as most weeks.',
  },
  {
    id: 'tl5', patientId: P, domain: 'substances', status: 'active',
    forConditions: ['Gout', 'Hypertension', 'Obesity'],
    started: '2025-11-18', reviewed: '2026-11-17',
    prescription: 'Drinking screen was positive at six. Two drink free days a week to '
      + 'start, then no more than two drinks on any day and two drink free days.',
    barrier: 'Six to three to two on the screen. The gout flare in March did more for '
      + 'this than anything said in a room.',
  },
  {
    id: 'tl6', patientId: P, domain: 'connection', status: 'active',
    forConditions: ['Obesity'],
    started: '2026-05-19', reviewed: '2026-11-17',
    prescription: 'The evening walk with his wife rather than alone, where it suits them '
      + 'both, so the exercise and the company are the same half hour.',
    barrier: 'They walk together four or five evenings a week. He raised it himself as '
      + 'the part of the year he would keep.',
  },
  /*
   * The pillar that did not move. It is here because it was addressed
   * and because leaving it off would make the year look tidier than
   * it was.
   */
  {
    id: 'tl7', patientId: P, domain: 'financial', status: 'active',
    forConditions: ['Obstructive sleep apnoea', 'Type 2 diabetes mellitus'],
    started: '2026-05-19', reviewed: '2026-11-17',
    prescription: 'Find out what the insulin and the CPAP supplies actually cost him '
      + 'before the deductible resets, so a surprise bill does not stop the treatment.',
    barrier: 'Not done. He has not called, and the question has been asked at two '
      + 'visits now. It stays on the list.',
  },
];

export const tealPrevention: PreventionItem[] = [
  {
    id: 'tpv1', patientId: P, name: 'Colorectal cancer screening', status: 'current',
    lastDone: '2026-04-21', dueBy: '2036-04-21',
    note: 'Colonoscopy. Two small adenomas removed, so the interval is seven years by '
      + 'the pathology, which gastroenterology has set at 2033.',
  },
  {
    id: 'tpv2', patientId: P, name: 'Diabetic retinal screening', status: 'current',
    lastDone: '2026-01-13', dueBy: '2027-01-13',
    note: 'No retinopathy. Annual from the date of diagnosis.',
  },
  {
    id: 'tpv3', patientId: P, name: 'Diabetic foot examination', status: 'current',
    lastDone: '2026-11-17', dueBy: '2027-11-17',
    note: 'Pulses present, sensation intact to 10 g monofilament at all sites.',
  },
  {
    id: 'tpv4', patientId: P, name: 'Shingles vaccination', status: 'current',
    lastDone: '2026-05-19', dueBy: '2026-08-19',
    note: 'Both doses given, the second in August.',
  },
  {
    id: 'tpv5', patientId: P, name: 'Influenza vaccination', status: 'current',
    lastDone: '2026-10-06', dueBy: '2027-10-01',
  },
  {
    id: 'tpv6', patientId: P, name: 'Tetanus booster', status: 'overdue',
    lastDone: '2013-02-20', dueBy: '2023-02-20',
    note: 'Eleven years. Offered at the annual and he asked to have it with the next '
      + 'flu vaccine instead.',
  },
];

export const tealSpecialists: Specialist[] = [
  {
    id: 'tsp1', patientId: P, name: 'Dr. Ingrid Halvorsen', specialty: 'Sleep medicine',
    practice: 'Austin Sleep and Pulmonary', phone: '(512) 555-0412',
    lastSeen: '2026-02-10', nextSeen: '2027-02-09',
    findings: 'Home sleep apnoea test 29 Jan 2026. Apnoea hypopnoea index 22, moderate. '
      + 'Nadir oxygen saturation 86 per cent.',
    recommendations: 'Auto-titrating CPAP, 5 to 15 cm H2O. Annual review while adherent.',
    outstanding: 'None. Machine reports come to us monthly.',
  },
  {
    id: 'tsp2', patientId: P, name: 'Dr. Paul Mensah', specialty: 'Gastroenterology',
    practice: 'Capital Digestive', phone: '(512) 555-0455',
    lastSeen: '2026-04-21', nextSeen: '2033-04-21',
    findings: 'Screening colonoscopy. Two tubular adenomas, 4 mm and 6 mm, removed '
      + 'completely. No high grade dysplasia.',
    recommendations: 'Repeat in seven years. No change to anything else.',
    outstanding: 'None.',
  },
];
