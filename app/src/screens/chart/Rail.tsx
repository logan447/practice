/**
 * The right column.
 *
 * Five blocks, the same five on every chart, in the same order,
 * whether or not there is anything in them. A panel whose shape
 * changes per patient has to be re-read each time; one that does not
 * can be glanced at. Empty blocks say they are empty rather than
 * disappearing, because "no specialists" and "I forgot to look" are
 * different facts.
 *
 * The problem list is first and carries its own evidence: the drugs
 * for that problem, the number that says how it is going, and whether
 * it is controlled. A problem list that is only a list of names makes
 * you go and find all three somewhere else, which is the work this
 * column exists to remove.
 *
 * What used to be here and is not: a reconciliation notice, the
 * membership ledger, the encounter history, pending orders and
 * follow-up. All of them real, none of them what a physician looks
 * right while reading a chart. They live in the tabs.
 *
 * Every block opens the tab holding the records behind it. The rail
 * is the index; the tab is the record.
 */
import { useStore } from '../../lib/store';
import { Chip } from '../../components/ui';
import { fmtDate } from '../../lib/format';
import { medsAbout } from './relate';
import { relevantSeries } from '../../lib/clinical';
import type { ChartDrawer } from './drawers';
import type { CareGoalStatus, Condition } from '../../domain/types';

/**
 * Controlled, not "at goal".
 *
 * The rest of the chart says "At goal" and "Needs improvement",
 * because those phrases also have to cover preventative services and
 * lifestyle prescriptions, where "controlled" means nothing. A
 * problem list is only ever about diagnoses, and for a diagnosis the
 * word a physician reads fastest is the clinical one. Same underlying
 * status, read aloud differently in the one place where the subject
 * is always a disease.
 */
const CONTROL: Record<CareGoalStatus, string> = {
  'at-goal': 'Controlled',
  'needs-improvement': 'Uncontrolled',
};

function Block({ title, count, onOpen, children }: {
  title: string;
  count?: number;
  onOpen: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="railblock">
      <button className="railhead" onClick={onOpen}>
        <h3>{title}</h3>
        {count !== undefined && count > 0 && <span className="rcount">{count}</span>}
        <span className="ropen">Open</span>
      </button>
      {children}
    </section>
  );
}

const Empty = ({ children }: { children: React.ReactNode }) =>
  <p className="railempty">{children}</p>;

