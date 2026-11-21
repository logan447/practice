/**
 * The one patient in the demo who is on Medicare.
 *
 * Arthur is here because every billing question in this prototype is
 * a Medicare question, and the rest of the panel is too young for any
 * of it to apply. He is also pro bono, which is the combination that
 * makes the practice model tense rather than tidy: the membership is
 * free to him, Part B cost sharing is not, and the two facts sit on
 * the same chart.
 *
 * Four managed chronic problems, hard of hearing, seen regularly. He
 * is the patient chronic care management was written for, and the
 * month below is what a real one looks like: short pieces of work
 * spread across the month, most of them not face to face.
 *
 * Fictional. Sources for the rules these records are shaped by are in
 * docs/systems/billing-architecture.md.
 */
import type { CareLogEntry, ServiceConsent, InstrumentScore } from '../domain/types';

const P = 'p3';

/*
 * No care-management consents.
 *
 * They were real conversations and they were consents to a monthly
 * Medicare programme this practice no longer models. What is left is
 * the visit, which needs no separate consent.
 */
export const arthurConsents: ServiceConsent[] = [];

/**
 * November, as it actually happened.
 *
 * Thirty-four countable minutes across five pieces of work, none of
 * them a visit. The sixth entry is the one worth looking at: minutes
 * a model spent drafting are not the physician's time and cannot
 * count toward a threshold that exists to measure the physician's
 * time. A programme that counted them would build an overpayment a
 * month at a time, and nobody would see it happen.
 */
export const arthurCareLog: CareLogEntry[] = [
  {
    id: 'acl1', patientId: P, program: 'ccm', date: '2026-11-02', minutes: 8,
    by: 'L. DuBose, MD', role: 'physician', countable: true,
    problems: ['c11'],
    activity: 'Reviewed the October metabolic panel. Creatinine up a little, eGFR 51. '
      + 'Checked it against the last four and wrote to him about fluids.',
  },
  {
    id: 'acl2', patientId: P, program: 'ccm', date: '2026-11-05', minutes: 11,
    by: 'L. DuBose, MD', role: 'physician', countable: true,
    problems: ['c10', 'c11'],
    activity: 'Call with cardiology about whether the empagliflozin stays at this eGFR. It does. '
      + 'Captioned video call with him afterwards to say so.',
  },
  {
    id: 'acl3', patientId: P, program: 'ccm', date: '2026-11-09', minutes: 7,
    by: 'L. DuBose, MD', role: 'physician', countable: true,
    problems: ['c12'],
    activity: 'Audiology referral. Found one that does the fitting in the same building and messaged him the details.',
  },
  {
    id: 'acl4', patientId: P, program: 'ccm', date: '2026-11-12', minutes: 8,
    by: 'L. DuBose, MD', role: 'physician', countable: true,
    problems: ['c9'],
    activity: 'Went through the glucose log he sent. Fasting numbers steady, two lows after the Saturday walk. '
      + 'Wrote back about moving the morning dose.',
  },
  {
    id: 'acl5', patientId: P, program: 'ccm', date: '2026-11-13', minutes: 6,
    by: 'Assistant (automated)', role: 'automated', countable: false,
    excludedBecause: 'Time spent by software is not the physician’s time and cannot count toward a threshold '
      + 'that exists to measure the physician’s time.',
    activity: 'Drafted the summary of the month from the records above.',
  },
];

export const arthurScores: InstrumentScore[] = [
  {
    id: 'as1', patientId: P, instrument: 'phq-2', date: '2026-08-14',
    score: 1, by: 'patient',
    note: 'Negative. Asked again because of the hearing loss and how much it has cut him off.',
  },
];
