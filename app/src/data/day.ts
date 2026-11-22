/**
 * One Monday in the practice.
 *
 * The demo has to answer a question the static fixtures cannot: what
 * does it feel like to work this way for a day. So this file books a
 * real morning. Five activities, two kinds, in the order they would
 * actually fall, with different amounts waiting on each one.
 *
 * The shape of the day is the argument. Two visits and three care
 * plan reviews is roughly what thirty hours a week across a hundred
 * and forty adults looks like if every patient gets an hour of the
 * physician's attention a month. Whether that arithmetic holds is the
 * question the capacity screen asks; this is what it looks like from
 * inside.
 *
 * The inbox traffic is chosen to make the three triage answers all
 * correct once each. Something that can wait, something that cannot
 * wait but does not need the patient present, and something that
 * needs looking at in person. A demo where every item has the same
 * right answer teaches nothing about the choice.
 *
 * Fictional throughout.
 */
import type { Encounter, Message, VitalsSet } from '../domain/types';
import { ORIGIN } from '../lib/clock';
import type { EmRecord } from '../domain/types';

const at = (h: number, m = 0) => h * 60 + m;

/**
 * The day's schedule.
 *
 * Reviews first, before the building fills up, which is how
 * asynchronous work actually survives contact with a clinic day: put
 * it where nobody can walk into it.
 *
 * Note the lengths. A longer visit is sixty minutes here, not
 * sixty. A sixty minute review every month is 720 minutes a patient a
 * year, which across two hundred patients is 2,400 physician hours
 * against the 1,040 the year holds. The package is two consultations
 * and three reviews a year; see lib/membership.ts and
 * docs/systems/consultative-practice-model.md section 4.
 */
export const todaySchedule: Encounter[] = [
  {
    id: 'd1', patientId: 'p0', date: ORIGIN, kind: 'visit',
    reason: 'Follow-up visit, third of the year',
    status: 'scheduled', start: at(8), duration: 30,
  },
  {
    id: 'd2', patientId: 'p3', date: ORIGIN, kind: 'visit',
    reason: 'Follow-up visit, second of the year',
    status: 'scheduled', start: at(8, 45), duration: 30,
  },
  {
    id: 'd3', patientId: 'p1', date: ORIGIN, kind: 'visit', setting: 'in-person',
    reason: 'Blood pressure and the statin conversation he asked for',
    status: 'scheduled', start: at(9, 30), duration: 60,
  },
  {
    id: 'd4', patientId: 'p2', date: ORIGIN, kind: 'visit',
    reason: 'Follow-up visit, second of the year',
    status: 'scheduled', start: at(10, 45), duration: 30,
  },
  /*
   * The first visit of the day is a first visit.
   *
   * A schedule of nothing but follow-ups is a practice that has
   * already been running for a year, which is the one thing a
   * practice that has not started yet cannot show anybody.
   */
  {
    id: 'd0', patientId: 'p4', date: ORIGIN, kind: 'visit', legacyKind: 'initial',
    reason: 'First visit. Joined last week, records from her old practice have arrived.',
    status: 'scheduled', start: at(7, 30), duration: 90,
  },
  {
    id: 'd5', patientId: 'p9', date: ORIGIN, kind: 'visit', setting: 'telehealth',
    reason: 'Comprehensive assessment, first of the year',
    status: 'scheduled', start: at(11, 30), duration: 60,
  },
];

/**
 * What came in over the weekend.
 *
 * Each of these has a different right answer, and the difference is
 * in the content rather than in a flag. The hypo one is urgent and is
 * marked urgent; the shoulder one is not marked anything and still
 * needs looking at, because a patient describing a new physical
 * finding is not something a review of their chart can settle.
 */
export const weekendMessages: Message[] = [
  {
    id: 'wm1', patientId: 'p2', date: '2026-11-15',
    from: 'patient', author: 'Dana Whitfield',
    subject: 'Sleep on the night run',
    body: 'Third night in a row I have been awake until gone five. The melatonin timing you '
      + 'wrote down works when the rota is normal and this week it is not. Nothing urgent, '
      + 'I just did not want to leave it until next month.',
  },
  {
    id: 'wm2', patientId: 'p3', date: '2026-11-15',
    from: 'patient', author: 'Arthur Lindqvist', urgent: true,
    subject: 'Dizzy on Saturday',
    body: 'Went lightheaded standing up twice on Saturday and had to sit down on the stairs. '
      + 'Sugar was 3.9 the second time. I have not changed anything. My daughter said I '
      + 'should write in rather than wait.',
  },
  {
    id: 'wm3', patientId: 'p1', date: '2026-11-14',
    from: 'patient', author: 'Marcus Reyes',
    subject: 'Shoulder',
    body: 'Right shoulder has been catching for about three weeks, worse reaching up. '
      + 'Not the knee this time. Can you look at it when I come in, or should I do '
      + 'something before then?',
  },
];

/** Home readings that arrived on their own and change nothing by arriving. */
export const weekendVitals: VitalsSet[] = [
  {
    id: 'wv1', patientId: 'p0', date: '2026-11-15', source: 'home',
    systolic: 126, diastolic: 78, heartRate: 71,
    note: 'Sunday morning, sitting, before anything.',
  },
  {
    id: 'wv2', patientId: 'p0', date: '2026-11-14', source: 'home',
    systolic: 124, diastolic: 76,
  },
  {
    id: 'wv3', patientId: 'p1', date: '2026-11-15', source: 'home',
    systolic: 118, diastolic: 74, weightLb: 197,
  },
];

/**
 * The medical decision making for today's two worked visits.
 *
 * Entered by the physician, not computed. The chart has no business
 * deciding that three chronic problems is moderate: that is the CPT
 * grid, the grid is not reproduced here, and a chart that quietly
 * assigns a level has made a billing decision on somebody else's
 * licence. See lib/billing.ts.
 */
export const todayEm: EmRecord[] = [
  {
    // The first visit. Four problems including one acute, outside
    // records to reconcile, and a drug she stopped on her own.
    encounterId: 'd0',
    problemsAddressed: ['pc5', 'pc1', 'pc2', 'pc3'],
    dataReviewed: [
      'Reviewed outside records, Travis Family Medicine',
      'Reviewed CMP, A1c and lipid panel from May 2025',
      'Reviewed PHQ-2, GAD-2, GAD-7, AUDIT-C and the flourishing measure',
      'Ordered A1c, CMP, lipid panel and ferritin',
    ],
    problemsLevel: 'moderate', dataLevel: 'moderate', riskLevel: 'moderate',
    totalMinutes: 90,
  },
  {
    // The follow-up. Three chronic problems, two at target, one with
    // an adherence problem and a prescription decision in it.
    encounterId: 'd1',
    problemsAddressed: ['sc1', 'sc2', 'sc3'],
    dataReviewed: [
      'Reviewed CBC, CMP, lipid panel, A1c and UACR from 29 Oct',
      'Reviewed six home blood pressure readings',
      'Reviewed the ophthalmology letter',
    ],
    problemsLevel: 'moderate', dataLevel: 'moderate', riskLevel: 'moderate',
    totalMinutes: 30,
  },
];
