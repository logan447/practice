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
import { fmtDate, relative } from '../lib/format';
import { oneLiner } from './chart/AssessPlan';
import { livingSubjective } from '../lib/subjective';
import type { LivingSubjective } from '../lib/subjective';
import { ambientScript, wasCaught, ERROR_LABEL, type InjectedError } from '../lib/ambient';
import { REVIEW } from '../lib/prechart';
import { TAB_LABEL } from './chart/drawers';
import { LIFESTYLE_DOMAINS, SETTING_LABEL } from '../domain/types';
import type { VisitSetting, VisitNote, Order, OrderKind } from '../domain/types';
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
  group: 'Problems' | 'Lifestyle' | 'Preventative';
  /** The derived line: what the patient reports about this one. */
  said: string;
  /** What is already being done, as the first draft of the plan. */
  doing: string;
  /** Where it stands, as the first draft of the assessment. */
  standing: string;
}

/** The editable half. Everything else is derived or already on file. */
interface Working {
  sOverall: string;
  sItems: Record<string, string>;
  oMeasures: string;
  oExam: string;
  aOverall: string;
  aItems: Record<string, string>;
  pItems: Record<string, string>;
  instructions: string;
  nextVisit: string;
}

const EMPTY_WORKING: Working = {
  sOverall: '', sItems: {}, oMeasures: '', oExam: '',
  aOverall: '', aItems: {}, pItems: {},
  instructions: '', nextVisit: '',
};

