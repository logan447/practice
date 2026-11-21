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
import { Audit } from './screens/Audit';
import { Schedule } from './screens/Schedule';
import { Capacity } from './screens/Capacity';
import { Inbox } from './screens/Inbox';
import { Closing } from './screens/Closing';
import { SignInRows } from './components/SignIn';
import { ROLE_LABEL } from './lib/session';
import { useActor } from './lib/session';
import { can } from './lib/permissions';
import { CommandPalette, Shortcuts } from './components/CommandPalette';
import { CHART_TOOLS, TAB_LABEL } from './screens/chart/drawers';
import { ClockBar } from './components/ClockBar';
import { countClick, countKey } from './lib/metrics';

/**
 * One slim bar: the way home, the clock, and a menu.
 *
 * It used to carry seven buttons, a keyboard hint, a theme toggle, a
 * sign-in control and a reset. Every one of them was reachable and
 * none of them was findable, because a bar with nine controls is a
 * bar you stop reading. A solo practice has one place it starts from
 * and a handful of places it goes; the first is the logo and the
 * rest are behind the avatar.
 *
 * The clock stays out in the open because it is not navigation. It
 * is the one control that changes what every screen says, and in a
 * prototype about a longitudinal record it gets used constantly.
 */
function TopBar() {
  const nav = useNav();
  const st = useStore();
  const me = useActor();
  const clinician = me.role !== 'patient';
  return (
    <header className="topbar">
      <button className="mark" onClick={() => nav.reset(clinician
        ? { name: 'schedule' }
        : { name: 'portal', patientId: me.patientId ?? '' })}>
        Direct Lifestyle Medicine
        <small>{clinician ? 'Clinical record' : 'Your health record'}</small>
      </button>
      {st.hasData && clinician && <ClockBar />}
      <span className="spacer" />
      {!st.persisted && (
        <span className="chip crit" title="The browser refused the last write">
          Not saved
        </span>
      )}
      <AccountMenu />
    </header>
  );
}

/**
 * Everything that is not the clock.
 *
 * Grouped rather than listed: where you can go, who you are signed in
 * as, and the two prototype controls that are not clinical at all.
 * The inbox count rides on the avatar itself, because it is the one
 * thing worth knowing before you open the menu.
 */
