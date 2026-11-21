/**
 * What the patient has told us, since we last sat down.
 *
 * Second in the chart because it is second in a chart review: you
 * read the last note, and then you read everything the patient has
 * said since. Their health updates, their messages, their answers to
 * what we asked. Their words, not a rendering of them.
 *
 * It opens on what they sent rather than on a summary of it. The
 * summary of where they were is the approved care plan, and the
 * approved care plan is read one problem at a time from the right
 * column: repeating it here was the same paragraph twice on one
 * screen.
 */
import { useState } from 'react';
import { useStore } from '../../lib/store';
import { fmtDate } from '../../lib/format';
import { Group, Row, Sheet, NoRows } from './Rows';
import { FEELING_LABEL, ON_PLAN_LABEL, INTERVAL_LABEL } from '../../domain/types';

export function SubjectiveTab({ patientId }: { patientId: string }) {
  const st = useStore();
  const updates = st.updatesFor(patientId);
  const messages = st.messagesFor(patientId).filter((m) => m.from === 'patient');
  const checkIns = st.checkInsFor(patientId);

  const [update, setUpdate] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const u = updates.find((x) => x.id === update);
  const m = messages.find((x) => x.id === message);

  const conditions = st.conditionsFor(patientId);
  const lifestyle = st.lifestyleFor(patientId);
  const prevention = st.preventionFor(patientId);
  const nameFor = (a: typeof checkIns[number]) => {
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
    <>
      <Group title="Patient updates" count={updates.length}>
        {updates.length === 0 ? <NoRows>None on file.</NoRows> : updates.map((x) => (
          <Row key={x.id} name={x.overall ? x.overall.slice(0, 90) : 'Patient update'}
            when={fmtDate(x.date)} note={x.urgent ? 'Urgent' : undefined} warn={x.urgent}
            onOpen={() => setUpdate(x.id)} />
        ))}
      </Group>

      <Group title="Patient inquiries" count={messages.length}>
        {messages.length === 0 ? <NoRows>None on file.</NoRows> : messages.map((x) => (
          <Row key={x.id} name={x.subject ?? x.body.slice(0, 90)} when={fmtDate(x.date)}
            note={x.urgent ? 'Urgent' : undefined} warn={x.urgent}
            onOpen={() => setMessage(x.id)} />
        ))}
      </Group>

      {u && (
        <Sheet title="Patient update" sub={fmtDate(u.date)} onClose={() => setUpdate(null)}>
          {u.overall && <p className="said">{u.overall}</p>}
          {(u.interval ?? []).map((e, i) => (
            <p key={i}><b>{INTERVAL_LABEL[e.kind]}.</b> {e.text}</p>
          ))}
          {checkIns.filter((c) => c.updateId === u.id).map((a) => (
            <div key={a.id} style={{ marginTop: 12 }}>
              <div className="eyebrow" style={{ marginBottom: 3 }}>{nameFor(a)}</div>
              <p style={{ margin: 0 }}>
                <span className="answas">
                  {FEELING_LABEL[a.feeling]}
                  {a.onPlan && ` · ${ON_PLAN_LABEL[a.onPlan]}`}
                </span>
                {a.text}
              </p>
            </div>
          ))}
          {(u.attachments ?? []).map((a) => <p key={a} className="muted">Attached: {a}</p>)}
        </Sheet>
      )}

      {m && (
        <Sheet title={m.subject ?? 'Message'} sub={`${m.author} · ${fmtDate(m.date)}`}
          onClose={() => setMessage(null)}>
          <p className="said">{m.body}</p>
          {st.messagesFor(patientId).filter((r) => r.replyTo === m.id).map((r) => (
            <div key={r.id} className="reply">
              <div className="recmeta">{r.author} · {fmtDate(r.date)}</div>
              <p>{r.body}</p>
            </div>
          ))}
        </Sheet>
      )}
    </>
  );
}
