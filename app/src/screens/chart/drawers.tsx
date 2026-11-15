/**
 * What is behind each section of the rail.
 *
 * The rail is an index. These are the records. Opening a section
 * should put every record this practice holds on that topic in front
 * of you, not a filtered highlight of it, because the reason you
 * opened it is that the summary was not enough.
 */
import { useState } from 'react';
import { useStore } from '../../lib/store';
import { Chip, Panel, Empty } from '../../components/ui';
import { ResultsTab } from './ResultsTab';
import { fmtDate, relative } from '../../lib/format';
import type { LabPanel } from '../../domain/types';

export type ChartDrawer =
  | null
  | 'visits' | 'plan' | 'meds' | 'results' | 'specialists' | 'orders' | 'followup'
  | 'studies' | 'records' | 'documentation' | 'export' | 'details'
  | 'encounters' | 'notes' | 'history' | 'prevention' | 'letters' | 'scope';

export const DRAWER_TITLES: Record<string, { title: string; sub?: string }> = {
  visits: { title: 'Visits', sub: 'Every encounter, and the notes as signed' },
  encounters: {
    title: 'Encounters',
    sub: 'Visits, updates, messages, letters and results, newest first',
  },
  plan: { title: 'Shared care plan', sub: 'What the patient sees in their portal' },
  meds: { title: 'Medicines', sub: 'Stopped drugs stay, with the reason' },
  results: { title: 'Labs and vitals', sub: 'Every panel and every reading' },
  specialists: { title: 'Specialists' },
  orders: { title: 'Pending orders' },
  followup: { title: 'Follow-up' },
  studies: { title: 'Imaging and procedures' },
  records: { title: 'Allergies and outside records' },
  documentation: {
    title: 'Coding, if we ever bill',
    sub: 'This practice does not bill insurance. Kept because the work behind it was expensive and the question may come back',
  },
  export: { title: 'Export the record' },
  details: { title: 'Patient details' },
  notes: { title: 'Visit notes' },
  history: { title: 'Who did what' },
  prevention: { title: 'Prevention' },
  letters: { title: 'Letters and forms', sub: 'Referral, work note, prior authorisation' },
  scope: {
    title: 'Scope of care',
    sub: 'What we manage, what we provide, what we do not, and what they are responsible for',
  },
};

/* ------------------------------------------------------ labs + vitals */

