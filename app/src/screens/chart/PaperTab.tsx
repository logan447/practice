/**
 * The documents this chart can produce.
 *
 * Each one is generated from the record rather than typed, so it
 * cannot disagree with the chart. The three that need a decision ask
 * for it inline: who the referral is to, what the work note is
 * covering, what the plan is being asked to authorise.
 *
 * The export at the bottom is where information blocking stops being
 * theoretical. The rule is 45 CFR Part 171, and the practical design
 * answer is that the patient takes their record themselves, from
 * their own screen, without asking anyone.
 */
import { useState } from 'react';
import { useStore } from '../../lib/store';
import { Chip, Panel, Empty } from '../../components/ui';
import { DocView } from '../../components/DocView';
import { Field } from '../../components/InlineAdd';
import { fmtDate } from '../../lib/format';
import { kindLabel } from '../../lib/clinical';
import {
  afterVisit, referral, workNote, priorAuth, fhirBundle, recordSummary, type Doc,
} from '../../lib/documents';

type Which = null | 'referral' | 'work' | 'auth';

export function PaperTab({ patientId }: { patientId: string }) {
  const st = useStore();
  const [doc, setDoc] = useState<Doc | null>(null);
  const [open, setOpen] = useState<Which>(null);

  const p = st.patient(patientId);
  const conditions = st.conditionsFor(patientId);
  const meds = st.medsFor(patientId);
  const allergies = st.allergiesFor(patientId);
  const series = st.seriesFor(patientId);
  const encounters = st.encountersFor(patientId);
  const specialists = st.specialistsFor(patientId);
  const plan = st.planFor(patientId);
  const signed = encounters.filter((e) => e.status === 'signed');

  const [ref, setRef] = useState({ to: '', reason: '' });
  const [work, setWork] = useState({
    from: st.now, to: st.now, restriction: '', diagnosis: false,
  });
  const [auth, setAuth] = useState({ item: '', indication: '', tried: '', rationale: '' });

  if (!p) return null;

  const exportInput = {
    patient: p, conditions, medications: meds, allergies, series,
    encounters, plan, today: st.now,
  };

  return (
    <div className="stack">
      {doc && <DocView doc={doc} onClose={() => setDoc(null)} />}

      {/* -------------------------------------------- visit summaries */}
      <Panel title="Visit summaries" eyebrow="For the patient" flush>
        {signed.length === 0 ? (
          <Empty>No signed visits yet. A summary comes from a signed note.</Empty>
        ) : (
          <div className="doclist">
            {signed.slice(0, 8).map((e) => (
              <div key={e.id} className="listrow" style={{ padding: '11px 16px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong>{kindLabel(e.kind)}</strong>
                  <div className="small muted">{fmtDate(e.date)} &middot; {e.reason}</div>
                </div>
                <button className="btn ghost sm"
                  onClick={() => setDoc(afterVisit(p, e, meds, plan))}>
                  Summary
                </button>
              </div>
            ))}
          </div>
        )}
      </Panel>

      {/* ------------------------------------------------- referral */}
      <Panel title="Referral letter" eyebrow="For another clinician" right={
        <button className="btn ghost sm" onClick={() => setOpen(open === 'referral' ? null : 'referral')}>
          {open === 'referral' ? 'Close' : 'Write one'}
        </button>
      }>
        {open === 'referral' ? (
          <div className="stack-sm">
            <label style={{ display: 'block' }}>
              <div className="eyebrow" style={{ marginBottom: 5 }}>To</div>
              <select className="search" value={ref.to} onChange={(e) => setRef((x) => ({ ...x, to: e.target.value }))}>
                <option value="">Unnamed receiving clinician</option>
                {specialists.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}, {s.specialty}</option>
                ))}
              </select>
            </label>
            <Field label="Reason for referral" textarea value={ref.reason}
              onChange={(v) => setRef((x) => ({ ...x, reason: v }))}
              placeholder="Persistent right knee pain, mechanical in character, not settling with six weeks of load management." />
            <button className="btn sm" disabled={!ref.reason.trim()}
              onClick={() => setDoc(referral(
                p, specialists.find((s) => s.id === ref.to), ref.reason.trim(),
                conditions, meds, allergies, series, st.now,
              ))}>
              Produce the letter
            </button>
          </div>
        ) : (
          <p className="small muted">
            Carries the problem list, the medication with RxNorm identifiers, the
            allergies and the recent results, so the receiving clinician does not
            have to ask for them.
          </p>
        )}
      </Panel>

      {/* ------------------------------------------------ work note */}
      <Panel title="Work or school note" eyebrow="For an employer" right={
        <button className="btn ghost sm" onClick={() => setOpen(open === 'work' ? null : 'work')}>
          {open === 'work' ? 'Close' : 'Write one'}
        </button>
      }>
        {open === 'work' ? (
          <div className="stack-sm">
            <div className="grid g2">
              <Field label="From" type="date" value={work.from}
                onChange={(v) => setWork((x) => ({ ...x, from: v }))} />
              <Field label="To" type="date" value={work.to}
                onChange={(v) => setWork((x) => ({ ...x, to: v }))} />
            </div>
            <Field label="Restriction, if any" value={work.restriction}
              onChange={(v) => setWork((x) => ({ ...x, restriction: v }))}
              placeholder="No lifting over 10 pounds for two weeks." />
            <label className="row" style={{ gap: 8, alignItems: 'center' }}>
              <input type="checkbox" checked={work.diagnosis}
                onChange={(e) => setWork((x) => ({ ...x, diagnosis: e.target.checked }))} />
              <span className="small">Include the diagnosis</span>
              {work.diagnosis && <Chip tone="warn">More than they need</Chip>}
            </label>
            <p className="small muted" style={{ margin: 0 }}>
              Off by default. An employer needs to know the person was seen and what
              they can do. Whether to say why is the patient's decision, not a
              template's.
            </p>
            <button className="btn sm" onClick={() => setDoc(workNote(p, st.now, {
              ...work,
              includeDiagnosis: work.diagnosis,
              diagnosis: conditions.find((c) => c.status === 'active')?.name,
            }))}>
              Produce the note
            </button>
          </div>
        ) : (
          <p className="small muted">
            Says the least that does the job. No diagnosis unless it is turned on.
          </p>
        )}
      </Panel>

      {/* ------------------------------------------------ prior auth */}
      <Panel title="Prior authorization request" eyebrow="For a health plan" right={
        <button className="btn ghost sm" onClick={() => setOpen(open === 'auth' ? null : 'auth')}>
          {open === 'auth' ? 'Close' : 'Write one'}
        </button>
      }>
        {open === 'auth' ? (
          <div className="stack-sm">
            <Field label="What is being requested" value={auth.item}
              onChange={(v) => setAuth((x) => ({ ...x, item: v }))}
              placeholder="Semaglutide 0.25 mg weekly" />
            <Field label="Indication" value={auth.indication}
              onChange={(v) => setAuth((x) => ({ ...x, indication: v }))} />
            <Field label="What has been tried" textarea value={auth.tried}
              onChange={(v) => setAuth((x) => ({ ...x, tried: v }))} />
            <Field label="Clinical rationale" textarea value={auth.rationale}
              onChange={(v) => setAuth((x) => ({ ...x, rationale: v }))} />
            <button className="btn sm" disabled={!auth.item.trim() || !auth.rationale.trim()}
              onClick={() => setDoc(priorAuth(p, st.now, auth, conditions))}>
              Produce the request
            </button>
          </div>
        ) : (
          <p className="small muted">
            Argues the clinical case and nothing else. It says nothing about how the
            membership works with any coverage, because that is not settled.{' '}
            <b>NEEDS-COUNSEL</b>.
          </p>
        )}
      </Panel>

      {/* ------------------------------------------------- the export */}
      <Panel title="The whole record" eyebrow="For the patient, or for another system">
        <div className="row flow" style={{ gap: 8 }}>
          <button className="btn" onClick={() => setDoc(recordSummary(exportInput))}>
            Readable copy
          </button>
          <button className="btn ghost" onClick={() => setDoc(fhirBundle(exportInput))}>
            FHIR R4 bundle
          </button>
        </div>
        <InfoBlocking />
      </Panel>
    </div>
  );
}

