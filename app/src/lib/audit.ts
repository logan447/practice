/**
 * Who did what.
 *
 * Derived from the state rather than written by hand at each action,
 * on purpose. A log that depends on every author remembering to call
 * it is a log with holes in it, and the holes are always in the code
 * someone added in a hurry. This one compares the record before and
 * after every change, so an action nobody instrumented is still in the
 * log, correctly, the first time it runs.
 *
 * What the diff cannot know is intent, so the descriptions below name
 * the transitions that matter clinically: a note signed, a result
 * acknowledged, a plan released to the patient. Everything else is
 * recorded as the change it is.
 *
 * Reads are logged only for people who are not the responsible
 * physician. Logging every chart the owner opens buries the one entry
 * that matters, which is that somebody else opened it.
 *
 * Kept under its own key, outside the clinical state, so recording a
 * change cannot itself be a change that needs recording.
 */
import type { Actor, Role } from './session';

const KEY = 'dlm-emr-audit-v1';

export type AuditAction = 'create' | 'update' | 'delete' | 'read' | 'sign-in';

export interface AuditEvent {
  id: string;
  /** Real wall-clock time. The clinic date is separate and also kept. */
  at: number;
  clinicDate: string;
  actorId: string;
  actorName: string;
  role: Role;
  action: AuditAction;
  resource: string;
  resourceId: string;
  patientId?: string;
  /** One line a person can read. */
  summary: string;
  /** The field-level change, where there is one. */
  detail?: string;
  /** Present when the actor was not the responsible physician. */
  reason?: string;
}

interface Store { events: AuditEvent[] }

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((f) => f());

function read(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Store) : { events: [] };
  } catch {
    return { events: [] };
  }
}

function write(s: Store): void {
  // A prototype log that grows without bound eventually fails the
  // write and takes the rest of localStorage with it.
  if (s.events.length > 4000) s.events = s.events.slice(-3000);
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

export function subscribe(f: () => void): () => void {
  listeners.add(f);
  return () => listeners.delete(f);
}

export const allEvents = (): AuditEvent[] => read().events;

export const eventsFor = (patientId: string): AuditEvent[] =>
  read().events.filter((e) => e.patientId === patientId).sort((a, b) => b.at - a.at);

export function clearAudit(): void {
  write({ events: [] });
  notify();
}

let seq = 0;

export function record(
  actor: Actor, clinicDate: string,
  e: Omit<AuditEvent, 'id' | 'at' | 'clinicDate' | 'actorId' | 'actorName' | 'role' | 'reason'>,
): void {
  const s = read();
  s.events.push({
    ...e,
    id: `ae${Date.now().toString(36)}${(seq++).toString(36)}`,
    at: Date.now(),
    clinicDate,
    actorId: actor.id,
    actorName: actor.name,
    role: actor.role,
    reason: actor.role === 'physician' ? undefined : actor.reason,
  });
  write(s);
  notify();
}

/** A chart opened by someone who is not the responsible physician. */
export function recordRead(actor: Actor, clinicDate: string, patientId: string, who: string): void {
  if (actor.role === 'physician') return;
  const s = read();
  const last = [...s.events].reverse().find((e) =>
    e.action === 'read' && e.patientId === patientId && e.actorId === actor.id);
  // One entry per visit to a chart, not one per re-render.
  if (last && Date.now() - last.at < 5 * 60 * 1000) return;
  record(actor, clinicDate, {
    action: 'read', resource: 'Patient', resourceId: patientId, patientId,
    summary: `Opened ${who}'s chart`,
  });
}

// ------------------------------------------------------------ the diff

type Row = { id: string; patientId?: string };

export interface Snapshot {
  [collection: string]: Row[];
}

type AnyRec = Record<string, unknown>;

/** Which fields changed, as "field: before → after". */
function fieldDiff(a: AnyRec, b: AnyRec): string[] {
  const out: string[] = [];
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
    if (k === 'id') continue;
    const x = JSON.stringify(a[k]);
    const y = JSON.stringify(b[k]);
    if (x === y) continue;
    const short = (v: string | undefined) => {
      if (v === undefined) return 'nothing';
      const s = v.replace(/^"|"$/g, '');
      return s.length > 70 ? `${s.slice(0, 70)}…` : s || 'nothing';
    };
    out.push(`${k}: ${short(x)} → ${short(y)}`);
  }
  return out;
}

export interface DiffConfig {
  collection: string;
  resource: string;
  /** A human name for one row. */
  label: (x: AnyRec) => string;
  /** A better sentence for a particular transition. */
  transition?: (before: AnyRec, after: AnyRec) => string | undefined;
}

