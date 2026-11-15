/**
 * Objective, in the order it gets read.
 *
 * Vitals, then the labs as a fishbone, then the examination, then
 * everything else. The order is not arbitrary: it goes from what is
 * true of the patient right now to what was found when somebody
 * looked, which is how the question is actually asked.
 *
 * Two deliberate refusals.
 *
 * The fishbone shows the current value and the one before it, and
 * nothing else. Trends live in the right panel. A trend inside the
 * Objective section turns a page you scan into a page you study.
 *
 * The examination is shown on the date it was performed, and when
 * that date is older than the last visit the screen says so. An
 * examination carried forward is a false record, and copied-forward
 * normals are the most common thing an auditor finds.
 */
import { useStore } from '../../lib/store';
import { fmtDate, relative } from '../../lib/format';
import type { LabPanel, LabValue, VitalsSet } from '../../domain/types';

const GROUP_ORDER: { group: LabPanel['group']; label: string }[] = [
  { group: 'metabolic', label: 'Diabetes' },
  { group: 'cmp', label: 'Chemistry' },
  { group: 'bmp', label: 'Chemistry' },
  { group: 'cbc', label: 'Blood count' },
  { group: 'lipid', label: 'Lipids' },
  { group: 'thyroid', label: 'Thyroid' },
  { group: 'other', label: 'Other' },
];

/** The classic shapes. Keys the fishbone knows how to lay out. */
const FISHBONE: Record<string, string[][]> = {
  cbc: [['WBC', 'Hgb', 'Hct', 'Plt']],
  cmp: [['Na', 'K', 'Cl', 'CO2', 'BUN', 'Cr', 'Glu'], ['eGFR', 'ALT', 'AST', 'Alb']],
  bmp: [['Na', 'K', 'Cl', 'CO2', 'BUN', 'Cr', 'Glu']],
  lipid: [['TC', 'LDL', 'HDL', 'TG']],
  metabolic: [['A1c', 'UACR']],
  thyroid: [['TSH']],
};

