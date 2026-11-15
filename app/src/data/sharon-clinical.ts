/**
 * Sharon White's record, in depth. Fictional throughout.
 *
 * Built so the living summary has something real to synthesise from:
 * nine visits over two years, vitals from the office and from her own
 * cuff, lab panels that come back as panels, examinations that were
 * performed on the day they are dated, imaging, two specialists who
 * actually wrote back, and the care management and consent records
 * that billing would need and a summary cannot reconstruct.
 */
import type {
  VitalsSet, LabPanel, ExamRecord, DiagnosticStudy,
  EmRecord, CareLogEntry, ServiceConsent, LabValue, LifestyleIntervention,
  ProblemCheckIn,
} from '../domain/types';

const P = 'p0';

// ---------------------------------------------------------- vitals

const v = (
  id: string, date: string, source: 'office' | 'home',
  o: Partial<VitalsSet>,
): VitalsSet => ({ id, patientId: P, date, source, ...o });

export const sharonVitals: VitalsSet[] = [
  v('sv1', '2025-01-14', 'office', { encounterId: 'se0', systolic: 162, diastolic: 94, heartRate: 82, weightLb: 218, bmi: 34.2, temperatureF: 98.2, spo2: 97 }),
  v('sv2', '2025-06-10', 'office', { encounterId: 'se01', systolic: 154, diastolic: 90, heartRate: 78, weightLb: 215, bmi: 33.7 }),
  v('sv3', '2026-01-20', 'office', { encounterId: 'se1', systolic: 158, diastolic: 88, heartRate: 76, weightLb: 212, bmi: 33.2, temperatureF: 98.4, spo2: 98, respRate: 14 }),
  v('sv4', '2026-04-14', 'office', { encounterId: 'se15', systolic: 146, diastolic: 86, heartRate: 74, weightLb: 207, bmi: 32.5 }),
  v('sv5', '2026-06-18', 'office', { encounterId: 'se2', systolic: 138, diastolic: 82, heartRate: 72, weightLb: 204, bmi: 32.0 }),
  v('sv6', '2026-08-26', 'office', { encounterId: 'se25', systolic: 136, diastolic: 80, heartRate: 70, weightLb: 201, bmi: 31.5 }),
  v('sv7', '2026-10-30', 'office', { encounterId: 'se3', systolic: 132, diastolic: 78, heartRate: 68, weightLb: 198, bmi: 31.0, temperatureF: 98.1, spo2: 98 }),
  // her own cuff, which reads lower and more often
  v('sh1', '2026-09-28', 'home', { systolic: 129, diastolic: 79, heartRate: 71 }),
  v('sh2', '2026-10-12', 'home', { systolic: 126, diastolic: 77 }),
  v('sh3', '2026-10-26', 'home', { systolic: 124, diastolic: 76, heartRate: 69 }),
  v('sh4', '2026-11-09', 'home', { systolic: 122, diastolic: 74, weightLb: 197 }),
];

// ------------------------------------------------------------ labs

const L = (
  key: string, name: string, value: number, unit: string,
  refLow?: number, refHigh?: number,
): LabValue => ({
  key, name, value, unit, refLow, refHigh,
  flag: refHigh !== undefined && value > refHigh ? 'high'
    : refLow !== undefined && value < refLow ? 'low' : 'normal',
});

const cbc = (date: string, wbc: number, hgb: number, hct: number, plt: number): LabPanel => ({
  id: `cbc-${date}`, patientId: P, date, group: 'cbc', name: 'Complete blood count',
  values: [
    L('WBC', 'White cell count', wbc, 'K/uL', 4.0, 11.0),
    L('Hgb', 'Haemoglobin', hgb, 'g/dL', 12.0, 15.5),
    L('Hct', 'Haematocrit', hct, '%', 36, 46),
    L('Plt', 'Platelets', plt, 'K/uL', 150, 400),
  ],
});

