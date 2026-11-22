/**
 * The visit.
 *
 * There is one kind of encounter now, and this is it. A care plan
 * review used to be a second one, asynchronous, with its own flow and
 * its own note; two flows meant the second was the one that got
 * skipped. What a review was for happens here, at the top, as the
 * chart review you did before walking in.
 *
 * The note is written in the order the conversation actually goes.
 *
 *   Subjective    how they are generally, then each problem, each
 *                 lifestyle pillar, each preventative service
 *   Objective     what was measured, and what was examined
 *   Assessment    where they are overall, then a line on each of the
 *                 same things, in the same order
 *   Plan          what happens next for each of them
 *   Instructions  what they do between now and the next visit, in
 *                 steps, ending with the date
 *
 * That order is not a filing convention. It is the shape of the
 * conversation, and a note written in the order the conversation
 * happened is a note that can be written during it.
 *
 * Every field is editable and every field can carry a comment. The
 * comment is yours, stays in the record, and is not part of what the
 * patient is handed. Nothing on this screen is a button that sets a
 * status: a status somebody picked from two options is not an
 * assessment, and the sentence underneath was always doing the work.
 *
 * Right, one thing: the orders. What was arriving since the last
 * approval and what to ask the patient both used to live there, and
 * both were a second inbox beside a conversation already happening.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../lib/store';
import { useNav } from '../lib/nav';
import { Chip, Panel } from '../components/ui';
import { fmtDate, interval } from '../lib/format';
import { oneLiner } from './chart/AssessPlan';
import { livingSubjective } from '../lib/subjective';
import type { LivingSubjective } from '../lib/subjective';
import type { Intervention } from '../lib/interventions';
import { ambientScript, wasCaught, ERROR_LABEL, type InjectedError } from '../lib/ambient';
import { Fishbone, OtherLabs } from './chart/Fishbone';
import { ReadLine, readLines, GROUP_LABEL } from './chart/NoteText';
import { TAB_LABEL } from './chart/drawers';
import { LIFESTYLE_DOMAINS, SETTING_LABEL } from '../domain/types';
import { pertinentNegatives, reviewOfSystems } from '../domain/ros';
import { surveysText } from '../lib/surveys';
import type { VisitNote, Order, OrderKind } from '../domain/types';
import { ORDER_KINDS } from '../domain/types';
import {
  startVisit as metricStart, signVisit as metricSign, endVisit,
  countAiSection, countAiEdit, recordErrors,
} from '../lib/metrics';

/**
 * One thing the visit talks about, in the order it is talked about.
 *
 * A problem, a lifestyle pillar and a preventative service are three
 * kinds of the same thing to this practice, so the note treats them
 * as one list and keeps that list in the same order in every section.
 */
interface Item {
  id: string;
  name: string;
  /** Tells two prescriptions in one pillar apart, where there are two. */
  detail?: string;
  group: 'Problems' | 'Lifestyle' | 'Preventative';
  /** The derived line: what the patient reports about this one. */
  said: string;
  /** What is already being done, as the first draft of the plan. */
  doing: string;
  /** Where it stands, as the first draft of the assessment. */
  standing: string;
  /** What the line says when the patient has said nothing about it. */
  silent: string;
  /**
   * The pertinent negatives for this one, as a sentence.
   *
   * Problems only. A review of systems under "Nutrition" is a form
   * being filled in rather than a question being asked.
   */
  denies?: string;
  /**
   * Where it stands in a sentence: the target, and if it is not
   * there, why.
   *
   * The line between the heading and the bullets. A heading that
   * says "Not at goal" and a list of drugs underneath it leaves the
   * reader to work out what goal and how far off, which is the one
   * thing the physician already knew and did not write down.
   */
  because: string;
}

/**
 * One problem's interventions, as the points of its plan.
 *
 * A point in a plan is a verb and a thing: "Continue lisinopril
 * 20 mg, one tablet each morning", not "Lisinopril 20 mg". The verb
 * comes from the record where the record knows it, which is continue,
 * start and hold; increase and decrease are decided in the room, so
 * the verb is the first word of a line you can type over.
 *
 * Lifestyle collapses to one point. Every pillar has its own block
 * further down this plan with its own prescription and its own
 * barrier, and writing them out again under each condition that
 * depends on them printed the same four prescriptions three times.
 * The point here is the pointer.
 */
function planPoints(ivs: Intervention[]): string[] {
  const out: string[] = [];
  let lifestyle = false;
  for (const iv of ivs) {
    if (iv.kind === 'lifestyle') { lifestyle = true; continue; }
    const tail = iv.note ? ` (${iv.note})` : '';
    if (iv.kind === 'medicine') {
      out.push(`${iv.verb} ${iv.label}${iv.detail ? `, ${iv.detail}` : ''}${tail}`);
    } else if (iv.kind === 'specialist') {
      out.push(`${iv.verb} ${iv.label}${iv.detail ? `, ${iv.detail}` : ''}.${
        iv.tail ? ` ${iv.tail}` : ''}${tail}`);
    } else if (iv.kind === 'monitoring') {
      out.push(`${iv.verb} ${iv.label}${tail}`);
    } else {
      out.push(`${iv.verb ? `${iv.verb} ` : ''}${iv.label}${tail}`);
    }
  }
  // Last, because it is a cross-reference rather than an instruction
  // of its own, and a cross-reference above the drugs reads as the
  // first thing to do.
  if (lifestyle) out.push('Lifestyle interventions as below');
  return out;
}

