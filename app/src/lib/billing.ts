/**
 * The arithmetic behind documentation, and nothing more.
 *
 * This file computes what the recorded elements imply. It does not
 * pick a code. Both of those sentences matter: a chart that quietly
 * assigns 99214 has made a billing decision on the physician's
 * licence, and a chart that computes nothing leaves them doing the
 * two-of-three comparison in their head at the end of a clinic.
 *
 * Sources and the dates they were read are in
 * docs/systems/documentation-and-billing.md. Everything here is the
 * prototype's reading of secondary guidance, not legal advice, and the
 * thresholds move. NEEDS-COUNSEL and NEEDS-CPA.
 */
import type { CareLogEntry, CareProgram, EmRecord, MdmLevel } from '../domain/types';

export const PROGRAM_LABEL: Record<CareProgram, string> = {
  ccm: 'Chronic care management',
  bhi: 'Behavioural health integration',
  apcm: 'Advanced primary care management',
  preventive: 'Preventative services',
  lifestyle: 'Lifestyle medicine',
};

const RANK: Record<MdmLevel, number> = {
  straightforward: 0, low: 1, moderate: 2, high: 3,
};
const CODE_BY_RANK = ['99212', '99213', '99214', '99215'] as const;
type EmCode = typeof CODE_BY_RANK[number];

/**
 * Minutes at which each established-patient code is reachable.
 *
 * Two of these four are UNSET and that is not an oversight. CMS
 * publishes 99215 at 40 to 54 minutes (Claims Processing Manual
 * Ch. 12 section 30.6.15.2) and quotes the 99212 descriptor as ten
 * minutes met or exceeded (91 FR 71118). It does not publish the
 * 99213 and 99214 ranges, because those are the American Medical
 * Association's property and CMS adopts the CPT guidelines by
 * reference rather than reprinting them.
 *
 * So the chart cannot tell you that 32 minutes is a 99214. Writing a
 * number here that nobody checked would be the easiest thing in this
 * file to do and the worst, because it would be invisible in the
 * output and wrong on every claim. The practice needs a CPT licence
 * before this table is complete, and until it has one the chart says
 * what it knows and stops.
 */
export const EM_TIME_FLOOR: { code: EmCode; floor: number | null; source: string }[] = [
  { code: '99215', floor: 40, source: 'Claims Processing Manual Ch. 12 s30.6.15.2' },
  { code: '99214', floor: null, source: 'UNSET. AMA CPT, not published by CMS.' },
  { code: '99213', floor: null, source: 'UNSET. AMA CPT, not published by CMS.' },
  { code: '99212', floor: 10, source: '91 FR 71118, quoting the descriptor' },
];

export interface EmComputation {
  /** The level two of the three elements reach. */
  mdmLevel: MdmLevel;
  byMdm: EmCode;
  /** What the minutes support, where that is known. */
  byTime: string;
  /** True when the minutes land in the gap the CPT table would fill. */
  timeUnknown: boolean;
  /** Whether the two routes agree, where both are known. */
  agree: boolean;
}

/**
 * Two of three elements must meet or exceed the level.
 *
 * So the level is the second-highest of the three, which is the
 * compact way of saying the same thing. The grid that assigns each
 * element its level is CPT content, and this file computes over the
 * physician's own reading of it rather than reproducing it.
 */
export function emLevel(em: EmRecord): EmComputation {
  const ranks = [em.problemsLevel, em.dataLevel, em.riskLevel]
    .map((l) => RANK[l]).sort((a, b) => b - a);
  const two = ranks[1];
  const mdmLevel = (Object.keys(RANK) as MdmLevel[]).find((k) => RANK[k] === two)!;
  const byMdm = CODE_BY_RANK[two];
  const m = em.totalMinutes;

  if (m >= 40) {
    return { mdmLevel, byMdm, byTime: '99215', timeUnknown: false, agree: byMdm === '99215' };
  }
  if (m < 10) {
    return { mdmLevel, byMdm, byTime: 'below 99212', timeUnknown: false, agree: false };
  }
  return {
    mdmLevel, byMdm, timeUnknown: true, agree: false,
    byTime: 'at least 99212, and above that the CPT time table decides',
  };
}

/* ------------------------------------------------------------------ */
/* the visit complexity add-on                                         */
/* ------------------------------------------------------------------ */

export interface AddOnInput {
  /** Whether this practice is the continuing focal point for the patient. */
  focalPoint: boolean;
  /** A problem-oriented office visit was billed on the day. */
  emBilled: boolean;
  /** A wellness visit, welcome visit or other Part B preventive service on the day. */
  preventiveSameDay: boolean;
}

export interface AddOnResult {
  code: 'G2211';
  reportable: boolean;
  reason: string;
  /** What has to be on the claim for it to pay. */
  claimNotes: string[];
}

/**
 * Whether the visit complexity add-on may be reported.
 *
 * The rule people get wrong is the modifier. The add-on is not paid
 * when the base visit carries modifier 25, except where the same-day
 * service is a wellness visit, a welcome visit, a vaccine
 * administration or another Part B preventive service. That exception
 * is exactly the day a prevention-first practice runs, so the
 * combination is worth getting right rather than avoiding.
 *
 * Sources: 89 FR 97858 (the permission); 91 FR 71103 (the cleanest
 * current statement); Claims Processing Manual Ch. 12 s30.6.19.
 */