export function ResultsDrawer({ patientId }: { patientId: string }) {
  const st = useStore();
  const panels = st.panelsFor(patientId);
  const vitals = st.vitalsFor(patientId);
  const [openPanel, setOpenPanel] = useState<string | null>(panels[0]?.id ?? null);

  const office = vitals.filter((v) => v.source === 'office');
  const home = vitals.filter((v) => v.source === 'home');

  return (
    <div className="stack">
      {/*
        * Reports to acknowledge, the trends, and the rule that keeps
        * patient-measured readings in their own series. All of that
        * predates the fishbone and none of it is replaced by it.
        */}
      <ResultsTab patientId={patientId} />

      <Panel title="Laboratory panels" flush right={<span className="small muted">{panels.length}</span>}>
        {panels.length === 0 ? <Empty>None on file.</Empty> : panels.map((p) => (
          <div key={p.id} className="paneldrop">
            <button className="pdhead" onClick={() => setOpenPanel(openPanel === p.id ? null : p.id)}>
              <span className="pdname">{p.name}</span>
              <span className="pddate">{fmtDate(p.date)}</span>
              {p.values.some((v) => v.flag !== 'normal') && <Chip tone="warn">Flagged</Chip>}
              <span className="spacer" />
              <span className="small muted">{openPanel === p.id ? 'Hide' : 'Show'}</span>
            </button>
            {openPanel === p.id && <PanelTable p={p} />}
          </div>
        ))}
      </Panel>

      <Panel title="Vitals" flush>
        {vitals.length === 0 ? <Empty>None recorded.</Empty> : (
          <table className="rows">
            <thead>
              <tr><th>Date</th><th>Where</th><th>BP</th><th>HR</th><th>Weight</th><th>BMI</th></tr>
            </thead>
            <tbody>
              {[...office, ...home].sort((a, b) => b.date.localeCompare(a.date)).map((v) => (
                <tr key={v.id}>
                  <td className="small">{fmtDate(v.date)}</td>
                  <td className="small muted">{v.source}</td>
                  <td className="num">{v.systolic ? `${v.systolic}/${v.diastolic}` : '—'}</td>
                  <td className="num">{v.heartRate ?? '—'}</td>
                  <td className="num">{v.weightLb ?? '—'}</td>
                  <td className="num">{v.bmi ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </div>
  );
}

function PanelTable({ p }: { p: LabPanel }) {
  return (
    <table className="rows pdtable">
      <tbody>
        {p.values.map((v) => (
          <tr key={v.key}>
            <td>{v.name}</td>
            <td className={`num${v.flag !== 'normal' ? ' flagged' : ''}`}>{v.value} {v.unit}</td>
            <td className="small muted">
              {v.refLow !== undefined || v.refHigh !== undefined
                ? `${v.refLow ?? ''}${v.refLow !== undefined && v.refHigh !== undefined ? '–' : ''}${v.refHigh ?? ''}`
                : 'no range supplied'}
            </td>
            <td className="small">{v.flag !== 'normal' ? <Chip tone="warn">{v.flag}</Chip> : null}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* --------------------------------------------------------- diagnostics */

export function StudiesDrawer({ patientId }: { patientId: string }) {
  const st = useStore();
  const studies = st.studiesFor(patientId);
  return (
    <div className="stack">
      <Panel title="Imaging, procedures and other diagnostics" flush>
        {studies.length === 0 ? <Empty>None on file.</Empty> : studies.map((d) => (
          <div key={d.id} className="listrow" style={{ padding: '12px 16px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="row" style={{ gap: 8 }}>
                <strong>{d.name}</strong>
                {d.significant && <Chip tone="warn">Significant</Chip>}
              </div>
              <div className="small muted" style={{ marginTop: 2 }}>
                {fmtDate(d.date)} &middot; {d.from ?? 'source not recorded'} &middot; {d.kind}
              </div>
              <p className="small" style={{ marginTop: 6 }}>{d.impression}</p>
            </div>
          </div>
        ))}
      </Panel>
    </div>
  );
}

/* ----------------------------------------------------------- follow-up */

export function FollowUpDrawer({ patientId }: { patientId: string }) {
  const st = useStore();
  const master = st.masterPlanFor(patientId);
  const prevention = st.preventionFor(patientId);
  const tasks = st.tasksFor(patientId);
  const orders = st.ordersForPatient(patientId).filter((o) => o.status === 'placed');
  const specialists = st.specialistsFor(patientId)
    .filter((s) => s.outstanding && s.outstanding !== 'None.');

  return (
    <div className="stack">
      <Panel title="Interval">
        {master?.plan.followUp
          ? <p>{master.plan.followUp}</p>
          : <Empty>No follow-up interval written in the plan.</Empty>}
      </Panel>

      <Panel title="Before the next visit" flush>
        {prevention.filter((p) => p.status !== 'current' && p.status !== 'not-applicable').length === 0
          && tasks.length === 0 && orders.length === 0 && specialists.length === 0
          ? <Empty>Nothing outstanding.</Empty>
          : (
            <div className="doclist">
              {prevention.filter((p) => p.status === 'overdue' || p.status === 'due').map((x) => (
                <div key={x.id} className="listrow" style={{ padding: '10px 16px' }}>
                  <Chip tone={x.status === 'overdue' ? 'crit' : 'warn'}>{x.status}</Chip>
                  <span style={{ flex: 1 }}>{x.name}</span>
                  <span className="small muted">{x.dueBy ? fmtDate(x.dueBy) : ''}</span>
                </div>
              ))}
              {orders.map((o) => (
                <div key={o.id} className="listrow" style={{ padding: '10px 16px' }}>
                  <Chip>awaiting</Chip>
                  <span style={{ flex: 1 }}>{o.text}</span>
                  <span className="small muted">sent {fmtDate(o.created)}</span>
                </div>
              ))}
              {specialists.map((s) => (
                <div key={s.id} className="listrow" style={{ padding: '10px 16px' }}>
                  <Chip tone="warn">{s.specialty}</Chip>
                  <span style={{ flex: 1 }}>{s.outstanding}</span>
                </div>
              ))}
              {tasks.map((t) => (
                <div key={t.id} className="listrow" style={{ padding: '10px 16px' }}>
                  <Chip tone={t.urgent ? 'crit' : undefined}>task</Chip>
                  <span style={{ flex: 1 }}>{t.text}</span>
                  <span className="small muted">{relative(t.due)}</span>
                </div>
              ))}
            </div>
          )}
      </Panel>
    </div>
  );
}

/* ------------------------------------------------------------- orders */

export function OrdersDrawer({ patientId }: { patientId: string }) {
  const st = useStore();
  const all = st.ordersForPatient(patientId);
  const open = all.filter((o) => o.status !== 'done');
  const done = all.filter((o) => o.status === 'done');

  return (
    <div className="stack">
      <Panel title="Outstanding" flush right={<span className="small muted">{open.length}</span>}>
        {open.length === 0 ? <Empty>Nothing outstanding.</Empty> : open.map((o) => (
          <div key={o.id} className="listrow" style={{ padding: '12px 16px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <strong>{o.text}</strong>
              <div className="small muted" style={{ marginTop: 2 }}>
                {o.kind} &middot; {o.status === 'draft' ? 'drafted' : 'placed'} {fmtDate(o.created)}
              </div>
            </div>
            {o.status === 'draft' && <Chip tone="warn">Not sent</Chip>}
            <div className="row" style={{ gap: 6 }}>
              {o.status === 'draft' && (
                <button className="btn sm" onClick={() => st.placeOrder(o.id)}>Send</button>
              )}
              <button className="btn ghost sm" onClick={() => st.completeOrder(o.id)}>Close</button>
              <button className="btn quiet sm" onClick={() => st.removeOrder(o.id)}>Cancel</button>
            </div>
          </div>
        ))}
      </Panel>

      {done.length > 0 && (
        <Panel title="Closed" flush>
          {done.map((o) => (
            <div key={o.id} className="listrow" style={{ padding: '10px 16px' }}>
              <span style={{ flex: 1 }} className="small">{o.text}</span>
              <span className="small muted">{o.closed ? fmtDate(o.closed) : ''}</span>
            </div>
          ))}
        </Panel>
      )}
    </div>
  );
}
