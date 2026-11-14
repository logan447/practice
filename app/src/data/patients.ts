/**
 * Fictional patients. No real person, no real record.
 *
 * Shaped for a preventive and lifestyle medicine panel: metabolic risk,
 * blood pressure, sleep, weight, and the chronic conditions that follow
 * from them, with enough history that the longitudinal views have
 * something to show.
 *
 * Replaced wholesale by a FHIR client when there is a backend.
 */
import type {
  Patient, Condition, Medication, ResultSeries, ResultReport, CarePlan,
  Encounter, PreventionItem, PatientEntry, AiDraft, Task, Specialist,
  PreVisit, Order
} from '../domain/types';

const MD = { author: 'clinician' as const, by: 'L. DuBose, MD', recorded: '2026-11-14' };
const SRC = (doc: string, d: string) => ({
  author: 'source' as const, by: doc, recorded: d, sources: [doc]
});
const PT = (d: string) => ({ author: 'patient' as const, by: 'Patient', recorded: d });

export const patients: Patient[] = [
  {
    id: 'p1', name: 'Marcus Reyes', preferredName: 'Marcus', dob: '1972-03-18',
    sex: 'male', pronouns: 'he/him', membership: 'standard', memberSince: '2025-09-02',
    photoTone: 0, phone: '(512) 555-0142', email: 'm.reyes@example.com',
    pinned: 'Wants to come off the BP medicine if the numbers hold. That is his goal, not mine.'
  },
  {
    id: 'p2', name: 'Dana Whitfield', preferredName: 'Dana', dob: '1985-07-29',
    sex: 'female', pronouns: 'she/her', membership: 'sliding-scale', memberSince: '2026-01-15',
    photoTone: 1, phone: '(512) 555-0188', email: 'dana.w@example.com',
    pinned: 'Night-shift nurse, three on / four off. Any plan has to survive that rota.'
  },
  {
    id: 'p3', name: 'Arthur Lindqvist', preferredName: 'Art', dob: '1958-11-04',
    sex: 'male', pronouns: 'he/him', membership: 'pro-bono', memberSince: '2025-11-20',
    photoTone: 2, phone: '(512) 555-0117', email: 'alindqvist@example.com',
    pinned: 'Hard of hearing. Phone calls do not work. Message or video with captions.'
  },
  {
    id: 'p4', name: 'Priya Raghunathan', dob: '1991-02-11', sex: 'female', pronouns: 'she/her',
    membership: 'standard', memberSince: '2026-06-01', photoTone: 3,
    phone: '(512) 555-0160', email: 'p.ragh@example.com'
  },
  {
    id: 'p5', name: 'Theodore Okonkwo', preferredName: 'Teddy', dob: '1964-08-23',
    sex: 'male', pronouns: 'he/him', membership: 'standard', memberSince: '2025-10-08',
    photoTone: 4, phone: '(512) 555-0133', email: 't.okonkwo@example.com'
  },
  {
    id: 'p6', name: 'Helen Vasquez', dob: '1949-05-30', sex: 'female', pronouns: 'she/her',
    membership: 'pro-bono', memberSince: '2026-03-12', photoTone: 5,
    phone: '(512) 555-0194', email: 'hvasquez@example.com'
  },
  {
    id: 'p7', name: 'Jonah Feldstein', dob: '1979-12-02', sex: 'male', pronouns: 'he/him',
    membership: 'standard', memberSince: '2026-08-19', photoTone: 1,
    phone: '(512) 555-0171', email: 'jfeld@example.com'
  },
  {
    id: 'p8', name: 'Camille Boucher', dob: '1996-09-14', sex: 'female', pronouns: 'she/her',
    membership: 'sliding-scale', memberSince: '2026-09-30', photoTone: 2,
    phone: '(512) 555-0109', email: 'c.boucher@example.com'
  },
];

