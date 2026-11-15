/**
 * The chart.
 *
 * One screen. The header says who this is and what we are doing for
 * them, and nothing else: no membership, no contact details, no
 * administrative controls. The middle is the master care plan. The
 * right is what is coming and what is outstanding.
 *
 * Everything that used to be a tab is still here and is reachable
 * from the place in the plan that refers to it, or from the one quiet
 * row at the foot of the rail. That is deliberate. Eight tabs across
 * the top meant the first thing the chart said about a patient was
 * "here are eight places to look", which is a statement about the
 * software rather than about the person.
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
import { Drawer } from '../components/Drawer';
import { MasterPlanView } from './chart/MasterPlanView';
import { Rail } from './chart/Rail';
import { VisitsDrawer } from './chart/VisitsDrawer';
import {
  DRAWER_TITLES, ResultsDrawer, StudiesDrawer, FollowUpDrawer, OrdersDrawer,
  type ChartDrawer,
} from './chart/drawers';
import { Documentation } from './chart/Documentation';
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
import { QualityStrip } from '../components/Quality';
import { findIssues } from '../lib/dataQuality';

export function Chart({ patientId }: { patientId: string }) {
  const st = useStore();
  const nav = useNav();
  const me = useActor();
  const [drawer, setDrawer] = useState<ChartDrawer>(null);

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

  const issues = findIssues({
    patient: p, allPatients: st.patients, medications: st.medsFor(p.id),
    allergies, conditions,
    series: st.seriesFor(p.id), documents: st.documentsFor(p.id),
  });


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

        {/* -------------------------------------------- the workspace */}
        <div className="workspace">
          <MasterPlanView patientId={p.id} onOpen={(w) => setDrawer(
            w === 'notes' ? 'visits' : (w as ChartDrawer))} />
          <div>
            {/*
              * Only the one notice now: what in this chart needs
              * reconciling. The summary used to advertise itself here
              * with a count of unreviewed records and a button to
              * draft an update, which turned a document that keeps
              * itself current into a queue of work. It derives from
              * the record continuously; there is nothing to review.
              */}
            {issues.length > 0 && (
              <div className="railnotices">
                <QualityStrip issues={issues} onGo={(t) => setDrawer(
                  t === 'plan' ? 'plan' : t === 'notes' ? 'visits' : (t as ChartDrawer))} />
              </div>
            )}
            <Rail patientId={p.id} open={setDrawer}
              onJump={(cid) => {
                const el = document.getElementById(`problem-${cid}`);
                el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el?.classList.add('flash');
                setTimeout(() => el?.classList.remove('flash'), 1400);
              }} />
            <nav className="railfoot">
              {([
                ['export', 'Export'], ['letters', 'Letters'],
                ['documentation', 'Documentation'], ['prevention', 'Prevention'],
                ['studies', 'Imaging'], ['records', 'Records'],
                ['history', 'History'], ['details', 'Details'],
              ] as [ChartDrawer, string][]).map(([k, label]) => (
                <button key={k} className="linkish" onClick={() => setDrawer(k)}>{label}</button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      <Drawer open={drawer !== null} wide
        title={drawer ? (DRAWER_TITLES[drawer]?.title ?? '') : ''}
        sub={drawer ? DRAWER_TITLES[drawer]?.sub : undefined}
        onClose={() => setDrawer(null)}>
        {drawer === 'visits' && <VisitsDrawer patientId={p.id} onDone={() => setDrawer(null)} />}
        {drawer === 'plan' && <PlanTab patientId={p.id} />}
        {drawer === 'meds' && <MedsTab patientId={p.id} />}
        {drawer === 'results' && <ResultsDrawer patientId={p.id} />}
        {drawer === 'specialists' && <SpecialistsTab patientId={p.id} />}
        {drawer === 'orders' && <OrdersDrawer patientId={p.id} />}
        {drawer === 'followup' && <FollowUpDrawer patientId={p.id} />}
        {drawer === 'studies' && <StudiesDrawer patientId={p.id} />}
        {drawer === 'prevention' && <PreventionTab patientId={p.id} />}
        {drawer === 'letters' && <PaperTab patientId={p.id} />}
        {drawer === 'records' && <RecordsTab patientId={p.id} />}
        {drawer === 'documentation' && <Documentation patientId={p.id} />}
        {drawer === 'export' && <ExportDrawer patientId={p.id} />}
        {drawer === 'history' && <HistoryTab patientId={p.id} />}
        {drawer === 'details' && <Details patientId={p.id} />}
        {drawer === 'notes' && <NotesTab patientId={p.id} />}
        {drawer === 'encounters' && (
          <EncountersDrawer patientId={p.id} onDone={() => setDrawer(null)} />
        )}
      </Drawer>
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
