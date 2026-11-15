/**
 * The living subjective, derived.
 *
 * This is the whole claim of the prototype, so it is worth stating
 * plainly: nothing in the subjective section is stored. It is
 * computed from the record every time the chart is opened. There is
 * no summary document to maintain, no draft to accept, and no way for
 * the summary to drift out of date with the chart it describes,
 * because it is not a copy of the chart, it is a reading of it.
 *
 * What it reads, in order of weight: signed visit notes, health
 * updates the patient submitted, messages between the patient and the
 * practice, per problem answers to the questions we send, specialist
 * letters, the measures, and the status of each intervention.
 *
 * Three rules it holds to.
 *
 * It attributes. Every sentence is traceable to records, and the
 * records are listed beside it. A clause built from what the patient
 * said is marked as what the patient said; a clause built from a
 * signed note or a result is marked as documented. The two are never
 * blended into one voice, because they carry different weight and the
 * reader has to be able to tell which one they are acting on.
 *
 * It prefers the recent without discarding the old. A problem's
 * summary leads on the most recent thing said about it and keeps the
 * trajectory behind it, because "A1c 6.9" and "A1c 6.9, down from
 * 8.1 in January" are different clinical facts.
 *
 * It says when it does not know. Silence is reported as silence.
 * Conflict between two sources is reported as conflict rather than
 * resolved by picking the newer one. A measure nobody has taken is
 * never rendered as a normal measure.
 */
import type {
  Condition, DiagnosticStudy, Encounter, LabPanel, LifestyleIntervention,
  Medication, Message, Order, PatientUpdate, PreventionItem, ProblemCheckIn,
  Specialist, VitalsSet,
} from '../domain/types';
import { fmtDate } from './format';

/** Month and year, for the far end of a trajectory. */
const monthYear = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleString('en-GB', { month: 'short', year: 'numeric' });
import { medsAbout, specialistsAbout } from '../screens/chart/relate';
import { LIFESTYLE_DOMAINS } from '../domain/types';

const DOMAIN_LABEL: Record<string, string> = Object.fromEntries(
  LIFESTYLE_DOMAINS.map((d) => [d.id, d.label]),
);

export interface SubjectiveInput {
  patientId: string;
  now: string;
  conditions: Condition[];
  medications: Medication[];
  encounters: Encounter[];
  updates: PatientUpdate[];
  messages: Message[];
  checkIns: ProblemCheckIn[];
  specialists: Specialist[];
  panels: LabPanel[];
  vitals: VitalsSet[];
  studies: DiagnosticStudy[];
  prevention: PreventionItem[];
  lifestyle: LifestyleIntervention[];
  orders: Order[];
}

/** Where a sentence came from. Shown beside it, never collapsed away. */
export interface SourceRef {
  id: string;
  kind: 'visit' | 'update' | 'message' | 'answer' | 'specialist' | 'result' | 'vitals' | 'study';
  date: string;
  label: string;
}

/** One clause, and whether the patient said it or the chart documents it. */
export interface Clause {
  text: string;
  voice: 'patient' | 'documented';
}

export interface ProblemSummary {
  conditionId: string;
  name: string;
  code: string;
  trend: Condition['trend'];
  /** One or two sentences. Patient's experience first, then the record. */
  clauses: Clause[];
  interventions: Intervention[];
  sources: SourceRef[];
  /** Said out loud where two sources do not agree. */
  conflict?: string;
}

export interface Intervention {
  /** What it is, in two or three words. */
  label: string;
  /** How it is going, in two or three more. Kept short on purpose. */
  status: string;
  /** What was actually asked for, or what is in the way. */
  detail?: string;
  tone: 'ok' | 'warn' | 'crit' | 'none';
  /** Who said so and when, because that is half of what it means. */
  attribution?: string;
}

export interface LivingSubjective {
  overall: Clause[];
  overallSources: SourceRef[];
  problems: ProblemSummary[];
  /** The latest record of any kind that fed this. */
  lastSource?: SourceRef;
  /** Everything read, newest first. */
  sources: SourceRef[];
}

