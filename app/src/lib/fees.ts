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
  G0438: {
    code: 'G0438', label: 'First annual wellness visit', rvu: 5.22,
    from: 'quickintell.com physician-fee-schedule, RVU26D. Work 2.60, components summed here.',
  },
  G0439: {
    code: 'G0439', label: 'Annual wellness visit, thereafter', rvu: 4.12,
    from: 'quickintell.com physician-fee-schedule, RVU26D. Work 1.92, components summed here.',
  },
};

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
