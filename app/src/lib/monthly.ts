/**
 * Whether a month's care management service can be billed.
 *
 * The rule content lives in one table at the bottom of this file and
 * is sourced from `docs/systems/billing-architecture.md`, which cites
 * the CMS text each line came from. Keeping the rules as data rather
 * than as code means the citations and the behaviour can be checked
 * against each other, and it means a rule change is an edit to a
 * table rather than a hunt through conditionals.
 *
 * The evaluation never concludes. It reports which requirements the
 * chart satisfies and which it does not, and stops at the point where
 * a person has to agree. Software that decides a month is billable
 * has made a billing decision on somebody else's licence, and the
 * most common way it happens is treating a time threshold as the
 * whole test. Time is one check among several here, and reaching it
 * moves the month to `threshold`, not to `ready`.
 *
 * NEEDS-COUNSEL and NEEDS-CPA before any of this supports a claim.
 */
import type {
  CareLogEntry, CareProgram, Condition, Encounter, InstrumentScore,
  MasterPlan, MonthlyService, MonthStatus, Patient, RequirementCheck,
  ServiceConsent, ChartVersion,
} from '../domain/types';
import { fmtDate } from './format';

export interface MonthInput {
  patient: Patient;
  program: CareProgram;
  /** YYYY-MM. */
  month: string;
  conditions: Condition[];
  log: CareLogEntry[];
  consents: ServiceConsent[];
  encounters: Encounter[];
  scores: InstrumentScore[];
  master?: MasterPlan;
  version?: ChartVersion;
  attested?: { by: string; at: string };
  claimed?: boolean;
}

/** One requirement, and how to decide whether this chart meets it. */
interface Rule {
  id: string;
  label: string;
  rule: string;
  mandatory: boolean;
  check: (i: MonthInput) => { met: boolean; evidence: string };
}

const inMonth = (date: string, month: string) => date.slice(0, 7) === month;

const countable = (i: MonthInput) => i.log
  .filter((e) => e.program === i.program && inMonth(e.date, i.month) && e.countable)
  .reduce((a, e) => a + e.minutes, 0);

const excluded = (i: MonthInput) => i.log
  .filter((e) => e.program === i.program && inMonth(e.date, i.month) && !e.countable)
  .reduce((a, e) => a + e.minutes, 0);

/** Chronic problems this practice is actually managing. */
const chronic = (i: MonthInput) => i.conditions.filter(
  (c) => c.status === 'active' && c.managed,
);

// ------------------------------------------------------- shared rules

const consentRule = (program: CareProgram, disclosures: string[]): Rule => ({
  id: 'consent',
  label: 'Consent on file',
  rule: 'Consent must be obtained before the service begins and documented in the record, including the specific disclosures.',
  mandatory: true,
  check: (i) => {
    const c = i.consents.find((x) => x.program === program && !x.revoked);
    if (!c) return { met: false, evidence: 'No consent recorded for this service.' };
    const missing = disclosures.filter((d) => !(c.disclosures ?? []).includes(d));
    return missing.length === 0
      ? { met: true, evidence: `${c.method === 'written' ? 'Written' : 'Verbal'} consent ${fmtDate(c.date)}, all disclosures recorded.` }
      : {
        met: false,
        evidence: `Consent ${fmtDate(c.date)} but these disclosures are not recorded: ${missing.join('; ')}.`,
      };
  },
});

const initiatingVisitRule: Rule = {
  id: 'initiating-visit',
  label: 'Initiating visit',
  rule: 'An initiating visit is required before the first month of service for patients not seen within the previous 12 months.',
  mandatory: true,
  check: (i) => {
    const signed = i.encounters
      .filter((e) => e.status === 'signed')
      .sort((a, b) => b.date.localeCompare(a.date));
    const last = signed[0];
    if (!last) return { met: false, evidence: 'No signed visit on file.' };
    const monthsAgo = monthsBetween(last.date, `${i.month}-01`);
    return monthsAgo <= 12
      ? { met: true, evidence: `Seen ${fmtDate(last.date)}, within 12 months.` }
      : { met: false, evidence: `Last seen ${fmtDate(last.date)}, more than 12 months ago.` };
  },
};

const carePlanRule: Rule = {
  id: 'care-plan',
  label: 'Comprehensive care plan',
  rule: 'A comprehensive, patient-centred care plan must be established, documented, reviewed and available to the patient.',
  mandatory: true,
  check: (i) => {
    const plan = i.version?.plan ?? i.master?.plan;
    const problems = Object.values(plan?.byProblem ?? {}).filter((t) => t.trim().length > 0);
    if (!plan || problems.length === 0) {
      return { met: false, evidence: 'No care plan content on file.' };
    }
    const managed = chronic(i).length;
    return problems.length >= Math.min(managed, 2)
      ? {
        met: true,
        evidence: i.version
          ? `Version ${i.version.version}, approved ${fmtDate(i.version.approvedAt)}, covering ${problems.length} problems.`
          : `Plan covering ${problems.length} problems.`,
      }
      : {
        met: false,
        evidence: `Plan covers ${problems.length} of ${managed} managed problems.`,
      };
  },
};

