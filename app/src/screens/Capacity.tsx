/**
 * Panel time: is this panel sustainable, and is there room for more?
 *
 * One screen, top to bottom in the order the question gets asked:
 * what you set, what that gives you, what you have used, where the
 * pace is heading, and who sits far from the benchmark either way.
 *
 * The settings live here rather than on a settings page, because the
 * point of changing them is to watch these numbers move.
 *
 * Patients above their allocation are listed so the physician can see
 * the panel mix, not so anyone's care is rationed. The screen says so.
 */
import { useMemo, useState } from 'react';
import { useStore } from '../lib/store';
import { useNav } from '../lib/nav';
import { Panel } from '../components/ui';
import { TimeMeter } from '../components/Time';
import {
  capacity, fmtHours, fmtMin, patientTime, practiceTime, STATUS_LABEL, type PaceStatus, type PatientTime,
} from '../lib/time';
import { fmtDate } from '../lib/format';
import type { Patient } from '../domain/types';

export function Capacity() {
  const st = useStore();
  const nav = useNav();
  const c = st.capacity;

  const pr = useMemo(() => practiceTime(c, st.patients, st.timeEntries, st.now), [c, st.patients, st.timeEntries, st.now]);
  const rows = useMemo(() => {
    const cap = capacity(c, st.patients.length);
    return st.patients.map((p) => ({ p, t: patientTime(p, st.timeFor(p.id), cap.perPatientMin, st.now) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [c, st.patients, st.timeEntries, st.now]);

  const projPct = pr.cap.careHours > 0 ? (pr.projectedYearHours / pr.cap.careHours) * 100 : 0;
  const room = Math.floor(pr.sustainablePanel) - pr.members;

  return (
    <div className="wrap">
      <button className="btn quiet" style={{ marginBottom: 10 }} onClick={nav.back}>&larr; Back</button>
      <div className="page-head">
        <h1>Panel time</h1>
        <div className="sub">
          How your patient care hours are spread across the panel in {st.now.slice(0, 4)}, to {fmtDate(st.now)}.
          A planning benchmark for your own use. It is never a limit on anyone&apos;s care.
        </div>
      </div>

      <Settings />

      {/* ----------------------------------------------------- headline */}
      <div className="kpis" style={{ margin: '16px 0' }}>
        <Kpi label="Care hours available" v={fmtHours(pr.cap.careHours)} u="hours this year"
          note={`${c.hoursPerWeek} h × ${c.weeksPerYear} wk × ${c.carePercent}%`} />
        <Kpi label="Allocated across panel" v={fmtHours(pr.allocatedHours)} u="hours"
          note={`${pr.members} members × ${fmtMin(pr.cap.perPatientMin)} min`} />
        <Kpi label="Used so far" v={fmtHours(pr.usedHours)} u="hours"
          note={`${Math.round(pr.yearFraction * 100)}% of the year gone`} />
        <Kpi label="Remaining capacity" v={fmtHours(pr.remainingHours)} u="hours"
          note={pr.remainingHours < 0 ? 'past this year’s care hours' : 'left this year'} />
        <Kpi label="Average per patient" v={fmtHours(pr.avgPerPatientHours)} u="hours so far"
          note={`${fmtHours(pr.paceHoursPerPatient)} h a year at recent pace`} />
        <Kpi label="Projected for the year" v={fmtHours(pr.projectedYearHours)} u="hours"
          note={`${Math.round(projPct)}% of this year’s care hours`} />
      </div>

      {/* ------------------------------------------------ sustainability */}
      <Panel title="Is this panel sustainable?" style={{ marginBottom: 16 }}>
        <p className="verdict" data-testid="verdict">
          {pr.paceHoursPerPatient === 0 ? 'No time logged in the last twelve weeks, so there is no pace to project from yet.' : (
            <>
              Over the last twelve weeks each patient has used time at a pace of
              about <b>{fmtHours(pr.paceHoursPerPatient)} hours a year</b>, against
              an allocation of <b>{fmtHours(pr.cap.perPatientMin / 60)} hours</b>. Over a
              full year at that pace, {fmtHours(pr.cap.careHours)} care hours cover about{' '}
              <b>{Math.floor(pr.sustainablePanel)} patients</b>.{' '}
              {room > 0
                ? <>That leaves room for about <b>{room} more</b> at today&apos;s mix.</>
                : room === 0
                  ? <>The panel is at that size now.</>
                  : <>The panel is about <b>{-room} over</b> that. Worth looking at mix, scheduling, or the hours before adding more.</>}
            </>
          )}
        </p>
        <div className="row" style={{ marginTop: 14, gap: 14, alignItems: 'center' }}>
          <span className="small muted" style={{ width: 150 }}>Projected year</span>
          <div style={{ flex: 1 }}>
            <TimeMeter visit={pr.visitHours} chart={pr.chartHours}
              ahead={Math.max(0, pr.projectedYearHours - pr.usedHours)} allocation={pr.cap.careHours} />
          </div>
          <span className="small num" style={{ width: 120, textAlign: 'right' }}>
            {fmtHours(pr.projectedYearHours)} of {fmtHours(pr.cap.careHours)} h
          </span>
        </div>
        <p className="small muted" style={{ marginTop: 10 }}>
          Solid is time used so far; the outline is the rest of the year at recent pace.
          Pace comes from the last twelve weeks rather than the whole year, because the panel has grown.
          It is an estimate and moves as the mix changes.
        </p>
      </Panel>

      <WeeklyChart weeks={pr.weeks} planned={pr.plannedWeekHours} />

      <div className="grid g2" style={{ marginTop: 16 }}>
        <Distribution rows={rows} />
        <Outliers rows={rows} onOpen={(id) => nav.go({ name: 'chart', patientId: id })} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- settings

function Settings() {
  const st = useStore();
  const c = st.capacity;
  const cap = capacity(c, st.patients.length);
  const num = (k: 'hoursPerWeek' | 'weeksPerYear' | 'carePercent', max: number) => (
    <input className="minput num" type="number" min={0} max={max} value={c[k]} aria-label={k}
      onChange={(e) => {
        const v = Math.max(0, Math.min(max, Number(e.target.value) || 0));
        st.setCapacity({ [k]: v });
      }} />
  );

  return (
    <Panel title="Your year" right={<span className="small muted">Change any number and the page follows.</span>}>
      <div className="settings">
        <label><span>Hours a week</span>{num('hoursPerWeek', 80)}</label>
        <label><span>Weeks a year</span>{num('weeksPerYear', 52)}</label>
        <label><span>Patient care and chart work</span><span className="row" style={{ gap: 4 }}>{num('carePercent', 100)}%</span></label>
        <label>
          <span>Active patients</span>
          <span className="row" style={{ gap: 8 }}>
            {c.panelSize === 'record' ? (
              <input className="minput num" value={st.patients.length} readOnly aria-label="Active patients" />
            ) : (
              <input className="minput num" type="number" min={1} max={2000} value={c.panelSize} aria-label="Active patients"
                onChange={(e) => st.setCapacity({ panelSize: Math.max(1, Number(e.target.value) || 1) })} />
            )}
            <label className="small row" style={{ gap: 5, fontWeight: 400 }}>
              <input type="checkbox" checked={c.panelSize === 'record'}
                onChange={(e) => st.setCapacity({ panelSize: e.target.checked ? 'record' : Math.max(st.patients.length, 1) })} />
              Use the {st.patients.length} in the record
            </label>
          </span>
        </label>
      </div>
      <p className="derive num">
        {c.hoursPerWeek} h × {c.weeksPerYear} wk = <b>{fmtHours(cap.workingHours)} h</b> working
        <span className="muted"> &rarr; </span>{c.carePercent}% patient care = <b>{fmtHours(cap.careHours)} h</b>
        <span className="muted"> &rarr; </span>÷ {cap.panel} patients = <b>{fmtMin(cap.perPatientMin)} min</b> each a year
      </p>
    </Panel>
  );
}

function Kpi({ label, v, u, note }: { label: string; v: string; u: string; note: string }) {
  return (
    <div className="kpi">
      <div className="eyebrow">{label}</div>
      <div className="metric" style={{ marginTop: 8 }}><span className="v num">{v}</span><span className="u">{u}</span></div>
      <div className="small muted" style={{ marginTop: 5 }}>{note}</div>
    </div>
  );
}

// ------------------------------------------------------------------ weekly

/**
 * Hours a week, visit and chart stacked, against the planned working
 * week. Weeks near zero are the weeks away; that is the plan working.
 */
function WeeklyChart({ weeks, planned }: { weeks: { start: string; visit: number; chart: number }[]; planned: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const [table, setTable] = useState(false);
  const W = 760; const H = 190; const padL = 30; const padB = 22; const padT = 8;
  const max = Math.max(planned * 1.25, ...weeks.map((w) => w.visit + w.chart), 1);
  const step = (W - padL) / weeks.length;
  const bw = Math.max(4, step - 4);
  const y = (h: number) => H - padB - (h / max) * (H - padB - padT);
  const ticks = [0, Math.round(max / 2), Math.round(max)];
  const hw = hover !== null ? weeks[hover] : null;

  return (
    <Panel title="Hours a week, last 26 weeks" right={
      <div className="row" style={{ gap: 12 }}>
        <span className="small"><span className="kdot visit" /> Visit</span>
        <span className="small"><span className="kdot chart" /> Chart</span>
        <span className="small muted"><span className="plannedkey" /> Planned week</span>
        <button className="btn quiet sm" onClick={() => setTable((v) => !v)}>{table ? 'Chart' : 'Table'}</button>
      </div>
    }>
      {table ? (
        <div style={{ maxHeight: 260, overflowY: 'auto' }}>
          <table className="rows">
            <thead><tr><th>Week of</th><th>Visit h</th><th>Chart h</th><th>Total h</th></tr></thead>
            <tbody>
              {weeks.slice().reverse().map((w) => (
                <tr key={w.start}><td className="small">{fmtDate(w.start)}</td>
                  <td className="num">{fmtHours(w.visit)}</td><td className="num">{fmtHours(w.chart)}</td>
                  <td className="num">{fmtHours(w.visit + w.chart)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="wchart" onMouseLeave={() => setHover(null)}>
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img"
            aria-label={`Weekly patient care hours. Planned ${fmtHours(planned)} hours a working week.`}>
            {ticks.map((t) => (
              <g key={t}>
                <line x1={padL} x2={W} y1={y(t)} y2={y(t)} stroke="var(--line-2)" />
                <text x={padL - 6} y={y(t) + 4} textAnchor="end" className="axis">{t}</text>
              </g>
            ))}
            {weeks.map((w, i) => {
              const x = padL + i * step + (step - bw) / 2;
              const vH = (w.visit / max) * (H - padB - padT);
              const cH = (w.chart / max) * (H - padB - padT);
              const base = H - padB;
              return (
                <g key={w.start} onMouseEnter={() => setHover(i)}>
                  <rect x={padL + i * step} y={padT} width={step} height={H - padB - padT} fill="transparent" />
                  {vH > 0 && <rect x={x} y={base - vH} width={bw} height={vH} rx={2} fill="var(--t-visit)" opacity={hover === null || hover === i ? 1 : 0.45} />}
                  {cH > 0 && <rect x={x} y={base - vH - cH - (vH > 0 ? 2 : 0)} width={bw} height={cH} rx={2} fill="var(--t-chart)" opacity={hover === null || hover === i ? 1 : 0.45} />}
                  {(i % 4 === 0) && <text x={x + bw / 2} y={H - 6} textAnchor="middle" className="axis">{fmtDate(w.start, { year: false })}</text>}
                </g>
              );
            })}
            <line x1={padL} x2={W} y1={y(planned)} y2={y(planned)} stroke="var(--ink-3)" strokeDasharray="4 3" strokeWidth={1.25} />
          </svg>
          {hw && hover !== null && (
            <div className="wtip" style={{ left: `${((padL + (hover + 0.5) * step) / W) * 100}%` }}>
              <b>Week of {fmtDate(hw.start)}</b>
              <div><span className="kdot visit" /> Visit {fmtHours(hw.visit)} h</div>
              <div><span className="kdot chart" /> Chart {fmtHours(hw.chart)} h</div>
              <div className="muted">Total {fmtHours(hw.visit + hw.chart)} of {fmtHours(planned)} h planned</div>
            </div>
          )}
        </div>
      )}
    </Panel>
  );
}

// ------------------------------------------------------------ distribution

type Row = { p: Patient; t: PatientTime };

const BUCKETS: { id: PaceStatus; label: string }[] = [
  { id: 'well-below', label: 'Under half' },
  { id: 'below', label: 'Half to 85%' },
  { id: 'near', label: '85% to 115%' },
  { id: 'above', label: '115% to 150%' },
  { id: 'well-above', label: 'Over 150%' },
  { id: 'new', label: 'Too new to say' },
];

function Distribution({ rows }: { rows: Row[] }) {
  const counts = BUCKETS.map((b) => ({ ...b, n: rows.filter((r) => r.t.status === b.id).length }));
  const max = Math.max(...counts.map((c) => c.n), 1);
  return (
    <Panel title="Where the panel sits" right={<span className="small muted">pace for a full year vs allocation</span>}>
      <div className="dist">
        {counts.map((c) => (
          <div key={c.id} className="drow">
            <span className="small">{c.label}</span>
            <div className="dbar"><span style={{ width: `${(c.n / max) * 100}%` }} /></div>
            <span className="num small" style={{ textAlign: 'right' }}>{c.n}</span>
          </div>
        ))}
      </div>
      <p className="small muted" style={{ marginTop: 12 }}>
        A spread is expected. The planning question is the mix: how many people sit far
        above, and whether enough sit below to balance them.
      </p>
    </Panel>
  );
}

function Outliers({ rows, onOpen }: { rows: Row[]; onOpen: (id: string) => void }) {
  const [which, setWhich] = useState<'above' | 'below'>('above');
  const list = rows
    .filter((r) => (which === 'above' ? r.t.status === 'well-above' : r.t.status === 'well-below'))
    .sort((a, b) => which === 'above'
      ? (b.t.projectedMin ?? 0) - (a.t.projectedMin ?? 0)
      : (a.t.projectedMin ?? 0) - (b.t.projectedMin ?? 0));

  return (
    <Panel flush title={which === 'above' ? 'Using much more than allocated' : 'Using much less than allocated'} right={
      <div className="row" style={{ gap: 4 }}>
        <button className={`btn sm ${which === 'above' ? '' : 'ghost'}`} onClick={() => setWhich('above')}>More</button>
        <button className={`btn sm ${which === 'below' ? '' : 'ghost'}`} onClick={() => setWhich('below')}>Less</button>
      </div>
    }>
      {list.length === 0 ? <div className="empty">Nobody here.</div> : (
        <div style={{ maxHeight: 330, overflowY: 'auto' }}>
          <table className="rows">
            <thead><tr><th>Patient</th><th style={{ width: 90 }}>So far</th><th style={{ width: 110 }}>Full-year pace</th></tr></thead>
            <tbody>
              {list.map(({ p, t }) => (
                <tr key={p.id} className="click" onClick={() => onOpen(p.id)}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                    <div style={{ marginTop: 5, maxWidth: 220 }}>
                      <TimeMeter slim visit={t.visitMin} chart={t.chartMin} allocation={t.allocationMin} expected={t.expectedMin} />
                    </div>
                  </td>
                  <td className="num small">{fmtMin(t.usedMin)} min</td>
                  <td className="num small">
                    {t.projectedMin === null ? STATUS_LABEL.new : `${Math.round((t.projectedMin / t.allocationMin) * 100)}%`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="small muted" style={{ padding: '10px 16px 14px', borderTop: '1px solid var(--line-2)' }}>
        {which === 'above'
          ? 'Being on this list changes nothing about anyone’s care. It is here so heavy phases are seen early and planned for.'
          : 'Low use can mean someone is well. It can also mean someone has drifted. Worth a look either way.'}
      </p>
    </Panel>
  );
}