export const conditions: Condition[] = [
  { id: 'c1', patientId: 'p1', name: 'Prediabetes', code: 'R73.03', status: 'active',
    onset: '2025-09-12', note: 'A1c 6.4 at intake. Target is reversal, not management.',
    provenance: MD },
  { id: 'c2', patientId: 'p1', name: 'Essential hypertension', code: 'I10', status: 'active',
    onset: '2021-04-02', note: 'On one agent. He would like to come off it.',
    provenance: SRC('Austin Family Medicine records', '2025-09-05') },
  { id: 'c3', patientId: 'p1', name: 'Mixed hyperlipidemia', code: 'E78.2', status: 'active',
    onset: '2021-04-02', provenance: SRC('Austin Family Medicine records', '2025-09-05') },
  { id: 'c4', patientId: 'p1', name: 'Obstructive sleep apnea', code: 'G47.33', status: 'active',
    onset: '2026-02-20', note: 'AHI 22 on home study. CPAP since March, good adherence.',
    provenance: SRC('Sleep study, Austin Sleep Center', '2026-02-20') },
  { id: 'c5', patientId: 'p1', name: 'Vitamin D deficiency', code: 'E55.9', status: 'resolved',
    onset: '2025-09-12', resolved: '2026-05-04', provenance: MD },

  { id: 'c6', patientId: 'p2', name: 'Metabolic syndrome', code: 'E88.81', status: 'active',
    onset: '2026-01-29', provenance: MD },
  { id: 'c7', patientId: 'p2', name: 'Insomnia, shift-work related', code: 'G47.26', status: 'active',
    onset: '2026-01-29', note: 'Rotating nights. Not a sleep-hygiene problem; a scheduling one.',
    provenance: MD },
  { id: 'c8', patientId: 'p2', name: 'Iron deficiency without anemia', code: 'E61.1', status: 'active',
    onset: '2026-04-16', provenance: MD },

  { id: 'c9', patientId: 'p3', name: 'Type 2 diabetes mellitus', code: 'E11.9', status: 'active',
    onset: '2014-06-01', provenance: SRC('St. David’s discharge summary', '2025-11-28') },
  { id: 'c10', patientId: 'p3', name: 'Coronary artery disease, post-PCI', code: 'I25.10', status: 'active',
    onset: '2025-11-22', note: 'LAD stent Nov 2025. Cardiology leads; I manage the rest.',
    provenance: SRC('St. David’s discharge summary', '2025-11-28') },
  { id: 'c11', patientId: 'p3', name: 'Chronic kidney disease, stage 3a', code: 'N18.31', status: 'active',
    onset: '2023-02-14', provenance: SRC('Nephrology consult note', '2026-01-10') },
  { id: 'c12', patientId: 'p3', name: 'Hearing loss, bilateral', code: 'H90.3', status: 'active',
    onset: '2019-01-01', provenance: PT('2025-11-20') },
];

