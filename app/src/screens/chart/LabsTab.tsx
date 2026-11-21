/**
 * Labs, vitals and anything else measured over time.
 *
 * Four groups of the same row. Reports first, because an unreviewed
 * result is the one thing on this screen that can hurt somebody, and
 * it says so in words on its own line rather than in a red box.
 *
 * Patient-measured series are a group of their own and are labelled
 * as such. A home blood pressure and a clinic blood pressure are not
 * the same measurement and must never be averaged together by a
 * reader who could not tell them apart.
 */
import { useState } from 'react';
import { useStore } from '../../lib/store';
import { Trend } from '../../components/ui';
import { fmtDate } from '../../lib/format';
import { Group, Row, Sheet, NoRows } from './Rows';
import type { LabPanel } from '../../domain/types';

export function LabsTab({ patientId }: { patientId: string }) {
  const st = useStore();
  const panels = st.panelsFor(patientId);
  const vitals = st.vitalsFor(patientId);
  const series = st.clinicalSeriesFor(patientId);
  const selfTracked = st.patientSeriesFor(patientId);
  const reports = st.reportsFor(patientId);

  const [panel, setPanel] = useState<string | null>(null);
  const [measure, setMeasure] = useState<string | null>(null);
  const [showVitals, setShowVitals] = useState(false);

  const openPanel = panels.find((p) => p.id === panel);
  const openSeries = [...series, ...selfTracked].find((s) => s.id === measure);
  // A panel is "not yet reviewed" when a report of the same name and
  // date is still unacknowledged. Same fact, said on the row.
  const unreviewed = (p: LabPanel) =>
    reports.some((r) => !r.acknowledged && r.panel === p.name);
  const pending = reports.filter((r) => !r.acknowledged);

  return (
    <>
      {/*
        * The one thing on this screen that can hurt somebody, first
        * and in words. A report can arrive without a panel behind it,
        * so this group is built from the reports themselves rather
        * than from what happens to have values attached.
        */}
      {pending.length > 0 && (
        <Group title="Needs review" count={pending.length}>
          {pending.map((r) => (
            <Row key={r.id} name={r.panel} note="Not yet reviewed" warn
              when={fmtDate(r.resulted)}
              onOpen={() => {
                const match = panels.find((x) => x.name === r.panel);
                if (match) setPanel(match.id); else st.acknowledgeReport(r.id);
              }} />
          ))}
        </Group>
      )}

      <Group title="Reports" count={panels.length}>
        {panels.length === 0 ? <NoRows>None on file.</NoRows> : panels.map((p) => (
          <Row key={p.id} name={p.name} when={fmtDate(p.date)}
            note={unreviewed(p) ? 'Not yet reviewed' : undefined}
            warn={unreviewed(p)}
            onOpen={() => setPanel(p.id)} />
        ))}
      </Group>

      <Group title="Vitals" count={vitals.length}>
        {vitals.length === 0 ? <NoRows>None recorded.</NoRows> : (
          <Row name="Every reading, in clinic and at home" when={fmtDate(vitals[0].date)}
            onOpen={() => setShowVitals(true)} />
        )}
      </Group>

      <Group title="Tracked over time" count={series.length}>
        {series.length === 0 ? <NoRows>No results on file.</NoRows> : series.map((s) => {
          const last = s.points[s.points.length - 1];
          return (
            <Row key={s.id} name={s.name} when={fmtDate(last.date)}
              note={`${last.value} ${s.unit}`}
              warn={last.flag !== 'normal'}
              onOpen={() => setMeasure(s.id)} />
          );
        })}
      </Group>

      {selfTracked.length > 0 && (
        <Group title="Tracked by the patient" count={selfTracked.length}
          note="Patient-measured, not clinic-measured.">
          {selfTracked.map((s) => {
            const last = s.points[s.points.length - 1];
            return (
              <Row key={s.id} name={s.name} when={fmtDate(last.date)}
                note={`${last.value} ${s.unit}`}
                onOpen={() => setMeasure(s.id)} />
            );
          })}
        </Group>
      )}

      {openPanel && (
        <Sheet title={openPanel.name} sub={fmtDate(openPanel.date)}
          onClose={() => setPanel(null)}
          actions={pending.filter((r) => r.panel === openPanel.name).map((r) => (
            <button key={r.id} className="btn" onClick={() => st.acknowledgeReport(r.id)}>
              Mark reviewed
            </button>
          ))}>
          <table className="rows">
            <tbody>
              {openPanel.values.map((v) => (
                <tr key={v.key}>
                  <td>{v.name}</td>
                  <td className={`num${v.flag !== 'normal' ? ' flagged' : ''}`}>
                    {v.value} {v.unit}
                  </td>
                  <td className="small muted">
                    {v.refLow !== undefined || v.refHigh !== undefined
                      ? `${v.refLow ?? ''}${v.refLow !== undefined && v.refHigh !== undefined ? '–' : ''}${v.refHigh ?? ''}`
                      : 'no range supplied'}
                  </td>
                  <td className="small">{v.flag !== 'normal' ? v.flag : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Sheet>
      )}

      {openSeries && (
        <Sheet title={openSeries.name}
          sub={`LOINC ${openSeries.code}${openSeries.unit ? ` · ${openSeries.unit}` : ''}`}
          onClose={() => setMeasure(null)}>
          <Trend series={openSeries} w={540} h={120} />
          <table className="rows" style={{ marginTop: 16 }}>
            <tbody>
              {[...openSeries.points].reverse().map((pt) => (
                <tr key={pt.date}>
                  <td className="small">{fmtDate(pt.date)}</td>
                  <td className={`num${pt.flag !== 'normal' ? ' flagged' : ''}`}>
                    {pt.value} {openSeries.unit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Sheet>
      )}

      {showVitals && (
        <Sheet title="Vitals" sub={`${vitals.length} readings`}
          onClose={() => setShowVitals(false)}>
          <table className="rows">
            <thead>
              <tr><th>Date</th><th>Where</th><th>BP</th><th>HR</th><th>Weight</th><th>BMI</th></tr>
            </thead>
            <tbody>
              {vitals.map((v) => (
                <tr key={v.id}>
                  <td className="small">{fmtDate(v.date)}</td>
                  <td className="small muted">{v.source}</td>
                  <td className="num">{v.systolic ? `${v.systolic}/${v.diastolic}` : '—'}</td>
                  <td className="num">{v.heartRate ?? '—'}</td>
                  <td className="num">{v.weightLb ?? '—'}</td>
                  <td className="num">{v.bmi ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Sheet>
      )}
    </>
  );
}
