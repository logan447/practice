/**
 * The patient writing into their own record.
 *
 * Two different acts, kept apart because they mean different things:
 *
 *   Log a measurement — a number, which joins a trend. No inbox item,
 *   because a blood pressure reading is data, not a summons. The
 *   exception is a reading far outside the ordinary, which raises an
 *   urgent task and tells the patient to make contact.
 *
 *   Write something — prose, which the physician reads. It reaches the
 *   inbox only if the patient ticks the box asking for it to be seen.
 *   That keeps agency with them and keeps the inbox usable.
 */
import { useState } from 'react';
import { useStore } from '../lib/store';
import { Chip, Panel, Trend, Empty } from '../components/ui';
import { MEASURES, measureByKey } from '../domain/measures';
import { fmtDate, relative, todayIso } from '../lib/format';

export function Track({ patientId }: { patientId: string }) {
  const [tab, setTab] = useState<'measure' | 'write'>('measure');

  return (
    <div className="split">
      <div className="stack">
        <div className="tabs" style={{ margin: 0 }}>
          <button className={tab === 'measure' ? 'on' : ''} onClick={() => setTab('measure')}>
            Log a measurement
          </button>
          <button className={tab === 'write' ? 'on' : ''} onClick={() => setTab('write')}>
            Write something
          </button>
        </div>

        {tab === 'measure' ? <LogMeasure patientId={patientId} /> : <WriteEntry patientId={patientId} />}
      </div>

      <div className="stack">
        <History patientId={patientId} />
      </div>
    </div>
  );
}

// ------------------------------------------------------------- measurement

function LogMeasure({ patientId }: { patientId: string }) {
  const st = useStore();
  const [key, setKey] = useState(MEASURES[0].key);
  const [vals, setVals] = useState<Record<string, string>>({});
  const [date, setDate] = useState(todayIso());
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState<null | { alerting: boolean }>(null);

  const measure = measureByKey(key)!;

  const filled = measure.fields.every((f) => {
    const raw = vals[f.key];
    if (raw === undefined || raw === '') return false;
    const n = Number(raw);
    return !Number.isNaN(n) && n >= f.min && n <= f.max;
  });

  const outOfBounds = measure.fields.some((f) => {
    const raw = vals[f.key];
    if (!raw) return false;
    const n = Number(raw);
    return !Number.isNaN(n) && (n < f.min || n > f.max);
  });

  const save = () => {
    const numbers = Object.fromEntries(
      measure.fields.map((f) => [f.key, Number(vals[f.key])]),
    ) as Record<string, number>;
    const r = st.addMeasurement(patientId, key, numbers, date, note);
    setSaved(r);
    setVals({});
    setNote('');
  };

  return (
    <Panel title="What are you recording?">
      <div className="row wrap" style={{ gap: 7, marginBottom: 16 }}>
        {MEASURES.map((m) => (
          <button key={m.key}
            className={`btn ${key === m.key ? '' : 'ghost'} sm`}
            onClick={() => { setKey(m.key); setVals({}); setSaved(null); }}>
            {m.label}
          </button>
        ))}
      </div>

      <p className="small muted" style={{ marginBottom: 14 }}>{measure.hint}</p>

      <div className="grid g2" style={{ gap: 12 }}>
        {measure.fields.map((f) => (
          <label key={f.key} style={{ display: 'block' }}>
            <div className="eyebrow" style={{ marginBottom: 5 }}>{f.label}</div>
            <div className="row" style={{ gap: 8 }}>
              <input className="search" type="number" inputMode="decimal"
                min={f.min} max={f.max} step={f.step ?? 1}
                value={vals[f.key] ?? ''}
                onChange={(e) => { setVals((p) => ({ ...p, [f.key]: e.target.value })); setSaved(null); }}
                style={{ maxWidth: 130 }} />
              <span className="small muted">{f.unit}</span>
            </div>
          </label>
        ))}
        <label style={{ display: 'block' }}>
          <div className="eyebrow" style={{ marginBottom: 5 }}>When</div>
          <input className="search" type="date" value={date} max={todayIso()}
            onChange={(e) => setDate(e.target.value)} style={{ maxWidth: 190 }} />
        </label>
      </div>

      <label style={{ display: 'block', marginTop: 14 }}>
        <div className="eyebrow" style={{ marginBottom: 5 }}>Anything worth saying about it</div>
        <textarea className="note" style={{ minHeight: 60 }} value={note}
          placeholder="Optional. Before breakfast, after a bad night, that sort of thing."
          onChange={(e) => setNote(e.target.value)} />
      </label>

      {outOfBounds && (
        <p className="small" style={{ marginTop: 10, color: 'var(--crit)' }}>
          That number looks outside what this reading can be. Please check it.
        </p>
      )}

      <div className="row" style={{ marginTop: 14 }}>
        <button className="btn" disabled={!filled} onClick={save}>Save</button>
        {saved && !saved.alerting && (
          <span className="small" style={{ color: 'var(--ok)' }}>
            Saved. Dr. DuBose will see it with your other readings.
          </span>
        )}
      </div>

      {saved?.alerting && (
        <div style={{
          marginTop: 14, padding: 13, borderRadius: 'var(--r)',
          background: 'var(--crit-soft)', border: '1px solid var(--crit)',
        }}>
          <div style={{ fontWeight: 700, color: 'var(--crit)', marginBottom: 6 }}>
            That reading is outside the usual range.
          </div>
          <p className="small">
            It has been saved and flagged for Dr. DuBose today. Please message
            him about it. If you feel unwell with it, or you have chest pain,
            trouble breathing, weakness on one side or trouble speaking, call
            911 or go to the nearest ER. Do not wait for a reply.
          </p>
        </div>
      )}
    </Panel>
  );
}

