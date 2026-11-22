/**
 * Everything that happened, in one list.
 *
 * An encounter is not only a visit. On a membership model most of
 * what is learned about a patient arrives between appointments: the
 * answer to a question we sent, the message about the side effect,
 * the note that the walking stopped. Those are encounters in every
 * sense that matters to the record, and keeping them in separate
 * lists is how they end up unread.
 *
 * So this merges them. The merge is a view, not a store: each item
 * points back at the record it came from, in its own collection, in
 * its own shape. Nothing is copied and nothing is flattened, because
 * the original is what you open when the summary says something
 * surprising.
 */
import type {
  Encounter, LabPanel, Message, PatientUpdate, ProblemCheckIn, Specialist,
  UpdateRequest,
} from '../domain/types';

export type TimelineKind =
  | 'visit' | 'booked' | 'update' | 'message' | 'specialist' | 'result';

export const TIMELINE_LABEL: Record<TimelineKind, string> = {
  visit: 'Visit',
  booked: 'Booked',
  update: 'Health update',
  message: 'Message',
  specialist: 'Specialist letter',
  result: 'Results',
};

export interface TimelineItem {
  id: string;
  kind: TimelineKind;
  date: string;
  /** Who it came from, in the terms the chart uses elsewhere. */
  by: string;
  title: string;
  /** One line of what is in it, for the list. */
  preview: string;
  /** Whether it is signed, which is what separates a note from a draft. */
  signed?: boolean;
  /** Condition ids it is about, where it says. */
  about?: string[];
}

export interface TimelineInput {
  patientId: string;
  encounters: Encounter[];
  updates: PatientUpdate[];
  checkIns: ProblemCheckIn[];
  messages: Message[];
  requests: UpdateRequest[];
  specialists: Specialist[];
  panels: LabPanel[];
  patientName: string;
}

const firstLine = (s: string, max = 140): string => {
  const clean = s.replace(/\s+/g, ' ').trim();
  return clean.length <= max ? clean : `${clean.slice(0, max).trimEnd()}...`;
};

export function timeline(input: TimelineInput): TimelineItem[] {
  const out: TimelineItem[] = [];

  for (const e of input.encounters) {
    if (e.status === 'signed') {
      const n = e.note;
      out.push({
        id: e.id, kind: 'visit', date: e.date, by: 'Logan L. DuBose, MD, MBA',
        title: e.reason || 'Visit',
        preview: firstLine(
          n?.assessment.overall || n?.subjective.additional || n?.plan.overall || 'Signed, no note text.',
        ),
        signed: true,
      });
    } else {
      out.push({
        id: e.id, kind: 'booked', date: e.date, by: 'Logan L. DuBose, MD, MBA',
        title: e.reason || 'Visit',
        preview: `${e.duration ?? 30} minutes, not yet held.`,
      });
    }
  }

  for (const u of input.updates) {
    const answers = input.checkIns.filter((c) => c.updateId === u.id);
    const req = input.requests.find((r) => r.id === u.requestId);
    out.push({
      id: u.id, kind: 'update', date: u.date, by: input.patientName,
      title: req ? 'Answered our question' : 'Sent us an update',
      preview: firstLine(u.overall ?? (answers[0]?.text ?? 'No text.')),
      about: answers
        .filter((a) => a.about.kind === 'condition')
        .map((a) => (a.about as { id: string }).id),
    });
  }

  for (const m of input.messages) {
    out.push({
      id: m.id, kind: 'message', date: m.date,
      by: m.from === 'patient' ? input.patientName : m.author,
      title: m.subject ?? (m.from === 'patient' ? 'Message from the patient' : 'Message from us'),
      preview: firstLine(m.body),
      about: m.about,
    });
  }

  for (const s of input.specialists) {
    if (!s.lastSeen) continue;
    out.push({
      id: s.id, kind: 'specialist', date: s.lastSeen, by: `${s.name}, ${s.specialty}`,
      title: `${s.specialty} letter`,
      preview: firstLine(s.recommendations ?? s.findings ?? 'On file.'),
    });
  }

  // Lab draws, grouped by the day they were drawn: four panels from one
  // needle is one event, not four.
  const byDate = new Map<string, LabPanel[]>();
  for (const p of input.panels) {
    byDate.set(p.date, [...(byDate.get(p.date) ?? []), p]);
  }
  for (const [date, panels] of byDate) {
    out.push({
      id: `labs-${date}`, kind: 'result', date,
      by: panels[0].from ?? 'This practice',
      title: panels.length === 1 ? panels[0].name : `${panels.length} panels`,
      preview: panels.map((p) => p.name).join(', '),
    });
  }

  return out.sort((a, b) => b.date.localeCompare(a.date) || a.kind.localeCompare(b.kind));
}
