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
  Encounter, PreventionItem, Specialist, Order, MasterPlan, Task, ChartDocument,
} from '../domain/types';

const MD = { author: 'clinician' as const, by: 'Logan L. DuBose, MD, MBA', recorded: '2026-06-18' };
const SRC = (doc: string, d: string) => ({
  author: 'source' as const, by: doc, recorded: d, sources: [doc],
});

export const sharon: Patient = {
  id: 'p0', name: 'Sharon White', preferredName: 'Sharon', dob: '1966-04-12',
  sex: 'female', pronouns: 'she/her', membership: 'standard', memberSince: '2026-01-12',
  photoTone: 3, phone: '(512) 555-0126', email: 's.white@example.com',
  services: { preventative: true, lifestyle: true },
  pinned: 'Caring for her mother three evenings a week. Any plan has to survive that.',
  pcp: { name: 'Dr. Helena Brandt', practice: 'Hill Country Clinic', since: '2014-02-01' },
  history: {
    family: [
      { relation: 'Mother', condition: 'Type 2 diabetes', note: 'Diagnosed in her fifties. Living, 88.' },
      { relation: 'Father', condition: 'Myocardial infarction', note: 'Age 61. Died 2009.' },
      { relation: 'Sister', condition: 'Hypothyroidism' },
      { relation: 'Maternal grandmother', condition: 'Breast cancer', note: 'Age 70s.' },
    ],
    surgical: [
      { name: 'Cholecystectomy', year: '2011', note: 'Laparoscopic. No complications.' },
      { name: 'Caesarean section', year: '1996' },
    ],
    social: {
      tobacco: 'Never smoked.',
      alcohol: 'Two or three glasses of wine a week.',
      substances: 'None.',
      work: 'School administrator, four days a week.',
      living: 'Lives with her husband. Caring for her mother three evenings a week.',
      note: 'The caring is the single biggest constraint on any plan written here.',
    },
  },
};

export const sharonConditions: Condition[] = [
  { id: 'sc1', patientId: 'p0', name: 'Essential hypertension', code: 'I10',
    status: 'active', managed: true, owner: 'ours', onset: '2016-08-03',
    goal: 'at-goal', goalAssessed: '2026-10-30',
    goalNote: 'Home readings 122 to 129 systolic, which is the series being treated to and is under 130. Clinic 132/78 on 30 Oct, marginally above the systolic target for a diabetic.',
    note: 'Two agents. Home readings run lower than clinic.',
    provenance: SRC('Hill Country Clinic records', '2026-01-20') },
  { id: 'sc2', patientId: 'p0', name: 'Type 2 diabetes mellitus', code: 'E11.9',
    status: 'active', managed: true, owner: 'ours', onset: '2019-11-14',
    goal: 'at-goal', goalAssessed: '2026-10-30',
    goalNote: 'A1c 8.1 to 6.9 in nine months, achieved by removing a drug rather than adding one.',
    note: 'A1c 8.1 at transfer. Falling since. No insulin.',
    provenance: SRC('Hill Country Clinic records', '2026-01-20') },
  { id: 'sc3', patientId: 'p0', name: 'Mixed hyperlipidemia', code: 'E78.2',
    status: 'active', managed: true, owner: 'ours', onset: '2016-08-03',
    goal: 'at-goal', goalAssessed: '2026-10-30',
    goalNote: 'LDL 78 on atorvastatin 40, under the 100 target for a diabetic with no established vascular disease. She is missing doses on purpose, so the number is better than the adherence.',
    note: 'At target on the number. The risk is that the number stops being true if the missed doses continue.',
    provenance: SRC('Hill Country Clinic records', '2026-01-20') },
  // History, not managed here. The distinction is what the header is for.
  { id: 'sc4', patientId: 'p0', name: 'Hypothyroidism', code: 'E03.9',
    status: 'active', managed: false, owner: 'theirs', onset: '2011-02-20',
    note: 'Endocrinology holds this. Stable on 88 mcg for years.',
    provenance: SRC('Hill Country Clinic records', '2026-01-20') },
  { id: 'sc5', patientId: 'p0', name: 'Osteoarthritis, both knees', code: 'M17.0',
    status: 'active', managed: false, owner: 'shared', onset: '2021-05-30',
    provenance: SRC('Lone Star Imaging report', '2021-06-02') },
  { id: 'sc6', patientId: 'p0', name: 'Vitamin D deficiency', code: 'E55.9',
    status: 'resolved', managed: false, onset: '2026-01-20', resolved: '2026-08-14',
    provenance: MD },
];

