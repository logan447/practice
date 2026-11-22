/**
 * Encounters: everything that happened, openable.
 *
 * One line per record, newest first, and opening one puts the
 * original in a sheet over the list rather than a rendering of it on
 * another screen. The reason to open a row is that the summary said
 * something you wanted to check, and checking it should not cost you
 * your place in the list.
 *
 * What used to be here: a row of filter buttons, one per kind of
 * record, and a coloured pill on every line repeating the kind. Both
 * are gone. The kinds are visits, updates, messages, results and
 * specialist letters, and a physician scanning a chart is reading
 * dates and names, not sorting by type.
 */
import { useState } from 'react';
import { useStore } from '../../lib/store';
import { useNav } from '../../lib/nav';
import { fmtDate } from '../../lib/format';
import { timeline, TIMELINE_LABEL } from '../../lib/timeline';
import type { TimelineItem } from '../../lib/timeline';
import { hhmm } from '../../domain/schedule';
import { FEELING_LABEL, ON_PLAN_LABEL } from '../../domain/types';
import { Row, Sheet, NoRows } from './Rows';

export function useTimeline(patientId: string) {
  const st = useStore();
  const p = st.patient(patientId);
  return timeline({
    patientId,
    encounters: st.encountersFor(patientId),
    updates: st.updatesFor(patientId),
    checkIns: st.checkInsFor(patientId),
    messages: st.messagesFor(patientId),
    requests: st.requestsFor(patientId),
    specialists: st.specialistsFor(patientId),
    panels: st.panelsFor(patientId),
    patientName: p?.preferredName ?? p?.name ?? 'The patient',
  });
}

