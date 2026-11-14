/**
 * Prevention.
 *
 * A flat list with a status and a date. Overdue first. Resisting the
 * urge to build a rules engine: in a small panel the physician knows
 * why something is due, and a wrong rule is worse than no rule.
 */
import { useStore } from '../../lib/store';
import { Chip, Panel, Empty } from '../../components/ui';
import { fmtDate, relative } from '../../lib/format';
import type { PreventionStatus } from '../../domain/types';

const ORDER: Record<PreventionStatus, number> = {
  overdue: 0, due: 1, current: 2, 'not-applicable': 3,
};
const TONE: Record<PreventionStatus, string | undefined> = {
  overdue: 'crit', due: 'warn', current: 'ok', 'not-applicable': undefined,
};
const LABEL: Record<PreventionStatus, string> = {
  overdue: 'Overdue', due: 'Due', current: 'Up to date', 'not-applicable': 'Not applicable',
};

export function PreventionTab({ patientId }: { patientId: string }) {
  const st = useStore();
  const items = st.preventionFor(patientId).slice().sort(
    (a, b) => ORDER[a.status] - ORDER[b.status] || a.name.localeCompare(b.name));

  const needing = items.filter((i) => i.status === 'overdue' || i.status === 'due').length;

  return (
    <Panel title="Prevention and screening" flush right={
      needing > 0
        ? <Chip tone="warn">{needing} need attention</Chip>
        : <Chip tone="ok">All up to date</Chip>
    }>
      {items.length === 0 ? <Empty>Nothing scheduled yet.</Empty> : (
        <table className="rows">
          <thead>
            <tr>
              <th>Item</th>
              <th style={{ width: 150 }}>Status</th>
              <th style={{ width: 160 }}>Last done</th>
              <th style={{ width: 160 }}>Due</th>
              <th style={{ width: 110 }}></th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id}>
                <td>
                  <div style={{ fontWeight: 600 }}>{i.name}</div>
                  {i.note && <div className="small muted" style={{ marginTop: 2 }}>{i.note}</div>}
                </td>
                <td><Chip tone={TONE[i.status]}>{LABEL[i.status]}</Chip></td>
                <td className="small muted">{i.lastDone ? fmtDate(i.lastDone) : '—'}</td>
                <td className="small muted">{i.dueBy ? relative(i.dueBy) : '—'}</td>
                <td style={{ textAlign: 'right' }}>
                  {(i.status === 'due' || i.status === 'overdue') && (
                    <button className="btn ghost sm">Order</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Panel>
  );
}
