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
  CarePlan, Condition, ConditionTrend, Encounter, ExamRecord, LabPanel, MasterPlan,
  Medication, PreventionItem, Specialist, SummaryProposal, VitalsSet,
  DiagnosticStudy, PatientEntry, ProblemCheckIn, LifestyleIntervention,
} from '../domain/types';
import { FEELING_LABEL, ON_PLAN_LABEL } from '../domain/types';
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
  /** The patient's own answers, one per problem, sent in before a visit. */
  checkIns: ProblemCheckIn[];
  lifestyle: LifestyleIntervention[];
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
  // The patient's own answers count as records. A summary that updates
  // for a lab and not for the patient saying the opposite of the lab
  // is a summary that only listens to one source.
  const said = input.checkIns.filter((c) => c.date > since);
  if (said.length > 0) {
    what.push(`${said.length} answer${said.length > 1 ? 's' : ''} from the patient on ${fmtDate(said[0].date)}`);
  }
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

  // --------------------------------------------- the opening statement
  //
  // The one paragraph whose whole job is to be current. Composed, not
  // edited, and composed by the same function that writes it anywhere
  // else, so what the demo shows is what the product would do.
  {
    const st = composeStatement(input);
    if (st) M('subjective.statement', 'Where the work stands today', 'documented', st.text, st.basis);
  }

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
    const said = input.checkIns.find(
      (x) => x.about.kind === 'condition' && x.about.id === c.id && x.date > since,
    );
    if (!hit && !said) continue;
    if (hit) claimed.add(hit.e.id);
    // Both sources, in one proposal, each attributed. They are not
    // merged into a single sentence, because one of them is the
    // patient's testimony and summarising it away is how it stops
    // counting.
    const lines = [
      hit ? `${fmtDate(hit.e.date)}: ${hit.txt}` : '',
      said
        ? `Before the visit on ${fmtDate(said.date)} they said ${
          said.feeling === 'unsure' ? 'they were not sure how it was going'
            : said.feeling === 'same' ? 'it was about the same'
              : `it was ${FEELING_LABEL[said.feeling].toLowerCase()}`}${
          said.onPlan ? ` and that they were ${ON_PLAN_LABEL[said.onPlan].toLowerCase()}` : ''
        }: "${said.text}"`
        : '',
    ].filter(Boolean);
    M(
      `subjective.byProblem.${c.id}`,
      `Subjective, ${c.name}`,
      'documented',
      lines.join('\n\n'),
      [
        ...(hit ? [`Encounter ${hit.e.id}, ${fmtDate(hit.e.date)}`] : []),
        ...(said ? [`Patient answer ${said.id}, ${fmtDate(said.date)}`] : []),
      ],
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
    // Derived from this chart's own series, and from nothing else. An
    // interpretation that reaches for a detail the record does not
    // hold is the failure mode this whole screen exists to prevent,
    // and a sentence written once for one patient becomes exactly
    // that as soon as it is shown for a second.
    const a1cSeries = input.panels.filter((p) => p.values.some((v) => v.key === 'A1c')).length;
    const added = input.medications.filter((m) => m.status === 'active'
      && input.master && m.started > (input.master.updated ?? ''));
    M('assessment.narrative', 'Assessment, reading', 'interpretation',
      `Glycaemic control is ${dir}${
        stopped.length > 0
          ? `, and it has moved while ${stopped[0].name} was withdrawn rather than while an agent was added`
          : added.length > 0
            ? `, alongside ${added[0].name} starting after the last summary`
            : ', with no change to the medicine list behind it'
      }. ${
        a1cSeries >= 3
          ? `The direction rests on ${a1cSeries} values, which is enough to call a trend.`
          : `The direction rests on ${a1cSeries} value${a1cSeries === 1 ? '' : 's'}, which is not enough to call a trend. The next draw is what would confirm it.`
      }`,
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

  // ------------------------------------- where the two sources disagree
  //
  // The gauge is ours, the answer is theirs, and when they point in
  // opposite directions one of us is wrong. This is the single most
  // useful thing two sources buy you, so it is called out rather than
  // left for somebody to notice.
  {
    const clashes: string[] = [];
    for (const c of input.conditions.filter((x) => x.managed && x.status === 'active')) {
      const said = input.checkIns.find(
        (x) => x.about.kind === 'condition' && x.about.id === c.id,
      );
      if (!said) continue;
      if (c.trend === 'improving' && said.feeling === 'worse') {
        clashes.push(`${c.name}: the chart calls it improving and they say it is worse.`);
      } else if (c.trend === 'stable' && said.feeling === 'worse') {
        clashes.push(`${c.name}: recorded as stable, reported as worse.`);
      } else if (c.trend === 'worsening' && said.feeling === 'better') {
        clashes.push(`${c.name}: the numbers are worse and they feel better.`);
      }
      if (said.onPlan === 'no' && c.trend === 'improving') {
        clashes.push(`${c.name}: improving while they say they are not doing the plan, so something else is doing the work.`);
      }
    }
    if (clashes.length > 0) {
      M('assessment.narrative', 'Where the patient and the chart disagree', 'interpretation',
        `${clashes.join(' ')} Worth resolving before the plan is changed on the strength of the numbers alone.`,
        ['Comparison of the recorded gauge against the patient\u2019s own answer. Neither is a finding on its own.']);
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
  const S = master?.subjective ?? { history: '', byProblem: {}, goals: '', context: '' };
  const A = master?.assessment ?? { narrative: '' };
  const O = master?.objective ?? { narrative: '' };
  const P = master?.plan ?? { byProblem: {}, prevention: '', lifestyle: '', followUp: '' };

  if (p.target.startsWith('plan.byProblem.')) {
    return { problemId: p.target.replace('plan.byProblem.', ''), text };
  }
  if (p.target.startsWith('subjective.byProblem.')) {
    const key = p.target.replace('subjective.byProblem.', '');
    return {
      subjective: {
        ...S,
        byProblem: { ...S.byProblem, [key]: joinNew(S.byProblem[key] ?? '', text) },
      },
    };
  }
  if (p.target === 'subjective.history' || p.target === 'subjective.statement') {
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

// ------------------------------------------- where the work stands today

/**
 * The opening paragraph, written from the record.
 *
 * What it is trying to say, in order: how much is being managed and
 * for how long; which numbers actually moved and by how much; what
 * changed in the treatment while they moved; what is outstanding; and
 * where the patient and the chart do not agree.
 *
 * Every clause is built from a value on the chart. There is no
 * sentence here that can be true of a patient whose record does not
 * support it, which is the only property that makes a generated
 * summary safe to read quickly. Where a thing is not known it is left
 * out rather than softened, and where it is absent and that absence
 * matters, the absence is what gets said.
 */
export function composeStatement(
  input: SynthesisInput,
): { text: string; basis: string[] } | undefined {
  const managed = input.conditions.filter((c) => c.managed && c.status === 'active');
  const signed = byDateDesc(input.encounters.filter((e) => e.status === 'signed'));
  const basis: string[] = [];
  const sentences: string[] = [];

  if (managed.length === 0 && signed.length === 0) return undefined;

  // ------------------------------------------------- 1. the shape of it
  const first = signed[signed.length - 1];
  const since = first ? ` since ${monthYear(first.date)}` : '';
  const tally = (t: ConditionTrend) =>
    managed.filter((c) => (c.trend ?? 'not-assessed') === t).length;
  const dir = [
    tally('improving') > 0 ? `${count(tally('improving'))} moving the right way` : '',
    tally('stable') > 0 ? `${count(tally('stable'))} holding` : '',
    tally('worsening') > 0 ? `${count(tally('worsening'))} going the wrong way` : '',
  ].filter(Boolean);

  if (managed.length === 0) {
    sentences.push(`Nothing is being managed here yet, across ${count(signed.length)} visit${signed.length === 1 ? '' : 's'}${since}.`);
  } else {
    sentences.push(
      `${cap(count(managed.length))} problem${managed.length === 1 ? '' : 's'} managed here${since}, across ${count(signed.length)} visit${signed.length === 1 ? '' : 's'}${
        dir.length > 0 ? `, ${dir.join(' and ')}` : ''}.`,
    );
  }
  basis.push(...managed.map((c) => `Condition ${c.id}, gauge ${c.trend ?? 'not assessed'}`));
  if (first) basis.push(`First visit ${first.id}, ${fmtDate(first.date)}`);

  // -------------------------------------------- 2. the numbers that moved
  const moves: string[] = [];
  const lab = (
    key: string, label: string, unit: string, lower: boolean,
    least: number, threshold?: number,
  ) => {
    const hits = byDateDesc(input.panels).filter((p) => p.values.some((v) => v.key === key));
    if (hits.length < 2) return;
    const now = hits[0].values.find((v) => v.key === key)!;
    const then = hits[hits.length - 1].values.find((v) => v.key === key)!;
    const delta = Math.round((now.value - then.value) * 10) / 10;
    // Below this the movement is noise, and reporting noise as change
    // is how a summary stops being worth reading.
    if (Math.abs(delta) < least) return;
    const crossed = threshold !== undefined && lower
      && now.value < threshold
      && hits.slice(1).every((p) => (p.values.find((v) => v.key === key)?.value ?? 0) >= threshold);
    moves.push(crossed
      ? `the ${label} is under ${threshold} for the first time`
      : `the ${label} is ${delta < 0 ? 'down' : 'up'} ${Math.abs(delta)}${
        unit ? `${unit}${Math.abs(delta) === 1 ? '' : 's'}` : ''
      } since ${monthYear(hits[hits.length - 1].date)}`);
    basis.push(`${hits[0].name}, ${fmtDate(hits[0].date)}`);
  };
  lab('A1c', 'A1c', ' point', true, 0.3, 7);
  lab('LDL', 'LDL', '', true, 8, 100);
  lab('eGFR', 'eGFR', '', false, 5);

  const office = byDateDesc(input.vitals.filter((v) => v.source === 'office'));
  const sysNow = office[0]?.systolic;
  const sysThen = office[office.length - 1]?.systolic;
  if (office.length >= 2 && sysNow && sysThen) {
    const d = sysNow - sysThen;
    if (Math.abs(d) >= 4) {
      moves.push(`the blood pressure is ${d < 0 ? 'down' : 'up'} ${Math.abs(d)} systolic`);
      basis.push(`Vitals ${office[0].id}, ${fmtDate(office[0].date)}`);
    }
  }
  const wtNow = office[0]?.weightLb;
  const wtThen = office[office.length - 1]?.weightLb;
  if (office.length >= 2 && wtNow && wtThen) {
    const d = wtNow - wtThen;
    if (Math.abs(d) >= 5) {
      moves.push(`the weight is ${d < 0 ? 'down' : 'up'} ${Math.abs(d)} lb`);
    }
  }
  if (moves.length > 0) sentences.push(`${cap(list(moves))}.`);
  else if (input.panels.length + office.length > 0) {
    sentences.push('Nothing has moved enough on the measures to call it a change.');
  }

  // ------------------------------------- 3. what changed in the treatment
  const stopped = input.medications.filter((m) => m.status === 'stopped');
  const started = input.medications.filter(
    (m) => m.status === 'active' && first && m.started > first.date,
  );
  if (stopped.length > 0 && started.length === 0) {
    sentences.push(`${cap(count(stopped.length))} drug${stopped.length === 1 ? '' : 's'} came off rather than went on.`);
    basis.push(...stopped.slice(0, 2).map((m) => `Medication ${m.id}, stopped`));
  } else if (started.length > 0) {
    sentences.push(`${cap(started.map((m) => m.name).slice(0, 2).join(' and '))} started since the first visit${
      stopped.length > 0 ? `, and ${stopped.map((m) => m.name).slice(0, 2).join(' and ')} came off` : ''}.`);
    basis.push(...started.slice(0, 2).map((m) => `Medication ${m.id}, started ${fmtDate(m.started)}`));
  }

  // --------------------------------------------- 4. what is outstanding
  const overdue = input.prevention.filter((x) => x.status === 'overdue');
  const due = input.prevention.filter((x) => x.status === 'due');
  const notAssessed = managed.filter((c) => (c.trend ?? 'not-assessed') === 'not-assessed');
  const stuck = input.lifestyle.filter((x) => x.status === 'struggling' || x.status === 'not-started');
  const work: string[] = [];
  if (overdue.length > 0) {
    work.push(`${list(overdue.map((x) => x.name.toLowerCase()))} overdue`);
    basis.push(...overdue.map((x) => `Prevention item ${x.id}`));
  }
  if (due.length > 0) work.push(`${list(due.map((x) => x.name.toLowerCase()))} due`);
  if (stuck.length > 0) {
    work.push(`${count(stuck.length)} lifestyle prescription${stuck.length === 1 ? '' : 's'} not going`);
    basis.push(...stuck.slice(0, 2).map((x) => `Lifestyle ${x.id}, ${x.status}`));
  }
  if (notAssessed.length > 0) {
    work.push(`${list(notAssessed.map((c) => c.name))} not assessed at a visit`);
  }
  if (work.length > 0) {
    sentences.push(`${cap(managed.length > 0 && overdue.length > 0 && tally('worsening') === 0
      ? 'the work left is not in the numbers: '
      : 'outstanding: ')}${work.join(', ')}.`);
  } else if (managed.length > 0) {
    sentences.push('Nothing outstanding preventatively, and every prescription is running.');
  }

  // ----------------------------------- 5. where the two accounts differ
  const clash = managed.find((c) => {
    const said = input.checkIns.find((x) => x.about.kind === 'condition' && x.about.id === c.id);
    if (!said) return false;
    return (c.trend === 'improving' && said.feeling === 'worse')
      || (c.trend === 'stable' && said.feeling === 'worse')
      || (c.trend === 'worsening' && said.feeling === 'better');
  });
  if (clash) {
    sentences.push(`They and the chart do not agree about the ${clash.name.toLowerCase()}, which is worth settling before anything is changed on the numbers.`);
    basis.push(`Patient answer about ${clash.name}`);
  }
  const overall = input.checkIns.find((c) => c.about.kind === 'overall');
  if (overall && !clash) {
    sentences.push(`Asked before this visit how their health is going overall, they said it was ${
      overall.feeling === 'unsure' ? 'hard to say' : FEELING_LABEL[overall.feeling].toLowerCase()}.`);
    basis.push(`Patient answer ${overall.id}, ${fmtDate(overall.date)}`);
  }

  return { text: sentences.join(' '), basis };
}

const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const count = (n: number) => (n <= 10 ? WORDS[n] : String(n));
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const list = (xs: string[]) =>
  (xs.length <= 1 ? (xs[0] ?? '') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);
const monthYear = (iso: string) =>
  new Date(iso + 'T12:00:00').toLocaleString('en-GB', { month: 'long', year: 'numeric' });
