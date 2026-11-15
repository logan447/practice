/**
 * Sharon's approved chart, and what we are waiting on from her.
 *
 * Version 1 was approved at the visit on 30 October. It is computed
 * here from the records that existed on that date and then frozen,
 * which is exactly what the approval step does at runtime: read
 * everything on file, produce the summary, store it whole.
 *
 * Computing it rather than hand-writing it matters for the demo. It
 * means the approved chart and the draft the next encounter produces
 * come from the same function, so the difference between them is the
 * new information and nothing else. A hand-written snapshot would
 * have made every difference look like a change.
 *
 * Fictional throughout.
 */
import type { ChartVersion, InfoRequest } from '../domain/types';
import { livingSubjective } from '../lib/subjective';
import { sharonConditions, sharonMeds, sharonEncounters, sharonSpecialists, sharonPrevention, sharonOrders } from './sharon';
import { sharonPanels, sharonVitals, sharonStudies, sharonLifestyle } from './sharon-clinical';
import { sharonUpdates, sharonMessages, sharonCheckIns } from './sharon-contact';

const APPROVED = '2026-10-30';
const P = 'p0';

const upTo = <T extends { date: string }>(xs: T[]) => xs.filter((x) => x.date <= APPROVED);

const asApproved = livingSubjective({
  patientId: P,
  now: APPROVED,
  conditions: sharonConditions,
  medications: sharonMeds,
  encounters: upTo(sharonEncounters),
  updates: upTo(sharonUpdates),
  messages: upTo(sharonMessages),
  checkIns: upTo(sharonCheckIns),
  specialists: sharonSpecialists,
  panels: upTo(sharonPanels),
  vitals: upTo(sharonVitals),
  studies: upTo(sharonStudies),
  prevention: sharonPrevention,
  lifestyle: sharonLifestyle,
  orders: sharonOrders,
});

export const sharonVersions: ChartVersion[] = [
  {
    id: 'cv1', patientId: P, version: 1,
    approvedAt: APPROVED, approvedBy: 'L. DuBose, MD',
    encounterId: 'se3',
    subjective: asApproved,
    goals: { sc1: 'at-goal', sc2: 'at-goal', sc3: 'needs-improvement' },
    incorporated: [
      ...upTo(sharonEncounters), ...upTo(sharonUpdates), ...upTo(sharonMessages),
      ...upTo(sharonCheckIns), ...upTo(sharonPanels), ...upTo(sharonVitals),
    ].map((x) => x.id),
    plan: {
      byProblem: {
        sc1: 'No change. Treat to the home readings rather than the clinic ones. Review at four months.',
        sc2: 'Hold at two agents. Repeat A1c in four months. If the evenings at her mother’s are still unsolved by then, that is the thing to work on, not the dose.',
        sc3: 'Go through the actual numbers with her before changing anything. The skipped doses are a conversation, not a titration.',
      },
      prevention: 'Offer to book the mammogram rather than ask her to. What is in the way is the callback, not the appointment.',
      lifestyle: 'Two evenings of walking is the realistic version. The evening meals are the unsolved half.',
      followUp: 'Four months, with A1c, lipids and a metabolic panel done beforehand.',
    },
  },
];

/**
 * What we asked her for when that version was approved.
 *
 * Both still open, which is the useful state: an open request is the
 * part of the plan that depends on somebody else, and it is the first
 * thing the next encounter should show.
 */
export const sharonAsks: InfoRequest[] = [
  {
    id: 'ir1', patientId: P, versionId: 'cv1', encounterId: 'se3',
    about: { kind: 'condition', id: 'sc1' },
    ask: 'Keep taking your blood pressure at home twice a week and send the readings before the next visit.',
    created: APPROVED, status: 'open',
  },
  {
    id: 'ir2', patientId: P, versionId: 'cv1', encounterId: 'se3',
    about: { kind: 'prevention', id: 'sp1' },
    ask: 'Let us know whether you would like us to book the mammogram for you, or what is making you hold off.',
    created: APPROVED, status: 'open',
  },
];
