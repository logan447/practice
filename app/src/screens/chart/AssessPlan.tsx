/**
 * Assessment and Plan, as structure rather than prose.
 *
 * The assessment opens with the one-liner, which is the sentence a
 * physician would say out loud about this patient, composed from the
 * problem list and the services rather than typed. Under it, the same
 * three categories in the same order everywhere on this chart:
 * chronic conditions, preventative services, lifestyle medicine.
 *
 * Status is two words and one treatment.
 *
 * A category is at goal or needs improvement. That is the only
 * question a reader is asking when they scan a chart, and four-point
 * scales answer a question nobody asked while making the page harder
 * to read. The nuance lives in the sentence underneath, which is
 * where nuance can be qualified.
 *
 * An intervention is active, needs attention, or complete. The same
 * three words cover a drug, a lab, a referral, a vaccine and a
 * lifestyle prescription, so the eye learns one vocabulary instead of
 * five. Detail that used to sit in the badge ("taking as prescribed",
 * "struggling, knees hurt by the end") sits in the record and in the
 * subjective, where it reads as clinical content rather than as
 * decoration.
 *
 * Colour is used once: for what needs attention. Everything else is
 * the page's own ink.
 */
import { useState } from 'react';
import { useStore } from '../../lib/store';
import { Chip } from '../../components/ui';
import { fmtDate } from '../../lib/format';
import { interventionsFor } from '../../lib/interventions';
import type { Intervention } from '../../lib/interventions';
import {
  GOAL_LABEL, ACTION_LABEL, LIFESTYLE_DOMAINS,
} from '../../domain/types';
import type { CareGoalStatus, Condition, MasterPlan, Patient } from '../../domain/types';

const goalTone = (g?: CareGoalStatus) => (g === 'at-goal' ? undefined : 'warn');
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
export function oneLiner(p: Patient, conditions: Condition[]): string {
  const age = Math.floor(
    (Date.now() - Date.parse(p.dob)) / 31557600000,
  );
  const sex = p.sex === 'female' ? 'female' : p.sex === 'male' ? 'male' : 'patient';
  const history = conditions.filter((c) => c.status !== 'resolved');
  const managed = history.filter((c) => c.managed);
  const svc = p.services ?? { preventative: true, lifestyle: true };
  const following = [
    ...managed.map((c) => c.name.toLowerCase()),
    ...(svc.preventative ? ['preventative services'] : []),
    ...(svc.lifestyle ? ['lifestyle medicine'] : []),
  ];
  const list = (xs: string[]) =>
    (xs.length <= 1 ? (xs[0] ?? 'nothing recorded')
      : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);

  return `${p.name} is a ${age}-year-old ${sex} with a past medical history of ${
    list(history.map((c) => c.name.toLowerCase()))
  }, following with our office for ${list(following)}.`;
}

// ------------------------------------------------------------ assessment

