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
import { createPortal } from 'react-dom';
import { useStore } from '../../lib/store';
import { useActor } from '../../lib/session';
import { record } from '../../lib/audit';
import { buildFaxNote } from '../../lib/faxNote';
import { useNav } from '../../lib/nav';
import { fmtDate } from '../../lib/format';
import { SETTING_LABEL } from '../../domain/types';
import { Rows, Row, Sheet, NoRows } from './Rows';
import { NoteText } from './NoteText';

export function NotesTab({ patientId }: { patientId: string }) {
  const st = useStore();
  const nav = useNav();
  const p = st.patient(patientId);
  const encounters = st.encountersFor(patientId);
  const [open, setOpen] = useState<string | null>(null);
  const e = encounters.find((x) => x.id === open);
  const [faxing, setFaxing] = useState(false);

  // The sheet is closed and reopened by id, so the fax form must go
  // with it: a form left standing over the next note is a form that
  // sends the wrong one.
  const show = (id: string | null) => { setFaxing(false); setOpen(id); };

  const state = (x: string) =>
    (x === 'signed' ? 'Signed' : x === 'in-progress' ? 'Unsigned' : 'Scheduled');

  return (
    <>
      <Rows>
        {encounters.length === 0 ? <NoRows>No visits yet.</NoRows> : encounters.map((x) => (
          <Row key={x.id}
            when={fmtDate(x.date)}
            tag={state(x.status)}
            warn={x.status === 'in-progress'}
            name={`Visit · ${SETTING_LABEL[x.setting ?? 'in-person']}`}
            onOpen={() => show(x.id)} />
        ))}
      </Rows>

      {e && p && (
        <Sheet title={p.name}
          sub={[
            `Visit · ${SETTING_LABEL[e.setting ?? 'in-person']}`,
            fmtDate(e.date),
            e.signedAt ? `signed ${fmtDate(e.signedAt)}` : state(e.status).toLowerCase(),
          ].join(' · ')}
          onClose={() => show(null)}
          actions={e.status === 'signed' ? (faxing ? null : (
            <button className="btn ghost" onClick={() => setFaxing(true)}>Send this note</button>
          )) : (
            <button className="btn" onClick={() => nav.go({ name: 'encounter', encounterId: e.id })}>
              {e.status === 'in-progress' ? 'Continue' : 'Open'}
            </button>
          )}>
          {faxing && p && <FaxNote patientId={patientId} encounterId={e.id}
            onClose={() => setFaxing(false)} />}
          {!e.note ? <p className="muted">Not held yet, so there is no note.</p> : (
            <div className="note signednote">
              {/*
                * The sentence about the patient belongs to the
                * subjective, which is the section that is about the
                * patient. Standing above the first heading it read
                * as a caption on the drawer, and the drawer already
                * has one.
                */}
              <Fold title="Subjective" lead={e.note.subjective.oneLiner} text={[
                e.note.subjective.reason,
                e.note.subjective.chartReview,
                e.note.subjective.diagnostics,
                e.note.subjective.specialists,
                e.note.subjective.additional,
              ].filter(Boolean).join('\n\n')} />

              <Fold title="Objective" startShut text={[
                e.note.objective.homeMeasures, e.note.objective.vitals, e.note.objective.exam,
              ].filter(Boolean).join('\n\n')} />

              <Fold title="Assessment" startShut text={e.note.assessment.overall} />

              {e.note.plan.problems.length > 0 && (
                <Fold title="Plan" startShut count={e.note.plan.problems.length}>
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

              <Fold title="Patient instructions" startShut
                text={[e.note.plan.overall, e.note.plan.followUp]
                  .filter(Boolean).join('\n\n')} />
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
function Fold({ title, text, count, startShut, children, lead }: {
  title: string;
  text?: string;
  count?: number;
  /** Shut when the note opens. Only the subjective is not. */
  startShut?: boolean;
  children?: React.ReactNode;
  /** The sentence between the heading and the rule under it. */
  lead?: string;
}) {
  const [shut, setShut] = useState(!!startShut);
  if (!text && !children && !lead) return null;
  return (
    <section className={`nbox${shut ? ' shut' : ''}`}>
      <div className="nboxtop">
        <button className="nboxhead" onClick={() => setShut((v) => !v)}>
          <span className="foldarrow" aria-hidden="true">{shut ? '›' : '⌄'}</span>
          <span className="nboxtitle">{title}</span>
          {count !== undefined && <span className="nboxcount">{count}</span>}
        </button>
        {lead && !shut && <p className="nboxlead">{lead}</p>}
      </div>
      {/*
        * Rendered by the same reader as the visit screen, because it
        * is the same document: bold headings, bold service labels,
        * points indented under the sentence that leads into them.
        * Paragraphs here and a note there meant the physician signed
        * one thing and read back another.
        */}
      {!shut && (children ?? <NoteText text={text ?? ''} />)}
    </section>
  );
}

/**
 * Sending one note out.
 *
 * Nothing here sends a fax. It produces the page that gets faxed,
 * which in a browser means printing to PDF, and it says so rather
 * than implying a transmission that did not happen.
 *
 * The recipient is typed rather than picked from a list, because a
 * fax goes to a machine and the number on the cover is the only
 * thing that decides where it lands. The specialists we already hold
 * are offered as a starting point, and the number is still typed:
 * the chart does not carry fax numbers and inventing one is how a
 * note reaches a stranger.
 *
 * Sending is logged before the print dialog opens. A note leaving
 * this practice is a disclosure, and the log is the part an audit
 * actually asks for.
 */
function FaxNote({ patientId, encounterId, onClose }: {
  patientId: string; encounterId: string; onClose: () => void;
}) {
  const st = useStore();
  const me = useActor();
  const p = st.patient(patientId);
  const e = st.encounter(encounterId);
  const specialists = st.specialistsFor(patientId);

  const [to, setTo] = useState('');
  const [toPractice, setPractice] = useState('');
  const [faxNumber, setFax] = useState('');
  const [reason, setReason] = useState('');
  const [sheet, setSheet] = useState<string | null>(null);

  if (!p || !e) return null;

  const make = () => {
    const built = buildFaxNote({
      patient: p, encounter: e, to, toPractice, faxNumber, reason,
      from: me.name, today: st.now,
      // What had resulted by the visit date. A note is a record of
      // one day, and a lab that arrived the week after was not in
      // front of anybody when it was written.
      panels: st.panelsFor(patientId).filter((pl) => pl.date <= e.date),
    });
    record(me, st.now, {
      action: 'create', resource: 'DocumentReference', resourceId: `fax-${e.id}-${st.now}`,
      patientId,
      summary: `Produced the ${fmtDate(e.date)} visit note for sending to ${
        to || 'a recipient not named'}${faxNumber ? ` at ${faxNumber}` : ''}`,
    });
    setSheet(built.html);
    setTimeout(() => window.print(), 160);
  };

  return (
    <div className="faxform">
      <div className="row flow" style={{ justifyContent: 'space-between' }}>
        <h3 style={{ margin: 0 }}>Send this note</h3>
        <button className="btn quiet" onClick={onClose}>Cancel</button>
      </div>
      <p className="small muted" style={{ maxWidth: '58ch' }}>
        This makes a cover sheet and the note as one PDF, ready to fax.
        It does not send anything.
      </p>

      {specialists.length > 0 && (
        <div className="row flow" style={{ gap: 6, marginBottom: 10 }}>
          {specialists.map((sp) => (
            <button key={sp.id} className="btn ghost small"
              onClick={() => { setTo(sp.name); setPractice(sp.practice ?? sp.specialty); }}>
              {sp.name}
            </button>
          ))}
        </div>
      )}

      <label className="fld">
        <span>To</span>
        <input className="search" value={to} onChange={(ev) => setTo(ev.target.value)}
          placeholder="Who it is going to" />
      </label>
      <label className="fld">
        <span>Their practice</span>
        <input className="search" value={toPractice}
          onChange={(ev) => setPractice(ev.target.value)} placeholder="Optional" />
      </label>
      <label className="fld">
        <span>Fax number</span>
        <input className="search" value={faxNumber} onChange={(ev) => setFax(ev.target.value)}
          placeholder="Printed on the cover so you can check it" />
      </label>
      <label className="fld">
        <span>Why</span>
        <input className="search" value={reason} onChange={(ev) => setReason(ev.target.value)}
          placeholder="One line, optional" />
      </label>

      <div className="row flow" style={{ gap: 8, marginTop: 12 }}>
        <button className="btn" onClick={make}>Print or save as PDF</button>
      </div>
      <p className="small muted" style={{ marginTop: 10, maxWidth: '58ch' }}>
        The patient's name and date of birth print on every page. Pages get
        separated at the other end. Leave headers and footers on in the print
        dialog and it will number the pages for you.
      </p>

      {/*
        * Put at the top of the body rather than left inside the
        * drawer. A printed document has to be in normal flow to
        * paginate: positioned out of flow, Chrome renders it as one
        * page and clips whatever did not fit, which for a note is
        * most of the plan.
        */}
      {sheet && createPortal(
        <div className="faxout" dangerouslySetInnerHTML={{ __html: sheet }} />,
        document.body,
      )}
    </div>
  );
}
