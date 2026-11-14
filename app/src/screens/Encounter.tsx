/**
 * The visit.
 *
 * Note on the left, workspace on the right. The workspace holds what a
 * physician reaches for mid-consultation — what the patient came to
 * say, their medicines, their numbers, and somewhere to put orders —
 * so that none of it costs a page change.
 *
 * Sections of the note are pulled from the chart on open. Pulled text
 * is marked "from chart", ambient text is marked "from the room", and
 * anything typed is unmarked and therefore the physician's own. The
 * marks clear the moment a section is edited, because once you have
 * rewritten it, it is yours.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../lib/store';
import { useNav } from '../lib/nav';
import { Avatar, Chip, Panel, Trend, Empty } from '../components/ui';
import { fmtDate, relative } from '../lib/format';
import {
  oneLiner, kindLabel, chartReview, diagnosticsSummary, specialistSummary,
  homeMeasuresSummary, EXAM_TEMPLATES, relevantSeries, medLine, previsitReason,
} from '../lib/clinical';
import { ORDER_KINDS, type ExamTemplate, type OrderKind, type VisitNote } from '../domain/types';
import { newId } from '../lib/persist';
import { VisitClock } from '../components/Time';
import { startVisit as metricStart, signVisit as metricSign, endVisit, countAiSection, countAiEdit } from '../lib/metrics';

/** Which sections were filled by something other than the physician. */
type Mark = 'chart' | 'ambient';
type Marks = Record<string, Mark>;

const BLANK_NOTE: VisitNote = {
  subjective: { oneLiner: '', reason: '', chartReview: '', diagnostics: '', specialists: '', additional: '' },
  objective: { homeMeasures: '', vitals: '', exam: '' },
  assessment: { oneLiner: '', overall: '' },
  plan: { problems: [], overall: '' },
};

