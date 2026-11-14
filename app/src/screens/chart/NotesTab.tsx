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
import { kindLabel } from '../../lib/clinical';



export function NotesTab({ patientId }: { patientId: string }) {
  const st = useStore();
  const nav = useNav();
  const encounters = st.encountersFor(patientId);

  if (encounters.length === 0) return <Panel title="Notes"><Empty>No visits yet.</Empty></Panel>;

  return (
    <div className="stack">
      {encounters.map((e) => (
        <Panel key={e.id} title={kindLabel(e.kind)}
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
              <Section label="Subjective" text={[
                e.note.subjective.oneLiner, e.note.subjective.reason,
                e.note.subjective.chartReview, e.note.subjective.diagnostics,
                e.note.subjective.specialists, e.note.subjective.additional,
              ].filter(Boolean).join('\n\n')} />
              <Section label="Objective" text={[
                e.note.objective.homeMeasures, e.note.objective.vitals, e.note.objective.exam,
              ].filter(Boolean).join('\n\n')} />
              <Section label="Assessment" text={[
                e.note.assessment.oneLiner, e.note.assessment.overall,
              ].filter(Boolean).join('\n\n')} />
              {e.note.plan.problems.length > 0 && (
                <div>
                  <div className="eyebrow" style={{ marginBottom: 6 }}>Plan by problem</div>
                  <div className="stack-sm">
                    {e.note.plan.problems.map((pr) => (
                      <div key={pr.id} style={{
                        borderLeft: '2px solid var(--accent)', paddingLeft: 11,
                      }}>
                        <div style={{ fontWeight: 600 }}>{pr.problem}</div>
                        {[['Assessment', pr.assessment], ['Treatment', pr.treatment],
                          ['Orders', pr.orders], ['Follow-up', pr.followUp]]
                          .filter(([, v]) => v)
                          .map(([l, v]) => (
                            <div key={l} className="small" style={{ marginTop: 2 }}>
                              <span className="muted">{l}: </span>{v}
                            </div>
                          ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <Section label="Plan summary" text={e.note.plan.overall} />
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
      {text.split('\n\n').map((para, i) => (
        <p key={i} style={{ marginTop: i ? 8 : 0, whiteSpace: 'pre-line' }}>{para}</p>
      ))}
    </div>
  );
}
