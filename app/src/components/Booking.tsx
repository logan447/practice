/**
 * Booking something into a real day.
 *
 * The question this answers is not "what time would you like". It is
 * "does this fit", and the honest answer is often no: it is a
 * Saturday, it is an away block, or the day already has an initial
 * visit and a home visit in it and a ninety minute slot does not
 * exist. Each of those gets said in words rather than by showing an
 * empty list.
 *
 * The home visit is the one that teaches the lesson. Two and a half
 * hours including travel, from a day with about seven hours of
 * clinical time in it, is a third of the day for one patient.
 */
import { useState } from 'react';
import { useStore } from '../lib/store';
import { Chip } from './ui';
import { fmtDate } from '../lib/format';
import { ENCOUNTER_KINDS, type EncounterKind } from '../domain/types';
import {
  dayStatus, slots, dayLoad, hhmm, nextOpen, WORKING_YEAR, type Booked,
} from '../domain/schedule';
import { addDays } from '../lib/clock';

export const toBooked = (
  es: { id: string; start?: number; duration?: number; kind: string; patientId: string }[],
  name: (id: string) => string,
): Booked[] => es.map((e) => ({
  id: e.id,
  start: e.start ?? WORKING_YEAR.dayStart,
  minutes: e.duration ?? 30,
  kind: e.kind,
  patientId: e.patientId,
  label: name(e.patientId),
}));

export function Booking({ patientId, onBooked, onCancel }: {
  patientId: string;
  onBooked: (encounterId: string, sameDay: boolean) => void;
  onCancel: () => void;
}) {
  const st = useStore();
  const [kind, setKind] = useState<EncounterKind>('follow-up');
  const [day, setDay] = useState(st.now);

  const spec = ENCOUNTER_KINDS.find((k) => k.id === kind)!;
  const nameOf = (id: string) => st.patient(id)?.name ?? 'Someone';
  const bookedOn = (iso: string) => toBooked(st.bookedOn(iso), nameOf);

  const verdict = dayStatus(day);
  const open = slots(day, spec.mins, bookedOn(day));
  const load = dayLoad(day, bookedOn(day));
  // Offered whenever this day cannot take the visit, for any reason.
  // A screen that says "not a clinic day" and stops has told you the
  // problem and left you to find the answer by clicking forward.
  const next = open.length === 0
    ? nextOpen(day, spec.mins, bookedOn)
    : undefined;

  const book = (start: number) => {
    const id = st.startVisit(patientId, kind, spec.label, spec.mins, { date: day, start });
    onBooked(id, day === st.now);
  };

  return (
    <div className="booking">
      <div className="row flow" style={{ gap: 7 }}>
        <span className="eyebrow" style={{ alignSelf: 'center' }}>Visit type</span>
        {ENCOUNTER_KINDS.map((k) => (
          <button key={k.id} className={`btn sm ${kind === k.id ? '' : 'ghost'}`}
            onClick={() => setKind(k.id)}>
            {k.label} <span className="mins">{k.mins}m</span>
          </button>
        ))}
      </div>

      <div className="row flow" style={{ gap: 7, marginTop: 11 }}>
        <span className="eyebrow" style={{ alignSelf: 'center' }}>Day</span>
        <button className="btn quiet sm" onClick={() => setDay(addDays(day, -1))}>&larr;</button>
        <strong style={{ fontSize: 13.5, minWidth: 128, textAlign: 'center' }}>{fmtDate(day)}</strong>
        <button className="btn quiet sm" onClick={() => setDay(addDays(day, 1))}>&rarr;</button>
        {day !== st.now && (
          <button className="btn quiet sm" onClick={() => setDay(st.now)}>Today</button>
        )}
        {verdict.status === 'clinic' && (
          <span className="small muted">
            {load.booked.length} booked, {Math.round(load.openMinutes / 6) / 10} h open
          </span>
        )}
      </div>

      {verdict.status !== 'clinic' ? (
        <>
          <p className="bookwhy">{verdict.why}</p>
          {next && (
            <button className="btn sm" style={{ marginTop: 9 }} onClick={() => setDay(next.iso)}>
              Next day it fits: {fmtDate(next.iso)} at {hhmm(next.start)}
            </button>
          )}
        </>
      ) : open.length === 0 ? (
        <>
          <p className="bookwhy">
            Nothing {spec.mins} minutes long fits. The day holds{' '}
            {load.booked.map((b) => `${b.label} at ${hhmm(b.start)} for ${b.minutes}m`).join(', ')}.
          </p>
          {next && (
            <button className="btn sm" style={{ marginTop: 9 }}
              onClick={() => { setDay(next.iso); }}>
              Next day it fits: {fmtDate(next.iso)} at {hhmm(next.start)}
            </button>
          )}
        </>
      ) : (
        <>
          <div className="eyebrow" style={{ margin: '12px 0 6px' }}>
            {open.length} start{open.length > 1 ? 's' : ''} available
          </div>
          <div className="slots row flow" style={{ gap: 6 }}>
            {open.map((t) => (
              <button key={t} className="btn ghost sm" onClick={() => book(t)}>{hhmm(t)}</button>
            ))}
          </div>
        </>
      )}

      {load.booked.length > 0 && verdict.status === 'clinic' && (
        <div className="daystrip">
          {load.booked.map((b) => (
            <div key={b.id} className="dsitem">
              <span className="num">{hhmm(b.start)}</span>
              <span>{b.label}</span>
              <Chip>{b.minutes}m</Chip>
            </div>
          ))}
        </div>
      )}

      <div className="row" style={{ marginTop: 12 }}>
        <button className="btn ghost sm" onClick={onCancel}>Cancel</button>
        <span className="spacer" />
        <span className="small muted">
          Monday to Friday, {hhmm(WORKING_YEAR.dayStart)} to {hhmm(WORKING_YEAR.dayEnd)}.
        </span>
      </div>
    </div>
  );
}
