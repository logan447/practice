/**
 * Who is using this right now.
 *
 * The prototype had a "Their view" button, which is a fiction: it
 * showed the patient's screen while still being the physician. That
 * hides every question worth asking. Three real identities instead,
 * each of which can only do what its role allows:
 *
 *   physician  the person responsible for the panel
 *   covering   another clinician, for a bounded window
 *   patient    one person, their own record only
 *
 * The covering clinician is the one that does the work. Everything a
 * record has to decide about access shows up the moment someone who is
 * not you, and not the patient, needs to read the chart on a Tuesday
 * while you are away.
 *
 * Kept in its own store, not in the clinical state, because who is
 * logged in is not part of the record.
 */
import { useEffect, useState } from 'react';
import { load, save } from './persist';

export type Role = 'physician' | 'covering' | 'patient';

export interface Actor {
  id: string;
  name: string;
  role: Role;
  /** Set for the patient role: the only chart they can reach. */
  patientId?: string;
  /**
   * Set for a covering clinician. Access ends on this clinic date,
   * which is the part most systems leave open-ended and then forget.
   */
  coverUntil?: string;
  /** Why they have access at all. Shown in the log beside every entry. */
  reason?: string;
}

export const ROLE_LABEL: Record<Role, string> = {
  physician: 'Physician',
  covering: 'Covering clinician',
  patient: 'Patient',
};

export const PHYSICIAN: Actor = {
  id: 'u-dubose', name: 'Logan L. DuBose, MD, MBA', role: 'physician',
};

export const COVERING: Actor = {
  id: 'u-okonjo', name: 'A. Okonjo, MD', role: 'covering',
  reason: 'Covering while the practice is closed',
};

const KEY = 'dlm-emr-session-v1';

let current: Actor = PHYSICIAN;
const listeners = new Set<() => void>();

try {
  const raw = localStorage.getItem(KEY);
  if (raw) current = JSON.parse(raw) as Actor;
} catch { /* first run */ }

export const actor = (): Actor => current;

export function signInAs(a: Actor): void {
  current = a;
  try { localStorage.setItem(KEY, JSON.stringify(a)); } catch { /* ignore */ }
  listeners.forEach((f) => f());
}

export function subscribe(f: () => void): () => void {
  listeners.add(f);
  return () => listeners.delete(f);
}

/** Re-renders whoever uses it when the signed-in person changes. */
export function useActor(): Actor {
  const [a, setA] = useState<Actor>(current);
  useEffect(() => subscribe(() => setA(current)), []);
  return a;
}

export const _persist = { load, save };
