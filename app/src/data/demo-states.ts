/**
 * Three charts, on purpose: full, partial, and empty.
 *
 * A structure can only be judged against all three. A screen designed
 * on a complete chart hides every empty state, and one designed on an
 * empty chart never has to hold a patient with five problems and four
 * years of numbers. The partial case is the one that actually occurs
 * most and is almost never designed for: half the problems reviewed,
 * one patient answer of four, vitals but no labs, a plan written for
 * one problem and not the rest.
 *
 * Sharon White is the full chart and lives in `sharon.ts`. This file
 * holds the other two.
 *
 * Marcus Reyes is the partial one. What he is missing is as
 * deliberate as what he has: no examination on file, no home
 * readings, no objective narrative, no follow-up interval, two of
 * four problems never gauged, one lifestyle prescription that was
 * written and never started, and a patient who answered two questions
 * of four and skipped the one about their health overall.
 *
 * Nina Alvarado joined last week and has one visit booked. Her chart
 * is what every chart looks like on day one, and every section on it
 * should say what is missing rather than render blank.
 *
 * Fictional throughout.
 */
import type {
  Encounter, ExamRecord, LabPanel, LifestyleIntervention, MasterPlan,
  Patient, PreventionItem, ProblemCheckIn, VitalsSet, DiagnosticStudy, LabValue,
} from '../domain/types';

// ------------------------------------------------------------- partial

const L = (
  key: string, name: string, value: number, unit: string,
  refLow?: number, refHigh?: number,
): LabValue => ({
  key, name, value, unit, refLow, refHigh,
  flag: refHigh !== undefined && value > refHigh ? 'high'
    : refLow !== undefined && value < refLow ? 'low' : 'normal',
});

export const marcusVitals: VitalsSet[] = [
  {
    id: 'mv1', patientId: 'p1', date: '2026-05-04', source: 'office', encounterId: 'e3',
    systolic: 134, diastolic: 84, heartRate: 72, weightLb: 214, bmi: 29.9,
    temperatureF: 98.2, spo2: 96, respRate: 14,
  },
  {
    id: 'mv2', patientId: 'p1', date: '2026-09-02', source: 'office', encounterId: 'e2',
    systolic: 126, diastolic: 78, heartRate: 68, weightLb: 206, bmi: 28.8,
  },
  {
    id: 'mv3', patientId: 'p1', date: '2026-11-06', source: 'office',
    systolic: 128, diastolic: 80, weightLb: 203, bmi: 28.4,
    note: 'Nurse visit for the blood draw.',
  },
  // No home readings. He was asked in September and has not started.
];

export const marcusPanels: LabPanel[] = [
  {
    id: 'ml1', patientId: 'p1', date: '2026-11-06', group: 'lipid', name: 'Lipid panel',
    values: [
      L('TC', 'Total cholesterol', 186, 'mg/dL', undefined, 200),
      L('LDL', 'LDL cholesterol', 104, 'mg/dL', undefined, 100),
      L('HDL', 'HDL cholesterol', 48, 'mg/dL', 50, undefined),
      L('TG', 'Triglycerides', 168, 'mg/dL', undefined, 150),
    ],
  },
  {
    id: 'ml2', patientId: 'p1', date: '2026-11-06', group: 'metabolic', name: 'Diabetes monitoring',
    values: [L('A1c', 'Haemoglobin A1c', 5.8, '%', 4.0, 5.6)],
  },
  {
    id: 'ml3', patientId: 'p1', date: '2026-05-04', group: 'metabolic', name: 'Diabetes monitoring',
    values: [L('A1c', 'Haemoglobin A1c', 6.1, '%', 4.0, 5.6)],
  },
  // No CBC, no metabolic panel, no urine ratio. The gaps are the point.
];

/** None. The objective section has to say so rather than carry one forward. */
export const marcusExams: ExamRecord[] = [];

