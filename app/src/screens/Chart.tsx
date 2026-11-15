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
import { RightRail } from './chart/RightRail';
import { MedsTab } from './chart/MedsTab';
import { ResultsTab } from './chart/ResultsTab';
import { PreventionTab } from './chart/PreventionTab';
import { NotesTab } from './chart/NotesTab';
import { SpecialistsTab } from './chart/SpecialistsTab';
import { RecordsTab } from './chart/RecordsTab';
import { PaperTab } from './chart/PaperTab';
import { HistoryTab } from './chart/HistoryTab';
import { PlanTab } from './chart/PlanTab';
import { QualityStrip } from '../components/Quality';
import { findIssues } from '../lib/dataQuality';

type DrawerName =
  | null | 'meds' | 'results' | 'prevention' | 'specialists' | 'notes'
  | 'records' | 'paper' | 'history' | 'goals' | 'details';

const TITLES: Record<string, { title: string; sub?: string }> = {
  meds: { title: 'Medicines', sub: 'Stopped drugs stay, with the reason' },
  results: { title: 'Results' },
  prevention: { title: 'Prevention' },
  specialists: { title: 'Specialists', sub: 'Co-management fails at the handoff' },
  notes: { title: 'Visit notes', sub: 'As they were signed' },
  records: { title: 'Allergies and outside records' },
  paper: { title: 'Documents' },
  history: { title: 'Who did what' },
  goals: { title: 'Shared care plan', sub: 'What the patient sees in their portal' },
  details: { title: 'Patient details' },
};

export function Chart({ patientId }: { patientId: string }) {
  const st = useStore();
  const nav = useNav();
  const me = useActor();
  const [drawer, setDrawer] = useState<DrawerName>(null);

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
  const { managed, services } = practiceSummary(p, conditions);

  const issues = findIssues({
    patient: p, allPatients: st.patients, medications: st.medsFor(p.id),
    allergies: st.allergiesFor(p.id), conditions,
    series: st.seriesFor(p.id), documents: st.documentsFor(p.id),
  });

  /** The sentence, assembled from the two structured lists. */
  const doing: string[] = [];
  if (managed.length > 0) doing.push('__problems__');
  doing.push(...services);

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

          {doing.length > 0 && (
            <p className="csum">
              Following with our office for{' '}
              {doing.map((part, i) => (
                <span key={part}>
                  {i > 0 && (i === doing.length - 1 ? (doing.length > 2 ? ', and ' : ' and ') : ', ')}
                  {part === '__problems__' ? (
                    <>
                      management of{' '}
                      {managed.map((c, j) => (
                        <span key={c.id}>
                          {j > 0 && ' '}
                          <span className="dx on">{c.name}</span>
                        </span>
                      ))}
                    </>
                  ) : part}
                </span>
              ))}
              .
            </p>
          )}

          {p.pinned && <p className="cpin">{p.pinned}</p>}
        </header>

        {issues.length > 0 && (
          <QualityStrip issues={issues} onGo={(t) => setDrawer(
            t === 'plan' ? 'goals' : (t as DrawerName))} />
        )}

        {/* -------------------------------------------- the workspace */}
        <div className="workspace">
          <MasterPlanView patientId={p.id} onOpen={(w) => setDrawer(w)} />
          <div>
            <RightRail patientId={p.id} />
            <nav className="railfoot">
              {([
                ['goals', 'Shared plan'], ['results', 'Results'], ['meds', 'Medicines'],
                ['prevention', 'Prevention'], ['records', 'Records'], ['paper', 'Documents'],
                ['history', 'History'], ['details', 'Details'],
              ] as [DrawerName, string][]).map(([k, label]) => (
                <button key={k} className="linkish" onClick={() => setDrawer(k)}>{label}</button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      <Drawer open={drawer !== null} wide
        title={drawer ? TITLES[drawer].title : ''}
        sub={drawer ? TITLES[drawer].sub : undefined}
        onClose={() => setDrawer(null)}>
        {drawer === 'meds' && <MedsTab patientId={p.id} />}
        {drawer === 'results' && <ResultsTab patientId={p.id} />}
        {drawer === 'prevention' && <PreventionTab patientId={p.id} />}
        {drawer === 'specialists' && <SpecialistsTab patientId={p.id} />}
        {drawer === 'notes' && <NotesTab patientId={p.id} />}
        {drawer === 'records' && <RecordsTab patientId={p.id} />}
        {drawer === 'paper' && <PaperTab patientId={p.id} />}
        {drawer === 'history' && <HistoryTab patientId={p.id} />}
        {drawer === 'goals' && <PlanTab patientId={p.id} />}
        {drawer === 'details' && <Details patientId={p.id} />}
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
