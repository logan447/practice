/**
 * The practice-wide log.
 *
 * Per-patient history answers "what happened to this record". This
 * answers the other two questions an audit is ever asked: what has
 * this person been doing, and who has been in charts they are not
 * responsible for.
 */
import { useEffect, useMemo, useState } from 'react';
import { useNav } from '../lib/nav';
import { useStore } from '../lib/store';
import { Chip, Panel, Empty } from '../components/ui';
import { allEvents, subscribe, clearAudit, type AuditEvent } from '../lib/audit';
import { ROLE_LABEL, type Role } from '../lib/session';
import { fmtDate } from '../lib/format';

const when = (ms: number): string =>
  new Date(ms).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });

export function Audit() {
  const nav = useNav();
  const st = useStore();
  const [events, setEvents] = useState<AuditEvent[]>(allEvents);
  const [who, setWho] = useState<Role | 'all'>('all');
  const [onlyOthers, setOnlyOthers] = useState(false);

  useEffect(() => subscribe(() => setEvents(allEvents())), []);

  const rows = useMemo(() => {
    const out = [...events].reverse();
    return out.filter((e) =>
      (who === 'all' || e.role === who)
      && (!onlyOthers || e.role !== 'physician'));
  }, [events, who, onlyOthers]);

  const byActor = useMemo(() => {
    const m = new Map<string, { name: string; role: Role; n: number; reads: number }>();
    for (const e of events) {
      const cur = m.get(e.actorId) ?? { name: e.actorName, role: e.role, n: 0, reads: 0 };
      cur.n += 1;
      if (e.action === 'read') cur.reads += 1;
      m.set(e.actorId, cur);
    }
    return [...m.values()].sort((a, b) => b.n - a.n);
  }, [events]);

  return (
    <div className="wrap">
      <div className="page-head row" style={{ alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <h1>Who did what</h1>
          <div className="sub">
            {events.length} entries. Every change to the record, derived by comparing
            it with itself, so nothing depends on anyone remembering to log it.
          </div>
        </div>
        <button className="btn ghost" onClick={() => nav.back()}>Back</button>
      </div>

      <div className="grid g3" style={{ marginBottom: 16 }}>
        {byActor.map((a) => (
          <Panel key={a.name} title={a.name} eyebrow={ROLE_LABEL[a.role]}>
            <div className="metric">
              <span className="v num">{a.n}</span>
              <span className="u">entries</span>
            </div>
            {a.reads > 0 && (
              <p className="small" style={{ marginTop: 7, color: 'var(--warn)' }}>
                Opened {a.reads} chart{a.reads > 1 ? 's' : ''} they are not responsible for.
              </p>
            )}
          </Panel>
        ))}
        {byActor.length === 0 && (
          <Panel title="Nothing yet"><Empty>The log starts at the first change.</Empty></Panel>
        )}
      </div>

      <div className="row" style={{ marginBottom: 12, gap: 7 }}>
        {(['all', 'physician', 'covering', 'patient'] as const).map((r) => (
          <button key={r} className={`btn sm ${who === r ? '' : 'ghost'}`} onClick={() => setWho(r)}>
            {r === 'all' ? 'Everyone' : ROLE_LABEL[r]}
          </button>
        ))}
        <span className="spacer" />
        <button className={`btn sm ${onlyOthers ? '' : 'ghost'}`}
          onClick={() => setOnlyOthers((v) => !v)}>
          Only people who are not the physician
        </button>
      </div>

      <Panel flush>
        {rows.length === 0 ? <Empty>Nothing matches.</Empty> : (
          <table className="rows">
            <thead>
              <tr>
                <th style={{ width: 160 }}>When</th>
                <th>What</th>
                <th style={{ width: 180 }}>Who</th>
                <th style={{ width: 150 }}>Patient</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 300).map((e) => (
                <tr key={e.id} className={e.patientId ? 'click' : undefined}
                  onClick={() => e.patientId && nav.go({
                    name: 'chart', patientId: e.patientId, tab: 'history',
                  })}>
                  <td className="small muted">
                    {when(e.at)}
                    <div style={{ marginTop: 2 }}>clinic {fmtDate(e.clinicDate)}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>{e.summary}</div>
                    <div className="small muted">{e.resource}</div>
                  </td>
                  <td className="small">
                    {e.actorName}
                    <div className="muted">{ROLE_LABEL[e.role]}</div>
                  </td>
                  <td className="small muted">
                    {e.patientId ? (st.patient(e.patientId)?.name ?? 'removed') : '—'}
                    {e.action === 'read' && <Chip tone="warn">Opened</Chip>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {rows.length > 300 && (
          <div style={{ padding: '11px 16px' }} className="small muted">
            Showing the most recent 300 of {rows.length}.
          </div>
        )}
      </Panel>

      <p className="small muted" style={{ marginTop: 18, maxWidth: '72ch' }}>
        A real record keeps this server-side and append-only, where the person
        being audited cannot reach it. Here it is in the same browser storage as
        everything else, which is the honest limit of a prototype rather than a
        design anyone should copy.
      </p>
      <button className="btn quiet sm" style={{ marginTop: 10 }} onClick={clearAudit}>
        Clear the log
      </button>
    </div>
  );
}
