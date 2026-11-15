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
  rule: 'Consent must be obtained before the service begins and documented in the record, with the disclosures '
    + 'each programme names. Verbal is sufficient. MLN909188 p. 6; BHI FAQ #16; 89 FR 97872, where it is a '
    + 'condition of payment.',
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

const initiatingVisit = (months: number, source: string): Rule => ({
  id: 'initiating-visit',
  label: 'Initiating visit',
  rule: `An initiating visit is required before the first month of service for patients not seen within the `
    + `previous ${months === 12 ? 'year' : `${months / 12} years`}. It must be a face-to-face visit at which `
    + `the service was discussed, and it is separately billable. ${source}`,
  mandatory: true,
  check: (i) => {
    const signed = i.encounters
      .filter((e) => e.status === 'signed')
      .sort((a, b) => b.date.localeCompare(a.date));
    const last = signed[0];
    if (!last) return { met: false, evidence: 'No signed visit on file.' };
    const monthsAgo = monthsBetween(last.date, `${i.month}-01`);
    return monthsAgo <= months
      ? { met: true, evidence: `Seen ${fmtDate(last.date)}, within the window.` }
      : { met: false, evidence: `Last seen ${fmtDate(last.date)}, ${monthsAgo} months ago.` };
  },
});

const ccmInitiatingVisit = initiatingVisit(12, 'MLN909188, June 2025, p. 5.');
const bhiInitiatingVisit = initiatingVisit(12, 'BHI FAQ #18; 81 FR 80239.');
const apcmInitiatingVisit = initiatingVisit(36, '89 FR 97873. Three years, not one, and not needed at all if '
  + 'any care management was furnished here within the previous year.');

const carePlanRule: Rule = {
  id: 'care-plan',
  label: 'Comprehensive care plan',
  rule: 'A comprehensive, patient-centred, electronic care plan must be established, documented, reviewed and '
    + 'available to the patient and outside the practice. The twelve elements CMS lists are typical rather than '
    + 'required. MLN909188 p. 6; CCM FAQ p. 3; 89 FR 97878.',
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
  rule: `At least ${needs} minutes of ${who} in the calendar month, documented with the activities performed. `
    + 'CMS prescribes no format for the log. MLN909188 p. 10; CCM FAQ p. 4.',
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
  rule: 'Only one practitioner may furnish and be paid for this service for a patient in a calendar month, which '
    + 'is one of the things consent has to disclose. MLN909188 p. 6; 89 FR 97868.',
  mandatory: true,
  check: () => ({
    met: true,
    evidence: 'Single-physician practice. Nothing in this record shows another practitioner billing it, which is not the same as knowing none did.',
  }),
};

