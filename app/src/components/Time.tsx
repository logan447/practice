/**
 * Physician time, in the places the work already happens.
 *
 * Nothing here is a page. The chart gets one strip under the problem
 * list, the visit gets a clock beside the listening button, and the top
 * bar carries whichever clock is running so it can be paused from
 * anywhere. One click starts, one click stops.
 *
 * Internal only. The portal never imports this file.
 */
import { useEffect, useState } from 'react';
import { useStore } from '../lib/store';
import { useNav, type ChartTab } from '../lib/nav';
import {
  CHART_ACTIVITIES, type ChartActivity, type Encounter, type Patient, type RunningTimer, type TimeEntry, type TimeKind,
} from '../domain/types';
import {
  capacity, elapsedMs, fmtClock, fmtMin, patientTime, STATUS_LABEL, type PatientTime,
} from '../lib/time';
import { fmtDate } from '../lib/format';
import { kindLabel } from '../lib/clinical';

/** Re-render once a second while something is running. */
export function useSecond(active: boolean): number {
  const [t, setT] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const i = window.setInterval(() => setT(Date.now()), 1000);
    return () => clearInterval(i);
  }, [active]);
  return t;
}


/** What a chart clock started from this tab is most likely for. */
const TAB_ACTIVITY: Record<ChartTab, ChartActivity> = {
  plan: 'review', meds: 'review', prevention: 'review',
  results: 'results', notes: 'documentation', specialists: 'coordination',
};

/** The patient's year against their allocation. */
export function usePatientTime(patientId: string): PatientTime | null {
  const st = useStore();
  const p = st.patient(patientId);
  if (!p) return null;
  const cap = capacity(st.capacity, st.patients.length);
  return patientTime(p, st.timeFor(patientId), cap.perPatientMin, st.now);
}

// ----------------------------------------------------------------- meter

/**
 * Visit then chart, as two segments with a 2px gap, against the
 * allocation. Past the allocation the bar keeps its length and the
 * overflow is said in words; a bar that runs off the end reads as an
 * alarm, and this is not one.
 */
export function TimeMeter({
  visit, chart, allocation, expected, slim, ahead = 0,
}: {
  visit: number; chart: number; allocation: number; expected?: number; slim?: boolean;
  /** Projected but not yet spent, drawn as an outline. */
  ahead?: number;
}) {
  const scale = Math.max(allocation, visit + chart + ahead, 1);
  const pct = (v: number) => `${(v / scale) * 100}%`;
  return (
    <div className={`tmeter${slim ? ' slim' : ''}`} role="img"
      aria-label={`${fmtMin(visit + chart)} of ${fmtMin(allocation)} minutes used: ${fmtMin(visit)} visit, ${fmtMin(chart)} chart`}>
      <div className="track" style={{ width: pct(allocation) }} />
      <div className="fill">
        {visit > 0 && <span className="seg visit" style={{ width: pct(visit) }} />}
        {chart > 0 && <span className="seg chart" style={{ width: pct(chart) }} />}
        {ahead > 0 && <span className="seg ahead" style={{ width: pct(ahead) }} />}
      </div>
      {expected !== undefined && expected > 0 && expected < scale && (
        <span className="pace" style={{ left: pct(expected) }} title="Where an even pace would be by today" />
      )}
    </div>
  );
}

// ---------------------------------------------------------- top bar clock

/**
 * The running clock, wherever you are. Pausing and stopping should
 * never need a trip back to the chart that started it.
 */
export function RunningClock() {
  const st = useStore();
  const nav = useNav();
  const running = st.timers.find((t) => t.runningSince !== null);
  const shown = running ?? st.timers[st.timers.length - 1];
  useSecond(!!running);
  if (!shown) return null;
  const p = st.patient(shown.patientId);
  const others = st.timers.length - 1;
  const what = shown.kind === 'visit' ? 'Visit' : 'Chart';

  return (
    <div className={`runclock${shown.runningSince ? ' on' : ''}`} aria-live="polite">
      <span className={`kdot ${shown.kind}`} aria-hidden="true" />
      <button className="who" onClick={() => p && nav.go({ name: 'chart', patientId: p.id })}
        title="Open the chart">
        {p?.name ?? 'Patient'}
      </button>
      <span className="small muted">{what}</span>
      <span className="clock num">{fmtClock(elapsedMs(shown))}</span>
      {shown.runningSince
        ? <button className="btn quiet sm" onClick={() => st.pauseTimer(shown.id)}>Pause</button>
        : <button className="btn quiet sm" onClick={() => st.resumeTimer(shown.id)}>Resume</button>}
      <button className="btn quiet sm" onClick={() => st.stopTimer(shown.id)}>Stop</button>
      {others > 0 && <span className="small muted" title="Paused clocks">+{others} paused</span>}
    </div>
  );
}

