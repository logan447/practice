/**
 * The chart.
 *
 * One screen. The header says who this is and what we are doing for
 * them, and nothing else: no membership, no contact details, no
 * administrative controls. The middle is the master care plan. The
 * right is what is coming and what is outstanding.
 *
 * Under the header is a tab strip, and under that is whatever the
 * tab says. The care plan is still one document written in one place;
 * the first four tabs are a reading position inside it rather than
 * four separate records, and the rest are the source material the
 * plan was built from.
 *
 * This replaced a drawer that slid over the chart. Drawers were
 * cheaper to build and worse to use: the thing you were reading
 * vanished under the thing you opened, and coming back meant finding
 * a Close button. A physician comparing a lab against the plan wants
 * both reachable in one move, which is what a tab is for.
 *
 * The header's sentence is generated from structured data: which
 * problems carry `managed`, and which of the two service switches are
 * on. Past medical history and what this practice is doing are
 * different lists, and most charts conflate them.
 */
import { useEffect, useState } from 'react';
import { useStore } from '../lib/store';
import { useNav } from '../lib/nav';
import { markChartOpen } from '../lib/metrics';
import { useActor, ROLE_LABEL, signInAs } from '../lib/session';
import { can } from '../lib/permissions';
import { recordRead, record } from '../lib/audit';
import { practiceSummary, demographicLine } from '../lib/clinical';
import { MasterPlanView } from './chart/MasterPlanView';
import { Rail } from './chart/Rail';
import { VisitsDrawer } from './chart/VisitsDrawer';
import {
  DRAWER_TITLES, CHART_TABS, SOAP, ResultsDrawer, StudiesDrawer,
  FollowUpDrawer, OrdersDrawer, type ChartDrawer,
} from './chart/drawers';
import { Documentation } from './chart/Documentation';
import { Scope } from './chart/Scope';
import { ExportDrawer } from './chart/ExportDrawer';
import { EncountersDrawer } from './chart/Encounters';
import { MedsTab } from './chart/MedsTab';
import { PreventionTab } from './chart/PreventionTab';
import { PaperTab } from './chart/PaperTab';
import { NotesTab } from './chart/NotesTab';
import { SpecialistsTab } from './chart/SpecialistsTab';
import { RecordsTab } from './chart/RecordsTab';
import { HistoryTab } from './chart/HistoryTab';
import { PlanTab } from './chart/PlanTab';

