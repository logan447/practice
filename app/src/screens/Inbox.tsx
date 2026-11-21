/**
 * Everything that arrived while nobody was in an encounter.
 *
 * The rule this screen exists to protect: a record arriving does not
 * change the care plan. Somebody has to read it and choose, and the
 * choosing has to be cheap or it will not happen.
 *
 * Three answers, and the absence of a fourth is the design. There is
 * no "file it into the chart" button here, because that would start
 * the approved document moving again on its own and nothing
 * downstream could be trusted. Acknowledging a result is a promise to
 * the patient that it has been read. It is not the clinical work, and
 * the record still turns up in the reconciliation tray at the next
 * encounter, where the clinical work happens.
 *
 * The one thing the screen must not let a physician do is defer
 * something that should not wait. So urgency sorts to the top and
 * stays visible after triage, and the deferral button says which
 * appointment it is deferring to rather than "later".
 */
import { useState } from 'react';
import { useStore } from '../lib/store';
import { useNav } from '../lib/nav';
import { Chip, Panel, Empty, Avatar } from '../components/ui';
import { fmtDate, relative } from '../lib/format';
import { deferReply, type InboxItem } from '../lib/inbox';

const KIND_LABEL: Record<InboxItem['kind'], string> = {
  message: 'Message', update: 'Health update', result: 'Result',
  study: 'Report', home: 'Home reading',
};

export function Inbox() {
  const st = useStore();
  const nav = useNav();
  const [showDone, setShowDone] = useState(false);
  const all = st.inbox();
  const waiting = all.filter((x) => !x.triage);
  const handled = all.filter((x) => x.triage);
  const list = showDone ? handled : waiting;

  return (
    <div className="wrap">
      <div className="page-head row" style={{ alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <h1>Inbox</h1>
          <div className="sub">
            {waiting.length === 0
              ? 'Nothing waiting.'
              : `${waiting.length} waiting`}
            {waiting.filter((x) => x.urgent).length > 0
              && `, ${waiting.filter((x) => x.urgent).length} flagged urgent`}
            . Reading something here does not change anybody&rsquo;s care plan.
          </div>
        </div>
        <button className="btn quiet sm" onClick={() => setShowDone((v) => !v)}>
          {showDone ? `Waiting (${waiting.length})` : `Handled (${handled.length})`}
        </button>
        <button className="btn ghost" onClick={() => nav.go({ name: 'schedule' })}>Schedule</button>
      </div>

      {list.length === 0 ? (
        <Panel title={showDone ? 'Nothing handled yet' : 'Empty'}>
          <Empty>
            {showDone
              ? 'Nothing has been triaged yet.'
              : 'Everything that has arrived has been looked at.'}
          </Empty>
        </Panel>
      ) : (
        <div className="stack">
          {list.map((item) => <Row key={item.id} item={item} />)}
        </div>
      )}
    </div>
  );
}

function Row({ item }: { item: InboxItem }) {
  const st = useStore();
  const nav = useNav();
  const p = st.patient(item.patientId);
  const booked = st.encountersFor(item.patientId)
    .filter((e) => e.status !== 'signed' && e.date >= st.now)
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  const [open, setOpen] = useState(false);

  const what = booked?.kind === 'review' ? 'care plan review' : 'visit';
  const next = booked
    ? (booked.date === st.now ? `${what} today` : `${what} on ${fmtDate(booked.date)}`)
    : undefined;

  const defer = () => {
    st.triageRecord(item.patientId, item.id, 'acknowledged', {
      reply: deferReply(item, next),
    });
  };
  const expedite = () => {
    const id = st.expediteReview(item.patientId);
    st.triageRecord(item.patientId, item.id, 'expedited', { encounterId: id });
    nav.go({ name: 'encounter', encounterId: id });
  };
  const book = () => {
    const id = st.bookSoonVisit(item.patientId, `About the ${KIND_LABEL[item.kind].toLowerCase()} of ${fmtDate(item.date)}`);
    st.triageRecord(item.patientId, item.id, 'booked', { encounterId: id });
  };

  const t = item.triage;

  return (
    <div className={`inboxrow${item.urgent && !t ? ' urgent' : ''}`}>
      <div className="irhead">
        {p && <Avatar patient={p} />}
        <button className="irwho linkish"
          onClick={() => nav.go({ name: 'chart', patientId: item.patientId })}>
          {p?.name ?? 'Someone'}
        </button>
        <Chip tone={item.urgent ? 'crit' : undefined}>{KIND_LABEL[item.kind]}</Chip>
        {item.label !== KIND_LABEL[item.kind] && (
          <span className="small muted">{item.label}</span>
        )}
        <span className="spacer" />
        <span className="small muted">{relative(item.date)}</span>
      </div>

      <p className="irbody">{item.summary}</p>

      {t ? (
        <div className="irdone">
          <Chip tone="ok">
            {t.choice === 'acknowledged' ? 'Acknowledged'
              : t.choice === 'expedited' ? 'Review brought forward' : 'Visit booked'}
          </Chip>
          <span className="small muted">
            {relative(t.at)}
            {t.reply && ` · "${t.reply}"`}
          </span>
          <span className="spacer" />
          <span className="small muted">Still to be read into the plan at the next encounter.</span>
        </div>
      ) : (
        <>
          {/*
            * Order matters on an urgent row. Deferring is the right
            * answer most of the time and the wrong answer exactly
            * when it is flagged, so the flagged rows put it last
            * rather than removing it: the physician may still decide
            * it can wait, and they should have to reach for it.
            */}
          <div className="iracts">
            {item.urgent ? (
              <>
                <button className="btn sm" onClick={expedite}>Review this now</button>
                <button className="btn ghost sm" onClick={book}>Book a visit</button>
                <button className="btn quiet sm" onClick={defer}>
                  {next ? `Acknowledge, hold for the ${next}` : 'Acknowledge and hold'}
                </button>
              </>
            ) : (
              <>
                <button className="btn ghost sm" onClick={defer}>
                  {next ? `Acknowledge, hold for the ${next}` : 'Acknowledge and hold'}
                </button>
                <button className="btn ghost sm" onClick={expedite}>Review this now</button>
                <button className="btn ghost sm" onClick={book}>Book a visit</button>
              </>
            )}
            <span className="spacer" />
            <button className="linkish" onClick={() => setOpen((v) => !v)}>
              {open ? 'Hide' : 'What each of these does'}
            </button>
          </div>
          {open && (
            <div className="irhelp">
              <p>
                <b>Acknowledge and hold.</b> Tells the patient it has been read and
                names when it will be gone through. The record waits in their
                reconciliation tray; the care plan does not move.
              </p>
              <p>
                <b>Review this now.</b> Brings their care plan review forward to today,
                or makes one, and opens it. Use it when the answer cannot wait for the
                booked appointment but does not need them in the room.
              </p>
              <p>
                <b>Book a visit.</b> For anything that needs examining or talking
                through. Lands on the next clinic day with room.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
