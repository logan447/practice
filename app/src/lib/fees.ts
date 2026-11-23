/**
 * What the work is worth, by the code it would carry.
 *
 * A cash practice still has to answer "why that number", and the
 * only answer that survives being asked twice is one somebody else
 * published. So every price in this practice is derived from the
 * same place a claim would be: the code the visit supports, the
 * relative value units attached to it, and the conversion factor
 * that turns those into dollars.
 *
 * No claim is filed and no insurer is billed. The fee schedule is
 * used as a benchmark and nothing else, which is the whole reason a
 * cash price can be quoted before the visit instead of after it.
 *
 * SOURCING, because these are facts and have to behave like facts:
 * every figure below is from third-party RVU references read on
 * 2026-11-23, not from the CMS file itself. The two references name
 * different releases of the 2026 file (PPRRVU2026_Apr versus RVU26D,
 * effective 2026-10-01), and no code appeared on both, so they could
 * not be compared against each other. Check them against the CMS
 * Physician Fee Schedule before any of this is quoted to a patient.
 * REFRESH-AT-RUNWAY.
 */

/**
 * Dollars per relative value unit, 2026, for clinicians who are not
 * qualifying APM participants.
 *
 * Corroborated across every source read: six FastRVU code pages and
 * QuickIntell all state the same figure. The APM factor is $33.5675
 * and does not apply here.
 */
export const CONVERSION_FACTOR = 33.4009;

export interface CodedService {
  code: string;
  /** What the code is for, in words a patient would recognise. */
  label: string;
  /**
   * Total non-facility relative value units.
   *
   * Undefined where no source read on 2026-11-23 stated one. An
   * undefined RVU is UNSET, not zero: nothing may be priced off it.
   */
  rvu?: number;
  /** Where the RVU came from, so a wrong number can be traced. */
  from: string;
}

/**
 * The codes this practice's visits actually support.
 *
 * 99202 is here and deliberately has no RVU: none of the pages read
 * covered it, and a practice that invents one number to fill a gap
 * has no grounds to be believed about the others.
 */
