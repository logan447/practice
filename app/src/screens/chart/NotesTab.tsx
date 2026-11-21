/**
 * Notes, as signed.
 *
 * One line per encounter. The note itself reads as prose in a sheet,
 * with its headings, because a clinician scans for them; nothing is
 * collapsed inside it, since a note you have to expand four times to
 * read is a note nobody reads.
 */
import { useState } from 'react';
import { useStore } from '../../lib/store';
import { useNav } from '../../lib/nav';
import { fmtDate } from '../../lib/format';
import { kindLabel } from '../../lib/clinical';
import { Group, Row, Sheet, NoRows } from './Rows';

export function NotesTab({ patientId }: { patientId: string }) {
  const st = useStore();
  const nav = useNav();
  const encounters = st.encountersFor(patientId);
  const [open, setOpen] = useState<string | null>(null);
  const e = encounters.find((x) => x.id === open);

  const state = (s: string) =>
    (s === 'signed' ? undefined : s === 'in-progress' ? 'Unsigned' : 'Scheduled');

  return (
    <>
      <Group title="Notes" count={encounters.length}>
        {encounters.length === 0 ? <NoRows>No visits yet.</NoRows> : encounters.map((x) => (
          <Row key={x.id} name={x.reason || kindLabel(x.kind)} when={fmtDate(x.date)}
            note={state(x.status)} warn={x.status === 'in-progress'}
            onOpen={() => setOpen(x.id)} />
        ))}
      </Group>

      {e && (
        <Sheet title={e.reason || kindLabel(e.kind)}
          sub={`${fmtDate(e.date)}${e.duration ? ` · ${e.duration} min` : ''}${
            e.signedAt ? ` · signed by L. DuBose, MD` : ''}`}
          onClose={() => setOpen(null)}
          actions={e.status !== 'signed' && (
            <button className="btn" onClick={() => nav.go({ name: 'encounter', encounterId: e.id })}>
              {e.status === 'in-progress' ? 'Continue' : 'Open'}
            </button>
          )}>
          <p className="muted">{e.reason}</p>
          {!e.note ? <p className="muted">Not held yet, so there is no note.</p> : (
            <div className="note">
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
                <PlanByProblem problems={e.note.plan.problems} />
              )}
              <Section label="Plan summary" text={e.note.plan.overall} />
            </div>
          )}
        </Sheet>
      )}
    </>
  );
}

/** The plan, problem by problem, in the same fold as the rest. */
function PlanByProblem({ problems }: {
  problems: { id: string; problem: string; assessment: string; treatment: string;
    orders: string; followUp: string }[];
}) {
  const [shut, setShut] = useState(false);
  return (
    <section className={`fold d1${shut ? ' shut' : ''}`}>
      <button className="foldhead" onClick={() => setShut((v) => !v)}>
        <span className="foldarrow" aria-hidden="true">{shut ? '\u203a' : '\u2304'}</span>
        <span className="foldtitle">Plan by problem</span>
        <span className="foldright">{problems.length}</span>
      </button>
      {!shut && (
        <div className="foldbody">
          <div className="stack-sm">
            {problems.map((pr) => (
              <div key={pr.id} style={{ borderLeft: '2px solid var(--accent)', paddingLeft: 11 }}>
                <div style={{ fontWeight: 600 }}>{pr.problem}</div>
                {[['Assessment', pr.assessment], ['Treatment', pr.treatment],
                  ['Orders', pr.orders], ['Follow-up', pr.followUp]]
                  .filter(([, v]) => v)
                  .map(([l, v]) => (
                    <div key={l} style={{ marginTop: 2, whiteSpace: 'pre-line' }}>
                      <span className="muted">{l}: </span>{v}
                    </div>
                  ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

/**
 * One part of a signed note, foldable.
 *
 * The whole note is here and open: a note you have to expand four
 * times to read is a note nobody reads. The folds are for putting a
 * part away once you have read it, not for hiding it until you ask.
 */
function Section({ label, text }: { label: string; text: string }) {
  const [shut, setShut] = useState(false);
  if (!text) return null;
  return (
    <section className={`fold d1${shut ? ' shut' : ''}`}>
      <button className="foldhead" onClick={() => setShut((v) => !v)}>
        <span className="foldarrow" aria-hidden="true">{shut ? '\u203a' : '\u2304'}</span>
        <span className="foldtitle">{label}</span>
      </button>
      {!shut && (
        <div className="foldbody">
          {text.split('\n\n').map((para, i) => (
            <p key={i} style={{ marginTop: i ? 8 : 0, whiteSpace: 'pre-line' }}>{para}</p>
          ))}
        </div>
      )}
    </section>
  );
}
