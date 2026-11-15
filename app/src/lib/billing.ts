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

/** Minutes at or above which each established-patient code is reachable. */
const TIME_FLOOR: [number, typeof CODE_BY_RANK[number]][] = [
  [40, '99215'], [30, '99214'], [20, '99213'], [10, '99212'],
];

export interface EmComputation {
  /** The level two of the three elements reach. */
  mdmLevel: MdmLevel;
  byMdm: string;
  byTime: string;
  /** The higher of the two, as a suggestion only. */
  higher: string;
}

/**
 * Two of three elements must meet or exceed the level.
 *
 * So the level is the second-highest of the three, which is the
 * compact way of saying the same thing.
 */
export function emLevel(em: EmRecord): EmComputation {
  const ranks = [em.problemsLevel, em.dataLevel, em.riskLevel]
    .map((l) => RANK[l]).sort((a, b) => b - a);
  const two = ranks[1];
  const mdmLevel = (Object.keys(RANK) as MdmLevel[]).find((k) => RANK[k] === two)!;
  const byMdm = CODE_BY_RANK[two];
  const byTime = TIME_FLOOR.find(([m]) => em.totalMinutes >= m)?.[1] ?? 'below 99212';
  const higher = byTime === 'below 99212'
    ? byMdm
    : (CODE_BY_RANK.indexOf(byTime) > CODE_BY_RANK.indexOf(byMdm) ? byTime : byMdm);
  return { mdmLevel, byMdm, byTime, higher };
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

  if (program === 'ccm') {
    add('20 min staff', 20, countable);
    add('30 min physician', 30, physician);
  }
  if (program === 'bhi') add('20 min', 20, countable);
  // Advanced primary care management is not a timed service: it turns
  // on service elements being available, not minutes counted.
  return { countable, excluded, thresholds: t };
}
