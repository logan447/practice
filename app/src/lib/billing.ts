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
import { benchmarkAll, preventiveCode } from './fees';

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
 * The flat membership fee D-039 decided, in dollars.
 *
 * Kept because it is what the site, the brochure and the charter all
 * still say, and because a personalised price has to be comparable
 * against the one that was actually decided. REFRESH-AT-RUNWAY.
 */
export const MONTHLY_FEE = 99;
export const YEARLY_FEE = MONTHLY_FEE * 12;

/* ------------------------------------------------------------------ */
/* what a visit is worth                                               */
/* ------------------------------------------------------------------ */

export type VisitKind = 'initial' | 'annual' | 'follow-up' | 'acute' | 'brief';

export interface VisitType {
  kind: VisitKind;
  label: string;
  minutes: number;
  /** The codes this visit's work supports, which is what prices it. */
  codes: string[];
  /** Why the work supports those codes, in one line a reviewer can argue with. */
  basis: string;
  /** Nothing is charged, whatever the work was worth. */
  free?: boolean;
  /**
   * The first code is a preventive one and moves with the patient's
   * age, so the listed value is only the default band.
   */
  ageBanded?: boolean;
}

/**
 * The five kinds of visit this practice holds, and what each is worth.
 *
 * The code is not decoration. It is the whole pricing argument: a
 * cash practice that picks prices out of the air cannot answer "why
 * that number" twice in a row, and a practice that benchmarks every
 * visit to the code its own documentation supports can answer it
 * every time, including to itself when it is tempted to charge more.
 *
 * Levels are assigned on what the worked cases actually contain,
 * not on what would be convenient:
 *
 * - The initial is ninety minutes, a new patient, four diagnoses
 *   made on the day and four drugs started or stopped. That is high
 *   complexity by any reading, plus the whole of a preventive
 *   assessment, so it carries both codes. It is also free.
 * - A planned review runs forty-five minutes across five or more
 *   chronic problems with drug changes and labs at every one. That
 *   is high complexity on medical decision making, not moderate.
 * - An acute visit is one new problem with a differential that has
 *   something dangerous in it and a prescription written. Moderate.
 * - A brief visit is one stable problem and no change. Low.
 */
export const VISIT_TYPES: Record<VisitKind, VisitType> = {
  initial: {
    kind: 'initial', label: 'First assessment', minutes: 90, free: true,
    codes: ['99386', '99205'],
    ageBanded: true,
    basis: 'A comprehensive preventive visit for an adult of 40 to 64, plus a '
      + 'separately identifiable problem visit at high complexity on the same day: '
      + 'four diagnoses made and four drugs started or stopped.',
  },
  annual: {
    kind: 'annual', label: 'Annual visit', minutes: 60,
    codes: ['99396', '99215'],
    ageBanded: true,
    basis: 'The same pairing a year on: the preventive visit for an established '
      + 'patient, plus the problem work, which at an annual is every problem '
      + 'reviewed against its target with drug decisions on several.',
  },
  'follow-up': {
    kind: 'follow-up', label: 'Planned review', minutes: 45,
    codes: ['99215'],
    basis: 'Established patient, forty-five minutes, several chronic problems '
      + 'reviewed with laboratory results and drug changes at the same visit. One '
      + 'code, not two: a visit coded on time has spent those minutes once.',
  },
  acute: {
    kind: 'acute', label: 'Acute visit', minutes: 25,
    codes: ['99214'],
    basis: 'Established patient, one new problem, a differential that has to exclude '
      + 'something dangerous, and prescription drug management.',
  },
  brief: {
    kind: 'brief', label: 'Short visit', minutes: 20,
    codes: ['99213'],
    basis: 'Established patient, one stable problem, no change to treatment.',
  },
};

/* ------------------------------------------------------------------ */
/* what the same work is worth to a payer                              */
/* ------------------------------------------------------------------ */

export interface PayerRoute {
  id: string;
  label: string;
  /** What this payer pays, as a multiple of the CMS benchmark. */
  ratio?: number;
  /** Where the ratio came from, or why there is none. */
  from: string;
  /** What the patient pays at the desk, in words rather than dollars. */
  patientPays: string;
}

