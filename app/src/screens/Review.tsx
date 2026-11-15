/**
 * One encounter workflow: open, read what is new, write, sign.
 *
 * The same four steps for a clinical visit, a care management review
 * and a behavioural health review, because the second and third only
 * get done if they cost what the first costs. What changes between
 * them is the documentation and the time, not the shape of the work.
 *
 * Three things on the screen and no more.
 *
 * The working copy, which is the approved summary with the draft
 * changes in it. Editing here is editing the next version. There is
 * no second document to keep in step, and the signed note is
 * generated from what changed rather than typed again.
 *
 * What has arrived since the last approval, in one tray, so the
 * physician can see what they are being asked to incorporate. It is
 * never merged automatically and the draft never pre-accepts it.
 *
 * What we need from the patient, written while it is in mind and
 * sent when the encounter is signed.
 *
 * Signing does everything else: freezes the version, preserves the
 * note, sends the requests, records the time.
 */
import { useMemo, useState } from 'react';
import { useStore } from '../lib/store';
import { useNav } from '../lib/nav';
import { Chip, Panel } from '../components/ui';
import { fmtDate, relative } from '../lib/format';
import { kindLabel } from '../lib/clinical';
import { livingSubjective } from '../lib/subjective';
import type { LivingSubjective, ProblemSummary } from '../lib/subjective';
import { GOAL_LABEL, INTERVAL_LABEL } from '../domain/types';
import type { CareGoalStatus, InfoRequest } from '../domain/types';

const ASK_SUGGESTIONS = [
  'Send your home blood pressure readings from the last two weeks.',
  'Tell us whether you have started the new medicine, and how you are finding it.',
  'Let us know how the walking has gone since we last spoke.',
  'Confirm whether the referral appointment has happened.',
  'Tell us about any new symptoms since we last spoke.',
];

