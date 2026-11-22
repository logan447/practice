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
  id: string;
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
      id: spec.id,
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
  /*
   * The short screen is asked every visit; the long one only when
   * the short one was positive.
   *
   * A PHQ-9 on a patient whose PHQ-2 was negative is nine questions
   * nobody needed to ask, and a note carrying both every time is a
   * note where the escalation means nothing. So the long form is
   * shown when its own screen is positive, and otherwise left out
   * even if a score for it is on file from some earlier visit.
   */
  const positive = (id: string) => out.some((x) => x.id === id && x.positive);
  const kept = out.filter((x) => {
    if (x.id === 'phq-9') return positive('phq-2');
    if (x.id === 'gad-7') return positive('gad-2');
    return true;
  });

  // The two short screens with whatever they escalated to, then what
  // is being taken, then the one number that is not a screen at all.
  const order = [
    'phq-2', 'phq-9', 'gad-2', 'gad-7',
    'audit-c', 'tobacco', 'drug-use', 'mini-cog', 'flourishing',
  ];
  const rank = (id: string) => (order.indexOf(id) < 0 ? order.length : order.indexOf(id));
  return kept.sort((a, b) => rank(a.id) - rank(b.id));
}

/** The block as it is written into the note. */
export function surveysText(scores: InstrumentScore[], onOrBefore?: string): string {
  const lines = surveyLines(scores, onOrBefore);
  if (lines.length === 0) return '';
  return ['Surveys', ...lines.map((l) => `${l.label}: ${l.text}`)].join('\n');
}
