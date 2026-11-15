/**
 * Everything to do with visits, behind the rail's first section.
 *
 * The rail itself lives in Rail.tsx. This is what opens when you ask
 * it for the records.
 */
import { useState } from 'react';
import { useStore } from '../../lib/store';
import { useNav } from '../../lib/nav';
import { Booking } from '../../components/Booking';
import { fmtDate } from '../../lib/format';
import { kindLabel } from '../../lib/clinical';
import { hhmm } from '../../domain/schedule';
import type { Encounter } from '../../domain/types';

/**
 * Everything to do with visits, in one place: read a past note, open
 * one that is booked, or make a new one. The header no longer carries
 * a Start Visit button because this is where that act belongs.
 */
export function VisitsDrawer({ patientId, onDone }: { patientId: string; onDone: () => void }) {
  const st = useStore();
  const nav = useNav();
  const [booking, setBooking] = useState(false);
  const [read, setRead] = useState<Encounter | null>(null);

  const all = st.encountersFor(patientId);
  const ahead = all.filter((e) => e.status !== 'signed').sort((a, b) => a.date.localeCompare(b.date));
  const past = all.filter((e) => e.status === 'signed');

  return (
    <div className="stack">
      {booking ? (
        <Booking patientId={patientId}
          onCancel={() => setBooking(false)}
          onBooked={(id, sameDay) => {
            setBooking(false);
            onDone();
            if (sameDay) nav.go({ name: 'encounter', encounterId: id });
          }} />
      ) : (
        <button className="btn" onClick={() => setBooking(true)}>Book a visit</button>
      )}

      {ahead.length > 0 && (
        <div>
          <div className="soaplabel">Booked</div>
          {ahead.map((e) => (
            <div key={e.id} className="visitrow">
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong>{kindLabel(e.kind)}</strong>
                <div className="small muted">
                  {fmtDate(e.date)}{e.start !== undefined && ` at ${hhmm(e.start)}`} &middot; {e.duration} min
                  &middot; {e.reason}
                </div>
              </div>
              <button className="btn sm" onClick={() => {
                onDone();
                nav.go({ name: 'encounter', encounterId: e.id });
              }}>
                {e.status === 'in-progress' ? 'Resume' : 'Start'}
              </button>
            </div>
          ))}
        </div>
      )}

      <div>
        <div className="soaplabel">Signed</div>
        {past.length === 0 && <p className="small muted">No visits yet.</p>}
        {past.map((e) => (
          <div key={e.id} className="visitrow">
            <div style={{ flex: 1, minWidth: 0 }}>
              <strong>{kindLabel(e.kind)}</strong>
              <div className="small muted">{fmtDate(e.date)} &middot; {e.reason}</div>
            </div>
            <button className="btn ghost sm" onClick={() => setRead(read?.id === e.id ? null : e)}>
              {read?.id === e.id ? 'Hide' : 'Read'}
            </button>
          </div>
        ))}
        {read?.note && (
          <div className="readnote">
            <h4>{kindLabel(read.kind)}, {fmtDate(read.date)}</h4>
            <NoteBlock label="Subjective" text={[
              read.note.subjective.reason, read.note.subjective.additional,
            ].filter(Boolean).join('\n\n')} />
            <NoteBlock label="Objective" text={[
              read.note.objective.vitals, read.note.objective.homeMeasures, read.note.objective.exam,
            ].filter(Boolean).join('\n\n')} />
            <NoteBlock label="Assessment" text={read.note.assessment.overall} />
            <NoteBlock label="Plan" text={[
              ...read.note.plan.problems.map((pr) =>
                `${pr.problem}. ${[pr.assessment, pr.treatment, pr.orders, pr.followUp].filter(Boolean).join(' ')}`),
              read.note.plan.overall,
            ].filter(Boolean).join('\n\n')} />
          </div>
        )}
      </div>
    </div>
  );
}

const NoteBlock = ({ label, text }: { label: string; text: string }) =>
  (text.trim() ? (
    <div className="nb">
      <div className="soaplabel">{label}</div>
      <p>{text}</p>
    </div>
  ) : null);
