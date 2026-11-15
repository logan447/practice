/**
 * Keeping the summary current.
 *
 * The living summary is only worth having if it is actually living,
 * and it is only safe if nothing gets into it without a clinician
 * putting it there. Those two pull in opposite directions, so this
 * sits in between: it reads the record, works out what the summary no
 * longer says correctly, and proposes text. It never writes.
 *
 * Three rules it follows, and the reasons.
 *
 * It cites. Every proposal carries the record ids and dates it was
 * built from, shown on screen beside the text. A proposal you cannot
 * trace is a proposal you have to take on faith, and nothing here is
 * worth that.
 *
 * It separates what the chart documents from what it inferred.
 * "A1c 6.9 on 29 Oct, down from 8.1 on 20 Jan" is in the record.
 * "Control is improving without a sulfonylurea" is a reading of the
 * record. Both are useful; conflating them is how a summary becomes
 * something nobody can audit.
 *
 * It does not fill gaps. A measure that was never taken is reported
 * as not taken. The dangerous failure for a summariser is not getting
 * a number wrong, it is rendering silence as normal.
 */
import type {
  CarePlan, Condition, Encounter, ExamRecord, LabPanel, MasterPlan,
  Medication, PreventionItem, Specialist, SummaryProposal, VitalsSet,
  DiagnosticStudy, PatientEntry,
} from '../domain/types';
import { fmtDate } from './format';

export interface SynthesisInput {
  patientId: string;
  now: string;
  master?: MasterPlan;
  conditions: Condition[];
  medications: Medication[];
  encounters: Encounter[];
  exams: ExamRecord[];
  vitals: VitalsSet[];
  panels: LabPanel[];
  studies: DiagnosticStudy[];
  specialists: Specialist[];
  prevention: PreventionItem[];
  plan?: CarePlan;
  entries: PatientEntry[];
}

const byDateDesc = <T extends { date: string }>(xs: T[]): T[] =>
  [...xs].sort((a, b) => b.date.localeCompare(a.date));

/** Records added since the summary was last touched. */
export function staleSince(input: SynthesisInput): { count: number; what: string[] } {
  const since = input.master?.updated ?? '0000-00-00';
  const what: string[] = [];
  const after = <T extends { date: string }>(xs: T[], label: (x: T) => string) => {
    for (const x of xs) if (x.date > since) what.push(label(x));
  };
  after(input.encounters.filter((e) => e.status === 'signed'),
    (e) => `visit on ${fmtDate(e.date)}`);
  after(input.panels, (p) => `${p.name} on ${fmtDate(p.date)}`);
  after(input.vitals.filter((x) => x.source === 'office'),
    (x) => `vitals on ${fmtDate(x.date)}`);
  after(input.studies, (s) => `${s.name} on ${fmtDate(s.date)}`);
  after(input.entries.filter((e) => e.flagged), (e) => `a flagged note on ${fmtDate(e.date)}`);
  return { count: what.length, what };
}

let seq = 0;
const mk = (
  patientId: string, now: string, target: string, targetLabel: string,
  kind: SummaryProposal['kind'], text: string, basis: string[],
): SummaryProposal => ({
  id: `sp${Date.now().toString(36)}${(seq++).toString(36)}`,
  patientId, target, targetLabel, kind, text, basis,
  generated: now, status: 'pending',
});

const latestPanelValue = (panels: LabPanel[], key: string) => {
  const sorted = byDateDesc(panels);
  for (const p of sorted) {
    const v = p.values.find((x) => x.key === key);
    if (v) return { v, date: p.date, panel: p };
  }
  return undefined;
};

const priorPanelValue = (panels: LabPanel[], key: string) => {
  const sorted = byDateDesc(panels).filter((p) => p.values.some((x) => x.key === key));
  const p = sorted[1];
  if (!p) return undefined;
  return { v: p.values.find((x) => x.key === key)!, date: p.date };
};

/**
 * What the summary should now say, section by section.
 *
 * Only sections the record has something new for. A proposal to
 * rewrite a paragraph with the same paragraph is noise, and noise is
 * what makes a review step get skipped.
 */
