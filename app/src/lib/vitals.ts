/**
 * Vitals, read the way the labs are read.
 *
 * A blood pressure is a lab value that happens to be taken in the
 * room: it means nothing alone and something against the one before
 * it, and the thing a reader needs to know about it is which cuff it
 * came off. So it is written the same way: the current number, the
 * one before it in brackets, the months under it, and "home" on the
 * ones the patient took.
 *
 * Office and home are never mixed into one series. They are
 * different measurements, and a reader who could not tell them apart
 * would average them.
 */
import type { ResultSeries, VitalsSet } from '../domain/types';
import { fmtMonthYear } from './format';

interface Item {
  label: string;
  value: string;
  prev?: string;
  when: string;
  prevWhen?: string;
  home?: boolean;
}

const esc = (t: string) => t
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const stamp = (it: Item) => fmtMonthYear(it.when)
  + (it.prevWhen ? ` (${fmtMonthYear(it.prevWhen)})` : '');

/** The office vitals, newest two, and whatever the patient measured. */
export function vitalItems(vitals: VitalsSet[], series: ResultSeries[] = []): Item[] {
  const office = [...vitals].filter((v) => v.source === 'office')
    .sort((a, b) => b.date.localeCompare(a.date));
  const home = [...vitals].filter((v) => v.source === 'home')
    .sort((a, b) => b.date.localeCompare(a.date));
  const out: Item[] = [];

  const pair = (
    label: string, rows: VitalsSet[], read: (v: VitalsSet) => string | undefined,
    isHome = false,
  ) => {
    const now = rows.find((v) => read(v));
    if (!now) return;
    const before = rows.find((v) => v.date < now.date && read(v));
    out.push({
      label,
      value: read(now)!,
      prev: before ? read(before) : undefined,
      when: now.date,
      prevWhen: before?.date,
      home: isHome,
    });
  };

  const bp = (v: VitalsSet) => (v.systolic ? `${v.systolic}/${v.diastolic}` : undefined);
  pair('BP', office, bp);
  pair('HR', office, (v) => (v.heartRate ? String(v.heartRate) : undefined));
  pair('Weight', office, (v) => (v.weightLb ? `${v.weightLb} lb` : undefined));
  pair('BMI', office, (v) => (v.bmi ? String(v.bmi) : undefined));
  pair('BP', home, bp, true);

  for (const s of series) {
    const pts = [...s.points].sort((a, b) => a.date.localeCompare(b.date));
    const now = pts[pts.length - 1];
    if (!now) continue;
    const before = pts[pts.length - 2];
    out.push({
      label: s.name, value: `${now.value} ${s.unit}`,
      prev: before ? String(before.value) : undefined,
      when: now.date, prevWhen: before?.date, home: true,
    });
  }
  return out;
}

/** The row, as markup. Same shape as the labs that follow it. */
export function vitalsHtml(vitals: VitalsSet[], series: ResultSeries[] = []): string {
  const items = vitalItems(vitals, series);
  if (items.length === 0) return '';
  return '<div class="otherlabs vitalrow">'
    + items.map((it) => '<span class="olitem">'
      + `<span class="olval"><span class="olname">${esc(it.label)}</span> ${esc(it.value)}`
      + (it.prev ? `<span class="fbprev"> (${esc(it.prev)})</span>` : '')
      + (it.home ? '<span class="athome"> home</span>' : '')
      + `</span><span class="fbstamp">${esc(stamp(it))}</span></span>`).join('')
    + '</div>';
}

/** The same thing as a sentence, for anything that stores prose. */
export function vitalsText(vitals: VitalsSet[], series: ResultSeries[] = []): string {
  const items = vitalItems(vitals, series);
  if (items.length === 0) return '';
  return `Vitals — ${items.map((it) => `${it.label} ${it.value}${
    it.prev ? ` (${it.prev})` : ''}${it.home ? ' home' : ''}`).join(' · ')}`;
}
