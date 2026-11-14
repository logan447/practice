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
  /** Other clinicians involved. Empty is normal and not a problem. */
  careTeam: { name: string; role: string }[];
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

export type EncounterKind = 'annual' | 'follow-up' | 'acute' | 'message' | 'intake';

/** FHIR: Encounter + Composition */
export interface Encounter {
  id: string;
  patientId: string;
  date: string;
  kind: EncounterKind;
  reason: string;
  status: 'scheduled' | 'in-progress' | 'signed';
  duration?: number; // minutes
  note?: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
  };
  signedAt?: string;
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