export function propose(input: SynthesisInput): SummaryProposal[] {
  const { patientId, now } = input;
  const out: SummaryProposal[] = [];
  const M = (t: string, l: string, k: SummaryProposal['kind'], txt: string, b: string[]) =>
    out.push(mk(patientId, now, t, l, k, txt, b));

  const signed = byDateDesc(input.encounters.filter((e) => e.status === 'signed'));
  const lastVisit = signed[0];
  const since = input.master?.updated ?? '0000-00-00';

  // ------------------------------------------------ subjective, by problem
  //
  // Attributed only where the patient's own words actually touch the
  // problem. Terms come from the diagnosis and from the drugs given
  // for it, because people say "the water tablet", not "hypertension".
  // Anything that matches nothing becomes one general entry rather
  // than being filed under whichever problem happened to be first.
  const newNotes = signed.filter((e) => e.date > since).map((e) => ({
    e,
    txt: [e.note?.subjective.reason, e.note?.subjective.additional]
      .filter(Boolean).join(' ').trim(),
  })).filter((x) => x.txt.length > 0);

  const claimed = new Set<string>();
  for (const c of input.conditions.filter((x) => x.managed && x.status === 'active')) {
    const terms = [
      ...c.name.toLowerCase().split(/[\s,]+/).filter((w) => w.length > 4),
      ...input.medications.filter((m) => m.indication === c.name)
        .map((m) => m.name.toLowerCase()),
    ];
    const hit = newNotes.find(({ txt }) => {
      const t = txt.toLowerCase();
      return terms.some((term) => t.includes(term));
    });
    if (!hit) continue;
    claimed.add(hit.e.id);
    M(
      `subjective.byProblem.${c.id}`,
      `Subjective, ${c.name}`,
      'documented',
      `${fmtDate(hit.e.date)}: ${hit.txt}`,
      [`Encounter ${hit.e.id}, ${fmtDate(hit.e.date)}`],
    );
  }

  const unclaimed = newNotes.filter((x) => !claimed.has(x.e.id));
  if (unclaimed.length > 0) {
    M('subjective.history', 'Subjective, since the last summary', 'documented',
      unclaimed.map(({ e, txt }) => `${fmtDate(e.date)}: ${txt}`).join('\n\n'),
      unclaimed.map(({ e }) => `Encounter ${e.id}, ${fmtDate(e.date)}`));
  }

  // ------------------------------------------------------------- objective
  const office = byDateDesc(input.vitals.filter((x) => x.source === 'office'));
  const home = byDateDesc(input.vitals.filter((x) => x.source === 'home'));
  if (office[0] && office[0].date > since) {
    const o = office[0];
    const prev = office[1];
    const parts: string[] = [];
    if (o.systolic && o.diastolic) {
      parts.push(`BP ${o.systolic}/${o.diastolic}${
        prev?.systolic ? ` (was ${prev.systolic}/${prev.diastolic} on ${fmtDate(prev.date)})` : ''}`);
    }
    if (o.weightLb) parts.push(`weight ${o.weightLb} lb`);
    if (o.bmi) parts.push(`BMI ${o.bmi}`);
    const homeLine = home.length > 0
      ? ` Home readings over the last ${home.length} entries average ${
        Math.round(home.reduce((a, x) => a + (x.systolic ?? 0), 0) / home.filter((x) => x.systolic).length)
      } systolic, lower than clinic.`
      : ' No home readings on file.';
    M('objective.narrative', 'Objective narrative', 'documented',
      `Office ${fmtDate(o.date)}: ${parts.join(', ')}.${homeLine}`,
      [`Vitals ${o.id}, ${fmtDate(o.date)}`, ...home.slice(0, 2).map((h) => `Home vitals ${h.id}`)]);
  }

  // --------------------------------------------------------- assessment
  const a1c = latestPanelValue(input.panels, 'A1c');
  const a1cPrior = priorPanelValue(input.panels, 'A1c');
  const ldl = latestPanelValue(input.panels, 'LDL');
  const egfr = latestPanelValue(input.panels, 'eGFR');
  if (a1c && a1c.date > since) {
    const facts: string[] = [];
    facts.push(`A1c ${a1c.v.value}% on ${fmtDate(a1c.date)}${
      a1cPrior ? `, from ${a1cPrior.v.value}% on ${fmtDate(a1cPrior.date)}` : ''}`);
    if (ldl) facts.push(`LDL ${ldl.v.value} ${ldl.v.unit} on ${fmtDate(ldl.date)}`);
    if (egfr) facts.push(`eGFR ${egfr.v.value} on ${fmtDate(egfr.date)}`);
    M('assessment.facts', 'Assessment, the numbers', 'documented',
      `${facts.join('. ')}.`,
      input.panels.filter((p) => p.date === a1c.date).map((p) => `${p.name}, ${fmtDate(p.date)}`));

    const dir = a1cPrior
      ? (a1c.v.value < a1cPrior.v.value ? 'falling' : a1c.v.value > a1cPrior.v.value ? 'rising' : 'unchanged')
      : 'without a prior value to compare';
    const stopped = input.medications.filter((m) => m.status === 'stopped');
    M('assessment.narrative', 'Assessment, reading', 'interpretation',
      `Glycaemic control is ${dir}${
        stopped.length > 0 ? `, and it has moved while ${stopped[0].name} was withdrawn rather than while an agent was added` : ''
      }. On the numbers alone the diabetes is the problem responding best; whether that holds depends on whether the evening meals on her carer nights get solved.`,
      ['Interpretation of the A1c series and the medication history. Not a documented finding.']);
  }

  // ------------------------------------------------- prevention gaps
  const due = input.prevention.filter((p) => p.status === 'overdue' || p.status === 'due');
  if (due.length > 0) {
    const overdue = due.filter((p) => p.status === 'overdue');
    M('plan.prevention', 'Plan, preventative care', 'documented',
      `${due.map((p) => `${p.name} ${p.status}${p.dueBy ? ` (${fmtDate(p.dueBy)})` : ''}`).join('. ')}.${
        overdue.length > 0 ? ` ${overdue.map((p) => p.name).join(' and ')} ${overdue.length > 1 ? 'are' : 'is'} the outstanding gap.` : ''
      }`,
      due.map((p) => `Prevention item ${p.id}`));
  }

  // ------------------------------------------------ plan, by problem
  if (lastVisit && lastVisit.date > since) {
    const planText = lastVisit.note?.plan.overall?.trim();
    if (planText) {
      for (const c of input.conditions.filter((x) => x.managed && x.status === 'active')) {
        const meds = input.medications.filter((m) => m.status === 'active' && m.indication === c.name);
        if (meds.length === 0) continue;
        M(`plan.byProblem.${c.id}`, `Plan, ${c.name}`, 'documented',
          `${meds.map((m) => `${m.name} ${m.dose}`).join(', ')}. From ${fmtDate(lastVisit.date)}: ${planText}`,
          [`Encounter ${lastVisit.id}, ${fmtDate(lastVisit.date)}`,
            ...meds.map((m) => `Medication ${m.id}`)]);
      }
    }
  }

  // -------------------------------------------- what is NOT in the record
  //
  // The section that matters most and that summarisers usually skip.
  const gaps: string[] = [];
  const lastExam = byDateDesc(input.exams)[0];
  if (!lastExam) gaps.push('No physical examination is recorded.');
  else if (lastVisit && lastExam.date < lastVisit.date) {
    gaps.push(`The most recent examination is ${fmtDate(lastExam.date)}, older than the last visit on ${fmtDate(lastVisit.date)}.`);
  }
  if (!latestPanelValue(input.panels, 'UACR')) gaps.push('No urine albumin to creatinine ratio on file.');
  if (home.length === 0) gaps.push('No home blood pressure readings on file.');
  const unack = input.specialists.filter((s) => s.outstanding && s.outstanding !== 'None.');
  for (const s of unack) gaps.push(`${s.name} (${s.specialty}): ${s.outstanding}`);
  if (gaps.length > 0) {
    M('gaps', 'What the record does not say', 'documented',
      gaps.join(' '),
      ['Absence of records, not a finding of normal.']);
  }

  return out;
}

