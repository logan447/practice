/**
 * The right column.
 *
 * The same seven sections on every chart, in the same order, whether
 * or not there is anything in them. A panel whose shape changes per
 * patient has to be re-read each time; one that does not can be
 * glanced at. Empty sections say they are empty rather than
 * disappearing, because "no specialists" and "I forgot to look" are
 * different facts.
 *
 * Current Plan sits second, directly under the next visit, because
 * the plan is what the chart is usually opened for and the full SOAP
 * document is a long way down the page.
 *
 * Every section opens a drawer holding all the records behind it.
 * The rail is the index; the drawer is the record.
 */
import { useStore } from '../../lib/store';
import { useNav } from '../../lib/nav';
import { Chip } from '../../components/ui';
import { fmtDate, relative } from '../../lib/format';
import { kindLabel } from '../../lib/clinical';
import { hhmm } from '../../domain/schedule';
import { ORDER_KINDS } from '../../domain/types';
import type { ChartDrawer } from './drawers';

const ORDER_LABEL = Object.fromEntries(ORDER_KINDS.map((k) => [k.id, k.label]));

function Block({ title, count, onOpen, children }: {
  title: string;
  count?: number;
  onOpen: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="railblock">
      <button className="railhead" onClick={onOpen}>
        <h3>{title}</h3>
        {count !== undefined && count > 0 && <span className="rcount">{count}</span>}
        <span className="ropen">Open</span>
      </button>
      {children}
    </section>
  );
}

const Empty = ({ children }: { children: React.ReactNode }) =>
  <p className="railempty">{children}</p>;

