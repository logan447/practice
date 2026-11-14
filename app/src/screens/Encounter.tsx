/**
 * The encounter workspace.
 *
 * One screen, two columns: the note on the left, everything you need
 * while writing it on the right. No modals, no wizard, no tab-hopping
 * mid-visit — the reason charting eats a consultation is that the
 * things you need are three clicks apart.
 *
 * The AI can draft the note. It drafts into the fields and marks them,
 * and nothing is signed until the physician signs it. That act is what
 * turns a draft into a record.
 */
import { useState } from 'react';
import { useStore } from '../lib/store';
import { useNav } from '../lib/nav';
import { Avatar, Chip, Panel, Trend, Empty } from '../components/ui';
import { AiPanel, AiMark } from '../components/AiPanel';
import { age, fmtDate, relative } from '../lib/format';

type NoteFields = { subjective: string; objective: string; assessment: string; plan: string };

const BLANK: NoteFields = { subjective: '', objective: '', assessment: '', plan: '' };

/** Stand-in for a model call. Shape matters here, not the prose. */
function draftNote(name: string): NoteFields {
  return {
    subjective: `${name} reports keeping the evening walks going, five days most weeks. CPAP every night. Has raised stopping the lisinopril again, in the journal on 28 October and at the last visit. No chest pain, no dizziness, no headaches. Home readings 122/78 and 126/80.`,
    objective: 'BP 124/76 seated after five minutes, repeated 122/78. Weight 198 lb, down 3 lb since September. Heart regular, no murmur. Chest clear. No peripheral oedema.',
    assessment: `Prediabetes now in the normal range: A1c 5.7, the fourth consecutive fall, off metformin since June. Lipids at target, LDL 84. ALT normal for the first time. Blood pressure controlled, and the control followed the apnoea treatment and 29 lb of weight loss rather than any dose change. Weight has been stable three months, so a supervised lisinopril taper is now reasonable.`,
    plan: 'Halve lisinopril to 5 mg for four weeks. Home BP twice weekly throughout, bring the log. If systolic stays under 135, stop and recheck at six weeks. Influenza vaccine today, overdue since 31 October. Repeat A1c and lipids in six months. Care plan updated: goal 4 moves to active taper.',
  };
}

