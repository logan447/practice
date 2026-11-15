/**
 * The subjective, rendered from the record rather than stored.
 *
 * Nothing on this screen is a text field. Every sentence is computed
 * from the signed notes, the health updates, the messages, the per
 * problem answers, the letters and the measures, and recomputed the
 * next time the chart is opened. There is no document to maintain and
 * no draft to accept, which is the whole point: a summary that has to
 * be kept current by hand is not a summary, it is another record.
 *
 * Two things the rendering has to carry, and both are typographic
 * rather than labelled, because a tag on every clause would be read
 * once and then skipped.
 *
 * Whose voice it is. What the patient said is set in the serif the
 * rest of the app uses for their words. What the record documents is
 * set in the sans. The reader can tell at a glance which half of a
 * paragraph is testimony and which is finding, which matters because
 * they carry different weight and are acted on differently.
 *
 * Where it came from. Every problem lists the records behind it, and
 * every record is openable. A summary nobody can check is a summary
 * nobody should act on quickly, and acting on it quickly is the only
 * reason it exists.
 */
import { Chip } from '../../components/ui';
import { useStore } from '../../lib/store';
import { fmtDate, relative } from '../../lib/format';
import { livingSubjective } from '../../lib/subjective';
import type { Clause, Intervention, SourceRef } from '../../lib/subjective';
import { TREND_LABEL } from '../../domain/types';
import type { Condition } from '../../domain/types';

const trendTone = (t?: Condition['trend']) =>
  (t === 'worsening' ? 'crit' : t === 'improving' ? 'ok' : t === 'stable' ? undefined : 'warn');

const ivTone = (t: Intervention['tone']) => (t === 'none' ? undefined : t);

/** Patient's words in the serif, the record's in the sans. */
const Clauses = ({ clauses }: { clauses: Clause[] }) => (
  <p className="psum">
    {clauses.map((c, i) => (
      <span key={i} className={c.voice === 'patient' ? 'said' : 'doc'}>{c.text}{' '}</span>
    ))}
  </p>
);

const Sources = ({ refs, onOpen }: { refs: SourceRef[]; onOpen: () => void }) => {
  if (refs.length === 0) return null;
  const seen = new Map<string, SourceRef>();
  for (const r of refs) seen.set(r.id, r);
  const list = [...seen.values()].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <p className="psrc">
      <button className="linkish" onClick={onOpen}>From</button>{' '}
      {list.map((r) => r.label).join('; ')}.
    </p>
  );
};

