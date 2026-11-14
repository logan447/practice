/**
 * The panel.
 *
 * A small practice does not need filters and saved views. It needs the
 * whole list, sorted so the people who need something are at the top,
 * and a search box that works.
 */
import { useMemo, useState } from 'react';
import { useStore } from '../lib/store';
import { useNav } from '../lib/nav';
import { Avatar, Chip, Panel } from '../components/ui';
import { age, MEMBERSHIP_LABEL, monthsSince, relative } from '../lib/format';

export function Patients() {
  const st = useStore();
  const nav = useNav();
  const [q, setQ] = useState('');

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return st.patients
      .map((p) => {
        const open = st.tasksFor(p.id);
        const conds = st.conditionsFor(p.id).filter((c) => c.status === 'active');
        const next = st.encountersFor(p.id).find((e) => e.status === 'scheduled');
        return { p, open, conds, next, urgent: open.some((t) => t.urgent) };
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

  return (
    <div className="wrap">
      <div className="page-head">
        <h1>Patients</h1>
        <div className="sub">{st.patients.length} members. Sorted by what is open.</div>
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
              <th style={{ width: 90 }}>Open</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ p, open, conds, next, urgent }) => (
              <tr key={p.id} className="click" onClick={() => nav.go({ name: 'chart', patientId: p.id })}>
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
