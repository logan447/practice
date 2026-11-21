/**
 * What is behind each section of the rail.
 *
 * The rail is an index. These are the records. Opening a section
 * should put every record this practice holds on that topic in front
 * of you, not a filtered highlight of it, because the reason you
 * opened it is that the summary was not enough.
 */
import { useStore } from '../../lib/store';
import { Chip, Panel, Empty } from '../../components/ui';
import { fmtDate, relative } from '../../lib/format';

export type ChartDrawer =
  | 'notes' | 'subjective' | 'vitals' | 'problems' | 'lifestyle' | 'prevention'
  | 'meds' | 'results' | 'studies' | 'specialists' | 'more'
  | 'visits' | 'plan' | 'orders' | 'followup' | 'records' | 'documentation'
  | 'export' | 'details' | 'encounters' | 'history' | 'letters' | 'scope';

/**
 * The strip, in the order a chart review happens.
 *
 * This is not a filing system. It is the order a physician reads a
 * chart in before walking into the room: the last note, then what the
 * patient has said since, then the numbers, then the problems, then
 * the two things this practice provides alongside them, then the
 * treatment, then the results, then everybody else involved, then the
 * histories that were asked once and rarely change.
 *
 * Reading it top to bottom is the chart review, which is why the
 * pre-visit walkthrough is this list and nothing else.
 */
export const CHART_TABS: ChartDrawer[] = [
  'notes', 'subjective', 'vitals', 'problems', 'lifestyle', 'prevention',
  'meds', 'results', 'studies', 'specialists', 'more',
];

/**
 * Everything else, off the chart entirely.
 *
 * These are real and rarely wanted, and they were behind a "More"
 * control on the strip, which is still a tab: it sat there being read
 * and counted. They have moved to the account menu, under the chart's
 * own heading, where the rest of the things you go looking for live.
 */
export const CHART_TOOLS: ChartDrawer[] = [
  'encounters', 'plan', 'orders', 'followup', 'letters', 'records', 'scope',
  'history', 'export', 'details', 'documentation',
];

/**
 * One short label per tab, and nothing else.
 *
 * There used to be a heading and a line of explanation over every
 * tab's content as well. Both are gone: the tab you are standing on
 * is the heading, and a sentence telling a physician what a list of
 * medicines is for is a sentence they read once and then read past
 * forever.
 */
export const TAB_LABEL: Record<ChartDrawer, string> = {
  notes: 'Notes',
  subjective: 'Subjective',
  vitals: 'Vitals',
  problems: 'Problems',
  lifestyle: 'Lifestyle',
  prevention: 'Prevention',
  meds: 'Meds',
  results: 'Labs',
  studies: 'Imaging',
  specialists: 'Specialists',
  more: 'More',
  encounters: 'Everything on file',
  visits: 'Visits',
  plan: 'Shared plan',
  orders: 'Orders',
  followup: 'Follow-up',
  letters: 'Letters',
  records: 'Records',
  scope: 'Scope',
  history: 'History',
  export: 'Export',
  details: 'Details',
  documentation: 'Coding',
};

/* ----------------------------------------------------------- follow-up */

export function FollowUpDrawer({ patientId }: { patientId: string }) {
  const st = useStore();
  const master = st.masterPlanFor(patientId);
  const prevention = st.preventionFor(patientId);
  const tasks = st.tasksFor(patientId);
  const orders = st.ordersForPatient(patientId).filter((o) => o.status === 'placed');
  const specialists = st.specialistsFor(patientId)
    .filter((s) => s.outstanding && s.outstanding !== 'None.');

  return (
    <div className="stack">
      <Panel title="Interval">
        {master?.plan.followUp
          ? <p>{master.plan.followUp}</p>
          : <Empty>No follow-up interval written in the plan.</Empty>}
      </Panel>

      <Panel title="Before the next visit" flush>
        {prevention.filter((p) => p.status !== 'current' && p.status !== 'not-applicable').length === 0
          && tasks.length === 0 && orders.length === 0 && specialists.length === 0
          ? <Empty>Nothing outstanding.</Empty>
          : (
            <div className="doclist">
              {prevention.filter((p) => p.status === 'overdue' || p.status === 'due').map((x) => (
                <div key={x.id} className="listrow" style={{ padding: '10px 16px' }}>
                  <Chip tone={x.status === 'overdue' ? 'crit' : 'warn'}>{x.status}</Chip>
                  <span style={{ flex: 1 }}>{x.name}</span>
                  <span className="small muted">{x.dueBy ? fmtDate(x.dueBy) : ''}</span>
                </div>
              ))}
              {orders.map((o) => (
                <div key={o.id} className="listrow" style={{ padding: '10px 16px' }}>
                  <Chip>awaiting</Chip>
                  <span style={{ flex: 1 }}>{o.text}</span>
                  <span className="small muted">sent {fmtDate(o.created)}</span>
                </div>
              ))}
              {specialists.map((s) => (
                <div key={s.id} className="listrow" style={{ padding: '10px 16px' }}>
                  <Chip tone="warn">{s.specialty}</Chip>
                  <span style={{ flex: 1 }}>{s.outstanding}</span>
                </div>
              ))}
              {tasks.map((t) => (
                <div key={t.id} className="listrow" style={{ padding: '10px 16px' }}>
                  <Chip tone={t.urgent ? 'crit' : undefined}>task</Chip>
                  <span style={{ flex: 1 }}>{t.text}</span>
                  <span className="small muted">{relative(t.due)}</span>
                </div>
              ))}
            </div>
          )}
      </Panel>
    </div>
  );
}

/* ------------------------------------------------------------- orders */

export function OrdersDrawer({ patientId }: { patientId: string }) {
  const st = useStore();
  const all = st.ordersForPatient(patientId);
  const open = all.filter((o) => o.status !== 'done');
  const done = all.filter((o) => o.status === 'done');

  return (
    <div className="stack">
      <Panel title="Outstanding" flush right={<span className="small muted">{open.length}</span>}>
        {open.length === 0 ? <Empty>Nothing outstanding.</Empty> : open.map((o) => (
          <div key={o.id} className="listrow" style={{ padding: '12px 16px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <strong>{o.text}</strong>
              <div className="small muted" style={{ marginTop: 2 }}>
                {o.kind} &middot; {o.status === 'draft' ? 'drafted' : 'placed'} {fmtDate(o.created)}
              </div>
            </div>
            {o.status === 'draft' && <Chip tone="warn">Not sent</Chip>}
            <div className="row" style={{ gap: 6 }}>
              {o.status === 'draft' && (
                <button className="btn sm" onClick={() => st.placeOrder(o.id)}>Send</button>
              )}
              <button className="btn ghost sm" onClick={() => st.completeOrder(o.id)}>Close</button>
            </div>
          </div>
        ))}
      </Panel>

      {done.length > 0 && (
        <Panel title="Closed" flush>
          {done.map((o) => (
            <div key={o.id} className="listrow" style={{ padding: '10px 16px' }}>
              <span style={{ flex: 1 }} className="small">{o.text}</span>
              <span className="small muted">{o.closed ? fmtDate(o.closed) : ''}</span>
            </div>
          ))}
        </Panel>
      )}
    </div>
  );
}
