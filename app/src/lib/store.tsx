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
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import * as fixtures from '../data/patients';
import { load, save, wipe, newId } from './persist';
import { ORIGIN, now as clockNow, setNow, addDays } from './clock';
import { tick } from './tick';
import { ENCOUNTER_KINDS } from '../domain/types';
import type {
  AiDraft, CarePlan, CarePlanGoal, Condition, Encounter, Medication, Order,
  OrderKind, Patient, PatientEntry, PreVisit, PreventionItem, ResultReport,
  ResultSeries, Specialist, Task, VisitNote, Allergy, ChartDocument, MasterPlan,
  VitalsSet, LabPanel, ExamRecord, DiagnosticStudy, EmRecord, CareLogEntry, ProblemCheckIn,
  PatientUpdate, Message, UpdateRequest, CareGoalStatus, ChartVersion, InfoRequest,
  EncounterKind, CareProgram, InstrumentScore, InstrumentId, Claim,
  ServiceConsent, LifestyleIntervention, Triage, TriageChoice, LegacyEncounterKind,
  PreChart,
  VisitSetting, ProblemOwner,
} from '../domain/types';
import { LEGACY_KIND } from '../domain/types';
import { inbox as buildInbox, type InboxItem } from './inbox';
import { dayStatus, nextClosure, WORKING_YEAR } from '../domain/schedule';
import type { AwayBlock } from '../domain/schedule';
import { ledgerFor, type Ledger } from './membership';
import { closureChecks, type ClosureCheck } from './closure';

/**
 * The first slot on a day that nothing already occupies.
 *
 * Crude on purpose: a solo practice's diary is a column, and anything
 * cleverer here would be a scheduling engine nobody asked for. It
 * only has to be right enough that two things do not land on top of
 * each other when a review is brought forward.
 */
/**
 * Reasons that named a service rather than an activity.
 *
 * Stored encounters carry the label they were created with, so a
 * record written before the two activities still says "Behavioural
 * health review" on a row the schedule now calls a care plan review.
 * The old word is kept in `legacyKind`; the reason is the line a
 * physician reads on the day, and it should say what they are about
 * to do.
 */
const RETIRED_REASON: Record<string, string> = {
  'Chronic care management review': 'Visit',
  'Behavioural health review': 'Visit',
  'Behavioral health review': 'Visit',
  'Care plan review': 'Visit',
  'Clinical visit': 'Visit',
};

function nextFreeStart(encounters: Encounter[], day: string): number {
  const taken = encounters
    .filter((e) => e.date === day && e.start != null)
    .map((e) => [e.start!, e.start! + (e.duration ?? 30)] as const)
    .sort((a, b) => a[0] - b[0]);
  let at = WORKING_YEAR.dayStart;
  for (const [from, to] of taken) {
    if (at + 30 <= from) return at;
    at = Math.max(at, to);
  }
  return Math.min(at, WORKING_YEAR.dayEnd - 30);
}
import { fmtDate } from './format';
import { generatePanel } from '../data/generate';
import { longitudinal } from '../data/longitudinal';
import * as sharon from '../data/sharon';
import * as clinical from '../data/sharon-clinical';
import * as medicare from '../data/medicare';
import * as day from '../data/day';
import * as demo from '../data/demo-states';
import * as contact from '../data/sharon-contact';
import * as versions from '../data/sharon-versions';
import { resolveDrug } from '../domain/terminology';
import { recordDiff, type Snapshot } from './audit';
import { actor as currentActor } from './session';
import { measureByKey, patientSeriesId, isAlerting } from '../domain/measures';

const ME = 'L. DuBose, MD';

interface State {
  patients: Patient[];
  conditions: Condition[];
  medications: Medication[];
  allergies: Allergy[];
  /** Outside records, including the ones that could not be read. */
  documents: ChartDocument[];
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
  /** One living SOAP document per patient. */
  masterPlans: MasterPlan[];
  vitals: VitalsSet[];
  labPanels: LabPanel[];
  exams: ExamRecord[];
  studies: DiagnosticStudy[];
  /**
   * Kept apart from the summary on purpose. A longitudinal document
   * cannot answer what happened on a date or in a calendar month,
   * which is exactly what billing asks.
   */
  emRecords: EmRecord[];
  careLog: CareLogEntry[];
  consents: ServiceConsent[];
  /** The patient's own words on each problem, sent in before a visit. */
  checkIns: ProblemCheckIn[];
  /** Health updates the patient submitted, prompted or otherwise. */
  updates: PatientUpdate[];
  /** Messages between the patient and the practice. */
  messages: Message[];
  /** Questions we sent, so an answer has something to answer. */
  requests: UpdateRequest[];
  /** Scored questionnaires, kept as numbers with dates. */
  scores: InstrumentScore[];
  /** The approved living chart, one immutable row per approval. */
  chartVersions: ChartVersion[];
  /** What we have asked the patient for, open until answered. */
  infoRequests: InfoRequest[];
  /**
   * A physician's attestation that a month's service was reviewed and
   * is billable. Stored; the rest of the monthly evaluation is
   * computed, because duplicating it would let the two disagree.
   */
  attestations: { id: string; patientId: string; program: CareProgram; month: string; by: string; at: string }[];
  claims: Claim[];
  /** Drafted by the assistant, not yet anybody's words. */
  lifestyle: LifestyleIntervention[];
  /**
   * What was decided about each record that arrived between
   * encounters. Never a change to the care plan: a triage row records
   * that somebody read something and what they chose to do about it.
   */
  triage: Triage[];
  /** Chart reviews done before a visit, waiting to be written into one. */
  precharts: PreChart[];
  /** The clinic's today. Movable, because care is longitudinal. */
  now: string;
  /** What changed the last time the clock moved. */
  lastEvents: string[];
}

const EMPTY: State = {
  patients: [], conditions: [], medications: [], allergies: [], documents: [],
  resultSeries: [], resultReports: [],
  carePlans: [], encounters: [], prevention: [], patientEntries: [], aiDrafts: [], tasks: [],
  specialists: [], preVisits: [], orders: [], masterPlans: [],
  vitals: [], labPanels: [], exams: [], studies: [],
  emRecords: [], careLog: [], consents: [], lifestyle: [],
  checkIns: [], updates: [], messages: [], requests: [],
  scores: [], chartVersions: [], infoRequests: [], attestations: [], claims: [],
  triage: [], precharts: [],
  now: ORIGIN, lastEvents: [],
};

/**
 * Saved state from an older version of this prototype.
 *
 * The state lives in the browser, so every shape change meets records
 * written before it. Two rules here, both learned the hard way.
 *
 * Fill forward, never assume. A collection or a nested field added
 * after a record was saved is missing from that record, and reading
 * through it throws during render, which in React means the whole
 * tree unmounts and the person gets a blank page with no route back.
 * So every field this file knows about is defaulted here, at the one
 * point where saved data enters.
 *
 * Keep the words. A migration that drops a paragraph because its
 * container changed shape has destroyed clinical content to save
 * itself some work.
 */
