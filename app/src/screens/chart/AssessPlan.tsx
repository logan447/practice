/**
 * Assessment and Plan, as structure rather than prose.
 *
 * The assessment is a gauge per problem. Improving, stable,
 * worsening, or not yet assessed. Almost all of the clinical meaning
 * of an assessment is in that one word, and storing it as data rather
 * than burying it in a paragraph is what lets the plan underneath
 * know what it is for: hold, push, or change course.
 *
 * Preventative services get the same treatment, as up to date or not
 * and on what. So does lifestyle, which is prescribed here rather
 * than discussed: a coded domain, a specific ask, and a status
 * somebody has to keep current.
 *
 * Free text is still everywhere, underneath. The structure is what
 * can be counted and the prose is what explains it, and a chart that
 * only has one of the two is missing the half that matters.
 */
import { useState } from 'react';
import { useStore } from '../../lib/store';
import { Chip } from '../../components/ui';
import { fmtDate } from '../../lib/format';
import {
  TREND_LABEL, INTENT_FOR, LIFESTYLE_DOMAINS, LIFESTYLE_STATUS_LABEL,
  type Condition, type ConditionTrend, type LifestyleIntervention,
  type LifestyleStatus, type MasterPlan,
} from '../../domain/types';

const TRENDS: ConditionTrend[] = ['improving', 'stable', 'worsening', 'not-assessed'];

const trendTone = (t?: ConditionTrend) =>
  (t === 'worsening' ? 'crit' : t === 'improving' ? 'ok' : t === 'stable' ? undefined : 'warn');

/* ========================================================= assessment */

export function Assessment({ patientId, prose }: {
  patientId: string;
  prose: React.ReactNode;
}) {
  const st = useStore();
  const conditions = st.conditionsFor(patientId);
  const managed = conditions.filter((c) => c.managed && c.status === 'active');
  const prevention = st.preventionFor(patientId);
  const lifestyle = st.lifestyleFor(patientId);
  const p = st.patient(patientId);
  const svc = p?.services ?? { preventative: true, lifestyle: true };

  const behind = prevention.filter((x) => x.status === 'overdue' || x.status === 'due');
  const current = prevention.filter((x) => x.status === 'current');

  return (
    <div className="soapbody">
      <div className="gauges">
        {managed.length === 0 && <p className="small muted">No problems are being managed here.</p>}
        {managed.map((c) => <Gauge key={c.id} c={c} />)}
      </div>

      {svc.preventative && (
        <div className="derived">
          <div className="dhead">
            <span>Preventative services</span>
            {/*
              * An empty schedule is not an up to date one. Saying "up
              * to date" over a chart with nothing on it is the same
              * failure as rendering a missing examination as normal.
              */}
            <Chip tone={current.length === 0 && behind.length === 0 ? 'warn'
              : behind.length === 0 ? 'ok' : 'warn'}>
              {current.length === 0 && behind.length === 0 ? 'Not started'
                : behind.length === 0 ? 'Up to date' : `${behind.length} outstanding`}
            </Chip>
          </div>
          {behind.length === 0 ? (
            <div className="dline muted">
              {current.length > 0
                ? `All current: ${current.map((x) => x.name).join(', ')}.`
                : 'Nothing scheduled yet. Nothing has been assessed as due or not due.'}
            </div>
          ) : (
            behind.map((x) => (
              <div key={x.id} className="dline">
                <Chip tone={x.status === 'overdue' ? 'crit' : 'warn'}>{x.status}</Chip>
                {x.name}
                {x.dueBy && <span className="muted small">due {fmtDate(x.dueBy)}</span>}
                {x.note && <span className="muted small">{x.note}</span>}
              </div>
            ))
          )}
        </div>
      )}

      {svc.lifestyle && (
        <div className="derived">
          <div className="dhead">
            <span>Lifestyle medicine</span>
            <Chip tone={lifestyle.some((l) => l.status === 'struggling') ? 'warn' : undefined}>
              {lifestyle.filter((l) => l.status === 'achieved').length} of {lifestyle.length} achieved
            </Chip>
          </div>
          {lifestyle.length === 0 ? (
            <div className="dline muted">Nothing prescribed yet.</div>
          ) : lifestyle.map((l) => (
            <div key={l.id} className="dline">
              <span className="lsdom">
                {LIFESTYLE_DOMAINS.find((d) => d.id === l.domain)?.label}
              </span>
              <Chip tone={l.status === 'struggling' ? 'warn' : l.status === 'achieved' ? 'ok' : undefined}>
                {LIFESTYLE_STATUS_LABEL[l.status]}
              </Chip>
              <span style={{ flex: 1 }}>{l.prescription}</span>
            </div>
          ))}
        </div>
      )}

      <div>{prose}</div>
    </div>
  );
}

