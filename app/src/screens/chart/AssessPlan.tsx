/**
 * The two pieces of the assessment the encounter workspace still uses.
 *
 * The chart's care plan tab is gone, and with it the four rendered
 * sections that used to live here. What survives is the one-liner,
 * which is the sentence a physician would say out loud about this
 * patient, composed from the problem list and the services rather
 * than typed; and the intervention row, which says what is being done
 * and how it is going in the same three words whether the thing is a
 * drug, a lab, a referral, a vaccine or a lifestyle prescription.
 */
import { Chip } from '../../components/ui';
import { age } from '../../lib/format';
import { abbrev } from '../../lib/clinical';
import type { Intervention } from '../../lib/interventions';
import { ACTION_LABEL } from '../../domain/types';
import type { Condition, Patient } from '../../domain/types';

const actionTone = (a: Intervention['status']) =>
  (a === 'needs-attention' ? 'warn' : undefined);

/** One row: what it is, how it is going, and nothing else. */
export function ActionRow({ iv }: { iv: Intervention }) {
  return (
    <li className="actrow">
      <span className="actl">{iv.label}</span>
      <Chip tone={actionTone(iv.status)}>{ACTION_LABEL[iv.status]}</Chip>
      {iv.note && <span className="actn">{iv.note}</span>}
    </li>
  );
}

/** The sentence a physician would say out loud about this patient. */
/**
 * The one-liner, in the form a physician would write it.
 *
 * "60F with PMH of HTN, T2DM and HLD, following with our office for
 * management of HTN, T2DM, preventative services and lifestyle
 * medicine." Two facts in one line: everything they carry, and the
 * subset this practice has taken on. The second half is the one that
 * is usually missing from a chart and the one that decides what the
 * rest of this document is about.
 */
export function oneLiner(p: Patient, conditions: Condition[]): string {
  const years = age(p.dob);
  const sex = p.sex === 'female' ? 'F' : p.sex === 'male' ? 'M' : '';
  const history = conditions.filter((c) => c.status !== 'resolved');
  const managed = history.filter((c) => c.managed);
  const svc = p.services ?? { preventative: true, lifestyle: true };

  const list = (xs: string[]) =>
    (xs.length === 0 ? 'nothing recorded'
      : xs.length === 1 ? xs[0]
        : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);

  const pmh = list([...new Set(history.map((c) => abbrev(c.name)))]);
  const following = list([
    ...new Set(managed.map((c) => abbrev(c.name))),
    ...(svc.preventative ? ['preventative services'] : []),
    ...(svc.lifestyle ? ['lifestyle medicine'] : []),
  ]);

  return `${years}${sex} with PMH of ${pmh}, following with our office for management of ${following}.`;
}

// ------------------------------------------------------------ assessment