export const medications: Medication[] = [
  { id: 'm1', patientId: 'p1', name: 'Lisinopril', dose: '10 mg', sig: 'One tablet by mouth each morning',
    started: '2021-04-10', status: 'active', indication: 'Hypertension', provenance: MD },
  { id: 'm2', patientId: 'p1', name: 'Atorvastatin', dose: '20 mg', sig: 'One tablet by mouth at night',
    started: '2021-04-10', status: 'active', indication: 'Hyperlipidemia', provenance: MD },
  { id: 'm3', patientId: 'p1', name: 'Vitamin D3', dose: '2000 IU', sig: 'One capsule daily',
    started: '2025-09-20', status: 'active', indication: 'Deficiency, now corrected', provenance: MD },
  { id: 'm4', patientId: 'p1', name: 'Metformin', dose: '500 mg', sig: 'One tablet twice daily with food',
    started: '2025-09-20', stopped: '2026-06-18', status: 'stopped', indication: 'Prediabetes',
    changeNote: 'Stopped by agreement. A1c had reached 5.9 on diet and walking alone, and he wanted to see if it held. It has.',
    provenance: MD },

  { id: 'm5', patientId: 'p2', name: 'Ferrous bisglycinate', dose: '25 mg', sig: 'One capsule every other day with vitamin C',
    started: '2026-04-20', status: 'active', indication: 'Iron deficiency',
    changeNote: 'Alternate-day dosing on purpose: better absorbed and she tolerates it.', provenance: MD },
  { id: 'm6', patientId: 'p2', name: 'Melatonin', dose: '0.5 mg', sig: 'Timed to the shift pattern, not nightly',
    started: '2026-02-10', status: 'active', indication: 'Shift-work sleep', provenance: MD },

  { id: 'm7', patientId: 'p3', name: 'Aspirin', dose: '81 mg', sig: 'One tablet daily',
    started: '2025-11-22', status: 'active', indication: 'Post-PCI', provenance: SRC('Discharge summary', '2025-11-28') },
  { id: 'm8', patientId: 'p3', name: 'Clopidogrel', dose: '75 mg', sig: 'One tablet daily',
    started: '2025-11-22', status: 'active', indication: 'Post-PCI, DAPT', provenance: SRC('Discharge summary', '2025-11-28') },
  { id: 'm9', patientId: 'p3', name: 'Atorvastatin', dose: '80 mg', sig: 'One tablet at night',
    started: '2025-11-22', status: 'active', indication: 'Secondary prevention', provenance: SRC('Discharge summary', '2025-11-28') },
  { id: 'm10', patientId: 'p3', name: 'Metformin', dose: '1000 mg', sig: 'One tablet twice daily',
    started: '2014-06-01', status: 'held', indication: 'Type 2 diabetes',
    changeNote: 'Held pending eGFR recheck. Nephrology aware.', provenance: MD },
  { id: 'm11', patientId: 'p3', name: 'Empagliflozin', dose: '10 mg', sig: 'One tablet each morning',
    started: '2026-01-15', status: 'active', indication: 'Diabetes with CKD and CAD',
    changeNote: 'Chosen for the kidney and heart benefit, not the glucose.', provenance: MD },
];

const s = (
  id: string, patientId: string, name: string, code: string, unit: string,
  points: [string, number][], refLow?: number, refHigh?: number,
  target?: { value: number; direction: 'below' | 'above' },
): ResultSeries => ({
  id, patientId, name, code, unit, refLow, refHigh, target,
  points: points.map(([date, value]) => ({
    date, value,
    flag: (refHigh !== undefined && value > refHigh) ? 'high'
      : (refLow !== undefined && value < refLow) ? 'low' : 'normal'
  }))
});

export const resultSeries: ResultSeries[] = [
  s('r1', 'p1', 'Hemoglobin A1c', '4548-4', '%', [
    ['2025-09-12', 6.4], ['2026-01-08', 6.1], ['2026-05-04', 5.9], ['2026-11-06', 5.7],
  ], 4.0, 5.6, { value: 5.6, direction: 'below' }),
  s('r2', 'p1', 'LDL cholesterol', '13457-7', 'mg/dL', [
    ['2025-09-12', 142], ['2026-05-04', 98], ['2026-11-06', 84],
  ], undefined, 100, { value: 100, direction: 'below' }),
  s('r3', 'p1', 'Triglycerides', '2571-8', 'mg/dL', [
    ['2025-09-12', 212], ['2026-05-04', 148], ['2026-11-06', 119],
  ], undefined, 150),
  s('r4', 'p1', 'Systolic blood pressure', '8480-6', 'mmHg', [
    ['2025-09-12', 148], ['2026-01-08', 138], ['2026-05-04', 132], ['2026-09-02', 126], ['2026-11-06', 124],
  ], undefined, 130, { value: 130, direction: 'below' }),
  s('r5', 'p1', 'Weight', '29463-7', 'lb', [
    ['2025-09-12', 227], ['2026-01-08', 219], ['2026-05-04', 209], ['2026-09-02', 201], ['2026-11-06', 198],
  ]),
  s('r6', 'p1', 'ALT', '1742-6', 'U/L', [
    ['2025-09-12', 61], ['2026-05-04', 38], ['2026-11-06', 29],
  ], 7, 56),

  s('r7', 'p2', 'Hemoglobin A1c', '4548-4', '%', [
    ['2026-01-29', 5.8], ['2026-07-14', 5.7],
  ], 4.0, 5.6),
  s('r8', 'p2', 'Ferritin', '2276-4', 'ng/mL', [
    ['2026-04-16', 11], ['2026-10-22', 34],
  ], 15, 200, { value: 50, direction: 'above' }),
  s('r9', 'p2', 'Triglycerides', '2571-8', 'mg/dL', [
    ['2026-01-29', 188], ['2026-07-14', 164],
  ], undefined, 150),

  s('r10', 'p3', 'Hemoglobin A1c', '4548-4', '%', [
    ['2025-11-28', 8.2], ['2026-03-04', 7.6], ['2026-07-21', 7.1], ['2026-11-11', 6.9],
  ], 4.0, 5.6, { value: 7.0, direction: 'below' }),
  s('r11', 'p3', 'eGFR', '98979-8', 'mL/min/1.73m²', [
    ['2026-01-10', 52], ['2026-07-21', 48], ['2026-11-11', 44],
  ], 60, undefined),
  s('r12', 'p3', 'Potassium', '2823-3', 'mmol/L', [
    ['2026-07-21', 4.6], ['2026-11-11', 5.3],
  ], 3.5, 5.1),
  s('r13', 'p3', 'LDL cholesterol', '13457-7', 'mg/dL', [
    ['2025-11-28', 118], ['2026-07-21', 62], ['2026-11-11', 58],
  ], undefined, 70, { value: 70, direction: 'below' }),
];

