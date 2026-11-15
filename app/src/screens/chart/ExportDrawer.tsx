/**
 * The packet.
 *
 * Cover summary in SOAP order, then every signed note, then the
 * specialist letters, then the labs as they were resulted, then
 * imaging, then everything that arrived as a file. One document,
 * dated, that another clinician can read without asking us for
 * anything.
 *
 * Print produces a real PDF through the browser. The machine-readable
 * companion is the FHIR bundle, offered beside it, because a
 * receiving practice wants both: one to read, one to load.
 */
import { useMemo, useState } from 'react';
import { useStore } from '../../lib/store';
import { Panel, Chip } from '../../components/ui';
import { buildPacket } from '../../lib/packet';
import { fhirBundle } from '../../lib/documents';
import { download } from '../../components/DocView';
import { fmtDate } from '../../lib/format';
import { record } from '../../lib/audit';
import { useActor } from '../../lib/session';

export function ExportDrawer({ patientId }: { patientId: string }) {
  const st = useStore();
  const me = useActor();
  const [preview, setPreview] = useState(false);

  const p = st.patient(patientId);
  const input = useMemo(() => (p ? {
    patient: p,
    master: st.masterPlanFor(patientId),
    conditions: st.conditionsFor(patientId),
    medications: st.medsFor(patientId),
    allergies: st.allergiesFor(patientId),
    encounters: st.encountersFor(patientId),
    exams: st.examsFor(patientId),
    vitals: st.vitalsFor(patientId),
    panels: st.panelsFor(patientId),
    studies: st.studiesFor(patientId),
    specialists: st.specialistsFor(patientId),
    prevention: st.preventionFor(patientId),
    documents: st.documentsFor(patientId),
    plan: st.planFor(patientId),
    today: st.now,
  } : null), [p, st, patientId]);

  if (!p || !input) return null;
  const packet = buildPacket(input);

  /** Records that the packet left this practice, which is the part audits ask for. */
  const logShared = (how: string) => {
    record(me, st.now, {
      action: 'create', resource: 'DocumentReference', resourceId: `packet-${st.now}`,
      patientId, summary: `Produced the complete record packet (${how})`,
    });
  };

  const doPrint = () => {
    logShared('printed');
    setPreview(true);
    setTimeout(() => window.print(), 120);
  };

  return (
    <div className="stack">
      <Panel title="Complete record packet">
        <p style={{ maxWidth: '64ch' }}>
          Everything this practice holds about {p.preferredName ?? p.name.split(' ')[0]},
          in one document, dated {fmtDate(st.now)}.
        </p>
        <ol className="packetlist">
          {packet.sections.map((s, i) => (
            <li key={s.id}>
              <span className="pnum">{i + 1}</span>
              <span>{s.title}</span>
              {s.count !== undefined && <Chip>{s.count}</Chip>}
            </li>
          ))}
        </ol>
        <div className="row flow" style={{ gap: 8, marginTop: 14 }}>
          <button className="btn" onClick={doPrint}>Print or save as PDF</button>
          <button className="btn ghost" onClick={() => setPreview((v) => !v)}>
            {preview ? 'Hide the packet' : 'Read it here'}
          </button>
          <button className="btn ghost" onClick={() => {
            logShared('FHIR bundle downloaded');
            download(fhirBundle({
              patient: p,
              conditions: input.conditions,
              medications: input.medications,
              allergies: input.allergies,
              series: st.seriesFor(patientId),
              encounters: input.encounters,
              plan: input.plan,
              today: st.now,
            }));
          }}>
            FHIR bundle
          </button>
        </div>
        <p className="small muted" style={{ marginTop: 12, maxWidth: '64ch' }}>
          The summary at the front describes where this patient is now. The notes
          behind it are what was signed on each date. If the two ever disagree, the
          notes are the record.
        </p>
      </Panel>

      {preview && (
        <div className="packet" dangerouslySetInnerHTML={{ __html: packet.html }} />
      )}
    </div>
  );
}
