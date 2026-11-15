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
import { emLevel, monthlyCareTime, PROGRAM_LABEL } from '../../lib/billing';

export function Documentation({ patientId }: { patientId: string }) {
  const st = useStore();
  const encounters = st.encountersFor(patientId).filter((e) => e.status === 'signed');
  const consents = st.consentsFor(patientId);
  const month = st.now.slice(0, 7);
  const log = st.careLogFor(patientId, month);
  const conditions = st.conditionsFor(patientId);
  const master = st.masterPlanFor(patientId);

  const programs = [...new Set(log.map((e) => e.program))];

  return (
    <div className="stack">
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
                gives {lv.byTime}. {lv.byMdm === lv.byTime
                  ? 'Both routes agree.'
                  : `They differ, so which one was used has to be documented, and it was ${em.selectedBy === 'time' ? 'time' : 'decision making'}.`}
              </p>
            </div>
          );
        })}
      </Panel>

      {/* ------------------------------------------ care management time */}
      <Panel title={`Care management time, ${fmtDate(`${month}-01`).slice(3)}`} flush>
        {log.length === 0 ? <Empty>Nothing logged this month.</Empty> : (
          <>
            {programs.map((prog) => {
              const t = monthlyCareTime(log, prog);
              return (
                <div key={prog} className="cmhead">
                  <strong>{PROGRAM_LABEL[prog]}</strong>
                  <span className="cmtime">{t.countable} min countable</span>
                  {t.excluded > 0 && (
                    <span className="cmex">{t.excluded} min excluded</span>
                  )}
                  {t.thresholds.map((th) => (
                    <Chip key={th.label} tone={th.met ? 'ok' : undefined}>
                      {th.label} {th.met ? 'met' : `needs ${th.needs} more`}
                    </Chip>
                  ))}
                </div>
              );
            })}
            <table className="rows">
              <tbody>
                {log.map((e) => (
                  <tr key={e.id}>
                    <td className="small muted" style={{ width: 92 }}>{fmtDate(e.date)}</td>
                    <td className="num" style={{ width: 60 }}>{e.minutes} min</td>
                    <td>
                      <div className="small">{e.activity}</div>
                      <div className="small muted" style={{ marginTop: 2 }}>
                        {e.by} &middot; {e.role.replace('-', ' ')}
                      </div>
                      {!e.countable && (
                        <div className="excluded">{e.excludedBecause}</div>
                      )}
                    </td>
                    <td style={{ width: 92 }}>
                      {e.countable ? <Chip tone="ok">counts</Chip> : <Chip tone="crit">does not</Chip>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </Panel>

      {/* ---------------------------------------------------- consent */}
      <Panel title="Consent" flush>
        {consents.length === 0 ? (
          <Empty>
            No consent on file. Care management cannot be billed without it, and it
            cannot be reconstructed later.
          </Empty>
        ) : consents.map((c) => (
          <div key={c.id} className="listrow" style={{ padding: '12px 16px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="row" style={{ gap: 8 }}>
                <strong>{PROGRAM_LABEL[c.program]}</strong>
                <Chip>{c.method}</Chip>
                <span className="small muted">{fmtDate(c.date)} &middot; {c.by}</span>
              </div>
              <p className="small" style={{ marginTop: 5 }}>{c.note}</p>
            </div>
          </div>
        ))}
      </Panel>

      {/* ------------------------------------------------- the care plan */}
      <Panel title="The care plan requirement">
        <p className="small" style={{ maxWidth: '70ch' }}>
          Care management programmes require a care plan that is documented, shared
          with the patient, and reviewed. The living summary is that plan: it is
          dated, it is organised by problem, and it exports.
        </p>
        <div className="row flow" style={{ gap: 8, marginTop: 11 }}>
          <Chip tone={master ? 'ok' : 'crit'}>
            {master ? `Updated ${fmtDate(master.updated)}` : 'No summary written'}
          </Chip>
          <Chip tone={master?.plan.byProblem && Object.keys(master.plan.byProblem).length > 0 ? 'ok' : 'warn'}>
            {Object.keys(master?.plan.byProblem ?? {}).length} problems with a written plan
          </Chip>
          <Chip tone={master?.plan.followUp ? 'ok' : 'warn'}>
            {master?.plan.followUp ? 'Follow-up stated' : 'No follow-up interval'}
          </Chip>
        </div>
        <p className="small muted" style={{ marginTop: 11, maxWidth: '70ch' }}>
          What this screen cannot tell you is whether the plan was actually given to
          the patient. That is a fact about an event, so it has to be recorded when it
          happens. The export does it; nothing else does.
        </p>
      </Panel>

      <p className="small muted" style={{ maxWidth: '72ch' }}>
        Everything above is this prototype's reading of published guidance, sourced in
        docs/systems/documentation-and-billing.md. Rates, thresholds and the rules
        themselves change yearly. <b>NEEDS-COUNSEL</b> and <b>NEEDS-CPA</b> before any
        of it supports a claim.
      </p>
    </div>
  );
}