export const resultReports: ResultReport[] = [
  { id: 'rr1', patientId: 'p3', panel: 'Comprehensive metabolic panel, A1c, lipids',
    resulted: '2026-11-11', worstFlag: 'high', acknowledged: false, seriesIds: ['r10', 'r11', 'r12', 'r13'] },
  { id: 'rr2', patientId: 'p1', panel: 'A1c, lipid panel, hepatic panel',
    resulted: '2026-11-06', worstFlag: 'high', acknowledged: false, seriesIds: ['r1', 'r2', 'r3', 'r6'] },
  { id: 'rr3', patientId: 'p2', panel: 'Iron studies',
    resulted: '2026-10-22', worstFlag: 'low', acknowledged: true,
    acknowledgedBy: 'L. DuBose, MD', acknowledgedAt: '2026-10-23', seriesIds: ['r8'] },
];

export const carePlans: CarePlan[] = [
  {
    id: 'cp1', patientId: 'p1', version: 4, updated: '2026-09-02', signed: true,
    signedBy: 'L. DuBose, MD', provenance: MD,
    summary: 'Reversing prediabetes without medicine, and getting to a place where coming off the blood pressure tablet is a reasonable thing to try.',
    goals: [
      { id: 'g1', title: 'Keep A1c under 5.7', why: 'This is the number that says prediabetes is behind him.',
        domain: 'medical', status: 'on-track', measure: { seriesId: 'r1', label: 'A1c' },
        actions: [
          { id: 'a1', text: 'Repeat A1c every 6 months', owner: 'physician', done: true },
          { id: 'a2', text: 'Keep the evening walk going', owner: 'patient', done: true },
        ] },
      { id: 'g2', title: 'Walk 30 minutes, 5 days a week', why: 'It is the one thing he has kept up for a year. Protect it.',
        domain: 'movement', status: 'on-track',
        actions: [{ id: 'a3', text: 'Log walks in the app', owner: 'patient', done: true }] },
      { id: 'g3', title: 'Sleep: stay on CPAP', why: 'His blood pressure moved when the apnea was treated, not before.',
        domain: 'sleep', status: 'on-track',
        actions: [{ id: 'a4', text: 'Bring the adherence report to each visit', owner: 'patient', done: true }] },
      { id: 'g4', title: 'Systolic under 130 off medicine', why: 'His goal. Worth a careful trial once the weight settles.',
        domain: 'medical', status: 'needs-attention', measure: { seriesId: 'r4', label: 'Systolic BP' },
        actions: [
          { id: 'a5', text: 'Home BP log, twice weekly for 4 weeks', owner: 'patient', done: false },
          { id: 'a6', text: 'Decide on a lisinopril taper at the next visit', owner: 'physician', done: false },
        ] },
    ]
  },
  {
    id: 'cp2', patientId: 'p2', version: 2, updated: '2026-07-14', signed: true,
    signedBy: 'L. DuBose, MD', provenance: MD,
    summary: 'Work with the rota rather than against it. Iron first, then sleep timing, then the metabolic numbers.',
    goals: [
      { id: 'g5', title: 'Ferritin above 50', why: 'The tiredness is not only the shifts.',
        domain: 'medical', status: 'on-track', measure: { seriesId: 'r8', label: 'Ferritin' },
        actions: [{ id: 'a7', text: 'Alternate-day iron, recheck in 12 weeks', owner: 'patient', done: true }] },
      { id: 'g6', title: 'A fixed anchor sleep block on days off', why: 'Full normalisation is not possible on this rota. An anchor is.',
        domain: 'sleep', status: 'needs-attention',
        actions: [{ id: 'a8', text: 'Same 4-hour window every day, shift or not', owner: 'patient', done: false }] },
      { id: 'g7', title: 'Eat a real meal before the night shift', why: 'She was running nights on coffee.',
        domain: 'nutrition', status: 'on-track',
        actions: [{ id: 'a9', text: 'Prep three portions on the first day off', owner: 'patient', done: true }] },
    ]
  },
  {
    id: 'cp3', patientId: 'p3', version: 6, updated: '2026-07-21', signed: true,
    signedBy: 'L. DuBose, MD', provenance: MD,
    summary: 'Protect the kidney, keep cardiology’s plan intact, and make the day-to-day manageable at home.',
    goals: [
      { id: 'g10', title: 'Slow the eGFR decline', why: 'The number that decides how the next ten years go.',
        domain: 'medical', status: 'needs-attention', measure: { seriesId: 'r11', label: 'eGFR' },
        actions: [
          { id: 'a12', text: 'Review every nephrotoxic exposure at each visit', owner: 'physician', done: true },
          { id: 'a13', text: 'Nephrology review booked for December', owner: 'physician', done: false },
        ] },
      { id: 'g11', title: 'A1c under 7 without hypoglycemia', why: 'At 68 with CAD, a low is more dangerous than a 7.2.',
        domain: 'medical', status: 'on-track', measure: { seriesId: 'r10', label: 'A1c' },
        actions: [{ id: 'a14', text: 'Keep empagliflozin, leave metformin held', owner: 'physician', done: true }] },
      { id: 'g12', title: 'Walk to the mailbox and back, daily', why: 'He set this one. It is about staying independent.',
        domain: 'movement', status: 'met',
        actions: [{ id: 'a15', text: 'Build to the corner by spring', owner: 'patient', done: false }] },
    ]
  },
];

