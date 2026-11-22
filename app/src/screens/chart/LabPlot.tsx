/**
 * One measurement, over time.
 *
 * A column of numbers and a date beside each is a trend only if the
 * reader does the arithmetic. A creatinine that has gone 0.9, 0.95,
 * 1.1, 1.4 over two years is a different patient from one that has
 * bounced between 0.9 and 1.4 the whole time, and the two columns
 * look identical.
 *
 * Plotted against real time, not against the row number: three draws
 * in a week and one a year later are four evenly spaced points on an
 * index axis, which is a picture of a trend that did not happen.
 *
 * One series, so no legend: the heading of the drawer names it. The
 * reference range is a band behind the line rather than two more
 * lines on it, because it is the context the line is read against
 * and not a thing being compared. Points outside it are drawn in the
 * warning colour AND carry their value on the hover, never colour
 * alone.
 */
import { useState } from 'react';
import { fmtDate } from '../../lib/format';

export interface PlotPoint {
  date: string;
  value: number;
  flag?: string;
}

const W = 540;
const H = 190;
const PAD = { top: 14, right: 16, bottom: 26, left: 46 };

/** Nice round steps, so the axis reads 0, 50, 100 rather than 3, 51.5, 100. */
function ticks(lo: number, hi: number): number[] {
  const span = hi - lo;
  if (span <= 0) return [lo];
  // Four bands rather than three: a creatinine over a 0.5 to 1.1
  // reference range was getting a step of 0.5, which is two labels
  // on the whole axis and no sense of where in the range it sits.
  const raw = span / 4;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? mag * 10;
  const out: number[] = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) out.push(Number(v.toFixed(6)));
  return out;
}

export function LabPlot({ name, unit, points, refLow, refHigh, source }: {
  name: string;
  unit?: string;
  points: PlotPoint[];
  refLow?: number;
  refHigh?: number;
  /** A patient-measured series is drawn dashed: different provenance. */
  source?: 'clinical' | 'patient';
}) {
  const [near, setNear] = useState<number | null>(null);

  const pts = [...points]
    .filter((p) => Number.isFinite(p.value))
    .sort((a, b) => a.date.localeCompare(b.date));

  if (pts.length === 0) return <p className="muted">Nothing recorded yet.</p>;
  if (pts.length === 1) {
    return (
      <p className="muted">
        One reading only, {pts[0].value}{unit ? ` ${unit}` : ''} on {fmtDate(pts[0].date)}.
        A trend needs a second.
      </p>
    );
  }

  const t = (d: string) => Date.parse(`${d}T12:00:00`);
  const t0 = t(pts[0].date);
  const t1 = t(pts[pts.length - 1].date);
  const span = Math.max(t1 - t0, 1);

  const vals = pts.map((p) => p.value);
  const bounds = [...vals];
  if (refLow !== undefined) bounds.push(refLow);
  if (refHigh !== undefined) bounds.push(refHigh);
  let lo = Math.min(...bounds);
  let hi = Math.max(...bounds);
  const pad = (hi - lo) * 0.16 || Math.abs(hi * 0.12) || 1;
  lo -= pad; hi += pad;

  const x = (d: string) => PAD.left + ((t(d) - t0) / span) * (W - PAD.left - PAD.right);
  const y = (v: number) => H - PAD.bottom - ((v - lo) / (hi - lo)) * (H - PAD.top - PAD.bottom);

  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${x(p.date).toFixed(1)},${y(p.value).toFixed(1)}`)
    .join(' ');

  const bandTop = refHigh !== undefined ? y(refHigh) : PAD.top;
  const bandBottom = refLow !== undefined ? y(refLow) : H - PAD.bottom;
  const hasBand = refLow !== undefined || refHigh !== undefined;

  const yTicks = ticks(lo, hi);
  const shown = near !== null ? pts[near] : pts[pts.length - 1];

  /** The point nearest the pointer, so the hit target is the whole column. */
  const track = (e: React.MouseEvent<SVGSVGElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - box.left) / box.width) * W;
    let best = 0;
    let gap = Infinity;
    pts.forEach((p, i) => {
      const d = Math.abs(x(p.date) - px);
      if (d < gap) { gap = d; best = i; }
    });
    setNear(best);
  };

  return (
    <div className="labplot">
      <svg viewBox={`0 0 ${W} ${H}`} className="labplotsvg" role="img"
        aria-label={`${name} over time, ${pts.length} readings, latest ${
          pts[pts.length - 1].value}${unit ? ` ${unit}` : ''} on ${
          fmtDate(pts[pts.length - 1].date)}`}
        onMouseMove={track} onMouseLeave={() => setNear(null)}>

        {/* The reference range, behind everything. Context, not a series. */}
        {hasBand && (
          <rect className="lpband" x={PAD.left} y={Math.max(bandTop, PAD.top)}
            width={W - PAD.left - PAD.right}
            height={Math.max(Math.min(bandBottom, H - PAD.bottom) - Math.max(bandTop, PAD.top), 0)} />
        )}

        {yTicks.map((v) => (
          <g key={v}>
            <line className="lpgrid" x1={PAD.left} x2={W - PAD.right} y1={y(v)} y2={y(v)} />
            <text className="lpaxis" x={PAD.left - 8} y={y(v) + 4} textAnchor="end">{v}</text>
          </g>
        ))}

        <line className="lpaxisline" x1={PAD.left} x2={W - PAD.right}
          y1={H - PAD.bottom} y2={H - PAD.bottom} />
        <text className="lpaxis" x={PAD.left} y={H - 8} textAnchor="start">
          {fmtDate(pts[0].date)}
        </text>
        <text className="lpaxis" x={W - PAD.right} y={H - 8} textAnchor="end">
          {fmtDate(pts[pts.length - 1].date)}
        </text>

        {/* Where the pointer is, so a reader can put the value on a date. */}
        {near !== null && (
          <line className="lpcross" x1={x(pts[near].date)} x2={x(pts[near].date)}
            y1={PAD.top} y2={H - PAD.bottom} />
        )}

        <path className={`lpline${source === 'patient' ? ' patient' : ''}`} d={line} />

        {pts.map((p, i) => (
          <circle key={p.date}
            className={`lpdot${p.flag && p.flag !== 'normal' ? ' bad' : ''}${
              near === i ? ' on' : ''}`}
            cx={x(p.date)} cy={y(p.value)} r={near === i ? 5 : 4} />
        ))}
      </svg>

      {/*
        * The read-out under the plot rather than a floating tooltip:
        * a box that follows the pointer covers the line it is about,
        * and on a trend of six points it covers most of them.
        */}
      <p className="lpread">
        <b>{shown.value}{unit ? ` ${unit}` : ''}</b>
        {' on '}{fmtDate(shown.date)}
        {shown.flag && shown.flag !== 'normal' && <span className="lpflag"> {shown.flag}</span>}
        {hasBand && (
          <span className="muted">
            {'  ·  reference '}
            {refLow !== undefined ? refLow : ''}
            {refLow !== undefined && refHigh !== undefined ? '–' : ''}
            {refHigh !== undefined ? refHigh : ''}
            {unit ? ` ${unit}` : ''}
          </span>
        )}
      </p>
    </div>
  );
}
