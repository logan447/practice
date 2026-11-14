/**
 * The care plan.
 *
 * The centre of the practice, so it gets the most room. Each goal
 * carries a "why" in the patient's terms, because a plan the patient
 * cannot explain back is not a shared plan. Actions are owned by name:
 * some are the patient's, some are mine, and conflating them is how
 * things fall through.
 *
 * Signing is the act that makes a plan visible to the patient. Until
 * then it is the physician thinking out loud, and the portal shows the
 * patient nothing (see lib/portalScope.ts).
 */
import { useState } from 'react';
import { useStore } from '../../lib/store';
import { useNav } from '../../lib/nav';
import { Chip, Panel, Trend, Prov } from '../../components/ui';
import { InlineAdd, Field } from '../../components/InlineAdd';
import { fmtDate } from '../../lib/format';
import type { GoalStatus, CarePlanGoal } from '../../domain/types';

const STATUS: Record<GoalStatus, { label: string; tone?: string }> = {
  'on-track': { label: 'On track', tone: 'ok' },
  'needs-attention': { label: 'Needs attention', tone: 'warn' },
  'not-started': { label: 'Not started' },
  met: { label: 'Met', tone: 'ok' },
};

const DOMAINS: CarePlanGoal['domain'][] =
  ['nutrition', 'movement', 'sleep', 'stress', 'substances', 'medical', 'connection'];

const DOMAIN: Record<string, string> = {
  nutrition: 'Nutrition', movement: 'Movement', sleep: 'Sleep', stress: 'Stress',
  substances: 'Substances', medical: 'Medical', connection: 'Connection',
};

