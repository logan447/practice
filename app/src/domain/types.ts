/**
 * Clinical domain model.
 *
 * Shaped to map onto FHIR R4 without carrying its verbosity into a
 * prototype. Each type notes the resource it corresponds to, so the
 * storage layer can be swapped for a real FHIR backend without the UI
 * changing (see docs/systems/emr-build-assessment.md).
 *
 * The provenance rule from docs/systems/ai-layer-and-hda.md is enforced
 * at the type level: every clinical record carries an `author`, and
 * anything authored by `ai` is a draft until a clinician promotes it.
 */

/** Who put this in the record. AI-authored content is never authoritative. */
export type Author = 'clinician' | 'patient' | 'source' | 'ai';

export interface Provenance {
  author: Author;
  /** Display name of the person or system. */
  by: string;
  recorded: string; // ISO date
  /** What this rests on: ids of other records, or a document name. */
  sources?: string[];
}

// ---------------------------------------------------------------- patient

export type Sex = 'female' | 'male';

/** FHIR: Patient */
export interface Patient {
  id: string;
  name: string;
  preferredName?: string;
  dob: string; // ISO date
  sex: Sex;
  pronouns: string;
  membership: 'standard' | 'sliding-scale' | 'pro-bono';
  memberSince: string;
  photoTone: number; // 0-5, drives the avatar tint; no stock photography
  phone: string;
  email: string;
  /** One line the physician wants to see every single time. */
  pinned?: string;
}

// -------------------------------------------------------------- problems

export type ConditionStatus = 'active' | 'resolved' | 'remission';

/** FHIR: Condition */
export interface Condition {
  id: string;
  patientId: string;
  name: string;
  code: string; // ICD-10-CM
  status: ConditionStatus;
  onset: string;
  resolved?: string;
  /** Short clinical framing, physician-authored. */
  note?: string;
  provenance: Provenance;
}

// ----------------------------------------------------------- medications

export type MedStatus = 'active' | 'stopped' | 'held';

/** FHIR: MedicationRequest */
export interface Medication {
  id: string;
  patientId: string;
  name: string;
  dose: string;
  sig: string;
  started: string;
  stopped?: string;
  status: MedStatus;
  indication?: string;
  /** Why it was stopped or changed; the part most EMRs lose. */
  changeNote?: string;
  provenance: Provenance;
}

// --------------------------------------------------------------- results

export type ResultFlag = 'normal' | 'low' | 'high' | 'critical';

/** One analyte at one point in time. FHIR: Observation */
export interface ResultPoint {
  date: string;
  value: number;
  flag: ResultFlag;
}

/** A tracked analyte with its history. */
export interface ResultSeries {
  id: string;
  patientId: string;
  name: string;
  code: string; // LOINC
  unit: string;
  /**
   * Who measured it. Patient-logged readings live in their own series
   * and are never merged into clinical ones: different provenance, and
   * clinically a different measurement (see domain/measures.ts).
   */
  source?: 'clinical' | 'patient';
  refLow?: number;
  refHigh?: number;
  /** Where we have agreed to get to, if anywhere. */
  target?: { value: number; direction: 'below' | 'above' };
  points: ResultPoint[];
}

/** An inbound report awaiting review. The safety-critical object. */
export interface ResultReport {
  id: string;
  patientId: string;
  panel: string;
  resulted: string;
  worstFlag: ResultFlag;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  seriesIds: string[];
}

// ------------------------------------------------------------- care plan

export type GoalStatus = 'on-track' | 'needs-attention' | 'not-started' | 'met';

export interface CarePlanAction {
  id: string;
  text: string;
  owner: 'patient' | 'physician';
  done: boolean;
}

/** One thing being worked on. FHIR: Goal + CarePlan.activity */
export interface CarePlanGoal {
  id: string;
  title: string;
  /** Why this one, in the patient's terms. */
  why: string;
  domain: 'nutrition' | 'movement' | 'sleep' | 'stress' | 'substances' | 'medical' | 'connection';
  status: GoalStatus;
  measure?: { seriesId: string; label: string };
  actions: CarePlanAction[];
}

