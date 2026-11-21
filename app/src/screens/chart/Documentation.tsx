/**
 * What a biller or an auditor would ask for.
 *
 * This drawer exists because the living summary cannot answer their
 * questions. The summary says where the patient is now; billing asks
 * what happened on a date and what was done in a calendar month.
 * Neither survives being continuously rewritten, so they are kept as
 * their own records and shown here together.
 *
 * Everything on this screen is the prototype's reading of published
 * guidance, with sources in docs/systems/documentation-and-billing.md.
 * NEEDS-COUNSEL and NEEDS-CPA before any of it supports a claim, and
 * this practice may never bill these at all.
 */
import { useStore } from '../../lib/store';
import { Chip, Panel, Empty } from '../../components/ui';
import { fmtDate } from '../../lib/format';
import { kindLabel } from '../../lib/clinical';
import { emLevel } from '../../lib/billing';
import { awvEligibility, awvElements, NOT_A_PHYSICAL } from '../../lib/awv';

/** The programmes a month can be evaluated for, in the order they are read. */


export function Documentation({ patientId }: { patientId: string }) {
  const st = useStore();
  const encounters = st.encountersFor(patientId).filter((e) => e.status === 'signed');
  const conditions = st.conditionsFor(patientId);

  const patient = st.patients.find((p) => p.id === patientId);
  const ms = patient?.medicare;
  const awv = ms ? awvEligibility(st.now, ms) : null;

  return (
    <div className="stack">
      {/* ------------------------------------------- the wellness visit */}
      {/*
        * Shown only for the people it can apply to. Most of this panel
        * is a date calculation, and the part that is not is the point:
        * the element list for a subsequent visit is shorter than the
        * first one, and building it as a copy over-documents a visit
        * that is paid less.
        */}
      {awv && (
        <Panel title="Wellness visit"
          right={<Chip tone={awv.eligible ? 'ok' : 'warn'}>
            {awv.eligible ? `Due, ${awv.code}` : 'Not yet'}
          </Chip>}>
          <p className="small">{awv.reason}</p>
          {awv.nextEligible && (
            <p className="small muted">
              Next billable {fmtDate(awv.nextEligible)}, as {awv.code}.
            </p>
          )}
          <p className="small muted" style={{ marginTop: 8 }}>{NOT_A_PHYSICAL}</p>
          <ul className="checklist" style={{ marginTop: 10 }}>
            {awvElements(ms?.awvOn?.length ? 'subsequent' : 'initial').map((el) => (
              <li key={el.id} className="unmet">
                <span className="ckmark">·</span>
                <div>
                  <div className="cklabel">
                    {el.label}
                    {!el.required && <span className="ckopt">at their discretion</span>}
                    {el.how === 'attested' && <span className="ckopt">you attest</span>}
                  </div>
                  <div className="ckevidence">{el.detail}</div>
                  <div className="ckrule">{el.source}</div>
                </div>
              </li>
            ))}
          </ul>
          {awv.flags.map((f) => (
            <p key={f} className="small muted" style={{ marginTop: 8 }}>{f}</p>
          ))}
        </Panel>
      )}

      {/* ------------------------------------------------- per encounter */}
      <Panel title="Visits, and what each one supports" flush
        right={<span className="small muted">office E/M</span>}>
        {encounters.length === 0 ? <Empty>No signed visits.</Empty> : encounters.map((e) => {
          const em = st.emFor(e.id);
          if (!em) {
            return (
              <div key={e.id} className="listrow" style={{ padding: '12px 16px' }}>
                <div style={{ flex: 1 }}>
                  <strong>{fmtDate(e.date)}</strong>
                  <div className="small muted">{kindLabel(e.kind)}</div>
                </div>
                <Chip tone="warn">Nothing recorded</Chip>
              </div>
            );
          }
          const lv = emLevel(em);
          return (
            <div key={e.id} className="emrow">
              <div className="row" style={{ gap: 9, flexWrap: 'wrap' }}>
                <strong>{fmtDate(e.date)}</strong>
                <span className="small muted">{kindLabel(e.kind)}</span>
                <span className="spacer" />
                {em.code && <Chip tone="ok">{em.code}</Chip>}
                <span className="small muted">
                  chosen by {em.selectedBy === 'time' ? 'time' : 'decision making'}
                </span>
              </div>
              <div className="emgrid">
                <div><span className="k">Problems</span><span className="v">{em.problemsLevel}</span>
                  <span className="d">{em.problemsAddressed
                    .map((id) => conditions.find((c) => c.id === id)?.name ?? id).join(', ')}</span></div>
                <div><span className="k">Data</span><span className="v">{em.dataLevel}</span>
                  <span className="d">{em.dataReviewed.join('; ')}</span></div>
                <div><span className="k">Risk</span><span className="v">{em.riskLevel}</span></div>
                <div><span className="k">Time</span><span className="v">{em.totalMinutes} min</span>
                  <span className="d">on the date of the encounter</span></div>
              </div>
              <p className="emwhy">
                Two of three at {lv.mdmLevel} gives {lv.byMdm}. {em.totalMinutes} minutes
                gives {lv.byTime}.{' '}
                {lv.timeUnknown
                  ? 'The 99213 and 99214 time ranges are CPT content and are not set here, so time cannot settle this visit.'
                  : lv.agree
                    ? 'Both routes agree.'
                    : `They differ, so which one was used has to be documented, and it was ${em.selectedBy === 'time' ? 'time' : 'decision making'}.`}
              </p>
            </div>
          );
        })}
      </Panel>

      {/* --------------------------------------- the month, as a ladder */}
      {/*
        * Four different things, and only the last is a claim: minutes
        * recorded, the threshold reached, every requirement satisfied,
        * a physician having looked and agreed. The evaluation stops at
        * the third. Software that decides a month is billable has made
        * a billing decision on somebody else's licence.
        */}
      {/*
        * What used to be here: chronic care management, behavioural
        * health integration and advanced primary care management, each
        * with a monthly ladder of requirements, a time log and a
        * claim. All three are monthly programmes built around clinical
        * staff and certified technology, and this practice is one
        * physician who does not bill insurance.
        *
        * The research behind them was expensive and it is kept, in
        * docs/systems/billing-architecture.md and D-050. What is kept
        * on the screen is the visit, which is the only thing this
        * practice does.
        */}
      <p className="small muted" style={{ padding: '0 2px' }}>
        Care management programmes are not billed here and are not modelled. Chronic care
        management and behavioural health integration are monthly services built around
        clinical staff and certified technology; this practice has neither. Advanced primary
        care management reads &ldquo;provided by clinical staff&rdquo; in all three descriptors,
        and CMS declined to relax that for small practices (89 FR 97876). The working is in
        docs/systems/billing-architecture.md and D-050.
      </p>

    </div>
  );
}
