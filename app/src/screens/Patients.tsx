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
import { findIssues } from '../lib/dataQuality';

export function Patients() {
  const st = useStore();
  const nav = useNav();
  const [q, setQ] = useState('');
  const [onlyDirty, setOnlyDirty] = useState(false);
  const [sel, setSel] = useState(0);
  const search = useRef<HTMLInputElement>(null);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return st.patients
      .map((p) => {
        const open = st.tasksFor(p.id);
        const conds = st.conditionsFor(p.id).filter((c) => c.status === 'active');
        const next = st.encountersFor(p.id).find((e) => e.status === 'scheduled');
        // Panel-wide, because which charts need reconciling is a
        // property of the panel, not something you find one at a time.
        const issues = findIssues({
          patient: p, allPatients: st.patients, medications: st.medsFor(p.id),
          allergies: st.allergiesFor(p.id), conditions: st.conditionsFor(p.id),
          series: st.seriesFor(p.id), documents: st.documentsFor(p.id),
        });
        return {
          p, open, conds, next, issues,
          crit: issues.filter((i) => i.level === 'crit').length,
          urgent: open.some((t) => t.urgent),
        };
      })
      .filter(({ p, conds, issues }) =>
        (!onlyDirty || issues.length > 0)
        && (!needle
          || p.name.toLowerCase().includes(needle)
          || conds.some((c) => c.name.toLowerCase().includes(needle))))
      .sort((a, b) =>
        Number(b.urgent) - Number(a.urgent)
        || b.open.length - a.open.length
        || a.p.name.localeCompare(b.p.name));
  }, [st, q, onlyDirty]);

  const dirty = useMemo(
    () => rows.filter((r) => r.issues.length > 0).length,
    [rows],
  );

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

      <div className="row" style={{ marginBottom: 16, gap: 10 }}>
        <div style={{ maxWidth: 420, flex: 1 }}>
          <input className="search" placeholder="Search by name or condition"
            value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search patients" />
        </div>
        {(dirty > 0 || onlyDirty) && (
          <button className={`btn sm ${onlyDirty ? '' : 'ghost'}`}
            onClick={() => setOnlyDirty((v) => !v)}>
            Needs reconciling{onlyDirty ? '' : ` (${dirty})`}
          </button>
        )}
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
              <th style={{ width: 110 }}>Record</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ p, open, conds, next, urgent, issues, crit }, i) => (
              <tr key={p.id} className={`click${i === sel ? ' sel' : ''}`}
                onMouseEnter={() => setSel(i)}
                onClick={() => nav.go({ name: 'chart', patientId: p.id })}>
                <td style={{ width: 44 }}><Avatar patient={p} /></td>
                <td>
                  <div style={{ fontWeight: 600 }}>{p.name}</div>
                  <div className="small muted">
                    {age(p.dob)}, {p.pronouns} &middot; member {monthsSince(p.memberSince)}
                    {monthsSince(p.memberSince) === 1 ? ' month' : ' months'}
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
                <td>
                  {issues.length > 0 && (
                    <Chip tone={crit > 0 ? 'crit' : 'warn'}>
                      {issues.length} to fix
                    </Chip>
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
