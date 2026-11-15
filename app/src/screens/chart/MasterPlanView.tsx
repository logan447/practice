/**
 * One living care plan, in SOAP order.
 *
 * Not an encounter note. The visits are kept exactly as they were
 * signed and live in the visits drawer; this is the document that
 * says where the patient is now, and it is the first and mostly the
 * only thing the chart shows.
 *
 * Two kinds of content sit in every section and are distinguished by
 * how they look rather than by a label on each one. Prose is the
 * physician's, typed here and saved as it is left. Everything in a
 * `derived` block is composed from the structured record at read
 * time: the measures, the results, the problem list, the goal
 * progress, the prevention schedule, the medicines. Composing rather
 * than copying is what stops a longitudinal document drifting out of
 * date with the record it describes.
 */
import { useEffect, useRef, useState } from 'react';
import { useStore } from '../../lib/store';

import { CodePicker } from '../../components/CodePicker';
import { searchConditions } from '../../domain/terminology';
import { relative } from '../../lib/format';
import type { MasterPlan } from '../../domain/types';
import { Objective } from './Objective';
import { Assessment, Plan } from './AssessPlan';
import { Subjective } from './Subjective';

/**
 * A text block that saves what it is left with, and nothing sooner.
 *
 * Grows to its content rather than scrolling inside a fixed box,
 * because a longitudinal plan is read far more often than it is
 * edited and a scrollbar inside a paragraph hides half of it.
 */
function Prose({ value, placeholder, onSave, rows = 3 }: {
  value: string; placeholder: string; onSave: (v: string) => void; rows?: number;
}) {
  const [v, setV] = useState(value);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { setV(value); }, [value]);

  // field-sizing: content is not everywhere yet, so measure as well.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [v]);

  return (
    <textarea
      ref={ref} className="prose" rows={rows} value={v} placeholder={placeholder}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => { if (v !== value) onSave(v); }}
    />
  );
}

function Section({ letter, title, children }: {
  letter: string; title: string; children: React.ReactNode;
}) {
  return (
    <section className="soap">
      <div className="soaphead">
        <span className="letter">{letter}</span>
        <h2>{title}</h2>
      </div>
      <div className="soapbody">{children}</div>
    </section>
  );
}

const Label = ({ children }: { children: React.ReactNode }) =>
  <div className="soaplabel">{children}</div>;

export function MasterPlanView({ patientId, onOpen }: {
  patientId: string;
  /** Drawer names, so a section can hand off to the full view. */
  onOpen: (what: 'meds' | 'results' | 'prevention' | 'specialists' | 'notes') => void;
}) {
  const st = useStore();
  const p = st.patient(patientId);
  const mp = st.masterPlanFor(patientId);

  if (!p) return null;

  const save = (patch: Partial<MasterPlan>) => st.saveMasterPlan(patientId, patch);
  const O = mp?.objective ?? { narrative: '' };
  const A = mp?.assessment ?? { narrative: '' };
  const P = mp?.plan ?? { byProblem: {}, prevention: '', lifestyle: '', followUp: '' };


  return (
    <div className="master">
      {/* ------------------------------------------------- subjective */}
      <Section letter="S" title="Subjective">
        <Subjective patientId={patientId} master={mp} onSave={save} />
      </Section>

      {/* -------------------------------------------------- objective */}
      <section className="soap">
        <div className="soaphead">
          <span className="letter">O</span>
          <h2>Objective</h2>
        </div>
        <Objective patientId={patientId}
          onOpen={(w) => onOpen(w === 'studies' ? 'results' : w)} />
        <div style={{ marginTop: 16 }}>
          <Label>Anything the numbers do not say</Label>
          <Prose value={O.narrative} rows={3}
            placeholder="Patterns across the readings, what the trend means, what is missing."
            onSave={(v) => save({ objective: { narrative: v } })} />
        </div>
      </section>

      {/* ------------------------------------------------- assessment */}
      <section className="soap">
        <div className="soaphead">
          <span className="letter">A</span>
          <h2>Assessment</h2>
        </div>
        <Assessment patientId={patientId} prose={
          <>
            <Label>In a sentence or two</Label>
            <Prose value={A.narrative} rows={4}
              placeholder="Where this patient is, across the problems rather than one at a time."
              onSave={(v) => save({ assessment: { narrative: v } })} />
          </>
        } />
      </section>

      {/* ------------------------------------------------------- plan */}
      <section className="soap">
        <div className="soaphead">
          <span className="letter">P</span>
          <h2>Plan</h2>
        </div>
        <Plan
          patientId={patientId}
          master={mp}
          onSetProblem={(cid, text) => st.setProblemPlan(patientId, cid, text)}
          prose={{
            problem: (_cid, value, onSaveText) => (
              <Prose value={value} rows={3}
                placeholder="What is being done, and what happens next."
                onSave={onSaveText} />
            ),
            prevention: (
              <Prose value={P.prevention} rows={2}
                placeholder="What is in the way, and what we are doing about it."
                onSave={(v) => save({ plan: { ...P, prevention: v } })} />
            ),
            lifestyle: (
              <Prose value={P.lifestyle} rows={2}
                placeholder="Anything the prescriptions above do not capture."
                onSave={(v) => save({ plan: { ...P, lifestyle: v } })} />
            ),
          }}
        />
        <div style={{ marginTop: 14 }}>
          <AddProblem patientId={patientId} />
        </div>
      </section>

      <p className="masterfoot">
        {mp && <>Summary last updated {relative(mp.updated)} by {mp.updatedBy}. </>}
        Visits are kept as they were signed.{' '}
        <button className="linkish" onClick={() => onOpen('notes')}>Read the notes</button>
      </p>
    </div>
  );
}

/**
 * A new problem, coded.
 *
 * Here rather than in the header, because adding a problem is a
 * planning act: you add it when you start managing it, and this is
 * where managing it is written down.
 */
function AddProblem({ patientId }: { patientId: string }) {
  const st = useStore();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: '', code: '' });

  if (!open) {
    return (
      <button className="linkish addproblem" onClick={() => setOpen(true)}>+ Problem</button>
    );
  }
  return (
    <div className="addproblembox">
      <CodePicker
        label="Add a problem" value={f.name} autoFocus
        placeholder="Type a diagnosis"
        hint="ICD-10-CM"
        onText={(v) => setF({ name: v, code: '' })}
        search={(q) => searchConditions(q).map((c) => ({ id: c.code, primary: c.name, code: c.code }))}
        onPick={(r) => setF({ name: r.primary, code: r.code })}
      />
      <div className="row" style={{ marginTop: 9, gap: 7 }}>
        <button className="btn sm" disabled={!f.name.trim()}
          onClick={() => {
            st.addCondition(patientId, f.name.trim(), f.code);
            setF({ name: '', code: '' });
            setOpen(false);
          }}>
          Add{f.code ? ` ${f.code}` : ' without a code'}
        </button>
        <button className="btn ghost sm" onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </div>
  );
}