/**
 * The same visit, through four doors, against one baseline.
 *
 * CMS fee for service is 1.00 by definition: it is the benchmark
 * every price in this file is derived from, so it is the thing the
 * others are measured against rather than one of the things being
 * measured.
 *
 * NEEDS-COUNSEL, and more than most things here. This practice does
 * not currently bill anybody, D-039 guardrail 4b forbids any print
 * piece from stating how Medicare or Medicaid work with a
 * membership, and none of this may be shown to a patient until that
 * is settled. It is modelled so the owner can see the shape of the
 * decision, not so it can be handed over.
 */
export const PAYER_ROUTES: PayerRoute[] = [
  {
    id: 'cms', label: 'Medicare fee for service', ratio: 1.0,
    from: 'The benchmark itself, by definition. Note that Original Medicare does '
      + 'not pay the preventive codes at all: it buys that work as G0438 or G0439 '
      + 'instead, so the initial and annual would be coded differently for somebody '
      + 'on Medicare.',
    patientPays: 'Twenty per cent of the allowed amount after the yearly deductible, '
      + 'with the wellness visit itself at no cost.',
  },
  {
    id: 'medicaid', label: 'Medicaid', ratio: 0.74,
    from: 'Kaiser Family Foundation Medicaid-to-Medicare fee index, 2024: Virginia '
      + 'primary care 0.74. The national figure is about 0.71, and the index covers '
      + 'fee-for-service Medicaid only. REFRESH-AT-RUNWAY.',
    patientPays: 'Nothing, or a nominal amount set by the state.',
  },
  {
    id: 'advantage', label: 'Medicare Advantage',
    from: 'UNSET. Contracts are commonly written at or near the Medicare rate, but '
      + 'no source was found that puts a number on it and it is set plan by plan. '
      + 'Nothing here should be quoted until a contract is in hand.',
    patientPays: 'A fixed copay per visit, set by the plan.',
  },
  {
    id: 'commercial', label: 'Commercial', ratio: 1.84,
    from: 'RAND hospital price transparency study, round 5, on 2022 claims: '
      + 'associated professional services averaged 184 per cent of Medicare. BUT '
      + 'that sample is professional fees attached to hospitals, which run well '
      + 'above what an independent primary care practice negotiates. Treat it as the '
      + 'top of the range, not the middle. REFRESH-AT-RUNWAY.',
    patientPays: 'A copay, or the whole allowed amount until the deductible is met, '
      + 'depending on the plan.',
  },
];

/**
 * What a payer would allow for a visit, where a ratio is known.
 *
 * Undefined rather than zero where it is not, so a caller has to
 * decide what to print about a payer nobody could price.
 */
export function payerAllows(
  kind: VisitKind, route: PayerRoute, age?: number,
): number | undefined {
  const base = visitWorth(kind, age);
  if (base === undefined || route.ratio === undefined) return undefined;
  return Math.round(base * route.ratio * 100) / 100;
}

/* ------------------------------------------------------------------ */
/* the sliding scale                                                   */
/* ------------------------------------------------------------------ */

/**
 * The 2026 federal poverty guideline, 48 states and DC.
 *
 * $15,960 for one person and $5,680 for each person after that, so a
 * household of four is $33,000. Read 2026-11-23 from secondary
 * sources rather than from the HHS publication; one widely linked
 * government page still carried the older $14,580 base, which is
 * what makes checking this worth doing. REFRESH-AT-RUNWAY.
 */
export const FPL_BASE = 15960;
export const FPL_PER_PERSON = 5680;

export function povertyLine(householdSize: number): number {
  return FPL_BASE + FPL_PER_PERSON * (Math.max(1, householdSize) - 1);
}

export interface ScaleBand {
  /** Up to this multiple of the poverty line. */
  upToFpl: number;
  /** How much comes off. */
  off: number;
  label: string;
}

/**
 * What comes off, by income against the poverty line.
 *
 * Medicine's sliding scales are set against the federal poverty
 * guideline rather than against tax brackets, and the reason is
 * household size: the poverty line moves with the number of people
 * the income has to cover and a tax bracket does not. Two people
 * earning the same amount, one supporting a family of five, belong
 * in different places on this table and only one of these two
 * measures puts them there.
 *
 * The bands are the conventional shape. The discounts are ASSUMPTION,
 * owned and not sourced: nobody has decided them, and they are the
 * difference between a sliding scale and a gesture.
 */
export const SCALE_BANDS: ScaleBand[] = [
  { upToFpl: 1.5, off: 0.75, label: 'at or under 150 per cent of the poverty line' },
  { upToFpl: 2.0, off: 0.50, label: 'up to 200 per cent' },
  { upToFpl: 2.5, off: 0.30, label: 'up to 250 per cent' },
  { upToFpl: 4.0, off: 0.15, label: 'up to 400 per cent' },
];

