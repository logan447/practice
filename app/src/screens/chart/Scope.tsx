/**
 * The agreement, as the chart holds it.
 *
 * A consulting practice is safe to the extent that both sides can say
 * what is on each of four lists, and dangerous to the extent that
 * only one of them can. Two of the lists are the practice's and are
 * the same for everybody. Two are this patient's and live here.
 *
 * The list that does the work is the first one. "Managed" was a
 * boolean and could say that this practice had taken a problem on; it
 * could not say that the patient's own physician has it, which is the
 * commonest case and the one that matters when something goes wrong.
 * A problem with no owner recorded is shown as a question rather than
 * assumed either way, because the specific failure this model is
 * exposed to is a patient and a physician believing different things
 * about who is watching something.
 */
import { useStore } from '../../lib/store';
import { Chip, Empty } from '../../components/ui';
import { OWNER_LABEL } from '../../domain/types';
import type { ProblemOwner } from '../../domain/types';

const OURS: string[] = [
  'A comprehensive health assessment',
  'Scheduled consultations during the service periods',
  'An individualised preventive and lifestyle care plan',
  'Management of the conditions named above as ours',
  'Medication management and laboratory testing for those conditions',
  'Periodic care plan reviews between consultations',
  'Messaging and follow-up while the practice is open',
];

const NOT_OURS: string[] = [
  'Primary care',
  'Urgent care and emergency care',
  'Care while the practice is closed',
  'Continuous physician availability',
  'Conditions not named above as ours',
  'Anything needing an examination this practice cannot provide',
];

export function Scope({ patientId }: { patientId: string }) {
  const st = useStore();
  const p = st.patient(patientId);
  const conditions = st.conditionsFor(patientId).filter((c) => c.status === 'active');
  const pcp = p?.pcp;
  const noPcp = !pcp || ('none' in pcp && pcp.none);

  const by = (o: ProblemOwner) => conditions.filter((c) => c.owner === o);
  const unasked = conditions.filter((c) => !c.owner);

  return (
    <div className="stack">
      <p className="drawerlead">
        This practice is a consulting practice. It manages named conditions and provides
        named services, and it is not anybody&rsquo;s primary care. What follows is what
        that means for this patient in particular.
      </p>

      {/* ------------------------------------------- 1. the problems */}
      <section className="scopeblock">
        <h3>Conditions, and who is responsible</h3>
        {conditions.length === 0 ? <Empty>No active problems on the list.</Empty> : (
          <ul className="scopelist">
            {(['ours', 'shared', 'theirs'] as ProblemOwner[]).map((o) => (
              by(o).length === 0 ? null : (
                <li key={o}>
                  <span className="scopek">{OWNER_LABEL[o]}</span>
                  <span>{by(o).map((c) => c.name).join(', ')}</span>
                </li>
              )
            ))}
            {unasked.length > 0 && (
              <li>
                <span className="scopek" style={{ color: 'var(--warn)' }}>Nobody has said</span>
                <span>
                  {unasked.map((c) => c.name).join(', ')}.{' '}
                  <span className="small muted">
                    Set an owner in the assessment. A problem nobody has claimed is one the
                    patient may believe we are watching.
                  </span>
                </span>
              </li>
            )}
          </ul>
        )}
      </section>

      {/* ------------------------------------------- 2. their own physician */}
      <section className="scopeblock">
        <h3>Their primary care physician</h3>
        {noPcp ? (
          <>
            <p className="scopewarn">
              None on file. While this practice is closed, and for anything outside the
              list above, this patient has no physician.
            </p>
            {pcp && 'plan' in pcp && pcp.plan && (
              <p className="small muted">{pcp.plan}</p>
            )}
            <p className="small muted">
              Carry establishing primary care as a plan item with a status, like any other.
              A sentence in an agreement does not make somebody who has no other physician
              into somebody who has one.
            </p>
          </>
        ) : (
          <p>
            {'name' in pcp ? pcp.name : ''}
            {'practice' in pcp && pcp.practice ? ` · ${pcp.practice}` : ''}
            {'since' in pcp && pcp.since ? ` · since ${pcp.since.slice(0, 4)}` : ''}
          </p>
        )}
      </section>

      {/* --------------------------------------- 3 and 4. the practice's lists */}
      <section className="scopeblock">
        <h3>What the membership includes</h3>
        <ul className="scopebullets">
          {OURS.map((x) => <li key={x}>{x}</li>)}
        </ul>
      </section>

      <section className="scopeblock">
        <h3>What it does not include</h3>
        <ul className="scopebullets">
          {NOT_OURS.map((x) => <li key={x}><Chip tone="crit">No</Chip> {x}</li>)}
        </ul>
      </section>

      <section className="scopeblock">
        <h3>What the patient is responsible for</h3>
        <ul className="scopebullets">
          <li>
            Having a primary care physician, or working toward one
            {noPcp && <strong> &mdash; outstanding for this patient</strong>}
          </li>
          <li>Telling us about hospital stays, new diagnoses and new prescriptions</li>
          <li>Sending the measurements we ask for</li>
          <li>Going elsewhere for anything urgent, and for anything not on our list</li>
        </ul>
      </section>

      <p className="small muted">
        The last two lists are the practice&rsquo;s and belong in the agreement. The first
        two are this patient&rsquo;s and belong here, because they change.
      </p>
    </div>
  );
}
