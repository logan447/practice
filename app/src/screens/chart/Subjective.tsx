/**
 * The subjective, as a living document rather than today's history.
 *
 * What this section is trying to be. Not "what the patient said at
 * this visit", which is what an encounter note is for and which is
 * already preserved, signed, in the visits drawer. This is where each
 * thing we are working on stands today, pulling on every note on
 * file, the measures as they are now, and the patient's own account.
 *
 * Three sources, kept visibly apart.
 *
 * The chart review is a clinician's reading of the notes across time.
 * It is prose, it is editable, and the synthesis step proposes
 * updates to it with citations rather than writing it.
 *
 * The numbers are composed from the record at read time. They are
 * never typed in here, so they cannot go stale, and the previous
 * value sits beside the current one because a number without its
 * predecessor is not yet information.
 *
 * The patient's words are theirs. Asked before the visit, one
 * question per problem, kept verbatim, never merged into the
 * paragraph above. They disagree with the chart review often, and the
 * disagreement is usually the most useful thing on the screen: a
 * problem the chart calls improving and the patient calls worse is a
 * problem we have misunderstood.
 *
 * Then the orders out, because "what are we waiting on for this"
 * belongs with the rest of the problem and not in a separate list,
 * and the specialist's comment where one is relevant to it.
 *
 * Last, and deliberately last, their account of their health overall.
 * It goes at the bottom because the problem list is what gets worked
 * through and this is the thing that puts it in proportion.
 */
import { useEffect, useRef, useState } from 'react';
import { useStore } from '../../lib/store';
import { Chip } from '../../components/ui';
import { fmtDate, relative } from '../../lib/format';
import {
  FEELING_LABEL, ON_PLAN_LABEL, LIFESTYLE_DOMAINS, LIFESTYLE_STATUS_LABEL,
  TREND_LABEL,
} from '../../domain/types';
import type {
  Condition, LifestyleIntervention, MasterPlan, PreventionItem, ProblemCheckIn,
} from '../../domain/types';
import { measuresAbout, ordersAbout, specialistsAbout } from './relate';
import type { Measure } from './relate';

/** Saves what it is left with, and nothing sooner. */
function Prose({ value, placeholder, onSave, rows = 3, className = 'prose' }: {
  value: string; placeholder: string; onSave: (v: string) => void;
  rows?: number; className?: string;
}) {
  const [v, setV] = useState(value);
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { setV(value); }, [value]);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [v]);
  return (
    <textarea
      ref={ref} className={className} rows={rows} value={v} placeholder={placeholder}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => { if (v !== value) onSave(v); }}
    />
  );
}

const trendTone = (t?: Condition['trend']) =>
  (t === 'worsening' ? 'crit' : t === 'improving' ? 'ok' : t === 'stable' ? undefined : 'warn');

const feelTone = (f: ProblemCheckIn['feeling']) =>
  (f === 'worse' ? 'crit' : f === 'better' ? 'ok' : f === 'unsure' ? 'warn' : undefined);

/** The composed numbers, with the previous value beside each. */
function Numbers({ measures, empty }: { measures: Measure[]; empty: string }) {
  if (measures.length === 0) return <p className="snone">{empty}</p>;
  return (
    <div className="snums">
      {measures.map((m) => (
        <span key={m.label + m.date}
          className={`snum${m.flag && m.flag !== 'normal' ? ' off' : ''}${m.flag === 'critical' ? ' bad' : ''}`}>
          <span className="snk">{m.label}</span>
          <span className="snv">{m.value}</span>
          {m.prev && <span className="snp">was {m.prev}</span>}
          {m.date && <span className="snd">{fmtDate(m.date)}</span>}
          {m.from && <span className="snf">{m.from}</span>}
        </span>
      ))}
    </div>
  );
}

/** Their words, or the fact that we did not get any. */
function Said({ ci, asked }: { ci?: ProblemCheckIn; asked: string }) {
  if (!ci) {
    return <p className="snone">Not answered before this visit. {asked}</p>;
  }
  return (
    <blockquote className="said">
      <p>{ci.text}</p>
      <footer>
        <Chip tone={feelTone(ci.feeling)}>{FEELING_LABEL[ci.feeling]}</Chip>
        {ci.onPlan && <Chip tone={ci.onPlan === 'no' ? 'crit' : ci.onPlan === 'partly' ? 'warn' : 'ok'}>
          {ON_PLAN_LABEL[ci.onPlan]}
        </Chip>}
        <span className="muted">their words, {relative(ci.date)}</span>
      </footer>
    </blockquote>
  );
}

