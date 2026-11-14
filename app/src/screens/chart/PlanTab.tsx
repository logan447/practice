/**
 * The care plan.
 *
 * The centre of the practice, so it gets the most room. Each goal
 * carries a "why" in the patient's terms, because a plan the patient
 * cannot explain back is not a shared plan. Actions are owned by name:
 * some are the patient's, some are mine, and conflating them is how
 * things fall through.
 */
import { useStore } from '../../lib/store';
import { Chip, Panel, Trend, Empty, Prov } from '../../components/ui';
import { fmtDate } from '../../lib/format';
import type { GoalStatus } from '../../domain/types';

const STATUS: Record<GoalStatus, { label: string; tone?: string }> = {
  'on-track': { label: 'On track', tone: 'ok' },
  'needs-attention': { label: 'Needs attention', tone: 'warn' },
  'not-started': { label: 'Not started' },
  met: { label: 'Met', tone: 'ok' },
};

const DOMAIN: Record<string, string> = {
  nutrition: 'Nutrition', movement: 'Movement', sleep: 'Sleep', stress: 'Stress',
  substances: 'Substances', medical: 'Medical', connection: 'Connection',
};

export function PlanTab({ patientId }: { patientId: string }) {
  const st = useStore();
  const plan = st.planFor(patientId);

  if (!plan) {
    return (
      <Panel title="Care plan">
        <Empty>No plan yet. One is written at the first full visit.</Empty>
      </Panel>
    );
  }

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
            <button className="btn ghost sm">Revise</button>
          </div>
        }>
        <p>{plan.summary}</p>
        <div className="sep" />
        <Prov author={plan.provenance.author} by={plan.signedBy ?? plan.provenance.by} />
      </Panel>

      {plan.goals.map((g) => {
        const measure = g.measure ? st.series(g.measure.seriesId) : undefined;
        const last = measure?.points[measure.points.length - 1];
        return (
          <Panel key={g.id} title={g.title} eyebrow={DOMAIN[g.domain]}
            right={<Chip tone={STATUS[g.status].tone}>{STATUS[g.status].label}</Chip>}>
            <div className="split" style={{ gap: 20 }}>
              <div>
                <p className="muted" style={{ fontStyle: 'italic', marginBottom: 14 }}>{g.why}</p>
                <div className="eyebrow" style={{ marginBottom: 8 }}>Actions</div>
                <div className="stack-sm">
                  {g.actions.map((a) => (
                    <label key={a.id} className="row" style={{ cursor: 'pointer', alignItems: 'flex-start' }}>
                      <input type="checkbox" checked={a.done}
                        onChange={() => st.toggleAction(plan.id, g.id, a.id)}
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
                  <div className="eyebrow">{g.measure!.label}</div>
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
    </div>
  );
}
