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
/**
 * The same four levels, for somebody this practice has not seen.
 *
 * A new patient is a different code family at the same medical
 * decision making, and billing an established code for a first visit
 * is the most common coding error in a practice that has only just
 * started having first visits.
 */
const NEW_BY_RANK = ['99202', '99203', '99204', '99205'] as const;
type EmCode = typeof CODE_BY_RANK[number] | typeof NEW_BY_RANK[number];

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
export function emLevel(em: EmRecord, newPatient = false): EmComputation {
  const ranks = [em.problemsLevel, em.dataLevel, em.riskLevel]
    .map((l) => RANK[l]).sort((a, b) => b - a);
  const two = ranks[1];
  const mdmLevel = (Object.keys(RANK) as MdmLevel[]).find((k) => RANK[k] === two)!;
  const byMdm = (newPatient ? NEW_BY_RANK : CODE_BY_RANK)[two];
  const m = em.totalMinutes;

  /*
   * The new-patient time table is CPT's in all four rows, so the
   * chart says nothing about it rather than guessing. For an
   * established patient CMS publishes the two ends and not the
   * middle, which is the gap EM_TIME_FLOOR documents.
   */
  if (newPatient) {
    return {
      mdmLevel, byMdm, timeUnknown: true, agree: false,
      byTime: `${m} minutes recorded. The CPT time table for 99202 to 99205 decides.`,
    };
  }
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
/* what it costs                                                       */
/* ------------------------------------------------------------------ */

/**
 * The membership fee, in dollars.
 *
 * The one price this practice has decided on (D-039, 2026-11-12).
 * REFRESH-AT-RUNWAY.
 */
export const MONTHLY_FEE = 99;
export const YEARLY_FEE = MONTHLY_FEE * 12;

/**
 * What one visit costs when somebody pays for visits.
 *
 * ASSUMPTION, owned and not sourced. Nobody has set this price.
 *
 * It has to be its own number rather than the membership divided by
 * the visits, which is what it was until this was written. Divide
 * the membership and the two ways of paying cost the same by
 * construction, every saving comes out as zero, and the comparison
 * is arithmetic about itself. The saving on the page is this number
 * times the visits, less the membership, so if this number is wrong
 * the saving is wrong by the visits times the error.
 *
 * The repo rule is that unset inputs stay UNSET, and in the charter's
 * terms this one is UNSET: D-039 decided one price, $99 a month, and
 * a per-visit price is not a thing anybody has decided. It carries a
 * number here only because a prototype cannot render a comparison
 * against a blank, and the number is a placeholder standing in for a
 * decision, not the decision.
 *
 * So: do not quote it to a patient, do not put it in a print piece,
 * and do not let it reach anything outside this prototype until it
 * has been decided and logged.
 */
export const VISIT_FEE = 350;

export interface QuotedVisit {
  date: string;
  /** What the visit is for, in the words it was booked in. */
  why: string;
  price: number;
}

export interface Quote {
  /** Nothing is charged for the first assessment. */
  proBonoFirst: boolean;
  visits: QuotedVisit[];
  total: number;
  /** The per-visit price every line was charged at. */
  each: number;
}

export interface Comparison {
  visits: number;
  /** The same visits, paid for one at a time. */
  payPerVisit: number;
  membership: number;
  /** Positive when the membership is cheaper. */
  saving: number;
  /** How many visits it takes before the membership is the cheaper one. */
  breakEven: number;
}

/**
 * The year, paid two ways.
 *
 * Paying per visit is the baseline, because it is what the quote
 * above already is. The membership is the alternative, and the only
 * honest way to compare them is to count the visits actually planned
 * and price both.
 *
 * On a light year the membership loses, and the note says so. That
 * is the point of printing the break-even: it tells the patient how
 * many visits it takes to turn, and one unplanned illness is usually
 * what turns it. The comparison also leaves out what only the
 * membership covers, the acute visit nobody booked and every message
 * in between, so the gap it shows is the conservative one.
 */
export function compare(visitCount: number, visitFee = VISIT_FEE): Comparison {
  const payPerVisit = Math.round(visitCount * visitFee * 100) / 100;
  return {
    visits: visitCount,
    payPerVisit,
    membership: YEARLY_FEE,
    saving: Math.round((payPerVisit - YEARLY_FEE) * 100) / 100,
    breakEven: Math.ceil(YEARLY_FEE / visitFee),
  };
}

/**
 * The twelve months behind a visit, counted in charged visits.
 *
 * A quote says what a year was expected to hold. This says what it
 * held, which is a different number whenever anything went wrong,
 * and the difference is the only honest basis for telling somebody
 * what a membership would have saved them.
 *
 * The patient's first ever visit is left out, because a first
 * assessment is free and a free visit is not a thing anybody saved
 * money on. Everything else signed inside the window counts,
 * including the visit being written, because it is being charged for.
 */
export function yearBehind(
  encounters: { id: string; date: string; status: string }[], upTo: string,
): { visits: number; since: string } | undefined {
  const signed = encounters
    .filter((e) => e.status === 'signed' && e.date <= upTo)
    .sort((a, b) => a.date.localeCompare(b.date));
  if (signed.length === 0) return undefined;
  const first = signed[0];
  /*
   * A year back from the visit, by the calendar rather than by 365
   * days, so an annual on the anniversary of the first visit counts
   * the first visit as inside the year it closes.
   */
  const d = new Date(`${upTo}T00:00:00Z`);
  d.setUTCFullYear(d.getUTCFullYear() - 1);
  const from = d.toISOString().slice(0, 10);

  const charged = signed.filter((e) => e.id !== first.id && e.date >= from);
  if (charged.length === 0) return undefined;
  return {
    visits: charged.length,
    // Where the free first visit is inside the window it is still
    // where the year started, and saying so is more use than the
    // date of the first visit that happened to be charged for.
    since: first.date >= from ? first.date : charged[0].date,
  };
}

/**
 * The year ahead, priced at the visit that plans it.
 *
 * A patient paying cash wants to know the year, not today. So the
 * visits booked out of this encounter are the quote: the same number
 * of lines, in the same order, with a price on each and a total at
 * the foot. Quoted once and fixed, and quoted again at the next
 * annual when the next year is planned.
 *
 * Every line is priced at VISIT_FEE, the same whoever is sitting in
 * the chair and whatever the visit turns out to hold. A practice
 * paid in cash can say what a visit costs before it happens, which
 * is most of why anybody would choose to be paid this way.
 */
export function quoteYear(
  booked: { date: string; why: string }[], firstVisit: boolean,
): Quote {
  const visits = booked.filter((v) => v.date);
  return {
    proBonoFirst: firstVisit,
    each: VISIT_FEE,
    visits: visits.map((v) => ({ ...v, price: VISIT_FEE })),
    total: Math.round(VISIT_FEE * visits.length * 100) / 100,
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
