/**
 * Encounters: everything that happened, openable.
 *
 * This is the drawer behind the summary. The subjective says what we
 * know; this says how we know it, in the words it was written in, on
 * the date it was written. Opening a row shows the original record
 * rather than a rendering of it, because the reason to open a row is
 * that the summary said something you want to check.
 *
 * It also carries the two buttons that make the prototype testable:
 * add a visit note or a patient update and watch the summary change.
 * In the real thing those arrive from the portal and from a signed
 * note; here they are simulated, and the simulation is honest about
 * being one.
 */
import { useState } from 'react';
import { useStore } from '../../lib/store';
import { useNav } from '../../lib/nav';
import { Chip, Empty } from '../../components/ui';
import { fmtDate, relative } from '../../lib/format';
import { timeline, TIMELINE_LABEL } from '../../lib/timeline';
import type { TimelineItem } from '../../lib/timeline';
import { hhmm } from '../../domain/schedule';
import { Booking } from '../../components/Booking';
import { FEELING_LABEL, ON_PLAN_LABEL } from '../../domain/types';

const tone = (k: TimelineItem['kind']) =>
  (k === 'visit' ? 'ok' : k === 'update' ? 'accent' : k === 'booked' ? 'warn' : undefined);

export function useTimeline(patientId: string) {
  const st = useStore();
  const p = st.patient(patientId);
  return timeline({
    patientId,
    encounters: st.encountersFor(patientId),
    updates: st.updatesFor(patientId),
    checkIns: st.checkInsFor(patientId),
    messages: st.messagesFor(patientId),
    requests: st.requestsFor(patientId),
    specialists: st.specialistsFor(patientId),
    panels: st.panelsFor(patientId),
    patientName: p?.preferredName ?? p?.name ?? 'The patient',
  });
}