export function Subjective({ patientId, onOpenSources }: {
  patientId: string;
  onOpenSources: () => void;
}) {
  const st = useStore();
  const p = st.patient(patientId);
  const conditions = st.conditionsFor(patientId);
  const history = conditions.filter(
    (c) => c.status === 'active' && c.managed !== true,
  );
  const live = livingSubjective({
    patientId, now: st.now,
    conditions,
    medications: st.medsFor(patientId),
    encounters: st.encountersFor(patientId),
    updates: st.updatesFor(patientId),
    messages: st.messagesFor(patientId),
    checkIns: st.checkInsFor(patientId),
    specialists: st.specialistsFor(patientId),
    panels: st.panelsFor(patientId),
    vitals: st.vitalsFor(patientId),
    studies: st.studiesFor(patientId),
    prevention: st.preventionFor(patientId),
    lifestyle: st.lifestyleFor(patientId),
    orders: st.ordersForPatient(patientId),
  });

  if (!p) return null;

  return (
    <div className="soapbody">
      {/* ------------------------------------------- overall, 2 to 3 lines */}
      <Clauses clauses={live.overall} />

      {/*
        * How current it is, and how to check it. Deliberately quiet:
        * this is a statement about the document, not a task, and the
        * last version of this screen put a call to action here that
        * was read before the clinical content.
        */}
      <p className="derivedfrom">
        Written from {live.sources.length} record{live.sources.length === 1 ? '' : 's'} on file
        {live.lastSource && `, the most recent ${relative(live.lastSource.date)}`}. Recomputed
        every time this chart is opened.{' '}
        <button className="linkish" onClick={onOpenSources}>
          {live.sources.length === 0
            ? 'Add a visit, an update or a message'
            : 'Read the sources'}
        </button>
      </p>

      {/* ------------------------------------------------ problem by problem */}
      {/*
        * An empty summary has to say what would fill it.
        *
        * Two different emptinesses, and they need different answers.
        * A chart with problems nobody has taken on has nothing to
        * summarise by problem until somebody ticks one, and the tick
        * was buried in a drawer. A chart with no records has nothing
        * to summarise at all, and the way to change that is to add a
        * record, not to write in the summary.
        */}
      {live.problems.length === 0 && (
        <div className="emptysubj">
          <p>
            Nothing is being managed here yet, so there is nothing to summarise
            by problem.
          </p>
          {history.length > 0 ? (
            <>
              <p className="small muted">
                These are on the history. Tick the ones this practice is taking
                on and they will appear here with everything on file about them.
              </p>
              <div className="row" style={{ gap: 7, flexWrap: 'wrap' }}>
                {history.map((c) => (
                  <button key={c.id} className="btn sm ghost"
                    onClick={() => st.setManaged(c.id, true)}>
                    Manage {c.name}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <p className="small muted">
              No problems on the list at all. Add one in the plan below.
            </p>
          )}
        </div>
      )}

      {live.problems.map((pr) => (
        <article key={pr.conditionId} className="sprob" id={`subj-${pr.conditionId}`}>
          <div className="sphead">
            <strong>{pr.name}</strong>
            {pr.code && <span className="ppcode">{pr.code}</span>}
            <Chip tone={trendTone(pr.trend)}>{TREND_LABEL[pr.trend ?? 'not-assessed']}</Chip>
          </div>

          <Clauses clauses={pr.clauses} />

          {pr.conflict && <p className="pconflict">{pr.conflict}</p>}

          {pr.interventions.length === 0 ? (
            <p className="snone">Nothing is being done about this at the moment.</p>
          ) : (
            <ul className="ivlist">
              {pr.interventions.map((iv, i) => (
                <li key={i}>
                  <span className="ivl">{iv.label}</span>
                  <Chip tone={ivTone(iv.tone)}>{iv.status}</Chip>
                  {iv.attribution && <span className="iva">{iv.attribution}</span>}
                  {iv.detail && <span className="ivd">{iv.detail}</span>}
                </li>
              ))}
            </ul>
          )}

          <Sources refs={pr.sources} onOpen={onOpenSources} />
        </article>
      ))}
    </div>
  );
}

/** The dated list of everything the summary was built from. */
export function SourcesList({ patientId, onOpen }: {
  patientId: string;
  onOpen: (kind: SourceRef['kind'], id: string) => void;
}) {
  const st = useStore();
  const live = livingSubjective({
    patientId, now: st.now,
    conditions: st.conditionsFor(patientId),
    medications: st.medsFor(patientId),
    encounters: st.encountersFor(patientId),
    updates: st.updatesFor(patientId),
    messages: st.messagesFor(patientId),
    checkIns: st.checkInsFor(patientId),
    specialists: st.specialistsFor(patientId),
    panels: st.panelsFor(patientId),
    vitals: st.vitalsFor(patientId),
    studies: st.studiesFor(patientId),
    prevention: st.preventionFor(patientId),
    lifestyle: st.lifestyleFor(patientId),
    orders: st.ordersForPatient(patientId),
  });
  const seen = new Map<string, SourceRef>();
  for (const r of live.sources) seen.set(r.id, r);
  const list = [...seen.values()].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div>
      <p className="drawerlead">
        Every sentence in the subjective is built from these and recomputed
        when the chart is opened. Nothing in it is stored, so nothing in it
        can be out of date with the records below.
      </p>
      <ul className="srclist">
        {list.map((r) => (
          <li key={r.id}>
            <span className="srck">{r.kind}</span>
            <button className="linkish" onClick={() => onOpen(r.kind, r.id)}>{r.label}</button>
            <span className="muted">{fmtDate(r.date)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
