/**
 * Everything that has happened to this record.
 *
 * Provenance chips already say who wrote each line. This is the other
 * half: the order it happened in, what changed, and who was signed in
 * at the time. The field-level detail is behind a toggle because the
 * sentence is what you read and the diff is what you check.
 *
 * Reads by anyone other than the responsible physician are in here
 * too, and marked, because the question an access audit answers is
 * almost never "who edited it".
 */
import { useEffect, useState } from 'react';
import { Chip, Panel, Empty } from '../../components/ui';
import { eventsFor, subscribe, type AuditEvent } from '../../lib/audit';
import { ROLE_LABEL } from '../../lib/session';
import { fmtDate } from '../../lib/format';

const when = (ms: number): string =>
  new Date(ms).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });

export function HistoryTab({ patientId }: { patientId: string }) {
  const [events, setEvents] = useState<AuditEvent[]>(() => eventsFor(patientId));
  const [showAll, setShowAll] = useState(false);
  useEffect(() => subscribe(() => setEvents(eventsFor(patientId))), [patientId]);
  useEffect(() => { setEvents(eventsFor(patientId)); }, [patientId]);

  const reads = events.filter((e) => e.action === 'read');
  const shown = showAll ? events : events.slice(0, 60);

  return (
    <div className="stack">
      {reads.length > 0 && (
        <Panel title="Opened by someone else" right={<Chip tone="warn">{reads.length}</Chip>}>
          <div className="stack-sm">
            {reads.slice(0, 6).map((e) => (
              <div key={e.id} className="small">
                <b>{e.actorName}</b> ({ROLE_LABEL[e.role].toLowerCase()}) on {when(e.at)}
                {e.reason && <> &middot; {e.reason}</>}
              </div>
            ))}
          </div>
          <p className="small muted" style={{ marginTop: 9 }}>
            Opening a chart is recorded for everyone except the physician
            responsible for the panel. Logging their own chart views would
            bury the only entry that means anything.
          </p>
        </Panel>
      )}

      <Panel title="History" flush right={<span className="small muted">{events.length} {events.length === 1 ? 'entry' : 'entries'}</span>}>
        {events.length === 0 ? (
          <Empty>Nothing recorded yet. The log starts the first time this record changes.</Empty>
        ) : (
          <table className="rows">
            <tbody>
              {shown.map((e) => <EventRow key={e.id} e={e} />)}
            </tbody>
          </table>
        )}
        {!showAll && events.length > 60 && (
          <div style={{ padding: '11px 16px' }}>
            <button className="btn ghost sm" onClick={() => setShowAll(true)}>
              Show all {events.length}
            </button>
          </div>
        )}
      </Panel>
    </div>
  );
}

function EventRow({ e }: { e: AuditEvent }) {
  const [open, setOpen] = useState(false);
  return (
    <tr>
      <td style={{ width: 150 }} className="small muted">
        {when(e.at)}
        <div style={{ marginTop: 2 }}>clinic {fmtDate(e.clinicDate)}</div>
      </td>
      <td>
        <div style={{ fontWeight: 600, fontSize: 13.5 }}>{e.summary}</div>
        <div className="small muted" style={{ marginTop: 2 }}>
          {e.actorName} &middot; {ROLE_LABEL[e.role]}
          {e.action !== 'read' && e.action !== 'sign-in' && <> &middot; {e.resource}</>}
          {e.reason && <> &middot; {e.reason}</>}
        </div>
        {open && e.detail && <pre className="auditdetail">{e.detail.split('; ').join('\n')}</pre>}
      </td>
      <td style={{ width: 120, textAlign: 'right' }}>
        {e.role !== 'physician' && <Chip tone="warn">{ROLE_LABEL[e.role]}</Chip>}
        {e.detail && (
          <button className="btn quiet sm" style={{ marginLeft: 6 }} onClick={() => setOpen((v) => !v)}>
            {open ? 'Hide' : 'What changed'}
          </button>
        )}
      </td>
    </tr>
  );
}
