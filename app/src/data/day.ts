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

const at = (h: number, m = 0) => h * 60 + m;

/**
 * The day's schedule.
 *
 * Reviews first, before the building fills up, which is how
 * asynchronous work actually survives contact with a clinic day: put
 * it where nobody can walk into it.
 */
export const todaySchedule: Encounter[] = [
  {
    id: 'd1', patientId: 'p0', date: ORIGIN, kind: 'review',
    reason: 'Monthly care plan review',
    status: 'scheduled', start: at(8), duration: 60,
  },
  {
    id: 'd2', patientId: 'p3', date: ORIGIN, kind: 'review',
    reason: 'Monthly care plan review',
    status: 'scheduled', start: at(9), duration: 60,
  },
  {
    id: 'd3', patientId: 'p1', date: ORIGIN, kind: 'visit', setting: 'in-person',
    reason: 'Blood pressure and the statin conversation he asked for',
    status: 'scheduled', start: at(10, 30), duration: 30,
  },
  {
    id: 'd4', patientId: 'p2', date: ORIGIN, kind: 'review',
    reason: 'Monthly care plan review',
    status: 'scheduled', start: at(11, 30), duration: 60,
  },
  {
    id: 'd5', patientId: 'p9', date: ORIGIN, kind: 'visit', setting: 'telehealth',
    reason: 'First follow-up since joining',
    status: 'scheduled', start: at(14), duration: 30,
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