/** The editable half. Everything else is derived or already on file. */
interface Working {
  /** One box per section. The sections are the whole note. */
  subjective: string;
  /**
   * The vitals and the home readings, as two lines.
   *
   * Derived and not a field: a measurement is corrected where it was
   * recorded, not retyped into a note, and a note that lets you type
   * a different blood pressure from the one on the chart is a note
   * that will eventually disagree with the chart.
   */
  measured: string;
  objective: string;
  plan: string;
  instructions: string;
  nextVisit: string;
}

const EMPTY_WORKING: Working = {
  subjective: '', measured: '', objective: '', plan: '', instructions: '', nextVisit: '',
};



type Marks = Record<string, 'ambient'>;

/**
 * The examination, by system, written out for you to correct.
 *
 * A template of normals is a known hazard: the fastest thing to do
 * with it is nothing, and nothing is how a chart ends up documenting
 * an examination that did not happen. It is here because writing
 * seven headings from memory at the end of a visit is how the
 * examination ends up documented as one line or not at all, and the
 * headings are the part worth having. Every line says normal and
 * every line is wrong until somebody looks.
 */
const EXAM = [
  'Physical Exam',
  'General: alert, comfortable, no distress.',
  'Cardiovascular: regular rate and rhythm, no murmur, no oedema.',
  'Respiratory: clear to auscultation, no added sounds.',
  'Abdomen: soft, non-tender.',
  'Extremities: no swelling, pulses present.',
  'Neurological: grossly intact.',
  'Skin: no rash or ulceration.',
].join('\n');