function Gauge({ c }: { c: Condition }) {
  const st = useStore();
  const [open, setOpen] = useState(false);
  return (
    <div className="gauge">
      <div className="grow">
        <span className="gname">{c.name}</span>
        <button className="gpill" onClick={() => setOpen((v) => !v)}>
          <Chip tone={trendTone(c.trend)}>{TREND_LABEL[c.trend ?? 'not-assessed']}</Chip>
        </button>
        {c.trendAssessed && <span className="gwhen">{fmtDate(c.trendAssessed)}</span>}
      </div>
      {c.trendNote && <p className="gnote">{c.trendNote}</p>}
      {open && (
        <div className="row flow" style={{ gap: 6, marginTop: 7 }}>
          {TRENDS.map((t) => (
            <button key={t}
              className={`btn sm ${c.trend === t ? '' : 'ghost'}`}
              onClick={() => { st.setTrend(c.id, t); setOpen(false); }}>
              {TREND_LABEL[t]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* =============================================================== plan */

export function Plan({ patientId, master, onSetProblem, prose }: {
  patientId: string;
  master?: MasterPlan;
  onSetProblem: (conditionId: string, text: string) => void;
  /** The free-text blocks, passed in so the editor stays in one place. */
  prose: {
    problem: (conditionId: string, value: string, onSave: (v: string) => void) => React.ReactNode;
    prevention: React.ReactNode;
    lifestyle: React.ReactNode;
  };
}) {
  const st = useStore();
  const conditions = st.conditionsFor(patientId);
  const managed = conditions.filter((c) => c.managed && c.status === 'active');
  const meds = st.medsFor(patientId).filter((m) => m.status !== 'stopped');
  const orders = st.ordersForPatient(patientId).filter((o) => o.status !== 'done');
  const specialists = st.specialistsFor(patientId);
  const prevention = st.preventionFor(patientId);
  const lifestyle = st.lifestyleFor(patientId);
  const p = st.patient(patientId);
  const svc = p?.services ?? { preventative: true, lifestyle: true };
  const P = {
    byProblem: master?.plan?.byProblem ?? {},
    prevention: master?.plan?.prevention ?? '',
    lifestyle: master?.plan?.lifestyle ?? '',
    followUp: master?.plan?.followUp ?? '',
  };

  /** Orders that are prevention rather than problem-directed. */
  const preventiveOrders = orders.filter((o) =>
    o.kind === 'imaging' || o.kind === 'referral' || /screen|mammo|colonos|dexa|eye/i.test(o.text));

  return (
    <div className="soapbody">
      {managed.map((c) => {
        const mine = meds.filter((m) => m.indication === c.name);
        const myOrders = orders.filter((o) => !preventiveOrders.includes(o)
          && (o.text.toLowerCase().includes(c.name.split(' ')[0].toLowerCase())
            || mine.some((m) => o.text.toLowerCase().includes(m.name.toLowerCase()))));
        const sp = specialists.filter((x) =>
          c.name.toLowerCase().includes('diabet') ? /endocrin|ophthalm/i.test(x.specialty) : false);
        const intent = INTENT_FOR[c.trend ?? 'not-assessed'];
        return (
          <div key={c.id} className="problemplan" id={`problem-${c.id}`}>
            <div className="pphead">
              <strong>{c.name}</strong>
              {c.code && <span className="ppcode">{c.code}</span>}
              <Chip tone={trendTone(c.trend)}>{TREND_LABEL[c.trend ?? 'not-assessed']}</Chip>
              <span className="ppintent">{intent}</span>
            </div>

            <div className="ppgrid">
              <div>
                <span className="ppk">Medicines</span>
                {mine.length === 0
                  ? <span className="ppv muted">None for this problem.</span>
                  : mine.map((m) => (
                    <span key={m.id} className="ppv">{m.name} {m.dose}
                      <span className="muted"> {m.sig}</span>
                    </span>
                  ))}
              </div>
              <div>
                <span className="ppk">Testing</span>
                {myOrders.length === 0
                  ? <span className="ppv muted">Nothing outstanding.</span>
                  : myOrders.map((o) => (
                    <span key={o.id} className="ppv">{o.text}
                      {o.status === 'draft' && <span className="muted"> not sent</span>}
                    </span>
                  ))}
              </div>
              {sp.length > 0 && (
                <div>
                  <span className="ppk">Specialist</span>
                  {sp.map((x) => (
                    <span key={x.id} className="ppv">{x.name}, {x.specialty}
                      {x.outstanding && x.outstanding !== 'None.' && (
                        <span className="muted"> {x.outstanding}</span>
                      )}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/*
              * A problem with no plan says so. An empty box with a
              * placeholder in it reads as a form nobody filled in;
              * this reads as a fact about the chart, which is what it
              * is.
              */}
            {!(P.byProblem[c.id] ?? '').trim() && (
              <p className="ppnone">
                No plan written for this problem{
                  c.trend === 'worsening' ? ', and it is the one going the wrong way' : ''}.
              </p>
            )}
            {prose.problem(c.id, P.byProblem[c.id] ?? '', (v) => onSetProblem(c.id, v))}
          </div>
        );
      })}

      {svc.preventative && (
        <div className="problemplan">
          <div className="pphead">
            <strong>Preventative care</strong>
            <Chip tone={prevention.some((x) => x.status === 'overdue') ? 'crit' : undefined}>
              {prevention.filter((x) => x.status === 'due' || x.status === 'overdue').length} due
            </Chip>
          </div>
          <div className="ppgrid">
            <div>
              <span className="ppk">Outstanding</span>
              {prevention.filter((x) => x.status === 'due' || x.status === 'overdue').length === 0
                ? <span className="ppv muted">Nothing due.</span>
                : prevention.filter((x) => x.status === 'due' || x.status === 'overdue').map((x) => (
                  <span key={x.id} className="ppv">{x.name}
                    <span className="muted"> {x.status}{x.dueBy ? `, ${fmtDate(x.dueBy)}` : ''}</span>
                  </span>
                ))}
            </div>
            <div>
              <span className="ppk">Orders out</span>
              {preventiveOrders.length === 0
                ? <span className="ppv muted">None sent.</span>
                : preventiveOrders.map((o) => (
                  <span key={o.id} className="ppv">{o.text}
                    <span className="muted"> {o.status === 'draft' ? 'not sent' : `sent ${fmtDate(o.created)}`}</span>
                  </span>
                ))}
            </div>
          </div>
          {prose.prevention}
        </div>
      )}

      {svc.lifestyle && (
        <div className="problemplan">
          <div className="pphead">
            <strong>Lifestyle medicine</strong>
            <Chip>{lifestyle.length} prescribed</Chip>
          </div>
          <div className="lslist">
            {lifestyle.length === 0 && (
              <span className="ppv muted">Nothing prescribed yet.</span>
            )}
            {lifestyle.map((l) => <LifestyleRow key={l.id} l={l} conditions={conditions} />)}
          </div>
          <AddLifestyle patientId={patientId} conditions={managed} />
          {prose.lifestyle}
        </div>
      )}
    </div>
  );
}

function LifestyleRow({ l, conditions }: { l: LifestyleIntervention; conditions: Condition[] }) {
  const st = useStore();
  const [open, setOpen] = useState(false);
  const STATUSES: LifestyleStatus[] = ['not-started', 'active', 'struggling', 'achieved'];
  return (
    <div className="lsrow">
      <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
        <span className="lsdom">{LIFESTYLE_DOMAINS.find((d) => d.id === l.domain)?.label}</span>
        <button className="gpill" onClick={() => setOpen((v) => !v)}>
          <Chip tone={l.status === 'struggling' ? 'warn' : l.status === 'achieved' ? 'ok' : undefined}>
            {LIFESTYLE_STATUS_LABEL[l.status]}
          </Chip>
        </button>
        {l.forConditions.length > 0 && (
          <span className="small muted">
            for {l.forConditions.map((id) => conditions.find((c) => c.id === id)?.name)
              .filter(Boolean).join(', ')}
          </span>
        )}
      </div>
      <p className="lstext">{l.prescription}</p>
      {l.barrier && <p className="lsbar">{l.barrier}</p>}
      {open && (
        <div className="row flow" style={{ gap: 6, marginTop: 6 }}>
          {STATUSES.map((s2) => (
            <button key={s2} className={`btn sm ${l.status === s2 ? '' : 'ghost'}`}
              onClick={() => { st.setLifestyleStatus(l.id, s2); setOpen(false); }}>
              {LIFESTYLE_STATUS_LABEL[s2]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function AddLifestyle({ patientId, conditions }: { patientId: string; conditions: Condition[] }) {
  const st = useStore();
  const [open, setOpen] = useState(false);
  const [domain, setDomain] = useState<LifestyleIntervention['domain']>('nutrition');
  const [text, setText] = useState('');
  const [forC, setForC] = useState<string[]>([]);

  if (!open) {
    return <button className="linkish addproblem" onClick={() => setOpen(true)}>+ Prescription</button>;
  }
  return (
    <div className="addproblembox" style={{ maxWidth: 'none', marginTop: 10 }}>
      <div className="row flow" style={{ gap: 6, marginBottom: 9 }}>
        {LIFESTYLE_DOMAINS.map((d) => (
          <button key={d.id} className={`btn sm ${domain === d.id ? '' : 'ghost'}`}
            onClick={() => setDomain(d.id)}>{d.label}</button>
        ))}
      </div>
      <input className="search" value={text} placeholder="What you are actually asking for"
        onChange={(e) => setText(e.target.value)} />
      {conditions.length > 0 && (
        <div className="row flow" style={{ gap: 6, marginTop: 9 }}>
          <span className="small muted" style={{ alignSelf: 'center' }}>For</span>
          {conditions.map((c) => (
            <button key={c.id} className={`btn sm ${forC.includes(c.id) ? '' : 'ghost'}`}
              onClick={() => setForC((f) => (f.includes(c.id)
                ? f.filter((x) => x !== c.id) : [...f, c.id]))}>
              {c.name}
            </button>
          ))}
        </div>
      )}
      <div className="row" style={{ gap: 7, marginTop: 10 }}>
        <button className="btn sm" disabled={!text.trim()} onClick={() => {
          st.addLifestyle(patientId, domain, text.trim(), forC);
          setText(''); setForC([]); setOpen(false);
        }}>Add</button>
        <button className="btn ghost sm" onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </div>
  );
}