export function Rail({ patientId, open, onJump }: {
  patientId: string;
  open: (d: ChartDrawer) => void;
  /** Scroll the main document to a problem in the plan. */
  onJump: (conditionId: string) => void;
}) {
  const st = useStore();
  const patient = st.patient(patientId);
  const conditions = st.conditionsFor(patientId);
  const managed = conditions.filter((c) => c.managed && c.status === 'active');
  const meds = st.medsFor(patientId).filter((m) => m.status !== 'stopped');
  const vitals = st.vitalsFor(patientId);
  const panels = st.panelsFor(patientId);
  const studies = st.studiesFor(patientId);
  const specialists = st.specialistsFor(patientId);
  const series = st.seriesFor(patientId);

  const lastOffice = vitals.find((v) => v.source === 'office');
  const lastHome = vitals.find((v) => v.source === 'home');
  const pcp = patient?.pcp;
  const noPcp = !pcp || ('none' in pcp && pcp.none);

  return (
    <aside className="rail">
      {/* ------------------------------------------------ problem list */}
      {/*
        * Each problem with the two things that decide what to do about
        * it: what it is being treated with, and the last number.
        */}
      <Block title="Problem list" count={managed.length} onOpen={() => open('careplan')}>
        {managed.length === 0 ? (
          <Empty>No problems are being managed here.</Empty>
        ) : (
          <div className="problist">
            {managed.map((c) => (
              <ProblemRow key={c.id} c={c} meds={meds} series={series}
                onJump={() => onJump(c.id)} />
            ))}
          </div>
        )}
      </Block>

      {/* ------------------------------------------------------ vitals */}
      <Block title="Vitals" onOpen={() => open('results')}>
        {!lastOffice && !lastHome ? <Empty>Nothing recorded.</Empty> : (
          <div className="railrows">
            {lastOffice && (
              <div className="vitrow">
                <span className="vitwhere">In clinic</span>
                <span className="vitval">
                  {lastOffice.systolic && `${lastOffice.systolic}/${lastOffice.diastolic}`}
                  {lastOffice.heartRate ? ` · HR ${lastOffice.heartRate}` : ''}
                  {lastOffice.weightLb ? ` · ${lastOffice.weightLb} lb` : ''}
                  {lastOffice.bmi ? ` · BMI ${lastOffice.bmi}` : ''}
                </span>
                <span className="vitwhen">{fmtDate(lastOffice.date)}</span>
              </div>
            )}
            {lastHome && (
              <div className="vitrow">
                <span className="vitwhere">At home</span>
                <span className="vitval">
                  {lastHome.systolic && `${lastHome.systolic}/${lastHome.diastolic}`}
                  {lastHome.weightLb ? ` · ${lastHome.weightLb} lb` : ''}
                </span>
                <span className="vitwhen">{fmtDate(lastHome.date)}</span>
              </div>
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
      <Block title="Diagnostics" count={panels.length + studies.length}
        onOpen={() => open('results')}>
        {panels.length === 0 && studies.length === 0 ? (
          <Empty>Nothing on file.</Empty>
        ) : (
          <div className="railrows">
            {panels.slice(0, 3).map((x) => (
              <button key={x.id} className="dxrow" onClick={() => open('results')}>
                <span className="dxname">{x.name}</span>
                <span className="dxwhen">{fmtDate(x.date)}</span>
              </button>
            ))}
            {studies.slice(0, 3).map((x) => (
              <button key={x.id} className="dxrow" onClick={() => open('studies')}>
                <span className="dxname">
                  {x.name}
                  {x.significant && <Chip tone="warn">Significant</Chip>}
                </span>
                <span className="dxwhen">{fmtDate(x.date)}</span>
              </button>
            ))}
            {panels.length + studies.length > 6 && (
              <div className="railmore2">
                +{panels.length + studies.length - 6} more
              </div>
            )}
          </div>
        )}
      </Block>

      {/* ------------------------------------------------- their team */}
      {/*
        * Everybody else looking after this person, with their own
        * physician first. A consulting practice manages named problems
        * and this is the list of who has the rest, so a blank where
        * the primary care physician should be is a clinical finding
        * rather than a missing field.
        */}
      <Block title="Their team" count={specialists.length + (noPcp ? 0 : 1)}
        onOpen={() => open('specialists')}>
        <button className={`teamrow${noPcp ? ' missing' : ''}`}
          onClick={() => open(noPcp ? 'scope' : 'specialists')}>
          <span className="tmwho">
            {noPcp ? 'No primary care physician' : ('name' in pcp ? pcp.name : '')}
          </span>
          <span className="tmrole">
            {noPcp ? 'Everything outside our list needs somebody' : 'Primary care'}
          </span>
        </button>
        {specialists.length === 0 ? (
          <Empty>No specialists on file.</Empty>
        ) : specialists.map((sp) => (
          <button key={sp.id} className="teamrow" onClick={() => open('specialists')}>
            <span className="tmwho">{sp.name}</span>
            <span className="tmrole">
              {sp.specialty}
              {sp.lastSeen && <span className="tmseen">seen {fmtDate(sp.lastSeen)}</span>}
            </span>
            {sp.outstanding && !/^(none|nothing|n\/a|no)\b/i.test(sp.outstanding.trim()) && (
              <span className="tmout">{sp.outstanding}</span>
            )}
          </button>
        ))}
      </Block>

      {/* --------------------------------------------------- medicines */}
      <Block title="Medicines" count={meds.length} onOpen={() => open('meds')}>
        {meds.length === 0 ? <Empty>None recorded.</Empty> : (
          <div className="railrows">
            {meds.map((m) => (
              <div key={m.id} className="medrow">
                <span className="mname">{m.name} {m.dose}</span>
                {m.indication && <span className="mfor">{m.indication}</span>}
              </div>
            ))}
          </div>
        )}
      </Block>
    </aside>
  );
}

/**
 * One problem, with its evidence beside it.
 *
 * The drugs that are for this problem and the measure that says how
 * it is going, which between them answer "what is being done" and
 * "is it working" without leaving the column.
 */
function ProblemRow({ c, meds, series, onJump }: {
  c: Condition;
  meds: ReturnType<ReturnType<typeof useStore>['medsFor']>;
  series: ReturnType<ReturnType<typeof useStore>['seriesFor']>;
  onJump: () => void;
}) {
  const mine = medsAbout(c.name, meds);
  // The measure this problem is actually followed by, and its last
  // value. One number, because two is a trend and a trend belongs in
  // the diagnostics tab where it can be drawn.
  const key = relevantSeries(series, [c], 1)[0];
  const last = key?.points?.[key.points.length - 1];

  return (
    <button className="probrow" onClick={onJump}>
      <span className="prhead">
        <span className="prname">{c.name}</span>
        <Chip tone={c.goal === 'at-goal' ? 'ok' : c.goal ? 'warn' : undefined}>
          {c.goal ? CONTROL[c.goal] : 'Not assessed'}
        </Chip>
      </span>
      {mine.length > 0 && (
        <span className="prmeds">{mine.map((m) => `${m.name} ${m.dose}`).join(', ')}</span>
      )}
      {key && last && (
        <span className="prlab">
          {key.name} {last.value}{key.unit ? ` ${key.unit}` : ''}
          <span className="prwhen">{fmtDate(last.date)}</span>
        </span>
      )}
    </button>
  );
}