export function Objective({ patientId, onOpen }: {
  patientId: string;
  onOpen: (what: 'results' | 'notes' | 'studies') => void;
}) {
  const st = useStore();
  const vitals = st.vitalsFor(patientId);
  const panels = st.panelsFor(patientId);
  const exams = st.examsFor(patientId);
  const studies = st.studiesFor(patientId);
  const encounters = st.encountersFor(patientId).filter((e) => e.status === 'signed');

  const office = vitals.filter((v) => v.source === 'office');
  const home = vitals.filter((v) => v.source === 'home');
  const lastOffice = office[0];
  const lastHome = home[0];

  // One fishbone per group, built from the most recent panel in it.
  const latestByGroup = new Map<string, { now: LabPanel; before?: LabPanel }>();
  for (const g of GROUP_ORDER) {
    const inGroup = panels.filter((p) => p.group === g.group);
    if (inGroup.length === 0) continue;
    if (!latestByGroup.has(g.group)) {
      latestByGroup.set(g.group, { now: inGroup[0], before: inGroup[1] });
    }
  }

  const exam = exams[0];
  const priorExam = exams[1];
  const lastVisit = encounters[0];
  const examStale = !!exam && !!lastVisit && exam.date < lastVisit.date;

  return (
    <div className="soapbody">
      {/* --------------------------------------------------- A. vitals */}
      <div className="derived">
        <div className="dhead"><span>Vitals</span></div>
        {!lastOffice && !lastHome ? (
          <div className="dline muted">No vitals recorded.</div>
        ) : (
          <div className="vitrow">
            {lastOffice && <VitalBlock v={lastOffice} label="Office" prev={office[1]} />}
            {lastHome && <VitalBlock v={lastHome} label="Home" prev={home[1]} home />}
          </div>
        )}
      </div>

      {/* ------------------------------------------------- B. fishbone */}
      <div className="derived">
        <div className="dhead">
          <span>Key labs</span>
          <button className="linkish" onClick={() => onOpen('results')}>All results</button>
        </div>
        {latestByGroup.size === 0 ? (
          <div className="dline muted">No laboratory results on file.</div>
        ) : (
          <div className="bones">
            {GROUP_ORDER.filter((g) => latestByGroup.has(g.group)).map((g) => {
              const { now, before } = latestByGroup.get(g.group)!;
              return (
                <Fishbone key={g.group} label={g.label} now={now} before={before} />
              );
            })}
          </div>
        )}
      </div>

      {/* ----------------------------------------------------- C. exam */}
      <div className="derived">
        <div className="dhead">
          <span>Physical examination</span>
          {exam && <span className="small muted">{fmtDate(exam.date)}</span>}
        </div>
        {!exam ? (
          <div className="dline muted">
            No examination documented. Not the same as a normal examination.
          </div>
        ) : (
          <>
            {examStale && (
              <p className="examwarn">
                Last performed {relative(exam.date)}, before the visit on{' '}
                {fmtDate(lastVisit!.date)}. Nothing here was examined since.
              </p>
            )}
            <div className="examlist">
              {exam.findings.map((f) => {
                const was = priorExam?.findings.find((x) => x.system === f.system);
                const changed = was && was.text !== f.text;
                return (
                  <div key={f.system} className={`examrow${changed ? ' changed' : ''}`}>
                    <span className="esys">{f.system}</span>
                    <span className="etext">
                      {f.text}
                      {changed && (
                        <span className="ewas">was: {was!.text} ({fmtDate(priorExam!.date)})</span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ---------------------------------------------- D. diagnostics */}
      <div className="derived">
        <div className="dhead">
          <span>Other diagnostics</span>
          {studies.length > 3 && (
            <button className="linkish" onClick={() => onOpen('studies')}>All {studies.length}</button>
          )}
        </div>
        {studies.length === 0 ? (
          <div className="dline muted">None on file.</div>
        ) : (
          studies.filter((d) => d.significant).concat(
            studies.filter((d) => !d.significant),
          ).slice(0, 4).map((d) => (
            <div key={d.id} className="dxrow">
              <span className="dxdate">{fmtDate(d.date)}</span>
              <span>
                <b>{d.name}.</b> {d.impression}
                {d.from && <span className="muted"> {d.from}</span>}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function VitalBlock({ v, label, prev, home }: {
  v: VitalsSet; label: string; prev?: VitalsSet; home?: boolean;
}) {
  const items: [string, string, string | undefined][] = [
    ['BP', v.systolic ? `${v.systolic}/${v.diastolic}` : '', prev?.systolic ? `${prev.systolic}/${prev.diastolic}` : undefined],
    ['HR', v.heartRate ? String(v.heartRate) : '', prev?.heartRate ? String(prev.heartRate) : undefined],
    ['Weight', v.weightLb ? `${v.weightLb} lb` : '', prev?.weightLb ? `${prev.weightLb} lb` : undefined],
    ['BMI', v.bmi ? String(v.bmi) : '', prev?.bmi ? String(prev.bmi) : undefined],
    ['SpO2', v.spo2 ? `${v.spo2}%` : '', undefined],
    ['Temp', v.temperatureF ? `${v.temperatureF}°F` : '', undefined],
  ];
  return (
    <div className={`vitblock${home ? ' home' : ''}`}>
      <div className="vhead">
        {label} <span className="muted">{fmtDate(v.date)}</span>
      </div>
      <div className="vitems">
        {items.filter(([, val]) => val).map(([k, val, was]) => (
          <div key={k} className="vitem">
            <span className="vk">{k}</span>
            <span className="vv">{val}</span>
            {was && was !== val && <span className="vwas">({was})</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Current value large, the one before it in parentheses.
 *
 * The parenthesis is the whole point of a fishbone: a number without
 * its predecessor tells you where the patient is but not which way
 * they are going, and almost every decision turns on the second one.
 */
function Fishbone({ label, now, before }: { label: string; now: LabPanel; before?: LabPanel }) {
  const rows = FISHBONE[now.group] ?? [[...new Set(now.values.map((v) => v.key))]];
  const get = (p: LabPanel | undefined, key: string): LabValue | undefined =>
    p?.values.find((v) => v.key === key);

  return (
    <div className="bone">
      <div className="bhead">
        <span className="blabel">{label}</span>
        <span className="bdate">{fmtDate(now.date)}</span>
        {before && <span className="bprev">prev {fmtDate(before.date)}</span>}
        {now.from && <span className="bfrom">{now.from}</span>}
      </div>
      {rows.map((row, i) => (
        <div key={i} className="brow">
          {row.map((key) => {
            const v = get(now, key);
            if (!v) return null;
            const was = get(before, key);
            return (
              <div key={key} className="bcell">
                <span className="bk">{key}</span>
                <span className={`bv${v.flag !== 'normal' ? ` f-${v.flag}` : ''}`}>{v.value}</span>
                {was && <span className="bw">({was.value})</span>}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
