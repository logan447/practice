/**
 * What changed when time moved.
 *
 * The clock used to sit in the bar over every screen with three
 * buttons beside it. It is a prototype control rather than part of
 * the practice, so it is in the command palette now and nothing of it
 * is on screen until it is used. This is the part that still has to
 * be: a silent state change is how people stop trusting a system, so
 * when a week passes and four things happen, it says which four.
 */
import { useEffect, useState } from 'react';
import { useStore } from '../lib/store';

export function ClockFlash() {
  const st = useStore();
  const [flash, setFlash] = useState<string[] | null>(null);

  useEffect(() => {
    if (st.lastEvents.length === 0) return undefined;
    setFlash(st.lastEvents);
    const t = setTimeout(() => setFlash(null), 7000);
    return () => clearTimeout(t);
  }, [st.lastEvents]);

  if (!flash || flash.length === 0) return null;

  return (
    <div className="clockflash" role="status">
      <span className="cfwhen">{st.now}</span>
      <span>
        {flash.slice(0, 4).join(' · ')}
        {flash.length > 4 && ` · +${flash.length - 4} more`}
      </span>
      <button className="cfx" onClick={() => setFlash(null)} aria-label="Dismiss">&times;</button>
    </div>
  );
}