const desc = <T extends { date: string }>(xs: T[]): T[] =>
  [...xs].sort((a, b) => b.date.localeCompare(a.date));

const words = (name: string) =>
  name.toLowerCase().split(/[\s,]+/).filter((w) => w.length > 4);

/** Does this free text touch this problem? Diagnosis words, or its drugs. */
const touches = (text: string, c: Condition, meds: Medication[]): boolean => {
  const t = text.toLowerCase();
  return words(c.name).some((w) => t.includes(w))
    || meds.some((m) => t.includes(m.name.toLowerCase()));
};

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/** The first sentence, without its full stop. For embedding in ours. */
const oneSentence = (text: string, max = 120): string => {
  const clean = text.replace(/\s+/g, ' ').trim();
  const stop = clean.search(/[.;]\s/);
  const first = stop > 12 ? clean.slice(0, stop) : clean;
  return (first.length <= max ? first : `${first.slice(0, max).trimEnd()}...`)
    .replace(/[.;,\s]+$/, '');
};

const trimTo = (text: string, max = 260): string => {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const stop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('; '));
  return stop > 80 ? cut.slice(0, stop + 1) : `${cut.trimEnd()}...`;
};

// ------------------------------------------------------------ the work

export function livingSubjective(input: SubjectiveInput): LivingSubjective {
  const updates = desc(input.updates);
  const messages = desc(input.messages);
  const managed = input.conditions.filter((c) => c.managed && c.status === 'active');
  const sources: SourceRef[] = [];

  const ref = (r: SourceRef): SourceRef => { sources.push(r); return r; };

  // ------------------------------------------------- overall, 2 to 3 lines
  const overall: Clause[] = [];
  const overallSources: SourceRef[] = [];

  // 1. how they describe their health, in their words.
  const lastOverall = updates.find((u) => u.overall)
    ?? (input.checkIns.find((c) => c.about.kind === 'overall')
      ? undefined : undefined);
  const overallAnswer = desc(input.checkIns.filter((c) => c.about.kind === 'overall'))[0];
  if (lastOverall?.overall) {
    overall.push({
      voice: 'patient',
      text: `Asked on ${fmtDate(lastOverall.date)} how things were going overall: \u201c${
        cap(trimTo(lastOverall.overall, 220))}\u201d`,
    });
    overallSources.push(ref({
      id: lastOverall.id, kind: 'update', date: lastOverall.date,
      label: `Health update, ${fmtDate(lastOverall.date)}`,
    }));
  } else if (overallAnswer) {
    overall.push({
      voice: 'patient',
      text: `In their own words on ${fmtDate(overallAnswer.date)}: \u201c${
        cap(trimTo(overallAnswer.text, 220))}\u201d`,
    });
    overallSources.push(ref({
      id: overallAnswer.id, kind: 'answer', date: overallAnswer.date,
      label: `Their answer, ${fmtDate(overallAnswer.date)}`,
    }));
  }

  // 2. what they are working toward, taken from what they have asked for
  //    rather than from a goals field somebody filled in once.
  // Only when their own overall answer is missing, because two
  // paragraphs of patient voice is no longer a summary.
  const asks = messages.filter((m) => m.from === 'patient'
    && /would like|want|hoping|can we|could we|rather|ask/i.test(m.body));
  if (asks[0] && overall.length === 0) {
    overall.push({
      voice: 'patient',
      text: `Raised with us on ${fmtDate(asks[0].date)}: ${trimTo(asks[0].body, 200)}`,
    });
    overallSources.push(ref({
      id: asks[0].id, kind: 'message', date: asks[0].date,
      label: `Message, ${fmtDate(asks[0].date)}`,
    }));
  }

  if (overall.length === 0) {
    overall.push({
      voice: 'patient',
      text: 'They have not been asked, or have not answered, how their health is going overall.',
    });
  }

  // 3. our reading: what has changed since the visit before last.
  const movement = describeMovement(input);
  if (movement) {
    overall.push({ voice: 'documented', text: movement.text });
    overallSources.push(...movement.sources.map(ref));
  }

  // 4. and what is not settled. Said last because it is what the visit
  //    is for, and first in the eye because it is the only warning here.
  const open = outstanding(input);
  if (open) overall.push({ voice: 'documented', text: open });

  // --------------------------------------------------- problem by problem
  const problems = managed.map((c) => problemSummary(c, input, ref));

  const all = desc(sources);
  return {
    overall, overallSources, problems,
    lastSource: all[0],
    sources: all,
  };
}