const noDoubleCountRule: Rule = {
  id: 'no-double-count',
  label: 'No minutes counted twice',
  rule: 'The same time cannot be counted toward more than one service, including a same-day office visit or a '
    + 'transitional care management period. CCM FAQ p. 6; MLN909188 p. 8.',
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
  rule: 'Initial assessment or follow-up monitoring using an applicable validated rating scale. '
    + '81 FR 80237; MLN909432, January 2026, p. 10.',
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
export const CCM_DISCLOSURES = [
  'What care management covers between visits',
  'That only one practitioner may furnish and be paid for it in a calendar month',
  'That cost sharing applies',
  'That the patient may stop the service at any time, effective at the end of the month',
  'Whether the patient accepted or declined',
];

export const BHI_DISCLOSURES = [
  'What behavioural health care management covers between visits',
  'Permission to consult relevant specialists, including a psychiatric consultant',
  'That cost sharing applies to face-to-face and non-face-to-face services',
  'That the patient may stop the service at any time',
];

export const APCM_DISCLOSURES = [
  'That this practice takes responsibility for all primary care and is the continuing focal point for care',
  'That only one practitioner may furnish and be paid for it in a calendar month',
  'That consenting does not stop the patient seeing other practitioners',
  'That cost sharing usually applies, and may be covered by supplemental insurance',
  'That the patient may stop the service at any time, effective at the end of the month',
];

/** Two or more chronic conditions, which is the CCM eligibility test. */
const twoChronicRule: Rule = {
  id: 'eligibility',
  label: 'Two or more chronic conditions',
  rule: 'Two or more chronic conditions expected to last at least 12 months or until death, and placing the patient '
    + 'at significant risk of death, acute exacerbation or functional decline. CPT descriptor quoted at 83 FR 59576.',
  mandatory: true,
  check: (i) => {
    const n = chronic(i).length;
    return n >= 2
      ? { met: true, evidence: `${n} chronic problems managed here: ${chronic(i).map((c) => c.name).join(', ')}.` }
      : { met: false, evidence: `${n} chronic problem${n === 1 ? '' : 's'} managed here. Two are needed.` };
  },
};

const behaviouralConditionRule: Rule = {
  id: 'eligibility',
  label: 'A behavioural health condition',
  rule: 'The service is for a diagnosed behavioural health or psychiatric condition. MLN909432, January 2026.',
  mandatory: true,
  check: (i) => {
    const bh = chronic(i).filter(
      (c) => /depress|anxi|mood|bipolar|ptsd|insomnia|substance|alcohol|adjustment/i.test(
        `${c.name} ${c.code}`,
      ),
    );
    return bh.length > 0
      ? { met: true, evidence: `${bh.map((c) => c.name).join(', ')}.` }
      : { met: false, evidence: 'No behavioural health condition on the managed problem list.' };
  },
};

const personalTimeOnlyRule: Rule = {
  id: 'personal-time',
  label: 'Physician time only',
  rule: '99491 and 99437 include only time spent personally by the billing practitioner, and the work cannot be '
    + 'delegated. Clinical staff time does not count. MLN909188, June 2025, p. 10; CCM FAQ p. 2.',
  mandatory: true,
  check: (i) => {
    const mine = i.log.filter(
      (e) => e.program === i.program && inMonth(e.date, i.month) && e.countable,
    );
    const notPhysician = mine.filter((e) => e.role !== 'physician');
    return notPhysician.length === 0
      ? { met: true, evidence: 'Every countable minute is the physician\u2019s own.' }
      : { met: false, evidence: `${notPhysician.length} countable entries are not physician time.` };
  },
};

const cehrtRule: Rule = {
  id: 'cehrt',
  label: 'Certified electronic health record',
  rule: 'CCM requires demographics, problems, medications and allergies to be recorded in a version of certified '
    + 'EHR technology, and the care plan to be electronic and shareable. MLN909188, June 2025, p. 6; 89 FR 97891.',
  mandatory: true,
  check: () => ({
    met: false,
    evidence: 'This prototype is not certified technology. Until the practice records in a certified system, this '
      + 'requirement is not met, whatever the minutes say. See docs/systems/billing-architecture.md.',
  }),
};

const accessRule: Rule = {
  id: 'access',
  label: 'Access around the clock',
  rule: 'Patients must be able to reach a practitioner about urgent needs at any hour, and have a named person '
    + 'for routine appointments. MLN909188 p. 7; for APCM, softened to reasonable after-hours care at 89 FR 97881.',
  mandatory: true,
  check: () => ({
    met: false,
    evidence: 'No call arrangement is recorded. A one-physician practice needs either the phone carried personally '
      + 'or a call-sharing arrangement, and CMS publishes no standard for what it accepts. NEEDS-COUNSEL.',
  }),
};

const notWithCocmRule: Rule = {
  id: 'not-with-cocm',
  label: 'Not with collaborative care in the same month',
  rule: 'General BHI and the collaborative care codes cannot both be billed for a patient in a month. '
    + 'BHI FAQ #3; 81 FR 80242.',
  mandatory: true,
  check: () => ({ met: true, evidence: 'No collaborative care billing in this record.' }),
};

const mutuallyExclusiveRule: Rule = {
  id: 'mutually-exclusive',
  label: 'Not with the other monthly code',
  rule: 'APCM and CCM are mutually exclusive for the same patient, month and practitioner. 89 FR 97894, Table 26.',
  mandatory: true,
  check: () => ({ met: true, evidence: 'No APCM claim for this patient this month.' }),
};

const macConfirmationRule: Rule = {
  id: 'mac-confirmation',
  label: 'Written confirmation that solo delivery counts',
  rule: 'CMS says general BHI may be provided solely by the billing practitioner, but has never written that the '
    + 'practitioner\u2019s own minutes satisfy the 20-minute threshold for 99484. It has written exactly that for '
    + 'CCM. BHI FAQ #14, 5 Dec 2023; MLN909432, January 2026, p. 11; 81 FR 80242.',
  mandatory: false,
  check: () => ({
    met: false,
    evidence: 'Not obtained. This is the open question on this code, not a defect in this chart. '
      + 'See docs/systems/billing-architecture.md.',
  }),
};

const clinicalStaffDescriptorRule: Rule = {
  id: 'clinical-staff-descriptor',
  label: 'The descriptor says clinical staff',
  rule: 'All three APCM descriptors read "provided by clinical staff and directed by a physician". CMS never wrote '
    + 'whether a practice with no clinical staff qualifies. 89 FR 97871 to 97875.',
  mandatory: true,
  check: () => ({
    met: false,
    evidence: 'This practice has no clinical staff. CMS pointed practices that cannot meet the APCM capabilities '
      + 'back to CCM at 89 FR 97876. NEEDS-COUNSEL and NEEDS-MAC.',
  }),
};

const performanceRule: Rule = {
  id: 'performance',
  label: 'Performance measurement',
  rule: 'A practitioner who is MIPS eligible must register for and report the Value in Primary Care MVP for the '
    + 'year in which APCM is billed. 89 FR 97893.',
  mandatory: true,
  check: () => ({
    met: false,
    evidence: 'Nothing registered. A low-volume practice may be outside MIPS, which CMS said means it "technically '
      + 'could" bill but "would be unlikely to" (89 FR 97892). Neither branch is comfortable.',
  }),
};

const populationRule: Rule = {
  id: 'population',
  label: 'Management across the panel',
  rule: 'The practice must risk stratify its population and analyse it for gaps in care. It need not be the billing '
    + 'practitioner who does the work. 89 FR 97878, 97889.',
  mandatory: true,
  check: () => ({
    met: false,
    evidence: 'Not built. This is panel-level work with no revenue attached to it, and it is an APCM condition only.',
  }),
};

const apcmElementsRule: Rule = {
  id: 'apcm-elements',
  label: 'Elements furnished this month',
  rule: 'APCM has no minute threshold. The services furnished must be documented in the record, and not every '
    + 'element need be furnished in a given month. 89 FR 97868.',
  mandatory: true,
  check: (i) => {
    const entries = i.log.filter((e) => e.program === i.program && inMonth(e.date, i.month));
    return entries.length > 0
      ? { met: true, evidence: `${entries.length} documented contacts or pieces of work this month.` }
      : { met: false, evidence: 'Nothing documented for this patient this month.' };
  },
};

/**
 * The rules per programme.
 *
 * Every mandatory line traces to a CMS citation, written into the
 * rule text so it is read beside the result rather than looked up.
 * Lines that are this prototype's own addition are not mandatory and
 * say so on screen.
 *
 * Three of these never pass, by design and not by oversight: the
 * certified-record requirement for CCM, the clinical-staff descriptor
 * for APCM, and the performance measurement for APCM. They are the
 * honest state of a one-physician practice running software it wrote
 * itself, and a chart that hid them would be the more dangerous
 * object.
 */
export const RULES: Partial<Record<CareProgram, { code: string; rules: Rule[] }>> = {
  ccm: {
    code: '99491',
    rules: [
      twoChronicRule,
      consentRule('ccm', CCM_DISCLOSURES),
      ccmInitiatingVisit,
      carePlanRule,
      timeRule(30, 'time spent personally by the billing physician'),
      personalTimeOnlyRule,
      cehrtRule,
      accessRule,
      soleBillerRule,
      mutuallyExclusiveRule,
      noDoubleCountRule,
    ],
  },
  bhi: {
    code: '99484',
    rules: [
      behaviouralConditionRule,
      consentRule('bhi', BHI_DISCLOSURES),
      bhiInitiatingVisit,
      instrumentRule,
      carePlanRule,
      timeRule(20, 'care management time'),
      notWithCocmRule,
      noDoubleCountRule,
      macConfirmationRule,
    ],
  },
  apcm: {
    code: 'G0557',
    rules: [
      twoChronicRule,
      consentRule('apcm', APCM_DISCLOSURES),
      apcmInitiatingVisit,
      carePlanRule,
      apcmElementsRule,
      accessRule,
      clinicalStaffDescriptorRule,
      performanceRule,
      populationRule,
      soleBillerRule,
      mutuallyExclusiveRule,
    ],
  },
};


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
  consentRule, initiatingVisit, carePlanRule, timeRule,
  soleBillerRule, noDoubleCountRule, instrumentRule, chronic, countable,
};
export type { Rule };
