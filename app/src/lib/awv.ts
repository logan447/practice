/**
 * The annual wellness visit, as Medicare actually defines it.
 *
 * Two things are modelled here and they are different in kind. The
 * first is eligibility, which is arithmetic on dates and which the
 * chart can answer on its own. The second is the element list, which
 * is partly arithmetic and partly an attestation: the record can show
 * that a blood pressure was taken, but only the physician can say
 * that personalised health advice was given.
 *
 * Keeping those two apart is the whole point. An element the chart
 * derives is evidence. An element the physician ticks is a claim they
 * are making, and the chart says so rather than pretending it checked.
 *
 * Sources, with the dates they were read, are in
 * docs/systems/billing-architecture.md. The binding text is
 * 42 CFR 410.15; the CMS "Annual Wellness Visit" page (last modified
 * 2026-04-09) is the operational gloss and the two differ in places.
 * NEEDS-COUNSEL before any of this supports a claim.
 */
import type { MedicareStatus } from '../domain/types';
import { fmtDate } from './format';

/* ------------------------------------------------------------------ */
/* eligibility                                                         */
/* ------------------------------------------------------------------ */

/** Add whole months to an ISO date, clamping the day into the month. */
export function addMonths(iso: string, n: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const total = (y * 12) + (m - 1) + n;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  const last = new Date(Date.UTC(ny, nm, 0)).getUTCDate();
  return `${ny}-${String(nm).padStart(2, '0')}-${String(Math.min(d, last)).padStart(2, '0')}`;
}

export interface AwvEligibility {
  /** The code the next wellness visit would carry, if any. */
  code: 'G0438' | 'G0439' | null;
  eligible: boolean;
  /** One sentence, in the physician's language, saying why. */
  reason: string;
  /** The first date it could be billed, when it is not billable today. */
  nextEligible?: string;
  /** Questions this chart cannot answer for itself. */
  flags: string[];
}

/**
 * Whether a wellness visit is billable today, and as which code.
 *
 * The frequency rule here is the stricter of the two readings in
 * circulation: twelve months from the date of the last visit. CMS's
 * own Recovery Audit issue 0077 states eleven whole months following
 * the month of the service, which would make the same calendar month
 * next year payable. Chapter 18 of the Claims Processing Manual, the
 * regulation and the beneficiary notice all say twelve months. The
 * conflict is real and unresolved, so the chart takes the reading
 * that cannot cause a denial and says out loud that it did.
 */
export function awvEligibility(now: string, ms?: MedicareStatus): AwvEligibility {
  const flags = [
    'NEEDS-MAC: eleven full months after the month of service, or twelve months from the date? '
    + 'CMS sources conflict. This chart uses twelve months from the date, which is the stricter reading.',
  ];
  if (!ms?.partB) {
    return {
      code: null, eligible: false, flags,
      reason: 'Not enrolled in Medicare Part B, so there is no wellness visit benefit to bill.',
    };
  }
  const prior = [...(ms.awvOn ?? [])].sort();
  const lastAwv = prior[prior.length - 1];
  const code: 'G0438' | 'G0439' = prior.length === 0 ? 'G0438' : 'G0439';

  // The first twelve Part B months belong to the welcome visit, not to the AWV.
  if (ms.partBSince) {
    const opens = addMonths(ms.partBSince, 12);
    if (now < opens) {
      return {
        code, eligible: false, nextEligible: opens, flags,
        reason: 'Still inside the first twelve months of Part B. The welcome to Medicare visit covers this period; '
          + 'the wellness visit starts afterwards.',
      };
    }
  }
  if (ms.ippeOn) {
    const opens = addMonths(ms.ippeOn, 12);
    if (now < opens) {
      return {
        code, eligible: false, nextEligible: opens, flags,
        reason: `A welcome to Medicare visit was billed on ${fmtDate(ms.ippeOn)}. A wellness visit cannot follow within twelve months.`,
      };
    }
  }
  if (lastAwv) {
    const opens = addMonths(lastAwv, 12);
    if (now < opens) {
      return {
        code, eligible: false, nextEligible: opens, flags,
        reason: `The last wellness visit was ${fmtDate(lastAwv)}.`,
      };
    }
  }
  return {
    code, eligible: true, flags,
    reason: code === 'G0438'
      ? 'No wellness visit on file. The first one is G0438, which is once in a lifetime across all physicians.'
      : 'A wellness visit is due. Every one after the first is G0439, including the first one done here.',
  };
}

/* ------------------------------------------------------------------ */
/* the element list                                                    */
/* ------------------------------------------------------------------ */

export type AwvKind = 'initial' | 'subsequent';

export interface AwvElement {
  id: string;
  label: string;
  /** What the element actually asks for, in one line. */
  detail: string;
  /**
   * 'derived' means the chart can see whether it happened.
   * 'attested' means only the physician can say, and ticking it is a claim.
   */
  how: 'derived' | 'attested';
  /** False for the two the regulation marks discretionary. */
  required: boolean;
  source: string;
}

