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
  Preventative: 'Preventative',
} as const;

const SERVICE_LABELS = new Set<string>(Object.values(GROUP_LABEL).filter(Boolean));

/** "Essential hypertension — Patient reports ..." with the name in bold. */
export function ReadLine({ line }: { line: string }) {
  if (!line.trim()) return <div className="nreadgap" />;
  // A bare "Medical", "Lifestyle" or "Preventative" on its own line
  // is the label over a run, not a finding about one of them.
  if (SERVICE_LABELS.has(line.trim())) {
    return <div className="nreadsec">{line.trim()}</div>;
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
  return (
    <div className="nread">
      {text.split('\n').map((ln, i) => <ReadLine key={i} line={ln} />)}
    </div>
  );
}
