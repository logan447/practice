/**
 * Priya Raghunathan, the patient you meet for the first time.
 *
 * The other demo patients are established: years of notes, a plan
 * that has been approved three times, labs with a trend. That is the
 * product working. It is not the product being learned, and it is
 * not what the first week of a practice looks like.
 *
 * So this one has exactly what a new member has on the morning of
 * their first visit, and nothing more:
 *
 * - what they wrote on the intake form, in their words
 * - the medicines they are on, as they listed them
 * - one set of records from the practice they left, which is one
 *   chemistry and one lipid panel from eighteen months ago
 * - the three short questionnaires, answered the night before
 * - a blood pressure the front desk took
 *
 * No problem list this practice has agreed to, no lifestyle
 * prescriptions, no preventative schedule, no care plan. Those are
 * the output of the first visit, not its input, and a demo that
 * starts with them already filled in cannot show the one thing the
 * initial visit is for.
 *
 * It is also the hard case for every part of the note we have built:
 * a subjective where most lines read "Unknown", an objective with
 * one lab column and no previous value to put in brackets, and a
 * review of systems with a positive in it, because she wrote one.
 */
import type {
  Condition, InstrumentScore, LabPanel, LifestyleIntervention, Medication,
  PatientUpdate, PreventionItem, Specialist, VitalsSet,
} from '../domain/types';

const P = 'p4';
const MD = {
  author: 'clinician' as const, by: 'Logan L. DuBose, MD, MBA', recorded: '2026-11-14',
};
/** Reported on the intake form. Unverified by this practice, and labelled as such. */
const SELF = {
  author: 'patient' as const, by: 'Priya Raghunathan', recorded: '2026-11-13',
};

/**
 * What she reported on the intake form, and who holds each one.
 *
 * Recorded at intake, which is the point at which a practice says
 * what it is taking on. None of them has a goal yet: a goal is a
 * judgment, and nobody here has met her. "Not assessed" on the first
 * visit is the true state and is the thing the visit changes.
 */
export const priyaConditions: Condition[] = [
  {
    id: 'pc1', patientId: P, name: 'Polycystic ovary syndrome', code: 'E28.2',
    status: 'active', managed: true, owner: 'shared', onset: '2019-04-01',
    provenance: SELF,
    goalNote: 'Cycles regular on the pill. The metabolic half of it is ours and nobody has been doing it.',
    note: 'Diagnosed at 28. Told to lose weight and come back, which she describes as the whole of the advice.',
  },
  {
    id: 'pc2', patientId: P, name: 'Prediabetes', code: 'R73.03',
    status: 'active', managed: true, owner: 'ours', onset: '2025-05-20',
    provenance: SELF,
    goalNote: 'A1c 6.0 eighteen months ago and not repeated. Target is under 5.7 and we do not know where she is.',
    note: 'A1c 6.0 on a screening panel in 2025. Nobody discussed it with her.',
  },
  {
    id: 'pc3', patientId: P, name: 'Migraine without aura', code: 'G43.009',
    status: 'active', managed: true, owner: 'ours', onset: '2014-01-01',
    provenance: SELF,
    goalNote: 'Two or three a month on a triptan alone. Target is fewer than four a month, so she is at it but with no preventer and no diary.',
    note: 'Two or three a month. Sumatriptan from a walk-in clinic.',
  },
  {
    id: 'pc4', patientId: P, name: 'Iron deficiency anaemia', code: 'D50.9',
    status: 'resolved', managed: false, onset: '2022-06-01',
    provenance: SELF,
    note: 'Treated with iron for six months in 2022. Not rechecked since.',
  },
];

