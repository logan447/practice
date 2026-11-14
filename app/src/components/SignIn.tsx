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

export function ActorControl() {
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
    setOpen(false);
    if (next.role === 'patient' && next.patientId) {
      nav.reset({ name: 'portal', patientId: next.patientId });
    } else {
      nav.reset({ name: 'patients' });
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <button className={`btn quiet sm whoami${a.role === 'physician' ? '' : ' other'}`}
        onClick={() => setOpen((v) => !v)} title="Who is signed in">
        <span className="dot" />
        {a.role === 'patient' && patient ? patient.name : a.name}
        <span className="rolename">{ROLE_LABEL[a.role]}{expired ? ' · expired' : ''}</span>
      </button>

      {open && (
        <div className="signin">
          <div className="eyebrow" style={{ padding: '10px 13px 6px' }}>Sign in as</div>

          <button className="srow" onClick={() => go(PHYSICIAN)}>
            <strong>{PHYSICIAN.name}</strong>
            <span className="small muted">Physician. The panel is theirs, so everything is open.</span>
          </button>

          <button className="srow" onClick={() => go({
            ...COVERING,
            coverUntil: addDays(st.now, 7),
          })}>
            <strong>{COVERING.name}</strong>
            <span className="small muted">
              Covering clinician until {fmtDate(addDays(st.now, 7))}. Can read, write and
              sign a note. Cannot sign a care plan, change membership or move the clock.
              Every chart opened is logged.
            </span>
          </button>

          <div className="eyebrow" style={{ padding: '12px 13px 4px' }}>Or as a patient</div>
          <div className="plist">
            {st.patients.slice(0, 40).map((p) => (
              <button key={p.id} className="srow thin" onClick={() => go({
                id: `pt-${p.id}`, name: p.name, role: 'patient', patientId: p.id,
              })}>
                {p.name}
              </button>
            ))}
            {st.patients.length === 0 && (
              <div className="srow thin muted small">No patients yet.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** Said where a control would have been, rather than hiding it silently. */
export function Blocked({ why }: { why: string }) {
  return <span className="blocked" title={why}>{why}</span>;
}
