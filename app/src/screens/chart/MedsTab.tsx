/**
 * Medicines.
 *
 * Stopped drugs stay visible with the reason they were stopped. That
 * sentence is usually the most clinically useful thing on the screen
 * and almost every EMR throws it away.
 */
import { useStore } from '../../lib/store';
import { Chip, Panel, Prov, Empty } from '../../components/ui';
import { fmtDate } from '../../lib/format';

export function MedsTab({ patientId }: { patientId: string }) {
  const st = useStore();
  const meds = st.medsFor(patientId);
  const active = meds.filter((m) => m.status === 'active');
  const held = meds.filter((m) => m.status === 'held');
  const stopped = meds.filter((m) => m.status === 'stopped');

  const Row = ({ m }: { m: typeof meds[number] }) => (
    <tr>
      <td>
        <div style={{ fontWeight: 600 }}>{m.name} {m.dose}</div>
        <div className="small muted">{m.sig}</div>
        {m.changeNote && (
          <div className="small" style={{ marginTop: 5, color: 'var(--ink-2)' }}>{m.changeNote}</div>
        )}
        <div style={{ marginTop: 5 }}><Prov author={m.provenance.author} by={m.provenance.by} /></div>
      </td>
      <td style={{ width: 160 }} className="small muted">{m.indication ?? '—'}</td>
      <td style={{ width: 150 }} className="small muted">
        {fmtDate(m.started)}
        {m.stopped && <> &rarr; {fmtDate(m.stopped)}</>}
      </td>
      <td style={{ width: 140, textAlign: 'right' }}>
        {m.status === 'active' && (
          <button className="btn ghost sm"
            onClick={() => st.setMedStatus(m.id, 'held', 'Held at today’s visit.')}>
            Hold
          </button>
        )}
        {m.status === 'held' && (
          <button className="btn ghost sm" onClick={() => st.setMedStatus(m.id, 'active')}>
            Restart
          </button>
        )}
      </td>
    </tr>
  );

  return (
    <div className="stack">
      <Panel title="Active" flush right={
        <button className="btn sm">Prescribe</button>
      }>
        {active.length === 0 ? <Empty>None active.</Empty> : (
          <table className="rows"><tbody>{active.map((m) => <Row key={m.id} m={m} />)}</tbody></table>
        )}
      </Panel>

      {held.length > 0 && (
        <Panel title="Held" flush right={<Chip tone="warn">Needs a decision</Chip>}>
          <table className="rows"><tbody>{held.map((m) => <Row key={m.id} m={m} />)}</tbody></table>
        </Panel>
      )}

      {stopped.length > 0 && (
        <Panel title="Stopped" flush right={
          <span className="small muted">Kept, with the reason</span>
        }>
          <table className="rows"><tbody>{stopped.map((m) => <Row key={m.id} m={m} />)}</tbody></table>
        </Panel>
      )}

      <p className="small muted">
        Prescribing runs through a certified e-prescribing service, not this record.
        See the EMR assessment for why that one is bought rather than built.
      </p>
    </div>
  );
}