// ----------------------------------------------------------- the pieces

/** What the numbers did, in one sentence, or nothing. */
function describeMovement(
  input: SubjectiveInput,
): { text: string; sources: SourceRef[] } | undefined {
  const sources: SourceRef[] = [];
  const bits: string[] = [];

  const series = (key: string, label: string, unit = '') => {
    const hits = desc(input.panels).filter((p) => p.values.some((v) => v.key === key));
    if (hits.length < 2) return;
    const now = hits[0].values.find((v) => v.key === key)!;
    const then = hits[hits.length - 1].values.find((v) => v.key === key)!;
    if (now.value === then.value) return;
    bits.push(`${label} ${then.value}${unit} in ${monthYear(hits[hits.length - 1].date)} to ${now.value}${unit} on ${fmtDate(hits[0].date)}`);
    sources.push({
      id: hits[0].id, kind: 'result', date: hits[0].date,
      label: `${hits[0].name}, ${fmtDate(hits[0].date)}`,
    });
  };
  series('A1c', 'A1c', '%');
  series('LDL', 'LDL');

  const office = desc(input.vitals.filter((v) => v.source === 'office'));
  if (office.length >= 2 && office[0].systolic && office[office.length - 1].systolic) {
    const a = office[office.length - 1];
    const b = office[0];
    if (Math.abs((b.systolic ?? 0) - (a.systolic ?? 0)) >= 5) {
      bits.push(`blood pressure ${a.systolic}/${a.diastolic} to ${b.systolic}/${b.diastolic}`);
      sources.push({
        id: b.id, kind: 'vitals', date: b.date, label: `Vitals, ${fmtDate(b.date)}`,
      });
    }
  }
  if (bits.length === 0) return undefined;
  return {
    text: `On the record, ${bits.join(', ')}.`,
    sources,
  };
}

/** The one or two things genuinely unsettled, or nothing. */
function outstanding(input: SubjectiveInput): string | undefined {
  const bits: string[] = [];
  const overdue = input.prevention.filter((x) => x.status === 'overdue');
  if (overdue.length > 0) {
    bits.push(`${overdue.map((x) => x.name.toLowerCase()).join(' and ')} overdue`);
  }
  const waiting = input.specialists.filter(
    (s) => s.outstanding && s.outstanding !== 'None.',
  );
  if (waiting.length > 0) bits.push(`waiting on ${waiting[0].specialty.toLowerCase()}`);
  const notTaking = input.medications.filter(
    (m) => m.status === 'active' && m.adherence && m.adherence.status !== 'taking',
  );
  if (notTaking.length > 0) {
    bits.push(`${notTaking.map((m) => m.name).join(' and ')} not being taken as written`);
  }
  if (bits.length === 0) return undefined;
  return `Unsettled: ${bits.join('; ')}.`;
}

/**
 * One problem, in two sentences.
 *
 * The shape is deliberate and it is not extraction. An earlier version
 * quoted the patient verbatim and then stacked dated fragments from
 * the notes underneath, which is a transcript, not a summary: it grows
 * with the record instead of staying the same length, and the reader
 * has to do the synthesis the screen was supposed to do.
 *
 * So each problem gets one sentence of what the patient reports and
 * one of what the encounters document, both composed from structured
 * signals rather than copied. The verbatim words are not lost; they
 * are one click away in the encounter the sentence came from, which
 * is where they belong. What stays on this page is the reading.
 *
 * The two sentences stay separate rather than being merged, because
 * one is testimony and one is finding, and a paragraph that blends
 * them cannot be checked.
 */
