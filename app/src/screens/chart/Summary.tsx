/**
 * Summary — what has happened to this person, on one screen.
 *
 * Ordered the way a physician actually reads in: what changed since
 * last time, what we are working on, then the standing lists. The AI
 * interval summary sits at the top because it is the fastest route into
 * the chart, and it is visibly not part of the chart.
 */
import { useState } from 'react';
import { useStore } from '../../lib/store';
import type { ChartTab } from '../../lib/nav';
import { Chip, Panel, Trend, Metric, Prov, Empty } from '../../components/ui';
import { InlineAdd, Field } from '../../components/InlineAdd';
import { AiPanel } from '../../components/AiPanel';
import { fmtDate, relative } from '../../lib/format';

export function Summary({ patientId, onTab }: { patientId: string; onTab: (t: ChartTab) => void }) {
  const st = useStore();
  const [addingCond, setAddingCond] = useState(false);
  const [c, setC] = useState({ name: '', code: '', note: '' });
  const conditions = st.conditionsFor(patientId);
  const active = conditions.filter((c) => c.status === 'active');
  const resolved = conditions.filter((c) => c.status !== 'active');
  const meds = st.medsFor(patientId).filter((m) => m.status === 'active');
  const plan = st.planFor(patientId);
  const entries = st.entriesFor(patientId).slice(0, 3);
  const draft = st.draftsFor(patientId).find((d) => d.kind === 'interval-summary');

  const tracked = st.seriesFor(patientId).slice(0, 4);

  return (
    <div className="split">
      <div className="stack">
        {draft && <AiPanel draft={draft} onAccept={() => st.acceptDraft(draft.id)} />}

        <Panel title="Tracked measures" right={
          tracked.length > 0
            ? <button className="btn quiet" onClick={() => onTab('results')}>All results &rarr;</button>
            : null
        }>
          {tracked.length === 0 && (
            <Empty>
              Nothing tracked yet. Measures appear here once results come in.
            </Empty>
          )}
          <div className="grid g2">
            {tracked.map((s) => {
              const last = s.points[s.points.length - 1];
              const prev = s.points[s.points.length - 2];
              const delta = prev ? last.value - prev.value : 0;
              const goodDirection = s.target
                ? (s.target.direction === 'below' ? delta < 0 : delta > 0)
                : undefined;
              return (
                <div key={s.id}>
                  <div className="eyebrow">{s.name}</div>
                  <div className="row" style={{ marginTop: 6, alignItems: 'flex-end' }}>
                    <Metric value={last.value} unit={s.unit} />
                    {prev && (
                      <span className={`small ${goodDirection === undefined ? 'muted' : ''}`}
                        style={{
                          color: goodDirection === undefined ? undefined
                            : goodDirection ? 'var(--ok)' : 'var(--warn)',
                          fontWeight: 600,
                        }}>
                        {delta > 0 ? '+' : ''}{Math.round(delta * 100) / 100}
                      </span>
                    )}
                  </div>
                  <div style={{ marginTop: 4 }}><Trend series={s} /></div>
                  <div className="small muted" style={{ marginTop: 2 }}>
                    {fmtDate(last.date)}
                    {s.target && ` · target ${s.target.direction} ${s.target.value}`}
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel title="Problems" flush right={
          <span className="small muted">{active.length} active</span>
        }>
          {conditions.length === 0 && <Empty>No problems recorded.</Empty>}
          <table className="rows">
            <tbody>
              {active.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{c.name}</div>
                    {c.note && <div className="small muted" style={{ marginTop: 2 }}>{c.note}</div>}
                    <div style={{ marginTop: 4 }}>
                      <Prov author={c.provenance.author} by={c.provenance.by} />
                    </div>
                  </td>
                  <td style={{ width: 110 }} className="small muted num">{c.code}</td>
                  <td style={{ width: 120 }} className="small muted">since {fmtDate(c.onset)}</td>
                </tr>
              ))}
              {resolved.map((c) => (
                <tr key={c.id} style={{ opacity: 0.55 }}>
                  <td>
                    <div>{c.name}</div>
                    <div className="small muted">Resolved {c.resolved && fmtDate(c.resolved)}</div>
                  </td>
                  <td className="small muted num">{c.code}</td>
                  <td className="small muted">since {fmtDate(c.onset)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--line-2)' }}>
            <InlineAdd
              label="Add a problem" open={addingCond} setOpen={setAddingCond}
              canSave={!!c.name.trim()}
              onSave={() => {
                st.addCondition(patientId, c.name.trim(), c.code.trim(), c.note.trim() || undefined);
                setC({ name: '', code: '', note: '' });
              }}>
              <div className="grid g2">
                <Field label="Problem" value={c.name} onChange={(v) => setC((p) => ({ ...p, name: v }))}
                  placeholder="Prediabetes" />
                <Field label="ICD-10" value={c.code} onChange={(v) => setC((p) => ({ ...p, code: v }))}
                  placeholder="R73.03" />
              </div>
              <Field label="How you are framing it" value={c.note} textarea
                onChange={(v) => setC((p) => ({ ...p, note: v }))}
                placeholder="A1c 6.4 at intake. Target is reversal, not management." />
            </InlineAdd>
          </div>
        </Panel>
      </div>

      <div className="stack">
        {!plan && (
          <Panel title="No care plan yet">
            <p className="small muted" style={{ marginBottom: 12 }}>
              The plan is what this practice is for. Start it at the first visit.
            </p>
            <button className="btn sm" onClick={() => onTab('plan')}>Start the plan</button>
          </Panel>
        )}
        {plan && (
          <Panel title="What we are working on" eyebrow={`Care plan v${plan.version}`} right={
            <button className="btn quiet" onClick={() => onTab('plan')}>Open &rarr;</button>
          }>
            <p className="small" style={{ marginBottom: 12 }}>{plan.summary}</p>
            <div className="stack-sm">
              {plan.goals.map((g) => (
                <div key={g.id} className="row" style={{ alignItems: 'flex-start' }}>
                  <Chip tone={
                    g.status === 'met' ? 'ok' : g.status === 'on-track' ? 'ok'
                      : g.status === 'needs-attention' ? 'warn' : undefined
                  }><span className="dot" /></Chip>
                  <span className="small" style={{ flex: 1 }}>{g.title}</span>
                </div>
              ))}
            </div>
          </Panel>
        )}

        <Panel title="Medicines" right={
          <button className="btn quiet" onClick={() => onTab('meds')}>All &rarr;</button>
        }>
          <div className="stack-sm">
            {meds.map((m) => (
              <div key={m.id}>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{m.name} {m.dose}</div>
                <div className="small muted">{m.sig}</div>
              </div>
            ))}
            {meds.length === 0 && <span className="muted small">None active.</span>}
          </div>
        </Panel>

        <Panel title="From the patient" right={
          <Chip>Patient-reported</Chip>
        }>
          {entries.length === 0 ? <Empty>Nothing recently.</Empty> : (
            <div className="stack">
              {entries.map((e) => (
                <div key={e.id}>
                  <div className="row">
                    <span className="eyebrow">{e.label}</span>
                    <span className="spacer" />
                    <span className="small muted">{relative(e.date)}</span>
                  </div>
                  <p className="small" style={{ marginTop: 4 }}>{e.body}</p>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
