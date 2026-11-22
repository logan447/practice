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
import { fmtDate } from '../lib/format';
import { oneLiner } from './chart/AssessPlan';
import { livingSubjective } from '../lib/subjective';
import type { LivingSubjective } from '../lib/subjective';
import { ambientScript, wasCaught, ERROR_LABEL, type InjectedError } from '../lib/ambient';
import { TAB_LABEL } from './chart/drawers';
import { LIFESTYLE_DOMAINS } from '../domain/types';
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
  /** One box per section. The sections are the whole note. */
  subjective: string;
  objective: string;
  plan: string;
  instructions: string;
  nextVisit: string;
}

const EMPTY_WORKING: Working = {
  subjective: '', objective: '', plan: '', instructions: '', nextVisit: '',
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
    const block = (lines: string[]) => lines.filter(Boolean).join('\n');

    const subjective = items
      .filter((it) => it.said.trim())
      .map((it) => block([it.name, it.said]))
      .join('\n\n');

    /*
     * The problem, where it stands, what was agreed last time, then
     * the points of what is actually being done. The last of those is
     * the list a reader is looking for and it was being dropped
     * whenever a prior plan existed, which is every visit after the
     * first.
     */
    const plan = items
      .map((it) => block([
        it.name,
        it.standing,
        carried[it.id]?.trim() ?? '',
        it.doing,
      ]))
      .join('\n\n');

    /*
     * What was said during the chart review, already in the boxes.
     *
     * It used to be offered on a line above the note with a link that
     * put it in. Nobody opens a visit wanting to decline the chart
     * review they just did, so the offer was a banner over the note
     * whose only answer was yes.
     */
    const said = (id: string) => (prechart?.notes[id] ?? '').trim();

    const lastOffice = st.vitalsFor(patientId).find((v) => v.source === 'office');
    const objective = lastOffice
      ? [
        lastOffice.systolic ? `${lastOffice.systolic}/${lastOffice.diastolic}` : '',
        lastOffice.heartRate ? `HR ${lastOffice.heartRate}` : '',
        lastOffice.weightLb ? `${lastOffice.weightLb} lb` : '',
        lastOffice.bmi ? `BMI ${lastOffice.bmi}` : '',
      ].filter(Boolean).join(' \u00b7 ') + ` (${fmtDate(lastOffice.date)})`
      : '';

    setW((v) => ({
      ...v,
      subjective: [said('subjective'), said('notes'), subjective]
        .filter(Boolean).join('\n\n'),
      objective: [said('vitals'), said('results'), objective]
        .filter(Boolean).join('\n'),
      plan: [said('problems'), plan].filter(Boolean).join('\n\n'),
    }));
  }, [items, approved, master, st, patientId, prechart]);

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

  const note: VisitNote = {
    subjective: {
      oneLiner: oneLiner(p, conditions),
      reason: enc.reason,
      chartReview: reviewLine,
      diagnostics: '', specialists: '',
      additional: w.subjective,
    },
    objective: { homeMeasures: '', vitals: w.objective, exam: '' },
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
        // The plan is prose now, so the per-problem map is rebuilt
        // from it by matching each block's first line to a problem.
        byProblem: Object.fromEntries(
          items.map((it) => [it.id, blockFor(w.plan, it.name)]).filter(([, v]) => v),
        ),
        prevention: '',
        lifestyle: '',
        followUp: [w.instructions, w.nextVisit ? `Next visit ${fmtDate(w.nextVisit)}.` : '']
          .filter(Boolean).join(' '),
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
        <span className="vwhen">Visit &middot; {fmtDate(enc.date)}</span>
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

      <p className="oneliner vone">{oneLiner(p, conditions)}</p>

      {checked && injected.length > 0 && (
        <DraftCheck audit={audit} signed={published}
          onClose={() => (published ? nav.go({ name: 'schedule' }) : setChecked(false))} />
      )}

      <div className="reviewgrid">
        {/* ============================================== the note itself */}
        <div className="note">
          <Box id="subjective" title="Subjective" value={w.subjective}
            mark={marks.subjective} onChange={(v) => put('subjective', v)} />
          <Box id="objective" title="Objective" value={w.objective}
            mark={marks.objective} onChange={(v) => put('objective', v)} />
          <Box id="plan" title="Assessment and plan" value={w.plan}
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
function Box({ id, title, value, onChange, rows = 3, mark, placeholder }: {
  id: string;
  title?: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  mark?: 'ambient';
  placeholder?: string;
}) {
  /*
   * Folds, one level. A visit about one thing should be able to look
   * like a visit about one thing, and a section you have finished
   * writing should be able to get out of the way of the next one.
   */
  const [shut, setShut] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(el.scrollHeight, rows * 25 + 14)}px`;
  }, [value, rows]);

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
      <button className="nboxhead" onClick={() => setShut((v) => !v)}>
        <span className="foldarrow" aria-hidden="true">{shut ? '\u203a' : '\u2304'}</span>
        <span className="nboxtitle">{title}</span>
        {mark && <span className="markchip">from the capture</span>}
        {shut && <span className="nboxcount">{value.split('\n').filter(Boolean).length} lines</span>}
      </button>
      {!shut && (
        <textarea ref={ref} className="prose" rows={rows} value={value} placeholder={placeholder}
          id={id} onChange={(e) => onChange(e.target.value)} />
      )}
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
