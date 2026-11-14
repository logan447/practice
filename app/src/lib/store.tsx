/**
 * The clinical store.
 *
 * The whole data layer sits behind this one hook, so swapping the
 * fixtures for a FHIR client is a change here and nowhere else. The
 * screens never import `../data/*` directly.
 *
 * Every write is a named action rather than a setState, because every
 * write to a clinical record is an event, and events are the thing an
 * audit trail is made of.
 */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import * as fixtures from '../data/patients';
import { load, save, wipe, newId } from './persist';
import type {
  AiDraft, CarePlan, CarePlanGoal, Condition, Encounter, Medication, Order,
  OrderKind, Patient, PatientEntry, PreVisit, PreventionItem, ResultReport,
  ResultSeries, Specialist, Task, VisitNote,
} from '../domain/types';
import { measureByKey, patientSeriesId, isAlerting } from '../domain/measures';

const TODAY = '2026-11-14';
const ME = 'L. DuBose, MD';

interface State {
  patients: Patient[];
  conditions: Condition[];
  medications: Medication[];
  resultSeries: ResultSeries[];
  resultReports: ResultReport[];
  carePlans: CarePlan[];
  encounters: Encounter[];
  prevention: PreventionItem[];
  patientEntries: PatientEntry[];
  aiDrafts: AiDraft[];
  tasks: Task[];
  specialists: Specialist[];
  preVisits: PreVisit[];
  orders: Order[];
}

const EMPTY: State = {
  patients: [], conditions: [], medications: [], resultSeries: [], resultReports: [],
  carePlans: [], encounters: [], prevention: [], patientEntries: [], aiDrafts: [], tasks: [],
  specialists: [], preVisits: [], orders: [],
};

/**
 * Persisted state from before the note was structured. Old notes were
 * four strings; keep the words rather than drop the patient's history.
 */
function migrate(raw: State | null): State | null {
  if (!raw) return null;
  const s: State = { ...EMPTY, ...raw };
  s.encounters = (s.encounters ?? []).map((e) => {
    const n = e.note as unknown;
    if (!n || typeof (n as VisitNote).subjective === 'object') return e;
    const old = n as { subjective: string; objective: string; assessment: string; plan: string };
    return {
      ...e,
      kind: (e.kind as string) === 'intake' ? 'initial' : e.kind,
      note: {
        subjective: {
          oneLiner: '', reason: '', chartReview: '', diagnostics: '', specialists: '',
          additional: old.subjective ?? '',
        },
        objective: { homeMeasures: '', vitals: old.objective ?? '', exam: '' },
        assessment: { oneLiner: '', overall: old.assessment ?? '' },
        plan: { problems: [], overall: old.plan ?? '' },
      },
    };
  });
  return s;
}

/** The three fully built fixture patients, with everything that belongs to them. */
const DEMO_IDS = ['p1', 'p2', 'p3'];

function demoState(): State {
  const keep = <T extends { patientId: string }>(xs: T[]) =>
    xs.filter((x) => DEMO_IDS.includes(x.patientId));
  return {
    patients: fixtures.patients.filter((p) => DEMO_IDS.includes(p.id)),
    conditions: keep(fixtures.conditions),
    medications: keep(fixtures.medications),
    resultSeries: keep(fixtures.resultSeries),
    resultReports: keep(fixtures.resultReports),
    carePlans: keep(fixtures.carePlans),
    encounters: keep(fixtures.encounters),
    prevention: keep(fixtures.prevention),
    patientEntries: keep(fixtures.patientEntries),
    aiDrafts: keep(fixtures.aiDrafts),
    tasks: keep(fixtures.tasks),
    specialists: keep(fixtures.specialists),
    preVisits: keep(fixtures.preVisits),
    orders: keep(fixtures.orders),
  };
}

// ----------------------------------------------------------------- drafts

export interface PatientDraft {
  name: string;
  dob: string;
  sex: Patient['sex'];
  pronouns: string;
  phone: string;
  email: string;
  membership: Patient['membership'];
  pinned: string;
  /** Free text, one per line, turned into problems and medicines. */
  conditions: string;
  medicines: string;
  /** Book the first visit at the same time, because you always do. */
  bookIntake: boolean;
}