type Marks = Record<string, 'ambient'>;

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
        doing: bullets(pr.interventions.map(
          (iv) => `${iv.label}${iv.note ? ` \u2014 ${iv.note}` : ''}`,
        )),
        standing: pr.goal === 'at-goal' ? 'At goal.'
          : pr.goal ? 'Not at goal.' : 'Not assessed yet.',
      })),
      // Two prescriptions can share a domain, and two blocks both
      // called "Nutrition" is two you have to open to tell apart.
      ...lifestyle.map((l) => {
        const same = lifestyle.filter((x) => x.domain === l.domain);
        const short = l.prescription.split(/[.,]/)[0].trim();
        return {
          id: l.id,
          name: same.length > 1 ? `${dom(l.domain)}: ${short}` : dom(l.domain),
          group: 'Lifestyle' as const,
          said: said('lifestyle', l.id),
          doing: bullets([l.prescription, ...(l.barrier ? [`In the way: ${l.barrier}`] : [])]),
          standing: l.status === 'achieved' ? 'Holding.'
            : l.status === 'active' ? 'In progress.'
              : l.status === 'struggling' ? 'Struggling.' : 'Not started.',
        };
      }),
      ...prevention.map((x) => ({
        id: x.id,
        name: x.name,
        group: 'Preventative' as const,
        said: said('prevention', x.id),
        doing: bullets([
          x.lastDone ? `Last done ${fmtDate(x.lastDone)}` : 'Never recorded as done',
          x.dueBy ? `Due ${fmtDate(x.dueBy)}` : 'No due date set',
          ...(x.note ? [x.note] : []),
        ]),
        standing: x.status === 'current' ? 'Up to date.'
          : x.status === 'overdue' ? 'Overdue.' : 'Due.',
      })),
    ];
  }, [draft.problems, lifestyle, prevention, checkIns]);

  const [w, setW] = useState<Working>(() => ({ ...EMPTY_WORKING }));

  /*
   * Fill the fields once, from the record.
   *
   * Every field starts with what the chart already knows written into
   * it rather than with a grey hint about what to type. Editing a
   * draft is a different act from writing from nothing, and the
   * second one is why notes get written after clinic instead of
   * during it.
   */
  const seeded = useRef(false);
  useEffect(() => {
    if (seeded.current || items.length === 0) return;
    seeded.current = true;
    const carried = approved?.plan.byProblem ?? master?.plan?.byProblem ?? {};
    setW((v) => ({
      ...v,
      sItems: Object.fromEntries(items.map((it) => [it.id, it.said])),
      aItems: Object.fromEntries(items.map((it) => [it.id, it.standing])),
      pItems: Object.fromEntries(items.map(
        (it) => [it.id, carried[it.id]?.trim() ? carried[it.id] : it.doing],
      )),
    }));
  }, [items, approved, master]);
  const [marks, setMarks] = useState<Marks>({});
  const [setting, setSetting] = useState<VisitSetting>(enc?.setting ?? 'in-person');
  const [usedPrechart, setUsedPrechart] = useState(false);
  /**
   * Which folds are shut. Absent means open, so a new problem on the
   * list is never hiding behind a closed heading somebody has to find.
   */
  const [open, setOpen] = useState<Record<string, boolean>>({});
  /** Records the state asked for, so the default can differ per depth. */
  const toggle = (id: string, next: boolean) =>
    setOpen((v) => ({ ...v, [id]: next }));

  // ------------------------------------------------------------ the clock
  const [openedAt] = useState(() => Date.now());
  const [minutes, setMinutes] = useState(0);
  const [running, setRunning] = useState(true);
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

  const put = (field: 'sOverall' | 'oMeasures' | 'oExam' | 'aOverall' | 'instructions' | 'nextVisit',
    value: string, fromCapture?: boolean) => {
    setW((v) => ({ ...v, [field]: value }));
    setMarks((m) => {
      const next = { ...m };
      if (fromCapture) { next[field] = 'ambient'; countAiSection(1); }
      else if (m[field]) { countAiEdit(); delete next[field]; }
      return next;
    });
  };

  const putItem = (
    bucket: 'sItems' | 'aItems' | 'pItems', id: string, value: string, fromCapture?: boolean,
  ) => {
    setW((v) => ({ ...v, [bucket]: { ...v[bucket], [id]: value } }));
    const key = `${bucket}:${id}`;
    setMarks((m) => {
      const next = { ...m };
      if (fromCapture) { next[key] = 'ambient'; countAiSection(1); }
      else if (m[key]) { countAiEdit(); delete next[key]; }
      return next;
    });
  };

  /**
   * Pull the chart review in.
   *
   * What was said about each section while reading it is the first
   * draft of the subjective and the assessment, and typing it again
   * is the thing this is meant to stop. One click, and it is editable
   * like everything else.
   */
  const pullPrechart = () => {
    if (!prechart) return;
    const n = prechart.notes;
    const take = (id: string) => (n[id] ?? '').trim();
    setW((v) => ({
      ...v,
      sOverall: [v.sOverall, take('subjective'), take('notes')].filter(Boolean).join(' '),
      oMeasures: [v.oMeasures, take('vitals'), take('results')].filter(Boolean).join(' '),
      aOverall: [v.aOverall, take('problems')].filter(Boolean).join(' '),
    }));
    setUsedPrechart(true);
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
      if (step.kind === 'text') {
        const field = step.section === 'subjective' ? 'sOverall'
          : step.section === 'objective' ? 'oMeasures' : 'aOverall';
        put(field, step.text, true);
      } else {
        const hit = draft.problems.find((pr) => pr.name.toLowerCase().includes(step.match));
        if (hit) {
          putItem('pItems', hit.conditionId,
            [step.fields.treatment, step.fields.orders, step.fields.followUp]
              .filter(Boolean).join(' '), true);
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
    if (id === 'plan.problems') return Object.values(w.pItems).join(' ');
    if (id === 'subjective.additional') return w.sOverall;
    if (id === 'objective.vitals') return w.oMeasures;
    if (id === 'assessment.overall') return w.aOverall;
    return '';
  };
  const audit = injected.map((e) => ({ err: e, caught: wasCaught(e, fieldText(e.field)) }));
  const missed = audit.filter((a) => !a.caught);

  const written = [
    w.sOverall, w.oMeasures, w.oExam, w.aOverall, w.instructions,
    ...Object.values(w.sItems), ...Object.values(w.aItems), ...Object.values(w.pItems),
  ].some((x) => x.trim().length > 0);
  const anyChange = written || fresh.count > 0;

  // ------------------------------------------------------------ the note
  const byGroup = (g: Item['group']) => items.filter((x) => x.group === g);
  const joinGroup = (bucket: 'sItems' | 'aItems' | 'pItems', g: Item['group']) =>
    byGroup(g)
      .map((x) => (w[bucket][x.id] ? `${x.name}: ${w[bucket][x.id]}` : ''))
      .filter(Boolean).join('\n');

  const reviewLine = prechart
    ? `Chart review completed ${fmtDate(prechart.date)} by ${prechart.by}. Sections reviewed: ${
      prechart.reviewed.map((id) => TAB_LABEL[id as keyof typeof TAB_LABEL] ?? id).join(', ')
    }.`
    : '';

  const note: VisitNote = {
    subjective: {
      oneLiner: oneLiner(p, conditions),
      reason: enc.reason,
      chartReview: reviewLine,
      diagnostics: '', specialists: '',
      additional: [
        w.sOverall,
        joinGroup('sItems', 'Problems'),
        joinGroup('sItems', 'Lifestyle'),
        joinGroup('sItems', 'Preventative'),
      ].filter(Boolean).join('\n\n'),
    },
    objective: { homeMeasures: '', vitals: w.oMeasures, exam: w.oExam },
    assessment: {
      oneLiner: oneLiner(p, conditions),
      overall: [
        w.aOverall,
        joinGroup('aItems', 'Problems'),
        joinGroup('aItems', 'Lifestyle'),
        joinGroup('aItems', 'Preventative'),
      ].filter(Boolean).join('\n\n'),
    },
    plan: {
      problems: items.filter((x) => w.pItems[x.id] || w.aItems[x.id]).map((x) => ({
        id: `pp-${x.id}`, problem: x.name,
        assessment: w.aItems[x.id] ?? '',
        treatment: w.pItems[x.id] ?? '',
        orders: '', followUp: '',
      })),
      overall: [
        w.instructions,
        w.nextVisit ? `Next visit: ${fmtDate(w.nextVisit)}.` : '',
      ].filter(Boolean).join('\n\n'),
    },
  };

  const approve = () => {
    st.approveEncounter(encounterId, {
      subjective: draft,
      goals: Object.fromEntries(draft.problems.map(
        (pr) => [pr.conditionId, pr.goal ?? 'needs-improvement'],
      )),
      plan: {
        byProblem: w.pItems,
        prevention: joinGroup('pItems', 'Preventative'),
        lifestyle: joinGroup('pItems', 'Lifestyle'),
        followUp: [w.instructions, w.nextVisit ? `Next visit ${fmtDate(w.nextVisit)}.` : '']
          .filter(Boolean).join(' '),
      },
      minutes: Math.max(minutes, 1),
      planUpdated: Object.values(w.pItems).some((x) => x.trim()),
      problems: draft.problems.map((pr) => pr.conditionId),
      noChange: !anyChange,
      note,
      setting,
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

  const groups: Item['group'][] = ['Problems', 'Lifestyle', 'Preventative'];
  /** The first few words of a field, for a shut block's own line. */
  const short = (v?: string) => {
    const t = (v ?? '').replace(/\s+/g, ' ').replace(/^\u2022\s*/, '').trim();
    return t.length > 64 ? `${t.slice(0, 64)}\u2026` : t;
  };

  return (
    <div className="wrap wide">
      {/*
        * One way out, and it goes to the chart. Leaving for the day
        * was a second button saying the same thing in a way that
        * sounded like abandoning the visit, which nothing here does:
        * the working copy is not published until it is signed.
        */}
      <button className="btn quiet backlink"
        onClick={() => nav.go({ name: 'chart', patientId })}>
        &larr; Back to the chart
      </button>

      <div className="page-head">
        <h1>Visit</h1>
        <div className="sub">{p.name} &middot; {fmtDate(enc.date)}</div>
      </div>

      {checked && injected.length > 0 && (
        <DraftCheck audit={audit} signed={published}
          onClose={() => (published ? nav.go({ name: 'schedule' }) : setChecked(false))} />
      )}

      <div className="reviewgrid">
        {/* ============================================== the note itself */}
        <div className="note">
          <p className="oneliner">{oneLiner(p, conditions)}</p>

          <Sec id="S" title="Subjective" open={open} toggle={toggle}>
            <Line id="sOverall" label="How they are generally"
              value={w.sOverall} mark={marks.sOverall} rows={2}
              onChange={(v) => put('sOverall', v)} />
            {groups.map((g) => (
              <Grp key={g} id={`S-${g}`} title={g} items={byGroup(g)}
                open={open} toggle={toggle}>
                {byGroup(g).map((it) => (
                  <Blk key={it.id} id={`S-${g}-${it.id}`} title={it.name}
                    preview={short(w.sItems[it.id])} open={open} toggle={toggle}>
                    <Line id={`sItems:${it.id}`} value={w.sItems[it.id] ?? ''}
                      mark={marks[`sItems:${it.id}`]} rows={2}
                      onChange={(v) => putItem('sItems', it.id, v)} />
                  </Blk>
                ))}
              </Grp>
            ))}
          </Sec>

          <Sec id="O" title="Objective" open={open} toggle={toggle}>
            <Line id="oMeasures" label="Measurements"
              value={w.oMeasures} mark={marks.oMeasures} rows={2}
              onChange={(v) => put('oMeasures', v)} />
            <Line id="oExam" label="Physical examination"
              value={w.oExam} mark={marks.oExam} rows={2}
              onChange={(v) => put('oExam', v)} />
          </Sec>

          <Sec id="A" title="Assessment" open={open} toggle={toggle}>
            <Line id="aOverall" label="Overall"
              value={w.aOverall} mark={marks.aOverall} rows={2}
              onChange={(v) => put('aOverall', v)} />
            {groups.map((g) => (
              <Grp key={g} id={`A-${g}`} title={g} items={byGroup(g)}
                open={open} toggle={toggle}>
                {byGroup(g).map((it) => (
                  <Blk key={it.id} id={`A-${g}-${it.id}`} title={it.name}
                    preview={short(w.aItems[it.id])} open={open} toggle={toggle}>
                    <Line id={`aItems:${it.id}`} value={w.aItems[it.id] ?? ''}
                      mark={marks[`aItems:${it.id}`]} rows={2}
                      onChange={(v) => putItem('aItems', it.id, v)} />
                  </Blk>
                ))}
              </Grp>
            ))}
          </Sec>

          {/*
            * The plan, one block per thing, in the shape it is said in:
            * the sentence about where they are, then the points.
            */}
          <Sec id="P" title="Plan" open={open} toggle={toggle}>
            {groups.map((g) => (
              <Grp key={g} id={`P-${g}`} title={g} items={byGroup(g)}
                open={open} toggle={toggle}>
                {byGroup(g).map((it) => (
                  <Blk key={it.id} id={`P-${g}-${it.id}`} title={it.name}
                    preview={short(w.pItems[it.id])} open={open} toggle={toggle}>
                    {/*
                      * The problem, their sentence, then the points.
                      * The sentence is the one from the subjective,
                      * so changing it there changes it here: it is
                      * the same fact, not a second copy of it.
                      */}
                    {(w.sItems[it.id] ?? it.said).trim() && (
                      <p className="blksaid">{w.sItems[it.id] ?? it.said}</p>
                    )}
                    <Line id={`pItems:${it.id}`} value={w.pItems[it.id] ?? ''}
                      mark={marks[`pItems:${it.id}`]} rows={3}
                      onChange={(v) => putItem('pItems', it.id, v)} />
                  </Blk>
                ))}
              </Grp>
            ))}
          </Sec>

          <Sec id="N" title="What they do next" open={open} toggle={toggle}>
            {w.instructions.trim()
              ? <p className="blksaid" style={{ whiteSpace: 'pre-line' }}>{w.instructions}</p>
              : <p className="blksaid">Written in the instructions box, beside this.</p>}
            <p className="visitmeta" style={{ margin: 0 }}>
              {w.nextVisit
                ? `Next visit ${fmtDate(w.nextVisit)}.`
                : 'No next visit set. Steps with no date to finish them by is a list nobody is accountable for.'}
            </p>
          </Sec>
        </div>

        {/* ================================================ the right column */}
        <div className="stack">
          {/*
            * Where this visit stands: which version it opened on, what
            * has arrived since, and what the chart review left. All of
            * it is about the document rather than about the patient,
            * so none of it belongs over the note.
            */}
          {/*
            * What they do next, at the top of the column and open the
            * whole visit.
            *
            * It is the last thing said in the room and the first thing
            * they look at afterwards, and it gets written as the
            * conversation happens rather than remembered at the end.
            * The same text is the note's last section: one field, two
            * places to reach it, because the thing you are typing and
            * the thing that gets signed must not be two documents.
            */}
          <Panel title="Patient instructions">
            <Line id="instructions" value={w.instructions} mark={marks.instructions} rows={7}
              placeholder={'One step per line, in their words.\nBring your home readings.\nStart the half tablet on Monday.'}
              onChange={(v) => put('instructions', v)} />
            <div className="nextvis">
              <label className="wflabel" htmlFor="nextvisit">Next visit</label>
              <input id="nextvisit" className="search" type="date" value={w.nextVisit}
                onChange={(e) => put('nextVisit', e.target.value)} />
            </div>
          </Panel>

          {/*
            * Everything that is about the visit rather than about the
            * patient: where it opened, what it is capturing, how long
            * it has run, and the one act that ends it.
            */}
          <Panel title="This visit" right={!signed && (
            listening ? (
              <button className="btn sm listening" onClick={stopCapture}>
                <span className="pulse" /> Stop &middot;{' '}
                {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}
              </button>
            ) : (
              <button className="btn sm ghost" onClick={startListening}>Listen</button>
            )
          )}>
            <p className="visitmeta openedon">
              {approved
                ? `Opened on version ${approved.version}, approved ${relative(approved.approvedAt)}.`
                : 'No approved care plan yet.'}
              {fresh.count > 0 && (
                <> <span className="freshmark">
                  {fresh.count} record{fresh.count === 1 ? '' : 's'} since, not yet incorporated
                  {fresh.urgent > 0 && `, ${fresh.urgent} flagged urgent`}.
                </span></>
              )}
            </p>
            {prechart && !signed && (
              <p className="visitmeta">
                Chart review {relative(prechart.date)}: {prechart.reviewed.length} of{' '}
                {REVIEW.length} sections.{' '}
                {!usedPrechart && (
                  <button className="linkish" onClick={pullPrechart}>
                    Put what you said into this note
                  </button>
                )}
              </p>
            )}
            <div className="row" style={{ gap: 6, flexWrap: 'wrap', margin: '10px 0' }}>
              {(['in-person', 'telehealth', 'home'] as VisitSetting[]).map((v) => (
                <button key={v} className={`btn sm ${setting === v ? '' : 'ghost'}`}
                  onClick={() => setSetting(v)}>{SETTING_LABEL[v]}</button>
              ))}
            </div>
            <div className="row" style={{ gap: 8, alignItems: 'center' }}>
              <input className="search" style={{ maxWidth: 90 }} type="number" value={minutes}
                onChange={(e) => { setRunning(false); setMinutes(Number(e.target.value)); }} />
              <span className="small muted">minutes</span>
              <button className="btn ghost sm" onClick={() => setRunning((v) => !v)}>
                {running ? 'Pause' : 'Start'}
              </button>
            </div>

            <div className="signrow">
              {signed ? (
                <span className="small muted">
                  Signed {enc.signedAt && fmtDate(enc.signedAt)}. The note is kept as it was
                  signed and the care plan moved to the next version.
                </span>
              ) : (
                <>
                  <button className="btn" onClick={approve}>Sign</button>
                  {injected.length > 0 && !listening && (
                    <button className="btn ghost sm" onClick={() => setChecked(true)}>
                      Check the draft
                    </button>
                  )}
                  <span className="small muted">
                    Publishes version {(approved?.version ?? 0) + 1}
                    {!anyChange && ', unchanged'}.
                  </span>
                </>
              )}
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
 * A section, a group, a block. Three depths, one appearance.
 *
 * Everything on this screen is the same typeface at the same size.
 * Depth is a heading in a heavier weight and an indent, not a jump
 * from a serif display face to body copy and back twice a screen. A
 * note that changes typeface every forty words is a note you read as
 * a layout rather than as sentences.
 *
 * All three fold. A visit about one uncontrolled problem should be
 * able to look like a visit about one uncontrolled problem.
 */
function Fold({ id, title, depth, right, open, toggle, shutByDefault, children }: {
  id: string;
  title: string;
  depth: 1 | 2 | 3;
  right?: React.ReactNode;
  open: Record<string, boolean>;
  toggle: (id: string, next: boolean) => void;
  /** Blocks start shut; sections and groups start open. */
  shutByDefault?: boolean;
  children: React.ReactNode;
}) {
  const shut = shutByDefault ? open[id] !== true : open[id] === false;
  return (
    <section className={`fold d${depth}${shut ? ' shut' : ''}`}>
      <button className="foldhead" onClick={() => toggle(id, shut)}>
        <span className="foldarrow" aria-hidden="true">{shut ? '\u203a' : '\u2304'}</span>
        <span className="foldtitle">{title}</span>
        {right && <span className="foldright">{right}</span>}
      </button>
      {!shut && <div className="foldbody">{children}</div>}
    </section>
  );
}

const Sec = ({ id, title, open, toggle, children }: {
  id: string; title: string;
  open: Record<string, boolean>; toggle: (id: string, next: boolean) => void;
  children: React.ReactNode;
}) => (
  <Fold id={id} title={title} depth={1} open={open} toggle={toggle}>{children}</Fold>
);

/** Silent when the group is empty: a heading over nothing reads as a finding. */
function Grp({ id, title, items, open, toggle, children }: {
  id: string; title: string; items: Item[];
  open: Record<string, boolean>; toggle: (id: string, next: boolean) => void;
  children: React.ReactNode;
}) {
  if (items.length === 0) return null;
  return (
    <Fold id={id} title={title} depth={2} right={`${items.length}`}
      open={open} toggle={toggle}>{children}</Fold>
  );
}

/**
 * One thing, shut by default, with its first line showing.
 *
 * Open, every block is a paragraph and a list; eleven of them is a
 * screen you scroll rather than read. Shut, it is a line that says
 * what it is and what is currently written, which is what you need
 * to decide whether to open it.
 */
const Blk = ({ id, title, preview, open, toggle, children }: {
  id: string; title: string; preview?: string;
  open: Record<string, boolean>; toggle: (id: string, next: boolean) => void;
  children: React.ReactNode;
}) => (
  <Fold id={id} title={title} depth={3} shutByDefault
    right={open[id] ? undefined : preview}
    open={open} toggle={toggle}>{children}</Fold>
);

/** A field. It arrives with the record already written into it. */
function Line({ id, label, value, onChange, rows = 2, mark, placeholder }: {
  id: string;
  label?: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  mark?: 'ambient';
  placeholder?: string;
}) {
  /*
   * Grows to its content. A note field that scrolls inside itself
   * hides the end of a plan behind two pixels of scrollbar, and the
   * end of a plan is where the follow-up is.
   */
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    // Grows, never shrinks below the room it was given. An empty
    // instructions box that collapses to one line does not look like
    // somewhere to write.
    el.style.height = `${Math.max(el.scrollHeight, rows * 25 + 14)}px`;
  }, [value, rows]);

  return (
    <div className="wfield">
      {(label || mark) && (
        <div className="wflabel">
          {label}
          {mark && <span className="markchip">from the capture</span>}
        </div>
      )}
      <textarea ref={ref} className="prose" rows={rows} value={value} placeholder={placeholder}
        id={id} onChange={(e) => onChange(e.target.value)} />
    </div>
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
  return (
    <Panel title="Orders" right={<span className="small muted">{orders.length}</span>}>
      <div className="stack-sm">
        {orders.length === 0 && <span className="small muted">None yet.</span>}
        {orders.map((o) => (
          <div key={o.id} className="row" style={{ alignItems: 'flex-start' }}>
            <Chip tone="accent">{ORDER_KINDS.find((k) => k.id === o.kind)?.label}</Chip>
            <div style={{ flex: 1, minWidth: 0 }}><div className="small">{o.text}</div></div>
            <button className="btn quiet sm" onClick={() => st.removeOrder(o.id)}>&times;</button>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--line-2)' }}>
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
      </div>
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
