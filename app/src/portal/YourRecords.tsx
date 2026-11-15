/**
 * The patient taking their own record.
 *
 * Not requesting it. Not waiting for it. Not being sent a summary
 * somebody else chose. The whole thing, both files, from their own
 * screen, now.
 *
 * This is the shape the information blocking rule pushes towards, and
 * it is also just correct. A record held about somebody that they
 * cannot get hold of is a record held against them. Everything on this
 * screen is written to the house style, because the person reading it
 * is the patient.
 */
import { useState } from 'react';
import { useStore } from '../lib/store';
import { Panel } from '../components/ui';
import { DocView, download } from '../components/DocView';
import { fhirBundle, recordSummary, afterVisit, type Doc } from '../lib/documents';
import { fmtDate } from '../lib/format';
import { kindLabel } from '../lib/clinical';
import { visibleEncounters } from '../lib/portalScope';

export function YourRecords({ patientId }: { patientId: string }) {
  const st = useStore();
  const [doc, setDoc] = useState<Doc | null>(null);

  const p = st.patient(patientId);
  if (!p) return null;

  const meds = st.medsFor(patientId);
  const plan = st.planFor(patientId);
  // Only signed notes, same rule as everywhere else in the portal.
  const visits = visibleEncounters(st.encountersFor(patientId));

  const input = {
    patient: p,
    conditions: st.conditionsFor(patientId),
    medications: meds,
    allergies: st.allergiesFor(patientId),
    series: st.seriesFor(patientId),
    encounters: visits,
    plan: plan?.signed ? plan : undefined,
    today: st.now,
  };

  const both = () => {
    download(recordSummary(input));
    setTimeout(() => download(fhirBundle(input)), 350);
  };

  return (
    <div className="stack">
      {doc && <DocView doc={doc} onClose={() => setDoc(null)} />}

      <Panel title="Get a copy of your record">
        <p style={{ maxWidth: '64ch' }}>
          You can take a copy of your record at any time. You do not need to ask,
          and there is no charge.
        </p>
        <p className="small muted" style={{ marginTop: 8, maxWidth: '64ch' }}>
          You get two files. One is written for you to read. The other is for
          another doctor's computer system, so a new practice can load your
          history instead of starting again.
        </p>
        <div className="row flow" style={{ gap: 8, marginTop: 14 }}>
          <button className="btn" onClick={both}>Download both files</button>
          <button className="btn ghost" onClick={() => setDoc(recordSummary(input))}>
            Read it here first
          </button>
          <button className="btn ghost" onClick={() => setDoc(fhirBundle(input))}>
            See the computer file
          </button>
        </div>
        <p className="small muted" style={{ marginTop: 14, maxWidth: '64ch' }}>
          If something in it is wrong, tell us. We will correct it and write back
          to say what we changed.
        </p>
      </Panel>

      <Panel title="Your visit summaries" flush>
        {visits.length === 0 ? (
          <div style={{ padding: '18px 16px' }} className="small muted">
            Nothing yet. A summary appears here after each visit.
          </div>
        ) : (
          <div className="doclist">
            {visits.map((e) => (
              <div key={e.id} className="listrow" style={{ padding: '11px 16px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong>{kindLabel(e.kind)}</strong>
                  <div className="small muted">{fmtDate(e.date)}</div>
                </div>
                <button className="btn ghost sm"
                  onClick={() => setDoc(afterVisit(p, e, meds, plan?.signed ? plan : undefined))}>
                  Open
                </button>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
