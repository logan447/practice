/**
 * One living care plan, in SOAP order.
 *
 * Not an encounter note. The visits are kept exactly as they were
 * signed and live in the visits drawer; this is the document that
 * says where the patient is now, and it is the first and mostly the
 * only thing the chart shows.
 *
 * Two kinds of content sit in every section and are distinguished by
 * how they look rather than by a label on each one. Prose is the
 * physician's, typed here and saved as it is left. Everything in a
 * `derived` block is composed from the structured record at read
 * time: the measures, the results, the problem list, the goal
 * progress, the prevention schedule, the medicines. Composing rather
 * than copying is what stops a longitudinal document drifting out of
 * date with the record it describes.
 */
import { useEffect, useRef, useState } from 'react';
import { useStore } from '../../lib/store';
import { Chip, Trend } from '../../components/ui';
import { CodePicker } from '../../components/CodePicker';
import { searchConditions } from '../../domain/terminology';
import { fmtDate, relative } from '../../lib/format';
import { medLine } from '../../lib/clinical';
import type { Condition, MasterPlan, ResultSeries } from '../../domain/types';

/**
 * A text block that saves what it is left with, and nothing sooner.
 *
 * Grows to its content rather than scrolling inside a fixed box,
 * because a longitudinal plan is read far more often than it is
 * edited and a scrollbar inside a paragraph hides half of it.
 */
function Prose({ value, placeholder, onSave, rows = 3 }: {
  value: string; placeholder: string; onSave: (v: string) => void; rows?: number;
}) {
  const [v, setV] = useState(value);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { setV(value); }, [value]);

  // field-sizing: content is not everywhere yet, so measure as well.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [v]);

  return (
    <textarea
      ref={ref} className="prose" rows={rows} value={v} placeholder={placeholder}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => { if (v !== value) onSave(v); }}
    />
  );
}

function Section({ letter, title, children }: {
  letter: string; title: string; children: React.ReactNode;
}) {
  return (
    <section className="soap">
      <div className="soaphead">
        <span className="letter">{letter}</span>
        <h2>{title}</h2>
      </div>
      <div className="soapbody">{children}</div>
    </section>
  );
}

const Label = ({ children }: { children: React.ReactNode }) =>
  <div className="soaplabel">{children}</div>;