export const encounters: Encounter[] = [
  { id: 'e1', patientId: 'p1', date: '2026-11-14', kind: 'follow-up',
    reason: 'Six-month review. Labs back. Wants to discuss stopping lisinopril.',
    status: 'scheduled', duration: 45 },
  { id: 'e2', patientId: 'p1', date: '2026-09-02', kind: 'follow-up', reason: 'Interim review',
    status: 'signed', duration: 40, signedAt: '2026-09-02',
    note: {
      subjective: {
        oneLiner: 'Marcus Reyes is a 54-year-old male with a past medical history of prediabetes, essential hypertension, mixed hyperlipidemia and obstructive sleep apnea, here for follow-up.',
        reason: 'Wanted to talk about coming off the blood pressure tablet.',
        chartReview: 'Last seen 4 May 2026 for an annual physical. Metformin stopped by agreement at that visit. Outstanding from the care plan: home BP log.',
        diagnostics: 'No new results since May.',
        specialists: 'Cardiology (Dr. Raman) not seen since 2024.',
        additional: 'Walking most evenings, 30 to 40 minutes. CPAP every night, finds it easy now. Down another 8 lb. Sleeping well. No chest pain, no headaches, no dizziness.',
      },
      objective: {
        homeMeasures: 'None submitted before this visit.',
        vitals: 'BP 126/78 seated, repeated 124/76. Weight 201 lb, down 8 lb since May. BMI 29.1.',
        examTemplate: 'in-person',
        exam: 'General: well-appearing, no acute distress.\nCardiovascular: regular rate and rhythm, no murmur. No peripheral oedema.\nRespiratory: clear to auscultation bilaterally.',
      },
      assessment: {
        oneLiner: 'Marcus Reyes is a 54-year-old male with prediabetes, hypertension, hyperlipidemia and OSA.',
        overall: 'Prediabetes in remission on lifestyle change alone, off metformin since June. Hypertension well controlled, and the control followed the OSA treatment and the weight loss rather than a dose change. Reasonable to consider a supervised taper once weight has been stable three months.',
      },
      plan: {
        problems: [
          { id: 'pp1', problem: 'Essential hypertension', assessment: 'Controlled, 126/78 today.',
            treatment: 'Hold lisinopril 10 mg unchanged for now.',
            orders: 'Home BP twice weekly for four weeks.',
            followUp: 'Revisit the taper in November once the log is in.' },
          { id: 'pp2', problem: 'Prediabetes', assessment: 'In remission, A1c 5.9 off metformin.',
            treatment: 'Continue diet and the evening walk.', orders: 'Repeat A1c in November.',
            followUp: 'Six months.' },
        ],
        overall: 'Home BP twice weekly for four weeks, bring the log. Repeat A1c and lipids in November. Hold lisinopril unchanged until then. Agreed to revisit the taper at that visit.',
      },
    } },
  { id: 'e3', patientId: 'p1', date: '2026-05-04', kind: 'annual', reason: 'Annual review',
    status: 'signed', duration: 75, signedAt: '2026-05-04',
    note: {
      subjective: {
        oneLiner: 'Marcus Reyes is a 53-year-old male with prediabetes, hypertension and hyperlipidemia, here for an annual physical.',
        reason: 'Annual review.', chartReview: 'Six months of steady progress.',
        diagnostics: 'A1c 5.9, LDL 98, both improved.', specialists: 'None involved.',
        additional: '',
      },
      objective: {
        homeMeasures: 'None submitted.', vitals: 'BP 132/82. Weight 209 lb.',
        examTemplate: 'in-person', exam: 'Full examination unremarkable.',
      },
      assessment: {
        oneLiner: 'Marcus Reyes is a 53-year-old male with prediabetes, hypertension and hyperlipidemia.',
        overall: 'Good trajectory across every measure we are tracking.',
      },
      plan: {
        problems: [{ id: 'pp3', problem: 'Prediabetes', assessment: 'A1c down to 5.9.',
          treatment: 'Stop metformin by agreement.', orders: 'Retest A1c in 6 weeks.',
          followUp: 'Six weeks.' }],
        overall: 'Stop metformin by agreement and retest in 6 weeks. Continue everything else.',
      },
    } },
  { id: 'e4', patientId: 'p3', date: '2026-11-18', kind: 'follow-up',
    reason: 'Potassium 5.3 and eGFR down. Needs review this week.', status: 'scheduled', duration: 30 },
  { id: 'e5', patientId: 'p2', date: '2026-11-14', kind: 'follow-up',
    reason: 'Three-month check. Sleep anchor not holding.', status: 'scheduled', duration: 30 },
  { id: 'e6', patientId: 'p4', date: '2026-11-14', kind: 'initial',
    reason: 'First full visit. Records from previous practice received.', status: 'scheduled', duration: 90 },
];

