/**
 * The schedule, which is the way in.
 *
 * A week by default, because a week is the unit a solo practice
 * actually plans in: whether Thursday has room, whether the reviews
 * got pushed into Friday again, whether the run-up to a closure is
 * as empty as it looks. A day on its own cannot answer any of those,
 * and a month is too coarse to answer them either.
 *
 * Three views over one list, and the list is the same list in all
 * three. Week places things in time. Day is the one that carries the
 * detail a physician needs before walking into something: what has
 * arrived since the plan was last approved, and which version they
 * are opening. Month is for finding a free fortnight.
 *
 * What is deliberately absent is as much the design as what is here.
 * No separate queue for care management, behavioural health,
 * preventative services or lifestyle medicine. Those happen inside
 * an encounter, and giving each one a slot on a calendar is how a
 * practice ends up with five diaries and no time.
 */
import { useMemo, useState } from 'react';
import { useStore } from '../lib/store';
import { useNav } from '../lib/nav';
import { Chip, Panel, Empty, Avatar } from '../components/ui';
import { fmtDate } from '../lib/format';
import { addDays } from '../lib/clock';
import {
  hhmm, closureOn, nextClosure, dayStatus, weekStart, WORKING_YEAR,
} from '../domain/schedule';
import type { Encounter } from '../domain/types';

type View = 'day' | 'week' | 'month';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const PX_PER_MIN = 0.78;

/** "Closed, end of year" reads better mid-sentence as "the end-of-year closure". */
const shortLabel = (label: string) =>
  `the ${label.replace(/^Closed,\s*/i, '').trim().replace(/\s+/g, '-')} closure`;

const monthStart = (iso: string) => `${iso.slice(0, 7)}-01`;
const addMonths = (iso: string, n: number) => {
  const [y, m] = iso.split('-').map(Number);
  const t = y * 12 + (m - 1) + n;
  return `${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, '0')}-01`;
};
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

