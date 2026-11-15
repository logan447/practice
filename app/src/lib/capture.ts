/**
 * Getting words into the document without typing them.
 *
 * Two ways in, and they are the only real difference between the two
 * activities on the schedule. In a visit the words come from the
 * room: someone else is talking and the capture is listening to a
 * conversation it was not part of. In a care plan review the words
 * come from the physician reading the chart and saying what they
 * think, which is dictation and a different thing entirely.
 *
 * Both land in the same document and both are wrong sometimes. The
 * visit script lives in `ambient.ts` with its deliberate errors; this
 * file adds the dictation side and the small amount of shared
 * machinery that lets either one stream into the working copy.
 *
 * The dictation is not scripted fiction the way the ambient visit is.
 * It is assembled from this patient's own problems, because a review
 * is the physician going down the list, and a canned paragraph about
 * somebody else's hypertension would teach nothing.
 */
import type { Condition } from '../domain/types';
import type { ProblemSummary } from './subjective';

export interface DictationLine {
  at: number;
  /** Where it lands: a condition id, or one of the document's own fields. */
  target: string;
  text: string;
}

const OPENERS = [
  'Reviewed everything on file since the last approval.',
  'Went through the chart from the last version forward.',
  'Read the whole record since we last published.',
];

/**
 * What a physician says out loud going down a problem list.
 *
 * One line per problem, keyed off the goal status so the dictation
 * says something different about a problem that is going well and one
 * that is not. Still generic: the point is the mechanism, and the
 * physician rewrites it, which is what the edit tracking measures.
 */
function lineFor(pr: ProblemSummary): string {
  const needsWork = pr.goal !== 'at-goal';
  const stuck = pr.interventions.filter((iv) => iv.status === 'needs-attention');
  if (needsWork && stuck.length > 0) {
    return `${pr.name}: not where we want it. The part that is not moving is ${
      stuck.map((iv) => iv.label.toLowerCase()).slice(0, 2).join(' and ')
    }. Worth one change rather than three.`;
  }
  if (needsWork) {
    return `${pr.name}: still short of goal, and nothing on the list is obviously failing. `
      + 'Needs a conversation rather than a dose change.';
  }
  return `${pr.name}: holding. No change, keep the same review interval.`;
}

/**
 * The dictated review, as it would arrive.
 *
 * Timings are deliberately quick. A demo that makes somebody wait
 * sixty seconds to see the mechanism is not demonstrating the
 * mechanism, it is demonstrating waiting.
 */
export function dictationScript(
  problems: ProblemSummary[], conditions: Condition[],
): DictationLine[] {
  const out: DictationLine[] = [];
  let at = 1200;
  out.push({ at, target: 'narrative', text: OPENERS[problems.length % OPENERS.length] });

  for (const pr of problems) {
    at += 1800;
    const c = conditions.find((x) => x.id === pr.conditionId);
    out.push({ at, target: pr.conditionId, text: lineFor({ ...pr, name: c?.name ?? pr.name }) });
  }

  at += 1800;
  out.push({
    at, target: 'assessment',
    text: problems.some((pr) => pr.goal !== 'at-goal')
      ? 'Overall: most of the list is steady and one problem is doing the work. That is where the next '
        + 'change goes, and nothing else needs touching this month.'
      : 'Overall: steady across the list. Nothing here needs a change, and saying so is the finding.',
  });

  at += 1600;
  out.push({
    at, target: 'followUp',
    text: 'Next review in a month. Labs beforehand if anything changes before then.',
  });
  return out;
}

/** Where a dictated or captured line is allowed to land. */
export const DOCUMENT_FIELDS = ['narrative', 'objective', 'assessment', 'followUp'] as const;
export type DocumentField = typeof DOCUMENT_FIELDS[number];
