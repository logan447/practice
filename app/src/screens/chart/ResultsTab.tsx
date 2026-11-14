/**
 * Results.
 *
 * Two jobs, in this order. First: nothing unacknowledged gets past you.
 * An inbound report cannot be cleared except by an explicit act, and the
 * act is recorded with a name and a date. Second: the trend, because a
 * single value means very little and four values mean a lot.
 */
import { useStore } from '../../lib/store';
import { Chip, FlagChip, Panel, Trend, Empty } from '../../components/ui';
import { fmtDate, relative } from '../../lib/format';

export function ResultsTab({ patientId }: { patientId: string }) {
  const st = useStore();
  const reports = st.reportsFor(patientId).slice().sort((a, b) => b.resulted.localeCompare(a.resulted));
  const series = st.clinicalSeriesFor(patientId);
  const selfTracked = st.patientSeriesFor(patientId);
  const pending = reports.filter((r) => !r.acknowledged);

  return (
    <div className="stack">
      {pending.map((r) => (
        <section key={r.id} className="panel" style={{ borderColor: 'var(--crit)' }}>
          <header style={{ background: 'var(--crit-soft)', borderRadius: '9px 9px 0 0' }}>
            <div>
              <div className="eyebrow" style={{ color: 'var(--crit)', marginBottom: 3 }}>
                Not yet reviewed
              </div>
              <h2>{r.panel}</h2>
            </div>
            <div className="right row">
              <span className="small muted">Resulted {relative(r.resulted)}</span>
              <button className="btn sm" onClick={() => st.acknowledgeReport(r.id)}>
                Mark reviewed
              </button>
            </div>
          </header>
          <div className="body">
            <table className="rows">
              <tbody>
                {r.seriesIds.map((sid) => {
                  const s = st.series(sid);
                  if (!s) return null;
                  const pt = s.points.find((p) => p.date === r.resulted) ?? s.points[s.points.length - 1];
                  const prev = s.points[s.points.indexOf(pt) - 1];
                  return (
                    <tr key={sid}>
                      <td style={{ fontWeight: 600 }}>{s.name}</td>
                      <td style={{ width: 130 }} className="num">
                        {pt.value} <span className="small muted">{s.unit}</span>
                      </td>
                      <td style={{ width: 120 }}><FlagChip flag={pt.flag} /></td>
                      <td style={{ width: 130 }} className="small muted num">
                        {prev ? `was ${prev.value}` : 'first'}
                      </td>
                      <td style={{ width: 150 }} className="small muted">
                        {s.refLow !== undefined && s.refHigh !== undefined
                          ? `${s.refLow}–${s.refHigh}`
                          : s.refHigh !== undefined ? `< ${s.refHigh}`
                            : s.refLow !== undefined ? `> ${s.refLow}` : ''}
                      </td>
                      <td style={{ width: 200 }}><Trend series={s} w={180} h={36} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      <Panel title="Tracked over time" flush>
        {series.length === 0 ? <Empty>No results on file.</Empty> : (
          <table className="rows">
            <thead>
              <tr>
                <th>Measure</th>
                <th style={{ width: 130 }}>Latest</th>
                <th style={{ width: 110 }}>Flag</th>
                <th style={{ width: 150 }}>Reference</th>
                <th style={{ width: 140 }}>Target</th>
                <th style={{ width: 220 }}>Trend</th>
              </tr>
            </thead>
            <tbody>
              {series.map((s) => {
                const last = s.points[s.points.length - 1];
                return (
                  <tr key={s.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{s.name}</div>
                      <div className="small muted num">LOINC {s.code} &middot; {fmtDate(last.date)}</div>
                    </td>
                    <td className="num">{last.value} <span className="small muted">{s.unit}</span></td>
                    <td><FlagChip flag={last.flag} /></td>
                    <td className="small muted num">
                      {s.refLow !== undefined && s.refHigh !== undefined
                        ? `${s.refLow}–${s.refHigh}`
                        : s.refHigh !== undefined ? `< ${s.refHigh}`
                          : s.refLow !== undefined ? `> ${s.refLow}` : '—'}
                    </td>
                    <td className="small">
                      {s.target
                        ? <Chip tone="accent">{s.target.direction} {s.target.value}</Chip>
                        : <span className="muted">—</span>}
                    </td>
                    <td><Trend series={s} w={200} h={38} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Panel>

      {selfTracked.length > 0 && (
        <Panel title="What the patient is tracking" flush right={
          <Chip tone="info">Patient-measured, not clinic-measured</Chip>
        }>
          <table className="rows">
            <thead>
              <tr>
                <th>Measure</th>
                <th style={{ width: 130 }}>Latest</th>
                <th style={{ width: 110 }}>Readings</th>
                <th style={{ width: 150 }}>Since</th>
                <th style={{ width: 220 }}>Trend</th>
              </tr>
            </thead>
            <tbody>
              {selfTracked.map((sr) => {
                const last = sr.points[sr.points.length - 1];
                const first = sr.points[0];
                return (
                  <tr key={sr.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{sr.name}</div>
                      <div className="small muted num">LOINC {sr.code}</div>
                    </td>
                    <td className="num">{last.value} <span className="small muted">{sr.unit}</span></td>
                    <td className="small muted num">{sr.points.length}</td>
                    <td className="small muted">{fmtDate(first.date)}</td>
                    <td><Trend series={sr} w={200} h={38} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="small muted" style={{ padding: '12px 16px', borderTop: '1px solid var(--line-2)' }}>
            Recorded by the patient at home. Kept apart from clinic measurements
            on purpose: different conditions, and home readings are judged against
            different targets.
          </p>
        </Panel>
      )}

      {reports.filter((r) => r.acknowledged).length > 0 && (
        <Panel title="Reviewed" flush>
          <table className="rows">
            <tbody>
              {reports.filter((r) => r.acknowledged).map((r) => (
                <tr key={r.id}>
                  <td>{r.panel}</td>
                  <td style={{ width: 160 }} className="small muted">{fmtDate(r.resulted)}</td>
                  <td style={{ width: 260 }} className="small muted">
                    Reviewed by {r.acknowledgedBy} on {r.acknowledgedAt && fmtDate(r.acknowledgedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}
    </div>
  );
}