const cmp = (
  date: string, na: number, k: number, cl: number, co2: number,
  bun: number, cr: number, glu: number, egfr: number,
  alt: number, ast: number, alb: number,
): LabPanel => ({
  id: `cmp-${date}`, patientId: P, date, group: 'cmp', name: 'Comprehensive metabolic panel',
  values: [
    L('Na', 'Sodium', na, 'mmol/L', 136, 145),
    L('K', 'Potassium', k, 'mmol/L', 3.5, 5.1),
    L('Cl', 'Chloride', cl, 'mmol/L', 98, 107),
    L('CO2', 'Bicarbonate', co2, 'mmol/L', 22, 29),
    L('BUN', 'Urea nitrogen', bun, 'mg/dL', 7, 20),
    L('Cr', 'Creatinine', cr, 'mg/dL', 0.5, 1.1),
    L('Glu', 'Glucose', glu, 'mg/dL', 70, 99),
    L('eGFR', 'eGFR', egfr, 'mL/min/1.73m²', 60, undefined),
    L('ALT', 'Alanine aminotransferase', alt, 'U/L', 7, 35),
    L('AST', 'Aspartate aminotransferase', ast, 'U/L', 8, 33),
    L('Alb', 'Albumin', alb, 'g/dL', 3.5, 5.0),
  ],
});

const lipid = (date: string, tc: number, ldl: number, hdl: number, tg: number): LabPanel => ({
  id: `lip-${date}`, patientId: P, date, group: 'lipid', name: 'Lipid panel',
  values: [
    L('TC', 'Total cholesterol', tc, 'mg/dL', undefined, 200),
    L('LDL', 'LDL cholesterol', ldl, 'mg/dL', undefined, 100),
    L('HDL', 'HDL cholesterol', hdl, 'mg/dL', 50, undefined),
    L('TG', 'Triglycerides', tg, 'mg/dL', undefined, 150),
  ],
});

const metabolic = (date: string, a1c: number, uacr: number): LabPanel => ({
  id: `met-${date}`, patientId: P, date, group: 'metabolic', name: 'Diabetes monitoring',
  values: [
    L('A1c', 'Haemoglobin A1c', a1c, '%', 4.0, 5.6),
    L('UACR', 'Urine albumin/creatinine', uacr, 'mg/g', undefined, 30),
  ],
});

export const sharonPanels: LabPanel[] = [
  cbc('2026-01-20', 6.8, 12.9, 38.4, 268),
  cmp('2026-01-20', 139, 4.2, 103, 25, 18, 1.02, 164, 68, 38, 30, 4.1),
  lipid('2026-01-20', 221, 134, 44, 215),
  metabolic('2026-01-20', 8.1, 42),
  {
    id: 'thy-2026-01-20', patientId: P, date: '2026-01-20', group: 'thyroid', name: 'Thyroid',
    values: [L('TSH', 'Thyrotropin', 2.4, 'uIU/mL', 0.4, 4.5)],
  },

  metabolic('2026-04-14', 7.6, 36),

  cbc('2026-06-16', 7.1, 13.2, 39.1, 255),
  cmp('2026-06-16', 140, 4.4, 104, 26, 16, 0.98, 142, 71, 31, 27, 4.2),
  lipid('2026-06-16', 178, 96, 48, 168),
  metabolic('2026-06-16', 7.4, 28),

  cbc('2026-10-29', 6.4, 13.4, 40.0, 247),
  cmp('2026-10-29', 140, 4.6, 103, 26, 15, 0.95, 128, 74, 26, 24, 4.3),
  lipid('2026-10-29', 154, 78, 52, 121),
  metabolic('2026-10-29', 6.9, 19),
  {
    id: 'thy-2026-10-29', patientId: P, date: '2026-10-29', group: 'thyroid', name: 'Thyroid',
    values: [L('TSH', 'Thyrotropin', 3.1, 'uIU/mL', 0.4, 4.5)],
  },
];

// ------------------------------------------------------------ exams

