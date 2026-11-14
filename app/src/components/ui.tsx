/** Shared presentational pieces. No clinical logic lives here. */
import type { ReactNode } from 'react';
import type { Patient, ResultFlag, ResultSeries, Author } from '../domain/types';
import { Portrait } from './Portrait';

export function Avatar({ patient, lg }: { patient: Patient; lg?: boolean }) {
  return <Portrait patient={patient} size={lg ? 54 : 34} />;
}

export function Panel({
  title, right, children, flush, eyebrow,
}: { title?: string; right?: ReactNode; children: ReactNode; flush?: boolean; eyebrow?: string }) {
  return (
    <section className="panel">
      {title && (
        <header>
          <div>
            {eyebrow && <div className="eyebrow" style={{ marginBottom: 4 }}>{eyebrow}</div>}
            <h2>{title}</h2>
          </div>
          {right && <div className="right">{right}</div>}
        </header>
      )}
      <div className={`body${flush ? ' flush' : ''}`}>{children}</div>
    </section>
  );
}

export function Chip({ tone, children }: { tone?: string; children: ReactNode }) {
  return <span className={`chip${tone ? ` ${tone}` : ''}`}>{children}</span>;
}

const FLAG_TONE: Record<ResultFlag, string> = {
  normal: 'ok', low: 'warn', high: 'warn', critical: 'crit',
};

export function FlagChip({ flag }: { flag: ResultFlag }) {
  const label = flag === 'normal' ? 'Normal' : flag === 'critical' ? 'Critical' : flag === 'high' ? 'High' : 'Low';
  return <Chip tone={FLAG_TONE[flag]}><span className="dot" />{label}</Chip>;
}

const AUTHOR_LABEL: Record<Author, string> = {
  clinician: 'Recorded by', patient: 'Reported by', source: 'From', ai: 'Drafted by',
};

/** Provenance is shown, always. Nothing in the chart is unattributed. */
export function Prov({ author, by }: { author: Author; by: string }) {
  return <span className="prov">{AUTHOR_LABEL[author]} {by}</span>;
}

/**
 * Sparkline with a reference band and, where one exists, the agreed
 * target. Scaled to the data plus the band so the band is always visible.
 */
export function Trend({ series, w = 190, h = 44 }: { series: ResultSeries; w?: number; h?: number }) {
  const pts = series.points;
  if (pts.length < 2) return <span className="muted small">Not enough data</span>;

  const vals = pts.map((p) => p.value);
  const candidates = [...vals];
  if (series.refLow !== undefined) candidates.push(series.refLow);
  if (series.refHigh !== undefined) candidates.push(series.refHigh);
  let lo = Math.min(...candidates);
  let hi = Math.max(...candidates);
  const pad = (hi - lo) * 0.18 || Math.abs(hi * 0.1) || 1;
  lo -= pad; hi += pad;

  const x = (i: number) => (i / (pts.length - 1)) * (w - 4) + 2;
  const y = (v: number) => h - 4 - ((v - lo) / (hi - lo)) * (h - 8);

  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');
  const last = pts[pts.length - 1];

  const bandTop = series.refHigh !== undefined ? y(series.refHigh) : 2;
  const bandBottom = series.refLow !== undefined ? y(series.refLow) : h - 2;

  return (
    <svg className="trend" viewBox={`0 0 ${w} ${h}`} width={w} height={h} role="img"
      aria-label={`${series.name} trend, latest ${last.value} ${series.unit}`}>
      {series.refHigh !== undefined && bandTop > 1 && bandTop < h - 1 && (
        <line x1="0" x2={w} y1={bandTop} y2={bandTop}
          stroke="var(--line)" strokeWidth="1" strokeDasharray="3 3" />
      )}
      {series.refLow !== undefined && bandBottom > 1 && bandBottom < h - 1 && (
        <line x1="0" x2={w} y1={bandBottom} y2={bandBottom}
          stroke="var(--line)" strokeWidth="1" strokeDasharray="3 3" />
      )}
      {series.target && (() => {
        const ty = y(series.target.value);
        return ty > 1 && ty < h - 1 ? (
          <line x1="0" x2={w} y1={ty} y2={ty}
            stroke="var(--accent-line)" strokeWidth="1.25" strokeDasharray="5 3" />
        ) : null;
      })()}
      <path d={line} fill="none"
        stroke={series.source === 'patient' ? 'var(--info)' : 'var(--accent)'}
        strokeWidth="1.75" strokeDasharray={series.source === 'patient' ? '4 2.5' : undefined}
        strokeLinejoin="round" strokeLinecap="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={x(i)} cy={y(p.value)} r={i === pts.length - 1 ? 3.2 : 1.9}
          fill={p.flag !== 'normal' ? 'var(--warn)'
            : series.source === 'patient' ? 'var(--info)' : 'var(--accent)'} />
      ))}
    </svg>
  );
}

export function Metric({ value, unit }: { value: number | string; unit?: string }) {
  return (
    <div className="metric">
      <span className="v num">{value}</span>
      {unit && <span className="u">{unit}</span>}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>;
}