/** The body of one record, in its own shape. */
function Record({ patientId, item }: { patientId: string; item: TimelineItem }) {
  const st = useStore();
  const nav = useNav();

  if (item.kind === 'visit' || item.kind === 'booked') {
    const e = st.encounter(item.id);
    if (!e) return null;
    const n = e.note;
    return (
      <div className="recbody">
        <div className="recmeta">
          {fmtDate(e.date)}{e.start !== undefined && ` at ${hhmm(e.start)}`}
          {e.duration && ` · ${e.duration} min`}
          {e.signedAt && ` · signed ${fmtDate(e.signedAt)}`}
        </div>
        {n ? (
          <>
            {n.subjective.additional && <p><b>S.</b> {n.subjective.additional}</p>}
            {n.objective.vitals && <p><b>O.</b> {n.objective.vitals} {n.objective.exam}</p>}
            {n.assessment.overall && <p><b>A.</b> {n.assessment.overall}</p>}
            {n.plan.overall && <p><b>P.</b> {n.plan.overall}</p>}
          </>
        ) : <p className="muted">Not held yet, so there is no note.</p>}
        <button className="linkish"
          onClick={() => nav.go({ name: 'encounter', encounterId: e.id })}>
          Open the visit
        </button>
      </div>
    );
  }

  if (item.kind === 'update') {
    const u = st.updatesFor(patientId).find((x) => x.id === item.id);
    const req = st.requestsFor(patientId).find((r) => r.id === u?.requestId);
    const answers = st.checkInsFor(patientId).filter((c) => c.updateId === item.id);
    const conditions = st.conditionsFor(patientId);
    const lifestyle = st.lifestyleFor(patientId);
    const prevention = st.preventionFor(patientId);
    const nameFor = (a: typeof answers[number]) => {
      const about = a.about;
      if (about.kind === 'condition') {
        return conditions.find((c) => c.id === about.id)?.name ?? 'A problem';
      }
      if (about.kind === 'lifestyle') {
        return lifestyle.find((l) => l.id === about.id)?.prescription.split('.')[0] ?? 'A prescription';
      }
      if (about.kind === 'prevention') {
        return prevention.find((x) => x.id === about.id)?.name ?? 'A service';
      }
      return 'Their health overall';
    };
    return (
      <div className="recbody">
        <div className="recmeta">{fmtDate(item.date)}</div>
        {req && (
          <p className="recask">
            <b>We asked, {fmtDate(req.sent)}:</b> {req.prompt}
          </p>
        )}
        {u?.overall && <p className="said">{u.overall}</p>}
        {u?.attachments?.map((a) => <p key={a} className="muted">Attached: {a}</p>)}
        {answers.length === 0 ? <p className="muted">No per problem answers.</p> : (
          <ul className="anslist">
            {answers.map((a) => (
              <li key={a.id}>
                <span className="ansfor">{nameFor(a)}</span>
                <Chip tone={a.feeling === 'worse' ? 'crit' : a.feeling === 'better' ? 'ok' : undefined}>
                  {FEELING_LABEL[a.feeling]}
                </Chip>
                {a.onPlan && <Chip tone={a.onPlan === 'no' ? 'crit' : a.onPlan === 'partly' ? 'warn' : 'ok'}>
                  {ON_PLAN_LABEL[a.onPlan]}
                </Chip>}
                <span className="anstext">{a.text}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  if (item.kind === 'message') {
    const m = st.messagesFor(patientId).find((x) => x.id === item.id);
    if (!m) return null;
    const replies = st.messagesFor(patientId).filter((x) => x.replyTo === m.id);
    return (
      <div className="recbody">
        <div className="recmeta">{m.author} · {fmtDate(m.date)}</div>
        <p className={m.from === 'patient' ? 'said' : ''}>{m.body}</p>
        {replies.map((r) => (
          <div key={r.id} className="reply">
            <div className="recmeta">{r.author} · {fmtDate(r.date)}</div>
            <p className={r.from === 'patient' ? 'said' : ''}>{r.body}</p>
          </div>
        ))}
      </div>
    );
  }

  if (item.kind === 'specialist') {
    const s = st.specialistsFor(patientId).find((x) => x.id === item.id);
    if (!s) return null;
    return (
      <div className="recbody">
        <div className="recmeta">{s.name}, {s.specialty}{s.practice && ` · ${s.practice}`}</div>
        {s.findings && <p><b>Found.</b> {s.findings}</p>}
        {s.recommendations && <p><b>Advised.</b> {s.recommendations}</p>}
        {s.outstanding && s.outstanding !== 'None.' && (
          <p className="pconflict">Outstanding: {s.outstanding}</p>
        )}
      </div>
    );
  }

  const panels = st.panelsFor(patientId).filter((p) => `labs-${p.date}` === item.id);
  return (
    <div className="recbody">
      <div className="recmeta">{fmtDate(item.date)}{panels[0]?.from && ` · ${panels[0].from}`}</div>
      {panels.map((p) => (
        <p key={p.id}>
          <b>{p.name}.</b>{' '}
          {p.values.map((v) => `${v.key} ${v.value}${v.unit ? ` ${v.unit}` : ''}`).join(', ')}
        </p>
      ))}
    </div>
  );
}

export function EncountersDrawer({ patientId, focus, onDone }: {
  patientId: string;
  /** A record id to open on, when arriving from a source link. */
  focus?: string;
  onDone: () => void;
}) {
  const st = useStore();
  const nav = useNav();
  const items = useTimeline(patientId);
  const [open, setOpen] = useState<string | null>(focus ?? items[0]?.id ?? null);
  const [filter, setFilter] = useState<string>('all');
  const [booking, setBooking] = useState(false);

  const kinds = ['all', ...new Set(items.map((i) => i.kind))];
  const shown = filter === 'all' ? items : items.filter((i) => i.kind === filter);

  return (
    <div className="stack">
      {/* Booking belongs with the encounters, not in the header. */}
      {booking ? (
        <Booking patientId={patientId}
          onCancel={() => setBooking(false)}
          onBooked={(id, sameDay) => {
            setBooking(false);
            onDone();
            if (sameDay) nav.go({ name: 'encounter', encounterId: id });
          }} />
      ) : (
        /*
          * Book one for later, or start one now. The two starters
          * used to live in the right column and came out with it;
          * they belong here, beside the encounters they create.
          */
        /*
          * Three ways to make an encounter, on one row, with no
          * explanation. What each one does is in the word on it.
          */
        <div className="row startrow" style={{ gap: 7, flexWrap: 'wrap' }}>
          {([['visit', 'Visit'], ['review', 'Care plan review']] as const).map(([kind, label]) => (
            <button key={kind} className="btn ghost startenc" onClick={() => {
              const id = st.openEncounter(patientId, kind);
              nav.go({ name: 'encounter', encounterId: id });
            }}>{label}</button>
          ))}
          <button className="btn ghost" onClick={() => setBooking(true)}>Book for later</button>
        </div>
      )}

      <div className="row flow" style={{ gap: 6, flexWrap: 'wrap' }}>
        {kinds.map((k) => (
          <button key={k} className={`btn sm ${filter === k ? '' : 'ghost'}`}
            onClick={() => setFilter(k)}>
            {k === 'all' ? `All ${items.length}` : TIMELINE_LABEL[k as TimelineItem['kind']]}
          </button>
        ))}
      </div>

      {shown.length === 0 ? <Empty>Nothing on file.</Empty> : (
        <div className="tl">
          {shown.map((i) => (
            <div key={i.id} className={`tlitem${open === i.id ? ' open' : ''}`}>
              <button className="tlhead" onClick={() => setOpen(open === i.id ? null : i.id)}>
                <span className="tldate">{fmtDate(i.date)}</span>
                <Chip tone={tone(i.kind)}>{TIMELINE_LABEL[i.kind]}</Chip>
                <span className="tltitle">{i.title}</span>
                <span className="tlby">{i.by}</span>
                <span className="tlwhen">{relative(i.date)}</span>
              </button>
              {open === i.id
                ? <Record patientId={patientId} item={i} />
                : <p className="tlprev">{i.preview}</p>}
            </div>
          ))}
        </div>
      )}

      {/*
        * The reason this prototype can be evaluated at all: add a
        * record and watch the summary move. Labelled as simulated,
        * because a demo button that pretends to be a real workflow is
        * how a prototype gets mistaken for a product.
        */}
      {/*
        * Kept, and made quiet. It is the only way to watch a record
        * arrive and the care plan not move, which is the whole claim
        * of the design, and it is still not a real workflow.
        */}
      <div className="simbox">
        <h4>Simulate a record arriving</h4>
        <div className="row" style={{ gap: 7, flexWrap: 'wrap' }}>
          <button className="btn sm ghost" onClick={() => st.simulateUpdate(patientId)}>
            A health update from the patient
          </button>
          <button className="btn sm ghost" onClick={() => st.simulateMessage(patientId)}>
            A message about a side effect
          </button>
          <button className="btn sm ghost" onClick={() => st.simulateVisit(patientId)}>
            A signed visit note
          </button>
        </div>
      </div>
    </div>
  );
}