/** FHIR: CarePlan. Versioned, because the history is the record. */
export interface CarePlan {
  id: string;
  patientId: string;
  version: number;
  updated: string;
  /** Signed plans are what the patient sees. Drafts are not. */
  signed: boolean;
  signedBy?: string;
  summary: string;
  goals: CarePlanGoal[];
  provenance: Provenance;
}

// ------------------------------------------------------------ encounters

export type EncounterKind = 'follow-up' | 'annual' | 'acute' | 'paperwork' | 'initial';

export const ENCOUNTER_KINDS: { id: EncounterKind; label: string; mins: number }[] = [
  { id: 'follow-up', label: 'Follow-up', mins: 30 },
  { id: 'annual', label: 'Annual physical', mins: 75 },
  { id: 'acute', label: 'Acute concern', mins: 20 },
  { id: 'paperwork', label: 'Paperwork', mins: 15 },
  { id: 'initial', label: 'Initial visit', mins: 90 },
];

export type ExamTemplate = 'in-person' | 'telehealth';

/** One problem in a problem-oriented plan. */
export interface PlanProblem {
  id: string;
  problem: string;
  assessment: string;
  treatment: string;
  orders: string;
  followUp: string;
}

/**
 * The note.
 *
 * Structured rather than four free-text blocks, because the sections
 * have different sources: some are pulled from the chart, some come
 * from the patient, and some are the physician's own. Keeping them
 * apart is what lets each one be attributed correctly.
 */
export interface VisitNote {
  subjective: {
    oneLiner: string;
    reason: string;
    chartReview: string;
    diagnostics: string;
    specialists: string;
    additional: string;
  };
  objective: {
    homeMeasures: string;
    vitals: string;
    examTemplate?: ExamTemplate;
    exam: string;
  };
  assessment: {
    oneLiner: string;
    overall: string;
  };
  plan: {
    problems: PlanProblem[];
    overall: string;
  };
}

/** FHIR: Encounter + Composition */
export interface Encounter {
  id: string;
  patientId: string;
  date: string;
  kind: EncounterKind;
  reason: string;
  status: 'scheduled' | 'in-progress' | 'signed';
  duration?: number; // minutes
  note?: VisitNote;
  signedAt?: string;
}

// ------------------------------------------------------- before the visit

/** What the patient sends in before they come. */
export interface PreVisit {
  id: string;
  patientId: string;
  encounterId: string;
  /** Short items, in their words. These become today's priorities. */
  concerns: { id: string; text: string; addressed: boolean }[];
  /** The longer version, kept verbatim. */
  narrative: string;
  submitted: string;
}

// ---------------------------------------------------------------- orders

export type OrderKind = 'prescription' | 'lab' | 'imaging' | 'diagnostic' | 'referral';

export const ORDER_KINDS: { id: OrderKind; label: string }[] = [
  { id: 'prescription', label: 'Prescription' },
  { id: 'lab', label: 'Lab' },
  { id: 'imaging', label: 'Imaging' },
  { id: 'diagnostic', label: 'Other test' },
  { id: 'referral', label: 'Referral' },
];

export interface Order {
  id: string;
  patientId: string;
  encounterId?: string;
  kind: OrderKind;
  text: string;
  /** Ties the order to a problem in the care plan. */
  goalId?: string;
  status: 'draft' | 'placed';
  created: string;
}

// ----------------------------------------------------------- specialists

export interface Specialist {
  id: string;
  patientId: string;
  name: string;
  specialty: string;
  practice?: string;
  phone?: string;
  lastSeen?: string;
  /** What they found and what they advised. Kept verbatim where possible. */
  findings?: string;
  recommendations?: string;
  /** Anything still waiting on them, or on us. */
  outstanding?: string;
}

// ------------------------------------------------------------ prevention

export type PreventionStatus = 'due' | 'overdue' | 'current' | 'not-applicable';

