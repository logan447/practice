/**
 * The scored questionnaires, as the objective reads them.
 *
 * A survey belongs in the objective and not in the subjective. A
 * PHQ-2 is a measurement: the patient produced it, the same way they
 * produced a home blood pressure, and it is a number with a date and
 * a scale rather than something they told you. Putting it in the
 * subjective makes it a remark; putting it here makes it comparable
 * with the last one, which is the only thing a two-item screen is
 * good for.
 *
 * Each line is the current score, the one before it in brackets, and
 * what the current one means where the instrument has a published
 * cut-off. Where it has none, none is invented and the line is just
 * the number against the last one.
 */
import type { InstrumentScore } from '../domain/types';
import { INSTRUMENTS, bandFor } from '../domain/types';
import { fmtMonthYear } from './format';

export interface SurveyLine {
  label: string;
  text: string;
  /** A positive screen, by the instrument's own published cut-off. */
  positive: boolean;
}

/** The surveys on file at a date, newest first, one line each. */
export function surveyLines(scores: InstrumentScore[], onOrBefore?: string): SurveyLine[] {
  const seen = new Set<string>();
  const out: SurveyLine[] = [];
  const rows = [...scores]
    .filter((x) => !onOrBefore || x.date <= onOrBefore)
    .sort((a, b) => b.date.localeCompare(a.date));

  for (const row of rows) {
    if (seen.has(row.instrument)) continue;
    seen.add(row.instrument);
    const spec = INSTRUMENTS.find((x) => x.id === row.instrument);
    if (!spec) continue;
    const prev = rows.find((x) => x.instrument === row.instrument && x.date < row.date);
    const band = spec.bands.length ? bandFor(row.instrument, row.score) : '';
    const positive = spec.positiveAt !== undefined && row.score >= spec.positiveAt;
    out.push({
      label: spec.label,
      positive,
      text: [
        `${row.score} of ${spec.max}`,
        prev ? `(${prev.score})` : '',
        band ? `· ${band}` : '',
        `· ${fmtMonthYear(row.date)}${prev ? ` (${fmtMonthYear(prev.date)})` : ''}`,
      ].filter(Boolean).join(' '),
    });
  }
  // The screens first, then the wellbeing measure: one is a question
  // about whether to act, the other is a number to watch.
  const order = ['PHQ-2', 'GAD-2', 'PHQ-9', 'GAD-7', 'AUDIT-C', 'Mini-Cog', 'Flourishing'];
  const rank = (l: string) => (order.indexOf(l) < 0 ? order.length : order.indexOf(l));
  return out.sort((a, b) => rank(a.label) - rank(b.label));
}

/** The block as it is written into the note. */
export function surveysText(scores: InstrumentScore[], onOrBefore?: string): string {
  const lines = surveyLines(scores, onOrBefore);
  if (lines.length === 0) return '';
  return ['Surveys', ...lines.map((l) => `${l.label}: ${l.text}`)].join('\n');
}