export function MasterPlanView({ patientId, onOpen }: {
  patientId: string;
  /** Drawer names, so a section can hand off to the full view. */
  onOpen: (what: 'meds' | 'results' | 'prevention' | 'specialists' | 'notes') => void;
}) {
  const st = useStore();
  const p = st.patient(patientId);
  const mp = st.masterPlanFor(patientId);
  const conditions = st.conditionsFor(patientId);
  const active = conditions.filter((c) => c.status === 'active');
  const managed = active.filter((c) => c.managed);
  const meds = st.medsFor(patientId).filter((m) => m.status !== 'stopped');
  const series = st.seriesFor(patientId);
  const prevention = st.preventionFor(patientId);
  const plan = st.planFor(patientId);
  const specialists = st.specialistsFor(patientId);
  const reports = st.reportsFor(patientId);

  if (!p) return null;

  const save = (patch: Partial<MasterPlan>) => st.saveMasterPlan(patientId, patch);
  const S = mp?.subjective ?? { history: '', goals: '', context: '' };
  const O = mp?.objective ?? { narrative: '' };
  const A = mp?.assessment ?? { narrative: '' };
  const P = mp?.plan ?? { byProblem: {}, prevention: '', lifestyle: '', followUp: '' };

  const clinical = series.filter((x) => x.source !== 'patient');
  const home = series.filter((x) => x.source === 'patient');
  const dueSoon = prevention.filter((x) => x.status === 'due' || x.status === 'overdue');
  const svc = p.services ?? { preventative: true, lifestyle: true };

  return (
    <div className="master">
      {mp && (
        <p className="masterfoot top">
          Updated {relative(mp.updated)} by {mp.updatedBy}
        </p>
      )}

      {/* ------------------------------------------------- subjective */}
      <Section letter="S" title="Subjective">
        <Label>History and what is ongoing</Label>
        <Prose value={S.history} rows={4}
          placeholder="What has happened, and what is still happening."
          onSave={(v) => save({ subjective: { ...S, history: v } })} />

        <Label>What they want</Label>
        <Prose value={S.goals} rows={3}
          placeholder="Their priorities, in their words."
          onSave={(v) => save({ subjective: { ...S, goals: v } })} />

        <Label>Context that carries forward</Label>
        <Prose value={S.context} rows={3}
          placeholder="The thing about their life that every plan has to fit around."
          onSave={(v) => save({ subjective: { ...S, context: v } })} />
      </Section>

      {/* -------------------------------------------------- objective */}
      <Section letter="O" title="Objective">
        {clinical.length > 0 && (
          <div className="derived">
            <div className="dhead">
              <span>Measurements</span>
              <button className="linkish" onClick={() => onOpen('results')}>All results</button>
            </div>
            <div className="measures">
              {clinical.slice(0, 6).map((x) => <Measure key={x.id} series={x} />)}
            </div>
          </div>
        )}

        {home.length > 0 && (
          <div className="derived">
            <div className="dhead"><span>Measured at home</span></div>
            <div className="measures">
              {home.map((x) => <Measure key={x.id} series={x} />)}
            </div>
          </div>
        )}

        {reports.length > 0 && (
          <div className="derived">
            <div className="dhead"><span>Recent reports</span></div>
            {reports.slice(0, 3).map((r) => (
              <div key={r.id} className="dline">
                {r.panel}, {fmtDate(r.resulted)}
                {!r.acknowledged && <Chip tone="crit">Not reviewed</Chip>}
              </div>
            ))}
          </div>
        )}

        <Label>Anything the numbers do not say</Label>
        <Prose value={O.narrative} rows={3}
          placeholder="Examination findings, patterns across the readings, what the trend means."
          onSave={(v) => save({ objective: { narrative: v } })} />
      </Section>

      {/* ------------------------------------------------- assessment */}
      <Section letter="A" title="Assessment">
        <Prose value={A.narrative} rows={5}
          placeholder="Where this patient is, across the problems rather than one at a time."
          onSave={(v) => save({ assessment: { narrative: v } })} />

        {plan && plan.goals.length > 0 && (
          <div className="derived">
            <div className="dhead"><span>Progress against the plan</span></div>
            {plan.goals.map((g) => (
              <div key={g.id} className="dline">
                <GoalDot status={g.status} />
                {g.title}
                <span className="muted small">{STATUS[g.status]}</span>
              </div>
            ))}
          </div>
        )}

        {svc.preventative && dueSoon.length > 0 && (
          <div className="derived">
            <div className="dhead">
              <span>Prevention outstanding</span>
              <button className="linkish" onClick={() => onOpen('prevention')}>All</button>
            </div>
            {dueSoon.map((x) => (
              <div key={x.id} className="dline">
                {x.status === 'overdue' && <Chip tone="crit">Overdue</Chip>}
                {x.status === 'due' && <Chip tone="warn">Due</Chip>}
                {x.name}
                {x.dueBy && <span className="muted small">{fmtDate(x.dueBy)}</span>}
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ------------------------------------------------------- plan */}
      <Section letter="P" title="Plan">
        {managed.length === 0 && active.length === 0 && (
          <p className="small muted">No active problems recorded.</p>
        )}

        {(managed.length > 0 ? managed : active).map((c) => (
          <ProblemPlan key={c.id} condition={c}
            value={P.byProblem[c.id] ?? ''}
            meds={meds.filter((m) => m.indication === c.name)}
            onSave={(v) => st.setProblemPlan(patientId, c.id, v)} />
        ))}

        <AddProblem patientId={patientId} />

        <div className="derived">
          <div className="dhead">
            <span>Medicines</span>
            <button className="linkish" onClick={() => onOpen('meds')}>Manage</button>
          </div>
          {meds.length === 0
            ? <div className="dline muted">None.</div>
            : meds.map((m) => <div key={m.id} className="dline">{medLine(m)}</div>)}
        </div>

        {svc.preventative && (
          <>
            <Label>Preventative care</Label>
            <Prose value={P.prevention} rows={3}
              placeholder="What is due, what has been ordered, and what is in the way."
              onSave={(v) => save({ plan: { ...P, prevention: v } })} />
          </>
        )}

        {svc.lifestyle && (
          <>
            <Label>Lifestyle medicine</Label>
            <Prose value={P.lifestyle} rows={3}
              placeholder="The version of this that survives their actual week."
              onSave={(v) => save({ plan: { ...P, lifestyle: v } })} />
          </>
        )}

        {specialists.length > 0 && (
          <div className="derived">
            <div className="dhead">
              <span>Co-managed with</span>
              <button className="linkish" onClick={() => onOpen('specialists')}>Details</button>
            </div>
            {specialists.map((x) => (
              <div key={x.id} className="dline">
                {x.name}, {x.specialty}
                {x.outstanding && x.outstanding !== 'None.' && <Chip tone="warn">Outstanding</Chip>}
              </div>
            ))}
          </div>
        )}

        <Label>Follow-up</Label>
        <Prose value={P.followUp} rows={2}
          placeholder="When, and what has to happen before then."
          onSave={(v) => save({ plan: { ...P, followUp: v } })} />
      </Section>

      <p className="masterfoot">
        Visits are kept as they were signed.{' '}
        <button className="linkish" onClick={() => onOpen('notes')}>Read the notes</button>
      </p>
    </div>
  );
}

/**
 * A measurement is its latest value. The line is how it got there.
 *
 * A sparkline on its own is decoration: it shows a direction without
 * saying where the patient actually is, which is the one thing a
 * reader needs before anything else on the row means something.
 */
function Measure({ series }: { series: ResultSeries }) {
  const last = series.points[series.points.length - 1];
  if (!last) return null;
  const prev = series.points[series.points.length - 2];
  const delta = prev ? last.value - prev.value : 0;
  return (
    <div className="measure">
      <div className="mname">{series.name}</div>
      <div className="mval">
        <b className={last.flag !== 'normal' ? `f-${last.flag}` : undefined}>{last.value}</b>
        <span className="munit">{series.unit}</span>
        {prev && delta !== 0 && (
          <span className="mdelta">
            {delta > 0 ? '\u2191' : '\u2193'}{Math.abs(Math.round(delta * 10) / 10)}
          </span>
        )}
        <span className="mwhen">{fmtDate(last.date)}</span>
      </div>
      <Trend series={series} w={200} h={38} />
    </div>
  );
}

const STATUS: Record<string, string> = {
  'on-track': 'on track',
  'needs-attention': 'needs attention',
  'not-started': 'not started',
  met: 'met',
};

const GoalDot = ({ status }: { status: string }) =>
  <span className={`gdot ${status}`} aria-hidden="true" />;

/**
 * A new problem, coded.
 *
 * Here rather than in the header, because adding a problem is a
 * planning act: you add it when you start managing it, and this is
 * where managing it is written down.
 */
function AddProblem({ patientId }: { patientId: string }) {
  const st = useStore();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: '', code: '' });

  if (!open) {
    return (
      <button className="linkish addproblem" onClick={() => setOpen(true)}>+ Problem</button>
    );
  }
  return (
    <div className="addproblembox">
      <CodePicker
        label="Add a problem" value={f.name} autoFocus
        placeholder="Type a diagnosis"
        hint="ICD-10-CM"
        onText={(v) => setF({ name: v, code: '' })}
        search={(q) => searchConditions(q).map((c) => ({ id: c.code, primary: c.name, code: c.code }))}
        onPick={(r) => setF({ name: r.primary, code: r.code })}
      />
      <div className="row" style={{ marginTop: 9, gap: 7 }}>
        <button className="btn sm" disabled={!f.name.trim()}
          onClick={() => {
            st.addCondition(patientId, f.name.trim(), f.code);
            setF({ name: '', code: '' });
            setOpen(false);
          }}>
          Add{f.code ? ` ${f.code}` : ' without a code'}
        </button>
        <button className="btn ghost sm" onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </div>
  );
}

function ProblemPlan({ condition, value, meds, onSave }: {
  condition: Condition;
  value: string;
  meds: { id: string; name: string; dose: string }[];
  onSave: (v: string) => void;
}) {
  return (
    <div className="problemplan">
      <div className="pphead">
        <strong>{condition.name}</strong>
        {condition.code && <span className="ppcode">{condition.code}</span>}
        {!condition.managed && <Chip>History only</Chip>}
        {meds.length > 0 && (
          <span className="small muted">
            {meds.map((m) => `${m.name} ${m.dose}`).join(', ')}
          </span>
        )}
      </div>
      <Prose value={value} rows={3}
        placeholder={`How ${condition.name.toLowerCase()} is being managed, and what happens next.`}
        onSave={onSave} />
    </div>
  );
}
