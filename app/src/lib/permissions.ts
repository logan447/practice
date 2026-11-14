/**
 * What each role may do.
 *
 * One file, deliberately. The same reason portalScope.ts is one file:
 * a rule about who may see what is a rule somebody has to be able to
 * read in full, and rules scattered across twenty components cannot be
 * read in full by anyone.
 *
 * The answers here are design decisions, not law. Three of them are
 * genuinely arguable and are marked. NEEDS-COUNSEL before any of this
 * governs a real record: a covering arrangement is a business
 * associate or workforce question under HIPAA depending on how it is
 * structured, and that determines the paperwork, not this file.
 */
import type { Actor } from './session';

export type Action =
  | 'read-chart'
  | 'write-note'
  | 'sign-note'
  | 'prescribe'
  | 'acknowledge-result'
  | 'sign-plan'
  | 'edit-plan'
  | 'read-journal'
  | 'add-patient'
  | 'remove-patient'
  | 'load-data'
  | 'move-clock'
  | 'read-audit';

export interface Ctx {
  /** The chart in question, where the action has one. */
  patientId?: string;
  /** The clinic's today, for checking a coverage window. */
  now?: string;
  /** Set on a patient-written entry the patient asked to be looked at. */
  flagged?: boolean;
}

export interface Verdict {
  allowed: boolean;
  /** Said on screen where the control would have been. Never silent. */
  why?: string;
}

const no = (why: string): Verdict => ({ allowed: false, why });
const yes: Verdict = { allowed: true };

/** Has the covering arrangement run out? */
export function coverExpired(a: Actor, now?: string): boolean {
  return a.role === 'covering' && !!a.coverUntil && !!now && now > a.coverUntil;
}

export function can(a: Actor, action: Action, ctx: Ctx = {}): Verdict {
  // ---------------------------------------------------------- patient
  if (a.role === 'patient') {
    if (ctx.patientId && ctx.patientId !== a.patientId) {
      return no('This is not your record.');
    }
    switch (action) {
      case 'read-chart':
        // The portal is the patient's view. The clinical chart is not
        // a redacted version of it, it is a different document, and
        // pretending otherwise is how notes leak.
        return no('Signed in as a patient. The portal shows your record.');
      case 'read-journal':
        return yes;
      default:
        return no('Signed in as a patient.');
    }
  }

  // ------------------------------------------------------- covering
  if (a.role === 'covering') {
    if (coverExpired(a, ctx.now)) {
      return no(`Cover ended ${a.coverUntil}. Access is read-only after that, and logged.`);
    }
    switch (action) {
      case 'read-chart':
      case 'write-note':
      case 'sign-note':
      case 'prescribe':
        // Someone has to be able to act, or cover is decorative.
        return yes;
      case 'acknowledge-result':
        // ARGUABLE. A result nobody acknowledges is the classic
        // failure, so cover must be able to. The log records who.
        return yes;
      case 'read-audit':
        return yes;
      case 'sign-plan':
        // ARGUABLE, and decided deliberately. The care plan is the
        // agreement between this patient and their own physician over
        // years. A clinician covering for a week can propose a change
        // and write what they think; signing it is not theirs.
        return no('A covering clinician can change the plan, but signing it stays with their own physician.');
      case 'edit-plan':
        return yes;
      case 'read-journal':
        // ARGUABLE. What someone writes in their own journal is not
        // automatically part of what a covering clinician needs. What
        // they flagged for attention is.
        return ctx.flagged
          ? yes
          : no('Entries the patient did not flag for attention are not part of cover.');
      case 'add-patient':
      case 'remove-patient':
      case 'load-data':
      case 'move-clock':
        return no('Membership and administration stay with the practice.');
      default:
        return no('Not part of this cover.');
    }
  }

  // ------------------------------------------------------ physician
  return yes;
}

export const allowed = (a: Actor, action: Action, ctx?: Ctx): boolean =>
  can(a, action, ctx).allowed;