export const prevention: PreventionItem[] = [
  { id: 'pv1', patientId: 'p1', name: 'Colonoscopy', status: 'due', dueBy: '2027-03-18',
    note: 'Turns 55 in March. First screening then.' },
  { id: 'pv2', patientId: 'p1', name: 'Lipid panel', status: 'current', lastDone: '2026-11-06' },
  { id: 'pv3', patientId: 'p1', name: 'Influenza vaccine', status: 'overdue', dueBy: '2026-10-31' },
  { id: 'pv4', patientId: 'p1', name: 'Diabetes screening', status: 'current', lastDone: '2026-11-06' },
  { id: 'pv5', patientId: 'p1', name: 'Tdap booster', status: 'current', lastDone: '2019-06-11' },
  { id: 'pv6', patientId: 'p3', name: 'Diabetic eye exam', status: 'overdue', dueBy: '2026-06-01' },
  { id: 'pv7', patientId: 'p3', name: 'Urine albumin-to-creatinine', status: 'due', dueBy: '2026-12-01' },
  { id: 'pv8', patientId: 'p3', name: 'Pneumococcal vaccine', status: 'current', lastDone: '2024-10-02' },
  { id: 'pv9', patientId: 'p3', name: 'Foot exam', status: 'current', lastDone: '2026-07-21' },
  { id: 'pv10', patientId: 'p2', name: 'Cervical cancer screening', status: 'current', lastDone: '2024-05-20' },
  { id: 'pv11', patientId: 'p2', name: 'Influenza vaccine', status: 'current', lastDone: '2026-10-09' },
];

