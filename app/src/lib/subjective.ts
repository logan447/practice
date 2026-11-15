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
  label: string;
  /** The status in a few words, as last reported. */
  status: string;
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

function problemSummary(
  c: Condition,
  input: SubjectiveInput,
  ref: (r: SourceRef) => SourceRef,
): ProblemSummary {
  const mine = medsAbout(c.name, input.medications.filter((m) => m.status !== 'stopped'));
  const clauses: Clause[] = [];
  const sources: SourceRef[] = [];

  // --- their experience of it, most recent first
  const answer = desc(input.checkIns.filter(
    (x) => x.about.kind === 'condition' && x.about.id === c.id,
  ))[0];
  const msg = desc(input.messages.filter(
    (m) => m.from === 'patient'
      && ((m.about ?? []).includes(c.id) || touches(m.body, c, mine)),
  ))[0];

  if (answer) {
    clauses.push({
      voice: 'patient',
      text: `${trimTo(answer.text, 230)}`,
    });
    sources.push(ref({
      id: answer.id, kind: 'answer', date: answer.date,
      label: `Their answer about ${c.name}, ${fmtDate(answer.date)}`,
    }));
  }
  if (msg && (!answer || msg.date > answer.date)) {
    clauses.push({
      voice: 'patient',
      text: `Wrote in on ${fmtDate(msg.date)}: ${trimTo(msg.body, 200)}`,
    });
    sources.push(ref({
      id: msg.id, kind: 'message', date: msg.date, label: `Message, ${fmtDate(msg.date)}`,
    }));
  }

  // --- what the visits document about it, condensed rather than copied
  const notes = desc(input.encounters.filter((e) => e.status === 'signed'))
    .filter((e) => {
      const txt = [
        e.note?.subjective.additional, e.note?.subjective.reason,
        e.note?.assessment.overall,
      ].filter(Boolean).join(' ');
      return txt.length > 0 && touches(txt, c, mine);
    });
  if (notes.length > 0) {
    const latest = notes[0];
    const said = [latest.note?.assessment.overall, latest.note?.subjective.additional]
      .filter(Boolean)[0] ?? '';
    clauses.push({
      voice: 'documented',
      text: `${fmtDate(latest.date)}: ${trimTo(said, 230)}${
        notes.length > 1 ? ` Documented at ${notes.length} visits.` : ''}`,
    });
    sources.push(ref({
      id: latest.id, kind: 'visit', date: latest.date,
      label: `Visit note, ${fmtDate(latest.date)}`,
    }));
  } else if (clauses.length === 0) {
    clauses.push({
      voice: 'documented',
      text: 'Nothing on file speaks to this problem directly. It has been carried rather than worked on.',
    });
  }

  // --- a drug that came off for a reason is context this problem needs,
  //     however long ago it happened.
  const stopped = desc(
    medsAbout(c.name, input.medications.filter((m) => m.status === 'stopped' && m.changeNote))
      .map((m) => ({ ...m, date: m.stopped ?? m.started })),
  )[0];
  if (stopped) {
    clauses.push({
      voice: 'documented',
      // The note usually says "Stopped <month>..." already; saying it
      // twice is the tell that a summary was assembled rather than
      // written.
      text: /^stopped/i.test(stopped.changeNote ?? '')
        ? `${stopped.name}: ${stopped.changeNote}`
        : `${stopped.name} stopped ${monthYear(stopped.date)}: ${stopped.changeNote}`,
    });
  }

  // --- the measure, where it has one
  const trajectory = measureLine(c, input);
  if (trajectory) {
    clauses.push({ voice: 'documented', text: trajectory.text });
    sources.push(...trajectory.sources.map(ref));
  }

  // --- where the two accounts disagree
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

function measureLine(
  c: Condition, input: SubjectiveInput,
): { text: string; sources: SourceRef[] } | undefined {
  const KEY: Record<string, [string, string, string]> = {
    'Type 2 diabetes mellitus': ['A1c', 'A1c', '%'],
    Prediabetes: ['A1c', 'A1c', '%'],
    'Mixed hyperlipidemia': ['LDL', 'LDL', ''],
    'Chronic kidney disease, stage 3a': ['eGFR', 'eGFR', ''],
    Hypothyroidism: ['TSH', 'TSH', ''],
  };
  const spec = KEY[c.name];
  if (spec) {
    const [key, label, unit] = spec;
    const hits = desc(input.panels).filter((p) => p.values.some((v) => v.key === key));
    if (hits.length === 0) {
      return {
        text: `No ${label} on file, which is the measure this problem is judged on.`,
        sources: [],
      };
    }
    const now = hits[0].values.find((v) => v.key === key)!;
    const then = hits[hits.length - 1].values.find((v) => v.key === key)!;
    return {
      text: hits.length > 1 && now.value !== then.value
        ? `${label} ${now.value}${unit} on ${fmtDate(hits[0].date)}, from ${then.value}${unit} in ${monthYear(hits[hits.length - 1].date)}.`
        : `${label} ${now.value}${unit} on ${fmtDate(hits[0].date)}, the only value on file.`,
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
    const homeLine = home.length > 0
      ? ` Home readings average ${Math.round(
        home.reduce((a, h) => a + (h.systolic ?? 0), 0) / home.length,
      )} systolic over ${home.length}.`
      : ' No home readings on file.';
    return {
      text: `${office[0].systolic}/${office[0].diastolic} in clinic on ${fmtDate(office[0].date)}${
        office[1]?.systolic ? `, from ${office[1].systolic}/${office[1].diastolic}` : ''}.${homeLine}`,
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
          : a.status === 'missing-some' ? `Missing some${a.note ? `. ${a.note}` : ''}`
            : `Not taking${a.note ? `. ${a.note}` : ''}`)
        : 'Prescribed. Adherence never asked about.',
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
      label: li.prescription.split('.')[0],
      status: answer
        ? `${answer.onPlan === 'yes' ? 'Doing it'
          : answer.onPlan === 'partly' ? 'Partly' : 'Not doing it'}${
          answer.text ? `. ${trimTo(answer.text, 110)}` : ''}`
        : li.status === 'achieved' ? 'Achieved'
          : li.status === 'struggling' ? `Struggling${li.barrier ? `. ${li.barrier}` : ''}`
            : li.status === 'not-started' ? 'Written, never started'
              : 'In progress',
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
