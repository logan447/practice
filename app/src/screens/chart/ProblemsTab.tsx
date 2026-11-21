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
import { fmtDate } from '../../lib/format';
import { OWNER_LABEL } from '../../domain/types';
import { Group, Row, NoRows } from './Rows';
import { ProblemSheet } from './ProblemSheet';

export function ProblemsTab({ patientId }: { patientId: string }) {
  const st = useStore();
  const conditions = st.conditionsFor(patientId);
  const active = conditions.filter((c) => c.status === 'active');
  const managed = active.filter((c) => c.managed);
  const theirs = active.filter((c) => !c.managed);
  const resolved = conditions.filter((c) => c.status !== 'active');
  const [open, setOpen] = useState<string | null>(null);

  const state = (c: typeof conditions[number]) =>
    (c.goal === 'at-goal' ? 'Controlled' : c.goal ? 'Uncontrolled' : 'Not assessed');

  return (
    <>
      <Group title="We manage" count={managed.length}>
        {managed.length === 0 ? <NoRows>Nothing is being managed here.</NoRows> : managed.map((c) => (
          <Row key={c.id} name={c.name} note={state(c)} warn={c.goal !== 'at-goal'}
            when={c.goalAssessed ? fmtDate(c.goalAssessed) : undefined}
            onOpen={() => setOpen(c.id)} />
        ))}
      </Group>

      <Group title="On the list, managed elsewhere" count={theirs.length}>
        {theirs.length === 0 ? <NoRows>Nothing else on the list.</NoRows> : theirs.map((c) => (
          <Row key={c.id} name={c.name}
            note={c.owner ? OWNER_LABEL[c.owner] : 'Nobody has said'}
            warn={!c.owner}
            onOpen={() => setOpen(c.id)} />
        ))}
      </Group>

      {resolved.length > 0 && (
        <Group title="Resolved" count={resolved.length}>
          {resolved.map((c) => (
            <Row key={c.id} name={c.name} note="Resolved" onOpen={() => setOpen(c.id)} />
          ))}
        </Group>
      )}

      {open && (
        <ProblemSheet patientId={patientId} conditionId={open} onClose={() => setOpen(null)} />
      )}
    </>
  );
}