function problemSummary(
  c: Condition,
  input: SubjectiveInput,
  ref: (r: SourceRef) => SourceRef,
): ProblemSummary {
  const mine = medsAbout(c.name, input.medications.filter((m) => m.status !== 'stopped'));
  const clauses: Clause[] = [];
  const sources: SourceRef[] = [];

  const answer = desc(input.checkIns.filter(
    (x) => x.about.kind === 'condition' && x.about.id === c.id,
  ))[0];
  const msg = desc(input.messages.filter(
    (m) => m.from === 'patient'
      && ((m.about ?? []).includes(c.id) || touches(m.body, c, mine)),
  ))[0];
  const forThis = input.lifestyle.filter((x) => x.forConditions.includes(c.id));

  // ----------------------------------------------- what the patient reports
  {
    const bits: string[] = [];
    if (answer) {
      bits.push(
        answer.feeling === 'better' ? 'this is going better'
          : answer.feeling === 'worse' ? 'this is worse'
            : answer.feeling === 'unsure' ? 'they are not sure how this is going'
              : 'this is much the same',
      );
      if (answer.onPlan === 'yes') bits.push('and that they are doing the plan as agreed');
      else if (answer.onPlan === 'partly') bits.push('and that they are doing some of the plan');
      else if (answer.onPlan === 'no') bits.push('and that they are not doing the plan at the moment');
      sources.push(ref({
        id: answer.id, kind: 'answer', date: answer.date,
        label: `Their answer about ${c.name}, ${fmtDate(answer.date)}`,
      }));
    }

    // What they say is in the way, taken from the prescriptions they
    // have told us are not going rather than from a guess.
    // Which struggle to name, when there is more than one. What they
    // told us they are not doing beats what we recorded as stalled,
    // and a prescription that never started beats one that is partly
    // happening, because the first is the bigger gap.
    const saidNo = new Set(input.checkIns
      .filter((x) => x.about.kind === 'lifestyle' && x.onPlan === 'no')
      .map((x) => (x.about as { id: string }).id));
    const rank = (x: LifestyleIntervention) =>
      (saidNo.has(x.id) ? 0 : x.status === 'not-started' ? 1 : 2);
    const stuck = forThis
      .filter((x) => x.status === 'struggling' || x.status === 'not-started' || saidNo.has(x.id))
      .sort((a, b) => rank(a) - rank(b));
    // Named by its domain rather than by its text. A prescription
    // reads as a thing to do, not as a thing to struggle with, and
    // "struggling with something hot and real on her mother's nights"
    // is the kind of sentence that tells you a machine wrote it.
    const struggle = stuck[0]
      ? lower(DOMAIN_LABEL[stuck[0].domain] ?? stuck[0].domain)
      : undefined;
    const why = stuck[0]?.barrier;
    const sentence = bits.length > 0
      ? `Patient reports ${bits.join(' ')}${
        struggle ? `, but continues to struggle with ${struggle}` : ''}.${
        why ? ` ${oneSentence(why, 110)}.` : ''}`
      : struggle
        ? `Patient has told us they are struggling with ${struggle}.${
          why ? ` ${oneSentence(why, 110)}.` : ''}`
        : 'Nothing on file from the patient about this problem.';
    clauses.push({ voice: 'patient', text: sentence });

    if (msg) {
      clauses.push({
        voice: 'patient',
        text: `Wrote in on ${fmtDate(msg.date)} about ${lower(msg.subject ?? 'this')}.`,
      });
      sources.push(ref({
        id: msg.id, kind: 'message', date: msg.date, label: `Message, ${fmtDate(msg.date)}`,
      }));
    }
  }

  // ------------------------------------------- what the encounters document
  {
    const bits: string[] = [];

    // Adherence, as last reported rather than as prescribed.
    const reported = mine.filter((m) => m.adherence);
    const off = reported.filter((m) => m.adherence!.status !== 'taking');
    if (off.length > 0) {
      bits.push(`${list(off.map((m) => m.name))} not being taken as written`);
    } else if (reported.length > 0) {
      bits.push(`${reported.length > 1 ? 'medicines' : `${reported[0].name}`} being taken as prescribed`);
    } else if (mine.length > 0) {
      bits.push('adherence never asked about');
    }

    // A drug that came off, and why. Old, and still the context.
    const stopped = desc(
      medsAbout(c.name, input.medications.filter((m) => m.status === 'stopped' && m.changeNote))
        .map((m) => ({ ...m, date: m.stopped ?? m.started })),
    )[0];
    if (stopped) {
      bits.push(`${lower(stopped.name)} stopped in ${monthYear(stopped.date)} after ${
        lower(oneSentence(stripStopped(stopped.changeNote ?? ''), 110))}`);
    }

    // The direction of the measure, in words rather than a reading.
    const trajectory = measureLine(c, input);
    if (trajectory?.movement) bits.push(trajectory.movement);

    // Last, the visit's own one line, where nothing above covered it.
    const notes = desc(input.encounters.filter((e) => e.status === 'signed'))
      .filter((e) => {
        const txt = [
          e.note?.subjective.additional, e.note?.subjective.reason,
          e.note?.assessment.overall,
        ].filter(Boolean).join(' ');
        return txt.length > 0 && touches(txt, c, mine);
      });
    if (notes[0]) {
      sources.push(ref({
        id: notes[0].id, kind: 'visit', date: notes[0].date,
        label: `Visit note, ${fmtDate(notes[0].date)}`,
      }));
      if (bits.length === 0) {
        const said = notes[0].note?.assessment.overall
          ?? notes[0].note?.subjective.additional ?? '';
        bits.push(lower(trimTo(said, 180)));
      }
    }

    if (bits.length > 0) {
      clauses.push({
        voice: 'documented',
        text: `${notes.length > 1 ? `Across ${notes.length} encounters the record documents`
          : 'The record documents'} ${list(bits)}.`,
      });
    } else {
      clauses.push({
        voice: 'documented',
        text: 'Nothing in the notes on file speaks to this problem directly. It has been carried rather than worked on.',
      });
    }

    // The measure itself, as a number, after the reading of it.
    const trajectory2 = measureLine(c, input);
    if (trajectory2) {
      clauses.push({ voice: 'documented', text: trajectory2.text });
      sources.push(...trajectory2.sources.map(ref));
    }
  }

  let conflict: string | undefined;
  if (answer) {
    if (c.trend === 'improving' && answer.feeling === 'worse') {
      conflict = 'The record has this improving and they say it is worse.';
    } else if (c.trend === 'stable' && answer.feeling === 'worse') {
      conflict = 'Recorded as stable, reported as worse.';
    } else if (c.trend === 'worsening' && answer.feeling === 'better') {
      conflict = 'The numbers are worse and they feel better.';
    }
  }

  return {
    conditionId: c.id,
    name: c.name,
    code: c.code,
    trend: c.trend,
    clauses,
    interventions: interventionsFor(c, input, ref),
    sources,
    conflict,
  };
}

