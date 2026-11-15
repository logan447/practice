/**
 * Sharon White. Fictional, like everyone else here.
 *
 * Built to exercise the simplified chart: a history longer than what
 * the practice manages, so the header has something to distinguish;
 * three chronic problems with real trends behind them; prevention
 * that is partly overdue; and a master care plan with enough in it to
 * be worth reading rather than a placeholder.
 */
import type {
  Patient, Condition, Medication, ResultSeries, ResultReport, CarePlan,
  Encounter, PreventionItem, Specialist, Order, MasterPlan, Task,
} from '../domain/types';

const MD = { author: 'clinician' as const, by: 'L. DuBose, MD', recorded: '2026-06-18' };
const SRC = (doc: string, d: string) => ({
  author: 'source' as const, by: doc, recorded: d, sources: [doc],
});

export const sharon: Patient = {
  id: 'p0', name: 'Sharon White', preferredName: 'Sharon', dob: '1966-04-12',
  sex: 'female', pronouns: 'she/her', membership: 'standard', memberSince: '2026-01-12',
  photoTone: 3, phone: '(512) 555-0126', email: 's.white@example.com',
  services: { preventative: true, lifestyle: true },
  pinned: 'Caring for her mother three evenings a week. Any plan has to survive that.',
};

export const sharonConditions: Condition[] = [
  { id: 'sc1', patientId: 'p0', name: 'Essential hypertension', code: 'I10',
    status: 'active', managed: true, onset: '2016-08-03',
    note: 'Two agents. Home readings run lower than clinic.',
    provenance: SRC('Hill Country Clinic records', '2026-01-20') },
  { id: 'sc2', patientId: 'p0', name: 'Type 2 diabetes mellitus', code: 'E11.9',
    status: 'active', managed: true, onset: '2019-11-14',
    note: 'A1c 8.1 at transfer. Falling since. No insulin.',
    provenance: SRC('Hill Country Clinic records', '2026-01-20') },
  { id: 'sc3', patientId: 'p0', name: 'Mixed hyperlipidemia', code: 'E78.2',
    status: 'active', managed: true, onset: '2016-08-03',
    provenance: SRC('Hill Country Clinic records', '2026-01-20') },
  // History, not managed here. The distinction is what the header is for.
  { id: 'sc4', patientId: 'p0', name: 'Hypothyroidism', code: 'E03.9',
    status: 'active', managed: false, onset: '2011-02-20',
    note: 'Endocrinology holds this. Stable on 88 mcg for years.',
    provenance: SRC('Hill Country Clinic records', '2026-01-20') },
  { id: 'sc5', patientId: 'p0', name: 'Osteoarthritis, both knees', code: 'M17.0',
    status: 'active', managed: false, onset: '2021-05-30',
    provenance: SRC('Lone Star Imaging report', '2021-06-02') },
  { id: 'sc6', patientId: 'p0', name: 'Vitamin D deficiency', code: 'E55.9',
    status: 'resolved', managed: false, onset: '2026-01-20', resolved: '2026-08-14',
    provenance: MD },
];

export const sharonMeds: Medication[] = [
  { id: 'sm1', patientId: 'p0', name: 'Lisinopril', rxcui: '29046', dose: '20 mg',
    sig: 'One tablet each morning', started: '2016-08-10', status: 'active',
    indication: 'Essential hypertension', provenance: MD },
  { id: 'sm2', patientId: 'p0', name: 'Amlodipine', rxcui: '17767', dose: '5 mg',
    sig: 'One tablet each morning', started: '2022-03-02', status: 'active',
    indication: 'Essential hypertension', provenance: MD },
  { id: 'sm3', patientId: 'p0', name: 'Metformin', rxcui: '6809', dose: '1000 mg',
    sig: 'One tablet twice daily with food', started: '2019-11-20', status: 'active',
    indication: 'Type 2 diabetes mellitus', provenance: MD },
  { id: 'sm4', patientId: 'p0', name: 'Empagliflozin', rxcui: '1545653', dose: '10 mg',
    sig: 'One tablet each morning', started: '2026-06-18', status: 'active',
    indication: 'Type 2 diabetes mellitus',
    changeNote: 'Added June 2026 for glycaemic control and kidney protection.',
    provenance: MD },
  { id: 'sm5', patientId: 'p0', name: 'Atorvastatin', rxcui: '83367', dose: '40 mg',
    sig: 'One tablet at night', started: '2016-08-10', status: 'active',
    indication: 'Mixed hyperlipidemia', provenance: MD },
  { id: 'sm6', patientId: 'p0', name: 'Levothyroxine', rxcui: '10582', dose: '88 mcg',
    sig: 'One tablet on an empty stomach', started: '2011-03-01', status: 'active',
    indication: 'Hypothyroidism', provenance: SRC('Endocrinology', '2026-01-20') },
  { id: 'sm7', patientId: 'p0', name: 'Glipizide', rxcui: '4821', dose: '5 mg',
    sig: 'One tablet each morning', started: '2021-04-02', stopped: '2026-06-18',
    status: 'stopped', indication: 'Type 2 diabetes mellitus',
    changeNote: 'Stopped June 2026. Two hypoglycaemic episodes while caring for her mother.',
    provenance: MD },
];

