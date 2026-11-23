/**
 * A note, read.
 *
 * One renderer for the visit screen and for the signed note in the
 * drawer, because they are the same document and a reader who learns
 * it once should not have to learn it again. Headings bold, the
 * sentence after the dash not; the label over a run of the note bold
 * on its own line; points indented a little under the sentence that
 * leads into them.
 */
import { ROS_LINE } from '../../domain/ros';
import { SECTION_HEADINGS } from '../../domain/noteTemplate';

/**
 * The labels over the runs of the note that belong to each service.
 *
 * The medical problems get none. They are what a note is about by
 * default, they come first, and a label over them was a heading that
 * said "this is the part of a clinical note that is clinical". The
 * other two are departures from that default, which is exactly when
 * a label earns its line.
 */
export const GROUP_LABEL = {
  Problems: '',
  Lifestyle: 'Lifestyle',
  Preventative: 'Preventative Medicine Services',
} as const;

/**
 * Every line that is a heading rather than a finding.
 *
 * A bare word on its own line, with nothing after a dash, is a
 * label over what follows. There are four of them and they are
 * known, which is better than a rule about length that would
 * eventually bold a short sentence somebody wrote.
 */
export const NOTE_HEADINGS = new Set<string>([
  ...Object.values(GROUP_LABEL).filter(Boolean),
  // The fixed skeleton every note carries, whatever the visit was.
  ...SECTION_HEADINGS,
  'Review of systems',
  'Full problem list',
  'Medications',
  'Care team',
  'Vitals',
  'Labs',

  'Physical Exam',
  'Surveys',
]);

/**
 * A survey line, and whether it is a positive screen.
 *
 * "PHQ-2: 1 of 6" and "GAD-2: 3 of 6 · Positive" are the same shape
 * and only one of them is a reason to do something, so the word that
 * says which gets the same colour the review's positives get.
 */
const SURVEY_LINE =
  /^(PHQ-2|GAD-2|PHQ-9|GAD-7|AUDIT-C|Tobacco|Other drugs|Mini-Cog|Flourishing): /;


/**
 * One line of the formal review.
 *
 * The system in bold, then whatever the patient raised, then the
 * denials. The positive is highlighted because the shape of the
 * block is the finding: twelve lines that say nothing and two that
 * do, and the two are what a reader is looking for.
 */
function RosLine({ line }: { line: string }) {
  const at = line.indexOf(':');
  const system = line.slice(0, at);
  const rest = line.slice(at + 1).trim();
  const cut = rest.search(/\b(Otherwise denies|Denies|no symptoms reported)/);
  const positive = cut > 0 ? rest.slice(0, cut).trim() : '';
  const tail = cut > 0 ? rest.slice(cut) : rest;
  return (
    <div className="nreadline rosline">
      <strong>{system}:</strong>{' '}
      {positive && <span className="rospos">{positive}</span>}{positive && ' '}
      {tail}
    </div>
  );
}

/** "Essential hypertension — Patient reports ..." with the name in bold. */
export function ReadLine({ line, inRos }: { line: string; inRos?: boolean }) {
  if (!line.trim()) return <div className="nreadgap" />;
  // A bare "Medical", "Lifestyle" or "Preventative" on its own line
  // is the label over a run, not a finding about one of them.
  if (NOTE_HEADINGS.has(line.trim())) {
    return <div className="nreadsec">{line.trim()}</div>;
  }
  // Only inside the review. "Cardiovascular: regular rate and
  // rhythm" is an examination line and reads as one.
  if (inRos && ROS_LINE.test(line.trim())) return <RosLine line={line.trim()} />;
  if (SURVEY_LINE.test(line.trim())) {
    const t = line.trim();
    const at = t.indexOf(':');
    const rest = t.slice(at + 1).trim();
    const hit = / (Positive|Current use)\b|Possible impairment/.test(rest);
    return (
      <div className="nreadline rosline">
        <strong>{t.slice(0, at)}:</strong>{' '}
        <span className={hit ? 'rospos' : undefined}>{rest}</span>
      </div>
    );
  }
  // A point in the plan, not a sentence about it: given a little air
  // above the first of a run so the sentence that leads into them is
  // not the first bullet's own first line.
  const bullet = /^\s*[•\-*]\s/.test(line);
  const i = line.indexOf('—');
  if (bullet || i < 0) {
    return <div className={`nreadline${bullet ? ' bull' : ''}`}>{line}</div>;
  }
  return (
    <div className="nreadline">
      <strong>{line.slice(0, i).trim()}</strong>
      {' — '}
      {line.slice(i + 1).trim()}
    </div>
  );
}

/** A whole section of a note, line by line. */
export function NoteText({ text }: { text: string }) {
  return <div className="nread">{readLines(text)}</div>;
}

/**
 * The lines of a section, knowing which of them are the review.
 *
 * The review starts at its own heading and runs to the end of the
 * section, which is where it is written. Without that, an
 * examination line reading "Cardiovascular: regular rate and rhythm"
 * is rendered as a review line, and half the examination comes out
 * bold.
 */
export function readLines(text: string) {
  let inRos = false;
  return text.split('\n').map((ln, i) => {
    if (ln.trim() === 'Review of systems') inRos = true;
    return <ReadLine key={i} line={ln} inRos={inRos} />;
  });
}
