/**
 * How long this is actually taking.
 *
 * The decision behind the build is whether a self-made record beats a
 * bought one, and that is settled in minutes per patient. This screen
 * exists so there is a real number after a month of use instead of an
 * impression.
 *
 * The published comparison most people quote is around sixteen minutes
 * of EHR time per visit in US ambulatory care. It is a rough yardstick
 * from a different setting, not a target, and it is here so the number
 * on the left has something to sit beside.
 */
import { useEffect, useState } from 'react';
import { useNav } from '../lib/nav';
import { Panel, Empty } from '../components/ui';
import { allVisits, subscribe, summarise, clearMetrics, type VisitMetric } from '../lib/metrics';

const mins = (v: VisitMetric) =>
  v.signedAt ? Math.round(((v.signedAt - v.openedAt) / 60000) * 10) / 10 : null;

const when = (ms: number) =>
  new Date(ms).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export function Metrics() {
  const nav = useNav();
  const [visits, setVisits] = useState<VisitMetric[]>(allVisits);

  useEffect(() => subscribe(() => setVisits(allVisits())), []);

  const s = summarise(visits);
  const done = visits.filter((v) => v.signedAt).sort((a, b) => b.openedAt - a.openedAt);

  return (
    <div className="wrap">
      <button className="btn quiet" style={{ marginBottom: 10 }} onClick={nav.back}>&larr; Back</button>

      <div className="page-head row" style={{ alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <h1>Usage and timing</h1>
          <div className="sub">Measured from your own use. Real time, not clinic time.</div>
        </div>
        {visits.length > 0 && (
          <button className="btn ghost" onClick={clearMetrics}>Clear</button>
        )}
      </div>

      {s.n === 0 ? (
        <Panel title="Nothing measured yet">
          <Empty>
            Open a visit, write a note and sign it. The timer starts when the
            visit opens and stops when you sign.
          </Empty>
        </Panel>
      ) : (
        <>
          <div className="grid g3" style={{ marginBottom: 16 }}>
            <Panel title="Median note time">
              <div className="metric">
                <span className="v num">{s.medianMinutes}</span>
                <span className="u">minutes, n={s.n}</span>
              </div>
              <p className="small muted" style={{ marginTop: 8 }}>
                Opening the visit to signing it. Around 16 min per visit is the
                figure usually quoted for US ambulatory EHR time: a rough
                yardstick from another setting, not a target.
              </p>
            </Panel>

            <Panel title="Median clicks">
              <div className="metric">
                <span className="v num">{s.medianClicks}</span>
                <span className="u">per visit</span>
              </div>
              <p className="small muted" style={{ marginTop: 8 }}>
                Every click inside the visit. Falling clicks with steady time
                usually means keyboard use, which is the point.
              </p>
            </Panel>

            <Panel title="Chart review before">
              <div className="metric">
                <span className="v num">{s.medianChartSeconds}</span>
                <span className="u">seconds</span>
              </div>
              <p className="small muted" style={{ marginTop: 8 }}>
                Time on the chart immediately before opening the visit. This is
                what the assembled note is meant to shrink.
              </p>
            </Panel>
          </div>

          {s.aiKeptPct !== null && (
            <Panel title="AI text kept unedited" right={
              <span className="small muted">across visits where it was used</span>
            }>
              <div className="row" style={{ alignItems: 'baseline', gap: 10 }}>
                <span className="num" style={{ font: '600 30px/1 var(--serif)' }}>{s.aiKeptPct}%</span>
                <span className="small muted">of drafted sections went to signature unchanged</span>
              </div>
              <p className="small muted" style={{ marginTop: 10, maxWidth: '62ch' }}>
                Watch this one carefully in both directions. Very low means the
                drafting is not earning its place. Very high may mean it is
                good, or may mean the review has gone thin, and those two look
                identical from here.
              </p>
            </Panel>
          )}

          <Panel title="Every visit" flush style={{ marginTop: 16 }}>
            <table className="rows">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th style={{ width: 150 }}>Opened</th>
                  <th style={{ width: 110 }}>Minutes</th>
                  <th style={{ width: 100 }}>Clicks</th>
                  <th style={{ width: 110 }}>Keystrokes</th>
                  <th style={{ width: 130 }}>Chart before</th>
                  <th style={{ width: 130 }}>AI edited</th>
                </tr>
              </thead>
              <tbody>
                {done.map((v) => (
                  <tr key={v.encounterId + v.openedAt}>
                    <td style={{ fontWeight: 600 }}>{v.patientName}</td>
                    <td className="small muted">{when(v.openedAt)}</td>
                    <td className="num">{mins(v)}</td>
                    <td className="num">{v.clicks}</td>
                    <td className="num">{v.keystrokes}</td>
                    <td className="num">{v.chartSecondsBefore}s</td>
                    <td className="small">
                      {v.aiSections === 0
                        ? <span className="muted">not used</span>
                        : `${v.aiEdited} of ${v.aiSections}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </>
      )}
    </div>
  );
}