export const BLANK_PATIENT: PatientDraft = {
  name: '', dob: '', sex: 'female', pronouns: 'she/her', phone: '', email: '',
  membership: 'standard', pinned: '', conditions: '', medicines: '', bookIntake: true,
};

// ------------------------------------------------------------------ store

interface Store extends State {
  hasData: boolean;

  patient: (id: string) => Patient | undefined;
  conditionsFor: (id: string) => Condition[];
  medsFor: (id: string) => Medication[];
  seriesFor: (id: string) => ResultSeries[];
  series: (id: string) => ResultSeries | undefined;
  reportsFor: (id: string) => ResultReport[];
  planFor: (id: string) => CarePlan | undefined;
  encountersFor: (id: string) => Encounter[];
  preventionFor: (id: string) => PreventionItem[];
  entriesFor: (id: string) => PatientEntry[];
  draftsFor: (id: string) => AiDraft[];
  tasksFor: (id: string) => Task[];
  openTasks: () => Task[];

  // dataset
  loadDemo: () => void;
  clearAll: () => void;

  // creating
  addPatient: (d: PatientDraft) => string;
  addCondition: (patientId: string, name: string, code: string, note?: string) => void;
  addMedication: (patientId: string, name: string, dose: string, sig: string, indication?: string) => void;
  createPlan: (patientId: string, summary: string) => string;

  // the patient's own hand
  addJournal: (patientId: string, label: string, body: string, flagged: boolean) => void;
  addMeasurement: (
    patientId: string, measureKey: string,
    values: Record<string, number>, date: string, note: string,
  ) => { alerting: boolean };
  patientSeriesFor: (id: string) => ResultSeries[];
  clinicalSeriesFor: (id: string) => ResultSeries[];

  specialistsFor: (id: string) => Specialist[];
  preVisitFor: (encounterId: string) => PreVisit | undefined;
  ordersFor: (encounterId: string) => Order[];
  encounter: (id: string) => Encounter | undefined;

  addSpecialist: (patientId: string, sp: Omit<Specialist, 'id' | 'patientId'>) => void;
  submitPreVisit: (patientId: string, encounterId: string, concerns: string[], narrative: string) => void;
  toggleConcern: (preVisitId: string, concernId: string) => void;
  addOrder: (patientId: string, encounterId: string, kind: OrderKind, text: string, goalId?: string) => void;
  removeOrder: (orderId: string) => void;
  addGoal: (planId: string, goal: Omit<CarePlanGoal, 'id' | 'actions'> & { actions: string[] }) => void;
  signPlan: (planId: string) => void;
  startVisit: (patientId: string, kind: Encounter['kind'], reason: string, duration: number) => string;

  // changing
  acknowledgeReport: (reportId: string) => void;
  completeTask: (taskId: string) => void;
  toggleAction: (planId: string, goalId: string, actionId: string) => void;
  acceptDraft: (draftId: string) => void;
  saveNote: (encounterId: string, note: NonNullable<Encounter['note']>) => void;
  signEncounter: (encounterId: string) => void;
  setMedStatus: (medId: string, status: Medication['status'], changeNote?: string) => void;
  removePatient: (patientId: string) => void;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<State>(() => migrate(load<State>()) ?? EMPTY);

  useEffect(() => { save(s); }, [s]);

