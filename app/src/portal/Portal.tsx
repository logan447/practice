/**
 * The patient portal.
 *
 * Same record, different reader. Two things make this more than a
 * read-only chart:
 *
 *   1. It reads through lib/portalScope.ts and nothing else, so an
 *      unreleased result or a half-written note cannot reach the
 *      person it is about.
 *   2. It is written for them. Plain language, their own goals first,
 *      and no clinical shorthand anywhere.
 *
 * Reached from the chart as "See their view", which is a real thing a
 * physician needs: knowing exactly what the patient is looking at.
 */
import { useState } from 'react';
import { useStore } from '../lib/store';
import { useNav, type PortalTab } from '../lib/nav';
import { Avatar, Chip, Panel, Trend, Empty } from '../components/ui';
import { AiMark } from '../components/AiPanel';
import { Track } from './Track';
import { fmtDate, relative } from '../lib/format';
import {
  visiblePlan, visibleReports, visibleSeries, visibleEncounters,
  upcomingEncounters, visibleMeds, visiblePrevention, visibleEntries,
  ASSISTANT_SCOPE,
} from '../lib/portalScope';

const TABS: { id: PortalTab; label: string }[] = [
  { id: 'home', label: 'Your health' },
  { id: 'plan', label: 'Your plan' },
  { id: 'track', label: 'Track' },
  { id: 'results', label: 'Results' },
  { id: 'meds', label: 'Medicines' },
  { id: 'visits', label: 'Visits' },
  { id: 'ask', label: 'Ask' },
];

