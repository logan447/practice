/**
 * Before the practice closes.
 *
 * Four months a year away is defensible. Four months a year away with
 * prescriptions running out, labs falling due and questions nobody
 * will read the answers to is a different thing, and the difference
 * is this screen.
 *
 * It is a finding list, not a task list. Nothing here is ticked off
 * and nothing is enforced, because every item resolves inside an
 * encounter or a prescription and those are the places the work
 * belongs. What this does is make sure nobody is surprised, which is
 * the whole job: a closure that was planned and checked is a
 * different clinical fact from one that merely happened.
 *
 * The item at the top of every list it appears on is the patient with
 * no primary care physician. While the practice is shut they have no
 * physician at all, and no amount of membership agreement changes
 * that.
 */
import { useStore } from '../lib/store';
import { useNav } from '../lib/nav';
import { Chip, Panel, Empty } from '../components/ui';
import { fmtDate } from '../lib/format';

const KIND_LABEL: Record<string, string> = {
  supply: 'Prescriptions', due: 'Falls due inside', asked: 'Waiting on them',
  referral: 'Outstanding referral', nobody: 'No other physician',
};

export function Closing() {
  const st = useStore();
  const nav = useNav();
  const result = st.closureChecks();

  if (!result) {
    return (
      <div className="wrap">
        <div className="page-head"><h1>Before closing</h1></div>
        <Panel title="Nothing scheduled">
          <Empty>No closure is on the calendar.</Empty>
        </Panel>
      </div>
    );
  }

  const { closure, checks } = result;
  const urgent = checks.filter((c) => c.items.some((i) => i.urgent));
  const days = Math.round(
    (Date.parse(`${closure.from}T12:00:00`) - Date.parse(`${st.now}T12:00:00`)) / 86400000,
  );

  return (
    <div className="wrap">
      <div className="page-head row" style={{ alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <h1>Before closing</h1>
          <div className="sub">
            {closure.label}, {fmtDate(closure.from)} to {fmtDate(closure.to)}.{' '}
            {days > 0 ? `${days} days away.` : 'In progress.'}{' '}
            {checks.length} {checks.length === 1 ? 'patient has' : 'patients have'} something
            outstanding{urgent.length > 0 && `, ${urgent.length} of them urgent`}.
          </div>
        </div>
        <button className="btn ghost" onClick={() => nav.go({ name: 'today' })}>Today</button>
      </div>

      <p className="small muted" style={{ maxWidth: '72ch', marginBottom: 14 }}>
        A planned closure is not an absence from care if the dates were known before
        anybody enrolled and nothing clinically live spans the gap. This is the second
        half of that sentence. Nothing here is ticked off: each item is dealt with in
        an encounter or a prescription, and this is only how you find them.
      </p>

      {checks.length === 0 ? (
        <Panel title="Nothing outstanding">
          <Empty>Nothing on the panel needs attention before this closure.</Empty>
        </Panel>
      ) : (
        <div className="stack">
          {checks.map((c) => (
            <div key={c.patientId} className="closerow">
              <div className="irhead">
                <button className="irwho linkish"
                  onClick={() => nav.go({ name: 'chart', patientId: c.patientId })}>
                  {c.name}
                </button>
                <span className="spacer" />
                {c.nextAfter ? (
                  <span className="small muted">
                    Next booked {fmtDate(c.nextAfter.date)}, after we reopen
                  </span>
                ) : (
                  <Chip tone="warn">Nothing booked after the closure</Chip>
                )}
              </div>
              <ul className="checklist">
                {c.items.map((i, n) => (
                  <li key={n} className={i.urgent ? 'unmet' : 'met'}>
                    <span className="ckmark">{i.urgent ? '!' : '·'}</span>
                    <div>
                      <div className="cklabel">
                        {KIND_LABEL[i.kind] ?? i.kind}
                        {i.urgent && <span className="ckopt">deal with this first</span>}
                      </div>
                      <div className="ckevidence">{i.text}</div>
                      {i.fix && <div className="ckrule">{i.fix}</div>}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <p className="small muted" style={{ marginTop: 16, maxWidth: '72ch' }}>
        Prescriptions are raised rather than computed. The record does not carry a day
        supply or a dispense date, so the system cannot tell you which ones run out
        inside the closure, and a number that looked computed would be worse than a
        prompt that announces itself. <b>UNSET</b>: day supply, last dispensed.
      </p>
    </div>
  );
}
