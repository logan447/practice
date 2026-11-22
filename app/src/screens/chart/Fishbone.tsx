/**
 * Labs in shorthand, drawn the way they are drawn on paper.
 *
 * A fishbone is not decoration. Seven chemistry values in a skeleton
 * you have read ten thousand times is faster than seven labelled rows
 * because the position is the label, and a physician scanning for a
 * creatinine is looking at a place rather than reading a word.
 *
 * That is also why neither skeleton is captioned. "CBC" over a cross
 * and "CMP" over a skeleton tell a reader what the shape already
 * told them, and a caption over a shorthand is the one line that
 * says the shorthand did not work.
 *
 * Conventions, which vary a little by hospital and are set here to
 * the commonest form (see the note in each component):
 *
 *   CBC      Hgb                 Chem    Na | Cl | BUN \
 *       WBC --+-- Plt                    ---+----+------ Glu
 *             Hct                        K  | CO2| Cr   /
 *
 * Every value carries the one before it in brackets, because a
 * creatinine of 1.2 means nothing and a creatinine of 1.2 after 0.9
 * means something. No date is printed anywhere: hovering a value
 * gives its date, its units and the report it was resulted on, which
 * is the question a date on the screen was standing in for.
 */
import type { LabPanel } from '../../domain/types';
import { fmtDate } from '../../lib/format';

interface Reading {
  key: string;
  name: string;
  value: string;
  unit: string;
  flagged: boolean;
  when: string;
  /** The report it was resulted on. */
  source: string;
  prev?: string;
  prevWhen?: string;
}

/** The last two values of one key, newest first. */
function readings(panels: LabPanel[], key: string): Reading | undefined {
  const hits = panels
    .flatMap((p) => p.values
      .filter((v) => v.key === key)
      .map((v) => ({ v, date: p.date, source: p.name, from: p.from })))
    .sort((a, b) => b.date.localeCompare(a.date));
  if (hits.length === 0) return undefined;
  const top = hits[0];
  return {
    key,
    name: top.v.name,
    value: String(top.v.value),
    unit: top.v.unit ?? '',
    flagged: top.v.flag !== 'normal',
    when: top.date,
    source: top.from ? `${top.source}, ${top.from}` : top.source,
    prev: hits[1] ? String(hits[1].v.value) : undefined,
    prevWhen: hits[1]?.date,
  };
}

/**
 * What a reader gets for hovering a number.
 *
 * The name because the position is shorthand and shorthand is worth
 * confirming, the units because a fishbone never prints them, the
 * date and the report because "where did this number come from" is
 * the only question a printed date was answering.
 */
const tip = (r: Reading) => [
  `${r.name} ${r.value}${r.unit ? ` ${r.unit}` : ''}`,
  `${fmtDate(r.when)} · ${r.source}`,
  r.prev ? `previous ${r.prev} on ${fmtDate(r.prevWhen!)}` : '',
].filter(Boolean).join('\n');

/* ------------------------------------------------------- the drawing */

/** One number on a skeleton, with the one before it in brackets. */
function Num({ r, x, y, anchor = 'middle' }: {
  r?: Reading; x: number; y: number; anchor?: 'middle' | 'start' | 'end';
}) {
  if (!r) {
    return (
      <text className="fbnum muted" x={x} y={y} textAnchor={anchor}>&#8212;</text>
    );
  }
  return (
    <text className={`fbnum${r.flagged ? ' bad' : ''}`} x={x} y={y} textAnchor={anchor}>
      <title>{tip(r)}</title>
      {r.value}
      {r.prev && <tspan className="fbprev"> ({r.prev})</tspan>}
    </text>
  );
}

/**
 * The blood count, as a cross.
 *
 * WBC left, platelets right, haemoglobin above the bar and
 * haematocrit below it. The left and right positions are the same
 * everywhere; the top and bottom are the commonest of several local
 * conventions, so they are the two worth hovering if you have come
 * from a hospital that drew them the other way up.
 */
function Cbc({ r }: { r: (k: string) => Reading | undefined }) {
  // The numbers sit outside the arms, the way they are written by
  // hand. Drawn through them, the cross reads as a strikethrough.
  return (
    <svg className="fbsvg" width="244" height="76" viewBox="0 0 244 76" role="img"
      aria-label="Complete blood count">
      <line className="fbbone" x1="82" y1="38" x2="162" y2="38" />
      <line className="fbbone" x1="122" y1="12" x2="122" y2="64" />
      <Num r={r('WBC')} x={74} y={43} anchor="end" />
      <Num r={r('Plt')} x={170} y={43} anchor="start" />
      <Num r={r('Hgb')} x={122} y={9} />
      <Num r={r('Hct')} x={122} y={74} />
    </svg>
  );
}

