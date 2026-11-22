/**
 * Notes, as signed.
 *
 * One line per visit: what it was, where it happened, whether it has
 * been signed, and when. Nothing else.
 *
 * Every one of them says "Visit", because there is one kind. What
 * used to be on the line was the reason it was booked, which reads as
 * a type when a list is stacked up: a three month review and an
 * annual physical and a clinical visit are the same act of work with
 * different words in front of it. A summary of what happened was on
 * the line too, and ten summaries is a list nobody scans.
 *
 * Opening one is the note, in the same shape the visit wrote it: a
 * sentence about the patient, then four foldable sections and what
 * they were asked to do. It reads the way the visit screen reads,
 * because it is the same document.
 */
import { useState } from 'react';
import { useStore } from '../../lib/store';
import { useNav } from '../../lib/nav';
import { fmtDate } from '../../lib/format';
import { SETTING_LABEL } from '../../domain/types';
import { Group, Row, Sheet, NoRows } from './Rows';

export function NotesTab({ patientId }: { patientId: string }) {
  const st = useStore();
  const nav = useNav();
  const p = st.patient(patientId);
  const encounters = st.encountersFor(patientId);
  const [open, setOpen] = useState<string | null>(null);
  const e = encounters.find((x) => x.id === open);

  const state = (x: string) =>
    (x === 'signed' ? 'Signed' : x === 'in-progress' ? 'Unsigned' : 'Scheduled');

  return (
    <>
      <Group title="Notes" count={encounters.length}>
        {encounters.length === 0 ? <NoRows>No visits yet.</NoRows> : encounters.map((x) => (
          <Row key={x.id}
            name={`Visit · ${SETTING_LABEL[x.setting ?? 'in-person']}`}
            note={state(x.status)}
            warn={x.status === 'in-progress'}
            when={fmtDate(x.date)}
            onOpen={() => setOpen(x.id)} />
        ))}
      </Group>

      {e && p && (
        <Sheet title={p.name}
          sub={[
            `Visit · ${SETTING_LABEL[e.setting ?? 'in-person']}`,
            fmtDate(e.date),
            e.signedAt ? `signed ${fmtDate(e.signedAt)}` : state(e.status).toLowerCase(),
          ].join(' · ')}
          onClose={() => setOpen(null)}
          actions={e.status !== 'signed' && (
            <button className="btn" onClick={() => nav.go({ name: 'encounter', encounterId: e.id })}>
              {e.status === 'in-progress' ? 'Continue' : 'Open'}
            </button>
          )}>
          {!e.note ? <p className="muted">Not held yet, so there is no note.</p> : (
            <div className="note signednote">
              {e.note.subjective.oneLiner && (
                <p className="oneliner vone">{e.note.subjective.oneLiner}</p>
              )}

              <Fold title="Subjective" text={[
                e.note.subjective.reason,
                e.note.subjective.chartReview,
                e.note.subjective.diagnostics,
                e.note.subjective.specialists,
                e.note.subjective.additional,
              ].filter(Boolean).join('\n\n')} />

              <Fold title="Objective" text={[
                e.note.objective.homeMeasures, e.note.objective.vitals, e.note.objective.exam,
              ].filter(Boolean).join('\n\n')} />

              <Fold title="Assessment" text={e.note.assessment.overall} />

              {e.note.plan.problems.length > 0 && (
                <Fold title="Plan" count={e.note.plan.problems.length}>
                  {e.note.plan.problems.map((pr) => (
                    <div key={pr.id} className="planprob">
                      <div className="planprobname">{pr.problem}</div>
                      <ul className="planpoints">
                        {points(pr).map((t, i) => <li key={i}>{t}</li>)}
                      </ul>
                    </div>
                  ))}
                </Fold>
              )}

              <Fold title="Patient instructions" text={e.note.plan.overall} />
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
 * it is looked at again. None of them labelled: a reader can see that
 * "Needs improvement" is an assessment and that "Lisinopril 20 mg" is
 * a treatment, and the words in front of them were two columns of
 * furniture down the left of every plan.
 */
const points = (pr: {
  assessment: string; treatment: string; orders: string; followUp: string;
}): string[] => [pr.assessment, pr.treatment, pr.orders, pr.followUp]
  .flatMap((v) => (v ?? '').split('\n'))
  .map((t) => t.replace(/^\s*[•\-*]\s*/, '').trim())
  .filter(Boolean);

/**
 * A section of a signed note, foldable.
 *
 * Same heading, same weight, same size as the visit screen that wrote
 * it. Silent when it has nothing: a heading over an empty section in
 * a clinical document reads as a finding of nothing.
 */
function Fold({ title, text, count, children }: {
  title: string;
  text?: string;
  count?: number;
  children?: React.ReactNode;
}) {
  const [shut, setShut] = useState(false);
  if (!text && !children) return null;
  return (
    <section className={`nbox${shut ? ' shut' : ''}`}>
      <button className="nboxhead" onClick={() => setShut((v) => !v)}>
        <span className="foldarrow" aria-hidden="true">{shut ? '›' : '⌄'}</span>
        <span className="nboxtitle">{title}</span>
        {count !== undefined && <span className="nboxcount">{count}</span>}
      </button>
      {!shut && (
        <div className="nbodytext">
          {children ?? (text ?? '').split('\n\n').map((para, i) => (
            <p key={i} style={{ whiteSpace: 'pre-line' }}>{para}</p>
          ))}
        </div>
      )}
    </section>
  );
}