// ----------------------------------------------------------------- writing

function WriteEntry({ patientId }: { patientId: string }) {
  const st = useStore();
  const [label, setLabel] = useState('');
  const [body, setBody] = useState('');
  const [flagged, setFlagged] = useState(false);
  const [done, setDone] = useState(false);

  const save = () => {
    st.addJournal(patientId, label, body, flagged);
    setLabel(''); setBody(''); setFlagged(false); setDone(true);
  };

  return (
    <Panel title="Write something">
      <p className="small muted" style={{ marginBottom: 14 }}>
        How a week has gone, how a medicine is suiting you, something you
        want to remember to raise. It goes in your record in your words.
      </p>

      <label style={{ display: 'block' }}>
        <div className="eyebrow" style={{ marginBottom: 5 }}>What is it about</div>
        <input className="search" value={label} placeholder="Sleep, walking, a new symptom"
          onChange={(e) => { setLabel(e.target.value); setDone(false); }} />
      </label>

      <label style={{ display: 'block', marginTop: 14 }}>
        <div className="eyebrow" style={{ marginBottom: 5 }}>In your own words</div>
        <textarea className="note" style={{ minHeight: 120 }} value={body}
          placeholder="Kept the walk up all week except Thursday, it poured. Did 40 minutes Saturday with my daughter."
          onChange={(e) => { setBody(e.target.value); setDone(false); }} />
      </label>

      <label className="row" style={{ marginTop: 14, cursor: 'pointer', alignItems: 'flex-start' }}>
        <input type="checkbox" checked={flagged} style={{ marginTop: 3 }}
          onChange={(e) => setFlagged(e.target.checked)} />
        <span>
          Ask Dr. DuBose to look at this
          <div className="small muted" style={{ marginTop: 2 }}>
            Without this, it still goes in your record and he sees it at your
            next visit. With it, it goes on his list for this week.
          </div>
        </span>
      </label>

      <div className="row" style={{ marginTop: 16 }}>
        <button className="btn" disabled={!body.trim()} onClick={save}>Save</button>
        {done && <span className="small" style={{ color: 'var(--ok)' }}>Saved.</span>}
      </div>

      <p className="small muted" style={{ marginTop: 16 }}>
        This is not the way to reach anyone urgently. For something that
        cannot wait, use urgent care. For an emergency, call 911.
      </p>
    </Panel>
  );
}

// ----------------------------------------------------------------- history

function History({ patientId }: { patientId: string }) {
  const st = useStore();
  const entries = st.entriesFor(patientId);
  const series = st.patientSeriesFor(patientId);

  return (
    <>
      {series.length > 0 && (
        <Panel title="What you have been tracking">
          <div className="stack">
            {series.map((sr) => {
              const last = sr.points[sr.points.length - 1];
              return (
                <div key={sr.id}>
                  <div className="row">
                    <span className="small" style={{ fontWeight: 600 }}>{sr.name}</span>
                    <span className="spacer" />
                    <span className="small num">{last.value} {sr.unit}</span>
                  </div>
                  <Trend series={sr} w={300} h={38} />
                  <div className="small muted">
                    {sr.points.length} reading{sr.points.length > 1 ? 's' : ''} &middot; latest {relative(last.date)}
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      )}

      <Panel title="Everything you have recorded" flush>
        {entries.length === 0 ? <Empty>Nothing yet.</Empty> : (
          <table className="rows">
            <tbody>
              {entries.map((e) => (
                <tr key={e.id}>
                  <td>
                    <div className="row">
                      <span style={{ fontWeight: 600, fontSize: 13.5 }}>{e.label}</span>
                      {e.kind === 'measurement' && <Chip tone="accent">Reading</Chip>}
                      {e.flagged && <Chip tone="warn">Sent to Dr. DuBose</Chip>}
                      <span className="spacer" />
                      <span className="small muted">{fmtDate(e.date)}</span>
                    </div>
                    <p className="small" style={{ marginTop: 4 }}>{e.body}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </>
  );
}