const lower = (s: string) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);

/** Change notes usually open with "Stopped <month>"; the sentence already said that. */
const stripStopped = (s: string) =>
  s.replace(/^stopped\s+\w+\s+\d{4}\.?\s*/i, '').replace(/^stopped\s*/i, '');

const list = (xs: string[]): string =>
  (xs.length <= 1 ? (xs[0] ?? '')
    : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);

/**
 * The measure a problem is judged on: the number, and the direction.
 *
 * `movement` is the direction in words, for the sentence that reads
 * the record. `text` is the value with its trajectory, for the line
 * underneath. They are separate because "improving" and "6.9, from
 * 8.1 in January" answer different questions and a reader needs both.
 */
function measureLine(
  c: Condition, input: SubjectiveInput,
): { text: string; movement?: string; sources: SourceRef[] } | undefined {
  const KEY: Record<string, [string, string, string, boolean]> = {
    'Type 2 diabetes mellitus': ['A1c', 'A1c', '%', true],
    Prediabetes: ['A1c', 'A1c', '%', true],
    'Mixed hyperlipidemia': ['LDL', 'LDL', '', true],
    'Chronic kidney disease, stage 3a': ['eGFR', 'eGFR', '', false],
    Hypothyroidism: ['TSH', 'TSH', '', true],
  };
  const spec = KEY[c.name];
  if (spec) {
    const [key, label, unit, lowerIsBetter] = spec;
    const hits = desc(input.panels).filter((p) => p.values.some((v) => v.key === key));
    if (hits.length === 0) {
      return {
        text: `No ${label} on file, which is the measure this problem is judged on.`,
        sources: [],
      };
    }
    const now = hits[0].values.find((v) => v.key === key)!;
    const then = hits[hits.length - 1].values.find((v) => v.key === key)!;
    const delta = Math.round((now.value - then.value) * 10) / 10;
    const better = lowerIsBetter ? delta < 0 : delta > 0;
    return {
      text: hits.length > 1 && delta !== 0
        ? `${label} ${now.value}${unit} on ${fmtDate(hits[0].date)}, from ${then.value}${unit} in ${monthYear(hits[hits.length - 1].date)}.`
        : `${label} ${now.value}${unit} on ${fmtDate(hits[0].date)}, the only value on file.`,
      movement: hits.length > 1 && delta !== 0
        ? `the ${label} ${better ? 'improving' : 'worsening'} by ${Math.abs(delta)}${unit} since ${monthYear(hits[hits.length - 1].date)}`
        : undefined,
      sources: [{
        id: hits[0].id, kind: 'result', date: hits[0].date,
        label: `${hits[0].name}, ${fmtDate(hits[0].date)}`,
      }],
    };
  }
  if (c.name === 'Essential hypertension') {
    const office = desc(input.vitals.filter((v) => v.source === 'office'));
    const home = desc(input.vitals.filter((v) => v.source === 'home' && v.systolic));
    if (office.length === 0) return undefined;
    const first = office[office.length - 1];
    const drop = (first.systolic ?? 0) - (office[0].systolic ?? 0);
    const homeLine = home.length > 0
      ? ` Home readings average ${Math.round(
        home.reduce((a, h) => a + (h.systolic ?? 0), 0) / home.length,
      )} systolic over ${home.length}.`
      : ' No home readings on file.';
    return {
      text: `${office[0].systolic}/${office[0].diastolic} in clinic on ${fmtDate(office[0].date)}${
        office[1]?.systolic ? `, from ${office[1].systolic}/${office[1].diastolic}` : ''}.${homeLine}`,
      movement: office.length > 1 && Math.abs(drop) >= 5
        ? `the blood pressure ${drop > 0 ? 'down' : 'up'} ${Math.abs(drop)} systolic since ${monthYear(first.date)}`
        : undefined,
      sources: [{
        id: office[0].id, kind: 'vitals', date: office[0].date,
        label: `Vitals, ${fmtDate(office[0].date)}`,
      }],
    };
  }
  return undefined;
}

