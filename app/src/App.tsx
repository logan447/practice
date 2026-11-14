import { useEffect, useState } from 'react';
import { StoreProvider, useStore } from './lib/store';
import { NavProvider, useNav } from './lib/nav';
import { Today } from './screens/Today';
import { Patients } from './screens/Patients';
import { Chart } from './screens/Chart';
import { Encounter } from './screens/Encounter';
import { FirstRun } from './screens/FirstRun';
import { NewPatient } from './screens/NewPatient';
import { Portal } from './portal/Portal';

function Rail() {
  const nav = useNav();
  const st = useStore();
  const urgent = st.openTasks().filter((t) => t.urgent).length;
  const r = nav.route;

  const item = (name: 'today' | 'patients', label: string, badge?: number) => (
    <button className={r.name === name ? 'on' : ''} onClick={() => nav.go({ name })}>
      <span className="label">{label}</span>
      {badge ? <span className="badge">{badge}</span> : null}
    </button>
  );

  return (
    <aside className="rail">
      <div className="mark">
        Direct Lifestyle Medicine
        <small>Clinical record</small>
      </div>
      <nav>
        {item('today', 'Today', urgent)}
        {item('patients', 'Patients')}
        <button className={r.name === 'new-patient' ? 'on' : ''}
          onClick={() => nav.go({ name: 'new-patient' })}>
          <span className="label">New patient</span>
        </button>
      </nav>
      <div className="foot">
        <span>L. DuBose, MD</span>
        <ThemeToggle />
        <ResetControl />
      </div>
    </aside>
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
  return <button onClick={next} title="Appearance">Appearance: {theme}</button>;
}

/** Prototype housekeeping: start over without opening devtools. */
function ResetControl() {
  const st = useStore();
  const nav = useNav();
  const [armed, setArmed] = useState(false);
  if (!st.hasData) return null;
  return armed ? (
    <button style={{ color: 'var(--crit)' }}
      onClick={() => { st.clearAll(); setArmed(false); nav.reset({ name: 'today' }); }}>
      Really clear everything?
    </button>
  ) : (
    <button onClick={() => setArmed(true)}>Clear all data</button>
  );
}

function Screen() {
  const { route } = useNav();
  const st = useStore();

  // An empty record is the normal state on day one, not an error.
  if (!st.hasData && route.name !== 'new-patient') return <FirstRun />;

  switch (route.name) {
    case 'today': return <Today />;
    case 'patients': return <Patients />;
    case 'new-patient': return <NewPatient />;
    case 'chart': return <Chart patientId={route.patientId} initialTab={route.tab} />;
    case 'encounter': return <Encounter encounterId={route.encounterId} />;
    case 'portal': return <Portal patientId={route.patientId} initialTab={route.tab} />;
  }
}

export default function App() {
  return (
    <StoreProvider>
      <NavProvider>
        <div className="app">
          <Rail />
          <main className="main"><Screen /></main>
        </div>
      </NavProvider>
    </StoreProvider>
  );
}
