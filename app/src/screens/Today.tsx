/**
 * Today — the one screen that answers "what needs me".
 *
 * Ordered by clinical urgency, not by type. Unacknowledged abnormal
 * results sit at the top and cannot be cleared without opening them:
 * a result that arrives and is never seen is the failure mode that
 * matters most in a record system (emr-build-assessment.md §3).
 */
import { useStore } from '../lib/store';
import { useNav } from '../lib/nav';
import { Avatar, Chip, Panel, Empty } from '../components/ui';
import { fmtDate, relative, today } from '../lib/format';

const KIND_LABEL: Record<string, string> = {
  result: 'Result', message: 'Message', 'follow-up': 'Follow-up',
  refill: 'Refill', prevention: 'Prevention',
};

export function Today() {
  const st = useStore();
  const nav = useNav();

  const tasks = st.openTasks();
  const urgent = tasks.filter((t) => t.urgent);
  const rest = tasks.filter((t) => !t.urgent);

  const schedule = st.encounters
    .filter((e) => e.date === '2026-11-14')
    .sort((a, b) => a.id.localeCompare(b.id));

  const d = today();
  const dateLine = d.toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const TaskRow = ({ t }: { t: ReturnType<typeof st.openTasks>[number] }) => {
    const p = st.patient(t.patientId)!;
    return (
      <tr className="click" onClick={() => nav.go({ name: 'chart', patientId: p.id })}>
        <td style={{ width: 44 }}><Avatar patient={p} /></td>
        <td>
          <div style={{ fontWeight: 600 }}>{p.preferredName ?? p.name}</div>
          <div className="small muted">{t.text}</div>
        </td>
        <td style={{ width: 120 }}>
          <Chip tone={t.urgent ? 'crit' : undefined}>{KIND_LABEL[t.kind]}</Chip>
        </td>
        <td style={{ width: 110 }} className="small muted">{relative(t.due)}</td>
        <td style={{ width: 90, textAlign: 'right' }}>
          <button className="btn ghost sm" onClick={(e) => { e.stopPropagation(); st.completeTask(t.id); }}>
            Done
          </button>
        </td>
      </tr>
    );
  };

  return (
    <div className="wrap">
      <div className="page-head">
        <h1>Today</h1>
        <div className="sub">{dateLine}</div>
      </div>

      <div className="split">
        <div className="stack">
          {urgent.length > 0 && (
            <Panel title="Needs attention today" flush
              right={<Chip tone="crit">{urgent.length}</Chip>}>
              <table className="rows"><tbody>{urgent.map((t) => <TaskRow key={t.id} t={t} />)}</tbody></table>
            </Panel>
          )}

          <Panel title="Everything else" flush
            right={<span className="small muted">{rest.length} open</span>}>
            {rest.length === 0
              ? <Empty>Nothing waiting.</Empty>
              : <table className="rows"><tbody>{rest.map((t) => <TaskRow key={t.id} t={t} />)}</tbody></table>}
          </Panel>
        </div>

        <div className="stack">
          <Panel title="Clinic today" flush>
            {schedule.length === 0 ? <Empty>No visits booked.</Empty> : (
              <table className="rows">
                <tbody>
                  {schedule.map((e) => {
                    const p = st.patient(e.patientId)!;
                    return (
                      <tr key={e.id} className="click"
                        onClick={() => nav.go({ name: 'encounter', encounterId: e.id })}>
                        <td style={{ width: 44 }}><Avatar patient={p} /></td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{p.preferredName ?? p.name}</div>
                          <div className="small muted">{e.reason}</div>
                          <div className="small muted" style={{ marginTop: 3 }}>
                            {e.duration} min &middot; {e.kind === 'intake' ? 'First visit' : e.kind === 'annual' ? 'Annual' : 'Follow-up'}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </Panel>

          <Panel title="Panel">
            <div className="stack-sm">
              <div className="row">
                <span className="muted">Members</span><span className="spacer" />
                <b className="num">{st.patients.length}</b>
              </div>
              <div className="row">
                <span className="muted">Sliding scale or pro bono</span><span className="spacer" />
                <b className="num">{st.patients.filter((p) => p.membership !== 'standard').length}</b>
              </div>
              <div className="row">
                <span className="muted">Results unacknowledged</span><span className="spacer" />
                <b className="num">{st.resultReports.filter((r) => !r.acknowledged).length}</b>
              </div>
              <div className="row">
                <span className="muted">Next visit booked</span><span className="spacer" />
                <b className="small">{fmtDate('2026-11-18')}</b>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