const ex = (
  id: string, encounterId: string, date: string,
  findings: [string, string][],
): ExamRecord => ({
  id, patientId: P, encounterId, date, by: 'L. DuBose, MD',
  findings: findings.map(([system, text]) => ({ system, text })),
});

export const sharonExams: ExamRecord[] = [
  ex('sx1', 'se1', '2026-01-20', [
    ['General', 'Well, no distress. Obese.'],
    ['Cardiovascular', 'Regular rate and rhythm. No murmur. No peripheral oedema.'],
    ['Respiratory', 'Clear to auscultation bilaterally.'],
    ['Feet', 'Monofilament intact at all sites. Pulses present. No ulceration or callus.'],
    ['Musculoskeletal', 'Both knees with crepitus on flexion. No effusion. Full range.'],
  ]),
  ex('sx2', 'se2', '2026-06-18', [
    ['General', 'Well.'],
    ['Cardiovascular', 'Regular rate and rhythm. No murmur. Trace ankle oedema, both sides.'],
    ['Feet', 'Monofilament intact at all sites. Pulses present. Skin intact.'],
  ]),
  ex('sx3', 'se3', '2026-10-30', [
    ['General', 'Well. Looks better than in January.'],
    ['Cardiovascular', 'Regular rate and rhythm. No murmur. Trace ankle oedema persists, both sides.'],
    ['Respiratory', 'Clear.'],
    ['Musculoskeletal', 'Knees unchanged. Walking without aid.'],
  ]),
];

// ------------------------------------------------------ diagnostics

export const sharonStudies: DiagnosticStudy[] = [
  {
    id: 'sd1', patientId: P, date: '2024-03-11', kind: 'screening',
    name: 'Screening mammogram', from: 'Lone Star Imaging',
    impression: 'BI-RADS 1. No evidence of malignancy. Routine screening in one year.',
    significant: false,
  },
  {
    id: 'sd2', patientId: P, date: '2024-09-05', kind: 'procedure',
    name: 'Screening colonoscopy', from: 'Capital Family Practice',
    impression: 'Two diminutive tubular adenomas removed. Repeat in ten years.',
    significant: true,
  },
  {
    id: 'sd3', patientId: P, date: '2021-06-02', kind: 'imaging',
    name: 'Knee radiographs, both', from: 'Lone Star Imaging',
    impression: 'Moderate medial compartment joint space narrowing, both knees. Osteophytes.',
    significant: true,
  },
  {
    id: 'sd4', patientId: P, date: '2026-01-27', kind: 'cardiac',
    name: 'Electrocardiogram', from: 'In office',
    impression: 'Sinus rhythm, rate 76. Left ventricular hypertrophy by voltage. No ischaemic change.',
    significant: true,
  },
  {
    id: 'sd5', patientId: P, date: '2025-10-02', kind: 'screening',
    name: 'Dilated diabetic eye examination', from: 'Travis County Health',
    impression: 'No diabetic retinopathy. Repeat in one year.',
    significant: false,
  },
];

// ----------------------------------- documentation and billing records

/**
 * What the chart would have to show a biller, per visit.
 *
 * Level is not stored as a conclusion the software reached. The
 * elements are stored, the two candidate answers are computed, and
 * the physician picks. See docs/systems/documentation-and-billing.md.
 */
export const sharonEm: EmRecord[] = [
  {
    encounterId: 'se1',
    problemsAddressed: ['sc1', 'sc2', 'sc3'],
    dataReviewed: [
      'Reviewed outside records, Hill Country Clinic',
      'Ordered CBC, CMP, lipid panel, A1c, TSH',
      'Reviewed prior A1c trend',
    ],
    problemsLevel: 'high', dataLevel: 'moderate', riskLevel: 'moderate',
    totalMinutes: 90, selectedBy: 'time', code: '99215',
  },
  {
    encounterId: 'se2',
    problemsAddressed: ['sc2'],
    dataReviewed: ['Reviewed A1c and CMP', 'Reviewed home glucose log'],
    problemsLevel: 'moderate', dataLevel: 'low', riskLevel: 'high',
    totalMinutes: 32, selectedBy: 'mdm', code: '99214',
  },
  {
    encounterId: 'se3',
    problemsAddressed: ['sc1', 'sc2', 'sc3'],
    dataReviewed: [
      'Reviewed CBC, CMP, lipid panel, A1c, UACR',
      'Reviewed ophthalmology letter',
      'Ordered mammogram and eye examination',
    ],
    problemsLevel: 'moderate', dataLevel: 'moderate', riskLevel: 'moderate',
    totalMinutes: 34, selectedBy: 'mdm', code: '99214',
  },
];

