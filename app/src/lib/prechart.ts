/**
 * The chart review, as a list of sections and a voice.
 *
 * The sections are the chart's own tabs in the chart's own order,
 * because the order a chart is filed in and the order it is read in
 * should not be two different things. Each one carries the question
 * it is being opened to answer, which is the thing a reader forgets
 * halfway down a long list.
 *
 * `dictated` fakes the speech. It is assembled from this patient's
 * actual record rather than from a fixed script, so what appears in
 * the box is something a physician could plausibly have said about
 * this chart and not about a chart in general. It is still a
 * simulation and the prototype says so.
 */
import type { ChartDrawer } from '../screens/chart/drawers';

export interface Section {
  id: ChartDrawer;
  /** What you are opening it to answer. */
  asks: string;
}

export const REVIEW: Section[] = [
  { id: 'notes', asks: 'What did we agree last time, and what was meant to happen since?' },
  { id: 'subjective', asks: 'What have they told us since, and does any of it change the plan?' },
  { id: 'vitals', asks: 'What are the numbers doing, in clinic and at home?' },
  { id: 'problems', asks: 'Is each problem controlled, and is anyone else managing it?' },
  { id: 'lifestyle', asks: 'Which prescriptions are holding, and what is in the way?' },
  { id: 'prevention', asks: 'What is due or overdue, and what is being done about it?' },
  { id: 'meds', asks: 'Is the list right, and is anything being skipped?' },
  { id: 'results', asks: 'What has come back, and is anything unreviewed?' },
  { id: 'studies', asks: 'What imaging exists, and does any of it still need acting on?' },
  { id: 'specialists', asks: 'Who else is involved, and what is outstanding with them?' },
  { id: 'more', asks: 'Allergies, family, surgical and social. Were they asked?' },
];

export interface Ctx {
  firstName: string;
  problems: { name: string; controlled: boolean }[];
  dueCount: number;
  dueNames: string[];
  struggling: string[];
  unreviewed: number;
  outstanding: string[];
  heldMeds: string[];
  lastVisit?: string;
  newRecords: number;
  historyGaps: string[];
}

/** One plausible sentence about this chart, for this section. */
export function dictated(id: ChartDrawer, c: Ctx): string {
  const uncontrolled = c.problems.filter((p) => !p.controlled).map((p) => p.name);
  const list = (xs: string[]) => (xs.length > 1
    ? `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}` : xs[0] ?? '');

  switch (id) {
    case 'notes':
      return c.lastVisit
        ? `Last seen ${c.lastVisit}. Reading the plan we agreed then so I can ask them what actually happened.`
        : 'No visit on file yet, so today is where the plan starts.';
    case 'subjective':
      return c.newRecords > 0
        ? `${c.newRecords} record${c.newRecords === 1 ? '' : 's'} since the plan was approved. `
          + 'Nothing here changes it until we have been through it together.'
        : 'Nothing new from them since the last approval, so I will ask openly rather than from a list.';
    case 'vitals':
      return 'Reading the home numbers against the clinic ones. Treat to the home series where they disagree.';
    case 'problems':
      return uncontrolled.length > 0
        ? `${list(uncontrolled)} not at goal. That is where most of today goes.`
        : 'Everything on the list is at goal. Today is about keeping it there rather than changing anything.';
    case 'lifestyle':
      return c.struggling.length > 0
        ? `${list(c.struggling)} is where it is falling down. Ask what is actually in the way before changing the prescription.`
        : 'The prescriptions are holding. Ask what made that possible so we can protect it.';
    case 'prevention':
      return c.dueCount > 0
        ? `${c.dueCount} due or overdue: ${list(c.dueNames)}. Agree an order for each one today.`
        : 'Nothing due. Confirm the dates rather than assume them.';
    case 'meds':
      return c.heldMeds.length > 0
        ? `${list(c.heldMeds)} held and still needing a decision.`
        : 'List looks right. Ask directly about doses missed rather than whether they are taking them.';
    case 'results':
      return c.unreviewed > 0
        ? `${c.unreviewed} report${c.unreviewed === 1 ? '' : 's'} not yet reviewed. Read those before the room.`
        : 'Everything resulted has been reviewed. Go over the trend with them rather than the last value.';
    case 'studies':
      return 'Nothing imaging-wise that changes today, but check the significant ones were acted on.';
    case 'specialists':
      return c.outstanding.length > 0
        ? `Outstanding with ${list(c.outstanding)}. Close the loop or say out loud who is closing it.`
        : 'Nothing outstanding with anybody else. Confirm who they have actually seen.';
    case 'more':
      return c.historyGaps.length > 0
        ? `${list(c.historyGaps)} never asked. Worth five minutes today.`
        : 'Histories are on file. Confirm the family history is still current.';
    default:
      return '';
  }
}
