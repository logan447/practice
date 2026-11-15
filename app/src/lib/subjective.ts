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
import { medsAbout } from '../screens/chart/relate';
import { LIFESTYLE_DOMAINS } from '../domain/types';
import { interventionsFor } from './interventions';
import type { Intervention } from './interventions';

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
  goal: Condition['goal'];
  /** One or two sentences. Patient's experience first, then the record. */
  clauses: Clause[];
  interventions: Intervention[];
  sources: SourceRef[];
  /** Said out loud where two sources do not agree. */
  conflict?: string;
}

export type { Intervention } from './interventions';

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

  // ------------------------------------------- overall, three sentences
  //
  // The same shape as a problem summary, because a reader who has
  // learned one shape should not have to learn a second one four
  // lines later: what the patient reports, what the chart review
  // shows, then one line handing over to the problems below.
  const overall: Clause[] = [];
  const overallSources: SourceRef[] = [];

  // --- 1. what they report
  {
    const lastUpdate = updates.find((u) => u.overall);
    const overallAnswer = desc(input.checkIns.filter((c) => c.about.kind === 'overall'))[0];
    const said = lastUpdate?.overall ?? overallAnswer?.text;
    const feeling = lastUpdate?.feeling ?? overallAnswer?.feeling;
    const src = lastUpdate
      ? { id: lastUpdate.id, kind: 'update' as const, date: lastUpdate.date,
        label: `Health update, ${fmtDate(lastUpdate.date)}` }
      : overallAnswer
        ? { id: overallAnswer.id, kind: 'answer' as const, date: overallAnswer.date,
          label: `Their answer, ${fmtDate(overallAnswer.date)}` }
        : undefined;

    // What they want is taken from the sentence where they asked for
    // something, in an update or a message, rather than from a goals
    // field somebody filled in once a year ago.
    const asked = askFor(said) ?? askFor(
      messages.find((m) => m.from === 'patient' && ASK.test(m.body))?.body,
    );
    const askSrc = !askFor(said)
      ? messages.find((m) => m.from === 'patient' && ASK.test(m.body))
      : undefined;

    if (feeling || said) {
      overall.push({
        voice: 'patient',
        text: `Patient reports ${
          feeling === 'better' ? 'things are better overall'
            : feeling === 'worse' ? 'things are worse overall'
              : feeling === 'unsure' ? 'they are not sure how things are going overall'
                : 'things are much the same overall'
        }.${asked ? ` Their priority: ${lower(asked)}.` : ''}`,
      });
      if (src) overallSources.push(ref(src));
      if (askSrc) {
        overallSources.push(ref({
          id: askSrc.id, kind: 'message', date: askSrc.date,
          label: `Message, ${fmtDate(askSrc.date)}`,
        }));
      }
    } else {
      // No intake on file is a different fact from no answer, and the
      // chart should say which one it is.
      const booked = input.encounters.find((e) => e.status !== 'signed');
      overall.push({
        voice: 'patient',
        text: booked
          ? `No intake on file yet. First visit booked for ${fmtDate(booked.date)}.`
          : 'No intake on file yet, and nothing booked.',
      });
    }
  }

  // --- 2. what the chart review shows
  {
    const bits: string[] = [];
    const lastVisit = desc(input.encounters.filter((e) => e.status === 'signed'))[0];
    if (lastVisit) {
      bits.push(`last seen ${fmtDate(lastVisit.date)}`);
      overallSources.push(ref({
        id: lastVisit.id, kind: 'visit', date: lastVisit.date,
        label: `Visit note, ${fmtDate(lastVisit.date)}`,
      }));
    }
    // Deltas rather than from and to, and at most two of them: the
    // full trajectories are a line away under each problem.
    const movement = describeMovement(input);
    if (movement) {
      bits.push(...movement.deltas.slice(0, 2));
      overallSources.push(...movement.sources.map(ref));
    }
    const open = outstandingBits(input);
    if (bits.length > 0 || open.length > 0) {
      overall.push({
        voice: 'documented',
        text: `Chart review shows ${list(bits)}${
          bits.length > 0 && open.length > 0 ? '. Outstanding: ' : open.length > 0 ? 'outstanding ' : ''
        }${list(open)}.`.replace(/\s+\./g, '.'),
      });
    }
  }

  // --- 3. the handover
  {
    const behind = managed.filter((c) => (c.goal ?? 'needs-improvement') !== 'at-goal');
    if (managed.length > 0) {
      overall.push({
        voice: 'documented',
        text: `${cap(countWord(managed.length))} problem${managed.length === 1 ? '' : 's'} managed here${
          behind.length > 0
            ? `, ${countWord(behind.length)} needing work: ${list(behind.map((c) => lower(c.name)))}`
            : ', all at goal'
        }.`,
      });
    }
  }

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
): { text: string; deltas: string[]; sources: SourceRef[] } | undefined {
  const sources: SourceRef[] = [];
  const bits: string[] = [];
  const deltas: string[] = [];

  const series = (key: string, label: string, unit = '') => {
    const hits = desc(input.panels).filter((p) => p.values.some((v) => v.key === key));
    if (hits.length < 2) return;
    const now = hits[0].values.find((v) => v.key === key)!;
    const then = hits[hits.length - 1].values.find((v) => v.key === key)!;
    if (now.value === then.value) return;
    const d = Math.round((now.value - then.value) * 10) / 10;
    bits.push(`${label} ${then.value}${unit} in ${monthYear(hits[hits.length - 1].date)} to ${now.value}${unit} on ${fmtDate(hits[0].date)}`);
    deltas.push(`${label} ${d < 0 ? 'down' : 'up'} ${Math.abs(d)}${unit} to ${now.value}${unit}`);
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
      deltas.push(`blood pressure down to ${b.systolic}/${b.diastolic}`);
      sources.push({
        id: b.id, kind: 'vitals', date: b.date, label: `Vitals, ${fmtDate(b.date)}`,
      });
    }
  }
  if (bits.length === 0) return undefined;
  return { text: `On the record, ${bits.join(', ')}.`, deltas, sources };
}