export function Assessment({ patientId }: { patientId: string }) {
  const st = useStore();
  const p = st.patient(patientId);
  const conditions = st.conditionsFor(patientId);
  const managed = conditions.filter((c) => c.managed && c.status === 'active');
  const prevention = st.preventionFor(patientId);
  const lifestyle = st.lifestyleFor(patientId);
  const behind = prevention.filter((x) => x.status !== 'current');
  const lsBehind = lifestyle.filter(
    (x) => x.status === 'struggling' || x.status === 'not-started',
  );
  if (!p) return null;
  const svc = p.services ?? { preventative: true, lifestyle: true };

  return (
    <div className="soapbody">
      <p className="oneliner">{oneLiner(p, conditions)}</p>

      <div className="catblock">
        <div className="cathead"><h4>Chronic conditions</h4></div>
        {managed.length === 0 ? (
          <p className="snone">None being managed here.</p>
        ) : (
          <ul className="goallist">
            {managed.map((c) => <GoalRow key={c.id} c={c} />)}
          </ul>
        )}
      </div>

      {svc.preventative && (
        <div className="catblock">
          <div className="cathead">
            <h4>Preventative services</h4>
            <Chip tone={behind.length > 0 || prevention.length === 0 ? 'warn' : undefined}>
              {prevention.length === 0 ? GOAL_LABEL['needs-improvement']
                : behind.length > 0 ? GOAL_LABEL['needs-improvement'] : GOAL_LABEL['at-goal']}
            </Chip>
          </div>
          <p className="catline">
            {prevention.length === 0
              ? 'Nothing scheduled yet, so nothing has been judged due or not due.'
              : behind.length > 0
                ? `${behind.map((x) => x.name).join(', ')} outstanding.`
                : 'Everything on the schedule is current.'}
          </p>
        </div>
      )}

      {svc.lifestyle && (
        <div className="catblock">
          <div className="cathead">
            <h4>Lifestyle medicine</h4>
            <Chip tone={lsBehind.length > 0 || lifestyle.length === 0 ? 'warn' : undefined}>
              {lifestyle.length === 0 || lsBehind.length > 0
                ? GOAL_LABEL['needs-improvement'] : GOAL_LABEL['at-goal']}
            </Chip>
          </div>
          <p className="catline">
            {lifestyle.length === 0
              ? 'Nothing prescribed yet.'
              : lsBehind.length > 0
                ? `${lsBehind.map((x) => LIFESTYLE_DOMAINS.find((d) => d.id === x.domain)?.label ?? x.domain).join(', ')} not going as prescribed.`
                : 'Every prescription is running.'}
          </p>
        </div>
      )}
    </div>
  );
}

/** At goal or not, clickable, with the reason underneath. */
function GoalRow({ c }: { c: Condition }) {
  const st = useStore();
  const [open, setOpen] = useState(false);
  const g = c.goal ?? 'needs-improvement';

  return (
    <li className="goalrow">
      <button className="goalname" onClick={() => setOpen((v) => !v)}>
        <span className="gn">{c.name}</span>
        {c.code && <span className="ppcode">{c.code}</span>}
        <Chip tone={goalTone(c.goal)}>
          {c.goal ? GOAL_LABEL[c.goal] : 'Not assessed'}
        </Chip>
      </button>
      {c.goalNote && <p className="goalnote">{c.goalNote}</p>}
      {open && (
        <div className="goalset">
          {(['at-goal', 'needs-improvement'] as CareGoalStatus[]).map((x) => (
            <button key={x} className={`btn sm ${x === g ? '' : 'ghost'}`}
              onClick={() => { st.setGoal(c.id, x); setOpen(false); }}>
              {GOAL_LABEL[x]}
            </button>
          ))}
          {c.goalAssessed && (
            <span className="muted small">last judged {fmtDate(c.goalAssessed)}</span>
          )}
        </div>
      )}
    </li>
  );
}

// ------------------------------------------------------------------ plan

