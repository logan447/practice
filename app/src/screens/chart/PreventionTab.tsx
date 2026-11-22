/**
 * Preventative services.
 *
 * What is due, what is current, and when each was last done. Overdue
 * first, because the only reason to open this tab is to find what has
 * been missed.
 */
import { useState } from 'react';
import { useStore } from '../../lib/store';
import { fmtDate, relative } from '../../lib/format';
import { Rows, Row, Sheet, NoRows } from './Rows';
import type { PreventionStatus } from '../../domain/types';

const LABEL: Record<PreventionStatus, string> = {
  due: 'Due', overdue: 'Overdue', current: 'Current', 'not-applicable': 'Not applicable',
};
const ORDER: Record<PreventionStatus, number> = {
  overdue: 0, due: 1, current: 2, 'not-applicable': 3,
};

export function PreventionTab({ patientId }: { patientId: string }) {
  const st = useStore();
  const items = st.preventionFor(patientId)
    .slice().sort((a, b) => ORDER[a.status] - ORDER[b.status]);
  const [open, setOpen] = useState<string | null>(null);
  const sel = items.find((i) => i.id === open);

  return (
    <>
      <Rows>
        {items.length === 0 ? <NoRows>Nothing scheduled yet.</NoRows> : items.map((i) => (
          <Row key={i.id}
            when={i.dueBy ? fmtDate(i.dueBy) : i.lastDone ? fmtDate(i.lastDone) : undefined}
            tag={LABEL[i.status]}
            warn={i.status === 'overdue' || i.status === 'due'}
            name={i.name}
            onOpen={() => setOpen(i.id)} />
        ))}
      </Rows>

      {sel && (
        <Sheet title={sel.name} sub={LABEL[sel.status]} onClose={() => setOpen(null)}>
          <p>Last done {sel.lastDone ? fmtDate(sel.lastDone) : 'not on file'}.</p>
          <p>Due {sel.dueBy ? `${fmtDate(sel.dueBy)} (${relative(sel.dueBy)})` : 'not set'}.</p>
          {sel.note && <p>{sel.note}</p>}
        </Sheet>
      )}
    </>
  );
}