export function Chart({ patientId }: { patientId: string }) {
  const st = useStore();
  const nav = useNav();
  const me = useActor();
  const [tab, setTab] = useState<ChartDrawer>('subjective');

  useEffect(() => { markChartOpen(); }, [patientId]);

  const p = st.patient(patientId);

  useEffect(() => {
    if (p) recordRead(me, st.now, p.id, p.preferredName ?? p.name.split(' ')[0]);
  }, [p?.id, me.id]);

  if (!p) return <div className="wrap"><p>Patient not found.</p></div>;

  const readChart = can(me, 'read-chart', { patientId: p.id, now: st.now });
  if (!readChart.allowed) {
    return (
      <div className="wrap" style={{ maxWidth: 560, marginTop: 60 }}>
        <h1 style={{ fontSize: 24 }}>Not open to you</h1>
        <p className="sub" style={{ marginTop: 10 }}>{readChart.why}</p>
        <p className="small muted" style={{ marginTop: 14 }}>
          Signed in as {me.name}, {ROLE_LABEL[me.role].toLowerCase()}. This attempt is in the log.
        </p>
        <button className="btn" style={{ marginTop: 16 }}
          onClick={() => nav.reset(me.patientId
            ? { name: 'portal', patientId: me.patientId } : { name: 'patients' })}>
          Go back
        </button>
      </div>
    );
  }

  const conditions = st.conditionsFor(p.id);
  const history = conditions.filter((c) => c.status !== 'resolved');
  const allergies = st.allergiesFor(p.id);
  const { managed, services } = practiceSummary(p, conditions);


  return (
    <div className="chart">
      <div className="chartinner">
        {nav.canBack && (
          <button className="btn quiet backlink" onClick={nav.back}>&larr; Back</button>
        )}

        {/* ------------------------------------------------- header */}
        <header className="chead">
          <h1>{p.name}</h1>

          <p className="cdem">
            <span>{demographicLine(p)}</span>
            {history.length > 0 && (
              <>
                <span className="bar" aria-hidden="true" />
                <span className="pmh">PMH:</span>
                {history.map((c) => (
                  <span key={c.id} className={`dx${c.managed ? ' on' : ''}`}
                    title={c.code ? `${c.code}${c.note ? ` · ${c.note}` : ''}` : c.note}>
                    {c.name}
                  </span>
                ))}
              </>
            )}
          </p>

          {(managed.length > 0 || services.length > 0) && (
            <p className="csum">
              <span className="lead">Following for management of</span>
              {managed.map((c) => (
                <span key={c.id} className="dx on" title={c.code}>{c.name}</span>
              ))}
              {services.map((sv) => (
                <span key={sv} className="dx svc">{sv}</span>
              ))}
            </p>
          )}

          {/*
            * The one clinical fact that goes back in a minimal header.
            * Allergies are read at every prescribing decision, and a
            * chart that hides them behind a drawer has optimised the
            * wrong thing. Silent when there are none, which is most
            * charts, so it costs nothing when it has nothing to say.
            */}
          {allergies.length > 0 && (
            <p className="callergy">
              <span className="lab">Allergies</span>
              {allergies.map((a) => (
                <span key={a.id} className={`alg${a.severity === 'severe' ? ' bad' : ''}`}
                  title={a.reaction ?? undefined}>
                  {a.substance}
                </span>
              ))}
            </p>
          )}

        </header>

        {/* ------------------------------------------------- the tabs */}
        {/*
          * Two groups in one strip, and the divider is the only thing
          * marking them: the care plan, then the record it was built
          * from. Both open in the same place, so neither is a detour.
          */}
        <nav className="ctabs">
          {CHART_TABS.map((t) => (t === null ? <span key="gap" className="ctabgap" /> : (
            <button key={t} className={`ctab${tab === t ? ' on' : ''}`}
              onClick={() => setTab(t)}>
              {DRAWER_TITLES[t]?.tab ?? DRAWER_TITLES[t]?.title ?? t}
            </button>
          )))}
        </nav>

        {/* -------------------------------------------- the workspace */}
        <div className="workspace">
          <div className="tabbody">
            {SOAP[tab as string] ? (
              <MasterPlanView patientId={p.id} only={SOAP[tab as string]}
                onOpen={(w) => setTab(w === 'notes' ? 'visits' : (w as ChartDrawer))} />
            ) : (
              <>
                <div className="tabhead">
                  <h2>{DRAWER_TITLES[tab ?? '']?.title}</h2>
                  {DRAWER_TITLES[tab ?? '']?.sub && (
                    <p className="small muted">{DRAWER_TITLES[tab ?? '']?.sub}</p>
                  )}
                </div>
                {tab === 'visits' && <VisitsDrawer patientId={p.id} onDone={() => setTab('subjective')} />}
                {tab === 'plan' && <PlanTab patientId={p.id} />}
                {tab === 'meds' && <MedsTab patientId={p.id} />}
                {tab === 'results' && <ResultsDrawer patientId={p.id} />}
                {tab === 'specialists' && <SpecialistsTab patientId={p.id} />}
                {tab === 'orders' && <OrdersDrawer patientId={p.id} />}
                {tab === 'followup' && <FollowUpDrawer patientId={p.id} />}
                {tab === 'studies' && <StudiesDrawer patientId={p.id} />}
                {tab === 'prevention' && <PreventionTab patientId={p.id} />}
                {tab === 'letters' && <PaperTab patientId={p.id} />}
                {tab === 'records' && <RecordsTab patientId={p.id} />}
                {tab === 'documentation' && <Documentation patientId={p.id} />}
                {tab === 'scope' && <Scope patientId={p.id} />}
                {tab === 'export' && <ExportDrawer patientId={p.id} />}
                {tab === 'history' && <HistoryTab patientId={p.id} />}
                {tab === 'details' && <Details patientId={p.id} />}
                {tab === 'notes' && <NotesTab patientId={p.id} />}
                {tab === 'encounters' && (
                  <EncountersDrawer patientId={p.id} onDone={() => setTab('subjective')} />
                )}
              </>
            )}
          </div>
          <div>
            <Rail patientId={p.id} open={setTab}
              /*
               * A problem in the rail points at the plan for it, so
               * the tab has to change before the scroll: the element
               * does not exist until the Plan tab is on screen.
               */
              onJump={(cid) => {
                setTab('planview');
                window.setTimeout(() => {
                  const el = document.getElementById(`problem-${cid}`);
                  el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  el?.classList.add('flash');
                  window.setTimeout(() => el?.classList.remove('flash'), 1400);
                }, 60);
              }} />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * What the header stopped carrying.
 *
 * Membership, contact details, and the two switches that generate the
 * summary sentence. Administrative, so out of the clinical view, but
 * one click away rather than gone.
 */
function Details({ patientId }: { patientId: string }) {
  const st = useStore();
  const nav = useNav();
  const me = useActor();
  const p = st.patient(patientId);
  const conditions = st.conditionsFor(patientId);
  const ledger = st.ledgerFor(patientId);
  if (!p) return null;
  const svc = p.services ?? { preventative: true, lifestyle: true };

  return (
    <div className="stack">
      <section className="panel"><div className="body">
        {p.pinned && (
          <>
            <div className="soaplabel">Remember</div>
            <p style={{ marginBottom: 14 }}>{p.pinned}</p>
          </>
        )}
        <div className="soaplabel">Contact</div>
        <p>{p.phone}</p>
        <p>{p.email}</p>
        <p className="small muted">
          Born {p.dob} &middot; {p.pronouns} &middot; member since {p.memberSince}
        </p>
      </div></section>

      {/*
        * The membership year, which used to sit in the clinical
        * column and does not belong there. It is the one number that
        * is commercial before it is clinical, and a physician reading
        * a chart should not meet it between the problem list and the
        * vitals.
        */}
      {ledger && (
        <section className="panel"><div className="body">
          <div className="soaplabel">Membership year</div>
          <div className="ledger">
            <div className={`ledgerbar${ledger.minutesLeft < 0 ? ' over' : ''}`}>
              <span style={{
                width: `${Math.min(100, (ledger.used.minutes / ledger.plannedMinutes) * 100)}%`,
              }} />
            </div>
            <div className="ledgerline">{ledger.line}</div>
            <div className="ledgerpkg">
              {ledger.used.consultations} of {ledger.planned.consultations.count} consultations,{' '}
              {ledger.used.reviews} of {ledger.planned.reviews.count} care plan reviews.
              {ledger.used.betweenMinutes > 0
                && ` ${ledger.used.betweenMinutes} min between encounters.`}
            </div>
          </div>
        </div></section>
      )}

      <section className="panel"><div className="body">
        <div className="soaplabel">Membership</div>
        <p style={{ textTransform: 'capitalize' }}>{p.membership.replace('-', ' ')}</p>
        <p className="small muted">
          The clinical care is identical at every fee level.
        </p>
      </div></section>

      <section className="panel"><div className="body">
        <div className="soaplabel">What we provide</div>
        <p className="small muted" style={{ marginBottom: 10 }}>
          These two switches and the managed problems below generate the sentence
          at the top of the chart. Nothing there is typed.
        </p>
        <label className="svcrow">
          <input type="checkbox" checked={svc.preventative}
            onChange={(e) => st.setServices(p.id, { ...svc, preventative: e.target.checked })} />
          <span>Preventative services</span>
        </label>
        <label className="svcrow">
          <input type="checkbox" checked={svc.lifestyle}
            onChange={(e) => st.setServices(p.id, { ...svc, lifestyle: e.target.checked })} />
          <span>Lifestyle medicine services</span>
        </label>
      </div></section>

      <section className="panel"><div className="body">
        <div className="soaplabel">Problems we manage</div>
        <p className="small muted" style={{ marginBottom: 10 }}>
          Unticked problems stay in the history and stay out of the sentence.
        </p>
        {conditions.filter((c) => c.status !== 'resolved').map((c) => (
          <label key={c.id} className="svcrow">
            <input type="checkbox" checked={!!c.managed}
              onChange={(e) => st.setManaged(c.id, e.target.checked)} />
            <span>{c.name}</span>
            {c.code && <span className="ppcode">{c.code}</span>}
          </label>
        ))}
      </div></section>

      {me.role === 'physician' && (
        <button className="btn ghost"
          title="Signs in as this patient, with their permissions"
          onClick={() => {
            const next = { id: `pt-${p.id}`, name: p.name, role: 'patient' as const, patientId: p.id };
            record(next, st.now, {
              action: 'sign-in', resource: 'Session', resourceId: next.id, patientId: p.id,
              summary: `Signed in as ${p.name} (patient)`,
            });
            signInAs(next);
            nav.reset({ name: 'portal', patientId: p.id });
          }}>
          Sign in as them
        </button>
      )}
    </div>
  );
}