export function Review({ encounterId }: { encounterId: string }) {
  const st = useStore();
  const nav = useNav();
  const enc = st.encounter(encounterId);
  const patientId = enc?.patientId ?? '';
  const p = st.patient(patientId);
  const approved = st.currentVersion(patientId);
  const approvedIds = new Set(approved?.incorporated ?? []);
  const fresh = st.newSince(patientId);
  const open = st.infoRequestsFor(patientId, 'open');
  const answered = st.infoRequestsFor(patientId, 'answered')
    .filter((r) => !(approvedIds.has(r.answeredBy ?? '')));

  // The draft: everything on file, read now. It is not written
  // anywhere until this encounter is signed.
  const draft = useMemo<LivingSubjective>(() => livingSubjective({
    patientId, now: st.now,
    conditions: st.conditionsFor(patientId),
    medications: st.medsFor(patientId),
    encounters: st.encountersFor(patientId),
    updates: st.updatesFor(patientId),
    messages: st.messagesFor(patientId),
    checkIns: st.checkInsFor(patientId),
    specialists: st.specialistsFor(patientId),
    panels: st.panelsFor(patientId),
    vitals: st.vitalsFor(patientId),
    studies: st.studiesFor(patientId),
    prevention: st.preventionFor(patientId),
    lifestyle: st.lifestyleFor(patientId),
    orders: st.ordersForPatient(patientId),
  }), [st, patientId]);

  const prior = approved?.subjective as LivingSubjective | undefined;
  const master = st.masterPlanFor(patientId);

  const [goals, setGoals] = useState<Record<string, CareGoalStatus>>(
    () => approved?.goals ?? {},
  );
  const [plan, setPlan] = useState(() => ({
    byProblem: { ...(approved?.plan.byProblem ?? master?.plan?.byProblem ?? {}) },
    prevention: approved?.plan.prevention ?? master?.plan?.prevention ?? '',
    lifestyle: approved?.plan.lifestyle ?? master?.plan?.lifestyle ?? '',
    followUp: approved?.plan.followUp ?? master?.plan?.followUp ?? '',
  }));
  const [minutes, setMinutes] = useState(enc?.duration ?? 20);
  const [asking, setAsking] = useState('');

  if (!enc || !p) return null;

  const isReview = enc.kind === 'ccm' || enc.kind === 'bhi';
  const changed = (pr: ProblemSummary) => {
    const was = prior?.problems.find((x) => x.conditionId === pr.conditionId);
    if (!was) return true;
    return was.clauses.map((c) => c.text).join(' ') !== pr.clauses.map((c) => c.text).join(' ')
      || (goals[pr.conditionId] ?? pr.goal) !== was.goal;
  };
  const anyChange = draft.problems.some(changed) || fresh.count > 0;

  const sign = () => {
    st.approveEncounter(encounterId, {
      subjective: { ...draft, problems: draft.problems.map((pr) => ({
        ...pr, goal: goals[pr.conditionId] ?? pr.goal,
      })) },
      goals: Object.fromEntries(draft.problems.map(
        (pr) => [pr.conditionId, goals[pr.conditionId] ?? pr.goal ?? 'needs-improvement'],
      )),
      plan,
      minutes: isReview ? minutes : undefined,
      noChange: !anyChange,
    });
    nav.go({ name: 'chart', patientId });
  };

  return (
    <div className="wrap">
      <div className="page-head row" style={{ alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <h1>{kindLabel(enc.kind)}</h1>
          <div className="sub">
            {p.name} &middot; {fmtDate(enc.date)} &middot; opened on version{' '}
            {approved ? approved.version : '—'}
            {approved && `, approved ${relative(approved.approvedAt)}`}
          </div>
        </div>
        <button className="btn ghost" onClick={() => nav.go({ name: 'chart', patientId })}>
          Leave without signing
        </button>
      </div>

      <div className="reviewgrid">
        {/* --------------------------------------------- the working copy */}
        <div className="stack">
          <Panel title="Working copy" right={
            <span className="small muted">
              {anyChange ? 'Changes from the approved chart are marked' : 'Nothing has changed'}
            </span>
          }>
            <p className="psum">{draft.overall.map((c) => c.text).join(' ')}</p>

            {draft.problems.map((pr) => (
              <div key={pr.conditionId} className={`wprob${changed(pr) ? ' moved' : ''}`}>
                <div className="sphead">
                  <strong>{pr.name}</strong>
                  {changed(pr) && <Chip tone="accent">Changed</Chip>}
                  <span className="spacer" />
                  {(['at-goal', 'needs-improvement'] as CareGoalStatus[]).map((g) => (
                    <button key={g}
                      className={`btn sm ${(goals[pr.conditionId] ?? pr.goal) === g ? '' : 'ghost'}`}
                      onClick={() => setGoals((v) => ({ ...v, [pr.conditionId]: g }))}>
                      {GOAL_LABEL[g]}
                    </button>
                  ))}
                </div>
                <p className="psum">{pr.clauses.filter((c) => c.voice === 'patient').map((c) => c.text).join(' ')}</p>
                <p className="psum">
                  <span className="runin">Chart review:</span>{' '}
                  {pr.clauses.filter((c) => c.voice === 'documented').map((c) => c.text).join(' ')}
                </p>
                {pr.conflict && <p className="pconflict">{pr.conflict}</p>}
                <textarea className="prose" rows={2}
                  placeholder="The plan for this problem."
                  value={plan.byProblem[pr.conditionId] ?? ''}
                  onChange={(e) => setPlan((v) => ({
                    ...v, byProblem: { ...v.byProblem, [pr.conditionId]: e.target.value },
                  }))} />
              </div>
            ))}

            <div className="wprob">
              <div className="sphead"><strong>Follow-up</strong></div>
              <textarea className="prose" rows={2}
                placeholder="When, and with what done beforehand."
                value={plan.followUp}
                onChange={(e) => setPlan((v) => ({ ...v, followUp: e.target.value }))} />
            </div>
          </Panel>
        </div>

        {/* -------------------------------------------------- what is new */}
        <div className="stack">
          <Panel title={`New since version ${approved?.version ?? 0}`} right={
            <Chip tone={fresh.urgent > 0 ? 'crit' : fresh.count > 0 ? 'warn' : undefined}>
              {fresh.count === 0 ? 'Nothing new' : `${fresh.count} records`}
            </Chip>
          }>
            {fresh.count === 0 ? (
              <p className="snone">
                Nothing has arrived since this chart was last approved. Signing
                will record that it was reviewed and left as it stands.
              </p>
            ) : (
              <div className="newlist">
                {fresh.updates.map((u) => (
                  <div key={u.id} className="newitem">
                    <div className="newhead">
                      <Chip tone="accent">Health update</Chip>
                      <span className="muted">{fmtDate(u.date)}</span>
                    </div>
                    {u.overall && <p>{u.overall}</p>}
                    {(u.interval ?? []).map((e, i) => (
                      <p key={i} className="small">
                        <b>{INTERVAL_LABEL[e.kind]}.</b> {e.text}
                      </p>
                    ))}
                    {st.checkInsFor(patientId)
                      .filter((c) => c.updateId === u.id && c.text !== u.overall)
                      .map((c) => <p key={c.id} className="small">{c.text}</p>)}
                  </div>
                ))}
                {fresh.messages.map((m) => (
                  <div key={m.id} className="newitem">
                    <div className="newhead">
                      <Chip tone={m.urgent ? 'crit' : undefined}>
                        {m.urgent ? 'Urgent message' : 'Message'}
                      </Chip>
                      <span className="muted">{fmtDate(m.date)}</span>
                    </div>
                    <p>{m.body}</p>
                  </div>
                ))}
                {fresh.panels.map((x) => (
                  <div key={x.id} className="newitem">
                    <div className="newhead">
                      <Chip>Result</Chip><span className="muted">{fmtDate(x.date)}</span>
                    </div>
                    <p className="small">
                      <b>{x.name}.</b>{' '}
                      {x.values.map((v) => `${v.key} ${v.value}`).join(', ')}
                    </p>
                  </div>
                ))}
                {fresh.encounters.map((e) => (
                  <div key={e.id} className="newitem">
                    <div className="newhead">
                      <Chip>Visit</Chip><span className="muted">{fmtDate(e.date)}</span>
                    </div>
                    <p className="small">{e.note?.assessment.overall ?? e.reason}</p>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          {/* ------------------------------------------ what we need back */}
          <Panel title="Ask the patient" right={
            <span className="small muted">Sent when you sign</span>
          }>
            {/*
              * What they sent back, and what it answered. The loop
              * closes here rather than in somebody's memory.
              */}
            {answered.length > 0 && (
              <div className="asklist" style={{ marginBottom: 12 }}>
                {answered.map((r) => (
                  <div key={r.id} className="askrow">
                    <div style={{ flex: 1 }}>
                      <div className="asktext">{r.ask}</div>
                      <div className="small muted">
                        answered {relative(r.answeredAt ?? r.created)}
                      </div>
                    </div>
                    <Chip tone="ok">Answered</Chip>
                  </div>
                ))}
              </div>
            )}
            {open.length > 0 && (
              <div className="asklist">
                {open.map((r) => (
                  <AskRow key={r.id} r={r} patientId={patientId}
                    onCancel={() => st.cancelAsk(r.id)} />
                ))}
              </div>
            )}
            <div className="row" style={{ gap: 7, marginTop: 10 }}>
              <input className="search" value={asking} placeholder="What do you need from them?"
                onChange={(e) => setAsking(e.target.value)} />
              <button className="btn sm" disabled={!asking.trim()}
                onClick={() => {
                  st.askPatient(patientId, encounterId, { kind: 'overall' }, asking.trim());
                  setAsking('');
                }}>Add</button>
            </div>
            <div className="row" style={{ gap: 6, flexWrap: 'wrap', marginTop: 9 }}>
              {ASK_SUGGESTIONS.map((a) => (
                <button key={a} className="btn ghost sm" onClick={() => setAsking(a)}>
                  {a.split(' ').slice(0, 4).join(' ')}...
                </button>
              ))}
            </div>
          </Panel>

          {isReview && (
            <Panel title="Time on this review">
              <p className="small muted" style={{ marginBottom: 8 }}>
                Recorded against this month{'’'}s {enc.kind === 'ccm' ? 'care management' : 'behavioural health'}{' '}
                time. A review can be worth doing without being billable on its
                own, so this is a time entry and not a claim. NEEDS-COUNSEL.
              </p>
              <div className="row" style={{ gap: 8, alignItems: 'center' }}>
                <input className="search" style={{ maxWidth: 90 }} type="number" value={minutes}
                  onChange={(e) => setMinutes(Number(e.target.value))} />
                <span className="small muted">minutes</span>
              </div>
            </Panel>
          )}

          <button className="btn" onClick={sign}>
            {anyChange
              ? `Sign and publish version ${(approved?.version ?? 0) + 1}`
              : 'Sign as reviewed, no change'}
          </button>
        </div>
      </div>
    </div>
  );
}

function AskRow({ r, patientId, onCancel }: {
  r: InfoRequest; patientId: string; onCancel: () => void;
}) {
  const st = useStore();
  const about = r.about;
  const name = about.kind === 'condition'
    ? st.conditionsFor(patientId).find((c) => c.id === about.id)?.name
    : about.kind === 'prevention'
      ? st.preventionFor(patientId).find((x) => x.id === about.id)?.name
      : about.kind === 'lifestyle'
        ? st.lifestyleFor(patientId).find((x) => x.id === about.id)?.prescription
        : undefined;
  return (
    <div className="askrow">
      <div style={{ flex: 1 }}>
        <div className="asktext">{r.ask}</div>
        <div className="small muted">
          {name ? `${name} · ` : ''}asked {relative(r.created)}
        </div>
      </div>
      <button className="linkish" onClick={onCancel}>Drop</button>
    </div>
  );
}