  const value = useMemo<Store>(() => {
    const by = <T extends { patientId: string }>(xs: T[], id: string) =>
      xs.filter((x) => x.patientId === id);

    /** Split a textarea into trimmed lines. */
    const lines = (t: string) => t.split('\n').map((l) => l.trim()).filter(Boolean);

    return {
      ...s,
      hasData: s.patients.length > 0,

      patient: (id) => s.patients.find((p) => p.id === id),
      conditionsFor: (id) => by(s.conditions, id),
      medsFor: (id) => by(s.medications, id),
      seriesFor: (id) => by(s.resultSeries, id),
      clinicalSeriesFor: (id) => by(s.resultSeries, id).filter((x) => x.source !== 'patient'),
      patientSeriesFor: (id) => by(s.resultSeries, id).filter((x) => x.source === 'patient'),
      series: (id) => s.resultSeries.find((x) => x.id === id),
      reportsFor: (id) => by(s.resultReports, id),
      planFor: (id) => s.carePlans.find((x) => x.patientId === id),
      encountersFor: (id) =>
        by(s.encounters, id).slice().sort((a, b) => b.date.localeCompare(a.date)),
      preventionFor: (id) => by(s.prevention, id),
      entriesFor: (id) =>
        by(s.patientEntries, id).slice().sort((a, b) => b.date.localeCompare(a.date)),
      draftsFor: (id) => by(s.aiDrafts, id),
      tasksFor: (id) => by(s.tasks, id).filter((t) => !t.done),
      openTasks: () => s.tasks.filter((t) => !t.done),

      specialistsFor: (id) => by(s.specialists, id),
      preVisitFor: (encounterId) => s.preVisits.find((x) => x.encounterId === encounterId),
      ordersFor: (encounterId) => s.orders.filter((o) => o.encounterId === encounterId),
      encounter: (id) => s.encounters.find((e) => e.id === id),

      addSpecialist: (patientId, sp) =>
        setS((p) => ({ ...p, specialists: [...p.specialists, { ...sp, id: newId('sp'), patientId }] })),

      submitPreVisit: (patientId, encounterId, concerns, narrative) =>
        setS((p) => ({
          ...p,
          preVisits: [
            ...p.preVisits.filter((x) => x.encounterId !== encounterId),
            {
              id: newId('pv'), patientId, encounterId, submitted: TODAY, narrative,
              concerns: concerns.map((text) => ({ id: newId('pc'), text, addressed: false })),
            },
          ],
        })),

      toggleConcern: (preVisitId, concernId) =>
        setS((p) => ({
          ...p,
          preVisits: p.preVisits.map((pv) => pv.id !== preVisitId ? pv : {
            ...pv,
            concerns: pv.concerns.map((c) =>
              c.id === concernId ? { ...c, addressed: !c.addressed } : c),
          }),
        })),

      addOrder: (patientId, encounterId, kind, text, goalId) =>
        setS((p) => ({
          ...p,
          orders: [...p.orders, {
            id: newId('or'), patientId, encounterId, kind, text, goalId,
            status: 'draft', created: TODAY,
          }],
        })),

      removeOrder: (orderId) =>
        setS((p) => ({ ...p, orders: p.orders.filter((o) => o.id !== orderId) })),

      loadDemo: () => setS(demoState()),
      clearAll: () => { wipe(); setS(EMPTY); },

      addPatient: (d) => {
        const id = newId('pt');
        const patient: Patient = {
          id,
          name: d.name.trim(),
          preferredName: d.name.trim().split(' ')[0],
          dob: d.dob,
          sex: d.sex,
          pronouns: d.pronouns,
          membership: d.membership,
          memberSince: TODAY,
          photoTone: Math.abs(d.name.length * 7) % 6,
          phone: d.phone,
          email: d.email,
          pinned: d.pinned.trim() || undefined,
        };

        const conditions: Condition[] = lines(d.conditions).map((name) => ({
          id: newId('cd'), patientId: id, name, code: '', status: 'active',
          onset: TODAY,
          provenance: { author: 'patient', by: 'Reported at intake', recorded: TODAY },
        }));

        const medications: Medication[] = lines(d.medicines).map((line) => {
          // "Lisinopril 10 mg — one tablet each morning" and looser forms.
          const [left, right] = line.split(/\s+[—–-]\s+/, 2);
          const m = left.match(/^(.*?)\s+([\d.]+\s*\S+)$/);
          return {
            id: newId('md'), patientId: id,
            name: (m ? m[1] : left).trim(),
            dose: (m ? m[2] : '').trim(),
            sig: (right ?? '').trim(),
            started: TODAY, status: 'active' as const,
            provenance: { author: 'patient', by: 'Reported at intake', recorded: TODAY },
          };
        });

        const encounters: Encounter[] = d.bookIntake ? [{
          id: newId('en'), patientId: id, date: TODAY, kind: 'initial',
          reason: 'First full visit. History, medicines, habits, and what they want to work on.',
          status: 'scheduled', duration: 90,
        }] : [];

        setS((p) => ({
          ...p,
          patients: [...p.patients, patient],
          conditions: [...p.conditions, ...conditions],
          medications: [...p.medications, ...medications],
          encounters: [...p.encounters, ...encounters],
        }));
        return id;
      },

      addCondition: (patientId, name, code, note) =>
        setS((p) => ({
          ...p,
          conditions: [...p.conditions, {
            id: newId('cd'), patientId, name, code, status: 'active', onset: TODAY, note,
            provenance: { author: 'clinician', by: ME, recorded: TODAY },
          }],
        })),

      addMedication: (patientId, name, dose, sig, indication) =>
        setS((p) => ({
          ...p,
          medications: [...p.medications, {
            id: newId('md'), patientId, name, dose, sig, indication,
            started: TODAY, status: 'active',
            provenance: { author: 'clinician', by: ME, recorded: TODAY },
          }],
        })),

      createPlan: (patientId, summary) => {
        const id = newId('cp');
        setS((p) => ({
          ...p,
          carePlans: [...p.carePlans, {
            id, patientId, version: 1, updated: TODAY, signed: false, summary, goals: [],
            provenance: { author: 'clinician', by: ME, recorded: TODAY },
          }],
        }));
        return id;
      },

      addGoal: (planId, goal) =>
        setS((p) => ({
          ...p,
          carePlans: p.carePlans.map((cp) => cp.id !== planId ? cp : {
            ...cp,
            updated: TODAY,
            goals: [...cp.goals, {
              ...goal,
              id: newId('gl'),
              actions: goal.actions.map((text) => ({
                id: newId('ac'), text, owner: 'patient' as const, done: false,
              })),
            }],
          }),
        })),

      signPlan: (planId) =>
        setS((p) => ({
          ...p,
          carePlans: p.carePlans.map((cp) => cp.id !== planId ? cp : {
            ...cp, signed: true, signedBy: ME, updated: TODAY,
            version: cp.signed ? cp.version + 1 : cp.version,
          }),
        })),

      startVisit: (patientId, kind, reason, duration) => {
        const id = newId('en');
        setS((p) => ({
          ...p,
          encounters: [...p.encounters, {
            id, patientId, date: TODAY, kind, reason, status: 'scheduled', duration,
          }],
        }));
        return id;
      },

      addJournal: (patientId, label, body, flagged) =>
        setS((p) => ({
          ...p,
          patientEntries: [...p.patientEntries, {
            id: newId('pe'), patientId, date: TODAY, kind: 'journal',
            label: label.trim() || 'Note', body: body.trim(), flagged,
            provenance: { author: 'patient', by: 'Patient', recorded: TODAY },
          }],
          // Only a flagged entry reaches the inbox. Everything the patient
          // writes is visible in the chart; not everything is a summons.
          tasks: flagged ? [...p.tasks, {
            id: newId('tk'), patientId, kind: 'message' as const,
            text: `Asked you to see: ${label.trim() || 'a note'}`,
            due: TODAY, urgent: false, done: false,
          }] : p.tasks,
        })),

      addMeasurement: (patientId, measureKey, values, date, note) => {
        const measure = measureByKey(measureKey);
        if (!measure) return { alerting: false };

        const alerting = measure.fields.some((f) =>
          values[f.key] !== undefined && isAlerting(f, values[f.key]));

        const summary = measure.fields
          .filter((f) => values[f.key] !== undefined)
          .map((f) => `${values[f.key]} ${f.unit}`)
          .join(' / ');

        setS((p) => {
          const series = [...p.resultSeries];
          const touched: string[] = [];

          for (const f of measure.fields) {
            const v = values[f.key];
            if (v === undefined || Number.isNaN(v)) continue;
            const sid = patientSeriesId(patientId, measureKey, f.key);
            touched.push(sid);
            const point = { date, value: v, flag: 'normal' as const };
            const at = series.findIndex((x) => x.id === sid);
            if (at === -1) {
              series.push({
                id: sid, patientId, source: 'patient',
                name: measure.fields.length > 1 ? `${measure.label}, ${f.label.toLowerCase()}` : measure.label,
                code: f.loinc, unit: f.unit, points: [point],
              });
            } else {
              // one reading per day per measure: the later one wins
              const pts = series[at].points.filter((x) => x.date !== date);
              series[at] = {
                ...series[at],
                points: [...pts, point].sort((a, b) => a.date.localeCompare(b.date)),
              };
            }
          }

          return {
            ...p,
            resultSeries: series,
            patientEntries: [...p.patientEntries, {
              id: newId('pe'), patientId, date, kind: 'measurement' as const,
              label: measure.label, body: note.trim() ? `${summary}. ${note.trim()}` : summary,
              seriesIds: touched,
              provenance: { author: 'patient', by: 'Patient', recorded: date },
            }],
            tasks: alerting ? [...p.tasks, {
              id: newId('tk'), patientId, kind: 'message' as const,
              text: `${measure.label} logged at ${summary}, outside the usual range`,
              due: date, urgent: true, done: false,
            }] : p.tasks,
          };
        });

        return { alerting };
      },

      acknowledgeReport: (reportId) =>
        setS((p) => {
          const rep = p.resultReports.find((r) => r.id === reportId);
          return {
            ...p,
            resultReports: p.resultReports.map((r) =>
              r.id === reportId
                ? { ...r, acknowledged: true, acknowledgedBy: ME, acknowledgedAt: TODAY }
                : r),
            tasks: p.tasks.map((t) =>
              t.kind === 'result' && rep && t.patientId === rep.patientId ? { ...t, done: true } : t),
          };
        }),

      completeTask: (taskId) =>
        setS((p) => ({ ...p, tasks: p.tasks.map((t) => (t.id === taskId ? { ...t, done: true } : t)) })),

      toggleAction: (planId, goalId, actionId) =>
        setS((p) => ({
          ...p,
          carePlans: p.carePlans.map((cp) => cp.id !== planId ? cp : {
            ...cp,
            goals: cp.goals.map((g) => g.id !== goalId ? g : {
              ...g,
              actions: g.actions.map((a) => (a.id === actionId ? { ...a, done: !a.done } : a)),
            }),
          }),
        })),

      acceptDraft: (draftId) =>
        setS((p) => ({
          ...p,
          aiDrafts: p.aiDrafts.map((d) => (d.id === draftId ? { ...d, accepted: true } : d)),
        })),

      saveNote: (encounterId, note) =>
        setS((p) => ({
          ...p,
          encounters: p.encounters.map((e) =>
            e.id === encounterId
              ? { ...e, note, status: e.status === 'scheduled' ? 'in-progress' : e.status }
              : e),
        })),

      signEncounter: (encounterId) =>
        setS((p) => ({
          ...p,
          encounters: p.encounters.map((e) =>
            e.id === encounterId ? { ...e, status: 'signed', signedAt: TODAY } : e),
        })),

      setMedStatus: (medId, status, changeNote) =>
        setS((p) => ({
          ...p,
          medications: p.medications.map((m) =>
            m.id === medId
              ? {
                ...m, status, changeNote: changeNote ?? m.changeNote,
                stopped: status === 'stopped' ? TODAY : m.stopped,
              }
              : m),
        })),

      removePatient: (patientId) =>
        setS((p) => {
          const drop = <T extends { patientId: string }>(xs: T[]) =>
            xs.filter((x) => x.patientId !== patientId);
          return {
            patients: p.patients.filter((x) => x.id !== patientId),
            conditions: drop(p.conditions), medications: drop(p.medications),
            resultSeries: drop(p.resultSeries), resultReports: drop(p.resultReports),
            carePlans: drop(p.carePlans), encounters: drop(p.encounters),
            prevention: drop(p.prevention), patientEntries: drop(p.patientEntries),
            aiDrafts: drop(p.aiDrafts), tasks: drop(p.tasks),
            specialists: drop(p.specialists), preVisits: drop(p.preVisits),
            orders: drop(p.orders),
          };
        }),
    };
  }, [s]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore outside StoreProvider');
  return v;
}
