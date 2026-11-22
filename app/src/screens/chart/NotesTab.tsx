/**
 * Notes, as signed.
 *
 * One line per visit, and every one of them says "Visit", because
 * there is one kind. What used to be on the line was the reason it
 * was booked, which reads as a type when a list of them is stacked up:
 * a three month review and an annual physical and a clinical visit
 * are the same act of work with different words in front of it. The
 * reason is still there, beside the status, as what it is.
 */
import { useState } from 'react';
import { useStore } from '../../lib/store';
import { useNav } from '../../lib/nav';
import { fmtDate } from '../../lib/format';
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
          <Row key={x.id} name="Visit"
            note={[state(x.status), x.reason].filter(Boolean).join(' \u00b7 ')}
            warn={x.status === 'in-progress'}
            when={fmtDate(x.date)}
            onOpen={() => setOpen(x.id)} />
        ))}
      </Group>

      {e && (
        <Sheet title="Visit"
          sub={[
            fmtDate(e.date),
            e.reason,
            e.duration ? `${e.duration} min` : '',
            e.signedAt ? 'signed by L. DuBose, MD' : '',
          ].filter(Boolean).join(' \u00b7 ')}
          onClose={() => setOpen(null)}
          actions={e.status !== 'signed' && (
            <button className="btn" onClick={() => nav.go({ name: 'encounter', encounterId: e.id })}>
              {e.status === 'in-progress' ? 'Continue' : 'Open'}
            </button>
          )}>
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
            </div>
          )}
        </Sheet>
      )}
    </>
  );
}

/**
 * One problem's plan, as points.
 *
 * The name, then where it stands, then what is being done, then when
 * it is looked at again. Each on its own line and none of them
 * labelled: a reader can see that "Needs improvement" is an
 * assessment and that "Lisinopril 20 mg" is a treatment, and the
 * words "Assessment:" and "Treatment:" in front of them were two
 * columns of furniture down the left of every plan.
 *
 * Treatment arrives as the lines of the plan field, bulleted or not,
 * so it is split back into the points it was written as.
 */
const points = (pr: {
  assessment: string; treatment: string; orders: string; followUp: string;
}): string[] => [pr.assessment, pr.treatment, pr.orders, pr.followUp]
  .flatMap((v) => (v ?? '').split('\n'))
  .map((t) => t.replace(/^\s*[\u2022\-*]\s*/, '').trim())
  .filter(Boolean);

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
              <div key={pr.id} className="planprob">
                <div className="planprobname">{pr.problem}</div>
                <ul className="planpoints">
                  {points(pr).map((t, i) => <li key={i}>{t}</li>)}
                </ul>
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