/** The one or two things genuinely unsettled, as phrases. */
function outstandingBits(input: SubjectiveInput): string[] {
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
  return bits;
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
    const sentence = bits.length > 0
      ? `Patient reports ${bits.join(' ')}${
        struggle ? `, but continues to struggle with ${struggle}` : ''}.`
      : struggle
        ? `Patient has told us they are struggling with ${struggle}.`
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

    // The current value rides along with the reading rather than
    // taking a sentence of its own.
    const current = measureLine(c, input);
    if (current) {
      const last = clauses[clauses.length - 1];
      if (last && last.voice === 'documented') {
        last.text = `${last.text.replace(/\.$/, '')} (${current.short}).`;
      } else {
        clauses.push({ voice: 'documented', text: current.text });
      }
      sources.push(...current.sources.map(ref));
    }
  }

  let conflict: string | undefined;
  if (answer) {
    if (c.goal === 'at-goal' && answer.feeling === 'worse') {
      conflict = 'Recorded as at goal, reported as worse.';
    } else if (c.goal === 'needs-improvement' && answer.feeling === 'better') {
      conflict = 'The record has this needing work and they feel better.';
    }
  }

  return {
    conditionId: c.id,
    name: c.name,
    code: c.code,
    goal: c.goal,
    clauses,
    interventions: interventionsFor(c, {
      conditions: input.conditions,
      medications: input.medications,
      lifestyle: input.lifestyle,
      prevention: input.prevention,
      specialists: input.specialists,
      orders: input.orders,
      checkIns: input.checkIns,
      vitals: input.vitals,
    }),
    sources,
    conflict,
  };
}

const lower = (s: string) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);

const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const countWord = (n: number) => (n <= 10 ? WORDS[n] : String(n));

/**
 * What they have asked for, taken from the sentence where they ask.
 *
 * Their priority is almost never in a goals field. It is one sentence
 * in an update or a message, and the useful part of it is what comes
 * after "I would like to" rather than the whole sentence. Anything
 * this cannot reduce to a short phrase is left out rather than
 * printed at length, because the opening paragraph is three sentences
 * and a quotation will always win the space.
 */
const ASK = /\b(would like|would rather|want to|hoping|can we|could we|please)\b/i;
const askFor = (text?: string): string | undefined => {
  if (!text) return undefined;
  const hit = text.split(/(?<=[.!?])\s+/).find((x) => ASK.test(x));
  if (!hit) return undefined;
  const m = /\b(?:is to|like to|rather|want to|hoping to|can we|could we)\b\s*/i.exec(hit);
  const rest = (m ? hit.slice(m.index + m[0].length) : hit.replace(/^what\s+(i|we)\s+/i, ''))
    .replace(/[.!?]\s*$/, '').trim();
  return rest.length > 4 && rest.length < 90 ? rest : undefined;
};

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
): { text: string; short: string; movement?: string; sources: SourceRef[] } | undefined {
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
        short: `no ${label} on file`,
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
      short: `${label} ${now.value}${unit} on ${fmtDate(hits[0].date)}`,
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
      short: `${office[0].systolic}/${office[0].diastolic} on ${fmtDate(office[0].date)}${
        home.length > 0 ? `, home average ${Math.round(
          home.reduce((a, h) => a + (h.systolic ?? 0), 0) / home.length,
        )}` : ', no home readings'}`,
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
