/**
 * What a year of membership actually contains.
 *
 * The membership is an annual package of consultations and care
 * planning delivered during stated service periods, not a standing
 * claim on the physician's attention. That sentence has an
 * arithmetic consequence and this file is it.
 *
 * Thirty hours a week across thirty-five working weeks is 1,040
 * physician hours a year. Across two hundred patients that is 5.2
 * hours each, and after a fifth of it goes on administration, 250
 * clinical minutes per patient per year. Everything below is that
 * number, divided up.
 *
 * The ledger is not a ration. A patient who needs three times the
 * planned time gets it, and the number exists so that somebody
 * notices, because a patient consuming 700 minutes a year is
 * clinical information before it is commercial information. What the
 * ledger protects against is the quieter failure: a panel that grows
 * past what the year holds, discovered through missed response times
 * rather than through a number.
 *
 * The monthly sixty minute review this practice ran before does not
 * appear here, and cannot. It is 720 minutes a patient, which at two
 * hundred patients is 2,400 physician hours against 1,040 available.
 * See docs/systems/consultative-practice-model.md section 4.2.
 */
import type { CareLogEntry, Encounter, Patient } from '../domain/types';
import { WORKING_YEAR } from '../domain/schedule';

export interface AnnualPackage {
  /** Synchronous consultations, in person or by video. */
  consultations: { count: number; minutes: number };
  /** Asynchronous care plan reviews. */
  reviews: { count: number; minutes: number };
  /** Messages, coordination and follow-up across the year. */
  messagingMinutes: number;
}

/**
 * The package, as recommended.
 *
 * Five physician contacts a year inside four service periods, which
 * is a contact roughly every seven weeks while the practice is open
 * and never more than about ten weeks between reviews, closure
 * included.
 */
export const PACKAGE: AnnualPackage = {
  consultations: { count: 2, minutes: 60 },
  reviews: { count: 3, minutes: 30 },
  messagingMinutes: 40,
};

export const packageMinutes = (p: AnnualPackage = PACKAGE): number =>
  p.consultations.count * p.consultations.minutes
  + p.reviews.count * p.reviews.minutes
  + p.messagingMinutes;

/**
 * The first year costs more, and saying so is cheaper than finding
 * out. A comprehensive assessment and a care plan built from nothing
 * is realistically an hour and a half beyond the steady state.
 */
export const FIRST_YEAR_EXTRA = 90;

/** The hours the year holds, and what that leaves per patient. */
export function yearCapacity(panel: number, y = WORKING_YEAR) {
  const hours = y.hoursPerWeek * y.weeksWorked;
  const adminShare = 0.2;
  const clinicalHours = hours * (1 - adminShare);
  return {
    hours,
    clinicalHours: Math.round(clinicalHours),
    /** Clinical minutes available per patient per year at this panel size. */
    minutesEach: panel > 0 ? Math.round((clinicalHours * 60) / panel) : 0,
    /** What the package asks for. */
    minutesPlanned: packageMinutes(),
    /** The panel size at which the package exactly fits. */
    panelThatFits: Math.floor((clinicalHours * 60) / packageMinutes()),
  };
}

// ------------------------------------------------------------- the ledger

export interface Used {
  consultations: number;
  reviews: number;
  /** Physician minutes recorded against this patient in the year. */
  minutes: number;
  /** Of those, the minutes that were not a booked encounter. */
  betweenMinutes: number;
}

export interface Ledger {
  /** The membership year this covers, as ISO dates. */
  from: string;
  to: string;
  used: Used;
  planned: AnnualPackage;
  plannedMinutes: number;
  /** Negative when they have had more than the package plans for. */
  minutesLeft: number;
  /** How far through the membership year today is, 0 to 1. */
  through: number;
  /**
   * One sentence for the chart. Says what is true rather than what to
   * do about it, because what to do about it is a clinical judgement
   * and this is arithmetic.
   */
  line: string;
}

const addYears = (iso: string, n: number): string => {
  const [y, m, d] = iso.split('-').map(Number);
  return `${y + n}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
};

const daysBetween = (a: string, b: string): number =>
  Math.round((Date.parse(`${b}T12:00:00`) - Date.parse(`${a}T12:00:00`)) / 86400000);

/**
 * Where this patient stands in their membership year.
 *
 * The year runs from their join date, not from January, because the
 * package is what they bought rather than what the calendar did.
 */
export function ledgerFor(
  patient: Patient, encounters: Encounter[], careLog: CareLogEntry[], now: string,
): Ledger {
  // Which membership year are we in.
  let from = patient.memberSince;
  while (addYears(from, 1) <= now) from = addYears(from, 1);
  const to = addYears(from, 1);

  const mine = encounters.filter(
    (e) => e.patientId === patient.id && e.status === 'signed'
      && e.date >= from && e.date < to,
  );
  const consultations = mine.filter((e) => e.kind === 'visit').length;
  const reviews = mine.filter((e) => e.kind === 'review').length;
  const encounterMinutes = mine.reduce(
    (a, e) => a + (e.minutes ?? e.duration ?? 30), 0,
  );
  const betweenMinutes = careLog
    .filter((c) => c.patientId === patient.id && c.date >= from && c.date < to
      && c.role === 'physician' && !c.encounterId)
    .reduce((a, c) => a + c.minutes, 0);

  const plannedMinutes = packageMinutes();
  const used: Used = {
    consultations, reviews,
    minutes: encounterMinutes + betweenMinutes,
    betweenMinutes,
  };
  const through = Math.max(0, Math.min(1, daysBetween(from, now) / daysBetween(from, to)));
  const minutesLeft = plannedMinutes - used.minutes;

  // Expected consumption at this point in the year, so "behind" and
  // "ahead" mean something other than "it is March".
  const expected = Math.round(plannedMinutes * through);
  const line = used.minutes === 0
    ? `Nothing used yet of ${plannedMinutes} minutes, ${Math.round(through * 100)}% through the year.`
    : minutesLeft < 0
      ? `${used.minutes} of ${plannedMinutes} planned minutes used, ${-minutesLeft} over, `
        + `${Math.round(through * 100)}% through the year.`
      : used.minutes > expected + 30
        ? `${used.minutes} of ${plannedMinutes} minutes used, ahead of the ${expected} the year is at.`
        : `${used.minutes} of ${plannedMinutes} minutes used, ${Math.round(through * 100)}% through the year.`;

  return { from, to, used, planned: PACKAGE, plannedMinutes, minutesLeft, through, line };
}
