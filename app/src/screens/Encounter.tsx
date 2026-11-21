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
  /** What the record already knows, shown beside the field. */
  context?: string;
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
  comments: Record<string, string>;
}

const EMPTY_WORKING: Working = {
  sOverall: '', sItems: {}, oMeasures: '', oExam: '',
  aOverall: '', aItems: {}, pItems: {},
  instructions: '', nextVisit: '', comments: {},
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

  /** The one list, in the one order, used by all four sections. */
  const items = useMemo<Item[]>(() => {
    const dom = (d: string) => LIFESTYLE_DOMAINS.find((x) => x.id === d)?.label ?? d;
    return [
      ...draft.problems.map((pr) => ({
        id: pr.conditionId, name: pr.name, group: 'Problems' as const,
        context: pr.clauses.map((c) => c.text).join(' '),
      })),
      // Two prescriptions can share a domain, and two rows both
      // called "Nutrition" is two rows you have to open to tell apart.
      ...lifestyle.map((l) => {
        const same = lifestyle.filter((x) => x.domain === l.domain);
        const short = l.prescription.split(/[.,]/)[0].trim();
        return {
          id: l.id,
          name: same.length > 1 ? `${dom(l.domain)}: ${short}` : dom(l.domain),
          group: 'Lifestyle' as const,
          context: same.length > 1 ? l.prescription : l.prescription,
        };
      }),
      ...prevention.map((x) => ({
        id: x.id, name: x.name, group: 'Preventative' as const,
        context: x.status === 'current'
          ? `Current${x.lastDone ? `, last done ${fmtDate(x.lastDone)}` : ''}.`
          : `${x.status === 'overdue' ? 'Overdue' : 'Due'}${x.dueBy ? ` ${fmtDate(x.dueBy)}` : ''}.`,
      })),
    ];
  }, [draft.problems, lifestyle, prevention]);

  const [w, setW] = useState<Working>(() => ({
    ...EMPTY_WORKING,
    // The plan carries forward. The rest of the note is about today
    // and starts empty, because last week's words in today's note is
    // how a record stops being read.
    pItems: { ...(approved?.plan.byProblem ?? master?.plan?.byProblem ?? {}) },
    nextVisit: '',
  }));
  const [marks, setMarks] = useState<Marks>({});
  const [setting, setSetting] = useState<VisitSetting>(enc?.setting ?? 'in-person');
  const [usedPrechart, setUsedPrechart] = useState(false);

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
  const [faulty, setFaulty] = useState(true);
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

  const comment = (key: string, value: string) =>
    setW((v) => ({ ...v, comments: { ...v.comments, [key]: value } }));

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

  return (
    <div className="wrap wide">
      <div className="page-head row" style={{ alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <h1>Visit</h1>
          <div className="sub">
            {p.name} &middot; {fmtDate(enc.date)} &middot;{' '}
            {approved
              ? <>opened on version {approved.version}, approved {relative(approved.approvedAt)}</>
              : 'no approved care plan yet'}
          </div>
        </div>
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
        {!signed && !listening && injected.length === 0 && (
          <button className="btn quiet sm"
            title="Whether the simulated capture makes mistakes"
            onClick={() => setFaulty((f) => !f)}>
            Capture: {faulty ? 'fallible' : 'clean'}
          </button>
        )}
        {!signed && !listening && injected.length > 0 && (
          <button className="btn ghost" onClick={() => setChecked(true)}>Check the draft</button>
        )}
        <button className="btn quiet" onClick={() => nav.go({ name: 'chart', patientId })}>
          Chart
        </button>
        <button className="btn quiet" onClick={() => nav.go({ name: 'schedule' })}>
          Leave
        </button>
      </div>

      {checked && injected.length > 0 && (
        <DraftCheck audit={audit} signed={published}
          onClose={() => (published ? nav.go({ name: 'schedule' }) : setChecked(false))} />
      )}

      <div className="reviewgrid">
        {/* ============================================== the note itself */}
        <div className="stack">
          <p className="oneliner">{oneLiner(p, conditions)}</p>

          {prechart && !usedPrechart && !signed && (
            <p className="prechartline">
              Chart review {relative(prechart.date)}: {prechart.reviewed.length} of{' '}
              {REVIEW.length} sections.{' '}
              <button className="linkish" onClick={pullPrechart}>
                Put what you said into this note
              </button>
            </p>
          )}

          {/* ------------------------------------------------- subjective */}
          <Sec letter="S" title="Subjective" note="What they say, in the order you ask.">
            <Field id="sOverall" label="How they are generally"
              placeholder="Open the visit here, before any problem is named."
              value={w.sOverall} mark={marks.sOverall} rows={3}
              comment={w.comments.sOverall} onComment={(v) => comment('sOverall', v)}
              onChange={(v) => put('sOverall', v)} />
            {groups.map((g) => (
              <ItemGroup key={g} title={g} items={byGroup(g)}
                values={w.sItems} marks={marks} bucket="sItems"
                comments={w.comments} onComment={comment}
                placeholder="What they say about this one."
                onChange={(id, v) => putItem('sItems', id, v)} />
            ))}
          </Sec>

          {/* -------------------------------------------------- objective */}
          <Sec letter="O" title="Objective" note="Measured and examined today.">
            <Field id="oMeasures" label="Measurements"
              placeholder="Vitals taken today, and the home readings they brought."
              value={w.oMeasures} mark={marks.oMeasures} rows={3}
              comment={w.comments.oMeasures} onComment={(v) => comment('oMeasures', v)}
              onChange={(v) => put('oMeasures', v)} />
            <Field id="oExam" label="Physical examination"
              placeholder="What was examined. A blank here is not a normal examination."
              value={w.oExam} mark={marks.oExam} rows={3}
              comment={w.comments.oExam} onComment={(v) => comment('oExam', v)}
              onChange={(v) => put('oExam', v)} />
          </Sec>

          {/* ------------------------------------------------- assessment */}
          <Sec letter="A" title="Assessment"
            note="Where they are overall, then where each thing stands.">
            <Field id="aOverall" label="Overall"
              placeholder="The sentence you would say to them about their health as a whole."
              value={w.aOverall} mark={marks.aOverall} rows={3}
              comment={w.comments.aOverall} onComment={(v) => comment('aOverall', v)}
              onChange={(v) => put('aOverall', v)} />
            {groups.map((g) => (
              <ItemGroup key={g} title={g} items={byGroup(g)}
                values={w.aItems} marks={marks} bucket="aItems"
                comments={w.comments} onComment={comment}
                placeholder="Where this one stands, in a sentence."
                onChange={(id, v) => putItem('aItems', id, v)} />
            ))}
          </Sec>

          {/* ------------------------------------------------------- plan */}
          <Sec letter="P" title="Plan" note="What happens next for each of them.">
            {groups.map((g) => (
              <ItemGroup key={g} title={g} items={byGroup(g)}
                values={w.pItems} marks={marks} bucket="pItems"
                comments={w.comments} onComment={comment}
                placeholder="What is being done, and what happens next."
                onChange={(id, v) => putItem('pItems', id, v)} />
            ))}
          </Sec>

          {/* ----------------------------------------------- instructions */}
          {/*
            * The last thing said in the room and the first thing they
            * will look at afterwards. Steps, in their words, one per
            * line, ending with the date we do this again.
            */}
          <Sec letter="&rarr;" title="What they do next"
            note="Their instructions, in steps. This is what they are handed.">
            <Field id="instructions" label="Between now and the next visit"
              placeholder={'One step per line.\nBring your home readings.\nStart the half tablet on Monday.'}
              value={w.instructions} mark={marks.instructions} rows={6}
              comment={w.comments.instructions} onComment={(v) => comment('instructions', v)}
              onChange={(v) => put('instructions', v)} />
            <div className="nextvis">
              <label className="wflabel" htmlFor="nextvisit">Next visit</label>
              <input id="nextvisit" className="search" type="date" value={w.nextVisit}
                onChange={(e) => put('nextVisit', e.target.value)} />
              {w.instructions.trim() && !w.nextVisit && (
                <span className="small muted">
                  Steps with no date to finish them by is a list nobody is accountable for.
                </span>
              )}
            </div>
          </Sec>
        </div>

        {/* ================================================ the right column */}
        <div className="stack">
          {!signed && (
            <Orders encounterId={encounterId} patientId={patientId}
              orders={st.ordersFor(encounterId)} />
          )}

          <Panel title="This visit">
            <div className="row" style={{ gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
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
          </Panel>

          {signed ? (
            <p className="small muted">
              Approved {enc.signedAt && fmtDate(enc.signedAt)}. The note is kept as it was
              signed and the care plan moved to the next version.
            </p>
          ) : (
            <button className="btn" onClick={approve}>
              {anyChange
                ? `Approve and publish version ${(approved?.version ?? 0) + 1}`
                : 'Approve as seen, no change'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ bits */

/** One lettered section of the note. */
function Sec({ letter, title, note, children }: {
  letter: string; title: string; note: string; children: React.ReactNode;
}) {
  return (
    <section className="nsec">
      <div className="nsechead">
        <span className="letter" dangerouslySetInnerHTML={{ __html: letter }} />
        <h2>{title}</h2>
        <span className="nsecnote">{note}</span>
      </div>
      <div className="nsecbody">{children}</div>
    </section>
  );
}

/**
 * One group of things, each with a field.
 *
 * Silent when the group is empty, because a heading over nothing in a
 * note reads as a finding of nothing.
 */
function ItemGroup({
  title, items, values, marks, bucket, placeholder, onChange, comments, onComment,
}: {
  title: string;
  items: Item[];
  values: Record<string, string>;
  marks: Marks;
  bucket: string;
  placeholder: string;
  onChange: (id: string, v: string) => void;
  comments: Record<string, string>;
  onComment: (key: string, v: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div className="nitemgrp">
      <div className="nitemhead">{title}</div>
      {items.map((it) => (
        <Field key={it.id} id={`${bucket}:${it.id}`} label={it.name} context={it.context}
          placeholder={placeholder} rows={2}
          value={values[it.id] ?? ''} mark={marks[`${bucket}:${it.id}`]}
          comment={comments[`${bucket}:${it.id}`]}
          onComment={(v) => onComment(`${bucket}:${it.id}`, v)}
          onChange={(v) => onChange(it.id, v)} />
      ))}
    </div>
  );
}

/**
 * A field, with what the record already knows beside it and a place
 * to put what you think about it.
 *
 * The comment is not part of the note the patient is handed. It is
 * the thing a physician would otherwise write in the margin and then
 * lose, and there was nowhere to put it.
 */
function Field({
  id, label, value, onChange, rows = 3, mark, placeholder, context, comment, onComment,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  mark?: 'ambient';
  placeholder?: string;
  context?: string;
  comment?: string;
  onComment?: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const showing = open || !!comment;
  return (
    <div className="wfield">
      <div className="wflabel">
        {label}
        {mark && <span className="markchip">from the capture</span>}
        <span className="spacer" />
        {onComment && (
          <button className="linkish wfcomment" onClick={() => setOpen((v) => !v)}>
            {comment ? 'Comment' : '+ Comment'}
          </button>
        )}
      </div>
      {context && <p className="wfcontext">{context}</p>}
      <textarea className="prose" rows={rows} value={value} placeholder={placeholder}
        id={id} onChange={(e) => onChange(e.target.value)} />
      {showing && onComment && (
        <input className="search wfcommentbox" value={comment ?? ''}
          placeholder="Your note on this. Stays in the record, not in what they are handed."
          onChange={(e) => onComment(e.target.value)} />
      )}
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
