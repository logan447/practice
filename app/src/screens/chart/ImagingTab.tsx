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
import { Rows, Row, Sheet, NoRows } from './Rows';

export function ImagingTab({ patientId }: { patientId: string }) {
  const st = useStore();
  const studies = st.studiesFor(patientId);
  const [open, setOpen] = useState<string | null>(null);
  const sel = studies.find((s) => s.id === open);

  return (
    <>
      <Rows>
        {studies.length === 0 ? <NoRows>None on file.</NoRows> : studies.map((d) => (
          <Row key={d.id} when={fmtDate(d.date)}
            tag={d.significant ? 'Significant' : d.kind} warn={d.significant}
            name={d.name}
            onOpen={() => setOpen(d.id)} />
        ))}
      </Rows>

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