/**
 * The status of everything being done about one problem.
 *
 * This is the half of a problem summary that prose keeps losing. A
 * paragraph can say "working on diet and exercise" for two years
 * without anybody noticing that the referral was never booked, and a
 * list cannot.
 */
function interventionsFor(
  c: Condition, input: SubjectiveInput, ref: (r: SourceRef) => SourceRef,
): Intervention[] {
  const out: Intervention[] = [];
  const mine = medsAbout(c.name, input.medications.filter((m) => m.status !== 'stopped'));

  for (const m of mine) {
    const a = m.adherence;
    out.push({
      label: `${m.name}${m.dose ? ` ${m.dose}` : ''}`,
      status: a
        ? (a.status === 'taking' ? 'Taking as prescribed'
          : a.status === 'missing-some' ? 'Missing some' : 'Not taking')
        : 'Never asked about',
      detail: a?.note ?? (a ? undefined : m.sig),
      tone: a
        ? (a.status === 'taking' ? 'ok' : a.status === 'missing-some' ? 'warn' : 'crit')
        : 'warn',
      attribution: a ? `${a.by === 'patient' ? 'their report' : 'clinician'}, ${fmtDate(a.reported)}` : undefined,
    });
  }

  for (const li of input.lifestyle.filter((x) => x.forConditions.includes(c.id))) {
    const answer = desc(input.checkIns.filter(
      (x) => x.about.kind === 'lifestyle' && x.about.id === li.id,
    ))[0];
    out.push({
      label: DOMAIN_LABEL[li.domain] ?? li.domain,
      status: answer
        ? (answer.onPlan === 'yes' ? 'Doing it'
          : answer.onPlan === 'partly' ? 'Partly' : 'Not doing it')
        : li.status === 'achieved' ? 'Achieved'
          : li.status === 'struggling' ? 'Struggling'
            : li.status === 'not-started' ? 'Written, never started'
              : 'In progress',
      detail: oneSentence(li.prescription, 90)
        + (li.barrier ? `. ${oneSentence(li.barrier, 80)}` : ''),
      tone: li.status === 'achieved' ? 'ok'
        : li.status === 'struggling' || li.status === 'not-started' ? 'warn' : 'none',
      attribution: answer
        ? `their report, ${fmtDate(answer.date)}`
        : li.reviewed ? `reviewed ${fmtDate(li.reviewed)}` : undefined,
    });
    if (answer) {
      ref({
        id: answer.id, kind: 'answer', date: answer.date,
        label: `Their answer about ${li.prescription.split('.')[0]}, ${fmtDate(answer.date)}`,
      });
    }
  }

  // Home monitoring, where it is part of the plan for this problem.
  if (c.name === 'Essential hypertension' || c.name === 'Type 2 diabetes mellitus') {
    const home = desc(input.vitals.filter((v) => v.source === 'home'));
    const label = c.name === 'Essential hypertension' ? 'Home blood pressure' : 'Home glucose';
    if (c.name === 'Essential hypertension') {
      out.push({
        label,
        status: home.length === 0
          ? 'Asked for, nothing received'
          : `${home.length} readings, most recent ${fmtDate(home[0].date)}`,
        tone: home.length === 0 ? 'warn' : home.length >= 4 ? 'ok' : 'none',
      });
    }
  }

  // Specialists who look after this problem.
  for (const s of specialistsAbout(c.name, input.specialists)) {
    out.push({
      label: `${s.specialty}, ${s.name}`,
      status: s.outstanding && s.outstanding !== 'None.'
        ? s.outstanding
        : s.lastSeen ? `Seen ${fmtDate(s.lastSeen)}. Nothing outstanding.` : 'Referred.',
      tone: s.outstanding && s.outstanding !== 'None.' ? 'warn' : 'ok',
    });
    if (s.lastSeen) {
      ref({
        id: s.id, kind: 'specialist', date: s.lastSeen,
        label: `${s.specialty} letter, ${fmtDate(s.lastSeen)}`,
      });
    }
  }

  // Testing and referrals out for this problem.
  for (const o of input.orders.filter((x) => x.status !== 'done')) {
    const t = o.text.toLowerCase();
    const hit = words(c.name).some((w) => t.includes(w))
      || mine.some((m) => t.includes(m.name.toLowerCase()));
    if (!hit) continue;
    out.push({
      label: o.text,
      status: o.status === 'draft' ? 'Written, not sent' : `Out since ${fmtDate(o.created)}`,
      tone: o.status === 'draft' ? 'warn' : 'none',
    });
  }

  return out;
}