const s = (
  id: string, name: string, code: string, unit: string,
  points: [string, number][], refLow?: number, refHigh?: number,
  target?: { value: number; direction: 'below' | 'above' },
  source?: 'clinical' | 'patient',
): ResultSeries => ({
  id, patientId: 'p0', name, code, unit, refLow, refHigh, target, source,
  points: points.map(([date, value]) => ({
    date, value,
    flag: (refHigh !== undefined && value > refHigh) ? 'high'
      : (refLow !== undefined && value < refLow) ? 'low' : 'normal',
  })),
});

export const sharonSeries: ResultSeries[] = [
  s('sr1', 'Hemoglobin A1c', '4548-4', '%', [
    ['2026-01-20', 8.1], ['2026-04-14', 7.6], ['2026-06-16', 7.4], ['2026-10-29', 6.9],
  ], 4.0, 5.6, { value: 7.0, direction: 'below' }),
  s('sr2', 'LDL cholesterol', '13457-7', 'mg/dL', [
    ['2026-01-20', 134], ['2026-06-16', 96], ['2026-10-29', 78],
  ], undefined, 100, { value: 70, direction: 'below' }),
  s('sr3', 'Systolic blood pressure', '8480-6', 'mmHg', [
    ['2026-01-20', 158], ['2026-04-14', 146], ['2026-06-16', 138], ['2026-10-29', 132],
  ], undefined, 130, { value: 130, direction: 'below' }),
  s('sr4', 'Weight', '29463-7', 'lb', [
    ['2026-01-20', 212], ['2026-04-14', 207], ['2026-06-16', 204], ['2026-10-29', 198],
  ], undefined, undefined, { value: 195, direction: 'below' }),
  s('sr5', 'eGFR', '98979-8', 'mL/min/1.73m²', [
    ['2026-01-20', 68], ['2026-06-16', 71], ['2026-10-29', 74],
  ], 60, undefined),
  s('sr6', 'Systolic blood pressure, home', '8480-6', 'mmHg', [
    ['2026-09-28', 129], ['2026-10-12', 126], ['2026-10-26', 124], ['2026-11-09', 122],
  ], undefined, 135, undefined, 'patient'),
];

export const sharonReports: ResultReport[] = [
  { id: 'srr1', patientId: 'p0', panel: 'Diabetes and lipid panel', resulted: '2026-10-29',
    worstFlag: 'high', acknowledged: true, acknowledgedBy: 'L. DuBose, MD',
    acknowledgedAt: '2026-10-30', seriesIds: ['sr1', 'sr2', 'sr5'] },
];

export const sharonPrevention: PreventionItem[] = [
  { id: 'sp1', patientId: 'p0', name: 'Mammogram', status: 'overdue',
    lastDone: '2024-03-11', dueBy: '2026-03-11',
    note: 'Two years since the last one. She keeps putting it off.' },
  { id: 'sp2', patientId: 'p0', name: 'Colonoscopy', status: 'current', lastDone: '2024-09-05' },
  { id: 'sp3', patientId: 'p0', name: 'Diabetic eye examination', status: 'due',
    lastDone: '2025-10-02', dueBy: '2026-10-02' },
  { id: 'sp4', patientId: 'p0', name: 'Diabetic foot examination', status: 'current',
    lastDone: '2026-06-18' },
  { id: 'sp5', patientId: 'p0', name: 'Influenza vaccine', status: 'current', lastDone: '2026-10-01' },
  { id: 'sp6', patientId: 'p0', name: 'Bone density scan', status: 'due', dueBy: '2026-12-31',
    note: 'Baseline at 60. Not yet done.' },
];

export const sharonSpecialists: Specialist[] = [
  { id: 'ss1', patientId: 'p0', name: 'Dr. Ingrid Sorensen', specialty: 'Endocrinology',
    practice: 'Capital Family Practice', phone: '(512) 555-0311', lastSeen: '2026-02-03',
    findings: 'Thyroid stable on 88 mcg. No change.',
    recommendations: 'Annual TSH. Primary care to manage the diabetes.',
    outstanding: 'None.' },
  { id: 'ss2', patientId: 'p0', name: 'Dr. Omar Haddad', specialty: 'Ophthalmology',
    practice: 'Travis County Health', phone: '(512) 555-0342', lastSeen: '2025-10-02',
    findings: 'No retinopathy at the last examination.',
    outstanding: 'This year’s dilated examination is not booked.' },
];