export function Encounter({ encounterId }: { encounterId: string }) {
  const st = useStore();
  const nav = useNav();

  const enc = st.encounter(encounterId);
  const p = enc ? st.patient(enc.patientId) : undefined;

  const conditions = st.conditionsFor(p?.id ?? '');
  const preVisit = st.preVisitFor(encounterId);
  const specialists = st.specialistsFor(p?.id ?? '');
  const allSeries = st.seriesFor(p?.id ?? '');
  const plan = st.planFor(p?.id ?? '');
  const meds = st.medsFor(p?.id ?? '').filter((m) => m.status !== 'stopped');
  const encounters = st.encountersFor(p?.id ?? '');
  const orders = st.ordersFor(encounterId);
  const unack = st.reportsFor(p?.id ?? '').filter((r) => !r.acknowledged);

  /** The chart, assembled. Computed once per visit, not on every keystroke. */
  const pulled = useMemo<VisitNote>(() => {
    if (!p || !enc) return BLANK_NOTE;
    return {
      subjective: {
        oneLiner: oneLiner(p, conditions, kindLabel(enc.kind)),
        reason: previsitReason(preVisit) || enc.reason,
        chartReview: chartReview(encounters, plan, encounterId),
        diagnostics: diagnosticsSummary(allSeries),
        specialists: specialistSummary(specialists),
        additional: '',
      },
      objective: {
        homeMeasures: homeMeasuresSummary(allSeries),
        vitals: '',
        exam: '',
      },
      assessment: { oneLiner: oneLiner(p, conditions), overall: '' },
      plan: {
        problems: conditions.filter((c) => c.status === 'active').map((c) => ({
          id: newId('pp'), problem: c.name, assessment: '', treatment: '', orders: '', followUp: '',
        })),
        overall: '',
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [encounterId, p?.id]);

  const [note, setNote] = useState<VisitNote>(() => enc?.note ?? pulled);
  const [marks, setMarks] = useState<Marks>((): Marks =>
    enc?.note ? {} : {
      'subjective.oneLiner': 'chart', 'subjective.reason': 'chart',
      'subjective.chartReview': 'chart', 'subjective.diagnostics': 'chart',
      'subjective.specialists': 'chart', 'objective.homeMeasures': 'chart',
      'assessment.oneLiner': 'chart',
    });

  const [listening, setListening] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  // The clock on this visit starts when it opens and stops at signature.
  useEffect(() => {
    if (!p || !enc || enc.status === 'signed') return;
    metricStart(enc.id, p.id, p.name);
    return () => endVisit();
  }, [enc?.id, p?.id, enc?.status]);

  // Ambient capture, simulated. Sections arrive the way they would in a
  // real consultation: history first, then findings, then the reasoning.
  const timers = useRef<number[]>([]);
  const signRef = useRef<(() => void) | null>(null);
  const saveRef = useRef<(() => void) | null>(null);
  const listenRef = useRef<(() => void) | null>(null);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  useEffect(() => {
    if (!listening) return;
    const t = window.setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [listening]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      const k = e.key.toLowerCase();
      if (k === 'enter') { e.preventDefault(); signRef.current?.(); }
      if (k === 's') { e.preventDefault(); saveRef.current?.(); }
      if (k === 'l' && e.shiftKey) { e.preventDefault(); listenRef.current?.(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const startListening = () => {
    if (!p || !enc) return;
    // Ambient listening means the visit has begun, so the visit clock starts too.
    // It keeps running after listening stops and ends at signature.
    if (!st.timerFor(p.id, 'visit', enc.id)) {
      st.startTimer({ patientId: p.id, kind: 'visit', encounterId: enc.id, label: kindLabel(enc.kind), source: 'ambient' });
    }
    setListening(true);
    setElapsed(0);
    const first = p.preferredName ?? p.name.split(' ')[0];
    const steps: [number, () => void][] = [
      [3000, () => {
        patch('subjective', 'additional',
          `${first} reports the walks have held up, five days most weeks. Knee aches after the longer ones and settles by morning, no swelling, no locking or giving way. CPAP every night. Has been reading about statins and wants to understand the reasoning rather than stop it.`,
          'ambient');
      }],
      [6500, () => {
        patch('objective', 'vitals', 'BP 124/76 seated after five minutes, repeated 122/78. Weight 198 lb. BMI 28.6.', 'ambient');
      }],
      [9500, () => {
        patch('assessment', 'overall',
          'Prediabetes remains in the normal range off metformin. Blood pressure consistently under 130 at home and in clinic, with weight stable three months, so a supervised lisinopril taper is reasonable now. Knee discomfort sounds mechanical and load-related rather than inflammatory. Statin is secondary prevention and the case for continuing it is strong.',
          'ambient');
      }],
      [12500, () => {
        setNote((n) => ({
          ...n,
          plan: {
            ...n.plan,
            problems: n.plan.problems.map((pr) =>
              pr.problem.toLowerCase().includes('hypertension')
                ? { ...pr, assessment: 'Controlled.', treatment: 'Halve lisinopril to 5 mg for four weeks.', orders: 'Home BP twice weekly.', followUp: 'Six weeks.' }
                : pr),
          },
        }));
        setMarks((m) => ({ ...m, 'plan.problems': 'ambient' }));
        countAiSection(1);
        setListening(false);
      }],
    ];
    timers.current = steps.map(([ms, fn]) => window.setTimeout(fn, ms));
  };

  const stopListening = () => {
    timers.current.forEach(clearTimeout);
    setListening(false);
  };

  if (!enc || !p) return <div className="wrap"><p>Visit not found.</p></div>;

  const signed = enc.status === 'signed';

  const doSign = () => {
    st.saveNote(enc.id, note);
    st.signEncounter(enc.id);
    metricSign(enc.id);
  };

  function patch<S extends keyof VisitNote>(
    section: S, key: string, value: string, mark?: Mark,
  ) {
    setNote((n) => ({ ...n, [section]: { ...(n[section] as object), [key]: value } }));
    setMarks((m) => {
      const next = { ...m };
      const id = `${String(section)}.${key}`;
      if (mark) {
        next[id] = mark;
        if (mark === 'ambient') countAiSection(1);
      } else {
        // a mark clearing means the physician rewrote drafted text
        if (m[id] === 'ambient') countAiEdit();
        delete next[id];
      }
      return next;
    });
  }

  const edit = (section: keyof VisitNote, key: string) => (v: string) => patch(section, key, v);

  const applyExam = (t: ExamTemplate) => {
    setNote((n) => ({ ...n, objective: { ...n.objective, examTemplate: t, exam: EXAM_TEMPLATES[t].body } }));
    setMarks((m) => ({ ...m, 'objective.exam': 'chart' }));
  };

  signRef.current = signed ? null : doSign;
  saveRef.current = signed ? null : () => st.saveNote(enc.id, note);
  listenRef.current = signed ? null : (listening ? stopListening : startListening);

  const measures = relevantSeries(allSeries, conditions, 4);

  return (
    <div className="wrap wide">
      <button className="btn quiet" style={{ marginBottom: 10 }} onClick={nav.back}>&larr; Back</button>

      {/* ---------------------------------------------------------- head */}
      <div className="phead" style={{ marginBottom: 16 }}>
        <Avatar patient={p} lg />
        <div style={{ minWidth: 0, flex: 1 }}>
          <h1>{p.name}</h1>
          <div className="meta">
            {kindLabel(enc.kind)} &middot; {enc.duration} min &middot; {fmtDate(enc.date)}
          </div>
          <p className="oneliner" style={{ marginTop: 8 }}>{note.subjective.oneLiner || oneLiner(p, conditions)}</p>
        </div>
        <div className="acts">
          <VisitClock enc={enc} patient={p} />
          {signed ? <Chip tone="ok">Signed {enc.signedAt && fmtDate(enc.signedAt)}</Chip> : (
            <>
              {listening ? (
                <button className="btn listening" onClick={stopListening}>
                  <span className="pulse" /> Listening {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')} &middot; Stop
                </button>
              ) : (
                <button className="btn ghost" onClick={startListening}>Start listening</button>
              )}
              <button className="btn ghost" onClick={() => st.saveNote(enc.id, note)}>Save</button>
              <button className="btn" onClick={doSign}>Sign note</button>
            </>
          )}
          <button className="btn ghost" onClick={() => nav.go({ name: 'chart', patientId: p.id })}>Chart</button>
        </div>
      </div>

      <div className="visit">
        {/* ------------------------------------------------------- note */}
        <div className="stack">
          <Panel title="Subjective">
            <div className="stack">
              <NoteField label="One-liner" value={note.subjective.oneLiner}
                onChange={edit('subjective', 'oneLiner')} mark={marks['subjective.oneLiner']} readOnly={signed} rows={2} />
              <NoteField label="Reason for visit" hint="Their words" value={note.subjective.reason}
                onChange={edit('subjective', 'reason')} mark={marks['subjective.reason']} readOnly={signed} rows={3} />
              <NoteField label="Recent chart review" value={note.subjective.chartReview}
                onChange={edit('subjective', 'chartReview')} mark={marks['subjective.chartReview']} readOnly={signed} rows={3} />
              <NoteField label="Recent results" value={note.subjective.diagnostics}
                onChange={edit('subjective', 'diagnostics')} mark={marks['subjective.diagnostics']} readOnly={signed} rows={4} />
              <NoteField label="Recent specialist care" value={note.subjective.specialists}
                onChange={edit('subjective', 'specialists')} mark={marks['subjective.specialists']} readOnly={signed} rows={3} />
              <NoteField label="History today" value={note.subjective.additional}
                onChange={edit('subjective', 'additional')} mark={marks['subjective.additional']} readOnly={signed} rows={5} />
            </div>
          </Panel>

          <Panel title="Objective">
            <div className="stack">
              <NoteField label="Home measurements" hint="Patient-measured"
                value={note.objective.homeMeasures} onChange={edit('objective', 'homeMeasures')}
                mark={marks['objective.homeMeasures']} readOnly={signed} rows={3} />
              <NoteField label="Vital signs" value={note.objective.vitals}
                onChange={edit('objective', 'vitals')} mark={marks['objective.vitals']} readOnly={signed} rows={2} />
              <div>
                <div className="row" style={{ marginBottom: 5 }}>
                  <span className="eyebrow">Examination</span>
                  {marks['objective.exam'] && <MarkChip mark={marks['objective.exam']} />}
                  <span className="spacer" />
                  {!signed && (
                    <div className="row" style={{ gap: 6 }}>
                      {(Object.keys(EXAM_TEMPLATES) as ExamTemplate[]).map((t) => (
                        <button key={t}
                          className={`btn sm ${note.objective.examTemplate === t ? '' : 'ghost'}`}
                          onClick={() => applyExam(t)}>
                          {EXAM_TEMPLATES[t].label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <textarea className="note" rows={9} readOnly={signed} value={note.objective.exam}
                  placeholder="Pick a template, then change what differs."
                  onChange={(e) => patch('objective', 'exam', e.target.value)} />
              </div>
            </div>
          </Panel>

          <Panel title="Assessment">
            <div className="stack">
              <NoteField label="One-liner" value={note.assessment.oneLiner}
                onChange={edit('assessment', 'oneLiner')} mark={marks['assessment.oneLiner']} readOnly={signed} rows={2} />
              <NoteField label="Overall" value={note.assessment.overall}
                onChange={edit('assessment', 'overall')} mark={marks['assessment.overall']} readOnly={signed} rows={6} />
            </div>
          </Panel>

          <Panel title="Plan" right={
            marks['plan.problems'] ? <MarkChip mark={marks['plan.problems']} /> : null
          }>
            <div className="stack">
              {note.plan.problems.length === 0 && (
                <Empty>No active problems. Add one from the chart.</Empty>
              )}
              {note.plan.problems.map((pr, i) => (
                <div key={pr.id} className="problem-block">
                  <div className="row" style={{ marginBottom: 8 }}>
                    <input className="search problem-title" value={pr.problem} readOnly={signed}
                      onChange={(e) => {
                        const v = e.target.value;
                        setNote((n) => ({
                          ...n,
                          plan: { ...n.plan, problems: n.plan.problems.map((x, j) => j === i ? { ...x, problem: v } : x) },
                        }));
                      }} />
                    {!signed && (
                      <button className="btn quiet sm" onClick={() => setNote((n) => ({
                        ...n, plan: { ...n.plan, problems: n.plan.problems.filter((_, j) => j !== i) },
                      }))}>Remove</button>
                    )}
                  </div>
                  <div className="grid g2" style={{ gap: 10 }}>
                    {([
                      ['assessment', 'Assessment'], ['treatment', 'Treatment'],
                      ['orders', 'Orders'], ['followUp', 'Follow-up'],
                    ] as const).map(([k, label]) => (
                      <label key={k} style={{ display: 'block' }}>
                        <div className="eyebrow" style={{ marginBottom: 4 }}>{label}</div>
                        <textarea className="note" rows={2} readOnly={signed} value={pr[k]}
                          onChange={(e) => {
                            const v = e.target.value;
                            setNote((n) => ({
                              ...n,
                              plan: { ...n.plan, problems: n.plan.problems.map((x, j) => j === i ? { ...x, [k]: v } : x) },
                            }));
                          }} />
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              {!signed && (
                <button className="btn ghost sm" onClick={() => setNote((n) => ({
                  ...n,
                  plan: {
                    ...n.plan,
                    problems: [...n.plan.problems, { id: newId('pp'), problem: '', assessment: '', treatment: '', orders: '', followUp: '' }],
                  },
                }))}>+ Add a problem</button>
              )}
              <NoteField label="Overall and follow-up" value={note.plan.overall}
                onChange={edit('plan', 'overall')} mark={marks['plan.overall']} readOnly={signed} rows={4} />
            </div>
          </Panel>
        </div>

        {/* -------------------------------------------------- workspace */}
        <div className="stack">
          {unack.length > 0 && (
            <section className="panel" style={{ borderColor: 'var(--crit)' }}>
              <header style={{ background: 'var(--crit-soft)', borderRadius: '9px 9px 0 0' }}>
                <h2>Results to review</h2>
              </header>
              <div className="body stack-sm">
                {unack.map((r) => (
                  <div key={r.id} className="row">
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13.5 }}>{r.panel}</div>
                      <div className="small muted">{relative(r.resulted)}</div>
                    </div>
                    <button className="btn sm" onClick={() => st.acknowledgeReport(r.id)}>Review</button>
                  </div>
                ))}
              </div>
            </section>
          )}

          <Priorities encounterId={encounterId} />

          <Panel title="Medicines" right={
            <button className="btn quiet sm"
              onClick={() => nav.go({ name: 'chart', patientId: p.id, tab: 'meds' })}>Manage</button>
          }>
            <div className="stack-sm">
              {meds.length === 0 && <span className="small muted">None recorded.</span>}
              {meds.map((m) => (
                <div key={m.id} className="row" style={{ alignItems: 'flex-start' }}>
                  <span className="small" style={{ flex: 1 }}>{medLine(m)}</span>
                  {m.status === 'held' && <Chip tone="warn">Held</Chip>}
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Measures">
            <div className="stack">
              {measures.length === 0 && <span className="small muted">Nothing tracked yet.</span>}
              {measures.map((sr) => {
                const last = sr.points[sr.points.length - 1];
                return (
                  <div key={sr.id}>
                    <div className="row">
                      <span className="small" style={{ fontWeight: 600 }}>{sr.name}</span>
                      {sr.source === 'patient' && <Chip tone="info">Home</Chip>}
                      <span className="spacer" />
                      <span className="small num">{last.value} {sr.unit}</span>
                    </div>
                    <Trend series={sr} w={300} h={32} />
                  </div>
                );
              })}
            </div>
          </Panel>

          <Orders encounterId={encounterId} patientId={p.id} orders={orders} signed={signed} />
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------- note field

function MarkChip({ mark }: { mark: Mark }) {
  return mark === 'ambient'
    ? <Chip tone="accent">From the room</Chip>
    : <Chip>From chart</Chip>;
}

function NoteField({
  label, hint, value, onChange, mark, readOnly, rows = 3,
}: {
  label: string; hint?: string; value: string; onChange: (v: string) => void;
  mark?: Mark; readOnly?: boolean; rows?: number;
}) {
  return (
    <div>
      <div className="row" style={{ marginBottom: 5 }}>
        <span className="eyebrow">{label}</span>
        {mark && <MarkChip mark={mark} />}
        <span className="spacer" />
        {hint && <span className="small muted">{hint}</span>}
      </div>
      <textarea className="note" rows={rows} value={value} readOnly={readOnly}
        onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

// -------------------------------------------------------------- the panel

function Priorities({ encounterId }: { encounterId: string }) {
  const st = useStore();
  const pv = st.preVisitFor(encounterId);
  const [openNarrative, setOpenNarrative] = useState(false);

  if (!pv) {
    return (
      <Panel title="Today's priorities">
        <Empty>Nothing submitted before this visit.</Empty>
      </Panel>
    );
  }

  const left = pv.concerns.filter((c) => !c.addressed).length;

  return (
    <Panel title="Today's priorities" right={
      <span className="small muted">{left} of {pv.concerns.length} left</span>
    }>
      <div className="stack-sm">
        {pv.concerns.map((c) => (
          <label key={c.id} className="row" style={{ cursor: 'pointer', alignItems: 'flex-start' }}>
            <input type="checkbox" checked={c.addressed} style={{ marginTop: 3 }}
              onChange={() => st.toggleConcern(pv.id, c.id)} />
            <span style={{
              flex: 1,
              textDecoration: c.addressed ? 'line-through' : undefined,
              opacity: c.addressed ? 0.5 : 1,
            }}>{c.text}</span>
          </label>
        ))}
      </div>

      {pv.narrative && (
        <>
          <button className="btn quiet sm" style={{ marginTop: 10 }}
            onClick={() => setOpenNarrative((v) => !v)}>
            {openNarrative ? 'Hide' : 'In their words'}
          </button>
          {openNarrative && (
            <p className="small" style={{
              marginTop: 8, padding: 11, background: 'var(--panel-2)',
              borderRadius: 'var(--r)', fontStyle: 'italic',
            }}>
              {pv.narrative}
            </p>
          )}
        </>
      )}
      <div className="small muted" style={{ marginTop: 10 }}>
        Submitted {fmtDate(pv.submitted)}
      </div>
    </Panel>
  );
}

function Orders({
  encounterId, patientId, orders, signed,
}: {
  encounterId: string; patientId: string;
  orders: ReturnType<ReturnType<typeof useStore>['ordersFor']>; signed: boolean;
}) {
  const st = useStore();
  const plan = st.planFor(patientId);
  const [kind, setKind] = useState<OrderKind>('lab');
  const [text, setText] = useState('');
  const [goalId, setGoalId] = useState('');

  return (
    <Panel title="Orders" right={<span className="small muted">{orders.length}</span>}>
      <div className="stack-sm">
        {orders.length === 0 && <span className="small muted">None yet.</span>}
        {orders.map((o) => (
          <div key={o.id} className="row" style={{ alignItems: 'flex-start' }}>
            <Chip tone="accent">{ORDER_KINDS.find((k) => k.id === o.kind)?.label}</Chip>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="small">{o.text}</div>
              {o.goalId && (
                <div className="small muted">
                  {plan?.goals.find((g) => g.id === o.goalId)?.title}
                </div>
              )}
            </div>
            {!signed && (
              <button className="btn quiet sm" onClick={() => st.removeOrder(o.id)}>&times;</button>
            )}
          </div>
        ))}
      </div>

      {!signed && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--line-2)' }}>
          <div className="row wrap" style={{ gap: 5, marginBottom: 8 }}>
            {ORDER_KINDS.map((k) => (
              <button key={k.id} className={`btn sm ${kind === k.id ? '' : 'ghost'}`}
                onClick={() => setKind(k.id)}>{k.label}</button>
            ))}
          </div>
          <input className="search" value={text} placeholder="A1c and lipid panel in 6 weeks"
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && text.trim()) {
                st.addOrder(patientId, encounterId, kind, text.trim(), goalId || undefined);
                setText('');
              }
            }} />
          {plan && plan.goals.length > 0 && (
            <select className="search" style={{ marginTop: 7 }} value={goalId}
              onChange={(e) => setGoalId(e.target.value)}>
              <option value="">Not linked to a plan problem</option>
              {plan.goals.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}
            </select>
          )}
          <button className="btn sm" style={{ marginTop: 8 }} disabled={!text.trim()}
            onClick={() => {
              st.addOrder(patientId, encounterId, kind, text.trim(), goalId || undefined);
              setText('');
            }}>Add order</button>
        </div>
      )}
    </Panel>
  );
}