export const CODES: Record<string, CodedService> = {
  99202: {
    code: '99202', label: 'New patient, straightforward',
    from: 'UNSET. No source read on 2026-11-23 stated an RVU for this code.',
  },
  99203: {
    code: '99203', label: 'New patient, low complexity', rvu: 3.52,
    from: 'fastrvu.com/cpt/99203, PPRRVU2026_Apr_nonQPP. Work 1.60, PE 1.76, MP 0.16.',
  },
  99204: {
    code: '99204', label: 'New patient, moderate complexity', rvu: 5.31,
    from: 'fastrvu.com/cpt/99204, PPRRVU2026_Apr_nonQPP. Work 2.60, PE 2.47, MP 0.24.',
  },
  99205: {
    code: '99205', label: 'New patient, high complexity', rvu: 7.09,
    from: 'fastrvu.com/cpt/99205, PPRRVU2026_Apr_nonQPP. Work 3.50, PE 3.23, MP 0.36.',
  },
  99212: {
    code: '99212', label: 'Established patient, straightforward', rvu: 1.78,
    from: 'fastrvu.com/cpt/99212, PPRRVU2026_Apr_nonQPP. Work 0.70, PE 1.02, MP 0.06.',
  },
  99213: {
    code: '99213', label: 'Established patient, low complexity', rvu: 2.85,
    from: 'quickintell.com physician-fee-schedule, RVU26D. Work 1.30, PE 1.46, MP 0.09, '
      + 'summed here rather than stated as a total.',
  },
  99214: {
    code: '99214', label: 'Established patient, moderate complexity', rvu: 4.06,
    from: 'fastrvu.com/cpt/99214, PPRRVU2026_Apr_nonQPP. Work 1.92, PE 2.00, MP 0.14.',
  },
  99215: {
    code: '99215', label: 'Established patient, high complexity', rvu: 5.76,
    from: 'fastrvu.com/cpt/99215, PPRRVU2026_Apr_nonQPP. Work 2.80, PE 2.75, MP 0.21.',
  },
  /*
   * The Medicare wellness visits. Here because the practice will have
   * patients on Medicare, and NOT used for anybody who is not: these
   * are Medicare-only codes and a 52 year old does not have an annual
   * wellness visit, he has a preventive visit.
   */
  G0438: {
    code: 'G0438', label: 'First annual wellness visit, Medicare only', rvu: 5.22,
    from: 'quickintell.com physician-fee-schedule, RVU26D. Work 2.60, components summed here.',
  },
  G0439: {
    code: 'G0439', label: 'Annual wellness visit thereafter, Medicare only', rvu: 4.12,
    from: 'quickintell.com physician-fee-schedule, RVU26D. Work 1.92, components summed here.',
  },
  /*
   * The preventive series. Original Medicare does not pay these and
   * uses G0438 and G0439 instead, which is why a 52 year old gets
   * 99386 and a 70 year old gets G0438 for the same hour of work.
   * Getting that wrong is how a practice quotes a Medicare code to
   * somebody who is not on Medicare, which is what this file did
   * until it was corrected.
   */
  99385: {
    code: '99385', label: 'Preventive visit, new patient, 18 to 39', rvu: 3.90,
    from: 'fastrvu.com/cpt/99385, PPRRVU2026_Apr_nonQPP. Work 1.92, PE 1.85, MP 0.13.',
  },
  99395: {
    code: '99395', label: 'Preventive visit, established patient, 18 to 39', rvu: 3.52,
    from: 'fastrvu.com/cpt/99395, PPRRVU2026_Apr_nonQPP. Work 1.75, PE 1.65, MP 0.12.',
  },
  99386: {
    code: '99386', label: 'Preventive visit, new patient, 40 to 64', rvu: 4.49,
    from: 'fastrvu.com/cpt/99386, PPRRVU2026_Apr_nonQPP. Work 2.33, PE 2.01, MP 0.15.',
  },
  99396: {
    code: '99396', label: 'Preventive visit, established patient, 40 to 64', rvu: 3.74,
    from: 'fastrvu.com/cpt/99396, PPRRVU2026_Apr_nonQPP. Work 1.90.',
  },
  /*
   * Counselling, by the quarter hour. These are for counselling given
   * to somebody without symptoms, which is most of what lifestyle
   * medicine is, and they cannot be billed out of minutes a
   * time-based office visit has already counted. A forty-five minute
   * review coded on time at 99215 has spent those minutes once.
   */
  99401: {
    code: '99401', label: 'Preventive counselling, 15 minutes', rvu: 1.15,
    from: 'fastrvu.com/cpt/99401, PPRRVU2026_Apr_nonQPP. Work 0.48.',
  },
  99402: {
    code: '99402', label: 'Preventive counselling, 30 minutes', rvu: 1.87,
    from: 'fastrvu.com/cpt/99402, PPRRVU2026_Apr_nonQPP. Work 0.98.',
  },
  99403: {
    code: '99403', label: 'Preventive counselling, 45 minutes', rvu: 2.56,
    from: 'fastrvu.com/cpt/99403, PPRRVU2026_Apr_nonQPP. Work 1.46.',
  },
  99404: {
    code: '99404', label: 'Preventive counselling, 60 minutes', rvu: 3.30,
    from: 'fastrvu.com/cpt/99404, PPRRVU2026_Apr_nonQPP. Work 1.95.',
  },
  G0446: {
    code: 'G0446', label: 'Behavioural therapy, cardiovascular risk', rvu: 1.02,
    from: 'fastrvu.com/cpt/G0446, PPRRVU2026_Apr_nonQPP. Work 0.60. SUSPECT: this '
      + 'page and the G0447 page carry identical work and total values, which may be '
      + 'a copying error at the source. Check both against CMS.',
  },
  G0447: {
    code: 'G0447', label: 'Behavioural counselling for obesity, 15 minutes', rvu: 1.02,
    from: 'fastrvu.com/cpt/G0447, PPRRVU2026_Apr_nonQPP. Work 0.60. SUSPECT: '
      + 'identical to G0446 at the source. Check both against CMS.',
  },
  99406: {
    code: '99406', label: 'Tobacco cessation counselling, 3 to 10 minutes', rvu: 0.46,
    from: 'fastrvu.com/cpt/99406, PPRRVU2026_Apr_nonQPP. Work 0.24.',
  },
  99407: {
    code: '99407', label: 'Tobacco cessation counselling, over 10 minutes', rvu: 0.87,
    from: 'fastrvu.com/cpt/99407, PPRRVU2026_Apr_nonQPP. Work 0.50.',
  },
};

/**
 * The preventive code for somebody of this age.
 *
 * The preventive series is banded by age and the bands are not
 * decoration: a 35 year old and a 52 year old having the same
 * conversation are different codes at different rates, and a fee
 * table that hardcodes one of them quietly overcharges half the
 * panel and undercharges the other half.
 *
 * Only the two middle bands are priced here, because they are the
 * ones this practice's demo patients fall in. Anybody outside them
 * returns undefined rather than the nearest band, which is the whole
 * point: a visit nobody can price has to say so.
 */
export function preventiveCode(age: number, newPatient: boolean): string | undefined {
  if (age >= 18 && age <= 39) return newPatient ? '99385' : '99395';
  if (age >= 40 && age <= 64) return newPatient ? '99386' : '99396';
  return undefined;
}

/**
 * What the benchmark pays for one code.
 *
 * Undefined where the RVU is UNSET, so a caller has to decide what
 * to do about a code nobody could price rather than being handed a
 * zero that looks like an answer.
 */
export function benchmark(code: string): number | undefined {
  const c = CODES[code];
  if (!c || c.rvu === undefined) return undefined;
  return Math.round(c.rvu * CONVERSION_FACTOR * 100) / 100;
}

/** What a list of codes pays together, or undefined if any is UNSET. */
export function benchmarkAll(codes: string[]): number | undefined {
  let total = 0;
  for (const c of codes) {
    const one = benchmark(c);
    if (one === undefined) return undefined;
    total += one;
  }
  return Math.round(total * 100) / 100;
}
