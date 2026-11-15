/**
 * One encounter. Two ways in, one document.
 *
 * A visit and a care plan review are the same act of work: open the
 * approved care plan, read what has arrived since, decide what it
 * means, write that down, ask for what is missing, approve. The only
 * real difference is where the words come from. In a visit there is
 * somebody in the room and the capture is listening to them. In a
 * review the physician is reading and dictating. Everything after
 * that is identical, and it has to be identical, or the review
 * becomes the thing that gets skipped.
 *
 * So this screen is the care plan, editable, with the new information
 * beside it. Not a note editor that later updates a summary: there is
 * no second document to keep in step. The signed note is generated
 * from what this encounter changed, which is why nothing here is
 * typed twice.
 *
 * Three columns of attention, two of layout.
 *
 * Left, the working copy of the living care plan. Editing here is
 * editing the next approved version.
 *
 * Right, three things: what has arrived since the last approval and
 * is waiting to be read into the plan, what we need back from the
 * patient, and the capture.
 *
 * Approving does the rest in one act: freezes the version, preserves
 * the note as it was signed, sends the requests, records the time.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../lib/store';
import { useNav } from '../lib/nav';
import { Chip, Panel } from '../components/ui';
import { fmtDate, relative } from '../lib/format';
import { oneLiner } from './chart/AssessPlan';
import { livingSubjective } from '../lib/subjective';
import type { LivingSubjective, ProblemSummary, CategorySummary } from '../lib/subjective';
import { ambientScript, wasCaught, ERROR_LABEL, type InjectedError } from '../lib/ambient';
import { dictationScript } from '../lib/capture';
import {
  GOAL_LABEL, ACTION_LABEL, INTERVAL_LABEL, SETTING_LABEL,
} from '../domain/types';
import type {
  CareGoalStatus, InfoRequest, VisitSetting, VisitNote, Order, OrderKind,
} from '../domain/types';
import { ORDER_KINDS } from '../domain/types';
import {
  startVisit as metricStart, signVisit as metricSign, endVisit,
  countAiSection, countAiEdit, recordErrors,
} from '../lib/metrics';

const ASK_SUGGESTIONS = [
  'Send your home blood pressure readings from the last two weeks.',
  'Tell us whether you have started the new medicine, and how you are finding it.',
  'Let us know how the walking has gone since we last spoke.',
  'Confirm whether the referral appointment has happened.',
  'Tell us about any new symptoms since we last spoke.',
];

/** The editable half of the care plan. Everything else is derived. */
interface Working {
  /** What was said in the room, or dictated at the desk. */
  narrative: string;
  /** What was measured or examined today. */
  objective: string;
  /** The overall assessment, this encounter. */
  assessment: string;
  byProblem: Record<string, string>;
  prevention: string;
  lifestyle: string;
  followUp: string;
}

type Marks = Record<string, 'ambient'>;

