/**
 * Navigation as state.
 *
 * Deliberately not a router: the prototype runs in contexts where path
 * and hash routing are unreliable. Every screen reads the route from
 * this hook and nothing else, so dropping in react-router later is a
 * change to this file alone.
 */
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

/**
 * Kept as the vocabulary for the chart's drawers, which is what the
 * tabs became. The route no longer carries one: the chart is a single
 * screen and a drawer is state inside it, not a destination.
 */
export type ChartTab =
  | 'plan' | 'meds' | 'prevention' | 'results' | 'notes' | 'specialists'
  | 'records' | 'history' | 'paper';
export type PortalTab =
  | 'home' | 'plan' | 'previsit' | 'track' | 'results' | 'meds' | 'visits' | 'ask' | 'records';

export type Route =
  | { name: 'today' }
  | { name: 'inbox' }
  | { name: 'closing' }
  | { name: 'patients' }
  | { name: 'new-patient' }
  | { name: 'metrics' }
  | { name: 'audit' }
  | { name: 'schedule' }
  | { name: 'chart'; patientId: string }
  | { name: 'encounter'; encounterId: string }
  | { name: 'portal'; patientId: string; tab?: PortalTab };

interface Nav {
  route: Route;
  go: (r: Route) => void;
  replace: (r: Route) => void;
  back: () => void;
  canBack: boolean;
  reset: (r: Route) => void;
}

const Ctx = createContext<Nav | null>(null);

export function NavProvider({ children }: { children: ReactNode }) {
  // The day is the way in. A solo practice opens the morning on what
  // it has to do, not on a list of everybody it has ever seen.
  const [stack, setStack] = useState<Route[]>([{ name: 'today' }]);

  const value = useMemo<Nav>(() => ({
    route: stack[stack.length - 1],
    go: (r) => setStack((s) => [...s, r]),
    replace: (r) => setStack((s) => [...s.slice(0, -1), r]),
    back: () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)),
    canBack: stack.length > 1,
    reset: (r) => setStack([r]),
  }), [stack]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useNav(): Nav {
  const v = useContext(Ctx);
  if (!v) throw new Error('useNav outside NavProvider');
  return v;
}
