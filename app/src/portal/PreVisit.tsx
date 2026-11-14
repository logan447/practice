/**
 * Before the visit.
 *
 * Two questions and a set of readings. The concerns become today's
 * priorities in the workspace and stay visible through the encounter;
 * the narrative is kept verbatim and quoted into the note rather than
 * paraphrased, because the way someone describes their own problem is
 * clinical information.
 */
import { useState } from 'react';
import { useStore } from '../lib/store';
import { Chip, Panel, Empty } from '../components/ui';
import { MEASURES, measureByKey } from '../domain/measures';
import { fmtDate, todayIso, relative } from '../lib/format';
import { kindLabel } from '../lib/clinical';

export function PreVisitForm({ patientId }: { patientId: string }) {
  const st = useStore();
  const upcoming = st.encountersFor(patientId).filter((e) => e.status !== 'signed');
  const enc = upcoming[0];

  if (!enc) {
    return <Panel title="Before your visit"><Empty>No visit booked.</Empty></Panel>;
  }

  const existing = st.preVisitFor(enc.id);
  return <Form key={enc.id} patientId={patientId} encounterId={enc.id}
    encLabel={`${kindLabel(enc.kind)}, ${relative(enc.date)}`} existing={!!existing} />;
}

function Form({
  patientId, encounterId, encLabel, existing,
}: { patientId: string; encounterId: string; encLabel: string; existing: boolean }) {
  const st = useStore();
  const pv = st.preVisitFor(encounterId);

  const [concerns, setConcerns] = useState(pv ? pv.concerns.map((c) => c.text).join('\n') : '');
  const [narrative, setNarrative] = useState(pv?.narrative ?? '');
  const [measureKey, setMeasureKey] = useState('bp');
  const [vals, setVals] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);

  const measure = measureByKey(measureKey)!;
  const lines = concerns.split('\n').map((l) => l.trim()).filter(Boolean);
  const canSend = lines.length > 0 || narrative.trim().length > 0;

  const readingReady = measure.fields.every((f) => {
    const raw = vals[f.key];
    if (!raw) return false;
    const n = Number(raw);
    return !Number.isNaN(n) && n >= f.min && n <= f.max;
  });

  const home = st.patientSeriesFor(patientId);

  return (
    <div className="split">
      <div className="stack">
        <Panel title="What do you want to cover?" eyebrow={encLabel} right={
          existing ? <Chip tone="ok">Already sent</Chip> : null
        }>
          <label style={{ display: 'block' }}>
            <div className="eyebrow" style={{ marginBottom: 5 }}>The main things, one per line</div>
            <textarea className="note" rows={4} value={concerns}
              placeholder={'Coming off the blood pressure tablet\nKnee soreness after walking'}
              onChange={(e) => { setConcerns(e.target.value); setSent(false); }} />
            <div className="small muted" style={{ marginTop: 4 }}>
              These stay in front of Dr. DuBose for the whole visit.
            </div>
          </label>

          <label style={{ display: 'block', marginTop: 16 }}>
            <div className="eyebrow" style={{ marginBottom: 5 }}>Anything you want to say in full</div>
            <textarea className="note" rows={7} value={narrative}
              placeholder="Write it however you like. He reads this before you come in."
              onChange={(e) => { setNarrative(e.target.value); setSent(false); }} />
          </label>

          <div className="row" style={{ marginTop: 14 }}>
            <button className="btn" disabled={!canSend}
              onClick={() => { st.submitPreVisit(patientId, encounterId, lines, narrative.trim()); setSent(true); }}>
              {existing ? 'Update' : 'Send'}
            </button>
            {sent && <span className="small" style={{ color: 'var(--ok)' }}>Sent.</span>}
          </div>
        </Panel>

        <Panel title="Readings to send in">
          <div className="row wrap" style={{ gap: 6, marginBottom: 14 }}>
            {MEASURES.map((m) => (
              <button key={m.key} className={`btn ${measureKey === m.key ? '' : 'ghost'} sm`}
                onClick={() => { setMeasureKey(m.key); setVals({}); }}>{m.label}</button>
            ))}
          </div>
          <p className="small muted" style={{ marginBottom: 12 }}>{measure.hint}</p>
          <div className="row wrap" style={{ gap: 12, alignItems: 'flex-end' }}>
            {measure.fields.map((f) => (
              <label key={f.key}>
                <div className="eyebrow" style={{ marginBottom: 5 }}>{f.label}</div>
                <div className="row" style={{ gap: 7 }}>
                  <input className="search" type="number" inputMode="decimal"
                    min={f.min} max={f.max} step={f.step ?? 1} style={{ width: 110 }}
                    value={vals[f.key] ?? ''}
                    onChange={(e) => setVals((p) => ({ ...p, [f.key]: e.target.value }))} />
                  <span className="small muted">{f.unit}</span>
                </div>
              </label>
            ))}
            <button className="btn sm" disabled={!readingReady} onClick={() => {
              const numbers = Object.fromEntries(
                measure.fields.map((f) => [f.key, Number(vals[f.key])]),
              ) as Record<string, number>;
              st.addMeasurement(patientId, measureKey, numbers, todayIso(), 'Sent before the visit');
              setVals({});
            }}>Add</button>
          </div>
          <p className="small muted" style={{ marginTop: 14 }}>
            Anything you add goes straight into the visit note, marked as a
            reading you took at home.
          </p>
        </Panel>
      </div>

      <div className="stack">
        <Panel title="What he will see">
          {!pv ? <Empty>Nothing sent yet.</Empty> : (
            <div className="stack">
              <div>
                <div className="eyebrow" style={{ marginBottom: 6 }}>Your priorities</div>
                <div className="stack-sm">
                  {pv.concerns.map((c) => (
                    <div key={c.id} className="row">
                      <span style={{ flex: 1 }}>{c.text}</span>
                      {c.addressed && <Chip tone="ok">Covered</Chip>}
                    </div>
                  ))}
                </div>
              </div>
              {pv.narrative && (
                <div>
                  <div className="eyebrow" style={{ marginBottom: 4 }}>In your words</div>
                  <p className="small" style={{ fontStyle: 'italic' }}>{pv.narrative}</p>
                </div>
              )}
              <div className="small muted">Sent {fmtDate(pv.submitted)}</div>
            </div>
          )}
        </Panel>

        {home.length > 0 && (
          <Panel title="Readings on file" right={<Chip tone="info">Home</Chip>}>
            <div className="stack-sm">
              {home.map((sr) => {
                const last = sr.points[sr.points.length - 1];
                return (
                  <div key={sr.id} className="row">
                    <span className="small" style={{ flex: 1 }}>{sr.name}</span>
                    <span className="small num">{last.value} {sr.unit}</span>
                  </div>
                );
              })}
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
}