/** The body of one record, in its own shape. */
function Record({ patientId, item }: { patientId: string; item: TimelineItem }) {
  const st = useStore();

  if (item.kind === 'visit' || item.kind === 'booked') {
    const e = st.encounter(item.id);
    if (!e) return null;
    const n = e.note;
    return (
      <div className="recbody">
        <div className="recmeta">
          {fmtDate(e.date)}{e.start !== undefined && ` at ${hhmm(e.start)}`}
          {e.duration && ` · ${e.duration} min`}
          {e.signedAt && ` · signed ${fmtDate(e.signedAt)}`}
        </div>
        {n ? (
          <>
            {n.subjective.additional && <p><b>S.</b> {n.subjective.additional}</p>}
            {n.objective.vitals && <p><b>O.</b> {n.objective.vitals} {n.objective.exam}</p>}
            {n.assessment.overall && <p><b>A.</b> {n.assessment.overall}</p>}
            {n.plan.overall && <p><b>P.</b> {n.plan.overall}</p>}
          </>
        ) : <p className="muted">Not held yet, so there is no note.</p>}
      </div>
    );
  }

  if (item.kind === 'update') {
    const u = st.updatesFor(patientId).find((x) => x.id === item.id);
    const req = st.requestsFor(patientId).find((r) => r.id === u?.requestId);
    const answers = st.checkInsFor(patientId).filter((c) => c.updateId === item.id);
    const conditions = st.conditionsFor(patientId);
    const lifestyle = st.lifestyleFor(patientId);
    const prevention = st.preventionFor(patientId);
    const nameFor = (a: typeof answers[number]) => {
      const about = a.about;
      if (about.kind === 'condition') {
        return conditions.find((c) => c.id === about.id)?.name ?? 'A problem';
      }
      if (about.kind === 'lifestyle') {
        return lifestyle.find((l) => l.id === about.id)?.prescription.split('.')[0] ?? 'A prescription';
      }
      if (about.kind === 'prevention') {
        return prevention.find((x) => x.id === about.id)?.name ?? 'A service';
      }
      return 'Their health overall';
    };
    return (
      <div className="recbody">
        <div className="recmeta">{fmtDate(item.date)}</div>
        {req && (
          <p className="recask">
            <b>We asked, {fmtDate(req.sent)}:</b> {req.prompt}
          </p>
        )}
        {u?.overall && <p className="said">{u.overall}</p>}
        {u?.attachments?.map((a) => <p key={a} className="muted">Attached: {a}</p>)}
        {answers.length === 0 ? <p className="muted">No per problem answers.</p> : (
          <ul className="anslist">
            {answers.map((a) => (
              <li key={a.id}>
                <span className="ansfor">{nameFor(a)}</span>
                <span className="answas">
                  {FEELING_LABEL[a.feeling]}
                  {a.onPlan && ` · ${ON_PLAN_LABEL[a.onPlan]}`}
                </span>
                <span className="anstext">{a.text}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  if (item.kind === 'message') {
    const m = st.messagesFor(patientId).find((x) => x.id === item.id);
    if (!m) return null;
    const replies = st.messagesFor(patientId).filter((x) => x.replyTo === m.id);
    return (
      <div className="recbody">
        <div className="recmeta">{m.author} · {fmtDate(m.date)}</div>
        <p className={m.from === 'patient' ? 'said' : ''}>{m.body}</p>
        {replies.map((r) => (
          <div key={r.id} className="reply">
            <div className="recmeta">{r.author} · {fmtDate(r.date)}</div>
            <p className={r.from === 'patient' ? 'said' : ''}>{r.body}</p>
          </div>
        ))}
      </div>
    );
  }

  if (item.kind === 'specialist') {
    const s = st.specialistsFor(patientId).find((x) => x.id === item.id);
    if (!s) return null;
    return (
      <div className="recbody">
        <div className="recmeta">{s.name}, {s.specialty}{s.practice && ` · ${s.practice}`}</div>
        {s.findings && <p><b>Found.</b> {s.findings}</p>}
        {s.recommendations && <p><b>Advised.</b> {s.recommendations}</p>}
        {s.outstanding && s.outstanding !== 'None.' && (
          <p className="pconflict">Outstanding: {s.outstanding}</p>
        )}
      </div>
    );
  }

  const panels = st.panelsFor(patientId).filter((p) => `labs-${p.date}` === item.id);
  return (
    <div className="recbody">
      <div className="recmeta">{fmtDate(item.date)}{panels[0]?.from && ` · ${panels[0].from}`}</div>
      {panels.map((p) => (
        <p key={p.id}>
          <b>{p.name}.</b>{' '}
          {p.values.map((v) => `${v.key} ${v.value}${v.unit ? ` ${v.unit}` : ''}`).join(', ')}
        </p>
      ))}
    </div>
  );
}

export function EncountersDrawer({ patientId, focus }: {
  patientId: string;
  /** A record id to open on, when arriving from a source link. */
  focus?: string;
  /** Kept for callers that still pass it; the list no longer navigates. */
  onDone?: () => void;
}) {
  const st = useStore();
  const nav = useNav();
  const items = useTimeline(patientId);
  const [open, setOpen] = useState<string | null>(focus ?? null);
  const sel = items.find((i) => i.id === open);
  const enc = sel && (sel.kind === 'visit' || sel.kind === 'booked')
    ? st.encounter(sel.id) : undefined;

  return (
    <>
      {items.length === 0 ? <NoRows>Nothing on file.</NoRows> : (
        <div className="grprows">
          {items.map((i) => (
            <Row key={i.id} when={fmtDate(i.date)} tag={TIMELINE_LABEL[i.kind]}
              name={i.title} onOpen={() => setOpen(i.id)} />
          ))}
        </div>
      )}

      {sel && (
        <Sheet title={sel.title} sub={`${TIMELINE_LABEL[sel.kind]} · ${fmtDate(sel.date)}`}
          onClose={() => setOpen(null)}
          actions={enc && (
            <button className="btn" onClick={() => nav.go({ name: 'encounter', encounterId: enc.id })}>
              {enc.status === 'signed' ? 'Open the visit' : 'Continue the visit'}
            </button>
          )}>
          <Record patientId={patientId} item={sel} />
        </Sheet>
      )}
    </>
  );
}
