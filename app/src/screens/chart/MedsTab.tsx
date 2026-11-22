/**
 * Medicines.
 *
 * Stopped drugs stay visible with the reason they were stopped. That
 * sentence is usually the most clinically useful thing on the screen
 * and almost every EMR throws it away.
 */
import { useMemo, useState } from 'react';
import { useStore } from '../../lib/store';
import { Prov } from '../../components/ui';
import { InlineAdd, Field } from '../../components/InlineAdd';
import { CodePicker } from '../../components/CodePicker';
import { Interactions } from '../../components/Interactions';
import { fmtDate } from '../../lib/format';
import { Rows, Row, Sheet, NoRows } from './Rows';
import { searchDrugs, searchConditions, resolveDrug } from '../../domain/terminology';
import { check } from '../../lib/interactions';

const BLANK = { name: '', rxcui: '', dose: '', sig: '', indication: '' };

export function MedsTab({ patientId }: { patientId: string }) {
  const st = useStore();
  const [adding, setAdding] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
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

  const sel = meds.find((m) => m.id === open);
  const selDrug = sel ? resolveDrug(sel.name, sel.rxcui) : undefined;

  const LABEL = { active: 'Active', held: 'Held', stopped: 'Stopped' } as const;
  const all = [...active, ...held, ...stopped];

  return (
    <>
      <Interactions alerts={standing} title="This list, checked" />

      <Rows>
        {all.length === 0 ? <NoRows>No medicines recorded.</NoRows> : all.map((m) => (
          <Row key={m.id}
            when={fmtDate(m.started)}
            tag={LABEL[m.status]} warn={m.status === 'held'}
            name={`${m.name} ${m.dose}`}
            onOpen={() => setOpen(m.id)} />
        ))}
      </Rows>

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

      {sel && (
        <Sheet title={`${sel.name} ${sel.dose}`}
          sub={[selDrug && selDrug.name.toLowerCase() !== sel.name.toLowerCase()
            ? selDrug.name : '', sel.indication, `started ${fmtDate(sel.started)}`]
            .filter(Boolean).join(' \u00b7 ')}
          onClose={() => setOpen(null)}
          actions={
            sel.status === 'active' ? (
              <button className="btn ghost"
                onClick={() => st.setMedStatus(sel.id, 'held', 'Held at today\u2019s visit.')}>
                Hold
              </button>
            ) : sel.status === 'held' ? (
              <button className="btn ghost" onClick={() => st.setMedStatus(sel.id, 'active')}>
                Restart
              </button>
            ) : undefined
          }>
          <p>{sel.sig}</p>
          {sel.changeNote && <p>{sel.changeNote}</p>}
          {sel.stopped && <p className="muted">Stopped {fmtDate(sel.stopped)}.</p>}
          <Prov author={sel.provenance.author} by={sel.provenance.by} />
        </Sheet>
      )}
    </>
  );
}