/** As she listed them, including the one she is not actually taking. */
export const priyaMeds: Medication[] = [
  {
    id: 'pm1', patientId: P, name: 'Metformin', rxcui: '6809', dose: '500 mg',
    sig: 'One tablet twice daily', started: '2025-06-02', status: 'active',
    indication: 'Prediabetes', provenance: SELF,
    adherence: { status: 'not-taking', reported: '2026-11-13', by: 'patient' },
    changeNote: 'Stopped on her own after two weeks. Nausea.',
  },
  {
    id: 'pm2', patientId: P, name: 'Sumatriptan', rxcui: '37418', dose: '50 mg',
    sig: 'One tablet at the start of a migraine, may repeat once', started: '2021-03-10',
    status: 'active', indication: 'Migraine without aura', provenance: SELF,
    adherence: { status: 'taking', reported: '2026-11-13', by: 'patient' },
  },
  {
    id: 'pm3', patientId: P, name: 'Combined oral contraceptive', dose: '30 mcg',
    sig: 'One tablet daily', started: '2019-05-01', status: 'active',
    indication: 'Polycystic ovary syndrome', provenance: SELF,
    adherence: { status: 'taking', reported: '2026-11-13', by: 'patient' },
  },
];

/**
 * One set of records from the practice she left.
 *
 * Eighteen months old and the only labs on file, which is why the
 * shorthand has nothing in brackets: there is no previous value,
 * because there is no previous visit.
 */
export const priyaPanels: LabPanel[] = [
  {
    id: 'pp1', patientId: P, date: '2025-05-20', group: 'cmp',
    name: 'Comprehensive metabolic panel', from: 'Travis Family Medicine',
    values: [
      { key: 'Na', name: 'Sodium', value: 139, unit: 'mmol/L', refLow: 135, refHigh: 145, flag: 'normal' },
      { key: 'K', name: 'Potassium', value: 4.1, unit: 'mmol/L', refLow: 3.5, refHigh: 5.1, flag: 'normal' },
      { key: 'Cl', name: 'Chloride', value: 104, unit: 'mmol/L', refLow: 98, refHigh: 107, flag: 'normal' },
      { key: 'CO2', name: 'Bicarbonate', value: 25, unit: 'mmol/L', refLow: 22, refHigh: 29, flag: 'normal' },
      { key: 'BUN', name: 'Urea nitrogen', value: 11, unit: 'mg/dL', refLow: 7, refHigh: 20, flag: 'normal' },
      { key: 'Cr', name: 'Creatinine', value: 0.78, unit: 'mg/dL', refLow: 0.5, refHigh: 1.1, flag: 'normal' },
      { key: 'Glu', name: 'Glucose', value: 108, unit: 'mg/dL', refLow: 70, refHigh: 99, flag: 'high' },
      { key: 'ALT', name: 'Alanine aminotransferase', value: 38, unit: 'U/L', refLow: 7, refHigh: 35, flag: 'high' },
      { key: 'AST', name: 'Aspartate aminotransferase', value: 29, unit: 'U/L', refLow: 8, refHigh: 33, flag: 'normal' },
    ],
  },
  {
    id: 'pp2', patientId: P, date: '2025-05-20', group: 'metabolic',
    name: 'Diabetes monitoring', from: 'Travis Family Medicine',
    values: [
      { key: 'A1c', name: 'Haemoglobin A1c', value: 6.0, unit: '%', refLow: 4.0, refHigh: 5.6, flag: 'high' },
    ],
  },
  {
    id: 'pp3', patientId: P, date: '2025-05-20', group: 'lipid',
    name: 'Lipid panel', from: 'Travis Family Medicine',
    values: [
      { key: 'TC', name: 'Total cholesterol', value: 206, unit: 'mg/dL', refHigh: 200, flag: 'high' },
      { key: 'LDL', name: 'LDL cholesterol', value: 131, unit: 'mg/dL', refHigh: 100, flag: 'high' },
      { key: 'HDL', name: 'HDL cholesterol', value: 44, unit: 'mg/dL', refLow: 50, flag: 'low' },
      { key: 'TG', name: 'Triglycerides', value: 188, unit: 'mg/dL', refHigh: 150, flag: 'high' },
    ],
  },
];

/** One blood pressure, taken at the desk when she arrived. */
export const priyaVitals: VitalsSet[] = [
  {
    id: 'pv1', patientId: P, date: '2026-11-16', source: 'office',
    systolic: 128, diastolic: 82, heartRate: 76, weightLb: 181, bmi: 31.1,
  },
];

