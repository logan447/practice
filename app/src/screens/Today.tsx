/**
 * The day, which is the way in.
 *
 * One list. Two kinds of thing on it. A solo physician's morning is
 * not a dashboard and it is not a patient directory: it is the next
 * six hours, in order, and the only question each row has to answer
 * is whether anything has arrived that will change what happens in
 * it. Everything else on this screen is subordinate to that.
 *
 * What is deliberately absent is as much the design as what is here.
 * No separate queue for care management, behavioural health,
 * preventative services or lifestyle medicine. Those are things that
 * happen inside an encounter, and giving each one its own slot on a
 * calendar is how a practice ends up with five diaries and no time.
 */
import { useState } from 'react';
import { useStore } from '../lib/store';
import { useNav } from '../lib/nav';
import { Chip, Panel, Empty, Avatar } from '../components/ui';
import { fmtDate } from '../lib/format';
import { addDays } from '../lib/clock';
import { hhmm } from '../domain/schedule';
import type { Encounter } from '../domain/types';

export function Today() {
  const st = useStore();
  const nav = useNav();
  const [day, setDay] = useState(st.now);
  const list = st.dayList(day);
  const waiting = st.inbox().filter((x) => !x.triage);
  const isToday = day === st.now;

  const open = (e: Encounter) => nav.go({ name: 'encounter', encounterId: e.id });

  return (
    <div className="wrap">
      <div className="page-head row" style={{ alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <h1>{isToday ? 'Today' : fmtDate(day)}</h1>
          <div className="sub">
            {list.length === 0
              ? 'Nothing booked.'
              : `${list.length} ${list.length === 1 ? 'activity' : 'activities'}, `
                + `${list.filter((e) => e.kind === 'visit').length} of them visits.`}
          </div>
        </div>
        <button className="btn quiet sm" onClick={() => setDay(addDays(day, -1))}>&larr;</button>
        {!isToday && (
          <button className="btn quiet sm" onClick={() => setDay(st.now)}>Today</button>
        )}
        <button className="btn quiet sm" onClick={() => setDay(addDays(day, 1))}>&rarr;</button>
      </div>

      {waiting.length > 0 && (
        <button className="inboxbar" onClick={() => nav.go({ name: 'inbox' })}>
          <span>
            <b>{waiting.length}</b> waiting in the inbox
            {waiting.filter((x) => x.urgent).length > 0 && (
              <span className="urgentmark">
                {waiting.filter((x) => x.urgent).length} flagged urgent
              </span>
            )}
          </span>
          <span className="linkish">Triage</span>
        </button>
      )}

      {list.length === 0 ? (
        <Panel title="Nothing booked">
          <Empty>
            A clear day. The inbox is the other place work arrives, and a care plan
            review can be started from any chart.
          </Empty>
        </Panel>
      ) : (
        <div className="daylist">
          {list.map((e) => {
            const p = st.patient(e.patientId);
            const fresh = st.newSince(e.patientId);
            const v = st.currentVersion(e.patientId);
            const done = e.status === 'signed';
            return (
              <button key={e.id} className={`dayrow${done ? ' done' : ''}`}
                onClick={() => open(e)}>
                <span className="dtime">{e.start != null ? hhmm(e.start) : '--:--'}</span>
                {p && <Avatar patient={p} />}
                <span className="dwho">
                  <span className="dname">{p?.name ?? 'Someone'}</span>
                  <span className="dreason">{e.reason}</span>
                </span>
                <span className="dkind">
                  <Chip tone={e.kind === 'review' ? undefined : 'accent'}>
                    {e.kind === 'review' ? 'Care plan review' : 'Visit'}
                  </Chip>
                  <span className="small muted">{e.duration ?? 30} min</span>
                </span>
                <span className="dnew">
                  {done ? (
                    <Chip tone="ok">Approved</Chip>
                  ) : fresh.count === 0 ? (
                    <span className="small muted">Nothing new</span>
                  ) : (
                    <Chip tone={fresh.urgent > 0 ? 'crit' : 'warn'}>
                      {fresh.count} to reconcile
                    </Chip>
                  )}
                  <span className="small muted">
                    {v ? `version ${v.version}` : 'no approved plan'}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      <p className="small muted" style={{ marginTop: 18, maxWidth: '70ch' }}>
        Every row opens the same place: the approved care plan, with whatever has
        arrived since beside it. The difference between the two kinds is where the
        words come from, not what the document is.
      </p>
    </div>
  );
}