export const sharonMeds: Medication[] = [
  { id: 'sm1', patientId: 'p0', name: 'Lisinopril', rxcui: '29046', dose: '20 mg',
    sig: 'One tablet each morning', started: '2016-08-10', status: 'active',
    indication: 'Essential hypertension',
    adherence: { status: 'taking', reported: '2026-11-12', by: 'patient' },
    provenance: MD },
  { id: 'sm2', patientId: 'p0', name: 'Amlodipine', rxcui: '17767', dose: '5 mg',
    sig: 'One tablet each morning', started: '2022-03-02', status: 'active',
    indication: 'Essential hypertension',
    adherence: { status: 'taking', reported: '2026-09-28', by: 'patient' },
    provenance: MD },
  { id: 'sm3', patientId: 'p0', name: 'Metformin', rxcui: '6809', dose: '1000 mg',
    sig: 'One tablet twice daily with food', started: '2019-11-20', status: 'active',
    indication: 'Type 2 diabetes mellitus',
    adherence: {
      status: 'taking', reported: '2026-07-22', by: 'patient',
      note: 'Taken with food since the stomach upset in the spring.',
    },
    provenance: MD },
  { id: 'sm4', patientId: 'p0', name: 'Empagliflozin', rxcui: '1545653', dose: '10 mg',
    sig: 'One tablet each morning', started: '2026-06-18', status: 'active',
    indication: 'Type 2 diabetes mellitus',
    changeNote: 'Added June 2026 for glycaemic control and kidney protection.',
    adherence: {
      status: 'taking', reported: '2026-07-22', by: 'patient',
      note: 'Passing water more often, which she was warned about.',
    },
    provenance: MD },
  { id: 'sm5', patientId: 'p0', name: 'Atorvastatin', rxcui: '83367', dose: '40 mg',
    sig: 'One tablet at night', started: '2016-08-10', status: 'active',
    indication: 'Mixed hyperlipidemia',
    adherence: {
      status: 'missing-some', reported: '2026-11-12', by: 'patient',
      note: 'Skipping some weeks on purpose, to see whether she feels any different.',
    },
    provenance: MD },
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
    worstFlag: 'high', acknowledged: true, acknowledgedBy: 'Logan L. DuBose, MD, MBA',
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
    practice: 'Capital Family Practice', phone: '(512) 555-0311',
    lastSeen: '2026-02-03', nextSeen: '2027-02-09',
    findings: 'Thyroid stable on 88 mcg. No change.',
    recommendations: 'Annual TSH. Primary care to manage the diabetes.',
    outstanding: 'None.' },
  { id: 'ss2', patientId: 'p0', name: 'Dr. Omar Haddad', specialty: 'Ophthalmology',
    practice: 'Travis County Health', phone: '(512) 555-0342', lastSeen: '2025-10-02',
    findings: 'No retinopathy at the last examination, both eyes.',
    recommendations: 'Annual dilated examination while the A1c is above 7. Sooner if any visual change.',
    outstanding: 'This year’s dilated examination is not booked.' },
];

