/**
 * Intake.
 *
 * One screen, not a wizard. A solo physician does this perhaps once a
 * week, and a four-step flow for a fifteen-field form is four chances
 * to lose your place. Only name and date of birth are required; the
 * rest of a chart is built at the first visit, which is what the first
 * visit is for.
 */
import { useState } from 'react';
import { useStore, BLANK_PATIENT, type PatientDraft } from '../lib/store';
import { useNav } from '../lib/nav';
import { Panel } from '../components/ui';

const PRONOUN_BY_SEX: Record<string, string> = { female: 'she/her', male: 'he/him' };

export function NewPatient() {
  const st = useStore();
  const nav = useNav();
  const [d, setD] = useState<PatientDraft>(BLANK_PATIENT);
  const [tried, setTried] = useState(false);

  const set = <K extends keyof PatientDraft>(k: K, v: PatientDraft[K]) =>
    setD((p) => ({ ...p, [k]: v }));

  const missingName = !d.name.trim();
  const missingDob = !d.dob;
  const ok = !missingName && !missingDob;

  const create = () => {
    setTried(true);
    if (!ok) return;
    const id = st.addPatient(d);
    nav.replace({ name: 'chart', patientId: id });
  };

  const field = (
    label: string, value: string, onChange: (v: string) => void,
    opts: { type?: string; placeholder?: string; error?: boolean; hint?: string; wide?: boolean } = {},
  ) => (
    <label style={{ display: 'block', gridColumn: opts.wide ? '1 / -1' : undefined }}>
      <div className="eyebrow" style={{ marginBottom: 5 }}>{label}</div>
      <input
        className="search"
        type={opts.type ?? 'text'}
        value={value}
        placeholder={opts.placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={opts.error ? { borderColor: 'var(--crit)' } : undefined}
      />
      {opts.hint && <div className="small muted" style={{ marginTop: 4 }}>{opts.hint}</div>}
      {opts.error && <div className="small" style={{ marginTop: 4, color: 'var(--crit)' }}>Required</div>}
    </label>
  );

  return (
    <div className="wrap" style={{ maxWidth: 820 }}>
      <button className="btn quiet" style={{ marginBottom: 10 }} onClick={nav.back}>&larr; Back</button>

      <div className="page-head">
        <h1>New patient</h1>
        <div className="sub">Name and date of birth are all that is needed. The rest is built at the first visit.</div>
      </div>

      <div className="stack">
        <Panel title="Who they are">
          <div className="grid g2">
            {field('Full name', d.name, (v) => set('name', v), {
              placeholder: 'Marcus Reyes', error: tried && missingName, wide: true,
            })}
            {field('Date of birth', d.dob, (v) => set('dob', v), {
              type: 'date', error: tried && missingDob,
            })}
            <label style={{ display: 'block' }}>
              <div className="eyebrow" style={{ marginBottom: 5 }}>Sex</div>
              <select className="search" value={d.sex}
                onChange={(e) => {
                  const sex = e.target.value as PatientDraft['sex'];
                  setD((p) => ({ ...p, sex, pronouns: PRONOUN_BY_SEX[sex] ?? p.pronouns }));
                }}>
                <option value="female">Female</option>
                <option value="male">Male</option>
              </select>
              <div className="small muted" style={{ marginTop: 4 }}>
                Recorded for clinical reference ranges and screening.
              </div>
            </label>
            {field('Pronouns', d.pronouns, (v) => set('pronouns', v), {
              hint: 'Change this if they use different ones.',
            })}
            {field('Phone', d.phone, (v) => set('phone', v), { type: 'tel', placeholder: '(512) 555-0100' })}
            {field('Email', d.email, (v) => set('email', v), { type: 'email', placeholder: 'name@example.com' })}
            <label style={{ display: 'block' }}>
              <div className="eyebrow" style={{ marginBottom: 5 }}>Membership</div>
              <select className="search" value={d.membership}
                onChange={(e) => set('membership', e.target.value as PatientDraft['membership'])}>
                <option value="standard">Standard, $99 a month</option>
                <option value="sliding-scale">Sliding scale</option>
                <option value="pro-bono">Pro bono</option>
              </select>
              <div className="small muted" style={{ marginTop: 4 }}>
                The care is the same at every level.
              </div>
            </label>
          </div>
        </Panel>

        <Panel title="What I should always remember">
          <textarea className="note" style={{ minHeight: 70 }}
            placeholder="Night-shift nurse, three on / four off. Any plan has to survive that rota."
            value={d.pinned} onChange={(e) => set('pinned', e.target.value)} />
          <p className="small muted" style={{ marginTop: 8 }}>
            One line, pinned to the top of their chart. The thing you would
            be embarrassed to forget. Optional, and easy to change later.
          </p>
        </Panel>

        <Panel title="What they bring" right={<span className="small muted">Optional</span>}>
          <div className="grid g2">
            <label style={{ display: 'block' }}>
              <div className="eyebrow" style={{ marginBottom: 5 }}>Conditions they report</div>
              <textarea className="note" style={{ minHeight: 100 }}
                placeholder={'High blood pressure\nPrediabetes\nPoor sleep'}
                value={d.conditions} onChange={(e) => set('conditions', e.target.value)} />
              <div className="small muted" style={{ marginTop: 4 }}>One per line.</div>
            </label>
            <label style={{ display: 'block' }}>
              <div className="eyebrow" style={{ marginBottom: 5 }}>Medicines they report</div>
              <textarea className="note" style={{ minHeight: 100 }}
                placeholder={'Lisinopril 10 mg — one tablet each morning\nAtorvastatin 20 mg — at night'}
                value={d.medicines} onChange={(e) => set('medicines', e.target.value)} />
              <div className="small muted" style={{ marginTop: 4 }}>
                One per line. Name, dose, then how they take it.
              </div>
            </label>
          </div>
          <p className="small muted" style={{ marginTop: 12 }}>
            These go in as patient-reported and are marked that way until
            you confirm them. Nothing here is a diagnosis you have made.
          </p>
        </Panel>

        <Panel title="First visit">
          <label className="row" style={{ cursor: 'pointer', alignItems: 'flex-start' }}>
            <input type="checkbox" checked={d.bookIntake}
              onChange={(e) => set('bookIntake', e.target.checked)} style={{ marginTop: 3 }} />
            <span>
              Book a 90-minute first visit
              <div className="small muted" style={{ marginTop: 2 }}>
                Opens on their chart so you can start it straight away.
              </div>
            </span>
          </label>
        </Panel>

        <div className="row">
          <button className="btn" onClick={create} disabled={tried && !ok}>Create patient</button>
          <button className="btn ghost" onClick={nav.back}>Cancel</button>
          {tried && !ok && (
            <span className="small" style={{ color: 'var(--crit)' }}>
              Name and date of birth are needed.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
