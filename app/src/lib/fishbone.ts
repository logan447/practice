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
import type { LabPanel } from '../domain/types';
import { fmtDate } from './format';

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

const esc = (t: string) => t
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

/**
 * One number on a skeleton, with the one before it in brackets.
 *
 * Built as markup rather than as an element so that one definition
 * of each skeleton serves the screen and the printed note. An SVG
 * `<title>` is a native tooltip either way, so the screen loses
 * nothing by it, and a fax has no pointer to hover with, which is
 * why the date is also printed under the skeletons.
 */
function num(r: Reading | undefined, x: number, y: number, anchor = 'middle'): string {
  if (!r) {
    return `<text class="fbnum muted" x="${x}" y="${y}" text-anchor="${anchor}">—</text>`;
  }
  return `<text class="fbnum${r.flagged ? ' bad' : ''}" x="${x}" y="${y}" text-anchor="${anchor}">`
    + `<title>${esc(tip(r))}</title>${esc(r.value)}`
    + (r.prev ? `<tspan class="fbprev"> (${esc(r.prev)})</tspan>` : '')
    + '</text>';
}

/**
 * The blood count, as a cross.
 *
 * WBC left, platelets right, haemoglobin above the bar and
 * haematocrit below it. The left and right positions are the same
 * everywhere; the top and bottom are the commonest of several local
 * conventions. The numbers sit outside the arms, the way they are
 * written by hand: drawn through them, the cross reads as a
 * strikethrough.
 */
const cbcSvg = (r: (k: string) => Reading | undefined): string => `
  <svg class="fbsvg" width="244" height="76" viewBox="0 0 244 76" role="img"
    aria-label="Complete blood count">
    <line class="fbbone" x1="82" y1="38" x2="162" y2="38" />
    <line class="fbbone" x1="122" y1="12" x2="122" y2="64" />
    ${num(r('WBC'), 74, 43, 'end')}
    ${num(r('Plt'), 170, 43, 'start')}
    ${num(r('Hgb'), 122, 9)}
    ${num(r('Hct'), 122, 74)}
  </svg>`;

/**
 * The chemistry, as a skeleton.
 *
 * Sodium, chloride and urea along the top; potassium, bicarbonate
 * and creatinine along the bottom; glucose at the point. This is the
 * grid every chem-7 is reported in.
 */
function chemSvg(r: (k: string) => Reading | undefined): string {
  const cell = 76;
  const x0 = 4;
  const x1 = x0 + cell;
  const x2 = x1 + cell;
  const x3 = x2 + cell;
  const tipX = x3 + 26;
  const w = tipX + 72;
  return `
    <svg class="fbsvg" width="${w}" height="76" viewBox="0 0 ${w} 76" role="img"
      aria-label="Metabolic panel">
      <line class="fbbone" x1="${x0}" y1="38" x2="${x3}" y2="38" />
      <line class="fbbone" x1="${x1}" y1="12" x2="${x1}" y2="64" />
      <line class="fbbone" x1="${x2}" y1="12" x2="${x2}" y2="64" />
      <line class="fbbone" x1="${x3}" y1="12" x2="${tipX}" y2="38" />
      <line class="fbbone" x1="${x3}" y1="64" x2="${tipX}" y2="38" />
      ${num(r('Na'), (x0 + x1) / 2, 30)}
      ${num(r('Cl'), (x1 + x2) / 2, 30)}
      ${num(r('BUN'), (x2 + x3) / 2, 30)}
      ${num(r('K'), (x0 + x1) / 2, 57)}
      ${num(r('CO2'), (x1 + x2) / 2, 57)}
      ${num(r('Cr'), (x2 + x3) / 2, 57)}
      ${num(r('Glu'), tipX + 8, 43, 'start')}
    </svg>`;
}

const CBC_KEYS = ['WBC', 'Hgb', 'Hct', 'Plt'];
const CHEM_KEYS = ['Na', 'K', 'Cl', 'CO2', 'BUN', 'Cr', 'Glu'];

/**
 * The skeletons, and the date they were drawn from.
 *
 * A fishbone prints no units and no dates, which is the whole speed
 * of it, but a lab value with no date on a page that will be read by
 * somebody else is a value they cannot act on. The date goes under
 * the drawing in small type: subtle enough to scan past, there when
 * the question is asked.
 */
export function fishboneHtml(panels: LabPanel[]): string {
  const r = (k: string) => readings(panels, k);
  const hasCbc = CBC_KEYS.some((k) => r(k));
  const hasChem = CHEM_KEYS.some((k) => r(k));
  if (!hasCbc && !hasChem) return '';
  const drawn = [...CBC_KEYS, ...CHEM_KEYS].map(r).filter(Boolean) as Reading[];
  const when = drawn.map((x) => x.when).sort().pop();
  return `<div class="fishbones">${hasCbc ? cbcSvg(r) : ''}${hasChem ? chemSvg(r) : ''}`
    + `${when ? `<span class="fbwhen">${esc(fmtDate(when))}</span>` : ''}</div>`;
}

/* ---------------------------------------------------- everything else */

const DRAWN = new Set([...CBC_KEYS, ...CHEM_KEYS]);
const FIRST = ['A1c', 'LDL', 'HDL', 'TG', 'TC', 'TSH', 'FT4'];

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
export function otherLabsHtml(panels: LabPanel[]): string {
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
  if (rest.length === 0) return '';
  const rank = (k: string) => (FIRST.indexOf(k) < 0 ? FIRST.length : FIRST.indexOf(k));
  rest.sort((a, b) => rank(a.key) - rank(b.key));
  const when = rest.map((x) => x.when).sort().pop();
  return '<div class="otherlabs">'
    + rest.map((x) => `<span class="olitem${x.flagged ? ' bad' : ''}" title="${esc(tip(x))}">`
      + `<span class="olname">${esc(x.name)}</span> ${esc(x.value)}`
      + (x.prev ? `<span class="fbprev"> (${esc(x.prev)})</span>` : '')
      + '</span>').join('')
    + `${when ? `<span class="fbwhen">${esc(fmtDate(when))}</span>` : ''}</div>`;
}

/** Both, in the order they are read: the skeletons, then the rest. */
export const labsHtml = (panels: LabPanel[]): string =>
  fishboneHtml(panels) + otherLabsHtml(panels);
