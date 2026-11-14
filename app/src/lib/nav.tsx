/**
 * Navigation as state.
 *
 * Deliberately not a router: the prototype runs in contexts where path
 * and hash routing are unreliable. Every screen reads the route from
 * this hook and nothing else, so dropping in react-router later is a
 * change to this file alone.
 */
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export type ChartTab =
  | 'plan' | 'meds' | 'prevention' | 'results' | 'notes' | 'specialists' | 'records';
export type PortalTab = 'home' | 'plan' | 'previsit' | 'track' | 'results' | 'meds' | 'visits' | 'ask';

export type Route =
  | { name: 'patients' }
  | { name: 'new-patient' }
  | { name: 'metrics' }
  | { name: 'chart'; patientId: string; tab?: ChartTab }
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
  const [stack, setStack] = useState<Route[]>([{ name: 'patients' }]);

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