export function Plan({ patientId, master, onSetProblem, prose }: {
  patientId: string;
  master?: MasterPlan;
  onSetProblem: (conditionId: string, text: string) => void;
  prose: {
    problem: (cid: string, value: string, onSave: (v: string) => void) => React.ReactNode;
    prevention: React.ReactNode;
    lifestyle: React.ReactNode;
  };
}) {
  const st = useStore();
  const p = st.patient(patientId);
  const conditions = st.conditionsFor(patientId);
  const managed = conditions.filter((c) => c.managed && c.status === 'active');
  const prevention = st.preventionFor(patientId);
  const lifestyle = st.lifestyleFor(patientId);
  const svc = p?.services ?? { preventative: true, lifestyle: true };
  const P = {
    byProblem: master?.plan?.byProblem ?? {},
    prevention: master?.plan?.prevention ?? '',
    lifestyle: master?.plan?.lifestyle ?? '',
  };

  const input = {
    conditions,
    medications: st.medsFor(patientId),
    lifestyle,
    prevention,
    specialists: st.specialistsFor(patientId),
    orders: st.ordersForPatient(patientId),
    checkIns: st.checkInsFor(patientId),
    vitals: st.vitalsFor(patientId),
  };

  return (
    <div className="soapbody">
      {managed.map((c) => {
        const ivs = interventionsFor(c, input);
        return (
          <div key={c.id} className="problemplan" id={`problem-${c.id}`}>
            <div className="pphead">
              <strong>{c.name}</strong>
              {c.code && <span className="ppcode">{c.code}</span>}
              <Chip tone={goalTone(c.goal)}>
                {c.goal ? GOAL_LABEL[c.goal] : 'Not assessed'}
              </Chip>
            </div>
            {ivs.length === 0
              ? <p className="snone">Nothing is being done about this at the moment.</p>
              : <ul className="actlist">{ivs.map((iv, i) => <ActionRow key={i} iv={iv} />)}</ul>}
            {prose.problem(c.id, P.byProblem[c.id] ?? '', (v) => onSetProblem(c.id, v))}
          </div>
        );
      })}

      {svc.preventative && (
        <div className="problemplan">
          <div className="pphead"><strong>Preventative care</strong></div>
          {prevention.length === 0
            ? <p className="snone">Nothing scheduled yet.</p>
            : (
              <ul className="actlist">
                {prevention.map((x) => (
                  <ActionRow key={x.id} iv={{
                    label: x.name,
                    status: x.status === 'current' ? 'complete' : 'needs-attention',
                    note: x.status === 'current' && x.lastDone
                      ? `last ${fmtDate(x.lastDone)}`
                      : x.dueBy ? `due ${fmtDate(x.dueBy)}` : undefined,
                  }} />
                ))}
              </ul>
            )}
          {prose.prevention}
        </div>
      )}

      {svc.lifestyle && (
        <div className="problemplan">
          <div className="pphead"><strong>Lifestyle medicine</strong></div>
          {lifestyle.length === 0
            ? <p className="snone">Nothing prescribed yet.</p>
            : (
              <ul className="actlist">
                {lifestyle.map((li) => (
                  <ActionRow key={li.id} iv={{
                    label: LIFESTYLE_DOMAINS.find((d) => d.id === li.domain)?.label ?? li.domain,
                    status: li.status === 'achieved' ? 'complete'
                      : li.status === 'struggling' || li.status === 'not-started'
                        ? 'needs-attention' : 'active',
                    note: li.prescription.replace(/\.$/, ''),
                  }} />
                ))}
              </ul>
            )}
          <AddLifestyle patientId={patientId} />
          {prose.lifestyle}
        </div>
      )}
    </div>
  );
}

/** A lifestyle prescription: a domain, an ask, and the problems it is for. */
function AddLifestyle({ patientId }: { patientId: string }) {
  const st = useStore();
  const [open, setOpen] = useState(false);
  const [domain, setDomain] = useState(LIFESTYLE_DOMAINS[0].id);
  const [text, setText] = useState('');
  const [forC, setForC] = useState<string[]>([]);
  const managed = st.conditionsFor(patientId).filter((c) => c.managed && c.status === 'active');

  if (!open) {
    return <button className="linkish addproblem" onClick={() => setOpen(true)}>+ Prescription</button>;
  }
  return (
    <div className="addproblembox" style={{ maxWidth: 'none', marginTop: 10 }}>
      <div className="row" style={{ gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {LIFESTYLE_DOMAINS.map((d) => (
          <button key={d.id} className={`btn sm ${domain === d.id ? '' : 'ghost'}`}
            onClick={() => setDomain(d.id)}>{d.label}</button>
        ))}
      </div>
      <input className="search" autoFocus value={text}
        placeholder="What you are actually asking them to do"
        onChange={(e) => setText(e.target.value)} />
      {managed.length > 0 && (
        <div className="row" style={{ gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
          {managed.map((c) => (
            <button key={c.id} className={`btn sm ${forC.includes(c.id) ? '' : 'ghost'}`}
              onClick={() => setForC((v) => (v.includes(c.id)
                ? v.filter((x) => x !== c.id) : [...v, c.id]))}>
              {c.name}
            </button>
          ))}
        </div>
      )}
      <div className="row" style={{ marginTop: 9, gap: 7 }}>
        <button className="btn sm" disabled={!text.trim()}
          onClick={() => {
            st.addLifestyle(patientId, domain, text.trim(), forC);
            setText(''); setForC([]); setOpen(false);
          }}>Prescribe</button>
        <button className="btn ghost sm" onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </div>
  );
}