/**
 * A calendar month of care management time.
 *
 * The last entry is the one that matters: minutes a model spent
 * assembling a draft are not clinical staff time, and a programme
 * that counts them is building an overpayment one month at a time.
 */
export const sharonCareLog: CareLogEntry[] = [
  {
    id: 'cl1', patientId: P, program: 'ccm', date: '2026-11-03', minutes: 12,
    by: 'L. DuBose, MD', role: 'physician', countable: true,
    activity: 'Call with patient about mammogram barriers. Found three sites open Saturdays, sent the list.',
  },
  {
    id: 'cl2', patientId: P, program: 'ccm', date: '2026-11-06', minutes: 9,
    by: 'L. DuBose, MD', role: 'physician', countable: true,
    activity: 'Reviewed home blood pressure log, replied in the portal with the plan for amlodipine.',
  },
  {
    id: 'cl3', patientId: P, program: 'ccm', date: '2026-11-10', minutes: 11,
    by: 'L. DuBose, MD', role: 'physician', countable: true,
    activity: 'Coordinated ophthalmology referral, spoke with their scheduler.',
  },
  {
    id: 'cl4', patientId: P, program: 'ccm', date: '2026-11-11', minutes: 6,
    by: 'Assistant (automated)', role: 'automated', countable: false,
    excludedBecause: 'Time spent by software is not clinical staff time and cannot count toward a care management threshold.',
    activity: 'Drafted the longitudinal summary update from the October results.',
  },
  {
    id: 'cl5', patientId: P, program: 'bhi', date: '2026-11-04', minutes: 14,
    by: 'L. DuBose, MD', role: 'physician', countable: true,
    activity: 'PHQ-9 reviewed (score 7). Discussed sleep and carer strain. Safety screen negative.',
  },
];

export const sharonConsents: ServiceConsent[] = [
  {
    id: 'sco1', patientId: P, program: 'ccm', date: '2026-01-20', method: 'verbal',
    by: 'L. DuBose, MD',
    note: 'Explained what care management covers between visits, that only one practice can provide and be paid for it in a calendar month, that there may be cost sharing, and that she can stop at any time. She agreed.',
  },
  {
    id: 'sco2', patientId: P, program: 'bhi', date: '2026-06-18', method: 'verbal',
    by: 'L. DuBose, MD',
    note: 'Explained behavioural health care management, monthly check-ins, use of a questionnaire to track how things are going, and that she can stop at any time. She agreed.',
  },
];

// ------------------------------------------------- lifestyle medicine

/**
 * Prescribed, not discussed.
 *
 * Each one names a domain, says what was actually asked for, points
 * at the problems it is aimed at, and carries a status that someone
 * has to keep current. The barrier field is the useful one: a plan
 * that is not working for a reason is a different problem from one
 * nobody started.
 */