export const CONFIG: DiffConfig[] = [
  {
    collection: 'patients', resource: 'Patient',
    label: (x) => String(x.name ?? 'a patient'),
    transition: (b, a) => (b.membership !== a.membership
      ? `Changed membership from ${b.membership} to ${a.membership}` : undefined),
  },
  { collection: 'conditions', resource: 'Condition', label: (x) => String(x.name) },
  {
    collection: 'medications', resource: 'Medication',
    label: (x) => `${x.name}${x.dose ? ` ${x.dose}` : ''}`,
    transition: (b, a) => (b.status !== a.status
      ? `${a.status === 'stopped' ? 'Stopped' : a.status === 'held' ? 'Held' : 'Restarted'} ${a.name}${a.changeNote ? `: ${a.changeNote}` : ''}`
      : undefined),
  },
  { collection: 'allergies', resource: 'AllergyIntolerance', label: (x) => String(x.substance) },
  {
    collection: 'carePlans', resource: 'CarePlan',
    label: (x) => `care plan v${x.version}`,
    transition: (b, a) => (!b.signed && a.signed
      ? 'Signed the care plan, which released it to the patient' : undefined),
  },
  {
    collection: 'encounters', resource: 'Encounter',
    label: (x) => `${x.kind} visit`,
    transition: (b, a) => {
      if (b.status !== 'signed' && a.status === 'signed') return 'Signed the visit note';
      if (JSON.stringify(b.note) !== JSON.stringify(a.note)) return 'Edited the visit note';
      return undefined;
    },
  },
  {
    collection: 'resultReports', resource: 'DiagnosticReport',
    label: (x) => String(x.panel),
    transition: (b, a) => (!b.acknowledged && a.acknowledged
      ? `Acknowledged ${a.panel}` : undefined),
  },
  { collection: 'orders', resource: 'ServiceRequest', label: (x) => `${x.kind}: ${x.text}` },
  { collection: 'patientEntries', resource: 'Observation', label: (x) => String(x.label) },
  { collection: 'prevention', resource: 'Prevention', label: (x) => String(x.name) },
  { collection: 'specialists', resource: 'CareTeam', label: (x) => String(x.name) },
  { collection: 'documents', resource: 'DocumentReference', label: (x) => String(x.title) },
  { collection: 'preVisits', resource: 'QuestionnaireResponse', label: () => 'pre-visit form' },
];

/**
 * Compare two states and log what changed.
 *
 * Bulk operations (loading a panel, clearing everything) would
 * otherwise produce thousands of rows, so they collapse to one.
 */
export function recordDiff(prev: Snapshot, next: Snapshot, actor: Actor, clinicDate: string): void {
  let total = 0;
  for (const c of CONFIG) {
    const a = (prev[c.collection] ?? []) as unknown as AnyRec[];
    const b = (next[c.collection] ?? []) as unknown as AnyRec[];
    total += Math.abs(a.length - b.length);
  }
  if (total > 40) {
    const grew = (next.patients?.length ?? 0) > (prev.patients?.length ?? 0);
    record(actor, clinicDate, {
      action: grew ? 'create' : 'delete',
      resource: 'Dataset', resourceId: 'bulk',
      summary: grew
        ? `Loaded ${next.patients?.length ?? 0} patients into the record`
        : 'Cleared the record',
    });
    return;
  }

  for (const c of CONFIG) {
    const before = new Map((prev[c.collection] ?? []).map((x) => [x.id, x as unknown as AnyRec]));
    const after = new Map((next[c.collection] ?? []).map((x) => [x.id, x as unknown as AnyRec]));

    for (const [id, row] of after) {
      const old = before.get(id);
      if (!old) {
        record(actor, clinicDate, {
          action: 'create', resource: c.resource, resourceId: id,
          patientId: (row.patientId as string) ?? (c.collection === 'patients' ? id : undefined),
          summary: `Added ${c.label(row)}`,
        });
        continue;
      }
      const fields = fieldDiff(old, row);
      if (fields.length === 0) continue;
      record(actor, clinicDate, {
        action: 'update', resource: c.resource, resourceId: id,
        patientId: (row.patientId as string) ?? (c.collection === 'patients' ? id : undefined),
        summary: c.transition?.(old, row) ?? `Changed ${c.label(row)}`,
        detail: fields.join('; '),
      });
    }

    for (const [id, row] of before) {
      if (after.has(id)) continue;
      record(actor, clinicDate, {
        action: 'delete', resource: c.resource, resourceId: id,
        patientId: (row.patientId as string) ?? (c.collection === 'patients' ? id : undefined),
        summary: `Removed ${c.label(row)}`,
      });
    }
  }
}