// ------------------------------------------------------- chart clock button

function ClockControls({ t, kind }: { t: RunningTimer; kind: TimeKind }) {
  const st = useStore();
  useSecond(t.runningSince !== null);
  return (
    <span className={`clockctl ${kind}${t.runningSince ? ' on' : ''}`}>
      <span className={`kdot ${kind}`} aria-hidden="true" />
      <span className="small muted">{kind === 'visit' ? 'Visit' : 'Chart'}</span>
      <span className="num clock">{fmtClock(elapsedMs(t))}</span>
      {t.runningSince
        ? <button className="btn quiet sm" onClick={() => st.pauseTimer(t.id)}>Pause</button>
        : <>
          <span className="small muted">{t.pausedBy ? 'paused for another clock' : 'paused'}</span>
          <button className="btn quiet sm" onClick={() => st.resumeTimer(t.id)}>Resume</button>
        </>}
      <button className="btn quiet sm" onClick={() => st.stopTimer(t.id)}>Stop</button>
    </span>
  );
}

// -------------------------------------------------------- the chart strip

/**
 * One line under the problem list: the year so far, the split, and the
 * chart clock. "Details" opens the history in place, not on a new tab.
 */
export function ChartTimeStrip({ patientId, tab }: { patientId: string; tab: ChartTab }) {
  const st = useStore();
  const pt = usePatientTime(patientId);
  const [open, setOpen] = useState(false);
  if (!pt) return null;

  const chartClock = st.timerFor(patientId, 'chart');
  const visitClock = st.timerFor(patientId, 'visit');
  const over = pt.remainingMin < 0;

  return (
    <>
      <div className="timestrip" data-testid="timestrip">
        <div className="tl">
          <span className="eyebrow">Time this year</span>
          <span className="num tfig">
            <b>{fmtMin(pt.usedMin)}</b> of {fmtMin(pt.allocationMin)} min
            <span className="muted"> &middot; {Math.round(pt.pctUsed)}%</span>
          </span>
        </div>
        <div className="tm"><TimeMeter visit={pt.visitMin} chart={pt.chartMin} allocation={pt.allocationMin} expected={pt.expectedMin} /></div>
        <div className="tsplit small">
          <span><span className="kdot visit" /> Visit {fmtMin(pt.visitMin)}</span>
          <span><span className="kdot chart" /> Chart {fmtMin(pt.chartMin)}</span>
          <span className="muted">
            {over ? `${fmtMin(-pt.remainingMin)} past allocation` : `${fmtMin(pt.remainingMin)} left`}
          </span>
        </div>
        <span className="spacer" />
        <div className="row" style={{ gap: 6 }}>
          {visitClock ? (
            <span className="small muted" title="This time counts once, as visit time">Visit clock running</span>
          ) : chartClock ? (
            <ClockControls t={chartClock} kind="chart" />
          ) : (
            <button className="btn ghost sm" data-testid="start-chart-clock"
              onClick={() => st.startTimer({ patientId, kind: 'chart', activity: TAB_ACTIVITY[tab], source: 'timer' })}>
              <ClockIcon /> Start chart time
            </button>
          )}
          <button className="btn quiet sm" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
            {open ? 'Hide' : 'Details'}
          </button>
        </div>
      </div>
      {open && <TimeDetails patientId={patientId} pt={pt} />}
    </>
  );
}

function ClockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 4.5V8l2.5 1.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// ------------------------------------------------------- history and edit

const SOURCE_LABEL: Record<TimeEntry['source'], string> = {
  ambient: 'Ambient', timer: 'Clock', manual: 'By hand',
};