export function Encounter({ encounterId }: { encounterId: string }) {
  const st = useStore();
  const nav = useNav();

  const enc = st.encounters.find((e) => e.id === encounterId);
  const [note, setNote] = useState<NoteFields>(() => enc?.note ?? BLANK);
  const [drafted, setDrafted] = useState<Set<keyof NoteFields>>(new Set());

  if (!enc) return <div className="wrap"><p>Visit not found.</p></div>;
  const p = st.patient(enc.patientId)!;

  const plan = st.planFor(p.id);
  const openActions = plan?.goals.flatMap((g) =>
    g.actions.filter((a) => !a.done).map((a) => ({ goal: g.title, ...a }))) ?? [];
  const lastSigned = st.encountersFor(p.id).find((e) => e.status === 'signed');
  const aiDraft = st.draftsFor(p.id).find((d) => d.kind === 'interval-summary');
  const meds = st.medsFor(p.id).filter((m) => m.status !== 'stopped');
  const tracked = st.seriesFor(p.id).slice(0, 3);
  const unack = st.reportsFor(p.id).filter((r) => !r.acknowledged);

  const signed = enc.status === 'signed';
  const dirty = JSON.stringify(note) !== JSON.stringify(enc.note ?? BLANK);

  const runDraft = () => {
    setNote(draftNote(p.preferredName ?? p.name.split(' ')[0]));
    setDrafted(new Set(['subjective', 'objective', 'assessment', 'plan']));
  };

  const field = (key: keyof NoteFields, label: string, hint: string) => (
    <div>
      <div className="row" style={{ marginBottom: 5 }}>
        <span className="eyebrow">{label}</span>
        {drafted.has(key) && !signed && <AiMark label="Drafted by AI. Edit before signing." />}
        <span className="spacer" />
        <span className="small muted">{hint}</span>
      </div>
      <textarea
        className="note"
        value={note[key]}
        readOnly={signed}
        onChange={(e) => {
          setNote((n) => ({ ...n, [key]: e.target.value }));
          setDrafted((d) => { const x = new Set(d); x.delete(key); return x; });
        }}
      />
    </div>
  );

  return (
    <div className="wrap">
      <button className="btn quiet" style={{ marginBottom: 10 }} onClick={nav.back}>&larr; Back</button>

      <div className="phead" style={{ marginBottom: 18 }}>
        <Avatar patient={p} lg />
        <div style={{ minWidth: 0 }}>
          <h1>{p.name}</h1>
          <div className="meta">{age(p.dob)} &middot; {p.pronouns} &middot; {enc.duration} minutes booked</div>
          <div className="meta" style={{ marginTop: 4, color: 'var(--ink-2)' }}>{enc.reason}</div>
        </div>
        <div className="acts">
          {signed
            ? <Chip tone="ok">Signed {enc.signedAt && fmtDate(enc.signedAt)}</Chip>
            : (
              <>
                <button className="btn ghost" disabled={!dirty}
                  onClick={() => st.saveNote(enc.id, note)}>
                  {dirty ? 'Save draft' : 'Saved'}
                </button>
                <button className="btn" onClick={() => { st.saveNote(enc.id, note); st.signEncounter(enc.id); }}>
                  Sign note
                </button>
              </>
            )}
          <button className="btn ghost" onClick={() => nav.go({ name: 'chart', patientId: p.id })}>
            Full chart
          </button>
        </div>
        {p.pinned && (
          <div className="pinned" style={{ flexBasis: '100%' }}>
            <b>Always</b><span>{p.pinned}</span>
          </div>
        )}
      </div>

      <div className="split">
        {/* ------------------------------------------------ the note */}
        <div className="stack">
          <Panel title="Visit note" right={
            signed ? null : (
              <button className="btn ghost sm" onClick={runDraft}>
                Draft from the chart
              </button>
            )
          }>
            <div className="stack">
              {field('subjective', 'Subjective', 'What they told me')}
              {field('objective', 'Objective', 'What I found')}
              {field('assessment', 'Assessment', 'What I think')}
              {field('plan', 'Plan', 'What we agreed')}
            </div>

            {drafted.size > 0 && !signed && (
              <>
                <div className="sep" />
                <p className="small" style={{ color: 'var(--ai)' }}>
                  Four sections are AI drafts built from this chart. Read and edit them.
                  Signing is what makes them yours.
                </p>
              </>
            )}
          </Panel>
        </div>

        {/* --------------------------------------------- the context */}
        <div className="stack">
          {unack.length > 0 && (
            <section className="panel" style={{ borderColor: 'var(--crit)' }}>
              <header style={{ background: 'var(--crit-soft)', borderRadius: '9px 9px 0 0' }}>
                <h2>Results not yet reviewed</h2>
              </header>
              <div className="body stack-sm">
                {unack.map((r) => (
                  <div key={r.id} className="row">
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13.5 }}>{r.panel}</div>
                      <div className="small muted">{relative(r.resulted)}</div>
                    </div>
                    <button className="btn sm" onClick={() => st.acknowledgeReport(r.id)}>Review</button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {aiDraft && <AiPanel draft={aiDraft} compact />}

          <Panel title="Open plan items" right={
            <span className="small muted">{openActions.length}</span>
          }>
            {openActions.length === 0 ? <Empty>Nothing outstanding.</Empty> : (
              <div className="stack-sm">
                {openActions.map((a) => (
                  <div key={a.id}>
                    <div className="small" style={{ fontWeight: 600 }}>{a.text}</div>
                    <div className="small muted">
                      {a.goal} &middot; {a.owner === 'physician' ? 'mine' : 'theirs'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Measures">
            <div className="stack">
              {tracked.map((s) => {
                const last = s.points[s.points.length - 1];
                return (
                  <div key={s.id}>
                    <div className="row">
                      <span className="small" style={{ fontWeight: 600 }}>{s.name}</span>
                      <span className="spacer" />
                      <span className="small num">{last.value} {s.unit}</span>
                    </div>
                    <Trend series={s} w={300} h={34} />
                  </div>
                );
              })}
            </div>
          </Panel>

          <Panel title="Medicines">
            <div className="stack-sm">
              {meds.map((m) => (
                <div key={m.id} className="row">
                  <span className="small" style={{ flex: 1 }}>{m.name} {m.dose}</span>
                  {m.status === 'held' && <Chip tone="warn">Held</Chip>}
                </div>
              ))}
            </div>
          </Panel>

          {lastSigned?.note && (
            <Panel title="Last visit" eyebrow={fmtDate(lastSigned.date)}>
              <div className="eyebrow" style={{ marginBottom: 4 }}>Plan</div>
              <p className="small">{lastSigned.note.plan}</p>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}
