/**
 * What the patient can see.
 *
 * Deliberately one small file. These rules decide whether a person
 * reads an unreleased result or a half-written assessment about
 * themselves, so they must be readable in one sitting and testable on
 * their own — not scattered across six screens as `if` statements.
 *
 * The rule, in one sentence: the patient sees what the physician has
 * finished, plus everything they contributed themselves.
 *
 * This is also the boundary the patient-facing assistant runs inside
 * (docs/systems/ai-layer-and-hda.md §6, rule 3). Nothing in the portal,
 * the assistant included, may read outside what these functions return.
 */
import type {
  CarePlan, Encounter, Medication, PatientEntry, PreventionItem,
  ResultReport, ResultSeries, Condition,
} from '../domain/types';

/** Signed only. A draft plan is the physician thinking, not a promise. */
export function visiblePlan(plan: CarePlan | undefined): CarePlan | undefined {
  return plan?.signed ? plan : undefined;
}

/**
 * Released only. An unacknowledged result has not been seen by the
 * physician yet, so the patient must not meet it alone in a portal.
 */
export function visibleReports(reports: ResultReport[]): ResultReport[] {
  return reports.filter((r) => r.acknowledged);
}

/** A measure is visible once at least one of its reports has been released. */
export function visibleSeries(series: ResultSeries[], reports: ResultReport[]): ResultSeries[] {
  const released = new Set(visibleReports(reports).flatMap((r) => r.seriesIds));
  return series.filter((s) => released.has(s.id));
}

/** Signed notes only. Never a note in progress. */
export function visibleEncounters(encounters: Encounter[]): Encounter[] {
  return encounters.filter((e) => e.status === 'signed');
}

/** Upcoming visits are visible whatever their note status. */
export function upcomingEncounters(encounters: Encounter[]): Encounter[] {
  return encounters.filter((e) => e.status === 'scheduled');
}

/** Everything except what was stopped before they joined is theirs to see. */
export function visibleMeds(meds: Medication[]): Medication[] {
  return meds.filter((m) => m.status !== 'stopped' || !!m.changeNote);
}

export function visibleConditions(conditions: Condition[]): Condition[] {
  return conditions.filter((c) => c.status === 'active');
}

export function visiblePrevention(items: PreventionItem[]): PreventionItem[] {
  return items.filter((i) => i.status !== 'not-applicable');
}

/** Their own entries, always. They wrote them. */
export function visibleEntries(entries: PatientEntry[]): PatientEntry[] {
  return entries;
}

/**
 * What the assistant is allowed to say it can see, in the patient's own
 * words. Shown in the portal rather than buried in a policy, because a
 * patient who does not know the limits cannot rely on the answers.
 */
export const ASSISTANT_SCOPE = {
  can: [
    'Your care plan, once Dr. DuBose has signed it',
    'Results he has reviewed and released to you',
    'Your medicines and your conditions',
    'Visit summaries from completed visits',
    'Anything you have written or tracked yourself',
  ],
  cannot: [
    'Results he has not reviewed yet',
    'Notes he is still writing',
    'Anything in your record he has not released',
  ],
  never: [
    'Change your plan, your medicines or your record',
    'Give you a diagnosis, or tell you to start or stop a medicine',
  ],
};