/** One problem, service or prescription, with everything about it. */
function Item({
  id, title, code, chip, detail, review, measures, empty, said, asked,
  specialist, orders, onSaveReview,
}: {
  id: string;
  title: string;
  code?: string;
  chip?: React.ReactNode;
  /** What was actually prescribed or asked for, where the title is only a category. */
  detail?: string;
  review: string;
  measures: Measure[];
  empty: string;
  said?: ProblemCheckIn;
  asked: string;
  specialist?: React.ReactNode;
  orders: { id: string; text: string; status: string; created: string }[];
  onSaveReview: (v: string) => void;
}) {
  return (
    <article className="sprob" id={`subj-${id}`}>
      <div className="sphead">
        <strong>{title}</strong>
        {code && <span className="ppcode">{code}</span>}
        {chip}
      </div>

      {detail && <p className="spdetail">{detail}</p>}

      <Prose value={review} rows={3} className="prose sreview"
        placeholder="How this has gone across the notes on file. The chart's reading, not theirs."
        onSave={onSaveReview} />

      <Numbers measures={measures} empty={empty} />

      <Said ci={said} asked={asked} />

      {specialist}

      <div className="sord">
        <span className="ppk">Waiting on</span>
        {orders.length === 0
          ? <span className="ppv muted">Nothing outstanding for this.</span>
          : orders.map((o) => (
            <span key={o.id} className="ppv">
              {o.text}
              <span className="muted">
                {o.status === 'draft' ? ' written, not sent' : ` out since ${fmtDate(o.created)}`}
              </span>
            </span>
          ))}
      </div>
    </article>
  );
}