export interface ScaleResult {
  /** Income as a multiple of the poverty line for that household. */
  ofPoverty: number;
  band?: ScaleBand;
  off: number;
  monthly: number;
}

/**
 * The monthly fee after the sliding scale.
 *
 * Applied to the personalised fee rather than to a flat one, so a
 * patient on a low income with a heavy year is not quietly charged
 * more than a patient on a high income with a light one.
 */
export function slide(
  monthly: number, householdIncome: number, householdSize: number,
): ScaleResult {
  const ofPoverty = householdIncome / povertyLine(householdSize);
  const band = SCALE_BANDS.find((b) => ofPoverty <= b.upToFpl);
  const off = band?.off ?? 0;
  return {
    ofPoverty: Math.round(ofPoverty * 100) / 100,
    band,
    off,
    monthly: Math.round(monthly * (1 - off) * 100) / 100,
  };
}

/**
 * Which of the five kinds an encounter is, from what it was recorded as.
 *
 * The record's own vocabulary is older and wider than this one: it
 * knows about paperwork, home visits and wellness visits, none of
 * which this practice prices separately. Anything outside the five
 * falls to a planned review, which is the commonest and the one a
 * physician would have to argue down rather than up.
 */
export function visitKindOf(legacy?: string): VisitKind {
  if (legacy === 'initial') return 'initial';
  if (legacy === 'annual' || legacy === 'awv') return 'annual';
  if (legacy === 'acute') return 'acute';
  if (legacy === 'paperwork' || legacy === 'review') return 'brief';
  return 'follow-up';
}

/**
 * The codes a visit of this kind carries for a patient of this age.
 *
 * Age is optional and the default is the 40 to 64 band, which is
 * what the listed codes already say. Passing it is how a 35 year old
 * stops being charged a 52 year old's preventive rate.
 */
export function codesFor(kind: VisitKind, age?: number): string[] {
  const t = VISIT_TYPES[kind];
  if (!t.ageBanded || age === undefined) return t.codes;
  const prev = preventiveCode(age, kind === 'initial');
  return prev ? [prev, ...t.codes.slice(1)] : t.codes.slice(1);
}

/** What one visit of this kind costs, or undefined if a code is UNSET. */
export function visitPrice(kind: VisitKind, age?: number): number | undefined {
  return VISIT_TYPES[kind].free ? 0 : benchmarkAll(codesFor(kind, age));
}

/** What the work was worth, whether or not it was charged for. */
export function visitWorth(kind: VisitKind, age?: number): number | undefined {
  return benchmarkAll(codesFor(kind, age));
}

/**
 * Which kind of visit a booked line is, read off why it was booked.
 *
 * Crude on purpose. The booking carries a date and a reason in the
 * physician's own words, and anything cleverer than looking for the
 * word "annual" in that reason would be a classifier nobody can
 * predict standing between a sentence and a price.
 */
export function kindOf(why: string): VisitKind {
  return /\bannual\b/i.test(why) ? 'annual' : 'follow-up';
}

/* ------------------------------------------------------------------ */
/* the year, projected and priced                                      */
/* ------------------------------------------------------------------ */

/**
 * How much comes off the fee for service total for paying monthly.
 *
 * UNSET in the charter's terms: nobody has decided it, and D-039
 * decided a flat $99 rather than a discount off anything. The number
 * here is a placeholder.
 *
 * It is also the lever that decides whether this practice survives,
 * which is worth saying plainly next to it. The membership covers
 * unlimited acute and follow-up visits, so the practice carries the
 * whole of the utilisation risk: a patient who comes eight times
 * costs what eight visits cost and pays what the projection said.
 * A discount set generously against a projection set optimistically
 * is how a practice like this fails, and it fails about fourteen
 * months in, which is after the point where it is easy to change.
 */
export const MEMBERSHIP_DISCOUNT = 0.15;

export interface ProjectedVisit {
  date?: string;
  why: string;
  kind: VisitKind;
  price: number;
  /** True where nobody has booked this and the projection expects it. */
  projected?: boolean;
}

export interface YearPlan {
  planned: ProjectedVisit[];
  unplanned: ProjectedVisit[];
  /** What the year costs paying for each visit as it happens. */
  feeForService: number;
  discount: number;
  /** The fee for service year, less the discount. */
  membershipYear: number;
  membershipMonth: number;
  /** What the flat price in the charter would have been, for comparison. */
  flatYear: number;
}

