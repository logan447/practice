import { useEffect, useState } from 'react';
import { StoreProvider, useStore } from './lib/store';
import { NavProvider, useNav } from './lib/nav';
import { Patients } from './screens/Patients';
import { Chart } from './screens/Chart';
import { Encounter } from './screens/Encounter';
import { FirstRun } from './screens/FirstRun';
import { NewPatient } from './screens/NewPatient';
import { Portal } from './portal/Portal';
import { Metrics } from './screens/Metrics';
import { CommandPalette, Shortcuts } from './components/CommandPalette';
import { ClockBar } from './components/ClockBar';
import { countClick, countKey } from './lib/metrics';

/**
 * One slim bar, no navigation rail.
 *
 * A solo practice has one list and the charts hanging off it. A rail
 * with two items in it is furniture, so the bar carries only the way
 * home and the two controls that are not clinical.
 */
function TopBar() {
  const nav = useNav();
  const st = useStore();
  return (
    <header className="topbar">
      <button className="mark" onClick={() => nav.reset({ name: 'patients' })}>
        Direct Lifestyle Medicine<small>Clinical record</small>
      </button>
      {st.hasData && <ClockBar />}
      <span className="spacer" />
      {st.hasData && (
        <>
          <button className="btn quiet sm" onClick={() => nav.go({ name: 'metrics' })}>Usage</button>
          <button className="btn quiet sm" title="Command palette"
            onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}>
            <kbd>&#8984;K</kbd>
          </button>
        </>
      )}
      {!st.persisted && (
        <span className="chip crit" title="The browser refused the last write">
          Not saved
        </span>
      )}
      <ThemeToggle />
      <ResetControl />
    </header>
  );
}

function ThemeToggle() {
  const [theme, setTheme] = useState<'system' | 'light' | 'dark'>('system');
  useEffect(() => {
    const el = document.documentElement;
    if (theme === 'system') el.removeAttribute('data-theme');
    else el.setAttribute('data-theme', theme);
  }, [theme]);
  const next = () => setTheme((t) => (t === 'system' ? 'light' : t === 'light' ? 'dark' : 'system'));
  return <button className="btn quiet sm" onClick={next} title="Appearance">{theme}</button>;
}

/** Prototype housekeeping: start over without opening devtools. */
function ResetControl() {
  const st = useStore();
  const nav = useNav();
  const [armed, setArmed] = useState(false);
  if (!st.hasData) return null;
  return armed ? (
    <button className="btn quiet sm" style={{ color: 'var(--crit)' }}
      onClick={() => { st.clearAll(); setArmed(false); nav.reset({ name: 'patients' }); }}>
      Really clear?
    </button>
  ) : (
    <button className="btn quiet sm" onClick={() => setArmed(true)}>Clear data</button>
  );
}

function Screen() {
  const { route } = useNav();
  const st = useStore();

  // An empty record is the normal state on day one, not an error.
  if (!st.hasData && route.name !== 'new-patient') return <FirstRun />;

  switch (route.name) {
    case 'patients': return <Patients />;
    case 'new-patient': return <NewPatient />;
    case 'metrics': return <Metrics />;
    case 'chart': return <Chart patientId={route.patientId} initialTab={route.tab} />;
    case 'encounter': return <Encounter encounterId={route.encounterId} />;
    case 'portal': return <Portal patientId={route.patientId} initialTab={route.tab} />;
  }
}

/**
 * Global keys that are not tied to one screen, plus the click and
 * keystroke counters that feed the usage measurements.
 */
function GlobalKeys() {
  const nav = useNav();
  const st = useStore();

  useEffect(() => {
    const onClick = () => countClick();
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const typing = /input|textarea|select/i.test(t?.tagName ?? '');
      if (typing) { countKey(); return; }

      if (e.key === 'Escape') { nav.back(); return; }
      if (e.key === '.') { e.preventDefault(); st.advanceTime(1); return; }
    };
    window.addEventListener('click', onClick);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('click', onClick);
      window.removeEventListener('keydown', onKey);
    };
  }, [nav, st]);

  return null;
}

export default function App() {
  return (
    <StoreProvider>
      <NavProvider>
        <div className="app">
          <TopBar />
          <main className="main"><Screen /></main>
        </div>
        <GlobalKeys />
        <CommandPalette />
        <Shortcuts />
      </NavProvider>
    </StoreProvider>
  );
}
