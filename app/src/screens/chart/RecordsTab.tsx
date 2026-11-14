/**
 * Allergies and outside records.
 *
 * Both are modelled honestly, which means modelling failure. An
 * allergy can be in the chart twice with two severities, because two
 * sources sent it and neither was reconciled. An outside record can
 * arrive as clean text, as a scan with no text at all, or as a parse
 * that produced nothing usable.
 *
 * Most systems show the third case as though it were the first: a row
 * in a list, a title, a date, and nothing to tell you that the
 * contents never made it in. So this screen says so on the row, and
 * says what that costs: nothing in it reaches search, the chart
 * review, or the assistant.
 */
import { useStore } from '../../lib/store';
import { Chip, Panel, Empty } from '../../components/ui';
import { fmtDate } from '../../lib/format';
import type { Allergy, ChartDocument } from '../../domain/types';

const SEV_TONE: Record<string, 'crit' | 'warn' | undefined> = {
  severe: 'crit', moderate: 'warn', mild: undefined, unknown: 'warn',
};

const STATUS: Record<ChartDocument['status'], { label: string; tone?: 'crit' | 'warn' | 'ok' }> = {
  parsed: { label: 'Read', tone: 'ok' },
  scanned: { label: 'Images only', tone: 'warn' },
  failed: { label: 'Would not read', tone: 'crit' },
};

export function RecordsTab({ patientId }: { patientId: string }) {
  const st = useStore();
  const allergies = st.allergiesFor(patientId);
  const docs = st.documentsFor(patientId);

  /** Substances recorded more than once, loosely matched. */
  const key = (a: Allergy) => a.substance.toLowerCase().replace(/[^a-z]/g, '');
  const counts = allergies.reduce<Record<string, number>>((acc, a) => {
    acc[key(a)] = (acc[key(a)] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="stack">
      <Panel title="Allergies">
        {allergies.length === 0 ? (
          <Empty>None recorded. That is not the same as none, and the chart should not imply it is.</Empty>
        ) : (
          <div className="stack">
            {allergies.map((a) => (
              <div key={a.id} className="listrow">
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="row" style={{ gap: 8 }}>
                    <strong>{a.substance}</strong>
                    <Chip tone={SEV_TONE[a.severity ?? 'unknown']}>{a.severity ?? 'unknown'}</Chip>
                    {counts[key(a)] > 1 && <Chip tone="crit">Recorded twice</Chip>}
                  </div>
                  <div className="small muted" style={{ marginTop: 3 }}>
                    {a.reaction ?? 'Reaction not recorded'} &middot; from {a.provenance.by} &middot; {fmtDate(a.recorded)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Outside records" eyebrow={`${docs.length} on file`}>
        {docs.length === 0 ? <Empty>Nothing received.</Empty> : (
          <div className="stack">
            {docs.map((d) => {
              const s = STATUS[d.status];
              return (
                <div key={d.id} className="listrow">
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="row" style={{ gap: 8 }}>
                      <strong>{d.title}</strong>
                      <Chip tone={s.tone}>{s.label}</Chip>
                      {d.status !== 'parsed' && !d.reviewed && <Chip tone="warn">Not read by anyone</Chip>}
                    </div>
                    <div className="small muted" style={{ marginTop: 3 }}>
                      {d.from} &middot; {fmtDate(d.date)} &middot; {d.kind}
                    </div>

                    {d.status === 'parsed' && d.text && (
                      <p className="small" style={{ marginTop: 7 }}>{d.text}</p>
                    )}
                    {d.status === 'scanned' && (
                      <p className="small muted" style={{ marginTop: 7 }}>
                        A scan with no text layer. Nothing in it reaches search, the
                        chart review or the assistant, so it is only in the record in
                        the sense that the file is here.
                      </p>
                    )}
                    {d.status === 'failed' && (
                      <>
                        <p className="small muted" style={{ marginTop: 7 }}>
                          Parsing produced this and stopped. The document has to be
                          opened and read by a person.
                        </p>
                        <pre className="garble">{d.text ?? '(nothing)'}</pre>
                      </>
                    )}
                  </div>
                  {d.status !== 'parsed' && !d.reviewed && (
                    <button className="btn ghost sm" onClick={() => st.markDocumentReviewed(d.id)}>
                      Mark read
                    </button>
                  )}
                  {d.status !== 'parsed' && d.reviewed && <Chip tone="ok">Read by a person</Chip>}
                </div>
              );
            })}
          </div>
        )}
      </Panel>
    </div>
  );
}