export const marcusStudies: DiagnosticStudy[] = [
  {
    id: 'ms1', patientId: 'p1', date: '2026-02-20', kind: 'procedure',
    name: 'Home sleep study', from: 'Austin Sleep Center',
    impression: 'Apnoea hypopnoea index 22. Moderate obstructive sleep apnoea. CPAP recommended.',
    significant: true,
  },
];

export const marcusLifestyle: LifestyleIntervention[] = [
  {
    id: 'mli1', patientId: 'p1', domain: 'activity',
    prescription: 'Thirty minutes of walking, five days a week, split into two if that is easier.',
    forConditions: ['c1', 'c2'], status: 'active',
    started: '2026-05-04', reviewed: '2026-09-02',
  },
  {
    id: 'mli2', patientId: 'p1', domain: 'sleep',
    prescription: 'CPAP every night, including short nights.',
    forConditions: ['c4'], status: 'not-started',
    started: '2026-09-02',
    barrier: 'Written in September and never discussed since. No usage download has been asked for.',
  },
];

export const marcusCheckIns: ProblemCheckIn[] = [
  {
    id: 'mci1', patientId: 'p1', encounterId: 'e1', date: '2026-11-12',
    about: { kind: 'condition', id: 'c2' },
    feeling: 'better', onPlan: 'yes',
    text: 'This is the one I want to talk about. The readings have been good for months and I would like to try without the tablet.',
  },
  {
    id: 'mci2', patientId: 'p1', encounterId: 'e1', date: '2026-11-12',
    about: { kind: 'condition', id: 'c1' },
    feeling: 'same', onPlan: 'partly',
    text: 'Walking is happening about three days a week, not five. Breakfast is still whatever is quickest.',
  },
  // Nothing about the hyperlipidemia, nothing about the sleep apnoea, and
  // no answer about his health overall. Three blanks the screen has to
  // show as blanks.
];

/**
 * A summary half written, which is the normal state of a chart.
 *
 * The statement is there and the assessment is there. The objective
 * narrative was never written, the follow-up interval was never set,
 * two of the four problems have no chart review, and the plan has
 * text for the hypertension only.
 */
export const marcusMaster: MasterPlan = {
  id: 'mmp1', patientId: 'p1', updated: '2026-09-02', updatedBy: 'L. DuBose, MD',
  objective: { narrative: '' },
  assessment: {
    narrative: 'Prediabetes is back in the normal range off metformin, which is the result he wanted and the one he achieved himself. Blood pressure has been under 130 at every reading this year on a single agent. The case for a supervised taper is reasonable; the case for doing it without home readings is not.',
  },
  plan: {
    byProblem: {
      c2: 'Lisinopril 10 mg. Asked him in September to check at home twice a week for three months before we taper. No readings have arrived. The taper waits on the readings, not on the visit.',
    },
    prevention: 'Influenza vaccine overdue since 31 October. Colonoscopy due March 2027, not yet booked. Lipid panel and diabetes screening both current to November.',
    lifestyle: '',
    followUp: '',
  },
};

// --------------------------------------------------------------- empty

export const nina: Patient = {
  id: 'p9', name: 'Nina Alvarado', preferredName: 'Nina', dob: '1989-06-14',
  sex: 'female', pronouns: 'she/her', membership: 'standard',
  services: { preventative: true, lifestyle: true },
  memberSince: '2026-11-09', photoTone: 3,
  phone: '(512) 555-0171', email: 'n.alvarado@example.com',
};

/**
 * One booked visit and nothing else.
 *
 * No conditions, no medicines, no results, no summary. Every section
 * of the chart has to say what it does not have, and none of them may
 * render as a blank space that reads like a normal finding.
 */
export const ninaEncounters: Encounter[] = [
  {
    id: 'ne1', patientId: 'p9', date: '2026-11-24', start: 9 * 60, kind: 'visit', legacyKind: 'initial',
    reason: 'First visit. Nothing sent through yet.',
    status: 'scheduled', duration: 90,
  },
];

export const ninaPrevention: PreventionItem[] = [];
