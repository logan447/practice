/**
 * Medicines.
 *
 * Stopped drugs stay visible with the reason they were stopped. That
 * sentence is usually the most clinically useful thing on the screen
 * and almost every EMR throws it away.
 */
import { useState } from 'react';
import { useStore } from '../../lib/store';
import { Chip, Panel, Prov, Empty } from '../../components/ui';
import { InlineAdd, Field } from '../../components/InlineAdd';
import { fmtDate } from '../../lib/format';

const BLANK = { name: '', dose: '', sig: '', indication: '' };

export function MedsTab({ patientId }: { patientId: string }) {
  const st = useStore();
  const [adding, setAdding] = useState(false);
  const [nm, setNm] = useState(BLANK);
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
      <Panel title="Active" flush right={<span className="small muted">{active.length}</span>}>
        {active.length === 0 ? <Empty>No medicines recorded.</Empty> : (
          <table className="rows"><tbody>{active.map((m) => <Row key={m.id} m={m} />)}</tbody></table>
        )}
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--line-2)' }}>
          <InlineAdd
            label="Add a medicine" open={adding} setOpen={setAdding}
            canSave={!!nm.name.trim()}
            onSave={() => {
              st.addMedication(patientId, nm.name.trim(), nm.dose.trim(), nm.sig.trim(),
                nm.indication.trim() || undefined);
              setNm(BLANK);
            }}>
            <div className="grid g2">
              <Field label="Name" value={nm.name} onChange={(v) => setNm((p) => ({ ...p, name: v }))}
                placeholder="Lisinopril" />
              <Field label="Dose" value={nm.dose} onChange={(v) => setNm((p) => ({ ...p, dose: v }))}
                placeholder="10 mg" />
            </div>
            <Field label="How they take it" value={nm.sig}
              onChange={(v) => setNm((p) => ({ ...p, sig: v }))}
              placeholder="One tablet by mouth each morning" />
            <Field label="What for" value={nm.indication}
              onChange={(v) => setNm((p) => ({ ...p, indication: v }))}
              placeholder="Hypertension" />
          </InlineAdd>
        </div>
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
