/**
 * Notes.
 *
 * Signed notes read as prose, not as form fields. The headings are
 * there because clinicians scan for them, but nothing is collapsed by
 * default: a note you have to expand four times to read is a note
 * nobody reads.
 */
import { useStore } from '../../lib/store';
import { useNav } from '../../lib/nav';
import { Chip, Panel, Empty } from '../../components/ui';
import { fmtDate } from '../../lib/format';

const KIND: Record<string, string> = {
  annual: 'Annual review', 'follow-up': 'Follow-up', acute: 'Acute',
  message: 'Message', intake: 'First visit',
};

export function NotesTab({ patientId }: { patientId: string }) {
  const st = useStore();
  const nav = useNav();
  const encounters = st.encountersFor(patientId);

  if (encounters.length === 0) return <Panel title="Notes"><Empty>No visits yet.</Empty></Panel>;

  return (
    <div className="stack">
      {encounters.map((e) => (
        <Panel key={e.id} title={KIND[e.kind]}
          eyebrow={`${fmtDate(e.date)}${e.duration ? ` · ${e.duration} min` : ''}`}
          right={
            e.status === 'signed'
              ? <Chip tone="ok">Signed</Chip>
              : (
                <div className="row">
                  <Chip tone="warn">{e.status === 'in-progress' ? 'Unsigned' : 'Scheduled'}</Chip>
                  <button className="btn sm" onClick={() => nav.go({ name: 'encounter', encounterId: e.id })}>
                    {e.status === 'in-progress' ? 'Continue' : 'Open'}
                  </button>
                </div>
              )
          }>
          <p className="muted small" style={{ marginBottom: e.note ? 14 : 0 }}>{e.reason}</p>

          {e.note && (
            <div className="stack">
              <Section label="Subjective" text={e.note.subjective} />
              <Section label="Objective" text={e.note.objective} />
              <Section label="Assessment" text={e.note.assessment} />
              <Section label="Plan" text={e.note.plan} />
              {e.signedAt && (
                <>
                  <div className="sep" />
                  <div className="small muted">
                    Signed by L. DuBose, MD on {fmtDate(e.signedAt)}
                  </div>
                </>
              )}
            </div>
          )}
        </Panel>
      ))}
    </div>
  );
}

function Section({ label, text }: { label: string; text: string }) {
  if (!text) return null;
  return (
    <div>
      <div className="eyebrow" style={{ marginBottom: 4 }}>{label}</div>
      <p>{text}</p>
    </div>
  );
}