/**
 * How many visits nobody has booked but somebody should expect.
 *
 * ASSUMPTION, owned. A year holds at least one illness that was not
 * on the calendar, and a patient carrying several problems that are
 * not yet at target holds more, because the visits that titrate a
 * drug are the ones nobody schedules a year ahead.
 *
 * One, plus one for every four problems off target, capped at
 * three. Deliberately conservative: the projection sets the monthly
 * price, so a projection that runs high charges the patient for
 * illnesses they did not have, and one that runs low costs the
 * practice money it could see coming. Of the two, the one that
 * costs the practice money is the one to take, because the other
 * one is the practice being paid for a guess.
 *
 * The worked case is the test of it. A man with six problems off
 * target at his first visit is projected two unbooked visits and
 * has one, so the projection runs a little high and the year comes
 * out close. Close is what a projection should be. If it were
 * reliably generous to the practice it would be a price rise
 * wearing a model's clothes.
 */
export function expectedUnplanned(problemsOffTarget: number): number {
  return Math.min(3, 1 + Math.floor(problemsOffTarget / 4));
}

/**
 * The year ahead, priced per visit and then as a monthly fee.
 *
 * This is the whole commercial model in one function. The visits
 * somebody booked are priced at what their codes are worth; the
 * visits nobody booked but everybody should expect are added at what
 * an acute visit is worth; the two together are what the year costs
 * paying as you go; and the monthly fee is that total, less the
 * discount, over twelve.
 *
 * The monthly fee is therefore personal. Two patients booking the
 * same visits get the same number, and a patient with six problems
 * off target gets a larger one than a patient with one, because the
 * year in front of them is larger. That is the argument for pricing
 * this way and also the argument against it, and both belong in
 * front of whoever decides.
 */
export function planYear(
  booked: { date: string; why: string }[], problemsOffTarget: number,
  age?: number,
): YearPlan {
  const planned: ProjectedVisit[] = booked.filter((v) => v.date).map((v) => {
    const kind = kindOf(v.why);
    return { date: v.date, why: v.why, kind, price: visitPrice(kind, age) ?? 0 };
  });
  const n = expectedUnplanned(problemsOffTarget);
  const acute = visitPrice('acute', age) ?? 0;
  const unplanned: ProjectedVisit[] = Array.from({ length: n }, () => ({
    why: 'an illness nobody has booked',
    kind: 'acute' as VisitKind,
    price: acute,
    projected: true,
  }));

  const round = (x: number) => Math.round(x * 100) / 100;
  const feeForService = round(
    [...planned, ...unplanned].reduce((t, v) => t + v.price, 0),
  );
  const membershipYear = round(feeForService * (1 - MEMBERSHIP_DISCOUNT));
  return {
    planned,
    unplanned,
    feeForService,
    discount: round(feeForService - membershipYear),
    membershipYear,
    membershipMonth: round(membershipYear / 12),
    flatYear: YEARLY_FEE,
  };
}

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
}

/**
 * The booked visits, each priced at what its own work is worth.
 *
 * Not one price for everything. A forty-five minute review across
 * five problems and a twenty minute look at one are different pieces
 * of work, and a practice that charges the same for both is either
 * overcharging for one or losing money on the other.
 */
export function quoteYear(
  booked: { date: string; why: string }[], firstVisit: boolean, age?: number,
): Quote {
  const visits = booked.filter((v) => v.date).map((v) => ({
    ...v, price: visitPrice(kindOf(v.why), age) ?? 0,
  }));
  return {
    proBonoFirst: firstVisit,
    visits,
    total: Math.round(visits.reduce((t, v) => t + v.price, 0) * 100) / 100,
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
  encounters: { id: string; date: string; status: string; visitKind?: VisitKind }[],
  upTo: string, age?: number,
): { visits: number; since: string; paid: number } | undefined {
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
  const paid = charged.reduce(
    (t, e) => t + (visitPrice(e.visitKind ?? 'follow-up', age) ?? 0), 0,
  );
  return {
    visits: charged.length,
    paid: Math.round(paid * 100) / 100,
    // Where the free first visit is inside the window it is still
    // where the year started, and saying so is more use than the
    // date of the first visit that happened to be charged for.
    since: first.date >= from ? first.date : charged[0].date,
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