export function Encounter({ encounterId }: { encounterId: string }) {
  const st = useStore();
  const nav = useNav();
  const enc = st.encounter(encounterId);
  const patientId = enc?.patientId ?? '';
  const p = st.patient(patientId);
  const conditions = st.conditionsFor(patientId);

  const approved = st.currentVersion(patientId);
  const fresh = st.newSince(patientId);
  const prechart = st.preChartFor(patientId);
  const lifestyle = st.lifestyleFor(patientId);
  const checkIns = st.checkInsFor(patientId);
  const prevention = st.preventionFor(patientId)
    .filter((x) => x.status !== 'not-applicable');

  const draft = useMemo<LivingSubjective>(() => livingSubjective({
    patientId, now: st.now,
    conditions,
    medications: st.medsFor(patientId),
    encounters: st.encountersFor(patientId),
    updates: st.updatesFor(patientId),
    messages: st.messagesFor(patientId),
    checkIns: st.checkInsFor(patientId),
    specialists: st.specialistsFor(patientId),
    panels: st.panelsFor(patientId),
    vitals: st.vitalsFor(patientId),
    studies: st.studiesFor(patientId),
    prevention: st.preventionFor(patientId),
    lifestyle: st.lifestyleFor(patientId),
    orders: st.ordersForPatient(patientId),
  }), [st, patientId, conditions]);

  const master = st.masterPlanFor(patientId);

  /**
   * The one list, in the one order, used by every section.
   *
   * Each one arrives with three things already written: what the
   * patient has said about it, what is already being done about it as
   * a list of points, and where it stands. Those are the first draft
   * of the subjective, the plan and the assessment. A field you have
   * to start from nothing is a field that gets a sentence rather than
   * a plan.
   */
  const items = useMemo<Item[]>(() => {
    const dom = (d: string) => LIFESTYLE_DOMAINS.find((x) => x.id === d)?.label ?? d;
    const bullets = (xs: string[]) => xs.map((x) => `\u2022 ${x}`).join('\n');
    /*
     * What the patient said about this exact prescription or service,
     * not the category sentence repeated five times. A paragraph that
     * appears under every row is a paragraph nobody reads under any
     * of them.
     */
    const said = (kind: 'lifestyle' | 'prevention', id: string) => {
      const hit = [...checkIns]
        .filter((c) => c.about.kind === kind && c.about.id === id)
        .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))[0];
      return hit?.text ?? '';
    };

    return [
      ...draft.problems.map((pr) => ({
        id: pr.conditionId,
        name: pr.name,
        group: 'Problems' as const,
        /*
         * Their voice only. The rest of the derived paragraph is the
         * record talking, and the record is already in the points
         * below and in the assessment. Printing it here as well is
         * the same facts three times down one screen.
         */
        said: pr.clauses.filter((c) => c.voice === 'patient').map((c) => c.text).join(' '),
        doing: bullets(planPoints(pr.interventions)),
        standing: pr.goal === 'at-goal' ? 'At goal'
          : pr.goal ? 'Not at goal' : 'Not assessed',
        because: conditions.find((c) => c.id === pr.conditionId)?.goalNote ?? '',
        silent: 'Not discussed at this visit.',
        /*
         * The three or four things you ask about because of this
         * problem, at the end of this problem's line. It is the
         * sentence that says the things which would have changed the
         * plan were considered, which is why it belongs to the
         * problem rather than to a block at the bottom.
         */
        denies: pertinentNegatives(pr.name),
      })),
      /*
       * All six pillars, prescribed or not.
       *
       * The pillars are a fixed list, not a list of prescriptions.
       * Showing only the ones with something written against them
       * makes a first visit look like a patient with no lifestyle
       * at all, when what is true is that nobody has prescribed
       * anything yet, which is the finding.
       *
       * Two prescriptions can share a pillar, and two blocks both
       * called "Diet" is two you have to open to tell apart.
       */
      ...LIFESTYLE_DOMAINS.flatMap((d) => {
        const mine = lifestyle.filter((x) => x.domain === d.id);
        if (mine.length === 0) {
          return [{
            id: `pillar-${d.id}`,
            name: d.label,
            group: 'Lifestyle' as const,
            said: '',
            doing: '',
            standing: 'Not started',
            silent: 'Not started.',
            because: 'Nothing prescribed here yet.',
          }];
        }
        return mine.map((l) => {
        const same = mine;
        // Four words, not the whole prescription. It is there to tell
        // two "Nutrition" blocks apart; the prescription itself is in
        // the plan under the heading, and a sentence set in bold as a
        // heading is a sentence nobody reads as one.
        const short = l.prescription
          .split(/[.,;]/)[0].trim().split(/\s+/).slice(0, 4).join(' ');
        return {
          id: l.id,
          // The heading is the pillar. The prescription is the content
          // under it, not a second half of its name.
          name: dom(l.domain),
          detail: same.length > 1 ? short : '',
          group: 'Lifestyle' as const,
          said: said('lifestyle', l.id),
          doing: bullets([l.prescription.replace(/\.$/, '')]),
          /*
           * Two states, not four.
           *
           * "Holding" and "Struggling" are judgments about how a
           * person is doing, and a pillar carries one of those in
           * every line of the subjective already. What the plan
           * needs from this line is whether the prescription exists
           * yet, because that is what changes what happens next.
           */
          standing: l.status === 'not-started' ? 'Not started' : 'In progress',
          // Not started is a fact about the prescription. Unknown is
          // a fact about us: it exists and nobody has asked how it
          // is going, which is the one worth seeing on the page.
          silent: l.status === 'not-started' ? 'Not started.' : 'Unknown.',
          /*
           * What is in the way is what defends the status: a pillar
           * that is in progress rather than holding is in progress
           * for a reason, and the reason is the thing the plan
           * underneath it has to answer.
           */
          because: [
            l.barrier ?? '',
            l.status === 'achieved' ? 'Holding without effort now.' : '',
          ].filter(Boolean).join(' '),
        };
        });
      }),
      ...prevention.map((x) => ({
        id: x.id,
        name: x.name,
        group: 'Preventative' as const,
        said: said('prevention', x.id),
        /*
         * One line each.
         *
         * Where it stands, when it was last done, what happens next.
         * Six services each with a heading, a sentence of dates and
         * a bullet was eighteen lines to say six things, and a
         * reader checking what is outstanding reads down one column
         * of statuses rather than through three.
         */
        doing: '',
        because: '',
        silent: 'Unknown.',
        standing: [
          x.status === 'current' ? 'Up to date'
            : x.status === 'overdue' ? 'Overdue' : 'Due',
          x.lastDone ? `last done ${fmtDate(x.lastDone)}` : 'never done',
          x.status === 'current'
            ? (x.dueBy ? `next due ${fmtDate(x.dueBy)}` : 'no next date set')
            : 'order today',
        ].join(', '),
      })),
    ];
  }, [draft.problems, lifestyle, prevention, checkIns, conditions]);

  const [w, setW] = useState<Working>(() => ({ ...EMPTY_WORKING }));
  const [marks, setMarks] = useState<Marks>({});

  /*
   * Fill the three boxes once, from the record.
   *
   * Each section is one field with its subsections written into it,
   * rather than a field per problem behind a fold. A note is a
   * document somebody reads start to finish; a form of thirty boxes
   * is a form, and the folds that made it bearable were an admission
   * of that.
   *
   * What goes in is what the chart already knows: their own sentence
   * about each problem in the subjective, where each one stands and
   * what is being done about it in the plan. Editing a draft is a
   * different act from writing from nothing.
   */
  const seeded = useRef(false);
  useEffect(() => {
    if (seeded.current || items.length === 0) return;
    seeded.current = true;
    const carried = approved?.plan.byProblem ?? master?.plan?.byProblem ?? {};
    const said = (id: string) => (prechart?.notes[id] ?? '').trim();

    /*
     * Their voice, under their heading.
     *
     * Every line is "<thing> \u2014 Patient reports ...", because that
     * is what the subjective is: what they told us, about each thing,
     * in order. The heading reads bold and the sentence after the dash
     * does not, which is the shape a physician writes by hand.
     */
    const reports = (text: string) => {
      const t = text.trim();
      if (!t) return '';
      if (/^patient reports/i.test(t)) return t;
      // Lowercase the first letter, unless it is the word "I": the
      // patient's own sentence often starts with it and "Patient
      // reports i know" is not a sentence anybody wrote.
      const keep = /^I\b|^I['\u2019]/.test(t);
      return `Patient reports ${keep ? t : t[0].toLowerCase() + t.slice(1)}`;
    };
    const general = draft.overall
      .filter((c) => c.voice === 'patient').map((c) => c.text).join(' ');

    /*
     * The chart review is the physician's, and says so.
     *
     * It used to be folded into the General line, which put a
     * physician's stream of consciousness behind the words "Patient
     * reports". Everything under a subjective heading is the
     * patient's voice except this, so this gets a heading of its own.
     */
    const review = [said('notes'), said('subjective')].filter(Boolean).join(' ');

    /*
     * The three things this practice sells, labelled.
     *
     * Medical, lifestyle and preventative are not three kinds of
     * note: they are one conversation. But they are three kinds of
     * service, and a reader scanning for "what are we doing about
     * her prevention" was reading fourteen headings to find four of
     * them. One bold word above each run, and nothing else.
     */
    const labelled = (
      lines: { group: Item['group']; text: string }[],
      head: string[] = [],
      tail: string[] = [],
    ) => {
      const out = [...head];
      let last = '';
      for (const ln of lines) {
        if (ln.group !== last) {
          last = ln.group;
          if (GROUP_LABEL[ln.group]) out.push(GROUP_LABEL[ln.group]);
        }
        out.push(ln.text);
      }
      return [...out, ...tail].filter(Boolean).join('\n\n');
    };

    /*
     * Everything in the patient's own voice, for the formal review.
     *
     * Their words only. The derived sentences around them are the
     * record talking, and a review of systems built out of the
     * record's own prose would find whatever the record happened to
     * mention.
     */
    const theirWords = [general, ...items.map((it) => it.said)].filter(Boolean);

    /*
     * Every pillar and every service, whether or not they said
     * anything about it.
     *
     * A subjective that lists only the four things the patient
     * mentioned is a subjective that cannot be read as a check. The
     * ones nobody has spoken about are the ones worth seeing: a
     * pillar that has not started and a service nobody has asked
     * about look identical to a pillar going well, if neither is on
     * the page.
     */
    const subjective = labelled(
      items
        .filter((it) => it.group !== 'Problems' || it.said.trim())
        .map((it) => ({
          group: it.group,
          text: `${it.name}${it.detail ? `, ${it.detail}` : ''} \u2014 ${
            it.said.trim() ? reports(it.said) : it.silent}${
            it.denies ? ` ${it.denies}` : ''}`,
        })),
      [`General \u2014 ${reports(general) || 'Patient reports nothing new overall.'}`],
      [
        review ? `Chart review \u2014 ${review}` : '',
        // The sweep for what the problem list would not have asked
        // about. Last in the section, immediately before the
        // objective, which is where it is read.
        reviewOfSystems(theirWords),
      ],
    );

    /*
     * One block, in three parts.
     *
     *   Essential hypertension \u2014 At goal
     *   Where it stands, what the target is, and if it is not there
     *   why, running into what we are going to do about it.
     *   \u2022 Continue lisinopril 20 mg, one tablet each morning
     *   \u2022 Lifestyle interventions as below
     *   \u2022 Continue with Dr. Ingrid Sorensen, Endocrinology
     *
     * The sentence is the part a physician writes and the part that
     * carries forward; the bullets are derived from the record every
     * time. That order matters: carrying last visit's bullets
     * forward is how a plan ends up listing a drug that was stopped
     * in between, and a bullet is a thing to do now, not a thing
     * that was true in October.
     */
    const prose = (text: string) => text.split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !/^[\u2022\-*]/.test(l))
      .join(' ');

    const bare = (t: string) => t.trim().toLowerCase().replace(/[.\s]+$/, '');

    /*
     * The sentence under the heading, with the heading not said twice.
     *
     * A carried plan whose whole prose was "Holding." printed
     *
     *   Sleep \u2014 Holding
     *   Holding.
     *
     * which is a line that tells the reader what the line above it
     * told them. Any sentence that is only the status comes out; if
     * that is all there was, there is no sentence and the points
     * follow the heading.
     */
    /*
     * Two lines, and they have to earn both.
     *
     * The job of this sentence is to defend the status in the line
     * above it and run into the points below: where the number is,
     * what it is being read against, and why that is or is not good
     * enough. Everything past that belongs in the conversation, and
     * a paragraph here pushes the plan off the screen.
     */
    const TWO_LINES = 190;
    const narrative = (it: Item) => {
      const sentences = [it.because, prose(carried[it.id] ?? '')]
        .filter(Boolean).join(' ')
        .split(/(?<=[.!?])\s+/)
        .filter((sentence) => sentence.trim() && bare(sentence) !== bare(it.standing));
      const out: string[] = [];
      let used = 0;
      for (const sentence of sentences) {
        if (out.length > 0 && used + sentence.length > TWO_LINES) break;
        out.push(sentence);
        used += sentence.length + 1;
      }
      return out.join(' ').trim();
    };

    /*
     * The assessment opens with the same sentence the subjective
     * does. It is read twice because it is used twice: once as the
     * person you are about to hear from, once as the person you are
     * about to make decisions about.
     */
    const planHead = p ? oneLiner(p, conditions) : '';

    const plan = labelled(items.map((it) => ({
      group: it.group,
      text: [
        `${it.name}${it.detail ? `, ${it.detail}` : ''} \u2014 ${it.standing}`,
        // The physician's own sentence from last time sits after the
        // derived one, because it is the part that was decided
        // rather than the part that was measured.
        narrative(it),
        it.doing,
      ].filter(Boolean).join('\n'),
    })));

    /*
     * One vitals line.
     *
     * What was measured in the office, written plainly, and then
     * anything the patient measured at home with "(home)" after the
     * number. A separate Home line made two measurements of the same
     * thing look like two different findings, and the only part a
     * reader needs is which cuff it came off.
     */
    const lastOffice = st.vitalsFor(patientId).find((v) => v.source === 'office');
    const office = lastOffice ? [
      lastOffice.systolic ? `${lastOffice.systolic}/${lastOffice.diastolic}` : '',
      lastOffice.heartRate ? `HR ${lastOffice.heartRate}` : '',
      lastOffice.weightLb ? `${lastOffice.weightLb} lb` : '',
      lastOffice.bmi ? `BMI ${lastOffice.bmi}` : '',
    ].filter(Boolean) : [];

    const homeSets = st.vitalsFor(patientId).filter((v) => v.source === 'home');
    const sys = homeSets.map((v) => v.systolic).filter((n): n is number => !!n);
    const home = [
      sys.length
        ? `${Math.min(...sys)} to ${Math.max(...sys)} systolic (home, ${
          sys.length} reading${sys.length === 1 ? '' : 's'} to ${fmtDate(homeSets[0].date)})`
        : '',
      ...st.patientSeriesFor(patientId).map((ser) => {
        const last = ser.points[ser.points.length - 1];
        return last ? `${ser.name} ${last.value} ${ser.unit} (home, ${
          fmtDate(last.date)})` : '';
      }),
    ].filter(Boolean);

    const vitalsLine = [...office, ...home].length
      ? `Vitals \u2014 ${office.join(' \u00b7 ')}${
        lastOffice ? ` (${fmtDate(lastOffice.date)})` : ''}${
        home.length ? `${office.length ? ' \u00b7 ' : ''}${home.join(' \u00b7 ')}` : ''}`
      : '';

    setW((v) => ({
      ...v,
      subjective,
      measured: vitalsLine,
      /*
       * What was measured comes before what was examined, and the
       * labs come with it: a physician reads the numbers that were
       * taken off the patient, then the ones that came back from the
       * lab, and only then writes down what they found with their
       * hands. The examination is the part that is written today, so
       * it is the part that is a field.
       */
      /*
       * Vitals and labs are above this field, derived. What is
       * written here is the examination and then the surveys, which
       * are measurements the patient produced: a number with a date
       * and a scale, comparable with the last one, rather than
       * something they said.
       */
      objective: [EXAM, said('vitals'), said('results'),
        surveysText(st.scoresFor(patientId), enc?.date)]
        .filter(Boolean).join('\n\n'),
      plan: [planHead, said('problems'), plan].filter(Boolean).join('\n\n'),
    }));
  }, [items, approved, master, st, patientId, prechart, draft.overall]);

  // ------------------------------------------------------------ the clock
  const [openedAt] = useState(() => Date.now());
  const [minutes, setMinutes] = useState(0);
  /*
   * The clock runs from the moment the visit opens and is never shown.
   * Typing a number at the end is how a time record becomes an
   * estimate; a number nobody is asked for cannot be one.
   */
  const running = true;
  useEffect(() => {
    if (!running) return undefined;
    const t = setInterval(
      () => setMinutes(Math.max(1, Math.round((Date.now() - openedAt) / 60000))),
      5000,
    );
    return () => clearInterval(t);
  }, [running, openedAt]);

  // --------------------------------------------------------- the capture
  const [listening, setListening] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  /*
   * The capture makes mistakes, always. It used to be a toggle in the
   * header, and a toggle invites turning it off, which is exactly the
   * setting in which nobody learns to read a draft.
   */
  const faulty = true;
  const [injected, setInjected] = useState<InjectedError[]>([]);
  const [checked, setChecked] = useState(false);
  const [published, setPublished] = useState(false);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const approveRef = useRef<(() => void) | null>(null);
  const captureRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      const k = e.key.toLowerCase();
      if (k === 'enter') { e.preventDefault(); approveRef.current?.(); }
      if (k === 'l' && e.shiftKey) { e.preventDefault(); captureRef.current?.(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  useEffect(() => {
    if (!listening) return undefined;
    const t = window.setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [listening]);

  useEffect(() => {
    if (!p || !enc || enc.status === 'signed') return undefined;
    metricStart(enc.id, p.id, p.name);
    return () => endVisit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enc?.id, p?.id, enc?.status]);

  if (!enc || !p) return <div className="wrap"><p>That encounter is not on file.</p></div>;

  const signed = enc.status === 'signed';

  const put = (field: keyof Working, value: string, fromCapture?: boolean) => {
    setW((v) => ({ ...v, [field]: value }));
    setMarks((m) => {
      const next = { ...m };
      if (fromCapture) { next[field] = 'ambient'; countAiSection(1); }
      else if (m[field]) { countAiEdit(); delete next[field]; }
      return next;
    });
  };

  const startListening = () => {
    setListening(true);
    setElapsed(0);
    setChecked(false);
    const first = p.preferredName ?? p.name.split(' ')[0];
    const steps = ambientScript(first, faulty).filter((step) =>
      step.kind === 'text'
      || draft.problems.some((pr) => pr.name.toLowerCase().includes(step.match)));
    setInjected(steps.flatMap((x) => x.errors));
    timers.current = steps.map((step) => window.setTimeout(() => {
      /*
       * The capture appends rather than replaces. There is one box
       * per section now and it arrives with the record in it, so
       * writing over that would throw away the thing the physician
       * opened the visit to read.
       */
      if (step.kind === 'text') {
        const field = step.section === 'subjective' ? 'subjective'
          : step.section === 'objective' ? 'objective' : 'plan';
        setW((v) => ({ ...v, [field]: `${v[field]}\n\n${step.text}`.trim() }));
        setMarks((m) => { countAiSection(1); return { ...m, [field]: 'ambient' as const }; });
      } else {
        const hit = draft.problems.find((pr) => pr.name.toLowerCase().includes(step.match));
        const text = [step.fields.treatment, step.fields.orders, step.fields.followUp]
          .filter(Boolean).join(' ');
        if (hit && text) {
          setW((v) => ({ ...v, plan: `${v.plan}\n\n${hit.name}\n${text}`.trim() }));
          setMarks((m) => { countAiSection(1); return { ...m, plan: 'ambient' as const }; });
        }
      }
      if (step === steps[steps.length - 1]) setListening(false);
    }, step.at));
  };

  const stopCapture = () => {
    timers.current.forEach(clearTimeout);
    setListening(false);
  };

  // ------------------------------------------- what the capture got wrong
  const fieldText = (id: string): string => {
    if (id === 'plan.problems') return w.plan;
    if (id === 'subjective.additional') return w.subjective;
    if (id === 'objective.vitals') return w.objective;
    if (id === 'assessment.overall') return w.plan;
    return '';
  };
  const audit = injected.map((e) => ({ err: e, caught: wasCaught(e, fieldText(e.field)) }));
  const missed = audit.filter((a) => !a.caught);

  const written = [w.subjective, w.objective, w.plan, w.instructions]
    .some((x) => x.trim().length > 0);
  const anyChange = written || fresh.count > 0;

  // ------------------------------------------------------------ the note
  const reviewLine = prechart
    ? `Chart review completed ${fmtDate(prechart.date)} by ${prechart.by}. Sections reviewed: ${
      prechart.reviewed.map((id) => TAB_LABEL[id as keyof typeof TAB_LABEL] ?? id).join(', ')
    }.`
    : '';

  /**
   * The last line of the note, in the form a patient repeats back.
   *
   * A date, how far off it is, and what it is for. "Next visit: 15
   * Feb 2027" is a diary entry; this is a plan.
   */
  const followUpLine = (): string => {
    if (!w.nextVisit) return '';
    const gap = interval(enc.date, w.nextVisit);
    return `Follow up on ${fmtDate(w.nextVisit)}${gap ? ` (${gap})` : ''}`
      + ' for ongoing medical, lifestyle, and preventative services.';
  };

  const note: VisitNote = {
    subjective: {
      oneLiner: oneLiner(p, conditions),
      reason: enc.reason,
      chartReview: reviewLine,
      diagnostics: '', specialists: '',
      additional: w.subjective,
    },
    // The measurements are derived on the screen and fixed in the
    // record: a signed note that kept only the examination would be
    // a note whose vitals lived somewhere else.
    objective: { homeMeasures: '', vitals: w.measured, exam: w.objective },
    assessment: { oneLiner: oneLiner(p, conditions), overall: '' },
    plan: {
      /*
       * The plan is one piece of prose with the problems written into
       * it, so it is split back into blocks on the blank lines: the
       * first line of each is the problem, the rest is what is being
       * done about it.
       */
      problems: w.plan.split(/\n\s*\n/).map((blk, i) => {
        const lines = blk.split('\n').map((x) => x.trim()).filter(Boolean);
        return {
          id: `pp-${i}`,
          problem: lines[0] ?? '',
          assessment: '',
          treatment: lines.slice(1).join('\n'),
          orders: '', followUp: '',
        };
      }).filter((x) => x.problem),
      overall: w.instructions,
      followUp: followUpLine(),
    },
  };

  const approve = () => {
    st.approveEncounter(encounterId, {
      subjective: draft,
      goals: Object.fromEntries(draft.problems.map(
        (pr) => [pr.conditionId, pr.goal ?? 'needs-improvement'],
      )),
      plan: {
        // The plan is prose now, so the per-problem map is rebuilt
        // from it by matching each block's first line to a problem.
        byProblem: Object.fromEntries(
          items.map((it) => [it.id, blockFor(w.plan, it.name)]).filter(([, v]) => v),
        ),
        prevention: '',
        lifestyle: '',
        followUp: followUpLine(),
      },
      minutes: Math.max(minutes, 1),
      planUpdated: w.plan.trim().length > 0,
      problems: draft.problems.map((pr) => pr.conditionId),
      noChange: !anyChange,
      note,
      setting: 'in-person',
      wellness: undefined,
    });
    metricSign(enc.id);
    if (injected.length > 0) {
      recordErrors(enc.id, injected.length, audit.length - missed.length,
        missed.filter((a) => a.err.consequential).length);
      setPublished(true);
      setChecked(true);
      return;
    }
    nav.go({ name: 'schedule' });
  };

  approveRef.current = signed ? null : approve;
  captureRef.current = signed ? null : (listening ? stopCapture : startListening);

  /**
   * The block of the plan that belongs to one problem.
   *
   * The plan is prose with the problem names written into it, so a
   * block is found by its first line and kept with its name, which is
   * how it is stored back against the condition.
   */
  const blockFor = (text: string, name: string): string => {
    const blk = text.split(/\n\s*\n/).find(
      (x) => x.split('\n')[0]?.trim().toLowerCase() === name.toLowerCase(),
    );
    return blk ? blk.split('\n').slice(1).join('\n').trim() : '';
  };

  return (
    <div className="wrap wide">
      {/*
        * Two lines at the top, not four.
        *
        * The way back, what this is and who it is about, and the two
        * things you can do, all on one row; then the sentence you
        * would say out loud about this patient. There used to be a
        * back link, a page title, a name and date line and the
        * one-liner stacked above the first word of the note.
        */}
      <div className="vhead">
        <button className="btn quiet backlink"
          onClick={() => nav.go({ name: 'chart', patientId })}>
          &larr; {p.name}
        </button>
        <span className="vwhen">
          Visit &middot; {SETTING_LABEL[enc.setting ?? 'in-person']} &middot; {fmtDate(enc.date)}
        </span>
        <span className="spacer" />
        {!signed && (
          listening ? (
            <button className="btn listening" onClick={stopCapture}>
              <span className="pulse" /> Stop &middot;{' '}
              {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}
            </button>
          ) : (
            <button className="btn ghost" onClick={startListening}>Listen</button>
          )
        )}
        {!signed && injected.length > 0 && !listening && (
          <button className="btn ghost" onClick={() => setChecked(true)}>Check the draft</button>
        )}
        {signed ? (
          <span className="small muted">Signed {enc.signedAt && fmtDate(enc.signedAt)}</span>
        ) : (
          <button className="btn" onClick={approve}>Sign</button>
        )}
      </div>

      {checked && injected.length > 0 && (
        <DraftCheck audit={audit} signed={published}
          onClose={() => (published ? nav.go({ name: 'schedule' }) : setChecked(false))} />
      )}

      <div className="reviewgrid">
        {/* ============================================== the note itself */}
        <div className="note">
          {/*
            * The sentence about the patient sits under the first
            * heading rather than above the whole page. It is what the
            * subjective is about, and a line of its own over two
            * columns made the top of the visit four things deep.
            */}
          <Box id="subjective" title="Subjective" value={w.subjective}
            lead={oneLiner(p, conditions)}
            mark={marks.subjective} onChange={(v) => put('subjective', v)} />
          <Box id="objective" title="Objective" value={w.objective} startShut
            mark={marks.objective} onChange={(v) => put('objective', v)}
            above={(
              <div className="measured" id="objective-measured">
                {w.measured.split('\n').map((ln, i) => <ReadLine key={i} line={ln} />)}
                <div className="nreadsec">Labs</div>
                <Fishbone panels={st.panelsFor(patientId)} />
                <OtherLabs panels={st.panelsFor(patientId)} />
              </div>
            )} />
          <Box id="plan" title="Assessment and plan" value={w.plan} startShut
            mark={marks.plan} onChange={(v) => put('plan', v)} />
        </div>

        {/* ================================================ the right column */}
        <div className="stack">
          {/*
            * What they do next, written as the conversation happens
            * rather than remembered at the end. The same text is the
            * signed note's plan summary: one field, not two documents.
            */}
          <Panel title="Patient instructions">
            <Box id="instructions" value={w.instructions} mark={marks.instructions}
              rows={4} onChange={(v) => put('instructions', v)}
              placeholder={'One step per line, in their words.\nBring your home readings.\nStart the half tablet on Monday.'} />
            <div className="nextvis">
              <label className="wflabel" htmlFor="nextvisit">Next visit</label>
              <input id="nextvisit" className="search" type="date" value={w.nextVisit}
                onChange={(e) => put('nextVisit', e.target.value)} />
            </div>
          </Panel>

          {!signed && (
            <Orders encounterId={encounterId} patientId={patientId}
              orders={st.ordersFor(encounterId)} />
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ bits */

/**
 * One section of the note: a heading and a field.
 *
 * The field arrives with the record written into it, subsections and
 * all. It was thirty fields behind three depths of fold, which is a
 * form; a note is a document somebody reads start to finish, and the
 * folds that made the form bearable were an admission of that.
 */
function Box({
  id, title, value, onChange, rows = 3, mark, placeholder, lead, startShut, children, above,
}: {
  id: string;
  title?: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  mark?: 'ambient';
  placeholder?: string;
  /** A sentence between the heading and the rule under it. */
  lead?: string;
  /** Shut when the visit opens. Only the subjective is not. */
  startShut?: boolean;
  /** Derived content under the field, which is read rather than written. */
  children?: React.ReactNode;
  /** Derived content above the field. What was measured, before what was found. */
  above?: React.ReactNode;
}) {
  const [shut, setShut] = useState(!!startShut);
  /*
   * Read until you click it.
   *
   * The headings are bold and the sentence after the dash is not,
   * which is the shape a physician writes by hand and cannot be done
   * inside a text field. Clicking anywhere in the text swaps it for
   * the field, with the caret where it was; leaving it swaps back.
   */
  const [editing, setEditing] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(el.scrollHeight, rows * 25 + 14)}px`;
  }, [value, rows, editing]);

  if (!title) {
    return (
      <section className="nbox">
        <textarea ref={ref} className="prose" rows={rows} value={value} placeholder={placeholder}
          id={id} onChange={(e) => onChange(e.target.value)} />
      </section>
    );
  }

  return (
    <section className={`nbox${shut ? ' shut' : ''}`}>
      <div className="nboxtop">
        <button className="nboxhead" onClick={() => setShut((v) => !v)}>
          <span className="foldarrow" aria-hidden="true">{shut ? '\u203a' : '\u2304'}</span>
          <span className="nboxtitle">{title}</span>
          {mark && <span className="markchip">from the capture</span>}
          {shut && <span className="nboxcount">{value.split('\n').filter(Boolean).length} lines</span>}
        </button>
        {lead && !shut && <p className="nboxlead">{lead}</p>}
      </div>
      {!shut && above}
      {!shut && (
        editing ? (
          <textarea ref={ref} className="prose" rows={rows} value={value} autoFocus
            placeholder={placeholder} id={id}
            onBlur={() => setEditing(false)}
            onChange={(e) => onChange(e.target.value)} />
        ) : (
          <div className="nread" id={`${id}-read`} role="textbox" tabIndex={0}
            onClick={() => setEditing(true)}
            onFocus={() => setEditing(true)}>
            {value.trim()
              ? readLines(value)
              : <span className="muted">{placeholder ?? 'Nothing written yet.'}</span>}
          </div>
        )
      )}
      {!shut && children}
    </section>
  );
}

function Orders({ encounterId, patientId, orders }: {
  encounterId: string;
  patientId: string;
  orders: Order[];
}) {
  const st = useStore();
  const [kind, setKind] = useState<OrderKind>('lab');
  const [text, setText] = useState('');
  const add = () => {
    if (!text.trim()) return;
    st.addOrder(patientId, encounterId, kind, text.trim());
    setText('');
  };
  /*
   * The box first, the list under it.
   *
   * The list used to be above, so every order pushed the field you
   * were typing in further down the column. Adding three in a row
   * meant chasing it.
   */
  return (
    <Panel title="Orders" right={<span className="small muted">{orders.length}</span>}>
      <div className="row flow" style={{ gap: 5, marginBottom: 8 }}>
        {ORDER_KINDS.map((k) => (
          <button key={k.id} className={`btn sm ${kind === k.id ? '' : 'ghost'}`}
            onClick={() => setKind(k.id)}>{k.label}</button>
        ))}
      </div>
      <input className="search" value={text} placeholder="A1c and lipid panel in 6 weeks"
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') add(); }} />
      <button className="btn sm" style={{ marginTop: 8 }} disabled={!text.trim()}
        onClick={add}>Add order</button>

      {orders.length > 0 && (
        <div className="orderlist">
          {orders.map((o) => (
            <div key={o.id} className="orderrow">
              <span className="orderkind">
                {ORDER_KINDS.find((k) => k.id === o.kind)?.label}
              </span>
              <span className="ordertext">{o.text}</span>
              <button className="btn quiet sm" onClick={() => st.removeOrder(o.id)}>&times;</button>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

/**
 * What the capture got wrong, and whether it was caught.
 *
 * The prototype knows the truth because it wrote both versions. Real
 * capture does not, which is exactly why this screen exists: the only
 * thing between a mistranscribed dose and a signed plan is somebody
 * reading the draft against what they remember of the room.
 */
function DraftCheck({ audit, signed, onClose }: {
  audit: { err: InjectedError; caught: boolean }[];
  signed: boolean;
  onClose: () => void;
}) {
  const caught = audit.filter((a) => a.caught).length;
  const missedBad = audit.filter((a) => !a.caught && a.err.consequential).length;
  return (
    <div className="draftcheck">
      <div className="row">
        <h2>{signed ? 'What went into the record' : 'What the capture got wrong'}</h2>
        <span className="spacer" />
        <button className="linkish" onClick={onClose}>{signed ? 'Back to the day' : 'Hide'}</button>
      </div>
      <p className="dcscore score">
        {caught} of {audit.length} caught.{' '}
        {missedBad > 0
          ? `${missedBad} that would reach someone ${signed ? 'went into' : 'are still in'} the document.`
          : `Nothing consequential ${signed ? 'went into' : 'is still in'} the document.`}
      </p>
      <div className="dclist">
        {audit.map((a) => (
          <div key={a.err.id} className={`dcrow ${a.caught ? 'hit' : 'miss'}`}>
            <span className="dck">{ERROR_LABEL[a.err.kind]}</span>
            <div>
              <div className="dcwhere">{a.err.where}</div>
              <div className="why">{a.err.why}</div>
            </div>
            <Chip tone={a.caught ? 'ok' : 'crit'}>
              {a.caught ? 'Removed' : signed ? 'Signed' : 'Still in'}
            </Chip>
          </div>
        ))}
      </div>
    </div>
  );
}
