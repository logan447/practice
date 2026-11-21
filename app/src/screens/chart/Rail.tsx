/**
 * The right column: what this practice is doing, and how it is going.
 *
 * Four blocks, the same four on every chart, in the same order. The
 * first one is the whole practice model in a list: the conditions we
 * manage, then lifestyle medicine, then preventative medicine, each
 * written the same way, because to this practice they are three kinds
 * of the same thing rather than one real list and two services
 * mentioned in the header.
 *
 * Each line carries its own evidence: what is being done for it and
 * the last number that says whether it is working. A list of names
 * makes you go and find both somewhere else, which is the work this
 * column exists to remove.
 *
 * Medicines used to be the fifth block and are not here any more.
 * They are not a thing being managed; they are how a condition is
 * being managed, so they belong on the condition's own line, which is
 * where they now are.
 */
import { useStore } from '../../lib/store';
import { fmtDate, relative } from '../../lib/format';
import { medsAbout } from './relate';
import { relevantSeries } from '../../lib/clinical';
import { useState } from 'react';
import { CodePicker } from '../../components/CodePicker';
import { searchConditions } from '../../domain/terminology';
import { LIFESTYLE_DOMAINS } from '../../domain/types';
import type { ChartDrawer } from './drawers';

function Block({ title, count, children }: {
  title: string; count?: number; children: React.ReactNode;
}) {
  return (
    <section className="railblock">
      <div className="railhead flat">
        <h3>{title}</h3>
        {count !== undefined && count > 0 && <span className="rcount">{count}</span>}
      </div>
      {children}
    </section>
  );
}

const Empty = ({ children }: { children: React.ReactNode }) =>
  <p className="railempty">{children}</p>;

/** One managed thing: what it is, how it is going, what we are doing. */
function Sum({ name, state, tone, line, when, onOpen }: {
  name: string;
  state?: string;
  tone?: 'good' | 'bad';
  line?: string;
  when?: string;
  onOpen?: () => void;
}) {
  const Tag = onOpen ? 'button' : 'div';
  return (
    <Tag className={`sumrow${onOpen ? '' : ' flat'}`} onClick={onOpen}>
      <span className="sumtop">
        <span className="sumname">{name}</span>
        {state && <span className={`sumstate${tone ? ` ${tone}` : ''}`}>{state}</span>}
      </span>
      {line && (
        <span className="sumline">
          {line}
          {when && <span className="sumwhen">{when}</span>}
        </span>
      )}
    </Tag>
  );
}

