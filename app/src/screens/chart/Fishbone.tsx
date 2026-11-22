/**
 * Labs in shorthand, the way they are written on paper.
 *
 * A fishbone is not decoration. Seven chemistry values in a skeleton
 * you have read ten thousand times is faster than seven labelled rows
 * because the position is the label, and a physician scanning for a
 * creatinine is looking at a place rather than reading a word.
 *
 * Every value carries the one before it in brackets, because a
 * creatinine of 1.2 means nothing and a creatinine of 1.2 after 0.9
 * means something. Hovering either one gives its date; the dates are
 * also printed once under each group, so the information is not
 * locked behind a pointer.
 */
import type { LabPanel } from '../../domain/types';
import { fmtDate } from '../../lib/format';

interface Reading {
  value: string;
  flagged: boolean;
  when: string;
  prev?: string;
  prevWhen?: string;
}

/** The last two values of one key, newest first. */
function readings(panels: LabPanel[], key: string): Reading | undefined {
  const hits = panels
    .flatMap((p) => p.values.filter((v) => v.key === key).map((v) => ({ v, date: p.date })))
    .sort((a, b) => b.date.localeCompare(a.date));
  if (hits.length === 0) return undefined;
  return {
    value: String(hits[0].v.value),
    flagged: hits[0].v.flag !== 'normal',
    when: hits[0].date,
    prev: hits[1] ? String(hits[1].v.value) : undefined,
    prevWhen: hits[1]?.date,
  };
}

function Val({ r }: { r?: Reading }) {
  if (!r) return <span className="fbval muted">&mdash;</span>;
  return (
    <span className={`fbval${r.flagged ? ' bad' : ''}`}
      title={`${r.value} on ${fmtDate(r.when)}${
        r.prev ? ` · ${r.prev} on ${fmtDate(r.prevWhen!)}` : ''}`}>
      {r.value}
      {r.prev && <span className="fbprev"> ({r.prev})</span>}
    </span>
  );
}

export function Fishbone({ panels }: { panels: LabPanel[] }) {
  const r = (k: string) => readings(panels, k);
  const cbc = ['WBC', 'Hgb', 'Hct', 'Plt'].map(r);
  const cmp = ['Na', 'K', 'Cl', 'CO2', 'BUN', 'Cr', 'Glu'].map(r);
  const hasCbc = cbc.some(Boolean);
  const hasCmp = cmp.some(Boolean);

  const line = (label: string, keys: string[]) => {
    const vals = keys.map((k) => ({ k, v: r(k) })).filter((x) => x.v);
    if (vals.length === 0) return null;
    return (
      <div key={label} className="fbline">
        <span className="fblabel">{label}</span>
        {vals.map(({ k, v }) => (
          <span key={k} className="fbpair">
            <span className="fbk">{k}</span> <Val r={v} />
          </span>
        ))}
        <span className="fbwhen">{fmtDate(vals[0].v!.when)}</span>
      </div>
    );
  };

  if (!hasCbc && !hasCmp && !r('A1c') && !r('TSH') && !r('LDL')) return null;

  return (
    <div className="fishbones">
      <div className="fbrow">
        {hasCbc && (
          <div className="fb cbc" title="Complete blood count">
            <span className="fbw">{<Val r={cbc[0]} />}</span>
            <span className="fbn">{<Val r={cbc[1]} />}</span>
            <span className="fbs">{<Val r={cbc[2]} />}</span>
            <span className="fbe">{<Val r={cbc[3]} />}</span>
            <span className="fbcap">CBC</span>
          </div>
        )}
        {hasCmp && (
          <div className="fb cmp" title="Comprehensive metabolic panel">
            <span className="c1"><Val r={cmp[0]} /></span>
            <span className="c2"><Val r={cmp[2]} /></span>
            <span className="c3"><Val r={cmp[4]} /></span>
            <span className="c4"><Val r={cmp[6]} /></span>
            <span className="c5"><Val r={cmp[1]} /></span>
            <span className="c6"><Val r={cmp[3]} /></span>
            <span className="c7"><Val r={cmp[5]} /></span>
            <span className="fbcap">CMP</span>
          </div>
        )}
      </div>

      {line('Lipids', ['TC', 'LDL', 'HDL', 'TG'])}
      {line('A1c', ['A1c'])}
      {line('Thyroid', ['TSH', 'FT4'])}
    </div>
  );
}

/** Everything that is not in one of the shorthands, listed plainly. */
export function OtherLabs({ panels }: { panels: LabPanel[] }) {
  const shown = new Set([
    'WBC', 'Hgb', 'Hct', 'Plt', 'Na', 'K', 'Cl', 'CO2', 'BUN', 'Cr', 'Glu',
    'TC', 'LDL', 'HDL', 'TG', 'A1c', 'TSH', 'FT4',
  ]);
  const seen = new Set<string>();
  const rest: { key: string; name: string; value: string; unit: string; when: string }[] = [];
  for (const p of [...panels].sort((a, b) => b.date.localeCompare(a.date))) {
    for (const v of p.values) {
      if (shown.has(v.key) || seen.has(v.key)) continue;
      seen.add(v.key);
      rest.push({ key: v.key, name: v.name, value: String(v.value), unit: v.unit, when: p.date });
    }
  }
  if (rest.length === 0) return null;
  return (
    <div className="otherlabs">
      {rest.map((x) => (
        <span key={x.key} className="olitem" title={fmtDate(x.when)}>
          {x.name} {x.value}{x.unit ? ` ${x.unit}` : ''}
        </span>
      ))}
    </div>
  );
}
