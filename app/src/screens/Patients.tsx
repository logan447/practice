/**
 * The panel.
 *
 * A small practice does not need filters and saved views. It needs the
 * whole list, sorted so the people who need something are at the top,
 * and a search box that works.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../lib/store';
import { useNav } from '../lib/nav';
import { Avatar, Chip, Panel } from '../components/ui';
import { age, MEMBERSHIP_LABEL, monthsSince, relative } from '../lib/format';
import { TimeMeter } from '../components/Time';
import { capacity, fmtMin, patientTime } from '../lib/time';

export function Patients() {
  const st = useStore();
  const nav = useNav();
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const search = useRef<HTMLInputElement>(null);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const alloc = capacity(st.capacity, st.patients.length).perPatientMin;
    return st.patients
      .map((p) => {
        const time = patientTime(p, st.timeFor(p.id), alloc, st.now);
        const open = st.tasksFor(p.id);
        const conds = st.conditionsFor(p.id).filter((c) => c.status === 'active');
        const next = st.encountersFor(p.id).find((e) => e.status === 'scheduled');
        return { p, open, conds, next, time, urgent: open.some((t) => t.urgent) };
      })
      .filter(({ p, conds }) =>
        !needle
        || p.name.toLowerCase().includes(needle)
        || conds.some((c) => c.name.toLowerCase().includes(needle)))
      .sort((a, b) =>
        Number(b.urgent) - Number(a.urgent)
        || b.open.length - a.open.length
        || a.p.name.localeCompare(b.p.name));
  }, [st, q]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const typing = /input|textarea|select/i.test(t?.tagName ?? '');
      if (e.key === '/' && !typing) { e.preventDefault(); search.current?.focus(); return; }
      if (typing) return;
      if (e.key === 'j') { e.preventDefault(); setSel((i) => Math.min(i + 1, rows.length - 1)); }
      if (e.key === 'k') { e.preventDefault(); setSel((i) => Math.max(i - 1, 0)); }
      if (e.key === 'Enter' && rows[sel]) {
        e.preventDefault();
        nav.go({ name: 'chart', patientId: rows[sel].p.id });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [rows, sel, nav]);

  useEffect(() => { setSel(0); }, [q]);

  return (
    <div className="wrap">
      <div className="page-head row" style={{ alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <h1>Patients</h1>
            <div className="sub">
            {st.patients.length} members, sorted by what is open.
            <span className="muted"> Press <kbd>/</kbd> to search, <kbd>j</kbd><kbd>k</kbd> to move, <kbd>&#8984;K</kbd> for anything.</span>
          </div>
        </div>
        <button className="btn" onClick={() => nav.go({ name: 'new-patient' })}>New patient</button>
      </div>

      <div style={{ marginBottom: 16, maxWidth: 420 }}>
        <input className="search" placeholder="Search by name or condition"
          value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search patients" />
      </div>

      <Panel flush>
        <table className="rows">
          <thead>
            <tr>
              <th colSpan={2}>Patient</th>
              <th>Active problems</th>
              <th style={{ width: 130 }}>Membership</th>
              <th style={{ width: 130 }}>Next visit</th>
              <th style={{ width: 130 }} title="Physician time this year against allocation. Internal.">Time this year</th>
              <th style={{ width: 90 }}>Open</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ p, open, conds, next, time, urgent }, i) => (
              <tr key={p.id} className={`click${i === sel ? ' sel' : ''}`}
                onMouseEnter={() => setSel(i)}
                onClick={() => nav.go({ name: 'chart', patientId: p.id })}>
                <td style={{ width: 44 }}><Avatar patient={p} /></td>
                <td>
                  <div style={{ fontWeight: 600 }}>{p.name}</div>
                  <div className="small muted">
                    {age(p.dob)}, {p.pronouns} &middot; member {monthsSince(p.memberSince)} months
                  </div>
                </td>
                <td className="small">
                  {conds.length === 0
                    ? <span className="muted">None recorded</span>
                    : conds.map((c) => c.name).join(', ')}
                </td>
                <td>
                  <Chip tone={p.membership === 'standard' ? undefined : 'accent'}>
                    {MEMBERSHIP_LABEL[p.membership]}
                  </Chip>
                </td>
                <td className="small muted">{next ? relative(next.date) : 'Not booked'}</td>
                <td title={`${fmtMin(time.usedMin)} of ${fmtMin(time.allocationMin)} min`}>
                  <TimeMeter slim visit={time.visitMin} chart={time.chartMin} allocation={time.allocationMin} expected={time.expectedMin} />
                  <div className="small muted num" style={{ marginTop: 3 }}>{Math.round(time.pctUsed)}%</div>
                </td>
                <td>
                  {open.length > 0 && (
                    <Chip tone={urgent ? 'crit' : undefined}>{open.length}</Chip>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
