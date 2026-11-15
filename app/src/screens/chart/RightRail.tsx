/**
 * The narrow column: what is coming, and what is outstanding.
 *
 * Two things only. The next visit, because that is the frame every
 * decision on the left is made against, and the orders nobody has
 * closed, because those are the things that fall through.
 *
 * Starting a visit lives here rather than in the header. Booking is a
 * scheduling act, and it belongs next to the schedule rather than
 * beside the patient's name.
 */
import { useState } from 'react';
import { useStore } from '../../lib/store';
import { useNav } from '../../lib/nav';
import { Chip } from '../../components/ui';
import { Drawer } from '../../components/Drawer';
import { Booking } from '../../components/Booking';
import { fmtDate, relative } from '../../lib/format';
import { kindLabel } from '../../lib/clinical';
import { hhmm } from '../../domain/schedule';
import { ORDER_KINDS, type Encounter, type Order } from '../../domain/types';

const ORDER_LABEL = Object.fromEntries(ORDER_KINDS.map((k) => [k.id, k.label]));

export function RightRail({ patientId }: { patientId: string }) {
  const st = useStore();
  const nav = useNav();
  const [visits, setVisits] = useState(false);

  const all = st.encountersFor(patientId);
  const ahead = all
    .filter((e) => e.status !== 'signed')
    .sort((a, b) => a.date.localeCompare(b.date));
  const next = ahead[0];
  const orders = st.ordersForPatient(patientId).filter((o) => o.status !== 'done');

  return (
    <aside className="rail">
      <div className="railblock">
        <div className="railhead">
          <h3>Next visit</h3>
          <button className="linkish" onClick={() => setVisits(true)}>All</button>
        </div>

        {next ? (
          <button className="nextvisit" onClick={() => nav.go({ name: 'encounter', encounterId: next.id })}>
            <div className="nvdate">
              {fmtDate(next.date)}{next.start !== undefined && ` at ${hhmm(next.start)}`}
            </div>
            <div className="nvkind">{kindLabel(next.kind)}</div>
            <div className="nvwhen">{relative(next.date)} &middot; {next.duration} min</div>
          </button>
        ) : (
          <button className="nextvisit empty" onClick={() => setVisits(true)}>
            Nothing booked. Book one.
          </button>
        )}

        {ahead.length > 1 && (
          <div className="railmore">
            {ahead.slice(1, 3).map((e) => (
              <button key={e.id} className="railline"
                onClick={() => nav.go({ name: 'encounter', encounterId: e.id })}>
                <span>{fmtDate(e.date)}</span>
                <span className="muted">{kindLabel(e.kind)}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="railblock">
        <div className="railhead">
          <h3>Pending orders</h3>
          {orders.length > 0 && <span className="small muted">{orders.length}</span>}
        </div>
        {orders.length === 0 ? (
          <p className="small muted" style={{ margin: 0 }}>Nothing outstanding.</p>
        ) : (
          <div className="orderlist">
            {orders.map((o) => <OrderRow key={o.id} o={o} />)}
          </div>
        )}
      </div>

      <Drawer open={visits} title="Visits" wide
        sub={`${all.filter((e) => e.status === 'signed').length} signed, ${ahead.length} ahead`}
        onClose={() => setVisits(false)}>
        <VisitsDrawer patientId={patientId} onDone={() => setVisits(false)} />
      </Drawer>
    </aside>
  );
}

function OrderRow({ o }: { o: Order }) {
  const st = useStore();
  const [open, setOpen] = useState(false);
  return (
    <div className={`orderrow${o.status === 'draft' ? ' draft' : ''}`}>
      <button className="ohead" onClick={() => setOpen((v) => !v)}>
        <span className="okind">{ORDER_LABEL[o.kind] ?? o.kind}</span>
        <span className="otext">{o.text}</span>
        {o.status === 'draft' && <Chip tone="warn">Not sent</Chip>}
      </button>
      {open && (
        <div className="odetail">
          <div className="small muted">
            {o.status === 'draft' ? 'Drafted' : 'Placed'} {fmtDate(o.created)}
          </div>
          <div className="row" style={{ gap: 6, marginTop: 7 }}>
            {o.status === 'draft' && (
              <button className="btn sm" onClick={() => st.placeOrder(o.id)}>Send it</button>
            )}
            <button className="btn ghost sm" onClick={() => st.completeOrder(o.id)}>
              {o.kind === 'prescription' ? 'Done' : 'Result received'}
            </button>
            <button className="btn quiet sm" onClick={() => st.removeOrder(o.id)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Everything to do with visits, in one place: read a past note, open
 * one that is booked, or make a new one. The header no longer carries
 * a Start Visit button because this is where that act belongs.
 */
function VisitsDrawer({ patientId, onDone }: { patientId: string; onDone: () => void }) {
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