export function Encounter({ encounterId }: { encounterId: string }) {
  const st = useStore();
  const nav = useNav();
  const enc = st.encounter(encounterId);
  const patientId = enc?.patientId ?? '';
  const p = st.patient(patientId);
  const conditions = st.conditionsFor(patientId);

  const approved = st.currentVersion(patientId);
  const approvedIds = new Set(approved?.incorporated ?? []);
  const fresh = st.newSince(patientId);
  const openAsks = st.infoRequestsFor(patientId, 'open');
  const answered = st.infoRequestsFor(patientId, 'answered')
    .filter((r) => !approvedIds.has(r.answeredBy ?? ''));

  /**
   * The draft: everything on file, read now.
   *
   * Not written anywhere until this encounter is approved. The same
   * function produced the approved version, so the difference between
   * the two is the new information and nothing else.
   */
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

  const prior = approved?.subjective as LivingSubjective | undefined;
  const master = st.masterPlanFor(patientId);

  const [goals, setGoals] = useState<Record<string, CareGoalStatus>>(
    () => approved?.goals ?? {},
  );
  const [w, setW] = useState<Working>(() => ({
    narrative: '', objective: '', assessment: '',
    byProblem: { ...(approved?.plan.byProblem ?? master?.plan?.byProblem ?? {}) },
    prevention: approved?.plan.prevention ?? master?.plan?.prevention ?? '',
    lifestyle: approved?.plan.lifestyle ?? master?.plan?.lifestyle ?? '',
    followUp: approved?.plan.followUp ?? master?.plan?.followUp ?? '',
  }));
  const [marks, setMarks] = useState<Marks>({});
  const [planTouched, setPlanTouched] = useState(false);
  const [asking, setAsking] = useState('');
  const [setting, setSetting] = useState<VisitSetting>(enc?.setting ?? 'in-person');
  const [wellness, setWellness] = useState(!!enc?.wellness);
  /** Records the physician has ticked off in the reconciliation tray. */
  const [read, setRead] = useState<Set<string>>(() => new Set());

  // ------------------------------------------------------------ the clock
  /**
   * Running from the moment the encounter opens.
   *
   * Typing a number at the end is how a time record becomes an
   * estimate, and an estimate is the thing an audit is least able to
   * accept. Editable, because the clock does not know about the phone
   * call, but it starts from something real.
   */
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
  /** Set once the encounter has been approved, so the check changes tense. */
  const [published, setPublished] = useState(false);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  /**
   * The two keys worth having.
   *
   * Approving is the end of the encounter and starting the capture is
   * the beginning of it, and both happen with hands on a keyboard
   * while looking at somebody. Held in refs because the handlers
   * close over state that changes every keystroke.
   */
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

  const isReview = enc.kind === 'review';
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

  const putProblem = (id: string, value: string, fromCapture?: boolean) => {
    setPlanTouched(true);
    setW((v) => ({ ...v, byProblem: { ...v.byProblem, [id]: value } }));
    setMarks((m) => {
      const next = { ...m };
      if (fromCapture) { next[`p:${id}`] = 'ambient'; countAiSection(1); }
      else if (m[`p:${id}`]) { countAiEdit(); delete next[`p:${id}`]; }
      return next;
    });
  };

  /**
   * Listening, for a visit.
   *
   * The script carries deliberate errors, because a prototype whose
   * capture is always right teaches the wrong lesson: the weight of
   * the reading step gets designed to match what you have watched the
   * thing do.
   */
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
        const field = step.section === 'subjective' ? 'narrative'
          : step.section === 'objective' ? 'objective' : 'assessment';
        put(field, step.text, true);
      } else {
        const hit = draft.problems.find((pr) => pr.name.toLowerCase().includes(step.match));
        if (hit) {
          putProblem(
            hit.conditionId,
            [step.fields.treatment, step.fields.orders, step.fields.followUp]
              .filter(Boolean).join(' '),
            true,
          );
        }
      }
      if (step === steps[steps.length - 1]) setListening(false);
    }, step.at));
  };

  /** Dictating, for a review. Assembled from this patient's own list. */
  const startDictation = () => {
    setListening(true);
    setElapsed(0);
    const lines = dictationScript(draft.problems, conditions);
    timers.current = lines.map((line) => window.setTimeout(() => {
      if (line.target === 'narrative' || line.target === 'assessment' || line.target === 'followUp') {
        put(line.target, line.text, true);
      } else {
        putProblem(line.target, line.text, true);
      }
      if (line === lines[lines.length - 1]) setListening(false);
    }, line.at));
  };

  const stopCapture = () => {
    timers.current.forEach(clearTimeout);
    setListening(false);
  };

  // ------------------------------------------------- what the capture got wrong
  const fieldText = (id: string): string => {
    if (id === 'plan.problems') return Object.values(w.byProblem).join(' ');
    if (id === 'subjective.additional') return w.narrative;
    if (id === 'objective.vitals') return w.objective;
    if (id === 'assessment.overall') return w.assessment;
    return '';
  };
  const audit = injected.map((e) => ({ err: e, caught: wasCaught(e, fieldText(e.field)) }));
  const missed = audit.filter((a) => !a.caught);

  // ------------------------------------------------------------- changed?
  const changed = (pr: ProblemSummary) => {
    const was = prior?.problems.find((x) => x.conditionId === pr.conditionId);
    if (!was) return true;
    return was.clauses.map((c) => c.text).join(' ') !== pr.clauses.map((c) => c.text).join(' ')
      || (goals[pr.conditionId] ?? pr.goal) !== was.goal;
  };
  const anyChange = draft.problems.some(changed) || fresh.count > 0
    || planTouched || w.narrative.trim().length > 0 || w.assessment.trim().length > 0;

  // ------------------------------------------------------------ approving
  const note: VisitNote = {
    subjective: {
      oneLiner: oneLiner(p, conditions),
      reason: enc.reason,
      chartReview: '',
      diagnostics: '', specialists: '',
      additional: w.narrative,
    },
    objective: { homeMeasures: '', vitals: w.objective, exam: '' },
    assessment: { oneLiner: oneLiner(p, conditions), overall: w.assessment },
    plan: {
      problems: draft.problems.map((pr) => ({
        id: `pp-${pr.conditionId}`, problem: pr.name,
        assessment: GOAL_LABEL[goals[pr.conditionId] ?? pr.goal ?? 'needs-improvement'],
        treatment: w.byProblem[pr.conditionId] ?? '',
        orders: '', followUp: '',
      })),
      overall: w.followUp,
    },
  };

  const approve = () => {
    st.approveEncounter(encounterId, {
      subjective: {
        ...draft,
        problems: draft.problems.map((pr) => ({
          ...pr, goal: goals[pr.conditionId] ?? pr.goal,
        })),
      },
      goals: Object.fromEntries(draft.problems.map(
        (pr) => [pr.conditionId, goals[pr.conditionId] ?? pr.goal ?? 'needs-improvement'],
      )),
      plan: {
        byProblem: w.byProblem,
        prevention: w.prevention,
        lifestyle: w.lifestyle,
        followUp: w.followUp,
      },
      minutes: Math.max(minutes, 1),
      planUpdated: planTouched,
      problems: draft.problems.map((pr) => pr.conditionId),
      noChange: !anyChange,
      note,
      setting: isReview ? undefined : setting,
      wellness: isReview ? undefined : wellness,
    });
    metricSign(enc.id);
    if (injected.length > 0) {
      recordErrors(enc.id, injected.length, audit.length - missed.length,
        missed.filter((a) => a.err.consequential).length);
      // Do not leave yet. The count of what went into the record is
      // the only calibration this prototype offers, and it is worth
      // nothing if it appears after the screen has changed.
      setPublished(true);
      setChecked(true);
      return;
    }
    nav.go({ name: 'today' });
  };

  const label = isReview ? 'Care plan review' : 'Visit';
  approveRef.current = signed ? null : approve;
  captureRef.current = signed ? null
    : (listening ? stopCapture : (isReview ? startDictation : startListening));

  return (
    <div className="wrap wide">
      <div className="page-head row" style={{ alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <h1>{label}</h1>
          <div className="sub">
            {p.name} &middot; {fmtDate(enc.date)} &middot;{' '}
            {approved
              ? <>opened on version {approved.version}, approved {relative(approved.approvedAt)}</>
              : 'no approved care plan yet'}
          </div>
        </div>
        <button className="btn ghost" onClick={() => nav.go({ name: 'chart', patientId })}>
          Open the chart
        </button>
        <button className="btn ghost" onClick={() => nav.go({ name: 'today' })}>
          Leave without approving
        </button>
      </div>

      {checked && injected.length > 0 && (
        <DraftCheck audit={audit} signed={published}
          onClose={() => (published ? nav.go({ name: 'today' }) : setChecked(false))} />
      )}

      <div className="reviewgrid">
        {/* ============================================ the working copy */}
        <div className="stack">
          <Panel title="Living care plan, working copy" right={
            <span className="small muted">
              {anyChange ? 'Changed from the approved version' : 'Nothing has changed'}
            </span>
          }>
            <p className="oneliner" style={{ marginBottom: 12 }}>{oneLiner(p, conditions)}</p>

            {/* ------------------------------------------------ subjective */}
            <h3 className="wsec">Subjective</h3>
            <p className="psum">{draft.overall.map((c) => c.text).join(' ')}</p>
            {draft.interval.length > 0 && (
              <ul className="intlist">
                {draft.interval.map((r, i) => (
                  <li key={i}>
                    <span className="intk">{r.label}</span>
                    {r.date && <span className="intd">{fmtDate(r.date)}</span>}
                    <span className="intt">{r.text}</span>
                  </li>
                ))}
              </ul>
            )}
            <Field label={isReview ? 'What this review found' : 'What they said today'}
              value={w.narrative} mark={marks.narrative} rows={4}
              onChange={(v) => put('narrative', v)} />

            {/* --------------------------------------------- problem by problem */}
            {draft.problems.map((pr) => (
              <div key={pr.conditionId} id={`w-${pr.conditionId}`}
                className={`wprob${changed(pr) ? ' moved' : ''}`}>
                <div className="sphead">
                  <strong>{pr.name}</strong>
                  {pr.code && <span className="ppcode">{pr.code}</span>}
                  <span className="spacer" />
                  {(['at-goal', 'needs-improvement'] as CareGoalStatus[]).map((g) => (
                    <button key={g}
                      className={`btn sm ${(goals[pr.conditionId] ?? pr.goal) === g ? '' : 'ghost'}`}
                      onClick={() => setGoals((v) => ({ ...v, [pr.conditionId]: g }))}>
                      {GOAL_LABEL[g]}
                    </button>
                  ))}
                </div>
                <p className="psum">{pr.clauses.map((c) => c.text).join(' ')}</p>
                {pr.conflict && <p className="pconflict">{pr.conflict}</p>}
                {pr.interventions.length > 0 && (
                  <ul className="actlist">
                    {pr.interventions.map((iv, i) => (
                      <li key={i} className="actrow">
                        <span className="actl">{iv.label}</span>
                        <Chip tone={iv.status === 'needs-attention' ? 'warn' : undefined}>
                          {ACTION_LABEL[iv.status]}
                        </Chip>
                        {iv.note && <span className="actn">{iv.note}</span>}
                      </li>
                    ))}
                  </ul>
                )}
                <Field label="Plan" value={w.byProblem[pr.conditionId] ?? ''}
                  mark={marks[`p:${pr.conditionId}`]} rows={2}
                  placeholder="What happens next for this problem."
                  onChange={(v) => putProblem(pr.conditionId, v)} />
              </div>
            ))}

            {/* -------------------------- prevention and lifestyle, same shape */}
            {draft.categories.map((cat) => (
              <Category key={cat.key} cat={cat}
                goal={goals[cat.key] ?? cat.goal}
                onGoal={(g) => setGoals((v) => ({ ...v, [cat.key]: g }))}
                value={cat.key === 'prevention' ? w.prevention : w.lifestyle}
                onChange={(v) => {
                  setPlanTouched(true);
                  put(cat.key === 'prevention' ? 'prevention' : 'lifestyle', v);
                }} />
            ))}

            {/* ------------------------------------------------- objective */}
            <h3 className="wsec">Objective</h3>
            <Field label={isReview ? 'What the numbers show' : 'Measured and examined today'}
              value={w.objective} mark={marks.objective} rows={3}
              onChange={(v) => put('objective', v)} />

            {/* ------------------------------------------------ assessment */}
            <h3 className="wsec">Assessment</h3>
            <Field label="Across the whole list" value={w.assessment}
              mark={marks.assessment} rows={3}
              onChange={(v) => put('assessment', v)} />

            <h3 className="wsec">Follow-up</h3>
            <Field label="When, and with what done beforehand"
              value={w.followUp} mark={marks.followUp} rows={2}
              onChange={(v) => { setPlanTouched(true); put('followUp', v); }} />
          </Panel>
        </div>

        {/* ================================================ the right column */}
        <div className="stack">
          {/* ------------------------------------------------- the capture */}
          <Panel title={isReview ? 'Dictate' : 'Listen'} right={
            listening
              ? <Chip tone="accent">{Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}</Chip>
              : <span className="small muted">{isReview ? 'Reading aloud' : 'The room'}</span>
          }>
            <p className="small muted" style={{ marginBottom: 9 }}>
              {isReview
                ? 'Goes down the problem list and writes what you say into the plan for each one. '
                + 'Everything it writes is editable, and editing it is the point.'
                : 'Writes what it hears into the document. It gets things wrong on purpose here, '
                + 'because a capture you have only ever watched succeed is one you will review too lightly.'}
            </p>
            <div className="row" style={{ gap: 7, flexWrap: 'wrap' }}>
              {listening ? (
                <button className="btn listening" onClick={stopCapture}>
                  <span className="pulse" /> Stop
                </button>
              ) : (
                <button className="btn ghost"
                  onClick={isReview ? startDictation : startListening}>
                  {isReview ? 'Start dictating' : 'Start listening'}
                </button>
              )}
              {!isReview && !listening && injected.length === 0 && (
                <button className="btn quiet sm"
                  title="Whether the simulated capture makes mistakes"
                  onClick={() => setFaulty((f) => !f)}>
                  Capture: {faulty ? 'fallible' : 'clean'}
                </button>
              )}
              {!isReview && !listening && injected.length > 0 && (
                <button className="btn ghost" onClick={() => setChecked(true)}>
                  Check the draft
                </button>
              )}
            </div>
          </Panel>

          {/* ------------------------------------------- the reconciliation */}
          <Panel title={`New since version ${approved?.version ?? 0}`} right={
            <Chip tone={fresh.urgent > 0 ? 'crit' : fresh.count > 0 ? 'warn' : undefined}>
              {fresh.count === 0 ? 'Nothing new' : `${read.size} of ${fresh.count} read`}
            </Chip>
          }>
            {fresh.count === 0 ? (
              <p className="snone">
                Nothing has arrived since this plan was last approved. Approving
                will record that it was reviewed and left as it stands.
              </p>
            ) : (
              <>
                <p className="small muted" style={{ marginBottom: 9 }}>
                  Tick one when you have read it into the plan beside this. Nothing
                  is merged for you, and the record behind it is kept either way.
                </p>
                <div className="newlist">
                  {fresh.updates.map((u) => (
                    <NewItem key={u.id} id={u.id} tone="accent" label="Health update"
                      date={u.date} read={read} setRead={setRead}>
                      {u.overall && <p>{u.overall}</p>}
                      {(u.interval ?? []).map((e, i) => (
                        <p key={i} className="small"><b>{INTERVAL_LABEL[e.kind]}.</b> {e.text}</p>
                      ))}
                      {st.checkInsFor(patientId)
                        .filter((c) => c.updateId === u.id && c.text !== u.overall)
                        .map((c) => <p key={c.id} className="small">{c.text}</p>)}
                    </NewItem>
                  ))}
                  {fresh.messages.map((m) => (
                    <NewItem key={m.id} id={m.id} tone={m.urgent ? 'crit' : undefined}
                      label={m.urgent ? 'Urgent message' : 'Message'}
                      date={m.date} read={read} setRead={setRead}>
                      <p>{m.body}</p>
                      {st.triageOf(m.id) && (
                        <p className="small muted">
                          Acknowledged in the inbox {relative(st.triageOf(m.id)!.at)}, still to be
                          read into the plan.
                        </p>
                      )}
                    </NewItem>
                  ))}
                  {fresh.panels.map((x) => (
                    <NewItem key={x.id} id={x.id} label={x.name} date={x.date}
                      read={read} setRead={setRead}>
                      <p className="small">
                        {x.values.map((v) => `${v.key} ${v.value}`).join(', ')}
                      </p>
                    </NewItem>
                  ))}
                  {fresh.vitals.map((x) => (
                    <NewItem key={x.id} id={x.id} label="Home reading" date={x.date}
                      read={read} setRead={setRead}>
                      <p className="small">
                        {x.systolic && x.diastolic ? `${x.systolic}/${x.diastolic}` : ''}
                        {x.weightLb ? ` ${x.weightLb} lb` : ''}
                      </p>
                    </NewItem>
                  ))}
                  {fresh.encounters.map((e) => (
                    <NewItem key={e.id} id={e.id} label="Earlier encounter" date={e.date}
                      read={read} setRead={setRead}>
                      <p className="small">{e.note?.assessment.overall ?? e.reason}</p>
                    </NewItem>
                  ))}
                </div>
              </>
            )}
          </Panel>

          {/* ------------------------------------------ what we need back */}
          <Panel title="Ask the patient" right={
            <span className="small muted">Sent when you approve</span>
          }>
            {answered.length > 0 && (
              <div className="asklist" style={{ marginBottom: 12 }}>
                {answered.map((r) => (
                  <div key={r.id} className="askrow">
                    <div style={{ flex: 1 }}>
                      <div className="asktext">{r.ask}</div>
                      <div className="small muted">
                        answered {relative(r.answeredAt ?? r.created)}
                      </div>
                    </div>
                    <Chip tone="ok">Answered</Chip>
                  </div>
                ))}
              </div>
            )}
            {openAsks.length > 0 && (
              <div className="asklist">
                {openAsks.map((r) => (
                  <AskRow key={r.id} r={r} patientId={patientId}
                    onCancel={() => st.cancelAsk(r.id)} />
                ))}
              </div>
            )}
            <div className="row" style={{ gap: 7, marginTop: 10 }}>
              <input className="search" value={asking}
                placeholder="What do you need from them?"
                onChange={(e) => setAsking(e.target.value)} />
              <button className="btn sm" disabled={!asking.trim()}
                onClick={() => {
                  st.askPatient(patientId, encounterId, { kind: 'overall' }, asking.trim());
                  setAsking('');
                }}>Add</button>
            </div>
            <div className="row" style={{ gap: 6, flexWrap: 'wrap', marginTop: 9 }}>
              {ASK_SUGGESTIONS.map((a) => (
                <button key={a} className="btn ghost sm" onClick={() => setAsking(a)}>
                  {a.split(' ').slice(0, 4).join(' ')}...
                </button>
              ))}
            </div>
          </Panel>

          {/* ------------------------------------------------------ orders */}
          {/*
            * The other half of "ask". A request goes to the patient
            * and an order goes to somebody else, and both are things
            * this encounter is promising to make happen.
            */}
          {!signed && (
            <Orders encounterId={encounterId} patientId={patientId}
              orders={st.ordersFor(encounterId)} />
          )}

          {/* ------------------------------------------------- what and how long */}
          <Panel title="This encounter">
            {!isReview && (
              <div className="row" style={{ gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                {(['in-person', 'telehealth', 'home'] as VisitSetting[]).map((v) => (
                  <button key={v} className={`btn sm ${setting === v ? '' : 'ghost'}`}
                    onClick={() => setSetting(v)}>{SETTING_LABEL[v]}</button>
                ))}
              </div>
            )}
            {!isReview && (
              <label className="wellrow">
                <input type="checkbox" checked={wellness}
                  onChange={(e) => setWellness(e.target.checked)} />
                <span>
                  The wellness visit elements were covered
                  <span className="small muted">
                    {' '}Ticked because they happened, never because the slot was booked for it.
                  </span>
                </span>
              </label>
            )}
            <div className="row" style={{ gap: 8, alignItems: 'center', marginTop: 10 }}>
              <input className="search" style={{ maxWidth: 90 }} type="number" value={minutes}
                onChange={(e) => { setRunning(false); setMinutes(Number(e.target.value)); }} />
              <span className="small muted">minutes</span>
              <button className="btn ghost sm" onClick={() => setRunning((v) => !v)}>
                {running ? 'Pause the clock' : 'Start the clock'}
              </button>
            </div>
            <p className="small muted" style={{ marginTop: 8 }}>
              Running since this opened. Editing it stops the clock, because a number
              somebody typed and a number somebody measured should not look the same.
              {isReview && ' A scheduled hour is not by itself billable time; what qualifies '
                + 'is a separate question with its own requirements.'}
            </p>
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
                : 'Approve as reviewed, no change'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ bits */

/** A text area that says when something other than the physician wrote it. */
function Field({ label, value, onChange, rows = 3, mark, placeholder }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  mark?: 'ambient';
  placeholder?: string;
}) {
  return (
    <div className="wfield">
      <div className="wflabel">
        {label}
        {mark && <span className="markchip">from the capture</span>}
      </div>
      <textarea className="prose" rows={rows} value={value} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function Category({ cat, goal, onGoal, value, onChange }: {
  cat: CategorySummary;
  goal: CareGoalStatus;
  onGoal: (g: CareGoalStatus) => void;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="wprob">
      <div className="sphead">
        <strong>{cat.name}</strong>
        <span className="spacer" />
        {(['at-goal', 'needs-improvement'] as CareGoalStatus[]).map((g) => (
          <button key={g} className={`btn sm ${goal === g ? '' : 'ghost'}`}
            onClick={() => onGoal(g)}>{GOAL_LABEL[g]}</button>
        ))}
      </div>
      <p className="psum">{cat.clauses.map((c) => c.text).join(' ')}</p>
      {cat.interventions.length > 0 && (
        <ul className="actlist">
          {cat.interventions.map((iv, i) => (
            <li key={i} className="actrow">
              <span className="actl">{iv.label}</span>
              <Chip tone={iv.status === 'needs-attention' ? 'warn' : undefined}>
                {ACTION_LABEL[iv.status]}
              </Chip>
              {iv.note && <span className="actn">{iv.note}</span>}
            </li>
          ))}
        </ul>
      )}
      <Field label="Plan" value={value} rows={2} onChange={onChange}
        placeholder="What happens next here." />
    </div>
  );
}

/** One arriving record, with the tick that says it has been read. */
function NewItem({ id, label, tone, date, children, read, setRead }: {
  id: string;
  label: string;
  tone?: 'accent' | 'crit';
  date: string;
  children: React.ReactNode;
  read: Set<string>;
  setRead: (f: (s: Set<string>) => Set<string>) => void;
}) {
  const isRead = read.has(id);
  return (
    <div className={`newitem${isRead ? ' done' : ''}`}>
      <div className="newhead">
        <Chip tone={tone}>{label}</Chip>
        <span className="muted">{fmtDate(date)}</span>
        <span className="spacer" />
        <button className="linkish" onClick={() => setRead((s) => {
          const next = new Set(s);
          if (next.has(id)) next.delete(id); else next.add(id);
          return next;
        })}>{isRead ? 'Read' : 'Mark read'}</button>
      </div>
      {children}
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

function AskRow({ r, patientId, onCancel }: {
  r: InfoRequest; patientId: string; onCancel: () => void;
}) {
  const st = useStore();
  const about = r.about;
  const name = about.kind === 'condition'
    ? st.conditionsFor(patientId).find((c) => c.id === about.id)?.name
    : about.kind === 'prevention'
      ? st.preventionFor(patientId).find((x) => x.id === about.id)?.name
      : about.kind === 'lifestyle'
        ? st.lifestyleFor(patientId).find((x) => x.id === about.id)?.prescription
        : undefined;
  return (
    <div className="askrow">
      <div style={{ flex: 1 }}>
        <div className="asktext">{r.ask}</div>
        <div className="small muted">
          {name ? `${name} · ` : ''}asked {relative(r.created)}
        </div>
      </div>
      <button className="linkish" onClick={onCancel}>Drop</button>
    </div>
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
