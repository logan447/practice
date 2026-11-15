/**
 * What is left hanging when the practice closes.
 *
 * This is the screen that makes a planned absence a safe one. The
 * difference between a closure and an abandonment is not the length,
 * it is whether anything clinically live was left spanning the gap,
 * and the only way to know that is to go patient by patient and
 * check.
 *
 * Four things can be left hanging and all four are findable in the
 * record:
 *
 * A prescription that runs out while nobody is here to renew it. A
 * test that falls due inside the gap and will not be looked at. A
 * question we asked the patient that nobody will read the answer to.
 * A referral with no follow-up date on our side.
 *
 * None of these is a reason not to close. Each one is a reason to do
 * something before closing, and the something is usually small: a
 * longer supply, a lab moved forward a fortnight, a request
 * cancelled, a date written down.
 *
 * Nothing here decides anything. It finds, and says what it found.
 */
import type {
  AwayBlock,
} from '../domain/schedule';
import type {
  InfoRequest, Medication, Patient, PreventionItem, Specialist, Encounter,
} from '../domain/types';
import { fmtDate } from './format';

export type HangingKind = 'supply' | 'due' | 'asked' | 'referral' | 'nobody';

export interface Hanging {
  kind: HangingKind;
  /** One line, specific enough to act on without opening anything. */
  text: string;
  /** What to do about it, where there is an obvious thing. */
  fix?: string;
  urgent: boolean;
}

export interface ClosureCheck {
  patientId: string;
  name: string;
  items: Hanging[];
  /** Anything booked for them after the practice reopens. */
  nextAfter?: Encounter;
}

export interface ClosureInput {
  closure: AwayBlock;
  now: string;
  patients: Patient[];
  medications: Medication[];
  prevention: PreventionItem[];
  infoRequests: InfoRequest[];
  specialists: Specialist[];
  encounters: Encounter[];
}

/**
 * A prescription's cover, estimated from its sig.
 *
 * Deliberately crude and deliberately pessimistic. The record does
 * not carry a dispense date or a day supply, so this cannot be
 * computed properly, and a number that looked computed would be
 * worse than one that announces itself as a prompt. What it does is
 * raise every active prescription against a long closure, which is
 * the right default: somebody should look at each one.
 *
 * UNSET: day supply and last dispense date. When the record carries
 * them this becomes arithmetic instead of a prompt.
 */
const coverUnknown = (m: Medication): boolean => m.status === 'active';

export function closureChecks(i: ClosureInput): ClosureCheck[] {
  const { from, to } = i.closure;
  const out: ClosureCheck[] = [];

  for (const p of i.patients) {
    const items: Hanging[] = [];

    // --- prescriptions, where nobody can renew them
    const meds = i.medications.filter((m) => m.patientId === p.id && coverUnknown(m));
    if (meds.length > 0) {
      items.push({
        kind: 'supply',
        text: `${meds.length} active prescription${meds.length === 1 ? '' : 's'}: ${
          meds.slice(0, 4).map((m) => m.name).join(', ')}${meds.length > 4 ? ' and others' : ''}.`,
        fix: 'Check each has supply through the closure, or write it before going.',
        urgent: false,
      });
    }

    // --- anything due while we are shut
    const due = i.prevention.filter(
      (x) => x.patientId === p.id && x.dueBy && x.dueBy >= from && x.dueBy <= to,
    );
    for (const d of due) {
      items.push({
        kind: 'due',
        text: `${d.name} falls due ${fmtDate(d.dueBy!)}, inside the closure.`,
        fix: 'Move it before the closure, or tell them it waits and why.',
        urgent: false,
      });
    }

    // --- questions nobody will read the answer to
    const asked = i.infoRequests.filter(
      (r) => r.patientId === p.id && r.status === 'open',
    );
    if (asked.length > 0) {
      items.push({
        kind: 'asked',
        text: `${asked.length} open request${asked.length === 1 ? '' : 's'}: ${
          asked[0].ask}`,
        fix: 'Answer it before closing, or cancel it rather than leave them sending into nothing.',
        urgent: false,
      });
    }

    // --- referrals with nothing on our side
    // "None" is an answer somebody wrote down, not something
    // outstanding. A list that reports it as a loose end teaches the
    // reader to skim the list, which is the one thing it cannot afford.
    const loose = i.specialists.filter(
      (sp) => sp.patientId === p.id
        && sp.outstanding
        && !/^(none|nothing|n\/a|no)\b/i.test(sp.outstanding.trim()),
    );
    for (const sp of loose) {
      items.push({
        kind: 'referral',
        text: `${sp.specialty}: ${sp.outstanding}`,
        fix: 'Give it a date on our side, or it comes back as a surprise in two months.',
        urgent: false,
      });
    }

    // --- the one that matters most
    const pcp = p.pcp;
    const hasNoPcp = !pcp || ('none' in pcp && pcp.none);
    if (hasNoPcp) {
      items.push({
        kind: 'nobody',
        text: 'No primary care physician on file. While the practice is closed this patient has no physician.',
        fix: 'This is the one to deal with before the closure, not after it.',
        urgent: true,
      });
    }

    if (items.length === 0) continue;
    out.push({
      patientId: p.id,
      name: p.name,
      items,
      nextAfter: i.encounters
        .filter((e) => e.patientId === p.id && e.status !== 'signed' && e.date > to)
        .sort((a, b) => a.date.localeCompare(b.date))[0],
    });
  }

  // Urgent first, then by how much is outstanding.
  return out.sort((a, b) => {
    const au = a.items.some((x) => x.urgent) ? 1 : 0;
    const bu = b.items.some((x) => x.urgent) ? 1 : 0;
    if (au !== bu) return bu - au;
    return b.items.length - a.items.length;
  });
}
