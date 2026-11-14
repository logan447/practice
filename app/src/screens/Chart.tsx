/**
 * The chart shell: who this person is, what must never be forgotten
 * about them, and the tabs. The header is deliberately short — the
 * pinned line is the only thing promoted above the fold, because a
 * header that carries everything carries nothing.
 */
import { useState } from 'react';
import { useStore } from '../lib/store';
import { useNav, type ChartTab } from '../lib/nav';
import { Avatar, Chip } from '../components/ui';
import { age, fmtDate, MEMBERSHIP_LABEL, monthsSince } from '../lib/format';
import { Summary } from './chart/Summary';
import { PlanTab } from './chart/PlanTab';
import { MedsTab } from './chart/MedsTab';
import { ResultsTab } from './chart/ResultsTab';
import { PreventionTab } from './chart/PreventionTab';
import { NotesTab } from './chart/NotesTab';

const TABS: { id: ChartTab; label: string }[] = [
  { id: 'summary', label: 'Summary' },
  { id: 'plan', label: 'Care plan' },
  { id: 'meds', label: 'Medicines' },
  { id: 'results', label: 'Results' },
  { id: 'prevention', label: 'Prevention' },
  { id: 'notes', label: 'Notes' },
];

export function Chart({ patientId, initialTab }: { patientId: string; initialTab?: ChartTab }) {
  const st = useStore();
  const nav = useNav();
  const [tab, setTab] = useState<ChartTab>(initialTab ?? 'summary');

  const p = st.patient(patientId);
  if (!p) return <div className="wrap"><p>Patient not found.</p></div>;

  const open = st.tasksFor(p.id);
  const nextVisit = st.encountersFor(p.id).find((e) => e.status === 'scheduled');
  const unack = st.reportsFor(p.id).filter((r) => !r.acknowledged).length;

  return (
    <div className="wrap">
      {nav.canBack && (
        <button className="btn quiet" style={{ marginBottom: 10 }} onClick={nav.back}>
          &larr; Back
        </button>
      )}

      <div className="phead">
        <Avatar patient={p} lg />
        <div style={{ minWidth: 0 }}>
          <h1>{p.name}</h1>
          <div className="meta">
            {age(p.dob)} &middot; {p.pronouns} &middot; born {fmtDate(p.dob)}
          </div>
          <div className="meta">
            {p.phone} &middot; {p.email}
          </div>
        </div>

        <div className="acts">
          <Chip tone={p.membership === 'standard' ? undefined : 'accent'}>
            {MEMBERSHIP_LABEL[p.membership]} &middot; {monthsSince(p.memberSince)} mo
          </Chip>
          {unack > 0 && <Chip tone="crit">{unack} result{unack > 1 ? 's' : ''} to review</Chip>}
          {nextVisit && (
            <button className="btn" onClick={() => nav.go({ name: 'encounter', encounterId: nextVisit.id })}>
              Open visit
            </button>
          )}
        </div>

        {p.pinned && (
          <div className="pinned" style={{ flexBasis: '100%' }}>
            <b>Always</b>
            <span>{p.pinned}</span>
          </div>
        )}

        {p.careTeam.length > 0 && (
          <div className="small muted" style={{ flexBasis: '100%' }}>
            Also seeing: {p.careTeam.map((c) => `${c.name} (${c.role})`).join(', ')}
          </div>
        )}
      </div>

      <div className="tabs" role="tablist">
        {TABS.map((t) => {
          const count = t.id === 'results' ? unack : t.id === 'summary' ? 0 : 0;
          return (
            <button key={t.id} role="tab" aria-selected={tab === t.id}
              className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)}>
              {t.label}
              {count > 0 && <span className="chip crit" style={{ marginLeft: 6 }}>{count}</span>}
            </button>
          );
        })}
        <span className="spacer" />
        {open.length > 0 && (
          <span className="small muted" style={{ alignSelf: 'center', paddingRight: 4 }}>
            {open.length} open item{open.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {tab === 'summary' && <Summary patientId={p.id} onTab={setTab} />}
      {tab === 'plan' && <PlanTab patientId={p.id} />}
      {tab === 'meds' && <MedsTab patientId={p.id} />}
      {tab === 'results' && <ResultsTab patientId={p.id} />}
      {tab === 'prevention' && <PreventionTab patientId={p.id} />}
      {tab === 'notes' && <NotesTab patientId={p.id} />}
    </div>
  );
}