export const sharonPlan: CarePlan = {
  id: 'scp1', patientId: 'p0', version: 4, updated: '2026-10-30', signed: true,
  signedBy: 'L. DuBose, MD',
  summary: 'The A1c is coming down without insulin and without a drug that drops her sugar while she is looking after her mother. Hold that, and get the overdue screening done.',
  goals: [
    { id: 'sg1', title: 'Get the A1c under 7 and keep it there', domain: 'medical',
      why: 'Under 7 is where the long-term damage to your eyes, kidneys and feet slows down.',
      status: 'on-track', measure: { seriesId: 'sr1', label: 'Hemoglobin A1c' },
      actions: [
        { id: 'sa1', text: 'Metformin twice a day with food', owner: 'patient', done: true },
        { id: 'sa2', text: 'Empagliflozin each morning', owner: 'patient', done: true },
        { id: 'sa3', text: 'Repeat the A1c in three months', owner: 'physician', done: false },
      ] },
    { id: 'sg2', title: 'Blood pressure under 130 at home', domain: 'medical',
      why: 'Lower pressure over years protects the heart, the kidneys and the brain.',
      status: 'on-track', measure: { seriesId: 'sr6', label: 'Home blood pressure' },
      actions: [
        { id: 'sa4', text: 'Check it at home twice a week and write it down', owner: 'patient', done: true },
        { id: 'sa5', text: 'Review whether amlodipine can come down', owner: 'physician', done: false },
      ] },
    { id: 'sg3', title: 'Walk on the evenings she is not at her mother’s', domain: 'movement',
      why: 'Three evenings are taken. The other four are the ones we can work with.',
      status: 'needs-attention',
      actions: [
        { id: 'sa6', text: 'Twenty minutes after dinner, four evenings a week', owner: 'patient', done: false },
      ] },
    { id: 'sg4', title: 'Get the mammogram done', domain: 'medical',
      why: 'It is two years overdue and it is the one thing on this list that could find something early.',
      status: 'not-started',
      actions: [
        { id: 'sa7', text: 'Book it on a day she is not at her mother’s', owner: 'patient', done: false },
        { id: 'sa8', text: 'Send the order and the three nearest places', owner: 'physician', done: true },
      ] },
  ],
  provenance: MD,
};

export const sharonEncounters: Encounter[] = [
  { id: 'se1', patientId: 'p0', date: '2026-01-20', start: 9 * 60, kind: 'initial',
    reason: 'Transfer of care. Full history, medicines, and what she wants to work on.',
    status: 'signed', duration: 90, signedAt: '2026-01-20',
    note: {
      subjective: {
        oneLiner: 'Sharon is a 59-year-old woman transferring care with hypertension, type 2 diabetes and hyperlipidemia.',
        reason: 'Wants a doctor who will look at the whole thing rather than one problem at a time.',
        chartReview: '', diagnostics: '', specialists: '',
        additional: 'Diagnosed with diabetes in 2019. On metformin and glipizide. Says she has never been told what the numbers mean. Caring for her mother three evenings a week since 2024.',
      },
      objective: { homeMeasures: '', vitals: 'BP 158/88. Weight 212 lb. BMI 33.2.', exam: 'Well. Feet: sensation intact, no ulceration.' },
      assessment: { oneLiner: '', overall: 'Three linked problems, none at target, and a care situation that has to be designed around rather than ignored.' },
      plan: { problems: [], overall: 'Full panel today. Start by explaining the numbers. Change nothing yet.' },
    } },
  { id: 'se2', patientId: 'p0', date: '2026-06-18', start: 10 * 60 + 30, kind: 'follow-up',
    reason: 'Review of diabetes control after two hypoglycaemic episodes.',
    status: 'signed', duration: 30, signedAt: '2026-06-18',
    note: {
      subjective: {
        oneLiner: '', reason: 'Two episodes of shakiness and sweating in the evening, both at her mother’s.',
        chartReview: '', diagnostics: '', specialists: '',
        additional: 'Both episodes mid-evening after a late and light meal. Resolved with juice. No loss of consciousness.',
      },
      objective: { homeMeasures: '', vitals: 'BP 138/82. Weight 204 lb.', exam: '' },
      assessment: { oneLiner: '', overall: 'Glipizide hypoglycaemia in the context of irregular evening meals. The drug is the wrong fit for her week, not the dose.' },
      plan: { problems: [], overall: 'Stop glipizide. Start empagliflozin 10 mg. Recheck A1c in four months.' },
    } },
  { id: 'se3', patientId: 'p0', date: '2026-10-30', start: 14 * 60, kind: 'follow-up',
    reason: 'Results review.',
    status: 'signed', duration: 30, signedAt: '2026-10-30',
    note: {
      subjective: {
        oneLiner: '', reason: 'Here for the blood results.',
        chartReview: '', diagnostics: '', specialists: '',
        additional: 'No further hypoglycaemia since stopping glipizide. Walking most evenings she is at home.',
      },
      objective: { homeMeasures: 'Home systolic averaging 125 over the last six weeks.', vitals: 'BP 132/78. Weight 198 lb.', exam: '' },
      assessment: { oneLiner: '', overall: 'A1c 6.9, down from 8.1 in January. LDL 78. Everything moving the right way. The mammogram is the outstanding item.' },
      plan: { problems: [], overall: 'Continue. Mammogram order sent. Eye examination due.' },
    } },
  // ahead
  { id: 'se4', patientId: 'p0', date: '2026-11-17', start: 11 * 60, kind: 'follow-up',
    reason: 'Three month review', status: 'scheduled', duration: 30 },
  { id: 'se5', patientId: 'p0', date: '2027-01-19', start: 9 * 60, kind: 'annual',
    reason: 'Annual physical', status: 'scheduled', duration: 75 },
];