export const patientEntries: PatientEntry[] = [
  { id: 'pe1', patientId: 'p1', date: '2026-11-10', kind: 'journal', label: 'Walking',
    body: 'Kept the walk up all week except Thursday, it poured. Did 40 minutes Saturday with my daughter. Feeling good.',
    provenance: PT('2026-11-10') },
  { id: 'pe2', patientId: 'p1', date: '2026-11-09', kind: 'measurement', label: 'Home blood pressure',
    body: '122/78 Sunday morning, 126/80 Wednesday evening. Both sitting, after five minutes.',
    provenance: PT('2026-11-09') },
  { id: 'pe3', patientId: 'p1', date: '2026-10-28', kind: 'journal', label: 'Question about the tablet',
    body: 'Still thinking about the blood pressure tablet. Not in a rush but I would like to try without it if you think it is safe.',
    provenance: PT('2026-10-28') },
  { id: 'pe4', patientId: 'p2', date: '2026-11-12', kind: 'journal', label: 'Sleep',
    body: 'The anchor window is not working. On night three I am awake at 2pm no matter what. Got about four hours total across Tuesday.',
    provenance: PT('2026-11-12') },
  { id: 'pe5', patientId: 'p3', date: '2026-11-12', kind: 'journal', label: 'How I am doing',
    body: 'Made it to the mailbox every day this week. Legs felt heavy Thursday and Friday. Shoes a bit tight.',
    provenance: PT('2026-11-12') },
];

export const aiDrafts: AiDraft[] = [
  {
    id: 'ai1', patientId: 'p1', kind: 'interval-summary', generated: '2026-11-14', accepted: false,
    title: 'Since the last visit, 2 September',
    body: `Four things changed.

**A1c is 5.7, down from 5.9 in May.** That is the fourth consecutive fall and the first value inside the normal range. He has been off metformin since June.

**LDL 84, down from 98.** Triglycerides 119, normal for the first time. ALT 29, normal, from 61 at intake.

**Home blood pressures are running 122 to 126 systolic.** He logged two readings rather than the eight the plan asked for. Clinic systolic has been under 130 at the last three visits.

**He has raised stopping lisinopril twice**, in the journal on 28 October and at the September visit. The plan's action "decide on a lisinopril taper at the next visit" is still open.

One thing the plan does not cover: influenza vaccine is overdue since 31 October.`,
    citations: ['Lab report, 6 Nov 2026', 'Patient journal, 28 Oct and 9 Nov', 'Encounter note, 2 Sep 2026', 'Care plan v4, goal 4', 'Prevention schedule']
  },
  {
    id: 'ai2', patientId: 'p3', kind: 'interval-summary', generated: '2026-11-14', accepted: false,
    title: 'Since the last visit, 21 July',
    body: `**Potassium is 5.3, up from 4.6 in July.** Above the reference range. He is on empagliflozin, and metformin is held.

**eGFR is 44, down from 48 in July and 52 in January.** That is a fall of 8 over ten months.

**A1c is 6.9**, below the agreed target of 7.0 for the first time.

**He reported heavy legs and tight shoes on 12 November.** Nothing in the record documents an examination for edema since July.

The care plan's December nephrology review is not yet booked.`,
    citations: ['Lab report, 11 Nov 2026', 'Patient journal, 12 Nov 2026', 'Care plan v6, goals 10 and 11', 'Medication list']
  },
];

