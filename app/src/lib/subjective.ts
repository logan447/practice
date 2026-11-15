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
import { LIFESTYLE_DOMAINS, INTERVAL_LABEL } from '../domain/types';
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

/** A service category, summarised in the same shape as a problem. */
export interface CategorySummary {
  key: 'prevention' | 'lifestyle';
  name: string;
  goal: 'at-goal' | 'needs-improvement';
  clauses: Clause[];
  interventions: Intervention[];
  sources: SourceRef[];
}

/** What they said has happened since the last visit. */
export interface IntervalRow {
  label: string;
  date?: string;
  text: string;
}

export interface LivingSubjective {
  overall: Clause[];
  /** Listed rather than written into the paragraph, so it can be scanned. */
  interval: IntervalRow[];
  overallSources: SourceRef[];
  problems: ProblemSummary[];
  /** Preventative services and lifestyle medicine, after the problems. */
  categories: CategorySummary[];
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

/** The first sentence, without its full stop. For embedding in ours. */
const oneSentence = (text: string, max = 120): string => {
  const clean = text.replace(/\s+/g, ' ').trim();
  const stop = clean.search(/[.;]\s/);
  const first = stop > 12 ? clean.slice(0, stop) : clean;
  return (first.length <= max ? first : `${first.slice(0, max).trimEnd()}...`)
    .replace(/[.;,\s]+$/, '');
};

/** First letter up. Used where a clause became a sentence. */
const sentence = (text: string): string =>
  (text.length === 0 ? text : text[0].toUpperCase() + text.slice(1));

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

  // ----------------------------------- overall, what the patient reports
  //
  // Patient-reported only. No chart review and nothing outstanding:
  // both of those belong under the problem they are about, where
  // they can be acted on, and putting them in the opening paragraph
  // turned the one part of the chart that is the patient's own
  // account into a summary of ours.
  //
  // Two things get asked before every visit: how their health is
  // going overall, and what has happened since we last saw them. The
  // second is the half a chronic disease questionnaire misses.
  const overall: Clause[] = [];
  const overallSources: SourceRef[] = [];
  let intervalRows: IntervalRow[] = [];

  {
    const lastUpdate = updates[0];
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

      // The interval history. An empty list is an answer and says so;
      // never having been asked is a different fact and says that.
      const interval = lastUpdate?.interval;
      if (interval && interval.length > 0) {
        intervalRows = interval.map((e) => ({
          label: INTERVAL_LABEL[e.kind],
          date: e.date,
          text: e.text,
        }));
      } else if (interval) {
        overall.push({
          voice: 'patient',
          text: 'Nothing new since the last visit: no acute problems, illnesses, hospital stays, urgent care visits or new specialists.',
        });
      } else {
        overall.push({
          voice: 'patient',
          text: 'Not asked what has happened since the last visit.',
        });
      }
    } else {
      /**
       * Nothing reported, which is not the same as nothing known.
       *
       * A patient who has been seen three times and simply has not
       * filled in a questionnaire since has an account of themselves:
       * it is in the last visit's note, in their words, written down
       * by the person who heard them say it. Claiming "no intake on
       * file" over the top of that was the chart calling its own
       * records nothing, and it was the first line a physician read.
       *
       * So the genuinely empty case is now narrow: never seen, and
       * nothing said.
       */
      const lastSeen = desc(input.encounters.filter(
        (e) => e.status === 'signed'
          && ((e.note?.subjective.additional ?? '').trim().length > 0
            || (e.note?.subjective.reason ?? '').trim().length > 0),
      ))[0];
      const booked = input.encounters.find((e) => e.status !== 'signed');

      if (lastSeen) {
        const words = (lastSeen.note?.subjective.additional
          ?? lastSeen.note?.subjective.reason ?? '').trim();
        overall.push({
          voice: 'patient',
          text: `At the visit on ${fmtDate(lastSeen.date)}: ${lower(trimTo(words, 240))}`,
        });
        overall.push({
          voice: 'patient',
          text: 'Nothing reported since.',
        });
        overallSources.push(ref({
          id: lastSeen.id, kind: 'visit', date: lastSeen.date,
          label: `Visit note, ${fmtDate(lastSeen.date)}`,
        }));
      } else {
        overall.push({
          voice: 'patient',
          text: booked
            ? `No intake on file yet. First visit booked for ${fmtDate(booked.date)}.`
            : 'No intake on file yet, and nothing booked.',
        });
      }
    }
  }

  // --------------------------------------------------- problem by problem
  const problems = managed.map((c) => problemSummary(c, input, ref));

  const categories = [
    preventionSummary(input, ref),
    lifestyleSummary(input, ref),
  ].filter((x): x is CategorySummary => x !== undefined);

  const all = desc(sources);
  return {
    overall, interval: intervalRows, overallSources, problems, categories,
    lastSource: all[0],
    sources: all,
  };
}