export interface PreventionItem {
  id: string;
  patientId: string;
  name: string;
  status: PreventionStatus;
  lastDone?: string;
  dueBy?: string;
  note?: string;
}

// ------------------------------------------- patient-reported + lifestyle

export interface PatientEntry {
  id: string;
  patientId: string;
  date: string;
  kind: 'journal' | 'measurement' | 'questionnaire';
  label: string;
  body: string;
  /** The patient asked for this to be looked at. Creates a task. */
  flagged?: boolean;
  /** Set on measurement entries, so the chart can link back to the trend. */
  seriesIds?: string[];
  /** Patient-reported. Unverified by design, and labelled as such. */
  provenance: Provenance;
}

// --------------------------------------------------------------- the AI

/**
 * AI output. Never written into a clinical type. Held separately until a
 * clinician promotes it, which is an event, not an edit.
 */
export interface AiDraft {
  id: string;
  patientId: string;
  kind: 'chart-summary' | 'interval-summary' | 'note-draft' | 'plan-draft';
  title: string;
  body: string;
  /** Record ids and document names this was built from. Always shown. */
  citations: string[];
  generated: string;
  accepted: boolean;
}

// --------------------------------------------------------------- inbox

export interface Task {
  id: string;
  patientId: string;
  kind: 'result' | 'message' | 'follow-up' | 'refill' | 'prevention';
  text: string;
  due: string;
  urgent: boolean;
  done: boolean;
}

// ----------------------------------------------------------- physician time

/**
 * Physician time, for practice management only.
 *
 * Internal. Never read by the portal, never shown to the patient, and
 * never a limit on care: the allocation is a planning benchmark that
 * tells the physician whether the panel is sustainable. Care follows
 * clinical need regardless of where a patient sits against it.
 *
 * Not a FHIR clinical resource. Closest analogue is a practice-side
 * timesheet keyed to Patient and, for visits, Encounter.
 */
export type TimeKind = 'visit' | 'chart';

/** What chart time was spent on. Visit time does not need one. */
export type ChartActivity = 'review' | 'documentation' | 'results' | 'coordination' | 'messages' | 'other';

export const CHART_ACTIVITIES: { id: ChartActivity; label: string }[] = [
  { id: 'review', label: 'Reviewing records' },
  { id: 'documentation', label: 'Documenting' },
  { id: 'results', label: 'Results' },
  { id: 'coordination', label: 'Coordinating care' },
  { id: 'messages', label: 'Messages and calls' },
  { id: 'other', label: 'Other' },
];

/** How the time got into the log. */
export type TimeSource = 'ambient' | 'timer' | 'manual';

export interface TimeEntry {
  id: string;
  patientId: string;
  /** Clinic date the time was spent. */
  date: string;
  kind: TimeKind;
  /** Chart time only. */
  activity?: ChartActivity;
  /** Visit time: the kind of visit, for the history list. */
  label?: string;
  encounterId?: string;
  seconds: number;
  source: TimeSource;
  note?: string;
  /** Set when a measured entry is corrected by hand. The original is kept. */
  corrected?: { originalSeconds: number; on: string };
}

/**
 * A clock that is running or paused. At most one runs at a time across
 * the whole practice, which is what makes double counting impossible
 * by construction: one physician cannot be in two places at once.
 */
export interface RunningTimer {
  id: string;
  patientId: string;
  kind: TimeKind;
  activity?: ChartActivity;
  label?: string;
  encounterId?: string;
  source: Exclude<TimeSource, 'manual'>;
  /** Real epoch ms the current running stretch began; null while paused. */
  runningSince: number | null;
  /** Real milliseconds banked from earlier stretches. */
  bankedMs: number;
  /** Paused automatically because this other clock started. Resumes when it stops. */
  pausedBy?: string;
}

export interface CapacitySettings {
  hoursPerWeek: number;
  weeksPerYear: number;
  /** Share of working hours for direct patient care and chart work, 0 to 100. */
  carePercent: number;
  /** Active patients to divide by: a planning number, or the count in the record. */
  panelSize: number | 'record';
}