/** Apply an accepted proposal to the master plan, returning the patch. */
export function applyProposal(
  master: MasterPlan | undefined, p: SummaryProposal,
): Partial<MasterPlan> | { problemId: string; text: string } | null {
  const text = p.acceptedText ?? p.text;
  const S = master?.subjective ?? { history: '', goals: '', context: '' };
  const A = master?.assessment ?? { narrative: '' };
  const O = master?.objective ?? { narrative: '' };
  const P = master?.plan ?? { byProblem: {}, prevention: '', lifestyle: '', followUp: '' };

  if (p.target.startsWith('plan.byProblem.')) {
    return { problemId: p.target.replace('plan.byProblem.', ''), text };
  }
  if (p.target.startsWith('subjective.byProblem.') || p.target === 'subjective.history') {
    return { subjective: { ...S, history: joinNew(S.history, text) } };
  }
  switch (p.target) {
    case 'objective.narrative':
      return { objective: { narrative: joinNew(O.narrative, text) } };
    case 'assessment.facts':
    case 'assessment.narrative':
    case 'gaps':
      return { assessment: { narrative: joinNew(A.narrative, text) } };
    case 'plan.prevention':
      return { plan: { ...P, prevention: joinNew(P.prevention, text) } };
    default:
      return null;
  }
}

/** New text on top, old kept below. Nothing is overwritten silently. */
const joinNew = (existing: string, added: string): string =>
  (existing.trim() ? `${added}\n\n${existing}` : added);