export function Portal({ patientId, initialTab }: { patientId: string; initialTab?: PortalTab }) {
  const st = useStore();
  const nav = useNav();
  const [tab, setTab] = useState<PortalTab>(initialTab ?? 'home');

  const p = st.patient(patientId);
  if (!p) return <div className="wrap"><p>Not found.</p></div>;

  // Everything below reads through the scope rules. Nothing bypasses them.
  const plan = visiblePlan(st.planFor(patientId));
  const reports = visibleReports(st.reportsFor(patientId));
  const series = visibleSeries(st.seriesFor(patientId), st.reportsFor(patientId));
  const past = visibleEncounters(st.encountersFor(patientId));
  const upcoming = upcomingEncounters(st.encountersFor(patientId));
  const meds = visibleMeds(st.medsFor(patientId));
  const prevention = visiblePrevention(st.preventionFor(patientId));
  const entries = visibleEntries(st.entriesFor(patientId));

  const myActions = plan?.goals.flatMap((g) =>
    g.actions.filter((a) => a.owner === 'patient' && !a.done).map((a) => ({ goal: g.title, ...a }))) ?? [];

  return (
    <div className="wrap" style={{ maxWidth: 940 }}>
      <div className="row" style={{ marginBottom: 14 }}>
        <Chip tone="info">Patient view</Chip>
        <span className="small muted">
          Exactly what {p.preferredName ?? p.name} sees. Anything you record under
          Track is saved as theirs.
        </span>
        <span className="spacer" />
        <button className="btn ghost sm" onClick={() => nav.go({ name: 'chart', patientId })}>
          Back to the chart
        </button>
      </div>

      <div className="phead" style={{ marginBottom: 4 }}>
        <Avatar patient={p} lg />
        <div>
          <h1>Hello, {p.preferredName ?? p.name.split(' ')[0]}</h1>
          <div className="meta">
            Your doctor is L. DuBose, MD &middot; member since {fmtDate(p.memberSince)}
          </div>
        </div>
      </div>

      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id}
            className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ------------------------------------------------------- home */}
      {tab === 'home' && (
        <div className="split">
          <div className="stack">
            <Panel title="What we are working on">
              {!plan ? (
                <Empty>
                  Your plan is being written. It will appear here once
                  Dr. DuBose has finished it.
                </Empty>
              ) : (
                <>
                  <p>{plan.summary}</p>
                  <div className="sep" />
                  <div className="stack-sm">
                    {plan.goals.map((g) => (
                      <div key={g.id} className="row" style={{ alignItems: 'flex-start' }}>
                        <Chip tone={g.status === 'needs-attention' ? 'warn' : 'ok'}>
                          <span className="dot" />
                        </Chip>
                        <span style={{ flex: 1 }}>{g.title}</span>
                      </div>
                    ))}
                  </div>
                  <p className="small muted" style={{ marginTop: 14 }}>
                    Last updated {fmtDate(plan.updated)} by {plan.signedBy}.
                  </p>
                </>
              )}
            </Panel>

            <Panel title="Things for you to do" right={
              <span className="small muted">{myActions.length}</span>
            }>
              {myActions.length === 0
                ? <Empty>Nothing outstanding. </Empty>
                : (
                  <div className="stack-sm">
                    {myActions.map((a) => (
                      <div key={a.id}>
                        <div style={{ fontWeight: 600 }}>{a.text}</div>
                        <div className="small muted">For: {a.goal}</div>
                      </div>
                    ))}
                  </div>
                )}
            </Panel>

            {series.length > 0 && (
              <Panel title="How you are doing">
                <div className="grid g2">
                  {series.slice(0, 4).map((sr) => {
                    const last = sr.points[sr.points.length - 1];
                    return (
                      <div key={sr.id}>
                        <div className="eyebrow">{sr.name}</div>
                        <div className="row" style={{ marginTop: 5, alignItems: 'baseline', gap: 6 }}>
                          <span className="num" style={{ font: '600 21px/1 var(--serif)' }}>{last.value}</span>
                          <span className="small muted">{sr.unit}</span>
                        </div>
                        <Trend series={sr} />
                        <div className="small muted">{fmtDate(last.date)}</div>
                      </div>
                    );
                  })}
                </div>
              </Panel>
            )}
          </div>

          <div className="stack">
            <Panel title="Your next visit">
              {upcoming.length === 0
                ? <Empty>Nothing booked.</Empty>
                : upcoming.map((e) => (
                  <div key={e.id}>
                    <div style={{ fontWeight: 600 }}>{relative(e.date)}</div>
                    <div className="small muted">{fmtDate(e.date)} &middot; {e.duration} minutes</div>
                    <p className="small" style={{ marginTop: 8 }}>{e.reason}</p>
                  </div>
                ))}
            </Panel>

            <Panel title="Coming up" right={<span className="small muted">Prevention</span>}>
              {prevention.length === 0 ? <Empty>Nothing yet.</Empty> : (
                <div className="stack-sm">
                  {prevention.map((i) => (
                    <div key={i.id} className="row">
                      <span style={{ flex: 1 }}>{i.name}</span>
                      <Chip tone={i.status === 'overdue' ? 'crit' : i.status === 'due' ? 'warn' : 'ok'}>
                        {i.status === 'overdue' ? 'Overdue' : i.status === 'due' ? 'Due' : 'Done'}
                      </Chip>
                    </div>
                  ))}
                </div>
              )}
            </Panel>

            <Panel title="What you have told us">
              {entries.length === 0 ? <Empty>Nothing yet.</Empty> : (
                <div className="stack">
                  {entries.slice(0, 3).map((e) => (
                    <div key={e.id}>
                      <div className="row">
                        <span className="eyebrow">{e.label}</span>
                        <span className="spacer" />
                        <span className="small muted">{relative(e.date)}</span>
                      </div>
                      <p className="small" style={{ marginTop: 3 }}>{e.body}</p>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------- plan */}
      {tab === 'plan' && (
        <div className="stack">
          {!plan ? (
            <Panel title="Your plan">
              <Empty>
                Your plan is being written. It will appear here once
                Dr. DuBose has finished and signed it.
              </Empty>
            </Panel>
          ) : (
            <>
              <Panel title="What we are working on, overall">
                <p>{plan.summary}</p>
              </Panel>
              {plan.goals.map((g) => (
                <Panel key={g.id} title={g.title} right={
                  <Chip tone={g.status === 'needs-attention' ? 'warn' : 'ok'}>
                    {g.status === 'needs-attention' ? 'Needs attention'
                      : g.status === 'met' ? 'Met' : g.status === 'not-started' ? 'Not started yet' : 'On track'}
                  </Chip>
                }>
                  {g.why && <p className="muted" style={{ fontStyle: 'italic', marginBottom: 14 }}>{g.why}</p>}
                  {g.actions.length > 0 && (
                    <>
                      <div className="eyebrow" style={{ marginBottom: 7 }}>Steps</div>
                      <div className="stack-sm">
                        {g.actions.map((a) => (
                          <div key={a.id} className="row" style={{ alignItems: 'flex-start' }}>
                            <span style={{
                              flex: 1,
                              textDecoration: a.done ? 'line-through' : undefined,
                              opacity: a.done ? 0.55 : 1,
                            }}>{a.text}</span>
                            <Chip tone={a.owner === 'physician' ? 'accent' : undefined}>
                              {a.owner === 'physician' ? 'Dr. DuBose' : 'You'}
                            </Chip>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </Panel>
              ))}
            </>
          )}
        </div>
      )}

      {/* ---------------------------------------------------- results */}
      {tab === 'results' && (
        <div className="stack">
          <Panel title="Your results">
            <p className="small muted">
              Results appear here once Dr. DuBose has reviewed them, so that
              nothing reaches you before he has looked at it.
            </p>
          </Panel>
          {reports.length === 0 ? (
            <Panel title="Nothing yet"><Empty>No results have been released to you.</Empty></Panel>
          ) : reports.map((r) => (
            <Panel key={r.id} title={r.panel} eyebrow={fmtDate(r.resulted)} flush right={
              <Chip tone="ok">Reviewed {r.acknowledgedAt && fmtDate(r.acknowledgedAt)}</Chip>
            }>
              <table className="rows">
                <tbody>
                  {r.seriesIds.map((sid) => {
                    const sr = st.series(sid);
                    if (!sr) return null;
                    const pt = sr.points.find((x) => x.date === r.resulted) ?? sr.points[sr.points.length - 1];
                    return (
                      <tr key={sid}>
                        <td style={{ fontWeight: 600 }}>{sr.name}</td>
                        <td style={{ width: 130 }} className="num">{pt.value} <span className="small muted">{sr.unit}</span></td>
                        <td style={{ width: 150 }}>
                          <Chip tone={pt.flag === 'normal' ? 'ok' : 'warn'}>
                            {pt.flag === 'normal' ? 'In range' : 'Outside the usual range'}
                          </Chip>
                        </td>
                        <td style={{ width: 210 }}><Trend series={sr} w={190} h={34} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Panel>
          ))}
        </div>
      )}

      {/* ------------------------------------------------------- meds */}
      {tab === 'meds' && (
        <Panel title="Your medicines" flush>
          {meds.length === 0 ? <Empty>None recorded.</Empty> : (
            <table className="rows">
              <tbody>
                {meds.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{m.name} {m.dose}</div>
                      <div className="small muted">{m.sig}</div>
                      {m.changeNote && (
                        <div className="small" style={{ marginTop: 5 }}>{m.changeNote}</div>
                      )}
                    </td>
                    <td style={{ width: 170 }} className="small muted">{m.indication ?? ''}</td>
                    <td style={{ width: 130 }}>
                      {m.status === 'active' ? <Chip tone="ok">Taking</Chip>
                        : m.status === 'held' ? <Chip tone="warn">Paused</Chip>
                          : <Chip>Stopped</Chip>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      )}

      {/* ----------------------------------------------------- visits */}
      {tab === 'visits' && (
        <div className="stack">
          {upcoming.map((e) => (
            <Panel key={e.id} title="Coming up" eyebrow={fmtDate(e.date)}>
              <p>{e.reason}</p>
              <p className="small muted" style={{ marginTop: 6 }}>{e.duration} minutes</p>
            </Panel>
          ))}
          {past.length === 0 && upcoming.length === 0 && (
            <Panel title="Visits"><Empty>No visits yet.</Empty></Panel>
          )}
          {past.map((e) => (
            <Panel key={e.id} title="Visit summary" eyebrow={fmtDate(e.date)}>
              {e.note && (
                <div className="stack">
                  <div>
                    <div className="eyebrow" style={{ marginBottom: 4 }}>What we talked about</div>
                    <p>{e.note.subjective}</p>
                  </div>
                  <div>
                    <div className="eyebrow" style={{ marginBottom: 4 }}>What we agreed</div>
                    <p>{e.note.plan}</p>
                  </div>
                </div>
              )}
            </Panel>
          ))}
        </div>
      )}

      {/* -------------------------------------------------------- ask */}
      {tab === 'track' && <Track patientId={patientId} />}

      {tab === 'ask' && <Ask name={p.preferredName ?? p.name.split(' ')[0]} hasPlan={!!plan} />}
    </div>
  );
}

/**
 * The patient-facing assistant.
 *
 * Its limits are the first thing on the screen rather than a footnote,
 * because a patient who does not know what it can see cannot judge an
 * answer. It reads inside portalScope and it never writes.
 */
function Ask({ name, hasPlan }: { name: string; hasPlan: boolean }) {
  const [asked, setAsked] = useState<string | null>(null);

  const examples = [
    'What does my A1c result mean?',
    'Why am I taking atorvastatin?',
    'What should I bring to my next visit?',
  ];

  return (
    <div className="split">
      <div className="stack">
        <section className="ai-panel">
          <header>
            <AiMark label="An assistant, not your doctor" />
            <h3>Ask about your health</h3>
          </header>
          <div className="body">
            {!asked ? (
              <p className="muted">
                Hello {name}. I can help you understand what is in your record
                and what your plan asks of you. I am not your doctor, and
                anything medical goes to Dr. DuBose.
              </p>
            ) : (
              <>
                <p style={{ fontWeight: 600 }}>{asked}</p>
                <p style={{ marginTop: 10 }}>
                  {hasPlan
                    ? 'In a working version this is where the answer appears, built only from the parts of your record listed below, with a link to each one it used.'
                    : 'Your plan has not been shared with you yet, so there is very little I can see. Once Dr. DuBose signs it, I will be able to help with it.'}
                </p>
              </>
            )}
          </div>
          <div className="acts" style={{ flexWrap: 'wrap' }}>
            {examples.map((q) => (
              <button key={q} className="btn ghost sm" onClick={() => setAsked(q)}>{q}</button>
            ))}
          </div>
        </section>

        <Panel title="If something is wrong">
          <p>
            This assistant cannot help in an emergency. Chest pain, stroke
            signs, severe trouble breathing, or thoughts of self-harm: call
            911 or go to the nearest ER.
          </p>
          <p style={{ marginTop: 10 }}>
            For anything urgent today, use urgent care and tell Dr. DuBose
            afterwards. For everything else, send him a message.
          </p>
        </Panel>
      </div>

      <div className="stack">
        <Panel title="What it can see">
          <ul className="stack-sm" style={{ margin: 0, paddingLeft: 18 }}>
            {ASSISTANT_SCOPE.can.map((x) => <li key={x}>{x}</li>)}
          </ul>
        </Panel>
        <Panel title="What it cannot see">
          <ul className="stack-sm" style={{ margin: 0, paddingLeft: 18 }}>
            {ASSISTANT_SCOPE.cannot.map((x) => <li key={x} className="muted">{x}</li>)}
          </ul>
        </Panel>
        <Panel title="What it will never do">
          <ul className="stack-sm" style={{ margin: 0, paddingLeft: 18 }}>
            {ASSISTANT_SCOPE.never.map((x) => <li key={x} className="muted">{x}</li>)}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
