/**
 * Saying what is wrong with a prescription, and why.
 *
 * The basis is on the alert rather than behind a link, because an
 * alert you cannot evaluate is an alert you learn to click past, and
 * because independent review of the reasoning is what keeps advice
 * like this outside the FDA's device definition.
 *
 * The footer saying how many rules exist is not modesty. A checker
 * that does not say what it covers invites the belief that silence
 * means safety.
 */
import { useState } from 'react';
import { Chip } from './ui';
import { RULESET, SEVERITY_LABEL, type Alert, type Severity } from '../lib/interactions';

const TONE: Record<Severity, 'crit' | 'warn' | undefined> = {
  avoid: 'crit', serious: 'crit', monitor: 'warn',
};

export function AlertCard({ a }: { a: Alert }) {
  const [why, setWhy] = useState(false);
  return (
    <div className={`ixrow ${a.severity}`}>
      <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
        <Chip tone={TONE[a.severity]}>{SEVERITY_LABEL[a.severity]}</Chip>
        <strong>{a.subject}</strong>
        <span className="muted small">with</span>
        <strong>{a.against}</strong>
      </div>
      <p className="ixeffect">{a.effect}</p>
      {why ? (
        <p className="ixbasis">{a.basis}</p>
      ) : (
        <button className="btn quiet sm" onClick={() => setWhy(true)}>Why</button>
      )}
    </div>
  );
}

export function Interactions({ alerts, title = 'Interactions', empty }: {
  alerts: Alert[];
  title?: string;
  empty?: string;
}) {
  if (alerts.length === 0) {
    return empty ? <p className="small muted">{empty}</p> : null;
  }
  const worst = alerts.some((a) => a.severity !== 'monitor');
  return (
    <div className={`ixbox${worst ? ' bad' : ''}`}>
      <div className="row" style={{ marginBottom: 8 }}>
        <strong style={{ fontSize: 14 }}>{title}</strong>
        <span className="spacer" />
        <span className="small muted">{alerts.length}</span>
      </div>
      <div className="stack-sm">
        {alerts.map((a) => <AlertCard key={a.id} a={a} />)}
      </div>
      <p className="ixfoot">
        Checked against {RULESET.total} rules ({RULESET.pairs} drug pairs,{' '}
        {RULESET.allergy} allergy, {RULESET.condition} condition,{' '}
        {RULESET.duplicate} duplicate-therapy). {RULESET.note}
      </p>
    </div>
  );
}
