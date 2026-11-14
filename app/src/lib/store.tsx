/**
 * In-memory clinical store.
 *
 * The whole data layer sits behind this one hook, so swapping the
 * fixtures for a FHIR client is a change here and nowhere else. The
 * screens never import `../data/*` directly.
 */
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import * as fixtures from '../data/patients';
import type {
  AiDraft, CarePlan, Condition, Encounter, Medication, Patient, PatientEntry,
  PreventionItem, ResultReport, ResultSeries, Task,
} from '../domain/types';

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
}

interface Store extends State {
  // selectors
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

  // actions — every write is explicit, because every write is an event
  acknowledgeReport: (reportId: string) => void;
  completeTask: (taskId: string) => void;
  toggleAction: (planId: string, goalId: string, actionId: string) => void;
  acceptDraft: (draftId: string) => void;
  saveNote: (encounterId: string, note: NonNullable<Encounter['note']>) => void;
  signEncounter: (encounterId: string) => void;
  setMedStatus: (medId: string, status: Medication['status'], changeNote?: string) => void;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<State>(() => ({
    patients: fixtures.patients,
    conditions: fixtures.conditions,
    medications: fixtures.medications,
    resultSeries: fixtures.resultSeries,
    resultReports: fixtures.resultReports,
    carePlans: fixtures.carePlans,
    encounters: fixtures.encounters,
    prevention: fixtures.prevention,
    patientEntries: fixtures.patientEntries,
    aiDrafts: fixtures.aiDrafts,
    tasks: fixtures.tasks,
  }));

  const value = useMemo<Store>(() => {
    const byPatient = <T extends { patientId: string }>(xs: T[], id: string) =>
      xs.filter((x) => x.patientId === id);

    return {
      ...s,
      patient: (id) => s.patients.find((p) => p.id === id),
      conditionsFor: (id) => byPatient(s.conditions, id),
      medsFor: (id) => byPatient(s.medications, id),
      seriesFor: (id) => byPatient(s.resultSeries, id),
      series: (id) => s.resultSeries.find((x) => x.id === id),
      reportsFor: (id) => byPatient(s.resultReports, id),
      planFor: (id) => s.carePlans.find((x) => x.patientId === id),
      encountersFor: (id) =>
        byPatient(s.encounters, id).slice().sort((a, b) => b.date.localeCompare(a.date)),
      preventionFor: (id) => byPatient(s.prevention, id),
      entriesFor: (id) =>
        byPatient(s.patientEntries, id).slice().sort((a, b) => b.date.localeCompare(a.date)),
      draftsFor: (id) => byPatient(s.aiDrafts, id),
      tasksFor: (id) => byPatient(s.tasks, id).filter((t) => !t.done),
      openTasks: () => s.tasks.filter((t) => !t.done),

      acknowledgeReport: (reportId) =>
        setS((p) => ({
          ...p,
          resultReports: p.resultReports.map((r) =>
            r.id === reportId
              ? { ...r, acknowledged: true, acknowledgedBy: 'L. DuBose, MD', acknowledgedAt: '2026-11-14' }
              : r),
          // acknowledging the report closes the task that surfaced it
          tasks: p.tasks.map((t) =>
            t.kind === 'result' && t.patientId === p.resultReports.find((r) => r.id === reportId)?.patientId
              ? { ...t, done: true } : t),
        })),

      completeTask: (taskId) =>
        setS((p) => ({ ...p, tasks: p.tasks.map((t) => (t.id === taskId ? { ...t, done: true } : t)) })),

      toggleAction: (planId, goalId, actionId) =>
        setS((p) => ({
          ...p,
          carePlans: p.carePlans.map((cp) =>
            cp.id !== planId ? cp : {
              ...cp,
              goals: cp.goals.map((g) =>
                g.id !== goalId ? g : {
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
            e.id === encounterId ? { ...e, note, status: e.status === 'scheduled' ? 'in-progress' : e.status } : e),
        })),

      signEncounter: (encounterId) =>
        setS((p) => ({
          ...p,
          encounters: p.encounters.map((e) =>
            e.id === encounterId ? { ...e, status: 'signed', signedAt: '2026-11-14' } : e),
        })),

      setMedStatus: (medId, status, changeNote) =>
        setS((p) => ({
          ...p,
          medications: p.medications.map((m) =>
            m.id === medId
              ? { ...m, status, changeNote: changeNote ?? m.changeNote, stopped: status === 'stopped' ? '2026-11-14' : m.stopped }
              : m),
        })),
    };
  }, [s]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore outside StoreProvider');
  return v;
}
