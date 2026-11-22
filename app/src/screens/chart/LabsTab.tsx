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
import { Rows, Row, Sheet, NoRows } from './Rows';
import type { LabPanel } from '../../domain/types';

export function LabsTab({ patientId }: { patientId: string }) {
  const st = useStore();
  const panels = st.panelsFor(patientId);
  const series = st.clinicalSeriesFor(patientId);
  const selfTracked = st.patientSeriesFor(patientId);
  const reports = st.reportsFor(patientId);

  const [panel, setPanel] = useState<string | null>(null);
  const [measure, setMeasure] = useState<string | null>(null);

  const openPanel = panels.find((p) => p.id === panel);
  const openSeries = [...series, ...selfTracked].find((s) => s.id === measure);
  // A panel is "not yet reviewed" when a report of the same name and
  // date is still unacknowledged. Same fact, said on the row.
  const unreviewed = (p: LabPanel) =>
    reports.some((r) => !r.acknowledged && r.panel === p.name);
  const pending = reports.filter((r) => !r.acknowledged);

  /*
   * One list. Reports, the measures tracked across them, and what the
   * patient measures themselves, which is a different measurement and
   * says so on every row rather than once over a heading.
   */
  const feed = [
    ...panels.map((x) => ({
      key: x.id, iso: x.date,
      tag: unreviewed(x) ? 'Not yet reviewed' : 'Report',
      warn: unreviewed(x), name: x.name,
      open: () => setPanel(x.id),
    })),
    ...pending.filter((r) => !panels.some((x) => x.name === r.panel)).map((r) => ({
      key: r.id, iso: r.resulted, tag: 'Not yet reviewed',
      warn: true, name: r.panel,
      open: () => st.acknowledgeReport(r.id),
    })),
    ...series.map((x) => {
      const last = x.points[x.points.length - 1];
      return {
        key: x.id, iso: last.date,
        tag: last.flag === 'normal' ? 'Tracked' : last.flag,
        warn: last.flag !== 'normal',
        name: `${x.name} ${last.value} ${x.unit}`,
        open: () => setMeasure(x.id),
      };
    }),
    ...selfTracked.map((x) => {
      const last = x.points[x.points.length - 1];
      return {
        key: x.id, iso: last.date, tag: 'Patient-measured',
        warn: false,
        name: `${x.name} ${last.value} ${x.unit}`,
        open: () => setMeasure(x.id),
      };
    }),
    // Sorted on the stored date, never on the printed one: "9 Nov"
    // sorts before "29 Oct" when you sort the words.
  ].sort((a, b) => b.iso.localeCompare(a.iso));

  return (
    <>
      {/*
        * Panels and the measures they feed, in one list in time order.
        * An unreviewed report says so on its own row: it is the one
        * thing here that can hurt somebody.
        */}
      <Rows>
        {feed.length === 0 ? <NoRows>None on file.</NoRows> : feed.map((x) => (
          <Row key={x.key} when={fmtDate(x.iso)} tag={x.tag} warn={x.warn} name={x.name}
            onOpen={x.open} />
        ))}
      </Rows>

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

    </>
  );
}