/**
 * The elements, by visit.
 *
 * The subsequent visit is not a smaller copy of the first: it drops
 * height, body mass index, the depression risk review and the
 * functional ability review, and it updates a screening schedule
 * rather than establishing one. Building it as a clone is the common
 * error and it over-documents a visit that is paid less.
 */
const REG = '42 CFR 410.15(a)';
const PAGE = 'CMS Annual Wellness Visit page, last modified 2026-04-09';

const COMMON: AwvElement[] = [
  {
    id: 'hra', label: 'Health risk assessment', how: 'derived', required: true,
    detail: 'Self-reported, no longer than twenty minutes, covering demographics, self-assessed health and '
      + 'frailty, psychosocial risks, behavioural risks, activities of daily living and instrumental activities.',
    source: REG,
  },
  {
    id: 'history', label: 'Medical and family history', how: 'derived', required: true,
    detail: 'Family history in parents, siblings and children; past medical and surgical history; medications, '
      + 'supplements and other exposures.',
    source: PAGE,
  },
  {
    id: 'providers', label: 'List of current providers and suppliers', how: 'derived', required: true,
    detail: 'Everyone who regularly provides medical care, behavioural health included.',
    source: PAGE,
  },
  {
    id: 'cognitive', label: 'Cognitive impairment', how: 'derived', required: true,
    detail: 'Assessed by direct observation or by report from the patient, family or carers. A brief test may be used.',
    source: PAGE,
  },
  {
    id: 'schedule', label: 'Written screening schedule', how: 'derived', required: true,
    detail: 'Built on the preventive services this patient is due, their history and their age.',
    source: PAGE,
  },
  {
    id: 'risks', label: 'List of risk factors and conditions', how: 'derived', required: true,
    detail: 'With an intervention recommended or already underway for each, mental health and substance use included.',
    source: PAGE,
  },
  {
    id: 'advice', label: 'Personalised health advice and referrals', how: 'attested', required: true,
    detail: 'Falls, nutrition, physical activity, tobacco, social engagement, weight and cognition.',
    source: PAGE,
  },
  {
    id: 'opioid', label: 'Review of current opioid prescriptions', how: 'derived', required: true,
    detail: 'Only if an opioid is on the list: risk factors, pain severity, the current plan, non-opioid options, referral.',
    source: `${REG}, not marked discretionary`,
  },
  {
    id: 'sud', label: 'Screen for substance use disorder', how: 'attested', required: true,
    detail: 'A screening tool may be used but is not required.',
    source: `${REG}, not marked discretionary`,
  },
  {
    id: 'acp', label: 'Advance care planning', how: 'attested', required: false,
    detail: 'At the patient’s discretion. Separately billable, and free to them only on the same day as the wellness visit.',
    source: `${REG}(x)`,
  },
  {
    id: 'panra', label: 'Physical activity and nutrition risk assessment', how: 'attested', required: false,
    detail: 'At the discretion of the physician and the patient. Standardised and evidence based.',
    source: `${REG}(xiii)`,
  },
];

export function awvElements(kind: AwvKind): AwvElement[] {
  const measure: AwvElement = kind === 'initial'
    ? {
      id: 'measure', label: 'Height, weight, body mass index and blood pressure', how: 'derived', required: true,
      detail: 'Waist circumference may stand in for body mass index. Other routine measurements as the history warrants.',
      source: PAGE,
    }
    : {
      id: 'measure', label: 'Weight and blood pressure', how: 'derived', required: true,
      detail: 'Waist circumference may stand in for weight. Height and body mass index are not asked for after the first visit.',
      source: PAGE,
    };

  const firstOnly: AwvElement[] = kind === 'initial' ? [
    {
      id: 'depression', label: 'Depression risk factors', how: 'derived', required: true,
      detail: 'Current and past experience of depression and other mood disorders, using a recognised standardised tool.',
      source: PAGE,
    },
    {
      id: 'function', label: 'Functional ability and safety', how: 'attested', required: true,
      detail: 'Activities of daily living, falls risk, hearing, and safety at home and in the community including driving.',
      source: PAGE,
    },
  ] : [];

  const order = kind === 'initial'
    ? ['hra', 'history', 'providers', 'measure', 'cognitive', 'depression', 'function', 'schedule', 'risks',
      'advice', 'acp', 'opioid', 'sud', 'panra']
    : ['hra', 'history', 'providers', 'measure', 'cognitive', 'schedule', 'risks', 'advice', 'acp',
      'opioid', 'sud', 'panra'];

  const all = [...COMMON, measure, ...firstOnly];
  return order.map((id) => all.find((e) => e.id === id)!).filter(Boolean);
}

/** A wellness visit is not a physical, and the chart should say so once. */
export const NOT_A_PHYSICAL =
  'The wellness visit is a prevention conversation built on a health risk assessment, a set of screenings and '
  + 'a written prevention plan. It is not a head to toe physical. Medicare does not cover a routine physical at all, '
  + 'and no examination is required here. Examine what the patient’s problems warrant, and bill that separately.';
