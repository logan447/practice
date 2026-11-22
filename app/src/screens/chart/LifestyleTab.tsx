/**
 * Lifestyle medicine, prescribed rather than discussed.
 *
 * Every row names a domain, says what was actually asked for, and
 * says how it is going. "Advised exercise" is not a prescription and
 * cannot be followed up; "twenty minutes of walking after dinner, the
 * four evenings she is at home" can be.
 *
 * A tab of its own, between the problems and the preventative
 * services, because to this practice those are three kinds of the
 * same thing and a chart review reads them in that order.
 */
import { useState } from 'react';
import { useStore } from '../../lib/store';
import { fmtDate } from '../../lib/format';
import { LIFESTYLE_DOMAINS, LIFESTYLE_STATUS_LABEL } from '../../domain/types';
import type { LifestyleStatus } from '../../domain/types';
import { Rows, Row, Sheet, NoRows } from './Rows';

const ORDER: Record<LifestyleStatus, number> = {
  struggling: 0, 'not-started': 1, active: 2, achieved: 3,
};

export function LifestyleTab({ patientId }: { patientId: string }) {
  const st = useStore();
  const items = st.lifestyleFor(patientId)
    .slice().sort((a, b) => ORDER[a.status] - ORDER[b.status]);
  const conditions = st.conditionsFor(patientId);
  const [open, setOpen] = useState<string | null>(null);
  const sel = items.find((x) => x.id === open);

  const domain = (d: string) => LIFESTYLE_DOMAINS.find((x) => x.id === d)?.label ?? d;

  return (
    <>
      <Rows>
        {items.length === 0 ? <NoRows>Nothing prescribed yet.</NoRows> : items.map((l) => (
          <Row key={l.id}
            when={fmtDate(l.reviewed ?? l.started)}
            tag={LIFESTYLE_STATUS_LABEL[l.status]}
            warn={l.status === 'struggling' || l.status === 'not-started'}
            name={items.filter((x) => x.domain === l.domain).length > 1
              ? `${domain(l.domain)}: ${l.prescription.split(/[.,]/)[0].trim()}`
              : domain(l.domain)}
            onOpen={() => setOpen(l.id)} />
        ))}
      </Rows>

      {sel && (
        <Sheet title={domain(sel.domain)}
          sub={`${LIFESTYLE_STATUS_LABEL[sel.status]} · started ${fmtDate(sel.started)}`}
          onClose={() => setOpen(null)}>
          <div style={{ marginBottom: 14 }}>
            <div className="eyebrow" style={{ marginBottom: 4 }}>Prescribed</div>
            <p style={{ margin: 0 }}>{sel.prescription}</p>
          </div>
          {sel.barrier && (
            <div style={{ marginBottom: 14 }}>
              <div className="eyebrow" style={{ marginBottom: 4 }}>In the way</div>
              <p style={{ margin: 0 }}>{sel.barrier}</p>
            </div>
          )}
          <div>
            <div className="eyebrow" style={{ marginBottom: 4 }}>Aimed at</div>
            <p style={{ margin: 0 }}>
              {sel.forConditions.length === 0 ? 'Not coded to a problem.'
                : sel.forConditions
                  .map((id) => conditions.find((c) => c.id === id)?.name ?? id)
                  .join(', ')}
            </p>
          </div>
        </Sheet>
      )}
    </>
  );
}