function AccountMenu() {
  const nav = useNav();
  const st = useStore();
  const me = useActor();
  const [open, setOpen] = useState(false);
  const clinician = me.role !== 'patient';

  const waiting = st.hasData && clinician
    ? st.inbox().filter((x) => !x.triage) : [];
  const urgent = waiting.filter((x) => x.urgent).length;

  useEffect(() => {
    if (!open) return undefined;
    const close = () => setOpen(false);
    // Any click anywhere closes it, including the one that chose
    // something. The menu never needs to stay open twice.
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [open]);

  const go = (r: Parameters<typeof nav.go>[0]) => { nav.go(r); setOpen(false); };

  const initials = me.name.split(/[\s.]+/).filter(Boolean)
    .map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="acct" onClick={(e) => e.stopPropagation()}>
      <button className={`acctbtn${urgent > 0 ? ' urgent' : ''}`}
        onClick={() => setOpen((v) => !v)} title={`${me.name} · ${ROLE_LABEL[me.role]}`}
        aria-label="Account and menu">
        <span className="acctface">{initials}</span>
        {waiting.length > 0 && (
          <span className={`acctcount${urgent > 0 ? ' urgent' : ''}`}>{waiting.length}</span>
        )}
      </button>

      {open && (
        <div className="acctmenu">
          <div className="acctwho">
            <strong>{me.name}</strong>
            <span className="small muted">{ROLE_LABEL[me.role]}</span>
          </div>

          {/*
            * This chart's rarely-wanted tabs. They were behind a
            * "More" control on the tab strip, which is still a tab
            * sitting there being read. A chart has seven tabs now and
            * everything else you go looking for is here, with the
            * rest of the things you go looking for.
            */}
          {st.hasData && clinician && nav.route.name === 'chart' && (
            <div className="acctsec">
              <div className="acctlabel">This chart</div>
              {CHART_TOOLS.map((t) => (
                <button key={t} className="acctrow"
                  onClick={() => go({
                    name: 'chart',
                    patientId: (nav.route as { patientId: string }).patientId,
                    tab: t,
                  })}>
                  {TAB_LABEL[t]}
                </button>
              ))}
              <button className="acctrow" onClick={() => {
                st.simulateUpdate((nav.route as { patientId: string }).patientId);
                setOpen(false);
              }}>
                Simulate a record arriving
              </button>
            </div>
          )}

          {st.hasData && clinician && (
            <>
              <div className="acctsec">
                <button className="acctrow" onClick={() => go({ name: 'schedule' })}>
                  Schedule
                </button>
                <button className="acctrow" onClick={() => go({ name: 'inbox' })}>
                  Inbox
                  {waiting.length > 0 && (
                    <span className={`acctcount${urgent > 0 ? ' urgent' : ''}`}>
                      {waiting.length}
                    </span>
                  )}
                </button>
                <button className="acctrow" onClick={() => go({ name: 'patients' })}>
                  Patients
                </button>
                <button className="acctrow" onClick={() => go({ name: 'closing' })}>
                  Before closing
                </button>
              </div>

              <div className="acctsec">
                <button className="acctrow" onClick={() => go({ name: 'capacity' })}>
                  Capacity
                </button>
                <button className="acctrow" onClick={() => go({ name: 'audit' })}>
                  Who did what
                </button>
                <button className="acctrow" onClick={() => go({ name: 'metrics' })}>
                  Usage
                </button>
                <button className="acctrow" onClick={() => {
                  setOpen(false);
                  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
                }}>
                  Search anything <kbd>&#8984;K</kbd>
                </button>
              </div>
            </>
          )}

          <div className="acctsec">
            <SignInRows onDone={() => setOpen(false)} />
          </div>

          <div className="acctsec">
            <ThemeRow />
            <ResetRow onDone={() => setOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

function ThemeRow() {
  const [theme, setTheme] = useState<'system' | 'light' | 'dark'>('system');
  useEffect(() => {
    const el = document.documentElement;
    if (theme === 'system') el.removeAttribute('data-theme');
    else el.setAttribute('data-theme', theme);
  }, [theme]);
  const next = () => setTheme((t) => (t === 'system' ? 'light' : t === 'light' ? 'dark' : 'system'));
  return (
    <button className="acctrow" onClick={next}>
      Appearance <span className="small muted">{theme}</span>
    </button>
  );
}

/** Prototype housekeeping: start over without opening devtools. */
function ResetRow({ onDone }: { onDone: () => void }) {
  const st = useStore();
  const nav = useNav();
  const me = useActor();
  const [armed, setArmed] = useState(false);
  if (!st.hasData) return null;
  // Clearing the practice is not a clinical act, so cover does not have it.
  if (!can(me, 'load-data', { now: st.now }).allowed) return null;
  return armed ? (
    <button className="acctrow danger"
      onClick={() => { st.clearAll(); setArmed(false); onDone(); nav.reset({ name: 'schedule' }); }}>
      Really clear everything?
    </button>
  ) : (
    <button className="acctrow" onClick={() => setArmed(true)}>Clear data</button>
  );
}

function Screen() {
  const { route } = useNav();
  const st = useStore();
  const me = useActor();

  // An empty record is the normal state on day one, not an error.
  if (!st.hasData && route.name !== 'new-patient') return <FirstRun />;

  // Signed in as a patient, there is one destination. Not a filtered
  // version of the clinical screens: a different document.
  if (me.role === 'patient' && me.patientId) {
    if (route.name === 'portal') return <Portal patientId={route.patientId} initialTab={route.tab} />;
    return <Portal patientId={me.patientId} />;
  }

  switch (route.name) {
    case 'schedule': return <Schedule />;
    case 'inbox': return <Inbox />;
    case 'closing': return <Closing />;
    case 'patients': return <Patients />;
    case 'new-patient': return <NewPatient />;
    case 'metrics': return <Metrics />;
    case 'audit': return <Audit />;
    case 'capacity': return <Capacity />;
    case 'chart': return <Chart patientId={route.patientId} />;
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

      // A drawer or a document preview owns Escape while it is open,
      // and the clock has no business moving underneath one. Both
      // mark themselves with role="dialog", so one check covers every
      // overlay rather than each one stopping propagation by hand.
      if (document.querySelector('[role="dialog"]')) return;

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
