/**
 * The command palette.
 *
 * Clinicians work on keyboards. Every patient, every tab and every
 * action is one chord away, so that moving around the record never
 * costs a hand on the mouse.
 *
 * Opens on Cmd-K or Ctrl-K. Typing filters patients and commands
 * together, because when you are mid-clinic you do not want to decide
 * first which kind of thing you are looking for.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../lib/store';
import { CHART_TOOLS, TAB_LABEL } from '../screens/chart/drawers';
import { useNav } from '../lib/nav';
import { Portrait } from './Portrait';
import { age } from '../lib/format';
import { useActor } from '../lib/session';
import { can } from '../lib/permissions';

interface Item {
  id: string;
  label: string;
  hint?: string;
  group: string;
  run: () => void;
  patientId?: string;
}

/** Subsequence match, so "mrey" finds "Marcus Reyes". */
function score(needle: string, hay: string): number {
  if (!needle) return 1;
  const n = needle.toLowerCase();
  const h = hay.toLowerCase();
  if (h.includes(n)) return 100 - h.indexOf(n);
  let i = 0;
  for (const ch of h) if (ch === n[i]) i++;
  return i === n.length ? 10 : 0;
}

/** Light, dark, or whatever the machine says. */
function cycleTheme() {
  const el = document.documentElement;
  const now = el.getAttribute('data-theme');
  if (!now) el.setAttribute('data-theme', 'light');
  else if (now === 'light') el.setAttribute('data-theme', 'dark');
  else el.removeAttribute('data-theme');
}