/**
 * The chemistry, as a skeleton.
 *
 * Sodium, chloride and urea along the top; potassium, bicarbonate
 * and creatinine along the bottom; glucose at the point. This is the
 * grid every chem-7 is reported in, and the only part that moves
 * between hospitals is whether anything else is hung off the point.
 */
function Chem({ r }: { r: (k: string) => Reading | undefined }) {
  const cell = 76;
  const x0 = 4;
  const x1 = x0 + cell;
  const x2 = x1 + cell;
  const x3 = x2 + cell;
  const tipX = x3 + 26;
  return (
    <svg className="fbsvg" width={tipX + 72} height="76" viewBox={`0 0 ${tipX + 72} 76`}
      role="img" aria-label="Metabolic panel">
      <line className="fbbone" x1={x0} y1="38" x2={x3} y2="38" />
      <line className="fbbone" x1={x1} y1="12" x2={x1} y2="64" />
      <line className="fbbone" x1={x2} y1="12" x2={x2} y2="64" />
      <line className="fbbone" x1={x3} y1="12" x2={tipX} y2="38" />
      <line className="fbbone" x1={x3} y1="64" x2={tipX} y2="38" />
      <Num r={r('Na')} x={(x0 + x1) / 2} y={30} />
      <Num r={r('Cl')} x={(x1 + x2) / 2} y={30} />
      <Num r={r('BUN')} x={(x2 + x3) / 2} y={30} />
      <Num r={r('K')} x={(x0 + x1) / 2} y={57} />
      <Num r={r('CO2')} x={(x1 + x2) / 2} y={57} />
      <Num r={r('Cr')} x={(x2 + x3) / 2} y={57} />
      <Num r={r('Glu')} x={tipX + 8} y={43} anchor="start" />
    </svg>
  );
}

export function Fishbone({ panels }: { panels: LabPanel[] }) {
  const r = (k: string) => readings(panels, k);
  const hasCbc = ['WBC', 'Hgb', 'Hct', 'Plt'].some((k) => r(k));
  const hasChem = ['Na', 'K', 'Cl', 'CO2', 'BUN', 'Cr', 'Glu'].some((k) => r(k));
  if (!hasCbc && !hasChem) return null;
  return (
    <div className="fishbones">
      {hasCbc && <Cbc r={r} />}
      {hasChem && <Chem r={r} />}
    </div>
  );
}

/* ---------------------------------------------------- everything else */

/**
 * Every other resulted value, listed and nothing more.
 *
 * Name and number. No group headings, no dates, no sentence saying
 * what a lipid panel is: this is a list a physician reads in one
 * sweep looking for the one they came for, and every word that is
 * not a name or a number is a word in the way of that. Hovering one
 * gives the date and the report, the same as on a skeleton.
 *
 * Ordered by what this practice acts on: the two numbers a lifestyle
 * and prevention practice runs on first, then the rest as resulted.
 */
const DRAWN = new Set([
  'WBC', 'Hgb', 'Hct', 'Plt', 'Na', 'K', 'Cl', 'CO2', 'BUN', 'Cr', 'Glu',
]);
const FIRST = ['A1c', 'LDL', 'HDL', 'TG', 'TC', 'TSH', 'FT4'];

export function OtherLabs({ panels }: { panels: LabPanel[] }) {
  const seen = new Set<string>();
  const rest: Reading[] = [];
  for (const p of [...panels].sort((a, b) => b.date.localeCompare(a.date))) {
    for (const v of p.values) {
      if (DRAWN.has(v.key) || seen.has(v.key)) continue;
      seen.add(v.key);
      const read = readings(panels, v.key);
      if (read) rest.push(read);
    }
  }
  if (rest.length === 0) return null;
  const rank = (k: string) => (FIRST.indexOf(k) < 0 ? FIRST.length : FIRST.indexOf(k));
  rest.sort((a, b) => rank(a.key) - rank(b.key));
  return (
    <div className="otherlabs">
      {rest.map((x) => (
        <span key={x.key} className={`olitem${x.flagged ? ' bad' : ''}`} title={tip(x)}>
          <span className="olname">{x.name}</span> {x.value}
          {x.prev && <span className="fbprev"> ({x.prev})</span>}
        </span>
      ))}
    </div>
  );
}