export const sharonOrders: Order[] = [
  { id: 'so1', patientId: 'p0', kind: 'imaging', text: 'Screening mammogram, bilateral',
    goalId: 'sg4', status: 'placed', created: '2026-10-30' },
  { id: 'so2', patientId: 'p0', kind: 'referral', text: 'Ophthalmology, dilated diabetic eye examination',
    status: 'placed', created: '2026-10-30' },
  { id: 'so3', patientId: 'p0', kind: 'lab', text: 'A1c, lipid panel, basic metabolic panel in 3 months',
    goalId: 'sg1', status: 'placed', created: '2026-10-30' },
  { id: 'so4', patientId: 'p0', kind: 'imaging', text: 'DEXA, baseline bone density',
    status: 'draft', created: '2026-11-02' },
  { id: 'so5', patientId: 'p0', kind: 'prescription', text: 'Atorvastatin 40 mg, 90 day refill',
    status: 'draft', created: '2026-11-10' },
];

export const sharonTasks: Task[] = [
  { id: 'st1', patientId: 'p0', kind: 'prevention', text: 'Mammogram two years overdue',
    due: '2026-11-20', urgent: false, done: false },
];

export const sharonMaster: MasterPlan = {
  id: 'smp1', patientId: 'p0', updated: '2026-10-30', updatedBy: 'L. DuBose, MD',
  subjective: {
    history: 'Hypertension and hyperlipidemia since 2016, type 2 diabetes since 2019, all managed elsewhere until she transferred here in January 2026 with an A1c of 8.1. Hypothyroidism held by endocrinology, stable for years. Knee osteoarthritis limits how much walking is realistic.',
    goals: 'She wants to stay off insulin, and she wants to understand her own numbers rather than be told they are fine. Her words in January: "nobody has ever shown me what any of it means."',
    context: 'Caring for her mother three evenings a week since 2024. That is the fixed constraint every plan has had to fit around, and it is why glipizide came off in June after two evening hypoglycaemic episodes. The four evenings she is at home are the ones worth planning with.',
  },
  objective: {
    narrative: 'Home readings run eight to ten points below clinic, consistently enough to plan on. Feet examined June 2026, sensation intact. No retinopathy at the last dilated examination in October 2025.',
  },
  assessment: {
    narrative: 'All three managed problems are moving in the right direction and none has needed insulin or a fourth agent. The diabetes is the one doing the work: A1c 8.1 to 6.9 in nine months, achieved by removing a drug rather than adding one. Blood pressure is at target on home readings and arguably over-treated in clinic. The real outstanding risk on this chart is not metabolic. It is a mammogram two years overdue.',
  },
  plan: {
    byProblem: {
      sc1: 'Lisinopril 20 mg and amlodipine 5 mg. Home systolic averaging 125. Review whether amlodipine can come down at the next visit, since ankle swelling is her main complaint about it.',
      sc2: 'Metformin 1000 mg twice daily and empagliflozin 10 mg. No sulfonylurea, deliberately. Repeat A1c in three months. Foot examination done June, eye examination due.',
      sc3: 'Atorvastatin 40 mg. LDL 78, below the 100 threshold and tracking towards 70. No change.',
    },
    prevention: 'Mammogram overdue by two years. Order sent 30 October with the three nearest places that open on a Saturday. Diabetic eye examination due, referral sent. Baseline bone density due before the end of the year. Colonoscopy current to 2034. Influenza vaccine given October.',
    lifestyle: 'Twenty minutes of walking after dinner on the four evenings she is at home, which is the version of this that survives her week. Knees are the limit, not motivation. Evening meals on her mother’s nights are the other half of the problem and we have not solved that yet.',
    followUp: 'Three months, with bloods done beforehand. Sooner if the mammogram finds anything.',
  },
};