export function Schedule() {
  const st = useStore();
  const nav = useNav();
  const [view, setView] = useState<View>('week');
  const [anchor, setAnchor] = useState(st.now);

  const waiting = st.inbox().filter((x) => !x.triage);
  const coming = nextClosure(st.now);
  const closing = st.closureChecks();
  const daysToClose = coming
    ? Math.round((Date.parse(`${coming.from}T12:00:00`) - Date.parse(`${st.now}T12:00:00`)) / 86400000)
    : undefined;

  /** Everything booked, by date, which all three views read. */
  const byDate = useMemo(() => {
    const m = new Map<string, Encounter[]>();
    for (const e of st.encounters) {
      const xs = m.get(e.date) ?? [];
      xs.push(e);
      m.set(e.date, xs);
    }
    for (const xs of m.values()) {
      xs.sort((a, b) => {
        // Unscheduled sits after everything with a time rather than
        // before it. An encounter somebody opened from a chart and
        // left has no hour, and sorting it to the top of the morning
        // is how the day stops being readable.
        const at = a.start ?? 24 * 60;
        const bt = b.start ?? 24 * 60;
        if (at !== bt) return at - bt;
        return (a.status === 'signed' ? 1 : 0) - (b.status === 'signed' ? 1 : 0);
      });
    }
    return m;
  }, [st.encounters]);

  const on = (iso: string) => byDate.get(iso) ?? [];

  const step = (n: number) => setAnchor(
    view === 'day' ? addDays(anchor, n)
      : view === 'week' ? addDays(anchor, n * 7)
        : addMonths(anchor, n),
  );

  const range = view === 'day' ? fmtDate(anchor)
    : view === 'week'
      ? `${fmtDate(weekStart(anchor))} to ${fmtDate(addDays(weekStart(anchor), 6))}`
      : `${MONTH_NAMES[Number(anchor.slice(5, 7)) - 1]} ${anchor.slice(0, 4)}`;

  const here = view === 'day' ? anchor === st.now
    : view === 'week' ? weekStart(anchor) === weekStart(st.now)
      : anchor.slice(0, 7) === st.now.slice(0, 7);

  return (
    <div className="wrap wide">
      <div className="page-head row" style={{ alignItems: 'flex-end' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1>Schedule</h1>
          <div className="sub">{range}</div>
        </div>
        <div className="viewtabs">
          {(['day', 'week', 'month'] as View[]).map((v) => (
            <button key={v} className={`vtab${view === v ? ' on' : ''}`}
              onClick={() => setView(v)}>{v}</button>
          ))}
        </div>
        <button className="btn quiet sm" onClick={() => step(-1)}>&larr;</button>
        {!here && (
          <button className="btn quiet sm" onClick={() => setAnchor(st.now)}>Today</button>
        )}
        <button className="btn quiet sm" onClick={() => step(1)}>&rarr;</button>
      </div>

      {/* ---------------------------------------- what is waiting, either way */}
      {coming && daysToClose !== undefined && daysToClose > 0 && daysToClose <= 45
        && closing && closing.checks.length > 0 && (
        <button className="inboxbar closingbar" onClick={() => nav.go({ name: 'closing' })}>
          <span>
            <b>{closing.checks.length}</b>{' '}
            {closing.checks.length === 1 ? 'patient has' : 'patients have'} something
            outstanding before {shortLabel(coming.label)} in {daysToClose} days
            {closing.checks.some((c) => c.items.some((i) => i.urgent)) && (
              <span className="urgentmark">
                {closing.checks.filter((c) => c.items.some((i) => i.urgent)).length} with
                no other physician
              </span>
            )}
          </span>
          <span className="linkish">Check</span>
        </button>
      )}

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

      {view === 'day' && <DayView iso={anchor} list={on(anchor)} />}
      {view === 'week' && (
        <WeekView start={weekStart(anchor)} on={on}
          onDay={(iso) => { setAnchor(iso); setView('day'); }} />
      )}
      {view === 'month' && (
        <MonthView month={monthStart(anchor)} on={on}
          onDay={(iso) => { setAnchor(iso); setView('day'); }} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ day */

/**
 * The day, with what a physician needs before walking into it.
 *
 * The only view that carries the reconciliation count and the version
 * number, because those are the two facts that change what happens in
 * the next hour and neither of them fits in a block on a grid.
 */
function DayView({ iso, list }: { iso: string; list: Encounter[] }) {
  const st = useStore();
  const nav = useNav();
  const shut = closureOn(iso);
  const verdict = dayStatus(iso);

  return (
    <>
      {shut && (
        <p className="closedbar">
          <b>{shut.label}.</b> {fmtDate(shut.from)} to {fmtDate(shut.to)}. Nothing routine
          is booked while the practice is closed. The dates are known before anybody enrols.
        </p>
      )}

      {list.length === 0 ? (
        <Panel title={shut ? 'Closed' : verdict.status === 'weekend' ? 'Not a clinic day' : 'Nothing booked'}>
          <Empty>
            {shut
              ? 'The practice is closed. Nothing routine is booked, and the inbox is still '
                + 'read, because an urgent message does not wait for a service period.'
              : verdict.status === 'weekend'
                ? 'The practice keeps business hours, Monday to Friday.'
                : 'A clear day. The inbox is the other place work arrives, and a care plan '
                  + 'review can be started from any chart.'}
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
                onClick={() => nav.go({ name: 'encounter', encounterId: e.id })}>
                <span className="dtime">
                  {e.start != null ? hhmm(e.start) : <span className="muted">no time</span>}
                </span>
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
    </>
  );
}

/* ----------------------------------------------------------------- week */

function WeekView({ start, on, onDay }: {
  start: string;
  on: (iso: string) => Encounter[];
  onDay: (iso: string) => void;
}) {
  const st = useStore();
  const nav = useNav();
  const y = WORKING_YEAR;
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));

  /**
   * The window the grid draws, which is not the working day.
   *
   * The working year says nine to five, and reviews get put at eight
   * because that is when asynchronous work survives a clinic day. A
   * grid that only draws the official hours puts those blocks at a
   * negative offset, where they land on top of the date. So the
   * window stretches to hold whatever is actually booked.
   */
  const booked = days.flatMap(on).filter((e) => e.start != null);
  const from = Math.min(y.dayStart, ...booked.map((e) => e.start!));
  const to = Math.max(y.dayEnd, ...booked.map((e) => e.start! + (e.duration ?? 30)));
  const dayMinutes = to - from;

  return (
    <div className="weekgrid">
      {days.map((iso) => {
        const verdict = dayStatus(iso);
        const today = iso === st.now;
        const all = on(iso);
        const timed = all.filter((e) => e.start != null);
        const loose = all.filter((e) => e.start == null);
        return (
          <div key={iso} className={`wday ${verdict.status}${today ? ' today' : ''}`}>
            <button className="wdhead" onClick={() => onDay(iso)}>
              <span>{DAY_NAMES[new Date(`${iso}T12:00:00`).getDay()]}</span>
              <span className="num">{iso.slice(8)}</span>
              {today && <Chip tone="accent">Today</Chip>}
            </button>

            {verdict.status !== 'clinic' ? (
              <div className="wdoff">{verdict.label ?? 'Not a clinic day'}</div>
            ) : (
              <div className="wdcol" style={{ height: dayMinutes * PX_PER_MIN }}>
                <div className="wdlunch" style={{
                  top: (y.lunchStart - from) * PX_PER_MIN,
                  height: y.lunchMinutes * PX_PER_MIN,
                }} />
                {timed.map((e) => {
                  const p = st.patient(e.patientId);
                  const mins = e.duration ?? 30;
                  return (
                    <button key={e.id}
                      className={`wdvisit k-${e.kind}${e.status === 'signed' ? ' signed' : ''}`}
                      style={{
                        top: (e.start! - from) * PX_PER_MIN,
                        height: Math.max(16, mins * PX_PER_MIN - 2),
                      }}
                      onClick={() => nav.go({ name: 'encounter', encounterId: e.id })}>
                      <span className="line1">
                        <span className="t">{hhmm(e.start!)}</span>
                        <span className="n">{p?.name ?? 'Someone'}</span>
                      </span>
                      {mins >= 40 && (
                        <span className="k">
                          {e.kind === 'review' ? 'Care plan review' : 'Visit'} &middot; {mins}m
                        </span>
                      )}
                    </button>
                  );
                })}
                {timed.length === 0 && loose.length === 0 && <div className="wdempty">Open</div>}
              </div>
            )}

            {/*
              * Encounters somebody opened from a chart and never
              * finished. They are real and they have no hour, so they
              * sit under the day rather than being given a fictional
              * one at the top of the morning.
              */}
            {loose.length > 0 && (
              <div className="wdloose">
                {loose.map((e) => (
                  <button key={e.id} className="looserow"
                    onClick={() => nav.go({ name: 'encounter', encounterId: e.id })}>
                    {st.patient(e.patientId)?.name ?? 'Someone'}
                    <span className="small muted">
                      {e.status === 'signed' ? 'approved'
                        : e.status === 'in-progress' ? 'started' : 'no time set'}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {verdict.status === 'clinic' && (
              <div className="wdfoot">
                {all.length === 0 ? 'Open' : `${all.length} booked`}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ---------------------------------------------------------------- month */

/**
 * The month, for finding a free fortnight.
 *
 * Deliberately coarse. Counts and a closure band, nothing else: a
 * month grid that tries to show who is booked ends up showing
 * neither, and the day view is one click away.
 */
function MonthView({ month, on, onDay }: {
  month: string;
  on: (iso: string) => Encounter[];
  onDay: (iso: string) => void;
}) {
  const st = useStore();
  const first = new Date(`${month}T12:00:00`);
  const lead = first.getDay();
  const days = new Date(Date.UTC(first.getFullYear(), first.getMonth() + 1, 0)).getUTCDate();
  const cells: (string | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: days }, (_, i) => `${month.slice(0, 8)}${String(i + 1).padStart(2, '0')}`),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="monthgrid">
      {DAY_NAMES.map((d) => <div key={d} className="mhead">{d}</div>)}
      {cells.map((iso, i) => {
        if (!iso) return <div key={`b${i}`} className="mcell blank" />;
        const verdict = dayStatus(iso);
        const all = on(iso);
        const visits = all.filter((e) => e.kind === 'visit').length;
        const reviews = all.length - visits;
        return (
          <button key={iso} className={`mcell ${verdict.status}${iso === st.now ? ' today' : ''}`}
            onClick={() => onDay(iso)}>
            <span className="mnum">{Number(iso.slice(8))}</span>
            {verdict.status === 'away' ? (
              <span className="mclosed">Closed</span>
            ) : all.length > 0 ? (
              <span className="mcounts">
                {visits > 0 && <span className="mv">{visits} visit{visits === 1 ? '' : 's'}</span>}
                {reviews > 0 && <span className="mr">{reviews} review{reviews === 1 ? '' : 's'}</span>}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