/**
 * Said once, in full, where the export is.
 *
 * The facts here are checkable and dated. The part that is not settled
 * is tagged rather than asserted, because a direct-pay practice that
 * is not Medicare-enrolled sits in a different place in this rule than
 * most of the guidance assumes.
 */
export function InfoBlocking() {
  const [open, setOpen] = useState(false);
  return (
    <div className="infoblock">
      <button className="btn quiet sm" onClick={() => setOpen((v) => !v)}>
        {open ? 'Hide' : 'Why this button exists'}
      </button>
      {open && (
        <div style={{ marginTop: 10 }}>
          <p className="small">
            Information blocking is 45 CFR Part 171. It prohibits practices likely to
            interfere with the access, exchange or use of electronic health
            information, with a set of named exceptions. Disincentives for health care
            providers were established by a final rule published 1 July 2024
            (89 FR 54718) and run through Medicare programs.
          </p>
          <p className="small" style={{ marginTop: 8 }}>
            That last part matters here and is <b>NEEDS-COUNSEL</b>: a direct-pay
            practice that is not Medicare-enrolled sits differently from the practices
            most guidance is written for. Not being reachable by a disincentive is not
            the same as being outside the prohibition, and the two get conflated.
          </p>
          <p className="small" style={{ marginTop: 8 }}>
            Separately, the HIPAA right of access (45 CFR 164.524) gives a patient
            their record, with an outer limit measured in days and a limit on fees.
          </p>
          <p className="small" style={{ marginTop: 8 }}>
            The design answer is to make the question not arise. The export is one
            button, it is also in the patient's own portal, it is the whole record
            rather than a summary chosen by us, and there is no request, no delay and
            no fee. A record built this way cannot block, because there is nothing in
            the path to block with.
          </p>
        </div>
      )}
    </div>
  );
}
