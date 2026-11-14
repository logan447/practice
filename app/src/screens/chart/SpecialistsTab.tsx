/**
 * Specialists.
 *
 * Who else is involved, how to reach them, what they found, what they
 * advised, and what is still outstanding. The last one is the point:
 * co-management fails at the handoff, not at the consultation.
 */
import { useState } from 'react';
import { useStore } from '../../lib/store';
import { Chip, Panel, Empty } from '../../components/ui';
import { InlineAdd, Field } from '../../components/InlineAdd';
import { fmtDate } from '../../lib/format';

const BLANK = {
  name: '', specialty: '', practice: '', phone: '',
  lastSeen: '', findings: '', recommendations: '', outstanding: '',
};

export function SpecialistsTab({ patientId }: { patientId: string }) {
  const st = useStore();
  const [adding, setAdding] = useState(false);
  const [f, setF] = useState(BLANK);
  const specialists = st.specialistsFor(patientId);

  return (
    <div className="stack">
      {specialists.length === 0 && (
        <Panel title="Specialists"><Empty>Nobody else recorded.</Empty></Panel>
      )}

      {specialists.map((sp) => (
        <Panel key={sp.id} title={sp.name} eyebrow={sp.specialty}
          right={sp.outstanding && sp.outstanding !== 'None.'
            ? <Chip tone="warn">Outstanding</Chip>
            : <Chip tone="ok">Nothing pending</Chip>}>
          <div className="split" style={{ gap: 20 }}>
            <div className="stack">
              {sp.findings && (
                <div>
                  <div className="eyebrow" style={{ marginBottom: 4 }}>Findings</div>
                  <p>{sp.findings}</p>
                </div>
              )}
              {sp.recommendations && (
                <div>
                  <div className="eyebrow" style={{ marginBottom: 4 }}>Recommendations</div>
                  <p>{sp.recommendations}</p>
                </div>
              )}
              {sp.outstanding && (
                <div>
                  <div className="eyebrow" style={{ marginBottom: 4 }}>Outstanding</div>
                  <p>{sp.outstanding}</p>
                </div>
              )}
            </div>
            <div className="stack-sm">
              {sp.practice && <div className="small">{sp.practice}</div>}
              {sp.phone && <div className="small num">{sp.phone}</div>}
              {sp.lastSeen && (
                <div className="small muted">Last seen {fmtDate(sp.lastSeen)}</div>
              )}
            </div>
          </div>
        </Panel>
      ))}

      <Panel title="Add a specialist">
        <InlineAdd
          label="Add a specialist" open={adding} setOpen={setAdding}
          canSave={!!f.name.trim() && !!f.specialty.trim()}
          onSave={() => {
            st.addSpecialist(patientId, {
              name: f.name.trim(), specialty: f.specialty.trim(),
              practice: f.practice.trim() || undefined,
              phone: f.phone.trim() || undefined,
              lastSeen: f.lastSeen || undefined,
              findings: f.findings.trim() || undefined,
              recommendations: f.recommendations.trim() || undefined,
              outstanding: f.outstanding.trim() || undefined,
            });
            setF(BLANK);
          }}>
          <div className="grid g2">
            <Field label="Name" value={f.name} onChange={(v) => setF((p) => ({ ...p, name: v }))}
              placeholder="Dr. Priya Raman" />
            <Field label="Specialty" value={f.specialty}
              onChange={(v) => setF((p) => ({ ...p, specialty: v }))} placeholder="Cardiology" />
            <Field label="Practice" value={f.practice}
              onChange={(v) => setF((p) => ({ ...p, practice: v }))} placeholder="Austin Heart" />
            <Field label="Phone" value={f.phone}
              onChange={(v) => setF((p) => ({ ...p, phone: v }))} placeholder="(512) 555-0310" />
          </div>
          <Field label="Findings" value={f.findings} textarea
            onChange={(v) => setF((p) => ({ ...p, findings: v }))} />
          <Field label="Recommendations" value={f.recommendations} textarea
            onChange={(v) => setF((p) => ({ ...p, recommendations: v }))} />
          <Field label="Outstanding" value={f.outstanding}
            onChange={(v) => setF((p) => ({ ...p, outstanding: v }))}
            placeholder="Decision on stopping clopidogrel due November" />
        </InlineAdd>
      </Panel>
    </div>
  );
}
