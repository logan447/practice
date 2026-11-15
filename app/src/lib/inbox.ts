/**
 * Everything that arrived while nobody was in an encounter.
 *
 * The inbox exists because of one rule the rest of the system is
 * built on: a record arriving does not change the care plan. Someone
 * has to read it and decide. That decision is small and frequent, so
 * it needs somewhere cheap to happen, and the cheap place cannot be a
 * full encounter or it will not happen at all.
 *
 * Three answers and no more. Seen it, it waits for the next booked
 * encounter. Seen it, it cannot wait that long, bring the review
 * forward. Seen it, I need to look at them, book a visit. The thing
 * the inbox must never offer is a fourth answer that quietly edits
 * the chart, because then the approved document starts moving again
 * and nothing downstream can be trusted.
 *
 * Note what triage does not do: it does not mark a record
 * incorporated. An acknowledged result is still waiting to be read
 * into the plan at the next encounter, and it still shows up in the
 * reconciliation tray there. Acknowledging is a promise to the
 * patient, not a substitute for the clinical work.
 */
import type {
  DiagnosticStudy, LabPanel, Message, PatientUpdate, Triage, VitalsSet,
} from '../domain/types';

export type InboxKind = 'message' | 'update' | 'result' | 'study' | 'home';

export interface InboxItem {
  id: string;
  patientId: string;
  kind: InboxKind;
  date: string;
  /** Two or three words. What kind of thing this is. */
  label: string;
  /** One line, enough to triage without opening anything. */
  summary: string;
  urgent: boolean;
  /** The triage decision, where one has been made. */
  triage?: Triage;
}

export interface InboxInput {
  messages: Message[];
  updates: PatientUpdate[];
  panels: LabPanel[];
  studies: DiagnosticStudy[];
  vitals: VitalsSet[];
  triage: Triage[];
  /** The clinic clock. Nothing dated in the future is in the inbox yet. */
  now: string;
  /**
   * The oldest date the inbox reaches back to.
   *
   * The inbox is what arrived, not everything that has never been
   * read into a care plan. Those are different lists with different
   * jobs: a patient with no approved plan at all has years of records
   * waiting to be incorporated, and putting them in the morning's
   * triage queue would bury the message that came in on Saturday.
   * The backlog belongs in the reconciliation tray inside the
   * encounter, where there is time for it.
   */
  since: string;
  /** Ids already folded into an approved care plan. */
  incorporated: Set<string>;
}

const trim = (text: string, max = 150): string => {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length <= max ? clean : `${clean.slice(0, max).trimEnd()}...`;
};

/**
 * The inbox, newest first, urgent first.
 *
 * Urgency sorts above recency because the only failure mode that
 * matters here is a flagged message sitting below two weeks of
 * ordinary results.
 */
export function inbox(i: InboxInput): InboxItem[] {
  const tri = new Map(i.triage.map((t) => [t.recordId, t]));
  const out: InboxItem[] = [];
  const arrived = (date: string) => date <= i.now && date >= i.since;

  for (const m of i.messages) {
    if (m.from !== 'patient' || !arrived(m.date)) continue;
    out.push({
      id: m.id, patientId: m.patientId, kind: 'message', date: m.date,
      label: 'Message', summary: trim(m.body), urgent: !!m.urgent,
      triage: tri.get(m.id),
    });
  }
  for (const u of i.updates) {
    if (!arrived(u.date)) continue;
    const bits = [
      u.overall,
      ...(u.interval ?? []).map((e) => e.text),
      ...(u.attachments ?? []),
    ].filter(Boolean) as string[];
    out.push({
      id: u.id, patientId: u.patientId, kind: 'update', date: u.date,
      label: 'Health update',
      summary: bits.length > 0 ? trim(bits.join(' ')) : 'Answered the pre-visit questions.',
      urgent: !!u.urgent,
      triage: tri.get(u.id),
    });
  }
  for (const l of i.panels) {
    if (!arrived(l.date)) continue;
    const flagged = l.values.filter((v) => v.flag && v.flag !== 'normal');
    out.push({
      id: l.id, patientId: l.patientId, kind: 'result', date: l.date,
      label: l.name,
      summary: flagged.length > 0
        ? `${flagged.map((v) => `${v.key} ${v.value}`).join(', ')} outside range.`
        : 'All values in range.',
      urgent: flagged.some((v) => v.flag === 'critical'),
      triage: tri.get(l.id),
    });
  }
  for (const d of i.studies) {
    if (!arrived(d.date)) continue;
    out.push({
      id: d.id, patientId: d.patientId, kind: 'study', date: d.date,
      label: d.name, summary: trim(d.impression),
      urgent: d.significant, triage: tri.get(d.id),
    });
  }
  for (const v of i.vitals) {
    // Only what the patient measured at home. Readings taken in the
    // room arrived with the physician already in the room.
    if (v.source !== 'home' || !arrived(v.date)) continue;
    const parts = [
      v.systolic && v.diastolic ? `${v.systolic}/${v.diastolic}` : '',
      v.weightLb ? `${v.weightLb} lb` : '',
    ].filter(Boolean);
    out.push({
      id: v.id, patientId: v.patientId, kind: 'home', date: v.date,
      label: 'Home reading', summary: parts.join(', ') || 'Recorded at home.',
      urgent: false, triage: tri.get(v.id),
    });
  }

  // Already read into an approved plan is not waiting for anybody.
  const live = out.filter((x) => !i.incorporated.has(x.id));
  return live.sort((a, b) => {
    const au = a.urgent && !a.triage ? 1 : 0;
    const bu = b.urgent && !b.triage ? 1 : 0;
    if (au !== bu) return bu - au;
    return b.date.localeCompare(a.date);
  });
}

/** What the patient is told when something is acknowledged and deferred. */
export function deferReply(item: InboxItem, when?: string): string {
  const what = item.kind === 'result' || item.kind === 'study'
    ? 'your results'
    : item.kind === 'home'
      ? 'your home readings'
      : item.kind === 'update'
        ? 'your update'
        : 'your message';
  return when
    ? `I have read ${what}. Nothing here needs changing today. We will go through it at your ${when}.`
    : `I have read ${what}. Nothing here needs changing today. We will go through it at your next appointment.`;
}