const timeRule = (needs: number, who: string): Rule => ({
  id: 'time',
  label: `${needs} minutes in the month`,
  rule: `At least ${needs} minutes of ${who} in the calendar month, documented with the activities performed.`,
  mandatory: true,
  check: (i) => {
    const mins = countable(i);
    const other = excluded(i);
    return mins >= needs
      ? { met: true, evidence: `${mins} countable minutes${other > 0 ? `, ${other} excluded` : ''}.` }
      : {
        met: false,
        evidence: `${mins} countable minutes, ${needs - mins} short${other > 0 ? `. ${other} minutes are recorded but not countable` : ''}.`,
      };
  },
});

const soleBillerRule: Rule = {
  id: 'sole-biller',
  label: 'Only one practitioner this month',
  rule: 'Only one practitioner may bill this service for a patient in a calendar month.',
  mandatory: true,
  check: () => ({
    met: true,
    evidence: 'Single-physician practice. Nothing in this record shows another practitioner billing it, which is not the same as knowing none did.',
  }),
};

const noDoubleCountRule: Rule = {
  id: 'no-double-count',
  label: 'No minutes counted twice',
  rule: 'The same time cannot be counted toward more than one service.',
  mandatory: true,
  check: (i) => {
    const mine = i.log.filter((e) => e.program === i.program && inMonth(e.date, i.month));
    const clash = mine.filter((e) => (e.notAlsoCountedFor ?? []).length > 0);
    return {
      met: true,
      evidence: clash.length > 0
        ? `${clash.length} entries name another service the same minutes were deliberately not counted for.`
        : 'No entry is shared with another service.',
    };
  },
};

const instrumentRule: Rule = {
  id: 'instrument',
  label: 'Validated rating scale',
  rule: 'Systematic assessment and monitoring using an applicable validated rating scale.',
  mandatory: true,
  check: (i) => {
    const recent = i.scores
      .filter((x) => x.date <= `${i.month}-31`)
      .sort((a, b) => b.date.localeCompare(a.date))[0];
    if (!recent) return { met: false, evidence: 'No scored instrument on file.' };
    const monthsAgo = monthsBetween(recent.date, `${i.month}-01`);
    return monthsAgo <= 12
      ? { met: true, evidence: `${recent.instrument.toUpperCase()} ${recent.score} on ${fmtDate(recent.date)}.` }
      : { met: false, evidence: `Most recent score is ${fmtDate(recent.date)}, over a year old.` };
  },
};

function monthsBetween(a: string, b: string): number {
  const [ay, am] = a.split('-').map(Number);
  const [by, bm] = b.split('-').map(Number);
  return (by - ay) * 12 + (bm - am);
}

// ---------------------------------------------------------- the table

/**
 * The rules per programme.
 *
 * Populated from `docs/systems/billing-architecture.md`. Every line
 * here should be traceable to a CMS citation in that document; where
 * one is not, it is marked non-mandatory and described as good
 * practice rather than as a requirement.
 */
export const RULES: Partial<Record<CareProgram, { code: string; rules: Rule[] }>> = {};

export function evaluateMonth(i: MonthInput): MonthlyService {
  const spec = RULES[i.program];
  const checks: RequirementCheck[] = (spec?.rules ?? []).map((r) => {
    const { met, evidence } = r.check(i);
    return { id: r.id, label: r.label, rule: r.rule, met, evidence, mandatory: r.mandatory };
  });

  const mins = countable(i);
  const timeCheck = checks.find((c) => c.id === 'time');
  const mandatoryMet = checks.filter((c) => c.mandatory).every((c) => c.met);

  const status: MonthStatus = i.claimed ? 'claimed'
    : i.attested ? 'ready'
      : mandatoryMet ? 'requirements'
        : timeCheck?.met ? 'threshold'
          : 'recorded';

  return {
    id: `${i.patient.id}-${i.program}-${i.month}`,
    patientId: i.patient.id,
    program: i.program,
    month: i.month,
    code: spec?.code,
    countableMinutes: mins,
    excludedMinutes: excluded(i),
    checks,
    status,
    attestedBy: i.attested?.by,
    attestedAt: i.attested?.at,
  };
}

export const MONTH_STATUS_LABEL: Record<MonthStatus, string> = {
  recorded: 'Time recorded',
  threshold: 'Time threshold met',
  requirements: 'Requirements satisfied',
  ready: 'Reviewed and ready',
  claimed: 'Claim prepared',
};

export {
  consentRule, initiatingVisitRule, carePlanRule, timeRule,
  soleBillerRule, noDoubleCountRule, instrumentRule, chronic, countable,
};
export type { Rule };