function migrate(raw: State | null): State | null {
  if (!raw) return null;
  const s: State = { ...EMPTY, ...raw };

  // Collections added later. A key that is present but null counts as
  // missing, which `{...EMPTY, ...raw}` on its own does not catch.
  const fill = <K extends keyof State>(k: K) => {
    if (!Array.isArray(s[k])) (s as unknown as Record<string, unknown>)[k as string] = [];
  };
  for (const k of [
    'patients', 'conditions', 'medications', 'allergies', 'documents',
    'resultSeries', 'resultReports', 'carePlans', 'encounters', 'prevention',
    'patientEntries', 'aiDrafts', 'tasks', 'specialists', 'preVisits', 'orders',
    'masterPlans', 'vitals', 'labPanels', 'exams', 'studies', 'emRecords',
    'careLog', 'consents', 'lifestyle', 'checkIns',
    'updates', 'messages', 'requests', 'scores', 'chartVersions', 'infoRequests',
    'attestations', 'claims', 'triage', 'precharts',
  ] as (keyof State)[]) fill(k);
  if (!s.now) s.now = ORIGIN;
  if (!Array.isArray(s.lastEvents)) s.lastEvents = [];

  // The living summary gained a chart review per problem. A plan saved
  // before that has no `byProblem` under `subjective`, and the
  // subjective section reads straight through it.
  s.masterPlans = s.masterPlans.map((m) => ({
    ...m,
    objective: { narrative: m.objective?.narrative ?? '' },
    assessment: { narrative: m.assessment?.narrative ?? '' },
    plan: {
      ...{ prevention: '', lifestyle: '', followUp: '' },
      ...(m.plan ?? {}),
      byProblem: m.plan?.byProblem ?? {},
    },
  }));

  // Nine kinds became two. A stored encounter keeps what it was
  // called, because the old word is often the only record of what
  // sort of hour it was, and loses it as a scheduling category.
  s.encounters = (s.encounters ?? []).map((e) => {
    const k = e.kind as string;
    if (k !== 'visit') {
      const legacy = (k === 'intake' ? 'initial' : k) as LegacyEncounterKind;
      return {
        ...e,
        kind: LEGACY_KIND[legacy] ?? 'visit',
        legacyKind: legacy,
        setting: e.setting ?? (legacy === 'home' ? 'home' : 'in-person'),
        reason: RETIRED_REASON[e.reason] ?? e.reason,
      };
    }
    return e;
  }).map((e) => {
    const n = e.note as unknown;
    if (!n || typeof (n as VisitNote).subjective === 'object') return e;
    const old = n as { subjective: string; objective: string; assessment: string; plan: string };
    return {
      ...e,
      kind: e.kind,
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

/** The fully built fixture patients, with everything that belongs to them. */
/**
 * Three states, so the structure can be judged against all of them.
 *
 * Sharon White (p0) is the complete chart, Marcus Reyes (p1) the half
 * written one, Nina Alvarado (p9) the chart on its first day. A screen
 * designed against only the first hides every empty state; against
 * only the last it never has to hold four years of numbers.
 */
const DEMO_IDS = ['p0', 'p1', 'p2', 'p3', 'p9'];

function demoState(): State {
  const keep = <T extends { patientId: string }>(xs: T[]) =>
    xs.filter((x) => DEMO_IDS.includes(x.patientId));
  return {
    patients: [
      sharon.sharon,
      ...fixtures.patients.filter((p) => DEMO_IDS.includes(p.id)),
      demo.nina,
    ],
    conditions: [...sharon.sharonConditions, ...keep(fixtures.conditions)],
    medications: [...sharon.sharonMeds, ...keep(fixtures.medications)],
    allergies: [],
    documents: sharon.sharonDocuments,
    resultSeries: [...sharon.sharonSeries, ...keep(fixtures.resultSeries)],
    resultReports: [...sharon.sharonReports, ...keep(fixtures.resultReports)],
    carePlans: [sharon.sharonPlan, ...keep(fixtures.carePlans)],
    encounters: [
      ...sharon.sharonEncounters, ...keep(fixtures.encounters), ...demo.ninaEncounters,
      ...day.todaySchedule,
    ],
    prevention: [...sharon.sharonPrevention, ...keep(fixtures.prevention)],
    patientEntries: keep(fixtures.patientEntries),
    aiDrafts: keep(fixtures.aiDrafts),
    tasks: [...sharon.sharonTasks, ...keep(fixtures.tasks)],
    specialists: [...sharon.sharonSpecialists, ...keep(fixtures.specialists)],
    preVisits: keep(fixtures.preVisits),
    orders: [...sharon.sharonOrders, ...keep(fixtures.orders)],
    masterPlans: [sharon.sharonMaster, demo.marcusMaster],
    vitals: [...clinical.sharonVitals, ...demo.marcusVitals, ...day.weekendVitals],
    labPanels: [...clinical.sharonPanels, ...demo.marcusPanels],
    exams: [...clinical.sharonExams, ...demo.marcusExams],
    studies: [...clinical.sharonStudies, ...demo.marcusStudies],
    emRecords: clinical.sharonEm,
    careLog: [...clinical.sharonCareLog, ...medicare.arthurCareLog],
    consents: [...clinical.sharonConsents, ...medicare.arthurConsents],
    checkIns: [...contact.sharonCheckIns, ...demo.marcusCheckIns],
    scores: [...clinical.sharonScores, ...medicare.arthurScores],
    attestations: [], claims: [], triage: [], precharts: [],
    chartVersions: [...versions.sharonVersions],
    infoRequests: [...versions.sharonAsks],
    updates: contact.sharonUpdates,
    messages: [...contact.sharonMessages, ...day.weekendMessages],
    requests: contact.sharonRequests,
    lifestyle: [...clinical.sharonLifestyle, ...demo.marcusLifestyle],
    now: ORIGIN,
    lastEvents: [],
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
  /**
   * What they say is going on, in their words, at the baseline
   * history and physical.
   *
   * Every patient gets an initial evaluation, so every chart should
   * have a subjective from the day they joined. Without it the living
   * summary opens by saying nobody has asked them anything, which is
   * true of the data and false of the practice.
   */
  story: string;
  /** Book the first visit at the same time, because you always do. */
  bookIntake: boolean;
}

export const BLANK_PATIENT: PatientDraft = {
  name: '', dob: '', sex: 'female', pronouns: 'she/her', phone: '', email: '',
  membership: 'standard', pinned: '', conditions: '', medicines: '',
  story: '', bookIntake: true,
};

// ------------------------------------------------------------------ store

interface Store extends State {
  hasData: boolean;
  /** False when the browser refused the last write: memory only. */
  persisted: boolean;

  patient: (id: string) => Patient | undefined;
  conditionsFor: (id: string) => Condition[];
  medsFor: (id: string) => Medication[];
  allergiesFor: (id: string) => Allergy[];
  documentsFor: (id: string) => ChartDocument[];
  masterPlanFor: (id: string) => MasterPlan | undefined;
  vitalsFor: (id: string) => VitalsSet[];
  panelsFor: (id: string) => LabPanel[];
  examsFor: (id: string) => ExamRecord[];
  studiesFor: (id: string) => DiagnosticStudy[];
  emFor: (encounterId: string) => EmRecord | undefined;
  careLogFor: (id: string, month?: string) => CareLogEntry[];
  consentsFor: (id: string) => ServiceConsent[];
  /** Newest first. */
  checkInsFor: (id: string) => ProblemCheckIn[];
  updatesFor: (id: string) => PatientUpdate[];
  /** Demo affordances: add a record and watch the subjective move. */
  simulateUpdate: (patientId: string) => void;
  simulateMessage: (patientId: string) => void;
  simulateVisit: (patientId: string) => void;
  messagesFor: (id: string) => Message[];
  requestsFor: (id: string) => UpdateRequest[];
  /** Newest first. */
  scoresFor: (id: string, instrument?: InstrumentId) => InstrumentScore[];

  // -------------------------------------------------- the encounter cycle
  /** The approved chart, or nothing where none has been approved yet. */
  currentVersion: (patientId: string) => ChartVersion | undefined;
  versionsFor: (patientId: string) => ChartVersion[];
  /** Records that have arrived since the last approval. */
  newSince: (patientId: string) => {
    updates: PatientUpdate[];
    messages: Message[];
    checkIns: ProblemCheckIn[];
    panels: LabPanel[];
    vitals: VitalsSet[];
    encounters: Encounter[];
    count: number;
    urgent: number;
  };
  infoRequestsFor: (patientId: string, status?: InfoRequest['status']) => InfoRequest[];

  /** The most recent chart review for this patient that no visit has used. */
  preChartFor: (patientId: string) => PreChart | undefined;
  /** Record a pass through the chart, with whatever was said during it. */
  savePreChart: (
    patientId: string,
    notes: Record<string, string>,
    reviewed: string[],
  ) => void;
  /** Open a visit. There is one kind of encounter. */
  openEncounter: (patientId: string, kind: EncounterKind) => string;
  askPatient: (
    patientId: string, encounterId: string,
    about: InfoRequest['about'], ask: string,
  ) => void;
  cancelAsk: (id: string) => void;
  /**
   * The patient answers what was asked.
   *
   * Their answer is a record of theirs, attributed and dated, and it
   * closes the requests it answers. It does not touch the approved
   * chart: it waits for the next encounter, which is what makes the
   * chart a physician-approved document rather than a feed.
   */
  answerRequests: (patientId: string, text: string) => void;
  /**
   * Sign the encounter and publish the next version of the chart.
   *
   * One act, because the physician is doing one thing. It writes the
   * signed note, freezes the summary as approved, sends the open
   * requests, and records the time.
   */
  approveEncounter: (encounterId: string, opts: {
    subjective: unknown;
    goals: Record<string, CareGoalStatus>;
    plan: ChartVersion['plan'];
    minutes?: number;
    planUpdated?: boolean;
    problems?: string[];
    noChange?: boolean;
    /** The signed note. Kept as it was signed, beside the new version. */
    note?: VisitNote;
    setting?: VisitSetting;
    wellness?: boolean;
  }) => void;

  // --------------------------------------------------- the day, and the inbox
  /** Everything booked on one day, in time order, visits and reviews alike. */
  dayList: (iso?: string) => Encounter[];
  /** Everything waiting to be read, across the whole panel. */
  inbox: () => InboxItem[];
  /** What was decided about one arriving record, where anything was. */
  triageOf: (recordId: string) => Triage | undefined;
  /** Where this patient stands in their membership year. */
  ledgerFor: (patientId: string) => Ledger | undefined;
  /** What is left hanging before the next closure, panel-wide. */
  closureChecks: () => { closure: AwayBlock; checks: ClosureCheck[] } | undefined;
  /** Who owns a problem, as far as the record says. */
  setOwner: (conditionId: string, owner: ProblemOwner) => void;
  /**
   * Record a decision about an arriving record. Never changes the
   * care plan: that only moves when an encounter is approved.
   */
  triageRecord: (
    patientId: string, recordId: string, choice: TriageChoice,
    opts?: { reply?: string; encounterId?: string },
  ) => void;
  /**
   * Bring a review forward, or make one, for today.
   *
   * Returns the encounter to open. If something is already booked and
   * not yet signed, it is moved rather than duplicated, because two
   * reviews for the same patient in the same week is how a schedule
   * stops being believable.
   */
  expediteReview: (patientId: string) => string;
  /** Book a visit on the first clinic day with room, and return it. */
  bookSoonVisit: (patientId: string, reason: string) => string;
  lifestyleFor: (id: string) => LifestyleIntervention[];
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

  // the clock
  advanceTime: (days: number) => void;
  resetTime: () => void;

  // dataset
  loadDemo: () => void;
  loadPanel: () => number;
  clearAll: () => void;

  // creating
  addPatient: (d: PatientDraft) => string;
  addCondition: (patientId: string, name: string, code: string, note?: string) => void;
  addMedication: (
    patientId: string, name: string, dose: string, sig: string,
    indication?: string, rxcui?: string,
  ) => void;
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
  ordersForPatient: (patientId: string) => Order[];
  placeOrder: (orderId: string) => void;
  completeOrder: (orderId: string) => void;
  encounter: (id: string) => Encounter | undefined;

  addSpecialist: (patientId: string, sp: Omit<Specialist, 'id' | 'patientId'>) => void;
  submitPreVisit: (patientId: string, encounterId: string, concerns: string[], narrative: string) => void;
  toggleConcern: (preVisitId: string, concernId: string) => void;
  addOrder: (patientId: string, encounterId: string, kind: OrderKind, text: string, goalId?: string) => void;
  removeOrder: (orderId: string) => void;
  addGoal: (planId: string, goal: Omit<CarePlanGoal, 'id' | 'actions'> & { actions: string[] }) => void;
  signPlan: (planId: string) => void;
  startVisit: (
    patientId: string, kind: Encounter['kind'], reason: string, duration: number,
    at?: { date: string; start: number },
  ) => string;
  /** Everything booked on one day, as the schedule needs it. */
  bookedOn: (iso: string) => Encounter[];
  moveVisit: (encounterId: string, date: string, start: number) => void;
  cancelVisit: (encounterId: string) => void;

  // changing
  acknowledgeReport: (reportId: string) => void;
  completeTask: (taskId: string) => void;
  toggleAction: (planId: string, goalId: string, actionId: string) => void;
  acceptDraft: (draftId: string) => void;
  saveNote: (encounterId: string, note: NonNullable<Encounter['note']>) => void;
  signEncounter: (encounterId: string) => void;
  setMedStatus: (medId: string, status: Medication['status'], changeNote?: string) => void;
  removePatient: (patientId: string) => void;
  markDocumentReviewed: (docId: string) => void;

  // the longitudinal plan, and what the header is generated from
  saveMasterPlan: (patientId: string, patch: Partial<MasterPlan>) => void;
  setProblemPlan: (patientId: string, conditionId: string, text: string) => void;
  setManaged: (conditionId: string, managed: boolean) => void;
  setServices: (patientId: string, services: { preventative: boolean; lifestyle: boolean }) => void;
  setGoal: (conditionId: string, goal: CareGoalStatus, note?: string) => void;
  setLifestyleStatus: (id: string, status: LifestyleIntervention['status']) => void;
  addLifestyle: (
    patientId: string, domain: LifestyleIntervention['domain'],
    prescription: string, forConditions: string[],
  ) => void;

}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<State>(() => {
    const loaded = migrate(load<State>()) ?? EMPTY;
    setNow(loaded.now ?? ORIGIN);
    return loaded;
  });

  // The provider renders before any child, so the module clock is correct
  // by the time a screen formats a date.
  setNow(s.now ?? ORIGIN);

  /** False once a write has failed, which the header then says out loud. */
  const [persisted, setPersisted] = useState(true);
  useEffect(() => { setPersisted(save(s)); }, [s]);

  /**
   * Every change, logged, by comparing the record with the record as
   * it was. Done here rather than inside each action so that an action
   * nobody remembered to instrument is still in the log.
   */
  const prev = useRef<State | null>(null);
  useEffect(() => {
    if (prev.current && prev.current !== s) {
      recordDiff(
        prev.current as unknown as Snapshot,
        s as unknown as Snapshot,
        currentActor(), s.now ?? ORIGIN,
      );
    }
    prev.current = s;
  }, [s]);

  const value = useMemo<Store>(() => {
    const by = <T extends { patientId: string }>(xs: T[], id: string) =>
      xs.filter((x) => x.patientId === id);

    /** Split a textarea into trimmed lines. */
    const lines = (t: string) => t.split('\n').map((l) => l.trim()).filter(Boolean);

    return {
      ...s,
      hasData: s.patients.length > 0,
      persisted,

      patient: (id) => s.patients.find((p) => p.id === id),
      conditionsFor: (id) => by(s.conditions, id),
      medsFor: (id) => by(s.medications, id),
      allergiesFor: (id) => by(s.allergies, id),
      documentsFor: (id) => [...by(s.documents, id)].sort((a, b) => b.date.localeCompare(a.date)),
      masterPlanFor: (id) => s.masterPlans.find((m) => m.patientId === id),
      vitalsFor: (id) => [...by(s.vitals, id)].sort((a, b) => b.date.localeCompare(a.date)),
      panelsFor: (id) => [...by(s.labPanels, id)].sort((a, b) => b.date.localeCompare(a.date)),
      examsFor: (id) => [...by(s.exams, id)].sort((a, b) => b.date.localeCompare(a.date)),
      studiesFor: (id) => [...by(s.studies, id)].sort((a, b) => b.date.localeCompare(a.date)),
      emFor: (encounterId) => s.emRecords.find((e) => e.encounterId === encounterId),
      careLogFor: (id, month) => by(s.careLog, id)
        .filter((e) => !month || e.date.startsWith(month))
        .sort((a, b) => b.date.localeCompare(a.date)),
      consentsFor: (id) => by(s.consents, id),
      checkInsFor: (id) => [...by(s.checkIns, id)].sort((a, b) => b.date.localeCompare(a.date)),
      updatesFor: (id) => [...by(s.updates, id)].sort((a, b) => b.date.localeCompare(a.date)),
      messagesFor: (id) => [...by(s.messages, id)].sort((a, b) => b.date.localeCompare(a.date)),
      requestsFor: (id) => [...by(s.requests, id)].sort((a, b) => b.sent.localeCompare(a.sent)),
      scoresFor: (id, instrument) => [...by(s.scores, id)]
        .filter((x) => (instrument ? x.instrument === instrument : true))
        .sort((a, b) => b.date.localeCompare(a.date)),

      currentVersion: (patientId) => [...by(s.chartVersions, patientId)]
        .sort((a, b) => b.version - a.version)[0],
      versionsFor: (patientId) => [...by(s.chartVersions, patientId)]
        .sort((a, b) => b.version - a.version),
      /**
       * The day, in time order.
       *
       * Both activities on one list, because the physician's morning
       * is one list. Anything already signed stays on it: a day you
       * have half finished should still show you what you did.
       */
      dayList: (iso) => {
        const day = iso ?? s.now;
        return s.encounters
          .filter((e) => e.date === day && e.status !== 'signed')
          .concat(s.encounters.filter((e) => e.date === day && e.status === 'signed'))
          .sort((a, b) => (a.start ?? 9 * 60) - (b.start ?? 9 * 60));
      },

      inbox: () => {
        const seen = new Set<string>();
        for (const v of s.chartVersions) for (const id of v.incorporated) seen.add(id);
        return buildInbox({
          messages: s.messages, updates: s.updates, panels: s.labPanels,
          studies: s.studies, vitals: s.vitals, triage: s.triage,
          now: s.now, since: addDays(s.now, -14), incorporated: seen,
        });
      },

      triageOf: (recordId) => s.triage.find((t) => t.recordId === recordId),

      ledgerFor: (patientId) => {
        const p = s.patients.find((x) => x.id === patientId);
        return p ? ledgerFor(p, s.encounters, s.now) : undefined;
      },

      closureChecks: () => {
        const closure = nextClosure(s.now);
        if (!closure) return undefined;
        return {
          closure,
          checks: closureChecks({
            closure, now: s.now,
            patients: s.patients, medications: s.medications,
            prevention: s.prevention, infoRequests: s.infoRequests,
            specialists: s.specialists, encounters: s.encounters,
          }),
        };
      },

      newSince: (patientId) => {
        const v = [...by(s.chartVersions, patientId)].sort((a, b) => b.version - a.version)[0];
        const seen = new Set(v?.incorporated ?? []);
        const isNew = (x: { id: string; date: string }) =>
          !seen.has(x.id) && x.date <= s.now;
        const updates = by(s.updates, patientId).filter(isNew);
        const messages = by(s.messages, patientId)
          .filter((x) => isNew(x) && x.from === 'patient');
        const checkIns = by(s.checkIns, patientId).filter(isNew);
        const panels = by(s.labPanels, patientId).filter(isNew);
        const vitals = by(s.vitals, patientId).filter(isNew);
        const encounters = by(s.encounters, patientId)
          .filter((e) => e.status === 'signed' && isNew(e) && e.id !== v?.encounterId);
        return {
          updates, messages, checkIns, panels, vitals, encounters,
          count: updates.length + messages.length + panels.length
            + vitals.length + encounters.length,
          urgent: messages.filter((m) => m.urgent).length
            + updates.filter((u) => u.urgent).length,
        };
      },
      infoRequestsFor: (patientId, status) => by(s.infoRequests, patientId)
        .filter((r) => (status ? r.status === status : true))
        .sort((a, b) => b.created.localeCompare(a.created)),
      lifestyleFor: (id) => by(s.lifestyle, id),
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
              id: newId('pv'), patientId, encounterId, submitted: clockNow(), narrative,
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
            status: 'draft', created: clockNow(),
          }],
        })),

      ordersForPatient: (patientId) => by(s.orders, patientId)
        .sort((a, b) => b.created.localeCompare(a.created)),

      placeOrder: (orderId) =>
        setS((p) => ({
          ...p,
          orders: p.orders.map((o) => (o.id === orderId ? { ...o, status: 'placed' } : o)),
        })),

      completeOrder: (orderId) =>
        setS((p) => ({
          ...p,
          orders: p.orders.map((o) =>
            (o.id === orderId ? { ...o, status: 'done', closed: clockNow() } : o)),
        })),

      removeOrder: (orderId) =>
        setS((p) => ({ ...p, orders: p.orders.filter((o) => o.id !== orderId) })),

      advanceTime: (days) =>
        setS((p) => {
          const to = addDays(p.now, days);
          const r = tick({
            from: p.now, to, orders: p.orders, resultSeries: p.resultSeries,
            resultReports: p.resultReports, prevention: p.prevention,
            carePlans: p.carePlans, patientEntries: p.patientEntries, tasks: p.tasks,
          });
          return {
            ...p, now: to,
            resultSeries: r.resultSeries, resultReports: r.resultReports,
            prevention: r.prevention, patientEntries: r.patientEntries,
            tasks: r.tasks, orders: r.orders, lastEvents: r.events,
          };
        }),

      resetTime: () => setS((p) => ({ ...p, now: ORIGIN, lastEvents: [] })),

      loadDemo: () => setS(demoState()),

      /**
       * A whole panel, generated and then deliberately dirtied.
       *
       * Three tidy patients is the biggest tell that a clinical
       * prototype is a demo. Judgements about navigation, search and
       * safety only hold at the volume and messiness they will meet.
       */
      loadPanel: () => {
        const g = generatePanel();
        // The longitudinal layer reads the generated record and writes
        // the years behind it: vitals at every visit, lab panels,
        // examinations, imaging, the care management and consent
        // records, and a living summary that is deliberately a few
        // records out of date. It also stamps the goal on each
        // managed problem, read off the same arc the numbers follow,
        // so the gauge and the results cannot disagree.
        const d = longitudinal(g);
        // Sharon stays in the panel. She is the hand-built deep chart
        // and the point of comparison for everything generated.
        const demo = demoState();
        setS({
          ...EMPTY,
          patients: [demo.patients[0], ...g.patients],
          conditions: [...demo.conditions.filter((c) => c.patientId === 'p0'), ...g.conditions],
          medications: [...demo.medications.filter((m) => m.patientId === 'p0'), ...g.medications],
          allergies: g.allergies,
          documents: [...demo.documents.filter((x) => x.patientId === 'p0'), ...g.documents],
          resultSeries: [...demo.resultSeries.filter((x) => x.patientId === 'p0'), ...g.resultSeries],
          resultReports: [...demo.resultReports.filter((x) => x.patientId === 'p0'), ...g.resultReports],
          encounters: [...demo.encounters.filter((x) => x.patientId === 'p0'), ...g.encounters],
          prevention: [...demo.prevention.filter((x) => x.patientId === 'p0'), ...g.prevention],
          specialists: [...demo.specialists.filter((x) => x.patientId === 'p0'), ...g.specialists],
          carePlans: [...demo.carePlans.filter((x) => x.patientId === 'p0'), ...g.carePlans],
          orders: demo.orders.filter((x) => x.patientId === 'p0'),
          tasks: [...demo.tasks.filter((x) => x.patientId === 'p0'), ...g.tasks],
          masterPlans: [...demo.masterPlans, ...d.masterPlans],
          vitals: [...demo.vitals, ...d.vitals],
          labPanels: [...demo.labPanels, ...d.labPanels],
          exams: [...demo.exams, ...d.exams],
          studies: [...demo.studies, ...d.studies],
          emRecords: [...demo.emRecords, ...d.emRecords],
          careLog: [...demo.careLog, ...d.careLog],
          consents: [...demo.consents, ...d.consents],
          checkIns: [...demo.checkIns, ...d.checkIns],
          updates: demo.updates, messages: demo.messages, requests: demo.requests,
          chartVersions: demo.chartVersions, infoRequests: demo.infoRequests,
          lifestyle: [...demo.lifestyle, ...d.lifestyle],
          now: ORIGIN,
          lastEvents: [],
        });
        return g.patients.length + 1;
      },

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
          memberSince: clockNow(),
          photoTone: Math.abs(d.name.length * 7) % 6,
          phone: d.phone,
          email: d.email,
          pinned: d.pinned.trim() || undefined,
        };

        const conditions: Condition[] = lines(d.conditions).map((name) => ({
          id: newId('cd'), patientId: id, name, code: '', status: 'active',
          // What they told us at intake, not yet a problem we have
          // taken on. Ticking it is a decision, made in the chart.
          managed: false,
          onset: clockNow(),
          provenance: { author: 'patient', by: 'Reported at intake', recorded: clockNow() },
        }));

        const medications: Medication[] = lines(d.medicines).map((line) => {
          // "Lisinopril 10 mg — one tablet each morning" and looser forms.
          const [left, right] = line.split(/\s+[—–-]\s+/, 2);
          const m = left.match(/^(.*?)\s+([\d.]+\s*\S+)$/);
          const drugName = (m ? m[1] : left).trim();
          return {
            id: newId('md'), patientId: id,
            name: drugName,
            // Resolved, not rewritten. The name stays what they said;
            // the concept id is what lets the checker see it at all.
            rxcui: resolveDrug(drugName)?.rxcui,
            dose: (m ? m[2] : '').trim(),
            sig: (right ?? '').trim(),
            started: clockNow(), status: 'active' as const,
            provenance: { author: 'patient', by: 'Reported at intake', recorded: clockNow() },
          };
        });

        const encounters: Encounter[] = d.bookIntake ? [{
          id: newId('en'), patientId: id, date: clockNow(),
          kind: 'visit', legacyKind: 'initial', setting: 'in-person',
          reason: 'First full visit. History, medicines, habits, and what they want to work on.',
          status: 'scheduled', duration: 90,
        }] : [];

        /**
         * The baseline history, as a record rather than as a field.
         *
         * Every patient gets an initial evaluation, so every chart
         * should carry a subjective from the day they joined. Written
         * here as a signed intake note plus their own answer about
         * their health overall, which is what the living summary
         * reads. Without it the summary opens by saying nobody has
         * asked them anything, which is true of the data and false of
         * the practice.
         */
        const story = d.story.trim();
        const intake: Encounter[] = story ? [{
          id: newId('en'), patientId: id, date: clockNow(),
          kind: 'visit', legacyKind: 'initial', setting: 'in-person',
          reason: 'Initial history and physical',
          status: 'signed', duration: 60, signedAt: clockNow(),
          note: {
            subjective: {
              oneLiner: '', reason: 'Baseline evaluation at registration',
              chartReview: '', diagnostics: '', specialists: '',
              additional: story,
            },
            objective: { homeMeasures: '', vitals: '', exam: '' },
            assessment: { oneLiner: '', overall: '' },
            plan: { problems: [], overall: '' },
          },
        }] : [];
        const baseline: ProblemCheckIn[] = story ? [{
          id: newId('ci'), patientId: id, date: clockNow(),
          about: { kind: 'overall' },
          feeling: 'unsure',
          text: story,
        }] : [];

        setS((p) => ({
          ...p,
          patients: [...p.patients, patient],
          conditions: [...p.conditions, ...conditions],
          medications: [...p.medications, ...medications],
          encounters: [...p.encounters, ...intake, ...encounters],
          checkIns: [...p.checkIns, ...baseline],
        }));
        return id;
      },

      addCondition: (patientId, name, code, note) =>
        setS((p) => ({
          ...p,
          conditions: [...p.conditions, {
            id: newId('cd'), patientId, name, code, status: 'active', onset: clockNow(), note,
            // A problem added here is one you are taking on. It can be
            // moved to history-only from the details drawer.
            managed: true,
            provenance: { author: 'clinician', by: ME, recorded: clockNow() },
          }],
        })),

      addMedication: (patientId, name, dose, sig, indication, rxcui) =>
        setS((p) => ({
          ...p,
          medications: [...p.medications, {
            id: newId('md'), patientId, name, rxcui, dose, sig, indication,
            started: clockNow(), status: 'active',
            provenance: { author: 'clinician', by: ME, recorded: clockNow() },
          }],
        })),

      createPlan: (patientId, summary) => {
        const id = newId('cp');
        setS((p) => ({
          ...p,
          carePlans: [...p.carePlans, {
            id, patientId, version: 1, updated: clockNow(), signed: false, summary, goals: [],
            provenance: { author: 'clinician', by: ME, recorded: clockNow() },
          }],
        }));
        return id;
      },

      addGoal: (planId, goal) =>
        setS((p) => ({
          ...p,
          carePlans: p.carePlans.map((cp) => cp.id !== planId ? cp : {
            ...cp,
            updated: clockNow(),
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
            ...cp, signed: true, signedBy: ME, updated: clockNow(),
            version: cp.signed ? cp.version + 1 : cp.version,
          }),
        })),

      startVisit: (patientId, kind, reason, duration, at) => {
        const id = newId('en');
        setS((p) => ({
          ...p,
          encounters: [...p.encounters, {
            id, patientId,
            date: at?.date ?? clockNow(),
            start: at?.start,
            kind, reason, status: 'scheduled', duration,
          }],
        }));
        return id;
      },

      // Signed visits stay on the calendar. They happened, they took
      // the time, and a week view that hides them answers the wrong
      // question about how full a day was.
      bookedOn: (iso) => s.encounters
        .filter((e) => e.date === iso)
        .sort((a, b) => (a.start ?? 0) - (b.start ?? 0)),

      moveVisit: (encounterId, date, start) =>
        setS((p) => ({
          ...p,
          encounters: p.encounters.map((e) =>
            (e.id === encounterId ? { ...e, date, start } : e)),
        })),

      cancelVisit: (encounterId) =>
        setS((p) => ({
          ...p,
          encounters: p.encounters.filter((e) => e.id !== encounterId),
          orders: p.orders.filter((o) => o.encounterId !== encounterId),
          preVisits: p.preVisits.filter((v) => v.encounterId !== encounterId),
        })),

      addJournal: (patientId, label, body, flagged) =>
        setS((p) => ({
          ...p,
          patientEntries: [...p.patientEntries, {
            id: newId('pe'), patientId, date: clockNow(), kind: 'journal',
            label: label.trim() || 'Note', body: body.trim(), flagged,
            provenance: { author: 'patient', by: 'Patient', recorded: clockNow() },
          }],
          // Only a flagged entry reaches the inbox. Everything the patient
          // writes is visible in the chart; not everything is a summons.
          tasks: flagged ? [...p.tasks, {
            id: newId('tk'), patientId, kind: 'message' as const,
            text: `Asked you to see: ${label.trim() || 'a note'}`,
            due: clockNow(), urgent: false, done: false,
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
                ? { ...r, acknowledged: true, acknowledgedBy: ME, acknowledgedAt: clockNow() }
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

      /**
       * Signing carries the visit's plan into the master plan.
       *
       * The note itself is kept exactly as signed. What moves is a
       * dated line per problem, prepended to that problem's standing
       * plan, so the longitudinal document stays current without
       * anyone retyping it and without the visit being overwritten.
       */
      signEncounter: (encounterId) =>
        setS((p) => {
          const enc = p.encounters.find((e) => e.id === encounterId);
          const encounters = p.encounters.map((e) =>
            e.id === encounterId ? { ...e, status: 'signed' as const, signedAt: clockNow() } : e);
          if (!enc?.note) return { ...p, encounters };

          const conds = p.conditions.filter((c) => c.patientId === enc.patientId);
          const existing = p.masterPlans.find((m) => m.patientId === enc.patientId);
          const base: MasterPlan = existing ?? {
            id: newId('mp'), patientId: enc.patientId, updated: clockNow(), updatedBy: ME,
                    objective: { narrative: '' },
            assessment: { narrative: '' },
            plan: { byProblem: {}, prevention: '', lifestyle: '', followUp: '' },
          };

          const byProblem = { ...base.plan.byProblem };
          let touched = false;
          for (const pr of enc.note.plan.problems) {
            const c = conds.find((x) => x.name.toLowerCase() === pr.problem.toLowerCase());
            const text = [pr.treatment, pr.orders, pr.followUp].filter((x) => x?.trim()).join(' ');
            if (!c || !text.trim()) continue;
            const line = `${fmtDate(clockNow())}: ${text.trim()}`;
            byProblem[c.id] = byProblem[c.id] ? `${line}\n\n${byProblem[c.id]}` : line;
            touched = true;
          }
          if (!touched) return { ...p, encounters };

          const next: MasterPlan = {
            ...base,
            plan: { ...base.plan, byProblem },
            updated: clockNow(), updatedBy: ME,
          };
          return {
            ...p, encounters,
            masterPlans: existing
              ? p.masterPlans.map((m) => (m.patientId === enc.patientId ? next : m))
              : [...p.masterPlans, next],
          };
        }),

      setMedStatus: (medId, status, changeNote) =>
        setS((p) => ({
          ...p,
          medications: p.medications.map((m) =>
            m.id === medId
              ? {
                ...m, status, changeNote: changeNote ?? m.changeNote,
                stopped: status === 'stopped' ? clockNow() : m.stopped,
              }
              : m),
        })),

      /**
       * Writes through to the one plan, creating it on first edit.
       * A patient with no master plan is not an error state: it is a
       * patient nobody has written one for yet.
       */
      saveMasterPlan: (patientId, patch) =>
        setS((p) => {
          const existing = p.masterPlans.find((m) => m.patientId === patientId);
          const base: MasterPlan = existing ?? {
            id: newId('mp'), patientId, updated: clockNow(), updatedBy: ME,
                    objective: { narrative: '' },
            assessment: { narrative: '' },
            plan: { byProblem: {}, prevention: '', lifestyle: '', followUp: '' },
          };
          const next: MasterPlan = {
            ...base, ...patch,
            objective: { ...base.objective, ...patch.objective },
            assessment: { ...base.assessment, ...patch.assessment },
            plan: { ...base.plan, ...patch.plan },
            updated: clockNow(), updatedBy: ME,
          };
          return {
            ...p,
            masterPlans: existing
              ? p.masterPlans.map((m) => (m.patientId === patientId ? next : m))
              : [...p.masterPlans, next],
          };
        }),

      setProblemPlan: (patientId, conditionId, text) =>
        setS((p) => {
          const existing = p.masterPlans.find((m) => m.patientId === patientId);
          const base: MasterPlan = existing ?? {
            id: newId('mp'), patientId, updated: clockNow(), updatedBy: ME,
                    objective: { narrative: '' },
            assessment: { narrative: '' },
            plan: { byProblem: {}, prevention: '', lifestyle: '', followUp: '' },
          };
          const next: MasterPlan = {
            ...base,
            plan: { ...base.plan, byProblem: { ...base.plan.byProblem, [conditionId]: text } },
            updated: clockNow(), updatedBy: ME,
          };
          return {
            ...p,
            masterPlans: existing
              ? p.masterPlans.map((m) => (m.patientId === patientId ? next : m))
              : [...p.masterPlans, next],
          };
        }),

      setManaged: (conditionId, managed) =>
        setS((p) => ({
          ...p,
          conditions: p.conditions.map((c) => (c.id === conditionId ? { ...c, managed } : c)),
        })),

      /** The gauge, and the sentence that explains it. */
      setGoal: (conditionId, goal, note) =>
        setS((p) => ({
          ...p,
          conditions: p.conditions.map((c) => (c.id === conditionId
            ? { ...c, goal, goalNote: note ?? c.goalNote, goalAssessed: clockNow() }
            : c)),
        })),

      setLifestyleStatus: (id, status) =>
        setS((p) => ({
          ...p,
          lifestyle: p.lifestyle.map((x) => (x.id === id
            ? { ...x, status, reviewed: clockNow() } : x)),
        })),

      addLifestyle: (patientId, domain, prescription, forConditions) =>
        setS((p) => ({
          ...p,
          lifestyle: [...p.lifestyle, {
            id: newId('li'), patientId, domain, prescription, forConditions,
            status: 'not-started', started: clockNow(),
          }],
        })),

      setServices: (patientId, services) =>
        setS((p) => ({
          ...p,
          patients: p.patients.map((x) => (x.id === patientId ? { ...x, services } : x)),
        })),

      /**
       * Open an encounter on the approved chart.
       *
       * The working copy is the encounter itself: it holds a note
       * that nobody has signed, and the summary stays frozen until
       * that signature. Nothing is duplicated, so nothing can get out
       * of step.
       */
      setOwner: (conditionId, owner) =>
        setS((p) => ({
          ...p,
          conditions: p.conditions.map((c) => (c.id === conditionId
            ? { ...c, owner, managed: owner !== 'theirs' }
            : c)),
        })),

      triageRecord: (patientId, recordId, choice, opts) =>
        setS((p) => ({
          ...p,
          triage: [
            ...p.triage.filter((t) => t.recordId !== recordId),
            {
              id: newId('tr'), patientId, recordId, choice,
              at: clockNow(), by: ME,
              reply: opts?.reply, encounterId: opts?.encounterId,
            },
          ],
          // Acknowledging something is a message to the patient, and
          // the patient should be able to see it in their own record
          // rather than be told it happened.
          messages: opts?.reply
            ? [...p.messages, {
              id: newId('ms'), patientId, date: clockNow(),
              from: 'practice' as const, author: ME,
              subject: 'About what you sent in',
              body: opts.reply,
            }]
            : p.messages,
          lastEvents: [...p.lastEvents, `Triaged ${recordId}: ${choice}`],
        })),

      /*
       * Bring their next visit forward, or make one.
       *
       * This used to add a care plan review, which was a second kind
       * of encounter and a second flow to keep in step. There is one
       * kind now, so the answer to "this cannot wait" is the same
       * answer as everything else: see them sooner.
       */
      preChartFor: (patientId) => [...s.precharts]
        .filter((x) => x.patientId === patientId && !x.usedBy)
        .sort((a, b) => b.date.localeCompare(a.date))[0],

      savePreChart: (patientId, notes, reviewed) =>
        setS((p) => ({
          ...p,
          // One live chart review per patient. Doing it twice before a
          // visit replaces the first; two of them waiting would mean
          // choosing, and nobody should have to choose which of their
          // own reviews counts.
          precharts: [
            ...p.precharts.filter((x) => !(x.patientId === patientId && !x.usedBy)),
            {
              id: newId('pc'), patientId, date: clockNow(), by: ME,
              notes, reviewed,
            },
          ],
        })),

      expediteReview: (patientId) => {
        const existing = s.encounters.find(
          (e) => e.patientId === patientId && e.status !== 'signed',
        );
        if (existing) {
          if (existing.date !== s.now) {
            setS((p) => ({
              ...p,
              encounters: p.encounters.map((e) => (e.id === existing.id
                ? { ...e, date: clockNow(), reason: 'Visit, brought forward' }
                : e)),
              lastEvents: [...p.lastEvents, `Visit moved to ${clockNow()}`],
            }));
          }
          return existing.id;
        }
        const id = newId('en');
        setS((p) => ({
          ...p,
          encounters: [...p.encounters, {
            id, patientId, date: clockNow(), kind: 'visit' as const,
            reason: 'Visit, brought forward',
            status: 'scheduled' as const, duration: 45,
            start: nextFreeStart(p.encounters, clockNow()),
          }],
          lastEvents: [...p.lastEvents, `Visit added ${clockNow()}`],
        }));
        return id;
      },

      bookSoonVisit: (patientId, reason) => {
        const id = newId('en');
        setS((p) => {
          // The next clinic day with room. A visit booked for a day
          // the practice is not open is not a booking.
          let day = addDays(clockNow(), 1);
          for (let i = 0; i < 21; i++) {
            if (dayStatus(day).status === 'clinic') break;
            day = addDays(day, 1);
          }
          return {
            ...p,
            encounters: [...p.encounters, {
              id, patientId, date: day, kind: 'visit' as const,
              setting: 'in-person' as const,
              reason, status: 'scheduled' as const, duration: 30,
              start: nextFreeStart(p.encounters, day),
            }],
            lastEvents: [...p.lastEvents, `Visit booked ${day}`],
          };
        });
        return id;
      },

      /**
       * Open one, or go back to the one already open.
       *
       * Starting an encounter used to mint a row every time, so
       * clicking "Care plan review" from a chart three times left
       * three of them on the day, all unfinished and all identical.
       * An encounter of the same kind, for the same patient, on the
       * same day, that nobody has approved, is the same encounter.
       */
      openEncounter: (patientId, kind) => {
        const already = s.encounters.find(
          (e) => e.patientId === patientId && e.kind === kind
            && e.date === clockNow() && e.status === 'in-progress',
        );
        if (already) return already.id;

        const id = newId('en');
        const mins = ENCOUNTER_KINDS.find((k) => k.id === kind)?.mins ?? 30;
        setS((p) => ({
          ...p,
          encounters: [...p.encounters, {
            id, patientId, date: clockNow(), kind,
            // An hour, so it lands somewhere real on the week rather
            // than at the top of the morning with no time at all.
            start: nextFreeStart(p.encounters, clockNow()),
            setting: 'in-person' as const,
            reason: 'Visit',
            status: 'in-progress', duration: mins,
            note: {
              subjective: {
                oneLiner: '', reason: '', chartReview: '', diagnostics: '',
                specialists: '', additional: '',
              },
              objective: { homeMeasures: '', vitals: '', exam: '' },
              assessment: { oneLiner: '', overall: '' },
              plan: { problems: [], overall: '' },
            },
          }],
        }));
        return id;
      },

      askPatient: (patientId, encounterId, about, ask) =>
        setS((p) => ({
          ...p,
          infoRequests: [...p.infoRequests, {
            id: newId('ir'), patientId, encounterId, about, ask,
            created: clockNow(), status: 'open',
          }],
        })),

      answerRequests: (patientId, text) =>
        setS((p) => {
          const now = clockNow();
          const open = p.infoRequests.filter(
            (r) => r.patientId === patientId && r.status === 'open',
          );
          const updId = newId('up');
          return {
            ...p,
            updates: [...p.updates, {
              id: updId, patientId, date: now,
              overall: text,
              feeling: 'same' as const,
              interval: [],
              answers: open.map((r) => r.id),
            }],
            checkIns: [...p.checkIns, {
              id: newId('ci'), patientId, updateId: updId, date: now,
              about: { kind: 'overall' as const },
              feeling: 'same' as const, text,
            }],
            infoRequests: p.infoRequests.map((r) => (open.some((o) => o.id === r.id)
              ? { ...r, status: 'answered' as const, answeredBy: updId, answeredAt: now }
              : r)),
            lastEvents: [...p.lastEvents, `Patient answered ${open.length} request(s) ${now}`],
          };
        }),

      cancelAsk: (id) =>
        setS((p) => ({
          ...p,
          infoRequests: p.infoRequests.map(
            (r) => (r.id === id ? { ...r, status: 'cancelled' as const } : r),
          ),
        })),

      approveEncounter: (encounterId, opts) =>
        setS((p) => {
          const enc = p.encounters.find((e) => e.id === encounterId);
          if (!enc) return p;
          const patientId = enc.patientId;
          const now = clockNow();
          const last = p.chartVersions
            .filter((v) => v.patientId === patientId)
            .sort((a, b) => b.version - a.version)[0];

          const version: ChartVersion = {
            id: newId('cv'), patientId,
            version: (last?.version ?? 0) + 1,
            approvedAt: now, approvedBy: ME,
            encounterId,
            subjective: opts.subjective,
            goals: opts.goals,
            plan: opts.plan,
            noChange: opts.noChange,
            // Everything on file right now, by id. What arrives after
            // this is what the next encounter has to read.
            incorporated: [
              ...p.updates, ...p.messages, ...p.checkIns, ...p.labPanels,
              ...p.vitals, ...p.encounters,
            ].filter((x) => x.patientId === patientId).map((x) => x.id),
          };

          /*
           * No care management time log.
           *
           * Chronic care management and behavioural health integration
           * were monthly programmes with their own minute thresholds,
           * and this practice does not bill insurance. What is left is
           * a visit, its length, and the note it produced.
           */
          const careLog = p.careLog;

          return {
            ...p,
            // Two outputs from one act. The note is what happened in
            // this encounter and never changes again; the version is
            // where the patient now stands. Neither is typed twice.
            encounters: p.encounters.map((e) => (e.id === encounterId
              ? {
                ...e,
                status: 'signed' as const,
                signedAt: now,
                note: opts.note ?? e.note,
                minutes: opts.minutes ?? e.minutes,
                setting: opts.setting ?? e.setting,
                wellness: opts.wellness ?? e.wellness,
              }
              : e)),
            chartVersions: [...p.chartVersions, version],
            // Requests written during the encounter go out with it.
            infoRequests: p.infoRequests.map((r) => (r.encounterId === encounterId
              ? { ...r, versionId: version.id }
              : r)),
            conditions: p.conditions.map((c) => (opts.goals[c.id]
              ? { ...c, goal: opts.goals[c.id], goalAssessed: now }
              : c)),
            masterPlans: p.masterPlans.some((m) => m.patientId === patientId)
              ? p.masterPlans.map((m) => (m.patientId === patientId
                ? { ...m, plan: opts.plan, updated: now, updatedBy: ME }
                : m))
              : [...p.masterPlans, {
                id: newId('mp'), patientId, updated: now, updatedBy: ME,
                objective: { narrative: '' },
                assessment: { narrative: '' },
                plan: opts.plan,
              }],
            careLog,
            lastEvents: [...p.lastEvents, `Chart version ${version.version} approved ${now}`],
          };
        }),

      /**
       * Three demo records, so the claim can be checked rather than
       * believed. Each one is an ordinary record of its kind: nothing
       * here writes to the summary, because nothing can. The summary
       * is derived, so adding a record is the only way to change it,
       * which is the property being demonstrated.
       */
      simulateUpdate: (patientId) =>
        setS((p) => {
          const managed = p.conditions.filter(
            (c) => c.patientId === patientId && c.managed && c.status === 'active',
          );
          const date = clockNow();
          const reqId = newId('rq');
          const updId = newId('up');
          const SAID = [
            'Worse this month, if I am honest. The routine went when my shifts changed and I have not got it back.',
            'Better. Whatever we changed last time, it has made a difference I can feel.',
            'About the same. Nothing has got worse, which after the summer I will take.',
          ];
          const feel = (['worse', 'better', 'same'] as const);
          const which = Math.floor(Math.random() * 3);
          return {
            ...p,
            requests: [...p.requests, {
              id: reqId, patientId, sent: addDays(date, -2), sentBy: ME,
              prompt: 'Before we meet: how is each of these going, and are you managing the plan we agreed?',
              about: managed.map((c) => c.id),
              answeredOn: date,
            }],
            updates: [...p.updates, {
              id: updId, patientId, date, requestId: reqId,
              feeling: feel[which], overall: SAID[which],
              // The interval history is asked every time, so the
              // answer is always one of these two shapes: something
              // happened, or nothing did. Never silence.
              interval: which === 0
                ? [{
                  kind: 'urgent-care' as const, date: addDays(date, -12),
                  text: 'Ended up at urgent care one evening with chest tightness. They did a tracing, said it was not my heart and sent me home.',
                }]
                : [],
            }],
            checkIns: [
              ...p.checkIns,
              ...managed.map((c) => ({
                id: newId('ci'), patientId, updateId: updId, date,
                about: { kind: 'condition' as const, id: c.id },
                feeling: feel[which],
                onPlan: (which === 0 ? 'no' : which === 1 ? 'yes' : 'partly') as 'no' | 'yes' | 'partly',
                text: which === 0
                  ? `I have not kept up with the plan for the ${c.name.toLowerCase()}. I would rather say so now than at the visit.`
                  : which === 1
                    ? `The ${c.name.toLowerCase()} feels better managed than it did. I am doing what we agreed.`
                    : `No change with the ${c.name.toLowerCase()}. Doing most of it, not all of it.`,
              })),
              {
                id: newId('ci'), patientId, updateId: updId, date,
                about: { kind: 'overall' as const },
                feeling: feel[which], text: SAID[which],
              },
            ],
            lastEvents: [...p.lastEvents, `Health update received ${date}`],
          };
        }),

      simulateMessage: (patientId) =>
        setS((p) => {
          const date = clockNow();
          const first = p.medications.find(
            (m) => m.patientId === patientId && m.status === 'active',
          );
          const id = newId('ms');
          const drug = first?.name ?? 'the new tablet';
          return {
            ...p,
            messages: [...p.messages, {
              id, patientId, date, from: 'patient' as const,
              author: p.patients.find((x) => x.id === patientId)?.name ?? 'The patient',
              subject: `Side effect from the ${drug.toLowerCase()}`,
              about: first?.indication
                ? p.conditions.filter((c) => c.patientId === patientId && c.name === first.indication)
                  .map((c) => c.id)
                : [],
              body: `Since about a fortnight ago I have had a dry cough that will not shift, worse at night. A friend said it can be the ${drug.toLowerCase()}. I have not stopped it but I would like to know whether I should.`,
            }],
            ...(first
              ? {
                medications: p.medications.map((m) => (m.id === first.id
                  ? {
                    ...m,
                    adherence: {
                      status: 'taking' as const, reported: date, by: 'patient' as const,
                      note: 'Still taking it, but asking whether to stop.',
                    },
                  }
                  : m)),
              }
              : {}),
            lastEvents: [...p.lastEvents, `Message received ${date}`],
          };
        }),

      simulateVisit: (patientId) =>
        setS((p) => {
          const date = clockNow();
          const managed = p.conditions.filter(
            (c) => c.patientId === patientId && c.managed && c.status === 'active',
          );
          const named = managed[0]?.name ?? 'the problem list';
          const id = newId('en');
          return {
            ...p,
            encounters: [...p.encounters, {
              id, patientId, date, kind: 'visit' as const,
              legacyKind: 'follow-up' as const, setting: 'in-person' as const,
              reason: 'Interim review',
              status: 'signed' as const, duration: 30, signedAt: date,
              note: {
                subjective: {
                  oneLiner: '', reason: 'Interim review',
                  chartReview: '', diagnostics: '', specialists: '',
                  additional: `Came in about the ${named.toLowerCase()}. Says the last change has been easier to live with than the one before it, and that the evenings are still the hard part.`,
                },
                objective: { homeMeasures: '', vitals: '', exam: '' },
                assessment: {
                  oneLiner: '',
                  overall: `${named} is the problem doing the most work at the moment. One change rather than three, reviewed in six weeks.`,
                },
                plan: { problems: [], overall: 'Continue. Repeat bloods before the next visit.' },
              },
            }],
            lastEvents: [...p.lastEvents, `Visit signed ${date}`],
          };
        }),

      markDocumentReviewed: (docId) =>
        setS((p) => ({
          ...p,
          documents: p.documents.map((d) => (d.id === docId ? { ...d, reviewed: true } : d)),
        })),

      removePatient: (patientId) =>
        setS((p) => {
          const drop = <T extends { patientId: string }>(xs: T[]) =>
            xs.filter((x) => x.patientId !== patientId);
          return {
            patients: p.patients.filter((x) => x.id !== patientId),
            conditions: drop(p.conditions), medications: drop(p.medications),
            allergies: drop(p.allergies), documents: drop(p.documents),
            resultSeries: drop(p.resultSeries), resultReports: drop(p.resultReports),
            carePlans: drop(p.carePlans), encounters: drop(p.encounters),
            prevention: drop(p.prevention), patientEntries: drop(p.patientEntries),
            aiDrafts: drop(p.aiDrafts), tasks: drop(p.tasks),
            specialists: drop(p.specialists), preVisits: drop(p.preVisits),
            orders: drop(p.orders), masterPlans: drop(p.masterPlans),
            vitals: drop(p.vitals), labPanels: drop(p.labPanels), exams: drop(p.exams),
            studies: drop(p.studies), careLog: drop(p.careLog), consents: drop(p.consents),
            precharts: drop(p.precharts),
            lifestyle: drop(p.lifestyle),
            checkIns: drop(p.checkIns), updates: drop(p.updates),
            messages: drop(p.messages), requests: drop(p.requests),
            scores: drop(p.scores), attestations: drop(p.attestations),
            triage: drop(p.triage),
            claims: drop(p.claims),
            chartVersions: drop(p.chartVersions), infoRequests: drop(p.infoRequests),
            emRecords: p.emRecords.filter((e) =>
              !p.encounters.some((x) => x.id === e.encounterId && x.patientId === patientId)),
            now: p.now, lastEvents: p.lastEvents,
          };
        }),
    };
  }, [s, persisted]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore outside StoreProvider');
  return v;
}