export function PlanTab({ patientId }: { patientId: string }) {
  const st = useStore();
  const nav = useNav();
  const plan = st.planFor(patientId);

  const [summary, setSummary] = useState('');
  const [adding, setAdding] = useState(false);
  const [g, setG] = useState({ title: '', why: '', domain: 'nutrition' as CarePlanGoal['domain'], actions: '' });

  // ---------------------------------------------------------- no plan yet
  if (!plan) {
    return (
      <Panel title="No care plan yet">
        <p className="muted" style={{ maxWidth: '58ch' }}>
          The plan is where this practice keeps what you are working on
          together. Write the one sentence that says what this
          relationship is for, then add goals to it.
        </p>
        <div style={{ marginTop: 16, maxWidth: 620 }}>
          <Field label="What are we working on, overall?" value={summary} onChange={setSummary} textarea
            placeholder="Reversing prediabetes without medicine, and getting to a place where coming off the blood pressure tablet is a reasonable thing to try." />
          <div className="row" style={{ marginTop: 12 }}>
            <button className="btn" disabled={!summary.trim()}
              onClick={() => st.createPlan(patientId, summary.trim())}>
              Start the plan
            </button>
            <span className="small muted">You can change every word of it later.</span>
          </div>
        </div>
      </Panel>
    );
  }

  // ------------------------------------------------------------ with plan
  return (
    <div className="stack">
      <Panel
        title="The plan"
        eyebrow={`Version ${plan.version} · updated ${fmtDate(plan.updated)}`}
        right={
          <div className="row">
            {plan.signed
              ? <Chip tone="ok">Signed &middot; visible to patient</Chip>
              : <Chip tone="warn">Draft &middot; not visible to patient</Chip>}
            {plan.signed
              ? (
                <button className="btn ghost sm"
                  onClick={() => nav.go({ name: 'portal', patientId, tab: 'plan' })}>
                  See their view
                </button>
              )
              : (
                <button className="btn sm" disabled={plan.goals.length === 0}
                  onClick={() => st.signPlan(plan.id)}>
                  Sign and share
                </button>
              )}
          </div>
        }>
        <p>{plan.summary}</p>
        <div className="sep" />
        <Prov author={plan.provenance.author} by={plan.signedBy ?? plan.provenance.by} />
        {!plan.signed && plan.goals.length === 0 && (
          <p className="small muted" style={{ marginTop: 10 }}>
            Add at least one goal before signing.
          </p>
        )}
      </Panel>

      {plan.goals.map((goal) => {
        const measure = goal.measure ? st.series(goal.measure.seriesId) : undefined;
        const last = measure?.points[measure.points.length - 1];
        return (
          <Panel key={goal.id} title={goal.title} eyebrow={DOMAIN[goal.domain]}
            right={<Chip tone={STATUS[goal.status].tone}>{STATUS[goal.status].label}</Chip>}>
            <div className="split" style={{ gap: 20 }}>
              <div>
                {goal.why && (
                  <p className="muted" style={{ fontStyle: 'italic', marginBottom: 14 }}>{goal.why}</p>
                )}
                <div className="eyebrow" style={{ marginBottom: 8 }}>Actions</div>
                <div className="stack-sm">
                  {goal.actions.length === 0 && <span className="small muted">None yet.</span>}
                  {goal.actions.map((a) => (
                    <label key={a.id} className="row" style={{ cursor: 'pointer', alignItems: 'flex-start' }}>
                      <input type="checkbox" checked={a.done}
                        onChange={() => st.toggleAction(plan.id, goal.id, a.id)}
                        style={{ marginTop: 3 }} />
                      <span style={{
                        flex: 1,
                        textDecoration: a.done ? 'line-through' : undefined,
                        opacity: a.done ? 0.55 : 1,
                      }}>
                        {a.text}
                      </span>
                      <Chip tone={a.owner === 'physician' ? 'accent' : undefined}>
                        {a.owner === 'physician' ? 'Me' : 'Patient'}
                      </Chip>
                    </label>
                  ))}
                </div>
              </div>

              {measure && last && (
                <div>
                  <div className="eyebrow">{goal.measure!.label}</div>
                  <div className="row" style={{ marginTop: 6, alignItems: 'baseline', gap: 6 }}>
                    <span className="num" style={{ font: '600 21px/1 var(--serif)' }}>{last.value}</span>
                    <span className="small muted">{measure.unit}</span>
                  </div>
                  <div style={{ marginTop: 6 }}><Trend series={measure} w={210} h={50} /></div>
                  {measure.target && (
                    <div className="small muted" style={{ marginTop: 4 }}>
                      Target {measure.target.direction} {measure.target.value} {measure.unit}
                    </div>
                  )}
                </div>
              )}
            </div>
          </Panel>
        );
      })}

      <Panel title="Add a goal">
        <InlineAdd
          label="Add a goal" open={adding} setOpen={setAdding}
          canSave={!!g.title.trim()}
          onSave={() => {
            st.addGoal(plan.id, {
              title: g.title.trim(),
              why: g.why.trim(),
              domain: g.domain,
              status: 'not-started',
              actions: g.actions.split('\n').map((x) => x.trim()).filter(Boolean),
            });
            setG({ title: '', why: '', domain: 'nutrition', actions: '' });
          }}>
          <Field label="The goal" value={g.title} onChange={(v) => setG((p) => ({ ...p, title: v }))}
            placeholder="Walk 30 minutes, 5 days a week" />
          <Field label="Why this one, in their words" value={g.why} textarea
            onChange={(v) => setG((p) => ({ ...p, why: v }))}
            placeholder="It is the one thing he has kept up for a year. Protect it." />
          <label style={{ display: 'block' }}>
            <div className="eyebrow" style={{ marginBottom: 4 }}>Area</div>
            <select className="search" value={g.domain}
              onChange={(e) => setG((p) => ({ ...p, domain: e.target.value as CarePlanGoal['domain'] }))}>
              {DOMAINS.map((d) => <option key={d} value={d}>{DOMAIN[d]}</option>)}
            </select>
          </label>
          <Field label="Actions, one per line" value={g.actions} textarea
            onChange={(v) => setG((p) => ({ ...p, actions: v }))}
            placeholder={'Log walks in the app\nBring the log to the next visit'} />
        </InlineAdd>
        {plan.signed && (
          <p className="small muted" style={{ marginTop: 10 }}>
            Adding to a signed plan changes what the patient sees. Sign again to publish the change.
          </p>
        )}
      </Panel>
    </div>
  );
}
