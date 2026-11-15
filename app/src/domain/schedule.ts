/**
 * The working year.
 *
 * Visits in the prototype used to appear from nowhere, which made
 * every question about capacity unaskable. A solo practice does not
 * have a schedule in the abstract: it has about thirty hours a week
 * for thirty-nine weeks, two or three months away, and a panel whose
 * size is the whole economic argument. Booking has to collide with
 * that or it is not booking.
 *
 * WHERE THE NUMBERS COME FROM. Each input below is tagged. Sourced
 * means it is a logged decision in docs/charter/decision-log.md.
 * Derived means it is arithmetic on sourced inputs. Assumed means I
 * chose it and own it, and it is the first thing to change when real
 * data arrives.
 *
 *   hoursPerWeek 30, weeksWorked 39      sourced, D-018
 *   panelTarget ~140, 5 to 6 hr/patient  sourced, D-018 unit economics
 *   breakEven 19 adults                  sourced, working-model.md §3
 *   clinic days Monday to Friday         sourced, D-017 business hours
 *   up to ~3 months a year away          sourced, D-017
 *   home visit 2 to 2.5 hr with travel   sourced, working-model.md §4
 *   day start and end, lunch             assumed
 *   admin and messaging time             assumed, and load-bearing
 *
 * The messaging figure is the one to watch. D-017 commits to a 24 to
 * 72 hour routine response with no coverage clinician, and that
 * commitment consumes hours whether or not anything is booked. A
 * schedule that counts only visits will always say there is room.
 */
import { addDays, daysBetween } from '../lib/clock';

export interface AwayBlock {
  from: string;
  to: string;
  label: string;
}

export interface WorkingYear {
  /** D-018: the hours the income target is built on. */
  hoursPerWeek: number;
  /** D-018: 39 of 52. */
  weeksWorked: number;
  /** 0 is Sunday. D-017: business hours, Monday to Friday. */
  clinicDays: number[];
  /** Minutes from midnight. */
  dayStart: number;
  dayEnd: number;
  lunchStart: number;
  lunchMinutes: number;
  /** Assumed: notes, results, orders and refills, per clinic day. */
  adminPerDay: number;
  /**
   * Assumed: the cost of the 24 to 72 hour response commitment, per
   * week, independent of what is booked. D-017 with no coverage layer.
   */
  messagingPerWeek: number;
  /** D-017: up to about three months a year, aware but not absent. */
  away: AwayBlock[];
  /** D-018 unit economics. */
  panelTarget: number;
  hoursPerPatientLow: number;
  hoursPerPatientHigh: number;
  /** working-model.md §3. */
  breakEvenPanel: number;
}

/**
 * The year as currently decided, starting from the clinic's origin.
 * Away blocks are placed, not invented: three blocks totalling about
 * twelve weeks is what "up to ~3 months a year" means in a calendar.
 */
export const WORKING_YEAR: WorkingYear = {
  hoursPerWeek: 30,
  weeksWorked: 39,
  clinicDays: [1, 2, 3, 4, 5],
  dayStart: 9 * 60,
  dayEnd: 17 * 60,
  lunchStart: 12 * 60 + 30,
  lunchMinutes: 45,
  adminPerDay: 90,
  messagingPerWeek: 180,
  panelTarget: 140,
  hoursPerPatientLow: 5,
  hoursPerPatientHigh: 6,
  breakEvenPanel: 19,
  away: [
    { from: '2026-12-21', to: '2027-01-03', label: 'Away, end of year' },
    { from: '2027-03-15', to: '2027-03-28', label: 'Away' },
    { from: '2027-06-28', to: '2027-08-08', label: 'Away, summer' },
    { from: '2026-11-23', to: '2026-11-27', label: 'Away, Thanksgiving week' },
  ],
};

// ------------------------------------------------------------ the day

export type DayStatus = 'clinic' | 'weekend' | 'away';

export interface DayVerdict {
  status: DayStatus;
  /** Said on screen wherever a booking is refused. Never silent. */
  why?: string;
  label?: string;
}

const dow = (iso: string): number => new Date(`${iso}T12:00:00`).getDay();

export function dayStatus(iso: string, y: WorkingYear = WORKING_YEAR): DayVerdict {
  const block = y.away.find((a) => iso >= a.from && iso <= a.to);
  if (block) {
    return {
      status: 'away', label: block.label,
      why: `${block.label}, ${block.from} to ${block.to}. Routine visits are not booked in an away block. Urgent contact still reaches the practice.`,
    };
  }
  if (!y.clinicDays.includes(dow(iso))) {
    return { status: 'weekend', why: 'Not a clinic day. The practice keeps business hours, Monday to Friday.' };
  }
  return { status: 'clinic' };
}

export interface Booked {
  id: string;
  /** Minutes from midnight. */
  start: number;
  minutes: number;
  label: string;
  patientId: string;
  kind: string;
}

