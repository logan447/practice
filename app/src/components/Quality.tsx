/**
 * Where the record disagrees with itself.
 *
 * Collapsed to a single line until there is something to say, because
 * a warning strip that is always on is a warning strip nobody reads.
 * Open, it is specific: which two entries conflict, who sent each, and
 * what to do before acting on either.
 *
 * This is the part of the design that only has a job because the data
 * is dirty. On a clean fixture panel it would look like dead weight.
 */
import { useState } from 'react';
import type { Issue } from '../lib/dataQuality';
import type { ChartTab } from '../lib/nav';

export function QualityStrip({ issues, onGo }: {
  issues: Issue[];
  onGo: (tab: ChartTab) => void;
}) {
  const [open, setOpen] = useState(false);
  if (issues.length === 0) return null;

  const crit = issues.filter((i) => i.level === 'crit').length;

  return (
    <div className={`quality${crit ? ' crit' : ''}`}>
      <button className="qhead" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span className="qdot" />
        <strong>
          {issues.length} thing{issues.length > 1 ? 's' : ''} to reconcile
        </strong>
        {crit > 0 && <span className="chip crit">{crit} before prescribing</span>}
        <span className="spacer" />
        <span className="small muted">{open ? 'Hide' : 'Show'}</span>
      </button>

      {open && (
        <div className="qlist">
          {issues.map((i) => (
            <div key={i.id} className={`qrow ${i.level}`}>
              <div className="qtitle">{i.title}</div>
              <p className="small">{i.detail}</p>
              {i.tab && (
                <button className="btn quiet sm" onClick={() => onGo(i.tab as ChartTab)}>
                  Open {i.tab === 'records' ? 'records' : i.tab}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
