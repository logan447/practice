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
import { emLevel, PROGRAM_LABEL } from '../../lib/billing';
import { MONTH_STATUS_LABEL } from '../../lib/monthly';
import { awvEligibility, awvElements, NOT_A_PHYSICAL } from '../../lib/awv';
import type { CareProgram, MonthStatus } from '../../domain/types';

/** The programmes a month can be evaluated for, in the order they are read. */
const PROGRAMS: CareProgram[] = ['ccm', 'bhi', 'apcm'];
const RUNGS: MonthStatus[] = ['recorded', 'threshold', 'requirements', 'ready', 'claimed'];

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

/** "November 2026" from "2026-11". */
const monthName = (m: string) => `${MONTHS[Number(m.slice(5, 7)) - 1]} ${m.slice(0, 4)}`;

export function Documentation({ patientId }: { patientId: string }) {
  const st = useStore();
  const encounters = st.encountersFor(patientId).filter((e) => e.status === 'signed');
  const month = st.now.slice(0, 7);
  const log = st.careLogFor(patientId, month);
  const conditions = st.conditionsFor(patientId);

  const claims = st.claimsFor(patientId);
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
      {PROGRAMS.map((prog) => {
        const m = st.monthFor(patientId, prog, month);
        // A programme nobody consented to and nobody worked on is not
        // a month with nothing in it. It is a service this patient is
        // not on, and a list of its unmet requirements would be noise.
        const started = st.consentsFor(patientId).some((c) => c.program === prog && !c.revoked);
        if (!started && m.countableMinutes === 0 && m.excludedMinutes === 0) return null;
        const mandatory = m.checks.filter((c) => c.mandatory);
        const blocking = mandatory.filter((c) => !c.met);
        return (
          <Panel key={prog} title={`${PROGRAM_LABEL[prog]}, ${monthName(month)}`}
            right={<Chip tone={
              m.status === 'ready' || m.status === 'claimed' ? 'ok'
                : m.status === 'requirements' ? 'accent' : 'warn'
            }>{MONTH_STATUS_LABEL[m.status]}</Chip>}>
            <div className="ladder">
              {(['recorded', 'threshold', 'requirements', 'ready', 'claimed'] as const).map((rung) => (
                <span key={rung}
                  className={`rung${RUNGS.indexOf(rung) <= RUNGS.indexOf(m.status) ? ' on' : ''}`}>
                  {MONTH_STATUS_LABEL[rung]}
                </span>
              ))}
            </div>

            <p className="small muted" style={{ margin: '10px 0' }}>
              {m.countableMinutes} countable minutes
              {m.excludedMinutes > 0 && `, ${m.excludedMinutes} recorded but not countable`}
              {m.code && ` · ${m.code}`}
            </p>

            {m.checks.length === 0 ? (
              <Empty>
                No rules are configured for this service yet. See
                docs/systems/billing-architecture.md.
              </Empty>
            ) : (
              <ul className="checklist">
                {m.checks.map((c) => (
                  <li key={c.id} className={c.met ? 'met' : 'unmet'}>
                    <span className="ckmark">{c.met ? '✓' : '·'}</span>
                    <div>
                      <div className="cklabel">
                        {c.label}
                        {!c.mandatory && <span className="ckopt">good practice</span>}
                      </div>
                      <div className="ckevidence">{c.evidence}</div>
                      <div className="ckrule">{c.rule}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="row" style={{ gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              {m.status === 'claimed' ? (
                <span className="small muted">A claim has been prepared for this month.</span>
              ) : m.status === 'ready' ? (
                <>
                  <span className="small muted">
                    Attested by {m.attestedBy} on {fmtDate(m.attestedAt ?? month)}.
                  </span>
                  <button className="btn sm" onClick={() => st.prepareClaim(
                    patientId,
                    { monthlyServiceId: m.id },
                    m.code ?? '',
                    month,
                    conditions.filter((c) => c.managed).map((c) => c.code).filter(Boolean),
                  )}>Prepare the claim</button>
                </>
              ) : blocking.length === 0 && m.checks.length > 0 ? (
                <button className="btn sm"
                  onClick={() => st.attestMonth(patientId, prog, month)}>
                  I have reviewed this month and it is billable
                </button>
              ) : (
                <span className="small muted">
                  {blocking.length} requirement{blocking.length === 1 ? '' : 's'} outstanding,
                  so there is nothing to attest yet.
                </span>
              )}
            </div>
          </Panel>
        );
      })}

      {/* --------------------------------------------- the time entries */}
      <Panel title={`Time log, ${monthName(month)}`} flush>
        {log.length === 0 ? <Empty>Nothing logged this month.</Empty> : (
          <table className="rows">
            <tbody>
              {log.map((e) => (
                <tr key={e.id}>
                  <td className="small muted" style={{ width: 92 }}>{fmtDate(e.date)}</td>
                  <td className="num" style={{ width: 60 }}>{e.minutes} min</td>
                  <td className="small muted" style={{ width: 120 }}>{PROGRAM_LABEL[e.program]}</td>
                  <td>
                    <div className="small">{e.activity}</div>
                    <div className="small muted" style={{ marginTop: 2 }}>
                      {e.by} &middot; {e.role.replace('-', ' ')}
                      {e.planUpdated && ' · care plan updated'}
                    </div>
                    {!e.countable && <div className="excluded">{e.excludedBecause}</div>}
                  </td>
                  <td style={{ width: 92 }}>
                    {e.countable ? <Chip tone="ok">counts</Chip> : <Chip tone="crit">does not</Chip>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>

      {/*
        * The code that was looked at and declined.
        *
        * One sentence rather than a panel of failing checks. A reader
        * should be able to see that the question was asked, without
        * every chart carrying the answer at full length.
        */}
      <p className="small muted" style={{ padding: '0 2px' }}>
        Advanced primary care management is not billed here. All three descriptors read
        {' '}&ldquo;provided by clinical staff&rdquo;, this practice has none, and CMS declined to relax the
        capabilities for small practices and pointed them back to chronic care management (89 FR 97876).
        The reasoning is in docs/systems/billing-architecture.md and D-050.
      </p>

      {claims.length > 0 && (
        <Panel title="Claims prepared" flush>
          <table className="rows">
            <tbody>
              {claims.map((c) => (
                <tr key={c.id}>
                  <td className="small muted" style={{ width: 92 }}>{fmtDate(c.createdAt)}</td>
                  <td><strong>{c.code || 'no code'}</strong></td>
                  <td className="small muted">{c.period}</td>
                  <td className="small muted">{c.diagnoses.join(', ')}</td>
                  <td style={{ width: 92 }}><Chip>{c.status}</Chip></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}

    </div>
  );
}
