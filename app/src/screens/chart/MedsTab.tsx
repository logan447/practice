/**
 * Medicines.
 *
 * Stopped drugs stay visible with the reason they were stopped. That
 * sentence is usually the most clinically useful thing on the screen
 * and almost every EMR throws it away.
 */
import { useMemo, useState } from 'react';
import { useStore } from '../../lib/store';
import { Chip, Panel, Prov, Empty } from '../../components/ui';
import { InlineAdd, Field } from '../../components/InlineAdd';
import { CodePicker } from '../../components/CodePicker';
import { Interactions } from '../../components/Interactions';
import { fmtDate } from '../../lib/format';
import { searchDrugs, searchConditions, resolveDrug } from '../../domain/terminology';
import { check } from '../../lib/interactions';

const BLANK = { name: '', rxcui: '', dose: '', sig: '', indication: '' };

export function MedsTab({ patientId }: { patientId: string }) {
  const st = useStore();
  const [adding, setAdding] = useState(false);
  const [nm, setNm] = useState(BLANK);
  const meds = st.medsFor(patientId);
  const allergies = st.allergiesFor(patientId);
  const conditions = st.conditionsFor(patientId);
  const series = st.seriesFor(patientId);
  const active = meds.filter((m) => m.status === 'active');

  /** The whole list against itself, the allergies and the problems. */
  const standing = useMemo(
    () => check({ medications: meds, allergies, conditions, series }),
    [meds, allergies, conditions, series],
  );

  /**
   * And the one being typed, checked before it is saved. Checking
   * after the fact is checking too late: the decision has been made.
   */
  const candidate = useMemo(
    () => (nm.name.trim().length < 3 ? [] : check({
      medications: meds, allergies, conditions, series,
      candidate: { name: nm.name.trim(), rxcui: nm.rxcui || undefined },
    })),
    [nm.name, nm.rxcui, meds, allergies, conditions, series],
  );
  const held = meds.filter((m) => m.status === 'held');
  const stopped = meds.filter((m) => m.status === 'stopped');

  const Row = ({ m }: { m: typeof meds[number] }) => {
    const d = resolveDrug(m.name, m.rxcui);
    return (
    <tr>
      <td>
        <div style={{ fontWeight: 600 }}>
          {m.name} {m.dose}
          {d && d.name.toLowerCase() !== m.name.toLowerCase() && (
            <span className="small muted" style={{ fontWeight: 400 }}> &middot; {d.name}</span>
          )}
        </div>
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
  };

  return (
    <div className="stack">
      <Interactions alerts={standing} title="This list, checked" />
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
                nm.indication.trim() || undefined, nm.rxcui || undefined);
              setNm(BLANK);
            }}>
            <div className="grid g2">
              <CodePicker
                label="Name" value={nm.name} autoFocus
                placeholder="Lisinopril, or Zestril"
                hint="Generic or brand. RxNorm."
                onText={(v) => setNm((p) => ({ ...p, name: v, rxcui: '' }))}
                search={(q) => searchDrugs(q).map((d) => ({
                  id: d.rxcui, primary: d.name, code: d.rxcui,
                  note: [d.brands.slice(0, 3).join(', '), d.atc[0]?.name]
                    .filter(Boolean).join(' \u00b7 ') || undefined,
                }))}
                onPick={(r) => setNm((p) => ({ ...p, name: r.primary, rxcui: r.id }))}
              />
              <Field label="Dose" value={nm.dose} onChange={(v) => setNm((p) => ({ ...p, dose: v }))}
                placeholder="10 mg" />
            </div>
            {candidate.length > 0 && (
              <Interactions alerts={candidate} title="Before you prescribe this" />
            )}
            <Field label="How they take it" value={nm.sig}
              onChange={(v) => setNm((p) => ({ ...p, sig: v }))}
              placeholder="One tablet by mouth each morning" />
            <CodePicker
              label="What for" value={nm.indication}
              placeholder="Hypertension"
              hint="ICD-10-CM. Links the drug to the problem it is for."
              onText={(v) => setNm((p) => ({ ...p, indication: v }))}
              search={(q) => searchConditions(q).map((c) => ({
                id: c.code, primary: c.name, code: c.code,
              }))}
              onPick={(r) => setNm((p) => ({ ...p, indication: r.primary }))}
            />
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

    </div>
  );
}