export function Rail({ patientId, open, onJump }: {
  patientId: string;
  open: (d: ChartDrawer) => void;
  /** Scroll the main document to a problem in the plan. */
  onJump: (conditionId: string) => void;
}) {
  const st = useStore();
  const nav = useNav();

  const encounters = st.encountersFor(patientId);
  const ahead = encounters.filter((e) => e.status !== 'signed')
    .sort((a, b) => a.date.localeCompare(b.date));
  const next = ahead[0];
  const master = st.masterPlanFor(patientId);
  const conditions = st.conditionsFor(patientId);
  const managed = conditions.filter((c) => c.managed && c.status === 'active');
  const meds = st.medsFor(patientId).filter((m) => m.status !== 'stopped');
  const recentMedChange = st.medsFor(patientId)
    .filter((m) => m.changeNote)
    .sort((a, b) => (b.stopped ?? b.started).localeCompare(a.stopped ?? a.started))[0];
  const panels = st.panelsFor(patientId);
  const vitals = st.vitalsFor(patientId);
  const specialists = st.specialistsFor(patientId);
  const orders = st.ordersForPatient(patientId).filter((o) => o.status !== 'done');
  const prevention = st.preventionFor(patientId)
    .filter((p) => p.status === 'due' || p.status === 'overdue');
  const tasks = st.tasksFor(patientId);

  const lastOffice = vitals.find((v) => v.source === 'office');
  const lastPanel = panels[0];

  return (
    <aside className="rail">
      {/* -------------------------------------------------- next visit */}
      <Block title="Next visit" onOpen={() => open('visits')}>
        {next ? (
          <button className="nextvisit" onClick={() => nav.go({ name: 'encounter', encounterId: next.id })}>
            <div className="nvdate">
              {fmtDate(next.date)}{next.start !== undefined && ` at ${hhmm(next.start)}`}
            </div>
            <div className="nvkind">{kindLabel(next.kind)}</div>
            <div className="nvwhen">{relative(next.date)} &middot; {next.duration} min</div>
          </button>
        ) : (
          <button className="nextvisit empty" onClick={() => open('visits')}>
            Nothing booked. Book one.
          </button>
        )}
      </Block>

      {/* ------------------------------------------------ current plan */}
      <Block title="Current plan" count={managed.length} onOpen={() => open('plan')}>
        {managed.length === 0 ? (
          <Empty>No problems are being managed here.</Empty>
        ) : (
          <div className="planlist">
            {managed.map((c) => {
              const text = master?.plan?.byProblem?.[c.id] ?? '';
              const firstLine = text.split('\n').find((l) => l.trim()) ?? '';
              return (
                <button key={c.id} className="planrow" onClick={() => onJump(c.id)}>
                  <span className="pname">{c.name}</span>
                  <span className="pline">
                    {firstLine ? firstLine.replace(/^\d{1,2} \w{3} \d{4}: /, '') : 'No plan written.'}
                  </span>
                </button>
              );
            })}
            {master?.plan.followUp && (
              <div className="planfu">{master.plan.followUp}</div>
            )}
          </div>
        )}
      </Block>

      {/* --------------------------------------------------- medicines */}
      <Block title="Medicines" count={meds.length} onOpen={() => open('meds')}>
        {meds.length === 0 ? <Empty>None recorded.</Empty> : (
          <div className="railrows">
            {meds.slice(0, 6).map((m) => (
              <div key={m.id} className="medrow">
                <span className="mname">{m.name} {m.dose}</span>
                {m.indication && <span className="mfor">{m.indication}</span>}
              </div>
            ))}
            {meds.length > 6 && <div className="railmore2">+{meds.length - 6} more</div>}
            {recentMedChange?.changeNote && (
              <div className="medchange">{recentMedChange.changeNote}</div>
            )}
          </div>
        )}
      </Block>

      {/* ---------------------------------------------- labs and vitals */}
      <Block title="Labs and vitals" count={panels.length} onOpen={() => open('results')}>
        {!lastOffice && !lastPanel ? <Empty>Nothing on file.</Empty> : (
          <div className="railrows">
            {lastOffice && (
              <div className="medrow">
                <span className="mname">
                  BP {lastOffice.systolic}/{lastOffice.diastolic}
                  {lastOffice.weightLb ? `, ${lastOffice.weightLb} lb` : ''}
                </span>
                <span className="mfor">{fmtDate(lastOffice.date)}</span>
              </div>
            )}
            {lastPanel && (
              <div className="medrow">
                <span className="mname">{lastPanel.name}</span>
                <span className="mfor">{fmtDate(lastPanel.date)}</span>
              </div>
            )}
            <div className="railmore2">Trends and every result in the drawer</div>
          </div>
        )}
      </Block>

      {/* -------------------------------------------------- specialists */}
      <Block title="Specialists" count={specialists.length} onOpen={() => open('specialists')}>
        {specialists.length === 0 ? <Empty>None involved.</Empty> : (
          <div className="railrows">
            {specialists.map((sp) => (
              <div key={sp.id} className="medrow">
                <span className="mname">{sp.specialty}</span>
                <span className="mfor">
                  {sp.name.replace(/^Dr\.?\s*/, '')}
                  {sp.lastSeen ? ` · ${fmtDate(sp.lastSeen)}` : ''}
                </span>
                {sp.outstanding && sp.outstanding !== 'None.' && (
                  <Chip tone="warn">Outstanding</Chip>
                )}
              </div>
            ))}
          </div>
        )}
      </Block>

      {/* ------------------------------------------------ pending orders */}
      <Block title="Pending orders" count={orders.length} onOpen={() => open('orders')}>
        {orders.length === 0 ? <Empty>Nothing outstanding.</Empty> : (
          <div className="railrows">
            {orders.slice(0, 5).map((o) => (
              <div key={o.id} className={`medrow${o.status === 'draft' ? ' draft' : ''}`}>
                <span className="mname">{o.text}</span>
                <span className="mfor">
                  {ORDER_LABEL[o.kind] ?? o.kind}
                  {o.status === 'draft' ? ' · not sent' : ''}
                </span>
              </div>
            ))}
            {orders.length > 5 && <div className="railmore2">+{orders.length - 5} more</div>}
          </div>
        )}
      </Block>

      {/* ----------------------------------------------------- follow-up */}
      <Block title="Follow-up" count={prevention.length + tasks.length} onOpen={() => open('followup')}>
        {prevention.length === 0 && tasks.length === 0 && !master?.plan.followUp ? (
          <Empty>Nothing outstanding.</Empty>
        ) : (
          <div className="railrows">
            {master?.plan.followUp && <div className="fuline">{master.plan.followUp}</div>}
            {prevention.map((x) => (
              <div key={x.id} className="medrow">
                <span className="mname">{x.name}</span>
                <span className="mfor">
                  {x.status}{x.dueBy ? ` · ${fmtDate(x.dueBy)}` : ''}
                </span>
              </div>
            ))}
            {tasks.map((t) => (
              <div key={t.id} className="medrow">
                <span className="mname">{t.text}</span>
                <span className="mfor">due {fmtDate(t.due)}</span>
              </div>
            ))}
          </div>
        )}
      </Block>
    </aside>
  );
}
