/**
 * Finding the mess, and saying so.
 *
 * A record system's job is not to pretend the data is clean. It is to
 * show you where it is not, so the thing you are about to act on is
 * one you have actually looked at.
 *
 * Every check here corresponds to something that turns up in a real
 * chart on an ordinary day: the same drug on the list twice under two
 * spellings, an allergy that two sources disagree about, a dose that
 * never arrived, a result with no range to judge it by.
 */
import type {
  Allergy, ChartDocument, Condition, Medication, Patient, ResultSeries,
} from '../domain/types';

export type IssueLevel = 'warn' | 'crit';

export interface Issue {
  id: string;
  level: IssueLevel;
  title: string;
  detail: string;
  /** Where to send the clinician to fix it. */
  tab?: 'meds' | 'results' | 'notes' | 'plan' | 'records';
}

/** Loose match: "Lisinopril 10 mg" and "lisinopril 10mg" are the same drug. */
const normalise = (s: string): string =>
  s.toLowerCase().replace(/[^a-z0-9]/g, '');

export function findIssues(input: {
  patient: Patient;
  allPatients: Patient[];
  medications: Medication[];
  allergies: Allergy[];
  conditions: Condition[];
  series: ResultSeries[];
  documents: ChartDocument[];
}): Issue[] {
  const { patient, allPatients, medications, allergies, conditions, series, documents } = input;
  const out: Issue[] = [];

  // --- the same medicine twice
  const active = medications.filter((m) => m.status !== 'stopped');
  const byName = new Map<string, Medication[]>();
  for (const m of active) {
    const k = normalise(m.name);
    byName.set(k, [...(byName.get(k) ?? []), m]);
  }
  for (const [, group] of byName) {
    if (group.length < 2) continue;
    out.push({
      id: `dup-med-${group[0].id}`, level: 'crit', tab: 'meds',
      title: `${group[0].name} is on the list twice`,
      detail: group.map((m) => `"${m.name} ${m.dose}" from ${m.provenance.by}`).join(' and ')
        + '. Reconcile before prescribing.',
    });
  }

  // --- an allergy two sources disagree about
  const bySub = new Map<string, Allergy[]>();
  const alias = (s: string) => {
    const n = normalise(s);
    return n === 'pcn' ? 'penicillin' : n;
  };
  for (const a of allergies) {
    const k = alias(a.substance);
    bySub.set(k, [...(bySub.get(k) ?? []), a]);
  }
  for (const [, group] of bySub) {
    if (group.length < 2) continue;
    const severities = [...new Set(group.map((a) => a.severity))];
    if (severities.length < 2) continue;
    out.push({
      id: `allergy-${group[0].id}`, level: 'crit',
      title: `${group[0].substance}: the record disagrees with itself`,
      detail: group.map((a) => `${a.provenance.by} recorded ${a.severity}, "${a.reaction}"`).join('; ')
        + '. Treat as the worse of the two until confirmed with the patient.',
    });
  }

  // --- a medicine with no dose
  for (const m of active.filter((x) => !x.dose.trim())) {
    out.push({
      id: `nodose-${m.id}`, level: 'warn', tab: 'meds',
      title: `${m.name} has no dose recorded`,
      detail: `Arrived from ${m.provenance.by} without one. Ask the patient or the pharmacy.`,
    });
  }

  // --- results with nothing to judge them against
  // Only outside results. A weight with no reference range is not a
  // defect; an outside A1c with none is, because nothing can flag it.
  const noRange = series.filter((s) =>
    s.from && s.refLow === undefined && s.refHigh === undefined);
  if (noRange.length > 0) {
    out.push({
      id: 'norange', level: 'warn', tab: 'results',
      title: `${noRange.length} outside result${noRange.length > 1 ? 's have' : ' has'} no reference range`,
      detail: `${noRange.map((s) => `${s.name} from ${s.from}`).join(', ')}. The sending lab did not include one, so nothing in these is flagged automatically and the trend is the only thing to read them by.`,
    });
  }

  // --- a drug that predates the problem it treats
  for (const m of active) {
    if (!m.indication) continue;
    const c = conditions.find((x) => x.name === m.indication);
    if (c && m.started < c.onset) {
      out.push({
        id: `order-${m.id}`, level: 'warn', tab: 'meds',
        title: `${m.name} predates the problem it is for`,
        detail: `Started ${m.started}, but ${c.name} was first recorded ${c.onset}. One of the two dates is wrong.`,
      });
    }
  }

  // --- a document nobody could read
  const failed = documents.filter((d) => d.status === 'failed');
  const scanned = documents.filter((d) => d.status === 'scanned' && !d.reviewed);
  if (failed.length > 0) {
    out.push({
      id: 'docfail', level: 'warn', tab: 'records',
      title: `${failed.length} outside record${failed.length > 1 ? 's' : ''} failed to read`,
      detail: `From ${[...new Set(failed.map((d) => d.from))].join(', ')}. The file is there; the text is not. Nothing in it has been searched or summarised.`,
    });
  }
  if (scanned.length > 0) {
    out.push({
      id: 'docscan', level: 'warn', tab: 'records',
      title: `${scanned.length} scanned record${scanned.length > 1 ? 's' : ''} not yet read`,
      detail: 'Images only. No text, so nothing in them reaches search, the chart review or the assistant.',
    });
  }

  // --- possibly the same person, twice
  // Same birthday, same surname, same first initial. Deliberately loose,
  // because the cost of asking is small and the cost of two charts is not.
  const surname = (s: string) => normalise(s.trim().split(/\s+/).pop() ?? '');
  const initial = (s: string) => normalise(s).slice(0, 1);
  const twin = allPatients.find((p) =>
    p.id !== patient.id && p.dob === patient.dob
    && surname(p.name) === surname(patient.name)
    && initial(p.name) === initial(patient.name));
  if (twin) {
    out.push({
      id: `dup-${twin.id}`, level: 'crit',
      title: 'There may be a second chart for this person',
      detail: `"${twin.name}" has the same date of birth and a similar name. Merge or rule out before relying on either record.`,
    });
  }

  return out;
}
