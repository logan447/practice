/**
 * The chart.
 *
 * The header answers "who is this" in the order a clinician asks it:
 * name, demographics, the one-liner, then the active problem list.
 * Contact sits under the name because it is needed often and is not
 * clinical.
 *
 * The reminder moved out of a banner and under the avatar as a note
 * icon. A banner across the top of every chart stops being read by the
 * second week; an icon that only lights up when there is something to
 * say keeps its meaning.
 *
 * Tabs follow how the work actually goes: set the plan, manage the
 * medicines, cover prevention, read the results, write the note.
 */
import { useEffect, useState } from 'react';
import { useStore } from '../lib/store';
import { useNav, type ChartTab } from '../lib/nav';
import { Avatar, Chip } from '../components/ui';
import { ENCOUNTER_KINDS, type EncounterKind } from '../domain/types';
import { age, fmtDate, MEMBERSHIP_LABEL, monthsSince } from '../lib/format';
import { oneLiner } from '../lib/clinical';
import { markChartOpen } from '../lib/metrics';
import { PlanTab } from './chart/PlanTab';
import { MedsTab } from './chart/MedsTab';
import { ResultsTab } from './chart/ResultsTab';
import { PreventionTab } from './chart/PreventionTab';
import { NotesTab } from './chart/NotesTab';
import { SpecialistsTab } from './chart/SpecialistsTab';

const SEX_SHORT: Record<string, string> = { female: 'F', male: 'M' };

export function Chart({ patientId, initialTab }: { patientId: string; initialTab?: ChartTab }) {
  const st = useStore();
  const nav = useNav();
  const [tab, setTab] = useState<ChartTab>(initialTab ?? 'plan');
  const [showNote, setShowNote] = useState(false);
  const [picking, setPicking] = useState(false);

  // Time here is chart review, and it is what the assembled note should shrink.
  useEffect(() => { markChartOpen(); }, [patientId]);

  const p = st.patient(patientId);
  if (!p) return <div className="wrap"><p>Patient not found.</p></div>;

  const conditions = st.conditionsFor(p.id);
  const active = conditions.filter((c) => c.status === 'active');
  const specialists = st.specialistsFor(p.id);
  const nextVisit = st.encountersFor(p.id).find((e) => e.status !== 'signed');
  const unack = st.reportsFor(p.id).filter((r) => !r.acknowledged).length;

  const tabs: { id: ChartTab; label: string; badge?: number }[] = [
    { id: 'plan', label: 'Care plan' },
    { id: 'meds', label: 'Medicines' },
    { id: 'prevention', label: 'Prevention' },
    { id: 'results', label: 'Results', badge: unack },
    { id: 'notes', label: 'Notes' },
    ...(specialists.length ? [{ id: 'specialists' as ChartTab, label: 'Specialists' }] : []),
  ];

  return (
    <div className="wrap">
      {nav.canBack && (
        <button className="btn quiet" style={{ marginBottom: 10 }} onClick={nav.back}>&larr; Back</button>
      )}

      <div className="phead">
        <div className="pid">
          <Avatar patient={p} lg />
          <button
            className={`notepin${p.pinned ? ' has' : ''}`}
            aria-label={p.pinned ? 'Reminder about this patient' : 'No reminder'}
            title={p.pinned ? 'Reminder' : 'No reminder'}
            onClick={() => p.pinned && setShowNote((v) => !v)}
            disabled={!p.pinned}
          >
            <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M2.5 2h11v8.5L10 14H2.5z" fill="currentColor" opacity=".9" />
              <path d="M13.5 10.5H10V14z" fill="var(--panel)" />
            </svg>
          </button>
        </div>

        <div style={{ minWidth: 0, flex: 1 }}>
          <h1>{p.name}</h1>
          <div className="meta">
            {age(p.dob)} &middot; {SEX_SHORT[p.sex] ?? p.sex} ({p.pronouns}) &middot; born {fmtDate(p.dob)}
          </div>
          <div className="meta">{p.phone} &middot; {p.email}</div>

          <p className="oneliner">{oneLiner(p, conditions)}</p>

          <div className="problems">
            {active.length === 0
              ? <span className="small muted">No active problems recorded.</span>
              : active.map((c) => (
                <span key={c.id} className="chip" title={c.note ?? undefined}>{c.name}</span>
              ))}
          </div>
        </div>

        <div className="acts">
          <Chip tone={p.membership === 'standard' ? undefined : 'accent'}>
            {MEMBERSHIP_LABEL[p.membership]} &middot; {monthsSince(p.memberSince)} mo
          </Chip>
          {unack > 0 && <Chip tone="crit">{unack} result{unack > 1 ? 's' : ''}</Chip>}
          <button className="btn ghost" onClick={() => nav.go({ name: 'portal', patientId: p.id })}>
            Their view
          </button>
          {nextVisit ? (
            <button className="btn" onClick={() => nav.go({ name: 'encounter', encounterId: nextVisit.id })}>
              Open visit
            </button>
          ) : (
            <button className="btn" onClick={() => setPicking((v) => !v)}>Start a visit</button>
          )}
        </div>

        {picking && (
          <div className="row wrap" style={{ flexBasis: '100%', gap: 7, paddingTop: 4 }}>
            <span className="eyebrow" style={{ alignSelf: 'center' }}>Visit type</span>
            {ENCOUNTER_KINDS.map((k) => (
              <button key={k.id} className="btn ghost sm" onClick={() => {
                const id = st.startVisit(p.id, k.id as EncounterKind, k.label, k.mins);
                setPicking(false);
                nav.go({ name: 'encounter', encounterId: id });
              }}>{k.label}</button>
            ))}
          </div>
        )}

        {showNote && p.pinned && (
          <div className="pinned" style={{ flexBasis: '100%' }}>
            <b>Remember</b>
            <span>{p.pinned}</span>
            <button className="btn quiet sm" style={{ marginLeft: 'auto' }}
              onClick={() => setShowNote(false)}>Close</button>
          </div>
        )}
      </div>

      <div className="tabs" role="tablist">
        {tabs.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id}
            className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)}>
            {t.label}
            {t.badge ? <span className="chip crit" style={{ marginLeft: 6 }}>{t.badge}</span> : null}
          </button>
        ))}
      </div>

      {tab === 'plan' && <PlanTab patientId={p.id} />}
      {tab === 'meds' && <MedsTab patientId={p.id} />}
      {tab === 'prevention' && <PreventionTab patientId={p.id} />}
      {tab === 'results' && <ResultsTab patientId={p.id} />}
      {tab === 'notes' && <NotesTab patientId={p.id} />}
      {tab === 'specialists' && <SpecialistsTab patientId={p.id} />}
    </div>
  );
}