export function Subjective({ patientId, master, onSave, onReview }: {
  patientId: string;
  master?: MasterPlan;
  onSave: (patch: Partial<MasterPlan>) => void;
  /** Generate proposals and open the review drawer. */
  onReview: () => void;
}) {
  const st = useStore();
  const p = st.patient(patientId);
  const conditions = st.conditionsFor(patientId);
  const managed = conditions.filter((c) => c.managed && c.status === 'active');
  const meds = st.medsFor(patientId).filter((m) => m.status !== 'stopped');
  const panels = st.panelsFor(patientId);
  const vitals = st.vitalsFor(patientId);
  const specialists = st.specialistsFor(patientId);
  const prevention = st.preventionFor(patientId);
  const lifestyle = st.lifestyleFor(patientId);
  const orders = st.ordersForPatient(patientId).filter((o) => o.status !== 'done');
  const checkIns = st.checkInsFor(patientId);
  const records = st.encountersFor(patientId).filter((e) => e.status === 'signed').length
    + panels.length + vitals.length + checkIns.length;

  const svc = p?.services ?? { preventative: true, lifestyle: true };
  const S = master?.subjective ?? { history: '', byProblem: {}, goals: '', context: '' };
  const saveStatement = (v: string) => onSave({ subjective: { ...S, history: v } });
  const saveReview = (key: string, v: string) =>
    onSave({ subjective: { ...S, byProblem: { ...S.byProblem, [key]: v } } });

  const forCondition = (id: string) =>
    checkIns.find((c) => c.about.kind === 'condition' && c.about.id === id);
  const forPrevention = (id: string) =>
    checkIns.find((c) => c.about.kind === 'prevention' && c.about.id === id);
  const forLifestyle = (id: string) =>
    checkIns.find((c) => c.about.kind === 'lifestyle' && c.about.id === id);
  const overall = checkIns.find((c) => c.about.kind === 'overall');

  // Services that are actually outstanding. Everything current sits in
  // the prevention drawer; what is due or overdue is being worked on
  // and so belongs on this page.
  const openPrevention: PreventionItem[] = svc.preventative
    ? prevention.filter((x) => x.status !== 'current')
    : [];
  const openLifestyle: LifestyleIntervention[] = svc.lifestyle ? lifestyle : [];

  return (
    <div className="soapbody">
      {/* The opening statement. No heading over it on purpose. */}
      <Prose value={S.history} rows={4} className="prose statement"
        placeholder="Where the work stands today, across all of it. One paragraph."
        onSave={saveStatement} />

      {/*
        * The way in to the summariser, where the summary has nothing
        * to show. A blank paragraph with a placeholder in it reads as
        * a form field nobody filled in, which is the wrong lesson: the
        * point of this paragraph is that it is composed from the
        * record. The button writes a proposal, not the paragraph.
        */}
      {!S.history.trim() && records > 0 && (
        <p className="statementdraft">
          Nothing written here yet. {records} record{records === 1 ? '' : 's'} on file.{' '}
          <button className="linkish" onClick={onReview}>Draft it from the record</button>
        </p>
      )}

      {managed.length === 0 && openPrevention.length === 0 && openLifestyle.length === 0 && (
        <p className="snone">
          Nothing is being managed here yet. The problem list is history only.
        </p>
      )}

      {managed.map((c) => {
        const mine = meds.filter((m) => m.indication === c.name);
        const sp = specialistsAbout(c.name, specialists);
        return (
          <Item
            key={c.id} id={c.id} title={c.name} code={c.code || undefined}
            chip={<Chip tone={trendTone(c.trend)}>{TREND_LABEL[c.trend ?? 'not-assessed']}</Chip>}
            review={S.byProblem[c.id] ?? ''}
            measures={measuresAbout(c.name, panels, vitals)}
            empty="No tracking measure on file for this. Not the same as a normal one."
            said={forCondition(c.id)}
            asked="They are asked about each problem before every visit."
            orders={ordersAbout(c.name, orders, mine)}
            onSaveReview={(v) => saveReview(c.id, v)}
            specialist={sp.length > 0 && (
              <div className="sspec">
                <span className="ppk">From the specialist</span>
                {sp.map((x) => (
                  <span key={x.id} className="ppv">
                    {x.name}, {x.specialty}
                    {x.lastSeen && <span className="muted"> seen {fmtDate(x.lastSeen)}</span>}
                    <span className="spq">{x.findings}</span>
                    {x.outstanding && x.outstanding !== 'None.' && (
                      <span className="spo">Outstanding: {x.outstanding}</span>
                    )}
                  </span>
                ))}
              </div>
            )}
          />
        );
      })}

      {openPrevention.map((item) => (
        <Item
          key={item.id} id={item.id} title={item.name}
          chip={<Chip tone={item.status === 'overdue' ? 'crit' : 'warn'}>
            {item.status === 'overdue' ? 'Overdue' : 'Due'}
          </Chip>}
          review={S.byProblem[`prevention:${item.id}`] ?? ''}
          measures={[
            ...(item.lastDone
              ? [{ label: 'Last done', value: fmtDate(item.lastDone), date: '' }]
              : []),
            ...(item.dueBy
              ? [{ label: item.status === 'overdue' ? 'Was due' : 'Due', value: fmtDate(item.dueBy), date: '' }]
              : []),
          ]}
          empty="Never done in this chart, and no due date set."
          said={forPrevention(item.id)}
          asked="Worth asking what is actually in the way."
          orders={orders.filter((o) => o.text.toLowerCase()
            .includes(item.name.toLowerCase().split(' ')[0]))}
          onSaveReview={(v) => saveReview(`prevention:${item.id}`, v)}
        />
      ))}

      {openLifestyle.map((li) => {
        const aimed = li.forConditions
          .map((cid) => conditions.find((c) => c.id === cid)?.name)
          .filter(Boolean);
        return (
          <Item
            key={li.id} id={li.id}
            title={LIFESTYLE_DOMAINS.find((d) => d.id === li.domain)?.label ?? li.domain}
            chip={<>
              <Chip tone={li.status === 'struggling' ? 'crit'
                : li.status === 'achieved' ? 'ok'
                  : li.status === 'not-started' ? 'warn' : undefined}>
                {LIFESTYLE_STATUS_LABEL[li.status]}
              </Chip>
              {aimed.length > 0 && <span className="ppintent">for {aimed.join(', ')}</span>}
            </>}
            detail={li.barrier ? `${li.prescription} ${li.barrier}` : li.prescription}
            review={S.byProblem[`lifestyle:${li.id}`] ?? ''}
            measures={[
              { label: 'Prescribed', value: fmtDate(li.started), date: '' },
              ...(li.reviewed
                ? [{ label: 'Reviewed', value: fmtDate(li.reviewed), date: '' }]
                : []),
            ]}
            empty="Not reviewed since it was prescribed."
            said={forLifestyle(li.id)}
            asked="Asked whether the prescription is being done as written."
            orders={[]}
            onSaveReview={(v) => saveReview(`lifestyle:${li.id}`, v)}
          />
        );
      })}

      {/* ----------------------------------------- their health, overall */}
      <article className="sprob soverall">
        <div className="sphead">
          <strong>Their health overall, in their words</strong>
        </div>
        {overall
          ? <Said ci={overall} asked="" />
          : (
            <p className="snone">
              No overall answer on file. This is the question asked before every
              visit, and the one that puts the rest in proportion.
            </p>
          )}
        {S.goals.trim() && <p className="sgoal">{S.goals}</p>}
      </article>
    </div>
  );
}
