import { useEffect, useState } from 'react';
import { StoreProvider, useStore } from './lib/store';
import { NavProvider, useNav } from './lib/nav';
import { Today } from './screens/Today';
import { Patients } from './screens/Patients';
import { Chart } from './screens/Chart';
import { Encounter } from './screens/Encounter';

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
      </nav>
      <div className="foot">
        <span>L. DuBose, MD</span>
        <ThemeToggle />
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

function Screen() {
  const { route } = useNav();
  switch (route.name) {
    case 'today': return <Today />;
    case 'patients': return <Patients />;
    case 'chart': return <Chart patientId={route.patientId} initialTab={route.tab} />;
    case 'encounter': return <Encounter encounterId={route.encounterId} />;
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
