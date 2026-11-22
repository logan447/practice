/**
 * The problem list, and who has each one.
 *
 * Opening a problem is the same sheet the right column opens: where
 * they are now, the plan, what it is being treated with, how it is
 * going, who is responsible. One view of a problem, reachable from
 * both places a physician looks for it.
 */
import { useState } from 'react';
import { useStore } from '../../lib/store';
import { CodePicker } from '../../components/CodePicker';
import { searchConditions } from '../../domain/terminology';
import { fmtDate } from '../../lib/format';
import { Rows, Row, NoRows } from './Rows';
import { ProblemSheet } from './ProblemSheet';

export function ProblemsTab({ patientId }: { patientId: string }) {
  const st = useStore();
  const conditions = st.conditionsFor(patientId);
  const active = conditions.filter((c) => c.status === 'active');
  const managed = active.filter((c) => c.managed);
  const theirs = active.filter((c) => !c.managed);
  const resolved = conditions.filter((c) => c.status !== 'active');
  const [open, setOpen] = useState<string | null>(null);

  /**
   * One tag, and the most useful one.
   *
   * For a problem this practice manages, that is whether it is
   * controlled. For one somebody else has, it is who has it, because
   * a control status we did not assess is not ours to state.
   */
  const tag = (c: typeof conditions[number]) => {
    if (c.status !== 'active') return 'Resolved';
    // Short enough for a tag column. The full sentence is in the
    // problem's own sheet, where the question is actually asked.
    if (!c.managed) {
      return c.owner === 'theirs' ? 'Their PCP'
        : c.owner === 'shared' ? 'Shared'
          : c.owner === 'ours' ? 'We manage' : 'Nobody has said';
    }
    return c.goal === 'at-goal' ? 'Controlled'
      : c.goal ? 'Uncontrolled' : 'Not assessed';
  };
  const warn = (c: typeof conditions[number]) =>
    c.status === 'active' && (c.managed ? c.goal !== 'at-goal' : !c.owner);

  const list = [...managed, ...theirs, ...resolved];

  return (
    <>
      <Rows>
        {list.length === 0 ? <NoRows>Nothing is being managed here.</NoRows> : list.map((c) => (
          <Row key={c.id}
            when={c.goalAssessed ? fmtDate(c.goalAssessed) : undefined}
            tag={tag(c)} warn={warn(c)}
            name={c.name}
            onOpen={() => setOpen(c.id)} />
        ))}
      </Rows>

      <AddProblem patientId={patientId} />

      {open && (
        <ProblemSheet patientId={patientId} conditionId={open} onClose={() => setOpen(null)} />
      )}
    </>
  );
}

/**
 * A new problem, coded.
 *
 * Under the list it joins. It used to be under the right column's
 * version of that list, and the right column is gone: every one of
 * its blocks was a tab, read in the order a chart review reads them.
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

