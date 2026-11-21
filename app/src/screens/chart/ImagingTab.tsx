/**
 * Imaging, procedures and anything else with an impression.
 *
 * The impression is the record. It used to be printed under every row
 * in the list, which made a list of eight studies into a page of
 * prose nobody read to the end. It is one click away instead.
 */
import { useState } from 'react';
import { useStore } from '../../lib/store';
import { fmtDate } from '../../lib/format';
import { Group, Row, Sheet, NoRows } from './Rows';

export function ImagingTab({ patientId }: { patientId: string }) {
  const st = useStore();
  const studies = st.studiesFor(patientId);
  const [open, setOpen] = useState<string | null>(null);
  const sel = studies.find((s) => s.id === open);

  return (
    <>
      <Group title="Imaging and procedures" count={studies.length}>
        {studies.length === 0 ? <NoRows>None on file.</NoRows> : studies.map((d) => (
          <Row key={d.id} name={d.name} when={fmtDate(d.date)}
            note={d.significant ? 'Significant' : undefined} warn={d.significant}
            onOpen={() => setOpen(d.id)} />
        ))}
      </Group>

      {sel && (
        <Sheet title={sel.name}
          sub={`${fmtDate(sel.date)} · ${sel.from ?? 'source not recorded'} · ${sel.kind}`}
          onClose={() => setOpen(null)}>
          <p>{sel.impression}</p>
        </Sheet>
      )}
    </>
  );
}