export const tasks: Task[] = [
  { id: 't1', patientId: 'p3', kind: 'result', text: 'Potassium 5.3 and eGFR 44, both worse', due: '2026-11-14', urgent: true, done: false },
  { id: 't2', patientId: 'p1', kind: 'result', text: 'A1c, lipids and hepatic panel back', due: '2026-11-14', urgent: false, done: false },
  { id: 't3', patientId: 'p3', kind: 'message', text: 'Reports heavy legs and tight shoes', due: '2026-11-13', urgent: true, done: false },
  { id: 't4', patientId: 'p2', kind: 'message', text: 'Sleep anchor not holding on night three', due: '2026-11-13', urgent: false, done: false },
  { id: 't5', patientId: 'p1', kind: 'prevention', text: 'Influenza vaccine overdue', due: '2026-10-31', urgent: false, done: false },
  { id: 't6', patientId: 'p3', kind: 'prevention', text: 'Diabetic eye exam overdue since June', due: '2026-06-01', urgent: false, done: false },
  { id: 't7', patientId: 'p5', kind: 'refill', text: 'Refill request: semaglutide', due: '2026-11-14', urgent: false, done: false },
  { id: 't8', patientId: 'p3', kind: 'follow-up', text: 'Book nephrology review for December', due: '2026-11-20', urgent: false, done: false },
];

export const specialists: Specialist[] = [
  { id: 'sp1', patientId: 'p1', name: 'Dr. Priya Raman', specialty: 'Cardiology',
    practice: 'Austin Heart', phone: '(512) 555-0310', lastSeen: '2024-08-14',
    findings: 'Stress echo normal. No inducible ischaemia.',
    recommendations: 'No cardiology follow-up needed unless symptoms change. Continue risk-factor work in primary care.',
    outstanding: 'None.' },
  { id: 'sp2', patientId: 'p3', name: 'Dr. Samuel Osei', specialty: 'Cardiology',
    practice: 'St. David\u2019s Cardiology', phone: '(512) 555-0322', lastSeen: '2026-09-30',
    findings: 'LAD stent patent on review. Ejection fraction 50 percent.',
    recommendations: 'Continue dual antiplatelet therapy to 12 months post-PCI, then aspirin alone. High-intensity statin indefinitely.',
    outstanding: 'Decision on stopping clopidogrel due November 2026.' },
  { id: 'sp3', patientId: 'p3', name: 'Dr. Lena Brandt', specialty: 'Nephrology',
    practice: 'Hill Country Renal', phone: '(512) 555-0344', lastSeen: '2026-01-10',
    findings: 'CKD stage 3a, likely diabetic and hypertensive. No proteinuria at that time.',
    recommendations: 'Avoid NSAIDs and contrast where possible. Recheck eGFR and potassium every 6 months.',
    outstanding: 'December review not yet booked.' },
  { id: 'sp4', patientId: 'p5', name: 'Dr. Grace Yun', specialty: 'Endocrinology',
    practice: 'Capital Endocrine', phone: '(512) 555-0366', lastSeen: '2026-06-02',
    findings: 'Type 2 diabetes with suboptimal control.',
    recommendations: 'Titrate semaglutide as tolerated.', outstanding: 'None.' },
];

export const preVisits: PreVisit[] = [
  { id: 'pv1', patientId: 'p1', encounterId: 'e1', submitted: '2026-11-12',
    concerns: [
      { id: 'pc1', text: 'Coming off the blood pressure tablet', addressed: false },
      { id: 'pc2', text: 'Knee soreness after walking', addressed: false },
      { id: 'pc3', text: 'Whether I still need the statin', addressed: false },
    ],
    narrative: 'Mainly I want to talk about the blood pressure tablet. My readings at home have been good for months and I would like to try without it, carefully. The knee thing is probably nothing, it only aches after the longer walks and settles overnight. And I have read things about statins and would like to know what you think, I am not planning to stop it on my own.' },
  { id: 'pv2', patientId: 'p3', encounterId: 'e4', submitted: '2026-11-13',
    concerns: [
      { id: 'pc4', text: 'Legs feel heavy', addressed: false },
      { id: 'pc5', text: 'Shoes are tight', addressed: false },
    ],
    narrative: 'My legs have felt heavy since about Thursday and my shoes are tighter than usual. No chest pain. I am still getting to the mailbox every day but it is harder than it was.' },
];

export const orders: Order[] = [];
