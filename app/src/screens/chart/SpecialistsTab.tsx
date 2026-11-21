/**
 * The care team.
 *
 * Who else is involved, what they found, what they advised, and what
 * is still outstanding. The last one is the point: co-management
 * fails at the handoff, not at the consultation, so it is the word
 * that appears on the row.
 */
import { useState } from 'react';
import { useStore } from '../../lib/store';
import { InlineAdd, Field } from '../../components/InlineAdd';
import { fmtDate } from '../../lib/format';
import { Group, Row, Sheet, NoRows } from './Rows';

const BLANK = {
  name: '', specialty: '', practice: '', phone: '',
  lastSeen: '', findings: '', recommendations: '', outstanding: '',
};

const pending = (s?: string) => !!s && !/^(none|nothing|n\/a|no)\b/i.test(s.trim());

export function SpecialistsTab({ patientId }: { patientId: string }) {
  const st = useStore();
  const [adding, setAdding] = useState(false);
  const [f, setF] = useState(BLANK);
  const [open, setOpen] = useState<string | null>(null);
  const specialists = st.specialistsFor(patientId);
  const sp = specialists.find((x) => x.id === open);

  return (
    <>
      <Group title="Specialists" count={specialists.length}>
        {specialists.length === 0 ? <NoRows>Nobody else recorded.</NoRows> : specialists.map((x) => (
          <Row key={x.id} name={`${x.name}, ${x.specialty}`}
            note={pending(x.outstanding) ? 'Outstanding' : undefined}
            warn={pending(x.outstanding)}
            when={x.lastSeen ? fmtDate(x.lastSeen) : undefined}
            onOpen={() => setOpen(x.id)} />
        ))}
      </Group>

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

      {sp && (
        <Sheet title={sp.name}
          sub={[sp.specialty, sp.practice, sp.phone,
            sp.lastSeen ? `last seen ${fmtDate(sp.lastSeen)}` : ''].filter(Boolean).join(' · ')}
          onClose={() => setOpen(null)}>
          {sp.findings && <Part label="Findings" text={sp.findings} />}
          {sp.recommendations && <Part label="Recommendations" text={sp.recommendations} />}
          {sp.outstanding && <Part label="Outstanding" text={sp.outstanding} />}
        </Sheet>
      )}
    </>
  );
}

const Part = ({ label, text }: { label: string; text: string }) => (
  <div style={{ marginBottom: 14 }}>
    <div className="eyebrow" style={{ marginBottom: 4 }}>{label}</div>
    <p style={{ margin: 0 }}>{text}</p>
  </div>
);