export function visitAddOn(i: AddOnInput): AddOnResult {
  const claimNotes: string[] = [];
  if (!i.emBilled) {
    return {
      code: 'G2211', reportable: false, claimNotes,
      reason: 'The add-on cannot be reported on its own. It needs an office or home visit on the same claim.',
    };
  }
  if (!i.focalPoint) {
    return {
      code: 'G2211', reportable: false, claimNotes,
      reason: 'The add-on describes a continuing relationship. Discrete, routine or time-limited care does not qualify, '
        + 'however complex the visit was.',
    };
  }
  if (i.preventiveSameDay) {
    claimNotes.push('Modifier 25 goes on the office visit, not on the add-on.');
    claimNotes.push('The wellness visit is free to the patient. The office visit and the add-on are not: '
      + 'ordinary deductible and coinsurance apply to both.');
    return {
      code: 'G2211', reportable: true, claimNotes,
      reason: 'Reportable. A preventive service on the same day is the stated exception to the modifier 25 '
        + 'restriction, and a wellness visit is on the eligible list.',
    };
  }
  claimNotes.push('Ordinary deductible and coinsurance apply.');
  return {
    code: 'G2211', reportable: true, claimNotes,
    reason: 'Reportable. No specific diagnosis is required and no extra documentation is specified; the base visit '
      + 'has to be medically necessary and documented as such.',
  };
}

/** What replaces the add-on, and when. */
export const ADD_ON_SUNSET =
  'From 1 January 2027 the add-on code is replaced by modifiers B1 and B2 on the visit itself, billed in the same '
  + 'circumstances. Claim lines need room for five or more modifiers, with modifier 99 as the fourth and the rest in '
  + 'the narrative field. 91 FR 71097.';

/* ------------------------------------------------------------------ */
/* telehealth                                                          */
/* ------------------------------------------------------------------ */

export interface TelehealthInput {
  /** Where the patient was. */
  atHome: boolean;
  audioOnly: boolean;
  /** Recorded when the patient could not or would not use video. */
  videoDeclined?: boolean;
}

export interface TelehealthResult {
  placeOfService: '02' | '10';
  modifiers: string[];
  problems: string[];
  notes: string[];
}

/**
 * What a visit delivered remotely needs on the claim.
 *
 * Audio-only is allowed, and it is allowed on conditions that have to
 * be true and recorded: the patient at home, this practice able to do
 * video, and the patient unable or unwilling. Modifier 93 is how the
 * claim states that those conditions were met, so a missing modifier
 * is not a clerical slip, it is an unmade attestation.
 *
 * Sources: 42 CFR 410.78(a)(3); CMS telehealth FAQ, 8 October 2026;
 * CAA 2026 section 6209, quoted at 91 FR 71024.
 */
export function telehealthClaim(i: TelehealthInput): TelehealthResult {
  const problems: string[] = [];
  const modifiers: string[] = [];
  const notes: string[] = [];

  if (i.audioOnly) {
    modifiers.push('93');
    if (!i.atHome) problems.push('Audio-only is allowed only for a patient in their home.');
    if (!i.videoDeclined) {
      problems.push('Audio-only needs it recorded that the patient could not use video or did not consent to it.');
    }
    notes.push('From 1 January 2028 audio-only narrows to behavioural health.');
  }
  notes.push('Geographic and originating-site limits are lifted through 31 December 2027.');
  notes.push('From 1 January 2027 modifiers BB and BC become mandatory. Guidance was not published as of 2026-11-15.');

  return { placeOfService: i.atHome ? '10' : '02', modifiers, problems, notes };
}

export interface CareTime {
  countable: number;
  excluded: number;
  thresholds: { label: string; needs: number; met: boolean }[];
}

/**
 * Countable minutes in a calendar month, by programme.
 *
 * Only entries marked countable are added. The excluded total is
 * shown beside it rather than dropped, because the interesting
 * question when a month falls short is what was left out and why.
 */
export function monthlyCareTime(log: CareLogEntry[], program: CareProgram): CareTime {
  const mine = log.filter((e) => e.program === program);
  const countable = mine.filter((e) => e.countable).reduce((a, e) => a + e.minutes, 0);
  const excluded = mine.filter((e) => !e.countable).reduce((a, e) => a + e.minutes, 0);

  const physician = mine
    .filter((e) => e.countable && e.role === 'physician')
    .reduce((a, e) => a + e.minutes, 0);

  const t: CareTime['thresholds'] = [];
  const add = (label: string, need: number, have: number) =>
    t.push({ label, needs: Math.max(0, need - have), met: have >= need });

  // 99491 is the only chronic-care code a practice with no clinical
  // staff can reach, and it counts the physician's own minutes only.
  if (program === 'ccm') add('30 min physician', 30, physician);
  if (program === 'bhi') add('20 min', 20, countable);
  // Advanced primary care management is not a timed service: it turns
  // on service elements being available, not minutes counted.
  return { countable, excluded, thresholds: t };
}