// ----------------------------------------------------------- the pieces



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
      const why = lower(oneSentence(stripStopped(stopped.changeNote ?? ''), 110));
      // The note often already starts with its own preposition ("by
      // agreement", "because the numbers held"). Adding "after" in
      // front of one produced "stopped in June after by agreement".
      const joined = /^(by|after|because|when|once|following|due to|on|since)\b/i.test(why)
        ? why : `after ${why}`;
      bits.push(`${lower(stopped.name)} stopped in ${monthYear(stopped.date)} ${joined}`);
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

    // Sentences, not continuations. These used to run on after a
    // "Chart review:" label; the label is gone and the clause now has
    // to stand on its own in the paragraph.
    if (bits.length > 0) {
      clauses.push({ voice: 'documented', text: `${sentence(list(bits))}.` });
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
        clauses.push({ voice: 'documented', text: sentence(current.text) });
      }
      sources.push(...current.sources.map(ref));
    }
    if (notes.length > 1) {
      const last = clauses[clauses.length - 1];
      if (last && last.voice === 'documented') {
        last.text = `${last.text} Documented across ${notes.length} encounters.`;
      }
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

// ---------------------------------------------- the service categories

/**
 * Preventative services and lifestyle medicine, in the subjective.
 *
 * They belong here for the same reason the problems do: they are
 * things we are working on, the patient has an account of how they
 * are going, and that account is usually the only place the real
 * obstacle is written down. The mammogram in this chart is not
 * outstanding because nobody sent a letter; it is outstanding because
 * of what happened to her sister, and that is in an answer rather
 * than in a note.
 */
function preventionSummary(
  input: SubjectiveInput, ref: (r: SourceRef) => SourceRef,
): CategorySummary | undefined {
  if (input.prevention.length === 0) return undefined;
  const behind = input.prevention.filter((x) => x.status !== 'current');
  const clauses: Clause[] = [];
  const sources: SourceRef[] = [];

  const answers = desc(input.checkIns.filter((c) => c.about.kind === 'prevention'));
  if (answers[0]) {
    const item = input.prevention.find(
      (x) => x.id === (answers[0].about as { id: string }).id,
    );
    clauses.push({
      voice: 'patient',
      text: `Patient reports, on the ${lower(item?.name ?? 'outstanding service')}: ${
        trimTo(answers[0].text, 220)}`,
    });
    sources.push(ref({
      id: answers[0].id, kind: 'answer', date: answers[0].date,
      label: `Their answer about ${item?.name ?? 'prevention'}, ${fmtDate(answers[0].date)}`,
    }));
  } else {
    clauses.push({
      voice: 'patient',
      text: 'Nothing on file from the patient about the preventative schedule.',
    });
  }

  clauses.push({
    voice: 'documented',
    text: behind.length === 0
      ? 'Everything on the schedule is current.'
      : `${sentence(list(behind.map((x) => `${lower(x.name)} ${x.status}${
        x.lastDone ? `, last done ${monthYear(x.lastDone)}` : ', never done here'}`)))}.`,
  });

  return {
    key: 'prevention',
    name: 'Preventative services',
    goal: behind.length === 0 ? 'at-goal' : 'needs-improvement',
    clauses,
    interventions: input.prevention.map((x) => ({
      label: x.name,
      status: x.status === 'current' ? 'complete' as const : 'needs-attention' as const,
      note: x.status === 'current' && x.lastDone
        ? `last ${fmtDate(x.lastDone)}`
        : x.dueBy ? `due ${fmtDate(x.dueBy)}` : undefined,
    })),
    sources,
  };
}

function lifestyleSummary(
  input: SubjectiveInput, ref: (r: SourceRef) => SourceRef,
): CategorySummary | undefined {
  if (input.lifestyle.length === 0) return undefined;
  const stuck = input.lifestyle.filter(
    (x) => x.status === 'struggling' || x.status === 'not-started',
  );
  const clauses: Clause[] = [];
  const sources: SourceRef[] = [];

  const answers = desc(input.checkIns.filter((c) => c.about.kind === 'lifestyle'));
  if (answers[0]) {
    const li = input.lifestyle.find((x) => x.id === (answers[0].about as { id: string }).id);
    clauses.push({
      voice: 'patient',
      text: `Patient reports, on the ${lower(
        DOMAIN_LABEL[li?.domain ?? ''] ?? 'prescriptions',
      )}: ${trimTo(answers[0].text, 220)}`,
    });
    sources.push(ref({
      id: answers[0].id, kind: 'answer', date: answers[0].date,
      label: `Their answer about ${DOMAIN_LABEL[li?.domain ?? ''] ?? 'lifestyle'}, ${fmtDate(answers[0].date)}`,
    }));
  } else {
    clauses.push({
      voice: 'patient',
      text: 'Nothing on file from the patient about the lifestyle prescriptions.',
    });
  }

  clauses.push({
    voice: 'documented',
    text: stuck.length === 0
      ? `${input.lifestyle.length} prescription${input.lifestyle.length === 1 ? '' : 's'}, all running.`
      : `${sentence(list(stuck.map((x) => `${lower(DOMAIN_LABEL[x.domain] ?? x.domain)} ${
        x.status === 'not-started' ? 'never started' : 'not going as prescribed'}`)))}.`,
  });

  return {
    key: 'lifestyle',
    name: 'Lifestyle medicine',
    goal: stuck.length === 0 ? 'at-goal' : 'needs-improvement',
    clauses,
    interventions: input.lifestyle.map((li) => ({
      label: DOMAIN_LABEL[li.domain] ?? li.domain,
      status: li.status === 'achieved' ? 'complete' as const
        : li.status === 'struggling' || li.status === 'not-started'
          ? 'needs-attention' as const : 'active' as const,
      note: li.prescription.replace(/\.$/, ''),
    })),
    sources,
  };
}