/**
 * The three questionnaires, answered the night before.
 *
 * One of them is positive, and it is the one the rest of the visit
 * turns out to be about.
 */
export const priyaScores: InstrumentScore[] = [
  { id: 'ps1', patientId: P, instrument: 'phq-2', date: '2026-11-13', score: 2, by: 'patient' },
  {
    id: 'ps2', patientId: P, instrument: 'gad-2', date: '2026-11-13', score: 4, by: 'patient',
    note: 'Positive screen. She raised it herself on the form before anybody asked.',
  },
  { id: 'ps3', patientId: P, instrument: 'flourishing', date: '2026-11-13', score: 62, by: 'patient' },
  /*
   * The GAD-2 was positive, so the long form was sent before the
   * visit rather than asked in the room. That is the escalation the
   * note shows: the short screen every time, the long one only when
   * the short one asks for it.
   */
  { id: 'ps4', patientId: P, instrument: 'gad-7', date: '2026-11-13', score: 12, by: 'patient' },
  { id: 'ps5', patientId: P, instrument: 'audit-c', date: '2026-11-13', score: 4, by: 'patient',
    note: 'Two or three glasses of wine most evenings since the job change.' },
  { id: 'ps6', patientId: P, instrument: 'tobacco', date: '2026-11-13', score: 0, by: 'patient' },
  { id: 'ps7', patientId: P, instrument: 'drug-use', date: '2026-11-13', score: 0, by: 'patient' },
];

/**
 * What she wrote on the form, in her words.
 *
 * The review of systems finds two positives in this and nothing
 * else, which is the behaviour to watch: it reads what she wrote and
 * does not fill in the rest.
 */
export const priyaUpdates: PatientUpdate[] = [
  {
    id: 'pu1', patientId: P, date: '2026-11-13',
    overall: 'I am tired all the time and I have put on about twenty pounds in two years. '
      + 'I was told I have prediabetes and then never heard anything else about it. '
      + 'The headaches are the same as they have always been. '
      + 'I changed jobs in March and I sit all day now, with an hour of commute each way. '
      + 'I cannot sleep before one in the morning most nights and I am up at six.',
    feeling: 'worse',
    interval: [],
  },
];

/**
 * Her gynaecologist, who is the reason the first visit produces a
 * fax: the PCOS work is theirs and the metabolic work is ours, and
 * neither of us knows what the other is doing.
 */
export const priyaSpecialists: Specialist[] = [
  {
    id: 'psp1', patientId: P, name: 'Dr. Amara Nwosu', specialty: 'Gynaecology',
    practice: 'Hill Country Women’s Health', phone: '(512) 555-0388',
    lastSeen: '2026-08-14',
    findings: 'Polycystic ovaries on ultrasound. Cycles regular on the combined pill.',
    recommendations: 'Continue the pill. Metabolic screening and weight management with primary care.',
    outstanding: 'They have asked for our metabolic plan before her next review.',
  },
];

/**
 * Nothing prescribed and nothing scheduled.
 *
 * Both lists exist and both are empty, which is the state the first
 * visit starts from. An empty list is a different thing from a list
 * nobody has made, and only one of them can be filled in.
 */
export const priyaLifestyle: LifestyleIntervention[] = [];
export const priyaPrevention: PreventionItem[] = [
  {
    id: 'ppv1', patientId: P, name: 'Cervical screening', status: 'current',
    lastDone: '2024-09-12', dueBy: '2029-09-12',
    note: 'Done by gynaecology. Normal.',
  },
  {
    id: 'ppv2', patientId: P, name: 'Diabetes screening', status: 'overdue',
    lastDone: '2025-05-20', dueBy: '2026-05-20',
    note: 'A1c 6.0 eighteen months ago and nothing since.',
  },
  {
    id: 'ppv3', patientId: P, name: 'Blood pressure check', status: 'current',
    lastDone: '2026-11-16', dueBy: '2027-11-16',
  },
];

export const PRIYA_PROVENANCE = { MD, SELF };