export function Rail({ patientId, open, onJump }: {
  patientId: string;
  open: (d: ChartDrawer) => void;
  /** Open the plan for one managed problem. */
  onJump: (conditionId: string) => void;
}) {
  const st = useStore();
  const patient = st.patient(patientId);
  /*
   * The chart shows the approved plan, not the record.
   *
   * Everything that has arrived since is real and is kept, and none
   * of it has moved anything above. It is counted on the line below
   * and incorporated inside the review that will read it. A summary
   * that moved whenever a message landed would be a feed.
   */
  const approved = st.currentVersion(patientId);
  const fresh = st.newSince(patientId);
  /*
   * What happened to them since we last looked: hospital stays,
   * urgent care, new specialists. Patient-level rather than
   * problem-level, so it sits with the version line rather than in
   * any one problem's sheet. Taken from the approved version, like
   * everything else in this column.
   */
  const interval = (approved?.subjective as
    { interval?: { label: string; date?: string; text: string }[] } | undefined)?.interval ?? [];
  const conditions = st.conditionsFor(patientId);
  const managed = conditions.filter((c) => c.managed && c.status === 'active');
  const meds = st.medsFor(patientId).filter((m) => m.status !== 'stopped');
  const vitals = st.vitalsFor(patientId);
  const panels = st.panelsFor(patientId);
  const studies = st.studiesFor(patientId);
  const specialists = st.specialistsFor(patientId);
  const series = st.seriesFor(patientId);
  const lifestyle = st.lifestyleFor(patientId);
  const prevention = st.preventionFor(patientId).filter((x) => x.status !== 'not-applicable');
  const svc = patient?.services ?? { preventative: true, lifestyle: true };

  const lastOffice = vitals.find((v) => v.source === 'office');
  const lastHome = vitals.find((v) => v.source === 'home');
  const pcp = patient?.pcp;
  const noPcp = !pcp || ('none' in pcp && pcp.none);

  // Lifestyle, summarised the same way a condition is: how many
  // prescriptions are holding, and the one that is not.
  const lsOn = lifestyle.filter((l) => l.status === 'active' || l.status === 'achieved');
  const lsOff = lifestyle.filter((l) => l.status === 'struggling' || l.status === 'not-started');
  const domain = (d: string) => LIFESTYLE_DOMAINS.find((x) => x.id === d)?.label ?? d;

  // Preventative, the same: what is behind, or that nothing is.
  const due = prevention.filter((x) => x.status === 'due' || x.status === 'overdue');

  return (
    <aside className="rail">
      {/* ------------------------------------ what we are managing */}
      <Block title="Our office is managing:">
        <p className="derivedfrom">
          {approved
            ? <>Version {approved.version}, approved {relative(approved.approvedAt)} by {approved.approvedBy}.{' '}</>
            : <>Not yet approved. Drafted from the record.{' '}</>}
          <button className="linkish" onClick={() => open('encounters')}>
            {fresh.count === 0
              ? 'Nothing new since'
              : `${fresh.count} record${fresh.count === 1 ? '' : 's'} since, not yet incorporated`}
          </button>
          {fresh.urgent > 0 && <span className="urgentmark">{fresh.urgent} flagged urgent</span>}
        </p>

        {interval.length > 0 && (
          <ul className="intlist">
            {interval.map((r, i) => (
              <li key={i}>
                <span className="intk">{r.label}</span>
                {r.date && <span className="intd">{fmtDate(r.date)}</span>}
                <span className="intt">{r.text}</span>
              </li>
            ))}
          </ul>
        )}
        {managed.length === 0 && lifestyle.length === 0 && prevention.length === 0 ? (
          <Empty>Nothing is being managed here yet.</Empty>
        ) : (
          <div className="problist">
            {managed.map((c) => {
              const mine = medsAbout(c.name, meds);
              const key = relevantSeries(series, [c], 1)[0];
              const last = key?.points?.[key.points.length - 1];
              return (
                <Sum key={c.id} name={c.name}
                  state={c.goal ? (c.goal === 'at-goal' ? 'Controlled' : 'Uncontrolled') : 'Not assessed'}
                  tone={c.goal === 'at-goal' ? 'good' : c.goal ? 'bad' : undefined}
                  line={[
                    mine.length > 0 ? mine.map((m) => `${m.name} ${m.dose}`).join(', ') : '',
                    key && last ? `${key.name} ${last.value}${key.unit ? ` ${key.unit}` : ''}` : '',
                  ].filter(Boolean).join(' · ')}
                  when={last ? fmtDate(last.date) : undefined}
                  onOpen={() => onJump(c.id)} />
              );
            })}

            {svc.lifestyle && (
              <Sum name="Lifestyle medicine"
                state={lifestyle.length === 0 ? 'Not started'
                  : lsOff.length === 0 ? 'On track' : `${lsOff.length} off track`}
                tone={lifestyle.length === 0 ? undefined : lsOff.length === 0 ? 'good' : 'bad'}
                line={lifestyle.length === 0
                  ? 'No prescriptions written yet'
                  : `${lsOn.length} of ${lifestyle.length} holding · ${
                    (lsOff[0] ? lsOff : lsOn).slice(0, 3).map((l) => domain(l.domain)).join(', ')}`}
                onOpen={() => open('prevention')} />
            )}

            {svc.preventative && (
              <Sum name="Preventative medicine"
                state={prevention.length === 0 ? 'Nothing scheduled'
                  : due.length === 0 ? 'Up to date' : `${due.length} due`}
                tone={prevention.length === 0 ? undefined : due.length === 0 ? 'good' : 'bad'}
                line={prevention.length === 0
                  ? 'No schedule set yet'
                  : due.length === 0
                    ? `${prevention.length} services, all current`
                    : due.slice(0, 3).map((x) => x.name).join(', ')}
                onOpen={() => open('prevention')} />
            )}
          </div>
        )}
        <AddProblem patientId={patientId} />
      </Block>

      {/* ------------------------------------------------------ vitals */}
      <Block title="Vitals">
        {!lastOffice && !lastHome ? <Empty>Nothing recorded.</Empty> : (
          <div className="problist">
            {lastOffice && (
              <Sum name="In clinic" when={fmtDate(lastOffice.date)}
                line={[
                  lastOffice.systolic ? `${lastOffice.systolic}/${lastOffice.diastolic}` : '',
                  lastOffice.heartRate ? `HR ${lastOffice.heartRate}` : '',
                  lastOffice.weightLb ? `${lastOffice.weightLb} lb` : '',
                  lastOffice.bmi ? `BMI ${lastOffice.bmi}` : '',
                ].filter(Boolean).join(' · ')}
                onOpen={() => open('results')} />
            )}
            {lastHome && (
              <Sum name="At home" when={fmtDate(lastHome.date)}
                line={[
                  lastHome.systolic ? `${lastHome.systolic}/${lastHome.diastolic}` : '',
                  lastHome.weightLb ? `${lastHome.weightLb} lb` : '',
                ].filter(Boolean).join(' · ')}
                onOpen={() => open('results')} />
            )}
          </div>
        )}
      </Block>

      {/* ------------------------------------------------- diagnostics */}
      {/*
        * Labs, imaging and anything else that produced a result, in
        * one block, because a physician asking "what have we done" is
        * not asking which department did it.
        */}
      <Block title="Diagnostics" count={panels.length + studies.length}>
        {panels.length === 0 && studies.length === 0 ? (
          <Empty>Nothing on file.</Empty>
        ) : (
          <div className="problist">
            {panels.slice(0, 3).map((x) => (
              <Sum key={x.id} name={x.name} when={fmtDate(x.date)}
                onOpen={() => open('results')} />
            ))}
            {studies.slice(0, 3).map((x) => (
              <Sum key={x.id} name={x.name} when={fmtDate(x.date)}
                onOpen={() => open('studies')} />
            ))}
          </div>
        )}
      </Block>

      {/* -------------------------------------------------- care team */}
      {/*
        * Everybody else looking after this person, with their own
        * physician first. A consulting practice manages named problems
        * and this is the list of who has the rest, so a blank where
        * the primary care physician should be is a clinical finding
        * rather than a missing field.
        */}
      <Block title="Care team" count={specialists.length + (noPcp ? 0 : 1)}>
        <div className="problist">
          <Sum name={noPcp ? 'No primary care physician' : ('name' in pcp ? pcp.name : '')}
            state={noPcp ? 'Outstanding' : undefined} tone={noPcp ? 'bad' : undefined}
            line={noPcp ? 'Everything outside our list needs somebody' : 'Primary care'}
            onOpen={() => open('specialists')} />
          {specialists.map((sp) => (
            <Sum key={sp.id} name={sp.name} line={sp.specialty}
              when={sp.lastSeen ? fmtDate(sp.lastSeen) : undefined}
              state={sp.outstanding && !/^(none|nothing|n\/a|no)\b/i.test(sp.outstanding.trim())
                ? 'Outstanding' : undefined}
              tone={sp.outstanding && !/^(none|nothing|n\/a|no)\b/i.test(sp.outstanding.trim())
                ? 'bad' : undefined}
              onOpen={() => open('specialists')} />
          ))}
        </div>
      </Block>
    </aside>
  );
}

