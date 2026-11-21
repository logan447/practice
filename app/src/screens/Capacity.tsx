/**
 * The year behind the week.
 *
 * One question: whether 200 adults at 250 clinical minutes each fits
 * in thirty hours a week across eight months. The week grid is here
 * too, because the arithmetic is abstract until you can see what a
 * Tuesday actually looks like, but the schedule proper lives on its
 * own screen now and this one exists for the numbers.
 *
 * The arithmetic is shown rather than summarised, because every input
 * in it is a decision somebody made and might change.
 */
import { useMemo, useState } from 'react';
import { useStore } from '../lib/store';
import { useNav } from '../lib/nav';
import { Chip, Panel, Empty } from '../components/ui';
import { fmtDate } from '../lib/format';
import { addDays } from '../lib/clock';
import { kindLabel } from '../lib/clinical';
import {
  WORKING_YEAR, capacity, dayLoad, dayStatus, hhmm, weekStart,
} from '../domain/schedule';
import { toBooked } from '../components/Booking';
import { PACKAGE, FIRST_YEAR_EXTRA, yearCapacity } from '../lib/membership';
import { useActor } from '../lib/session';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const PX_PER_MIN = 0.9;

export function Capacity() {
  const st = useStore();
  const nav = useNav();
  const me = useActor();
  // On a Saturday the current week is already over, and a practice
  // calendar opens on the week it can still do something about.
  const [week, setWeek] = useState(() => {
    const d = new Date(`${st.now}T12:00:00`).getDay();
    return weekStart(d === 0 || d === 6 ? addDays(st.now, 2) : st.now);
  });

  const y = WORKING_YEAR;
  const nameOf = (id: string) => st.patient(id)?.name ?? 'Someone';

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => {
      const iso = addDays(week, i);
      return dayLoad(iso, toBooked(st.bookedOn(iso), nameOf));
    }),
    [week, st],
  );

  /**
   * The year so far, counted from what is actually in the record
   * rather than from a plan. Signed visits are work done; scheduled
   * ones are work promised, and both consume the same hours.
   */
  const cap = useMemo(() => {
    // A rolling twelve months, because "hours per patient per year" is
    // a rate. Counting every visit in a chart that goes back four
    // years answers a different question.
    const from = addDays(st.now, -365);
    const to = addDays(st.now, 365);
    const seen = new Set<string>();
    let minutes = 0;
    for (const e of st.encounters) {
      if (e.date < from || e.date > to) continue;
      minutes += e.duration ?? 30;
      seen.add(e.date);
    }
    return capacity(minutes, seen.size, st.patients.length, y);
  }, [st.encounters, st.patients.length, st.now, y]);

  const overTarget = cap.panel > cap.panelAtHigh;
  // At the target panel, not at whatever is enrolled today. A demo
  // with five patients would otherwise report two thousand minutes
  // each, which is true and useless.
  const yc = yearCapacity(y.panelTarget, y);
  const ycNow = st.patients.length > 0 ? yearCapacity(st.patients.length, y) : undefined;
  const dayMinutes = y.dayEnd - y.dayStart;

  return (
    <div className="wrap wide">
      <div className="page-head row" style={{ alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <h1>Capacity</h1>
          <div className="sub">
            {y.hoursPerWeek} hours a week for {y.weeksWorked} weeks, Monday to Friday.
            Eight months open and four closed, in four blocks of about a month rather
            than one block of four. Every number on this page comes from a logged
            decision or is marked as an assumption. The day itself is on Today.
          </div>
        </div>
        <button className="btn ghost" onClick={() => nav.back()}>Back</button>
      </div>

      {/* ----------------------------------------------------- the week */}
      <div className="row" style={{ marginBottom: 12, gap: 8 }}>
        <button className="btn quiet sm" onClick={() => setWeek(addDays(week, -7))}>&larr; Week</button>
        <strong style={{ fontSize: 14 }}>
          {fmtDate(week)} to {fmtDate(addDays(week, 6))}
        </strong>
        <button className="btn quiet sm" onClick={() => setWeek(addDays(week, 7))}>Week &rarr;</button>
        {week !== weekStart(st.now) && (
          <button className="btn quiet sm" onClick={() => setWeek(weekStart(st.now))}>This week</button>
        )}
        <span className="spacer" />
        <span className="small muted">
          {days.reduce((a, d) => a + d.booked.length, 0)} booked this week,{' '}
          {Math.round(days.reduce((a, d) => a + d.totalMinutes, 0) / 6) / 10} hours with admin
        </span>
      </div>

      <div className="weekgrid">
        {days.map((d) => {
          const v = dayStatus(d.iso, y);
          const today = d.iso === st.now;
          return (
            <div key={d.iso} className={`wday ${v.status}${today ? ' today' : ''}`}>
              <div className="wdhead">
                <span>{DAY_NAMES[new Date(`${d.iso}T12:00:00`).getDay()]}</span>
                <span className="num">{d.iso.slice(8)}</span>
                {today && <Chip tone="accent">Today</Chip>}
              </div>

              {v.status !== 'clinic' ? (
                <div className="wdoff">{v.label ?? 'Not a clinic day'}</div>
              ) : (
                <div className="wdcol" style={{ height: dayMinutes * PX_PER_MIN }}>
                  <div className="wdlunch" style={{
                    top: (y.lunchStart - y.dayStart) * PX_PER_MIN,
                    height: y.lunchMinutes * PX_PER_MIN,
                  }} />
                  {d.booked.map((b) => (
                    <button key={b.id} className={`wdvisit k-${b.kind}`}
                      style={{
                        top: (b.start - y.dayStart) * PX_PER_MIN,
                        height: Math.max(16, b.minutes * PX_PER_MIN - 2),
                      }}
                      onClick={() => nav.go({ name: 'encounter', encounterId: b.id })}>
                      {/* The name comes first and always fits. A
                          thirty minute block is two lines tall, so
                          anything that does not fit is the label. */}
                      <span className="line1">
                        <span className="t">{hhmm(b.start)}</span>
                        <span className="n">{b.label}</span>
                      </span>
                      {b.minutes >= 45 && (
                        <span className="k">{kindLabel(b.kind as never)} &middot; {b.minutes}m</span>
                      )}
                    </button>
                  ))}
                  {d.booked.length === 0 && <div className="wdempty">Open</div>}
                </div>
              )}

              {v.status === 'clinic' && (
                <div className="wdfoot">
                  {d.full
                    ? <span style={{ color: 'var(--warn)' }}>Full</span>
                    : `${Math.round(d.openMinutes / 6) / 10} h open`}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ------------------------------------------------- the year */}
      {/* ------------------------------------- the package, and whether it fits */}
      <h2 style={{ fontSize: 17, margin: '26px 0 12px' }}>Does the year hold the panel?</h2>

      <Panel title="What a membership year contains" eyebrow="Derived">
        <div className="row flow" style={{ gap: 26, marginBottom: 12 }}>
          <Stat n={yc.clinicalHours} u="clinical hours a year, after a fifth for admin" />
          <Stat n={yc.minutesEach} u={`clinical minutes each at the target ${y.panelTarget}`} />
          <Stat n={yc.minutesPlanned} u="minutes the package plans for" />
          <Stat n={yc.panelThatFits} u="patients the package exactly fits" />
        </div>
        <table className="rows">
          <tbody>
            <tr>
              <td>Visits</td>
              <td className="small muted">
                {PACKAGE.visits.count} &times; {PACKAGE.visits.minutes} min
              </td>
              <td className="num">{PACKAGE.visits.count * PACKAGE.visits.minutes}</td>
            </tr>
            <tr>
              <td>Messages, coordination and follow-up</td>
              <td className="small muted">across the year</td>
              <td className="num">{PACKAGE.messagingMinutes}</td>
            </tr>
            <tr>
              <td><b>Total</b></td>
              <td />
              <td className="num"><b>{yc.minutesPlanned}</b></td>
            </tr>
          </tbody>
        </table>
        {ycNow && st.patients.length !== y.panelTarget && (
          <p className="small muted" style={{ marginTop: 10, maxWidth: '74ch' }}>
            <b>{st.patients.length} enrolled today</b>, which is {ycNow.minutesEach} clinical
            minutes each. Every patient over {yc.panelThatFits} takes minutes from everybody
            already here, which is why the panel number is a clinical parameter and not
            only a commercial one.
          </p>
        )}
        <p className="small muted" style={{ marginTop: 12, maxWidth: '74ch' }}>
          Five visits a year inside four service periods, which is a contact roughly every
          seven weeks while the practice is open. There is one kind of encounter: the care
          plan review was a second one, asynchronous, and five visits of the same shape is
          the same contact rate with one thing to build. The first year costs about
          {' '}{FIRST_YEAR_EXTRA} minutes more, because a comprehensive assessment and a care
          plan built from nothing is not the steady state. Either that year is a larger
          package or enrolment is staged; staging is simpler and does not need a second price.
        </p>
        <p className="small muted" style={{ marginTop: 10, maxWidth: '74ch' }}>
          <b>What this replaced.</b> A sixty minute care plan review every month is 720
          minutes a patient a year. Across {y.panelTarget} patients that is{' '}
          {y.panelTarget * 12} physician hours against the {cap.yearHours} the year contains,
          over by a factor of {Math.round(((y.panelTarget * 12) / cap.yearHours) * 10) / 10}.
          It was the right design for a smaller panel and a primary care scope, and it does
          not survive either change. See docs/systems/consultative-practice-model.md.
        </p>
      </Panel>


      <div className="grid g3">
        <Panel title="Hours the year has" eyebrow="D-051">
          <div className="metric">
            <span className="v num">{cap.yearHours}</span>
            <span className="u">hours</span>
          </div>
          <p className="small muted" style={{ marginTop: 8 }}>
            {y.hoursPerWeek} hours a week times {y.weeksWorked} working weeks, which is
            eight months open and four closed. A decision, not a measurement.
          </p>
        </Panel>

        <Panel title="Gone before anything is booked" eyebrow="Assumed">
          <div className="metric">
            <span className="v num">{cap.messagingHours}</span>
            <span className="u">hours</span>
          </div>
          <p className="small muted" style={{ marginTop: 8 }}>
            {y.messagingPerWeek} minutes a week of messaging and results, for the
            24 to 72 hour response in D-017 with no coverage clinician. Assumed, and
            the first number to replace with a real one.
          </p>
        </Panel>

        <Panel title="Panel this year could carry" eyebrow="Derived">
          <div className="metric">
            <span className="v num">{cap.panelAtLow}&ndash;{cap.panelAtHigh}</span>
            <span className="u">adults</span>
          </div>
          <p className="small muted" style={{ marginTop: 8 }}>
            {cap.yearHours - cap.messagingHours} usable hours divided by the sourced
            {' '}{y.hoursPerPatientLow} to {y.hoursPerPatientHigh} hours per patient per year.
            D-051 targets {cap.targetPanel}. Break-even is {cap.breakEven}.
          </p>
        </Panel>
      </div>

      <Panel title="The arithmetic disagrees with the target" style={{ marginTop: 16 }}>
        <p style={{ fontSize: 14, maxWidth: '74ch' }}>
          This model says the year can carry {cap.panelAtLow} to {cap.panelAtHigh} adults.
          D-051 targets {cap.targetPanel}. Those are not the same number, and the
          difference is about {cap.unexplainedHours} hours a year, which is roughly{' '}
          {Math.round((cap.unexplainedHours / y.weeksWorked) * 10) / 10} hours a week.
        </p>
        <p className="small muted" style={{ marginTop: 10, maxWidth: '74ch' }}>
          One of three things is true. The messaging assumption above is too small, which
          is the most likely. Or the sourced 5 to 6 hours per patient already includes
          work this model is double counting. Or D-018 held back capacity on purpose and
          the reason was never written down. The gap is shown rather than tuned away,
          because closing it by adjusting an assumption until the two agree would destroy
          the only evidence that something is missing. <b>REFRESH-AT-RUNWAY</b>: the first
          three months of real messaging and admin time settles it.
        </p>
      </Panel>

      <Panel title="Where this record currently stands" style={{ marginTop: 16 }}>
        {st.patients.length === 0 ? <Empty>No patients yet.</Empty> : (
          <>
            <div className="row flow" style={{ gap: 26 }}>
              <Stat n={cap.panel} u="adults enrolled" />
              <Stat n={cap.bookedHours} u="hours of visits and admin in the record" />
              <Stat n={cap.hoursPerPatient ?? 0} u="hours per patient so far" />
              <Stat n={cap.freeHours} u="hours left in the year" />
            </div>
            <p className="small" style={{ marginTop: 14, maxWidth: '74ch' }}>
              {overTarget ? (
                <>
                  <b style={{ color: 'var(--crit)' }}>The panel is larger than the hours.</b>{' '}
                  {cap.panel} adults against {cap.panelAtLow} to {cap.panelAtHigh} this year
                  can carry. At flat pricing that is not a revenue problem, it is a
                  time problem, and it arrives as missed response times rather than as
                  an empty diary.
                </>
              ) : (
                <>
                  {cap.panel} adults against the {cap.panelAtLow} to {cap.panelAtHigh} this
                  year can carry. Hours per patient is the figure that decides whether flat
                  pricing survives contact, and it is measured here rather than assumed.
                </>
              )}
            </p>
            <p className="small muted" style={{ marginTop: 10, maxWidth: '74ch' }}>
              Hours per patient here counts only what is in this record. A real year also
              contains the work nobody books: refills, forms, calls that do not become
              visits, and the home visits that take two and a half hours each including
              travel. Treat it as a floor.
            </p>
          </>
        )}
      </Panel>

      {me.role !== 'physician' && (
        <p className="small muted" style={{ marginTop: 16 }}>
          The working year belongs to the practice, so it is read-only from here.
        </p>
      )}
    </div>
  );
}

function Stat({ n, u }: { n: number; u: string }) {
  return (
    <div>
      <div className="num" style={{ font: '600 26px/1 var(--serif)' }}>{n}</div>
      <div className="small muted" style={{ marginTop: 4, maxWidth: '22ch' }}>{u}</div>
    </div>
  );
}