export const hhmm = (min: number): string => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  const ampm = h < 12 ? 'am' : 'pm';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}${m ? `:${String(m).padStart(2, '0')}` : ''}${ampm}`;
};

/** Does a block of this length fit here, with nothing already in it? */
function free(start: number, minutes: number, booked: Booked[], y: WorkingYear): boolean {
  const end = start + minutes;
  if (start < y.dayStart || end > y.dayEnd) return false;
  const lunchEnd = y.lunchStart + y.lunchMinutes;
  if (start < lunchEnd && end > y.lunchStart) return false;
  return !booked.some((b) => start < b.start + b.minutes && end > b.start);
}

/**
 * Every start time a visit of this length could take, on a 15 minute
 * grid. Deliberately not "the next three slots the system likes": the
 * whole day is visible and the choice is the physician's.
 */
export function slots(
  iso: string, minutes: number, booked: Booked[], y: WorkingYear = WORKING_YEAR,
): number[] {
  if (dayStatus(iso, y).status !== 'clinic') return [];
  const out: number[] = [];
  for (let t = y.dayStart; t + minutes <= y.dayEnd; t += 15) {
    if (free(t, minutes, booked, y)) out.push(t);
  }
  return out;
}

export interface DayLoad {
  iso: string;
  verdict: DayVerdict;
  booked: Booked[];
  /** Minutes with a patient. */
  clinicalMinutes: number;
  /** Plus the admin the day generates. */
  totalMinutes: number;
  /** Minutes of the working day still open. */
  openMinutes: number;
  full: boolean;
}

export function dayLoad(
  iso: string, booked: Booked[], y: WorkingYear = WORKING_YEAR,
): DayLoad {
  const verdict = dayStatus(iso, y);
  const clinical = booked.reduce((a, b) => a + b.minutes, 0);
  const dayMinutes = y.dayEnd - y.dayStart - y.lunchMinutes;
  const admin = booked.length > 0 ? y.adminPerDay : 0;
  return {
    iso, verdict, booked: [...booked].sort((a, b) => a.start - b.start),
    clinicalMinutes: clinical,
    totalMinutes: clinical + admin,
    openMinutes: Math.max(0, dayMinutes - clinical),
    full: verdict.status === 'clinic' && slots(iso, 30, booked, y).length === 0,
  };
}

// ------------------------------------------------------- the year

export interface Capacity {
  /** Hours the year contains, by decision rather than by calendar. */
  yearHours: number;
  /** What the response commitment takes before anything is booked. */
  messagingHours: number;
  /** What the booked visits and their admin take. */
  bookedHours: number;
  /** What is left. */
  freeHours: number;
  panel: number;
  /** Hours per patient per year at the current panel and load. */
  hoursPerPatient: number | null;
  /** The panel this year could carry at the sourced 5 to 6 hours. */
  panelAtLow: number;
  panelAtHigh: number;
  /** Against D-018's ~140. */
  targetPanel: number;
  breakEven: number;
  /**
   * Hours a year that D-018's own target implies but this model does
   * not name. The sourced target is ~140 adults; the arithmetic here
   * says more. The difference is real work going somewhere, and the
   * honest thing is to show the gap rather than tune an assumption
   * until the two agree.
   */
  unexplainedHours: number;
}

export function capacity(
  bookedMinutes: number, bookedDays: number, panel: number,
  y: WorkingYear = WORKING_YEAR,
): Capacity {
  const yearHours = y.hoursPerWeek * y.weeksWorked;
  const messagingHours = (y.messagingPerWeek / 60) * y.weeksWorked;
  const bookedHours = (bookedMinutes + bookedDays * y.adminPerDay) / 60;
  const usable = yearHours - messagingHours;
  return {
    yearHours,
    messagingHours: Math.round(messagingHours),
    bookedHours: Math.round(bookedHours * 10) / 10,
    freeHours: Math.round((usable - bookedHours) * 10) / 10,
    panel,
    hoursPerPatient: panel > 0 ? Math.round((bookedHours / panel) * 100) / 100 : null,
    panelAtLow: Math.floor(usable / y.hoursPerPatientHigh),
    panelAtHigh: Math.floor(usable / y.hoursPerPatientLow),
    targetPanel: y.panelTarget,
    breakEven: y.breakEvenPanel,
    unexplainedHours: Math.round(usable - y.panelTarget * y.hoursPerPatientHigh),
  };
}

/** The next date that can actually take a visit of this length. */
export function nextOpen(
  from: string, minutes: number,
  bookedBy: (iso: string) => Booked[],
  y: WorkingYear = WORKING_YEAR,
  limit = 120,
): { iso: string; start: number } | undefined {
  for (let i = 0; i < limit; i++) {
    const iso = addDays(from, i);
    const s = slots(iso, minutes, bookedBy(iso), y);
    if (s.length > 0) return { iso, start: s[0] };
  }
  return undefined;
}

/** Monday of the week containing this date. */
export function weekStart(iso: string): string {
  const d = dow(iso);
  return addDays(iso, d === 0 ? -6 : 1 - d);
}

export const daysApart = daysBetween;