/**
 * A new problem, coded.
 *
 * Here rather than in the header, because adding a problem is a
 * statement that this practice has taken it on, and this is the list
 * of what this practice has taken on.
 */
function AddProblem({ patientId }: { patientId: string }) {
  const st = useStore();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: '', code: '' });

  if (!open) {
    return (
      <button className="linkish addproblem" onClick={() => setOpen(true)}>+ Problem</button>
    );
  }
  return (
    <div className="addproblembox">
      <CodePicker
        label="Add a problem" value={f.name} autoFocus
        placeholder="Type a diagnosis"
        hint="ICD-10-CM"
        onText={(v) => setF({ name: v, code: '' })}
        search={(q) => searchConditions(q).map((c) => ({ id: c.code, primary: c.name, code: c.code }))}
        onPick={(r) => setF({ name: r.primary, code: r.code })}
      />
      <div className="row" style={{ marginTop: 9, gap: 7 }}>
        <button className="btn sm" disabled={!f.name.trim()}
          onClick={() => {
            st.addCondition(patientId, f.name.trim(), f.code);
            setF({ name: '', code: '' });
            setOpen(false);
          }}>
          Add{f.code ? ` ${f.code}` : ' without a code'}
        </button>
        <button className="btn ghost sm" onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </div>
  );
}
