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
import { Chip, Panel, Empty, Prov } from '../../components/ui';
import { fmtDate } from '../../lib/format';
import type { Allergy, ChartDocument } from '../../domain/types';
import { useActor, ROLE_LABEL } from '../../lib/session';
import { can } from '../../lib/permissions';

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
  const me = useActor();
  const allergies = st.allergiesFor(patientId);
  const docs = st.documentsFor(patientId);

  /**
   * What the patient wrote, filtered by who is reading.
   *
   * This is where the covering rule has teeth. A journal is the
   * patient writing to their own physician over months; a clinician
   * covering for a week gets what was flagged for attention and not
   * the rest. Arguable either way, which is exactly why the rule is in
   * one file and the screen says what it did.
   */
  const entries = st.entriesFor(patientId).filter((e) => e.kind === 'journal');
  const readable = entries.filter((e) =>
    can(me, 'read-journal', { patientId, now: st.now, flagged: e.flagged }).allowed);
  const withheld = entries.length - readable.length;

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

      <Panel title="In the patient's own words" eyebrow={`${entries.length} entries`}>
        {entries.length === 0 ? <Empty>Nothing written.</Empty> : (
          <div className="stack">
            {readable.map((e) => (
              <div key={e.id} className="listrow">
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="row" style={{ gap: 8 }}>
                    <strong>{e.label}</strong>
                    {e.flagged && <Chip tone="warn">Asked you to look</Chip>}
                    <span className="small muted">{fmtDate(e.date)}</span>
                  </div>
                  <p className="small" style={{ marginTop: 5 }}>{e.body}</p>
                  <div style={{ marginTop: 5 }}>
                    <Prov author={e.provenance.author} by={e.provenance.by} />
                  </div>
                </div>
              </div>
            ))}
            {withheld > 0 && (
              <div className="listrow">
                <p className="small muted" style={{ margin: 0 }}>
                  {withheld} further entr{withheld > 1 ? 'ies are' : 'y is'} not shown.
                  Signed in as {ROLE_LABEL[me.role].toLowerCase()}, you see what the
                  patient flagged for attention. The rest is between them and their own
                  physician, and asking for it is a decision somebody should have to make
                  rather than a scroll.
                </p>
              </div>
            )}
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