export function CommandPalette() {
  const st = useStore();
  const nav = useNav();
  const me = useActor();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
        setQ('');
        setSel(0);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => { if (open) input.current?.focus(); }, [open]);

  const route = nav.route;
  const currentPatient = route.name === 'chart' ? route.patientId
    : route.name === 'portal' ? route.patientId
      : route.name === 'encounter' ? st.encounter(route.encounterId)?.patientId
        : undefined;

  const items = useMemo<Item[]>(() => {
    const out: Item[] = [];

    for (const p of st.patients) {
      out.push({
        id: `p-${p.id}`, label: p.name, group: 'Patients', patientId: p.id,
        hint: `${age(p.dob)} · ${st.tasksFor(p.id).length || 'no'} open`,
        run: () => nav.go({ name: 'chart', patientId: p.id }),
      });
    }

    out.push(
      { id: 'c-new', label: 'New patient', group: 'Actions', run: () => nav.go({ name: 'new-patient' }) },
      { id: 'c-list', label: 'All patients', group: 'Actions', run: () => nav.reset({ name: 'patients' }) },
      { id: 'c-metrics', label: 'Usage and timing', group: 'Actions', run: () => nav.go({ name: 'metrics' }) },
      { id: 'c-sched', label: 'Schedule and capacity', group: 'Actions', run: () => nav.go({ name: 'schedule' }) },
      { id: 'c-log', label: 'Who did what', group: 'Actions', run: () => nav.go({ name: 'audit' }) },
      {
        // Reachable from anywhere, because the first run screen is
        // gone the moment there is any data and the worked examples
        // are the only charts with a record deep enough to read.
        id: 'c-demo',
        label: 'Load the three worked examples (replaces what is here)',
        group: 'Actions',
        run: () => { st.loadDemo(); nav.reset({ name: 'patients' }); },
      },
      {
        id: 'c-panel', label: 'Load a full panel of 120 patients', group: 'Actions',
        run: () => { st.loadPanel(); nav.reset({ name: 'patients' }); },
      },
      { id: 'c-closing', label: 'Before closing', group: 'Actions', run: () => nav.go({ name: 'closing' }) },
      { id: 'c-capacity', label: 'Capacity', group: 'Actions', run: () => nav.go({ name: 'capacity' }) },
      { id: 'c-theme', label: 'Appearance: light, dark or system', group: 'Actions', run: cycleTheme },
    );

    /*
     * The clock and the administrative commands carry the same
     * permissions they carried when they were buttons. Moving a
     * control into a search box must not move it out of the rules:
     * cover looks after patients for a fortnight and does not run
     * the practice.
     */
    if (can(me, 'load-data', { now: st.now }).allowed) {
      out.push({
        // Prototype housekeeping, kept reachable so starting over
        // does not mean opening devtools. Named plainly enough that
        // nobody runs it by accident looking for something else.
        id: 'c-clear', label: 'Clear every patient and start over', group: 'Actions',
        run: () => { st.clearAll(); nav.reset({ name: 'schedule' }); },
      });
    }
    if (can(me, 'move-clock', { now: st.now }).allowed) {
      out.push(
        { id: 'c-day', label: 'Advance one day', group: 'Clock', run: () => st.advanceTime(1) },
        { id: 'c-week', label: 'Advance one week', group: 'Clock', run: () => st.advanceTime(7) },
        { id: 'c-month', label: 'Advance one month', group: 'Clock', run: () => st.advanceTime(30) },
        { id: 'c-reset-clock', label: 'Back to the start of the clock', group: 'Clock', run: st.resetTime },
      );
    }
    if (can(me, 'read-audit', { now: st.now }).allowed === false) {
      const i = out.findIndex((x) => x.id === 'c-log');
      if (i >= 0) out.splice(i, 1);
    }

    /*
     * The chart's rarely-wanted tabs.
     *
     * Seven tabs are on the strip and these ten are not, because they
     * are things you go looking for by name rather than things you
     * meet. Looking for something by name is what this is.
     */
    if (route.name === 'chart') {
      for (const t of CHART_TOOLS) {
        out.push({
          id: `w-${t}`, label: TAB_LABEL[t], group: 'This chart',
          run: () => nav.go({ name: 'chart', patientId: route.patientId, tab: t }),
        });
      }
      out.push({
        id: 'w-sim', label: 'Simulate a record arriving', group: 'This chart',
        run: () => st.simulateUpdate(route.patientId),
      });
    }

    if (currentPatient) {
      // The chart no longer has tabs to jump to. What used to be a tab
      // is a drawer opened from the place in the plan that refers to
      // it, so a palette entry for each one would be a second
      // navigation scheme for a screen that deliberately has none.
      out.push({
        id: 't-chart', label: 'Back to the chart', group: 'This patient',
        run: () => nav.go({ name: 'chart', patientId: currentPatient }),
      });
      out.push({
        id: 't-portal', label: 'See their view', group: 'This patient',
        run: () => nav.go({ name: 'portal', patientId: currentPatient }),
      });
      const open = st.encountersFor(currentPatient).find((e) => e.status !== 'signed');
      if (open) {
        out.push({
          id: 't-visit', label: 'Open the visit', group: 'This patient',
          run: () => nav.go({ name: 'encounter', encounterId: open.id }),
        });
      }
    }

    return out;
  }, [st, nav, me, currentPatient]);

  const shown = useMemo(() => items
    .map((it) => ({ it, s: score(q, it.label) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, 9)
    .map((x) => x.it), [items, q]);

  useEffect(() => { setSel(0); }, [q]);

  if (!open) return null;

  const choose = (it: Item) => { it.run(); setOpen(false); };

  return (
    <div className="palette-back" onClick={() => setOpen(false)} role="presentation">
      <div className="palette" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Command palette">
        <input
          ref={input} className="palette-input" value={q} placeholder="Search patients, or type a command"
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') { e.preventDefault(); setSel((i) => Math.min(i + 1, shown.length - 1)); }
            if (e.key === 'ArrowUp') { e.preventDefault(); setSel((i) => Math.max(i - 1, 0)); }
            if (e.key === 'Enter' && shown[sel]) { e.preventDefault(); choose(shown[sel]); }
          }}
        />
        <div className="palette-list">
          {shown.length === 0 && <div className="empty">Nothing matches.</div>}
          {shown.map((it, i) => {
            const p = it.patientId ? st.patient(it.patientId) : undefined;
            return (
              <button key={it.id} className={`palette-row${i === sel ? ' on' : ''}`}
                onMouseEnter={() => setSel(i)} onClick={() => choose(it)}>
                {p ? <Portrait patient={p} size={22} /> : <span className="palette-dot" />}
                <span className="palette-label">{it.label}</span>
                {it.hint && <span className="small muted">{it.hint}</span>}
                <span className="palette-group">{it.group}</span>
              </button>
            );
          })}
        </div>
        <div className="palette-foot">
          <span><kbd>&uarr;</kbd><kbd>&darr;</kbd> move</span>
          <span><kbd>&crarr;</kbd> open</span>
          <span><kbd>esc</kbd> close</span>
          <span className="spacer" />
          <span><kbd>?</kbd> all shortcuts</span>
        </div>
      </div>
    </div>
  );
}

/** The cheat sheet, on "?" anywhere that is not a text box. */
export function Shortcuts() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const typing = /input|textarea|select/i.test(t?.tagName ?? '');
      if (e.key === '?' && !typing) { e.preventDefault(); setOpen((v) => !v); }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!open) return null;

  const rows: [string, string][] = [
    ['⌘K / Ctrl-K', 'Command palette: any patient, tab or action'],
    ['/', 'Search the patient list'],
    ['j / k', 'Move down and up the patient list'],
    ['↵', 'Open the selected patient'],
    ['⌘↵', 'Sign the note'],
    ['⌘S', 'Save the note'],
    ['⌘⇧L', 'Start or stop listening'],
    ['[ / ]', 'Previous and next chart tab'],
    ['.', 'Advance the clock one day'],
    ['esc', 'Back, or close'],
    ['?', 'This list'],
  ];

  return (
    <div className="palette-back" onClick={() => setOpen(false)} role="presentation">
      <div className="palette" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Shortcuts">
        <div className="palette-head">Keyboard</div>
        <div className="palette-list">
          {rows.map(([k, label]) => (
            <div key={k} className="palette-row static">
              <kbd style={{ minWidth: 86 }}>{k}</kbd>
              <span className="palette-label">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
