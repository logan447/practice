/**
 * One problem, and what we are doing about it.
 *
 * The chart no longer has a care plan tab. The care plan is written
 * inside an encounter, where it belongs, and read here: a line in the
 * right column opens the standing plan for that one problem, which is
 * what a physician actually wants when they look at a problem list.
 * Reading the whole document four problems at a time was the tab's
 * only job and it was the wrong unit.
 */
import { useState } from 'react';
import { useStore } from '../../lib/store';
import { fmtDate } from '../../lib/format';
import { medsAbout } from './relate';
import { relevantSeries } from '../../lib/clinical';
import { LIFESTYLE_DOMAINS, OWNER_LABEL } from '../../domain/types';
import type { ProblemOwner } from '../../domain/types';
import { Sheet } from './Rows';
import { livingSubjective } from '../../lib/subjective';

export function ProblemSheet({ patientId, conditionId, onClose }: {
  patientId: string; conditionId: string; onClose: () => void;
}) {
  const st = useStore();
  const [showSources, setShowSources] = useState(false);
  const [askOwner, setAskOwner] = useState(false);
  const c = st.conditionsFor(patientId).find((x) => x.id === conditionId);
  const mp = st.masterPlanFor(patientId);
  const meds = medsAbout(c?.name ?? '', st.medsFor(patientId).filter((m) => m.status !== 'stopped'));
  const series = c ? relevantSeries(st.seriesFor(patientId), [c], 3) : [];
  const lifestyle = st.lifestyleFor(patientId).filter((l) => l.forConditions.includes(conditionId));
  const plan = mp?.plan.byProblem[conditionId];

  /*
   * The approved summary for this one problem, or a derivation when
   * nothing has been approved yet.
   *
   * The order matters and is the whole design. A record arriving must
   * never move what the chart says: it is counted on the rail and
   * read inside the review that will incorporate it. Deriving here
   * instead would turn the chart back into a feed.
   */
  const derived = livingSubjective({
    patientId, now: st.now,
    conditions: st.conditionsFor(patientId),
    medications: st.medsFor(patientId),
    encounters: st.encountersFor(patientId),
    updates: st.updatesFor(patientId),
    messages: st.messagesFor(patientId),
    checkIns: st.checkInsFor(patientId),
    specialists: st.specialistsFor(patientId),
    panels: st.panelsFor(patientId),
    vitals: st.vitalsFor(patientId),
    studies: st.studiesFor(patientId),
    prevention: st.preventionFor(patientId),
    lifestyle: st.lifestyleFor(patientId),
    orders: st.ordersForPatient(patientId),
  });
  const approved = st.currentVersion(patientId)?.subjective as
    ReturnType<typeof livingSubjective> | undefined;
  const live = approved ?? derived;
  const summary = live.problems.find((x) => x.conditionId === conditionId);

  if (!c) return null;
  const domain = (d: string) => LIFESTYLE_DOMAINS.find((x) => x.id === d)?.label ?? d;

  return (
    <Sheet title={c.name}
      sub={[c.code, c.goal === 'at-goal' ? 'Controlled'
        : c.goal ? 'Uncontrolled' : 'Not assessed'].filter(Boolean).join(' · ')}
      onClose={onClose}>
      {/*
        * Who is responsible for this problem.
        *
        * A consulting practice manages named conditions, and the
        * commonest case is that the patient's own physician has one.
        * A boolean "managed" could never say that, and a problem
        * nobody has claimed is one the patient may believe we are
        * watching. Asked here, on the problem itself.
        */}
      <div className="ownerrow">
        {c.owner && !askOwner ? (
          <>
            <span className="small muted">{OWNER_LABEL[c.owner]}</span>
            <button className="linkish" onClick={() => setAskOwner(true)}>change</button>
          </>
        ) : (
          <>
            <span className="ownerask">Who manages this?</span>
            {(['ours', 'shared', 'theirs'] as ProblemOwner[]).map((o) => (
              <button key={o} className={`btn sm ${c.owner === o ? '' : 'ghost'}`}
                onClick={() => { st.setOwner(c.id, o); setAskOwner(false); }}>
                {OWNER_LABEL[o]}
              </button>
            ))}
          </>
        )}
      </div>

      {summary && summary.clauses.length > 0 && (
        <Part label="Where they are now">
          <p className="psum">
            {[...summary.clauses.filter((x) => x.voice === 'patient'),
              ...summary.clauses.filter((x) => x.voice === 'documented')]
              .map((x) => x.text).join(' ')}
          </p>
          {/*
            * The citation, kept.
            *
            * Every sentence above is composed from records at read
            * time, and a derived sentence a reader cannot trace is a
            * sentence they have to take on faith. One line, and the
            * records are behind it.
            */}
          <button className="srcmark" onClick={() => setShowSources((v) => !v)}>
            Composed from {summary.sources.length} record
            {summary.sources.length === 1 ? '' : 's'} when this opened. Nothing here is stored.
          </button>
          {showSources && (
            <ul className="srclist">
              {summary.sources.map((r) => (
                <li key={r.id} className="srcitem">
                  <span className="srckind">{r.kind}</span>
                  <span>{r.label}</span>
                  <span className="muted">{fmtDate(r.date)}</span>
                </li>
              ))}
            </ul>
          )}
        </Part>
      )}

      <Part label="Plan">
        {plan ? <p>{plan}</p> : <p className="muted">No plan written for this problem yet.</p>}
      </Part>

      <Part label="Being treated with">
        {meds.length === 0 ? <p className="muted">No medicine on the list is coded to this problem.</p> : (
          <ul className="plainlist">
            {meds.map((m) => <li key={m.id}>{m.name} {m.dose} &mdash; {m.sig}</li>)}
          </ul>
        )}
      </Part>

      {lifestyle.length > 0 && (
        <Part label="Lifestyle prescriptions">
          <ul className="plainlist">
            {lifestyle.map((l) => <li key={l.id}>{domain(l.domain)}: {l.prescription}</li>)}
          </ul>
        </Part>
      )}

      <Part label="How it is going">
        {series.length === 0 ? <p className="muted">Nothing is being measured for this problem.</p> : (
          <ul className="plainlist">
            {series.map((s) => {
              const last = s.points[s.points.length - 1];
              return (
                <li key={s.id}>
                  {s.name} {last.value}{s.unit ? ` ${s.unit}` : ''}
                  <span className="muted"> &middot; {fmtDate(last.date)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </Part>

      {mp?.plan.followUp && <Part label="Follow-up"><p>{mp.plan.followUp}</p></Part>}

      {mp && (
        <p className="small muted" style={{ marginTop: 18 }}>
          Care plan last updated {fmtDate(mp.updated)} by {mp.updatedBy}. It is written and
          changed inside a visit.
        </p>
      )}
    </Sheet>
  );
}

const Part = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 16 }}>
    <div className="eyebrow" style={{ marginBottom: 5 }}>{label}</div>
    {children}
  </div>
);
