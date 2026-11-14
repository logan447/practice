/**
 * The clock, in the bar.
 *
 * Moving time is the only way to see a longitudinal practice behave:
 * labs come back, prevention goes overdue, patients log things while
 * you are away. What changed is reported rather than left to be
 * discovered, because silent state changes are how people stop
 * trusting a system.
 */
import { useEffect, useState } from 'react';
import { useStore } from '../lib/store';
import { fmtDate } from '../lib/format';
import { ORIGIN } from '../lib/clock';

export function ClockBar() {
  const st = useStore();
  const [flash, setFlash] = useState<string[] | null>(null);

  useEffect(() => {
    if (st.lastEvents.length === 0) return;
    setFlash(st.lastEvents);
    const t = setTimeout(() => setFlash(null), 6000);
    return () => clearTimeout(t);
  }, [st.lastEvents]);

  const moved = st.now !== ORIGIN;

  return (
    <div className="clockbar">
      <span className="date num" title="The clinic's today">{fmtDate(st.now)}</span>
      <button className="btn quiet sm" onClick={() => st.advanceTime(1)} title="Advance one day (.)">+1d</button>
      <button className="btn quiet sm" onClick={() => st.advanceTime(7)}>+1w</button>
      <button className="btn quiet sm" onClick={() => st.advanceTime(30)}>+1m</button>
      {moved && (
        <button className="btn quiet sm" onClick={st.resetTime} title="Back to the start">reset</button>
      )}
      {flash && flash.length > 0 && (
        <span className="clockflash">
          {flash.slice(0, 3).join(' · ')}
          {flash.length > 3 && ` · +${flash.length - 3} more`}
        </span>
      )}
    </div>
  );
}