export const sharonLifestyle: LifestyleIntervention[] = [
  {
    id: 'li1', patientId: P, domain: 'activity',
    prescription: 'Twenty minutes of walking after dinner, the four evenings she is at home.',
    forConditions: ['sc2', 'sc1', 'sc5'], status: 'struggling',
    started: '2026-01-20', reviewed: '2026-10-30',
    barrier: 'Knees hurt by the end. Managing two or three evenings rather than four.',
  },
  {
    id: 'li2', patientId: P, domain: 'nutrition',
    prescription: 'Protein at breakfast most days. One sweet drink a day swapped for water.',
    forConditions: ['sc2'], status: 'active',
    started: '2026-01-20', reviewed: '2026-10-30',
  },
  {
    id: 'li3', patientId: P, domain: 'nutrition',
    prescription: 'Something hot and real on her mother\u2019s nights rather than whatever is there at nine.',
    forConditions: ['sc2'], status: 'not-started',
    started: '2026-06-18',
    barrier: 'No plan for this yet. It is the half of the problem we have not solved.',
  },
  {
    id: 'li4', patientId: P, domain: 'sleep',
    prescription: 'In bed by eleven on the nights she is at home.',
    forConditions: ['sc1'], status: 'achieved',
    started: '2026-04-14', reviewed: '2026-10-30',
  },
  {
    id: 'li5', patientId: P, domain: 'stress',
    prescription: 'One afternoon a week where somebody else sits with her mother.',
    forConditions: [], status: 'not-started',
    started: '2026-06-18',
    barrier: 'Her brother has offered twice. She has not taken him up on it.',
  },
];

// ------------------------------------------------- what she said first

/**
 * Sharon's answers, sent in two days before the next visit.
 *
 * One per problem, one per lifestyle prescription she was asked
 * about, one about the mammogram, and one about her health overall.
 * Her words are kept verbatim and never merged into the chart review
 * beside them, because on two of these problems she and the chart
 * disagree and the disagreement is the useful part.
 */
export const sharonCheckIns: ProblemCheckIn[] = [
  {
    id: 'sci1', patientId: P, encounterId: 'se4', date: '2026-11-12',
    about: { kind: 'condition', id: 'sc1' },
    feeling: 'better', onPlan: 'yes',
    text: 'Better. The home readings are the thing that changed it for me. I can see what it does when I take it late and when I do not.',
  },
  {
    id: 'sci2', patientId: P, encounterId: 'se4', date: '2026-11-12',
    about: { kind: 'condition', id: 'sc2' },
    feeling: 'better', onPlan: 'partly',
    text: 'The number is better and I am pleased with that. The evenings at my mother’s are still a write-off. I eat whatever is in the house at nine o’clock.',
  },
  {
    id: 'sci3', patientId: P, encounterId: 'se4', date: '2026-11-12',
    about: { kind: 'condition', id: 'sc3' },
    feeling: 'unsure', onPlan: 'partly',
    text: 'I do not know about this one. I read that the statin may not be doing much at my age and I have skipped it some weeks to see if I felt different. I did not.',
  },
  {
    id: 'sci4', patientId: P, encounterId: 'se4', date: '2026-11-12',
    about: { kind: 'prevention', id: 'sp1' },
    feeling: 'unsure', onPlan: 'no',
    text: 'I know. My sister had hers and they called her back and it was nothing but it took three weeks. I would rather not have three weeks of that right now.',
  },
  {
    id: 'sci5', patientId: P, encounterId: 'se4', date: '2026-11-12',
    about: { kind: 'lifestyle', id: 'li1' },
    feeling: 'worse', onPlan: 'partly',
    text: 'The walking is the knees, not the wanting. Two evenings is what I can do. Four was never going to happen and I should have said so in January.',
  },
  {
    id: 'sci6', patientId: P, encounterId: 'se4', date: '2026-11-12',
    about: { kind: 'lifestyle', id: 'li3' },
    feeling: 'unsure', onPlan: 'no',
    text: 'Nothing has changed here. I do not know what I would even cook on those nights.',
  },
  {
    id: 'sci7', patientId: P, encounterId: 'se4', date: '2026-11-12',
    about: { kind: 'overall' },
    feeling: 'better',
    text: 'Better than a year ago, and I understand it now, which is the part I wanted. What I would like from this visit is to stop adding things. Four tablets is enough. If one of them can go, I would like to talk about which.',
  },
];
