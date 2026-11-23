/**
 * The shape every note has, whatever the visit was.
 *
 * A note whose sections change from visit to visit cannot be read
 * quickly, because reading it starts with working out what is in it.
 * A note whose sections never change can be read by jumping: a
 * physician looking for the medicines knows where they are without
 * looking for them, and a physician who does not find a section
 * knows it is missing rather than wondering whether they missed it.
 *
 * So the skeleton is fixed and the content is what varies. A
 * twenty-five minute visit for a painful toe does not review seven
 * problems, does not touch the lifestyle prescriptions and does not
 * go near the preventative schedule. Those sections still appear,
 * each saying in one line that it was not covered and when it last
 * was, which is a different and more useful statement than silence.
 *
 * The one exception is a section with nothing to say in either
 * direction: a care team for a patient who has no other clinician is
 * omitted rather than captioned, because "nobody" is not a finding
 * about this visit, it is a finding about the patient, and it is
 * already in the problem list.
 */

export interface NoteSection {
  id: string;
  /** Printed as the section heading. Empty for prose with no heading. */
  heading: string;
  /**
   * What to print when the visit did not cover this section.
   *
   * Undefined means leave the section out entirely rather than
   * caption its absence.
   */
  whenSkipped?: string;
}

/**
 * The subjective, in order.
 *
 * The power statement and the interval narrative carry no heading:
 * they are the first thing read and a label above them would be
 * telling a reader what a first paragraph is.
 */
export const SUBJECTIVE_SECTIONS: NoteSection[] = [
  { id: 'power', heading: '' },
  { id: 'interval', heading: '' },
  { id: 'problems', heading: 'Problems addressed today' },
  {
    id: 'lifestyle',
    heading: 'Lifestyle',
    whenSkipped: 'Not addressed at this visit.',
  },
  {
    id: 'prevention',
    heading: 'Preventative Medicine Services',
    whenSkipped: 'Not addressed at this visit.',
  },
  {
    id: 'results',
    heading: 'Results reviewed',
    whenSkipped: 'Nothing new since the last visit.',
  },
  { id: 'ros', heading: 'Review of systems' },
  { id: 'problist', heading: 'Full problem list' },
  { id: 'meds', heading: 'Medications' },
  { id: 'team', heading: 'Care team' },
];

/**
 * The assessment and plan, in order.
 *
 * Problems first and acute before chronic, because the acute one is
 * what changes between now and the next visit. Then the two standing
 * sections, which are standing precisely so that a visit which skips
 * them has to say it skipped them.
 */
export const PLAN_SECTIONS: NoteSection[] = [
  { id: 'power', heading: '' },
  { id: 'problems', heading: '' },
  {
    id: 'lifestyle',
    heading: 'Lifestyle',
    whenSkipped: 'Not addressed at this visit.',
  },
  {
    id: 'prevention',
    heading: 'Preventative Medicine Services',
    whenSkipped: 'Not addressed at this visit.',
  },
];

/** Every heading the note can carry, for the reader that styles them. */
export const SECTION_HEADINGS: string[] = [
  ...SUBJECTIVE_SECTIONS, ...PLAN_SECTIONS,
].map((s) => s.heading).filter(Boolean);

/**
 * The line a skipped section carries.
 *
 * Takes what is known about when the section was last covered and
 * when it is next due, because "not addressed" on its own invites
 * the reader to wonder whether it was forgotten. With the dates it
 * reads as a decision, which is what it was.
 */
export function skippedLine(
  section: NoteSection, last?: string, next?: string,
): string {
  if (!section.whenSkipped) return '';
  const when = [
    last ? `last reviewed ${last}` : '',
    next ? `next planned ${next}` : '',
  ].filter(Boolean).join(', ');
  return when ? `${section.whenSkipped.replace(/\.$/, '')}, ${when}.`
    : section.whenSkipped;
}
