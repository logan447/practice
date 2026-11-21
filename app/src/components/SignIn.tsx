/**
 * Signing in as somebody.
 *
 * Switching identity here is not a preview. The covering clinician
 * really cannot sign a care plan, and the patient really cannot reach
 * the chart, because the same permission file decides both the screen
 * and the action behind it.
 *
 * Every switch is logged, including switching back. In a prototype
 * that is a demonstration; in a practice it is the thing an
 * investigation reads first.
 */
import { useState } from 'react';
import { useStore } from '../lib/store';
import { useNav } from '../lib/nav';
import {
  useActor, signInAs, PHYSICIAN, COVERING, ROLE_LABEL, type Actor,
} from '../lib/session';
import { record } from '../lib/audit';
import { addDays } from '../lib/clock';
import { fmtDate } from '../lib/format';
import { coverExpired } from '../lib/permissions';

/**
 * Who is signed in, as rows inside the account menu.
 *
 * Used to be its own control in the top bar. It is three questions
 * ("am I the physician, the cover, or a patient") asked rarely, and
 * it belongs with the other rarely-asked things rather than beside
 * the clock.
 */
export function SignInRows({ onDone }: { onDone: () => void }) {
  const a = useActor();
  const st = useStore();
  const nav = useNav();
  const [open, setOpen] = useState(false);

  const expired = coverExpired(a, st.now);
  const patient = a.patientId ? st.patient(a.patientId) : undefined;

  const go = (next: Actor) => {
    record(next, st.now, {
      action: 'sign-in', resource: 'Session', resourceId: next.id,
      patientId: next.patientId,
      summary: `Signed in as ${next.name} (${ROLE_LABEL[next.role].toLowerCase()})`,
    });
    signInAs(next);
    onDone();
    if (next.role === 'patient' && next.patientId) {
      nav.reset({ name: 'portal', patientId: next.patientId });
    } else {
      nav.reset({ name: 'schedule' });
    }
  };

  if (!open) {
    return (
      <button className="acctrow" onClick={() => setOpen(true)}>
        Sign in as someone else
        <span className="small muted">
          {a.role === 'patient' && patient ? patient.name : ROLE_LABEL[a.role]}
          {expired ? ' · expired' : ''}
        </span>
      </button>
    );
  }

  return (
    <div className="signinrows">
      <button className="acctrow" onClick={() => go(PHYSICIAN)}>
        {PHYSICIAN.name}
        <span className="small muted">Physician</span>
      </button>
      {/*
        * What cover cannot do, said before you switch rather than
        * discovered afterwards as a disabled button.
        */}
      <button className="acctrow tall"
        onClick={() => go({ ...COVERING, coverUntil: addDays(st.now, 7) })}>
        <span className="acctstack">
          <span>{COVERING.name}</span>
          <span className="small muted">
            Covering to {fmtDate(addDays(st.now, 7))}. Can read, write and sign a note.
            Cannot sign a care plan, change membership or move the clock.
          </span>
        </span>
      </button>
      <div className="acctlabel">As a patient</div>
      <div className="plist">
        {st.patients.slice(0, 40).map((p) => (
          <button key={p.id} className="acctrow thin" onClick={() => go({
            id: `pt-${p.id}`, name: p.name, role: 'patient', patientId: p.id,
          })}>
            {p.name}
          </button>
        ))}
        {st.patients.length === 0 && (
          <div className="acctrow thin muted small">No patients yet.</div>
        )}
      </div>
    </div>
  );
}

/** Said where a control would have been, rather than hiding it silently. */
export function Blocked({ why }: { why: string }) {
  return <span className="blocked" title={why}>{why}</span>;
}