export const sharonPlan: CarePlan = {
  id: 'scp1', patientId: 'p0', version: 4, updated: '2026-10-30', signed: true,
  signedBy: 'Logan L. DuBose, MD, MBA',
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


/**
 * Earlier visits, from before and around the transfer of care.
 *
 * Here so the longitudinal summary has a history to compress rather
 * than a single note to restate.
 */
const EARLIER: Encounter[] = [
  { id: 'se0', patientId: 'p0', date: '2025-01-14', start: 9 * 60, kind: 'visit', legacyKind: 'follow-up',
    reason: 'Records request and first conversation.',
    status: 'signed', duration: 30, signedAt: '2025-01-14',
    note: {
      subjective: {
        oneLiner: '', reason: 'Wanted to know what a membership practice would actually do differently.',
        chartReview: '', diagnostics: '', specialists: '',
        additional: 'Not yet a member. Came for a free conversation. Three conditions, all managed at Hill Country, all at the same doses for years. Says visits there are ten minutes and she leaves with a printout she does not read.',
      },
      objective: { homeMeasures: '', vitals: 'BP 162/94. Weight 218 lb.', exam: '' },
      assessment: { oneLiner: '', overall: 'Not a clinical encounter. Blood pressure today is well above target and she did not know it.' },
      plan: { problems: [], overall: 'Gave her the blood pressure reading in writing and told her to take it to Hill Country. Invited her to join when she is ready.' },
    } },
  { id: 'se01', patientId: 'p0', date: '2025-06-10', start: 14 * 60, kind: 'visit', legacyKind: 'follow-up',
    reason: 'Second conversation.',
    status: 'signed', duration: 30, signedAt: '2025-06-10',
    note: {
      subjective: {
        oneLiner: '', reason: 'Came back. Mother had a fall in March and she is now the main carer.',
        chartReview: '', diagnostics: '', specialists: '',
        additional: 'Hill Country added amlodipine in March. She is taking it. Her mother fell and she is there three evenings a week now. Says she has stopped cooking for herself.',
      },
      objective: { homeMeasures: '', vitals: 'BP 154/90. Weight 215 lb.', exam: '' },
      assessment: { oneLiner: '', overall: 'Circumstances changed more than the medicine did. The carer role is going to shape everything.' },
      plan: { problems: [], overall: 'No clinical plan. She will think about joining after the summer.' },
    } },
  { id: 'se15', patientId: 'p0', date: '2026-04-14', start: 11 * 60, kind: 'visit', legacyKind: 'follow-up',
    reason: 'Three month review after transfer.',
    status: 'signed', duration: 30, signedAt: '2026-04-14',
    note: {
      subjective: {
        oneLiner: '', reason: 'First review since joining.',
        chartReview: '', diagnostics: '', specialists: '',
        additional: 'Taking everything as written. Has started reading the numbers herself and asked what the A1c target should be. Walking twice a week. Two episodes of feeling shaky in the evening that she had not mentioned before.',
      },
      objective: { homeMeasures: '', vitals: 'BP 146/86. Weight 207 lb.', exam: '' },
      assessment: { oneLiner: '', overall: 'A1c 7.6, down from 8.1. Moving. The shakiness needs attention before it becomes the reason she stops trying.' },
      plan: { problems: [], overall: 'Explained hypoglycaemia and what to do. Asked her to note when it happens. Continue current medicines. Repeat A1c in two months.' },
    } },
  { id: 'se25', patientId: 'p0', date: '2026-08-26', start: 15 * 60, kind: 'visit', legacyKind: 'acute',
    reason: 'Ankle swelling.',
    status: 'signed', duration: 20, signedAt: '2026-08-26',
    note: {
      subjective: {
        oneLiner: '', reason: 'Both ankles swelling by the evening since about June.',
        chartReview: '', diagnostics: '', specialists: '',
        additional: 'Worse on the days she is at her mother\u2019s and on her feet. No breathlessness, no orthopnoea, no chest pain. Shoes still fit in the morning.',
      },
      objective: { homeMeasures: '', vitals: 'BP 136/80. Weight 201 lb.', exam: 'Trace pitting oedema to mid-shin, both sides. Chest clear. No raised JVP.' },
      assessment: { oneLiner: '', overall: 'Dependent oedema, almost certainly amlodipine. No features of heart failure. She would rather keep the blood pressure control than lose the ankles, for now.' },
      plan: { problems: [], overall: 'Explained the cause. Agreed to review the amlodipine dose at the next visit once the home readings have a longer run. Nothing added.' },
    } },
];

export const sharonEncounters: Encounter[] = [
  ...EARLIER,
  { id: 'se1', patientId: 'p0', date: '2026-01-20', start: 9 * 60, kind: 'visit', legacyKind: 'initial',
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
  { id: 'se2', patientId: 'p0', date: '2026-06-18', start: 10 * 60 + 30, kind: 'visit', legacyKind: 'follow-up',
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
  { id: 'se3', patientId: 'p0', date: '2026-10-30', start: 14 * 60, kind: 'visit', legacyKind: 'follow-up',
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
  { id: 'se4', patientId: 'p0', date: '2026-11-17', start: 11 * 60, kind: 'visit', legacyKind: 'follow-up',
    reason: 'Three month review', status: 'scheduled', duration: 30 },
  { id: 'se5', patientId: 'p0', date: '2027-01-19', start: 9 * 60, kind: 'visit', legacyKind: 'annual',
    reason: 'Annual physical', status: 'scheduled', duration: 75 },
];

/**
 * What arrived from elsewhere, in the three states files arrive in.
 *
 * One read cleanly, one is a scan nobody has typed up, and one came
 * through as a fax that would not parse. All three go in the packet,
 * because a receiving clinician needs to know the third one exists
 * even though we cannot tell them what is in it.
 */
export const sharonDocuments: ChartDocument[] = [
  {
    id: 'sdoc1', patientId: 'p0', title: 'Endocrinology clinic letter',
    date: '2026-02-03', from: 'Capital Family Practice', kind: 'consult',
    status: 'parsed', reviewed: true,
    text: 'Thank you for referring Mrs White. Thyroid function is stable on levothyroxine 88 mcg and I would not change it. Her diabetes is well within primary care scope and I am happy for you to lead on it. Annual TSH is sufficient. I will not routinely review her.',
  },
  {
    id: 'sdoc2', patientId: 'p0', title: 'Ophthalmology report',
    date: '2025-10-02', from: 'Travis County Health', kind: 'imaging',
    status: 'scanned', reviewed: false,
  },
  {
    id: 'sdoc3', patientId: 'p0', title: 'Outside records, transfer bundle',
    date: '2026-01-20', from: 'Hill Country Clinic', kind: 'other',
    status: 'failed', reviewed: false,
    text: 'W\u00c5\u00ddTE, SH\u00c5RON  DOB //// 04/12/66 ////  ME\u00d0S: lisinopril 2O mg\u2026 <<FAX OCR CONFIDENCE 0.28>>',
  },
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

/**
 * The summary as it stood after the June visit.
 *
 * Deliberately older than the October results and the October visit,
 * because that is the normal state of a longitudinal document: the
 * record moves and the summary lags. The chart opens saying so.
 */
export const sharonMaster: MasterPlan = {
  id: 'smp1', patientId: 'p0', updated: '2026-06-20', updatedBy: 'Logan L. DuBose, MD, MBA',
  objective: {
    narrative: 'Feet examined 18 June 2026, sensation intact. No retinopathy at the last dilated examination in October 2025. She has just started taking her own blood pressure at home; not enough readings yet to say how they compare with clinic.',
  },
  assessment: {
    narrative: 'A1c 7.4 on 16 June, down from 8.1 in January, on metformin alone since glipizide came off. Blood pressure 138/82 in clinic, better than January but not yet at target. LDL 96, below 100 for the first time. The outstanding risk on this chart is not metabolic: the mammogram is eighteen months overdue.',
  },
  plan: {
    byProblem: {
      sc1: 'No change. Treat to the home readings rather than the clinic ones. Review at four months.',
      sc2: 'Hold at two agents. Repeat A1c in four months. If the evenings at her mother\u2019s are still unsolved by then, that is the thing to work on, not the dose.',
      sc3: 'Go through the actual numbers with her before changing anything. The skipped doses are a conversation, not a titration.',
    },
    prevention: 'Offer to book the mammogram rather than ask her to. What is in the way is the callback, not the appointment.',
    lifestyle: 'Two evenings of walking is the realistic version. The evening meals are the unsolved half.',
    followUp: 'Four months, with A1c, lipids and a metabolic panel done beforehand.',
  },
};