function TimeDetails({ patientId, pt }: { patientId: string; pt: PatientTime }) {
  const st = useStore();
  const p = st.patient(patientId) as Patient;
  const chartClock = st.timerFor(patientId, 'chart');
  const [adding, setAdding] = useState(false);
  const acts = CHART_ACTIVITIES.filter((a) => pt.byActivity[a.id] > 0);

  return (
    <section className="panel timedetail" data-testid="time-details">
      <header>
        <h2>Time this year</h2>
        <span className="small muted">
          A planning benchmark for your own use. Not shown to {p.preferredName ?? p.name.split(' ')[0]},
          and not a limit on care.
        </span>
      </header>
      <div className="body">
        <div className="grid g3" style={{ gap: 14 }}>
          <Fig label="Allocated" v={fmtMin(pt.allocationMin)} u="min a year" />
          <Fig label="Used" v={fmtMin(pt.usedMin)} u={`min, ${Math.round(pt.pctUsed)}%`} />
          <Fig label={pt.remainingMin < 0 ? 'Past allocation' : 'Remaining'}
            v={fmtMin(Math.abs(pt.remainingMin))} u="min" />
        </div>
        <div className="sep" />
        <div className="grid g2" style={{ gap: 18 }}>
          <div className="small stack-sm">
            <div><span className="kdot visit" /> <b>Visits</b> {fmtMin(pt.visitMin)} min</div>
            <div><span className="kdot chart" /> <b>Chart work</b> {fmtMin(pt.chartMin)} min</div>
            {acts.map((a) => (
              <div key={a.id} className="muted" style={{ paddingLeft: 17 }}>
                {a.label} {fmtMin(pt.byActivity[a.id])}
              </div>
            ))}
          </div>
          <div className="small muted stack-sm">
            <div>
              <b style={{ color: 'var(--ink-2)' }}>Pace: </b>
              {pt.projectedMin === null
                ? 'Member under two months this year. Too early to project.'
                : `About ${fmtMin(pt.projectedMin)} min over a full year (${STATUS_LABEL[pt.status].toLowerCase()}).`}
            </div>
            <div>The tick on the bar is where an even pace would be by today, counting only the months they have been a member.</div>
            {chartClock && (
              <div className="row" style={{ gap: 6 }}>
                <span>Running clock is for</span>
                <select className="sel" value={chartClock.activity ?? 'other'}
                  onChange={(e) => st.setTimerActivity(chartClock.id, e.target.value as ChartActivity)}>
                  {CHART_ACTIVITIES.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="row" style={{ padding: '10px 16px', borderTop: '1px solid var(--line-2)' }}>
        <span className="eyebrow">History</span>
        <span className="spacer" />
        <button className="btn ghost sm" onClick={() => setAdding((v) => !v)}>
          {adding ? 'Cancel' : 'Add time'}
        </button>
      </div>
      {adding && <AddEntry patientId={patientId} onDone={() => setAdding(false)} />}

      {pt.entries.length === 0 ? (
        <div className="empty">No time logged this year.</div>
      ) : (
        <table className="rows tlog">
          <thead>
            <tr>
              <th style={{ width: 110 }}>Date</th>
              <th>What</th>
              <th style={{ width: 120 }}>Minutes</th>
              <th style={{ width: 100 }}>From</th>
              <th style={{ width: 70 }} />
            </tr>
          </thead>
          <tbody>
            {pt.entries.map((e) => <EntryRow key={e.id} e={e} />)}
          </tbody>
        </table>
      )}
    </section>
  );
}

function Fig({ label, v, u }: { label: string; v: string; u: string }) {
  return (
    <div>
      <div className="eyebrow" style={{ marginBottom: 6 }}>{label}</div>
      <div className="metric"><span className="v num">{v}</span><span className="u">{u}</span></div>
    </div>
  );
}

function EntryRow({ e }: { e: TimeEntry }) {
  const st = useStore();
  const [mins, setMins] = useState(() => String(Math.round(e.seconds / 60)));
  const [confirm, setConfirm] = useState(false);
  useEffect(() => { setMins(String(Math.round(e.seconds / 60))); }, [e.seconds]);

  const commit = () => {
    const n = Number(mins);
    if (!Number.isFinite(n) || n < 0) { setMins(String(Math.round(e.seconds / 60))); return; }
    if (Math.round(n) !== Math.round(e.seconds / 60)) st.updateTimeEntry(e.id, { seconds: Math.round(n * 60) });
  };

  return (
    <tr>
      <td className="small">{fmtDate(e.date)}</td>
      <td>
        <span className={`kdot ${e.kind}`} />{' '}
        {e.kind === 'visit' ? (
          <span>{e.label ?? 'Visit'}</span>
        ) : (
          <select className="sel bare" aria-label="Activity" value={e.activity ?? 'other'}
            onChange={(ev) => st.updateTimeEntry(e.id, { activity: ev.target.value as ChartActivity })}>
            {CHART_ACTIVITIES.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
          </select>
        )}
        {e.note && <span className="small muted"> &middot; {e.note}</span>}
      </td>
      <td>
        <input className="minput num" inputMode="numeric" aria-label="Minutes" value={mins}
          onChange={(ev) => setMins(ev.target.value.replace(/[^\d.]/g, ''))}
          onBlur={commit} onKeyDown={(ev) => { if (ev.key === 'Enter') (ev.target as HTMLInputElement).blur(); }} />
        {e.corrected && (
          <div className="small muted" title={`Corrected ${fmtDate(e.corrected.on)}`}>
            was {fmtMin(e.corrected.originalSeconds / 60)}
          </div>
        )}
        {e.seconds < 60 && !e.corrected && (
          <div className="small muted">{e.seconds} s</div>
        )}
      </td>
      <td className="small muted">{SOURCE_LABEL[e.source]}</td>
      <td>
        {confirm ? (
          <button className="btn quiet sm" style={{ color: 'var(--crit)' }}
            onClick={() => st.deleteTimeEntry(e.id)}>Remove?</button>
        ) : (
          <button className="btn quiet sm" onClick={() => setConfirm(true)}>Remove</button>
        )}
      </td>
    </tr>
  );
}

function AddEntry({ patientId, onDone }: { patientId: string; onDone: () => void }) {
  const st = useStore();
  const [kind, setKind] = useState<TimeKind>('chart');
  const [activity, setActivity] = useState<ChartActivity>('messages');
  const [mins, setMins] = useState('10');
  const [date, setDate] = useState(st.now);
  const [note, setNote] = useState('');
  const n = Number(mins);
  const valid = Number.isFinite(n) && n > 0 && n <= 600 && date <= st.now;

  return (
    <div className="addtime row wrap">
      <select className="sel" aria-label="Kind" value={kind} onChange={(e) => setKind(e.target.value as TimeKind)}>
        <option value="chart">Chart work</option>
        <option value="visit">Visit</option>
      </select>
      {kind === 'chart' && (
        <select className="sel" aria-label="Activity" value={activity}
          onChange={(e) => setActivity(e.target.value as ChartActivity)}>
          {CHART_ACTIVITIES.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
        </select>
      )}
      <input className="minput num" aria-label="Minutes to add" value={mins}
        onChange={(e) => setMins(e.target.value.replace(/[^\d.]/g, ''))} />
      <span className="small muted">min on</span>
      <input type="date" className="sel" aria-label="Date" value={date} max={st.now}
        onChange={(e) => setDate(e.target.value)} />
      <input className="search" style={{ flex: 1, minWidth: 160 }} placeholder="Note (optional)"
        value={note} onChange={(e) => setNote(e.target.value)} />
      <button className="btn sm" disabled={!valid} onClick={() => {
        st.addTimeEntry({
          patientId, date, kind, seconds: Math.round(n * 60),
          activity: kind === 'chart' ? activity : undefined,
          label: kind === 'visit' ? 'Visit' : undefined,
          note: note.trim() || undefined,
        });
        onDone();
      }}>Add</button>
    </div>
  );
}

// ------------------------------------------------------------ the visit

/**
 * The visit clock. Starts with ambient listening, or by hand for a call
 * without it. Stops at signature, or by hand. After signing, the logged
 * minutes can be corrected right here.
 */
export function VisitClock({ enc, patient }: { enc: Encounter; patient: Patient }) {
  const st = useStore();
  const t = st.timerFor(patient.id, 'visit', enc.id);
  const logged = st.timeFor(patient.id).filter((e) => e.kind === 'visit' && e.encounterId === enc.id);

  if (t) return <ClockControls t={t} kind="visit" />;

  if (logged.length > 0) {
    const e = logged[logged.length - 1];
    return <LoggedVisit e={e} total={logged.reduce((a, x) => a + x.seconds, 0)} canRestart={enc.status !== 'signed'}
      onRestart={() => st.startTimer({ patientId: patient.id, kind: 'visit', encounterId: enc.id, label: kindLabel(enc.kind), source: 'timer' })} />;
  }

  if (enc.status === 'signed') return null;
  return (
    <button className="btn ghost" data-testid="start-visit-clock"
      onClick={() => st.startTimer({ patientId: patient.id, kind: 'visit', encounterId: enc.id, label: kindLabel(enc.kind), source: 'timer' })}>
      <ClockIcon /> Start visit clock
    </button>
  );
}

function LoggedVisit({ e, total, canRestart, onRestart }: { e: TimeEntry; total: number; canRestart: boolean; onRestart: () => void }) {
  const st = useStore();
  const [editing, setEditing] = useState(false);
  const [mins, setMins] = useState(String(Math.round(total / 60)));
  if (editing) {
    return (
      <span className="clockctl visit">
        <input className="minput num" aria-label="Visit minutes" autoFocus value={mins}
          onChange={(ev) => setMins(ev.target.value.replace(/[^\d.]/g, ''))} />
        <span className="small muted">min</span>
        <button className="btn sm" onClick={() => {
          const n = Number(mins);
          // Corrections land on the latest stretch so the total comes out right.
          if (Number.isFinite(n) && n >= 0) st.updateTimeEntry(e.id, { seconds: Math.max(0, Math.round(n * 60) - (total - e.seconds)) });
          setEditing(false);
        }}>Save</button>
      </span>
    );
  }
  return (
    <span className="clockctl visit" data-testid="visit-logged">
      <span className="kdot visit" aria-hidden="true" />
      <span className="small">Visit time <b className="num">{total < 60 ? `${total} s` : `${Math.round(total / 60)} min`}</b></span>
      <button className="btn quiet sm" onClick={() => setEditing(true)}>Adjust</button>
      {canRestart && <button className="btn quiet sm" onClick={onRestart}>Continue</button>}
    </span>
  );
}
