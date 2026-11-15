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
  /**
   * What this practice provides for this person, apart from managing
   * named problems. Two independent switches rather than a tier,
   * because a patient can have chronic disease management and
   * lifestyle medicine without preventative services, or any other
   * combination. The chart's summary line is generated from these.
   */
  services?: { preventative: boolean; lifestyle: boolean };
  photoTone: number; // 0-5, drives the avatar tint; no stock photography
  phone: string;
  email: string;
  /** One line the physician wants to see every single time. */
  pinned?: string;
}

// -------------------------------------------------------------- problems

export type ConditionStatus = 'active' | 'resolved' | 'remission';

/**
 * One status system, used everywhere a category is judged.
 *
 * Chronic conditions, preventative services and lifestyle medicine
 * all answer the same question: is this where we want it, or does it
 * need work. Four-point scales (improving, stable, worsening, not
 * assessed) carry more nuance than a chart reader can use at a
 * glance, and the nuance belongs in the sentence underneath rather
 * than in the badge. Two states, one visual treatment, applied the
 * same way in all three categories, so a chart can be scanned for
 * what needs attention in seconds.
 */
export type CareGoalStatus = 'at-goal' | 'needs-improvement';

export const GOAL_LABEL: Record<CareGoalStatus, string> = {
  'at-goal': 'At goal',
  'needs-improvement': 'Needs improvement',
};

/**
 * And one for the things being done about them.
 *
 * Interventions answer a different question: is this running, does it
 * need me, or is it finished. The same three states cover a drug, a
 * lab, a referral, a vaccine and a lifestyle prescription, which is
 * what makes a plan scannable across categories that would otherwise
 * each have their own vocabulary.
 */
export type ActionStatus = 'active' | 'needs-attention' | 'complete';

export const ACTION_LABEL: Record<ActionStatus, string> = {
  active: 'Active',
  'needs-attention': 'Needs attention',
  complete: 'Complete',
};

export interface Condition {
  id: string;
  patientId: string;
  name: string;
  /** ICD-10-CM. Empty when the problem was typed rather than coded. */
  code: string;
  status: ConditionStatus;
  /**
   * Whether this practice actively manages it, as opposed to carrying
   * it on the history. The distinction is the whole point of the
   * summary line: "past medical history" and "what we are doing" are
   * different lists and most charts conflate them.
   */
  managed?: boolean;
  /**
   * Whether this is where we want it, as data rather than prose.
   *
   * Absent means nobody has judged it, which is its own finding and
   * is shown as needing improvement rather than as fine.
   */
  goal?: CareGoalStatus;
  goalNote?: string;
  goalAssessed?: string;
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
  /**
   * RxNorm ingredient concept, when the drug was picked from the
   * terminology rather than typed. Optional on purpose: most of what
   * arrives from outside is free text, and checking has to work on
   * that too (see lib/terminology.resolveDrug).
   */
  rxcui?: string;
  dose: string;
  sig: string;
  started: string;
  stopped?: string;
  status: MedStatus;
  indication?: string;
  /** Why it was stopped or changed; the part most EMRs lose. */
  changeNote?: string;
  /**
   * Whether it is actually being taken, as last reported.
   *
   * Not a field most records have, and the omission is the point: a
   * medicine list says what was prescribed, and the only thing that
   * matters clinically is what is being swallowed. Stored with who
   * said so and when, because "taking it" from the patient in March
   * and "taking it" assumed by us in November are different facts.
   */
  adherence?: {
    status: 'taking' | 'missing-some' | 'not-taking';
    reported: string;
    by: 'patient' | 'clinician';
    note?: string;
  };
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
  /**
   * The sending lab, when the result came from outside. Set means an
   * outside result, which is the case where a missing reference range
   * is a problem rather than simply how the measure works.
   */
  from?: string;
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

export type EncounterKind =
  | 'follow-up' | 'annual' | 'acute' | 'paperwork' | 'initial' | 'home'
  | 'ccm' | 'bhi';

/**
 * The three encounters that advance the living chart.
 *
 * A clinical visit, a chronic care management review and a
 * behavioural health review are different services with different
 * documentation, and the same workflow: open on the approved chart,
 * read what has arrived since, write, ask for what is missing, sign.
 * Keeping one workflow across all three is what stops the second and
 * third becoming administrative exercises nobody does.
 */
export const REVIEW_KINDS: EncounterKind[] = ['ccm', 'bhi'];

/**
 * Durations are the schedule's unit of truth. The home visit figure is
 * sourced: working-model.md §4 puts it at about two to two and a half
 * hours including travel, which is why it is the appointment that
 * decides what else a day can hold.
 */
export const ENCOUNTER_KINDS: { id: EncounterKind; label: string; mins: number }[] = [
  { id: 'follow-up', label: 'Follow-up', mins: 30 },
  { id: 'annual', label: 'Annual physical', mins: 75 },
  { id: 'acute', label: 'Acute concern', mins: 20 },
  { id: 'paperwork', label: 'Paperwork', mins: 15 },
  { id: 'initial', label: 'Initial visit', mins: 90 },
  { id: 'home', label: 'Home visit', mins: 150 },
  { id: 'ccm', label: 'Care management review', mins: 20 },
  { id: 'bhi', label: 'Behavioural health review', mins: 20 },
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
  /** Minutes from midnight. Absent on historical visits. */
  start?: number;
  duration?: number; // minutes
  note?: VisitNote;
  signedAt?: string;
}

// ------------------------------------------------- the longitudinal plan

/**
 * The master care plan.
 *
 * Not an encounter note. One living SOAP document per patient that
 * stays current as visits happen, while the individual notes are kept
 * as they were signed. The sections hold the physician's own prose;
 * the structured parts of the chart (measures, results, problems,
 * goals, prevention, medicines) are composed alongside them at read
 * time rather than copied in, so the plan cannot drift out of date
 * with the record it describes.
 */
export interface MasterPlan {
  id: string;
  patientId: string;
  updated: string;
  updatedBy: string;
  objective: {
    /** Anything the measures and results do not already say. */
    narrative: string;
  };
  assessment: {
    /** Overall clinical assessment across the problems. */
    narrative: string;
  };
  plan: {
    /** Keyed by condition id. One management plan per problem. */
    byProblem: Record<string, string>;
    prevention: string;
    lifestyle: string;
    followUp: string;
  };
}

// ------------------------------------------------- the patient's words

/**
 * What the patient says about one problem, before the visit.
 *
 * FHIR: QuestionnaireResponse, one item per problem.
 *
 * The reason this is its own record and not a line in the note. A
 * longitudinal subjective written only from visit notes is a
 * clinician's account of a patient's account, filtered twice and
 * updated only on the days we happen to see them. Asking the patient
 * to say how each problem is going, in their own words, before every
 * visit gives the summary a second source that is actually theirs,
 * dated, and never rewritten by us.
 *
 * It is kept strictly apart from the chart review beside it. Patient
 * testimony and clinical reading disagree often, and the disagreement
 * is usually the most useful thing on the screen.
 */
export type CheckInFeeling = 'better' | 'same' | 'worse' | 'unsure';

export const FEELING_LABEL: Record<CheckInFeeling, string> = {
  better: 'Better',
  same: 'About the same',
  worse: 'Worse',
  unsure: 'Not sure',
};

/** Whether they are doing the plan as written, in their own judgement. */
export type OnPlan = 'yes' | 'partly' | 'no';

export const ON_PLAN_LABEL: Record<OnPlan, string> = {
  yes: 'Doing the plan',
  partly: 'Doing some of it',
  no: 'Not doing it',
};

export interface ProblemCheckIn {
  id: string;
  patientId: string;
  /** The visit it was sent in before, where there was one. */
  encounterId?: string;
  /** The update it was part of, so answers stay together. */
  updateId?: string;
  date: string;
  /**
   * What it is about. A condition id, a prevention item id, a
   * lifestyle intervention id, or the whole of their health.
   */
  about:
  | { kind: 'condition'; id: string }
  | { kind: 'prevention'; id: string }
  | { kind: 'lifestyle'; id: string }
  | { kind: 'overall' };
  feeling: CheckInFeeling;
  onPlan?: OnPlan;
  /** Their words, verbatim. Never edited here. */
  text: string;
}

// ------------------------------------------------ the approved chart

/**
 * WHY THE SUMMARY IS VERSIONED AND NOT DERIVED.
 *
 * An earlier version of this prototype computed the whole subjective
 * from the record every time the chart was opened. Drift became
 * impossible, which was the point, but so did attribution: the chart
 * could change because a patient sent a message at eleven at night,
 * and a clinical summary that moves without a clinician is a feed
 * rather than a record.
 *
 * So the summary is a snapshot of structured state, approved at a
 * moment by a named person, and the chart renders from the snapshot.
 * Nothing holds new information back; the chart simply is not reading
 * it. The synthesis engine still exists and still reads everything,
 * but it now produces the draft inside an encounter rather than the
 * page.
 *
 * Versions are immutable. The audit trail is a by-product.
 */
export interface ChartVersion {
  id: string;
  patientId: string;
  /** 1, 2, 3. Shown as "Version 3". */
  version: number;
  approvedAt: string;
  approvedBy: string;
  /** The encounter whose approval produced it. */
  encounterId?: string;
  /**
   * The subjective as approved, stored whole.
   *
   * Typed loosely on purpose: this is a snapshot of whatever the
   * renderer takes, and pinning the shape here would mean migrating
   * every stored version every time the summary gains a field. What
   * is guaranteed is that it renders.
   */
  subjective: unknown;
  /** Problem statuses as approved, keyed by condition id. */
  goals: Record<string, CareGoalStatus>;
  /** The plan as approved. */
  plan: {
    byProblem: Record<string, string>;
    prevention: string;
    lifestyle: string;
    followUp: string;
  };
  /** Set when the review found nothing to change, which is worth recording. */
  noChange?: boolean;
  /**
   * The ids of every record this version was approved over.
   *
   * Membership rather than a date, because dates in this record are
   * days: an answer that arrives an hour after the version was
   * approved has the same date as the version, and comparing dates
   * would swallow it. What is new is what is not in this list.
   */
  incorporated: string[];
}

/**
 * Something we asked the patient for, tied to what it is about.
 *
 * Written during an encounter, sent when it is signed, and closed by
 * the answer rather than by somebody remembering. An open request is
 * the most useful thing on a chart between visits: it is the one
 * piece of the plan that depends on somebody else.
 */
export interface InfoRequest {
  id: string;
  patientId: string;
  /** The version whose approval sent it. */
  versionId?: string;
  encounterId?: string;
  about:
  | { kind: 'condition'; id: string }
  | { kind: 'prevention'; id: string }
  | { kind: 'lifestyle'; id: string }
  | { kind: 'overall' };
  /** What we asked for, in the words the patient will see. */
  ask: string;
  created: string;
  status: 'open' | 'answered' | 'cancelled';
  /** The check-in or update that answered it. */
  answeredBy?: string;
  answeredAt?: string;
}

// ------------------------------------------- contact between visits

/**
 * An encounter is not only a visit.
 *
 * Most of what we learn about a patient on a membership model arrives
 * between appointments: an answer to a question we sent, a message
 * about a side effect, a note that the walking has stopped. If only
 * visits are records, all of that is either lost or buried in a
 * thread, and the longitudinal summary is built from six data points
 * a year instead of sixty.
 *
 * So anything that tells us something about how the patient is doing
 * is a dated, attributable record, and the summary reads all of them.
 * What separates the kinds is not importance, it is who wrote it and
 * whether anybody signed it, and both of those stay visible.
 */

/** A question we sent, so that an answer has something to answer. */
export interface UpdateRequest {
  id: string;
  patientId: string;
  sent: string;
  sentBy: string;
  /** What we asked, in the words the patient saw. */
  prompt: string;
  /** Condition ids the question is about, where it is about any. */
  about: string[];
  answeredOn?: string;
}

/**
 * A health update the patient submitted.
 *
 * Either prompted by a request or sent on their own. The per problem
 * answers live in ProblemCheckIn and point back here, so one update
 * is one record with several answers inside it rather than a handful
 * of loose rows with the same date.
 */
/**
 * What happened since we last saw them, in their words.
 *
 * The interval history is the half of a pre-visit report that a
 * chronic disease questionnaire always misses. Somebody can be doing
 * well on every problem on the list and have spent a night in an
 * emergency department, started seeing a podiatrist, or finished a
 * course of antibiotics nobody told us about. Asked as structured
 * items rather than as a free text box, because "anything else?"
 * reliably returns nothing.
 */
export type IntervalKind =
  | 'acute' | 'illness' | 'hospital' | 'urgent-care' | 'specialist';

export const INTERVAL_LABEL: Record<IntervalKind, string> = {
  acute: 'New problem',
  illness: 'Illness',
  hospital: 'Hospital stay',
  'urgent-care': 'Urgent care',
  specialist: 'New specialist',
};

export interface IntervalEvent {
  kind: IntervalKind;
  /** What they said happened, in their words. */
  text: string;
  date?: string;
}

export interface PatientUpdate {
  id: string;
  patientId: string;
  date: string;
  requestId?: string;
  /** Their words about their health overall, where they wrote any. */
  overall?: string;
  /** How they said things were going overall. */
  feeling?: CheckInFeeling;
  /**
   * What has happened since the last visit.
   *
   * An empty array is an answer: they were asked and there was
   * nothing. Undefined means they were not asked, which is a
   * different fact and is shown as one.
   */
  interval?: IntervalEvent[];
  /** What they sent in with it: readings, a photo, a log. */
  attachments?: string[];
  /** Flagged for review before the next encounter. */
  urgent?: boolean;
  /** The request this answers, where it answers one. */
  answers?: string[];
}

/** One message in a thread between the patient and the practice. */
export interface Message {
  id: string;
  patientId: string;
  date: string;
  /**
   * Flagged for review before the next encounter.
   *
   * Urgency is a property of the record, set by whoever sent it and
   * raisable by anybody who reads it. Without it, the cost of putting
   * a physician between new information and the record is paid by the
   * patient who wrote in about chest pain on a Friday.
   */
  urgent?: boolean;
  from: 'patient' | 'practice';
  author: string;
  subject?: string;
  body: string;
  /** Conditions it is about, where it is about any. */
  about?: string[];
  /** Threading, so a reply sits with what it replies to. */
  replyTo?: string;
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
  /**
   * draft is written but not sent, placed is out and waiting, done is
   * closed. The middle one is the state that matters: an order that is
   * out and forgotten is how results get missed.
   */
  status: 'draft' | 'placed' | 'done';
  created: string;
  closed?: string;
}

// ------------------------------------------------------------- allergies

/** FHIR: AllergyIntolerance */
export interface Allergy {
  id: string;
  patientId: string;
  substance: string;
  reaction?: string;
  severity?: 'mild' | 'moderate' | 'severe' | 'unknown';
  recorded: string;
  provenance: Provenance;
}

// ------------------------------------------------------------- documents

/**
 * An outside record. Some arrive as clean text, some as a scan nobody
 * has read, and some fail to parse at all. A chart that only models
 * the first case is not modelling reality.
 */
export interface ChartDocument {
  id: string;
  patientId: string;
  title: string;
  date: string;
  from: string;
  kind: 'referral' | 'discharge' | 'consult' | 'imaging' | 'lab' | 'other';
  status: 'parsed' | 'scanned' | 'failed';
  /** Present when parsed. A scan has none, and a failure has garbage. */
  text?: string;
  reviewed: boolean;
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

// -------------------------------------------------- lifestyle medicine

/**
 * The six areas lifestyle medicine actually works in.
 *
 * Coded rather than free text so that an intervention can be
 * tracked, reviewed and reported like any other treatment. A plan
 * that says "discussed diet and exercise" is not a plan, and it is
 * not billable as one either.
 */
export type LifestyleDomain =
  | 'nutrition' | 'activity' | 'sleep' | 'stress' | 'connection' | 'substances';

export const LIFESTYLE_DOMAINS: { id: LifestyleDomain; label: string }[] = [
  { id: 'nutrition', label: 'Nutrition' },
  { id: 'activity', label: 'Physical activity' },
  { id: 'sleep', label: 'Sleep' },
  { id: 'stress', label: 'Stress' },
  { id: 'connection', label: 'Social connection' },
  { id: 'substances', label: 'Substances' },
];

export type LifestyleStatus = 'not-started' | 'active' | 'achieved' | 'struggling';

export const LIFESTYLE_STATUS_LABEL: Record<LifestyleStatus, string> = {
  'not-started': 'Not started',
  active: 'In progress',
  achieved: 'Achieved',
  struggling: 'Struggling',
};

export interface LifestyleIntervention {
  id: string;
  patientId: string;
  domain: LifestyleDomain;
  /** What was actually prescribed, in terms the patient would recognise. */
  prescription: string;
  /** Which problems this is aimed at. */
  forConditions: string[];
  status: LifestyleStatus;
  started: string;
  reviewed?: string;
  /** What is getting in the way, when something is. */
  barrier?: string;
}

// ------------------------------------------------------------- vitals

/**
 * One set of vitals, taken at one time, in one place.
 *
 * Office and home are kept apart and never averaged together. They
 * answer different questions, they disagree systematically, and a
 * chart that merges them loses the only interesting thing about
 * having both.
 */
export interface VitalsSet {
  id: string;
  patientId: string;
  date: string;
  source: 'office' | 'home';
  encounterId?: string;
  systolic?: number;
  diastolic?: number;
  heartRate?: number;
  weightLb?: number;
  bmi?: number;
  temperatureF?: number;
  spo2?: number;
  respRate?: number;
  note?: string;
}

// -------------------------------------------------------------- labs

export type LabGroup = 'cbc' | 'bmp' | 'cmp' | 'lipid' | 'metabolic' | 'thyroid' | 'other';

export interface LabValue {
  /** Short label as it appears in a fishbone, e.g. "Na", "A1c". */
  key: string;
  name: string;
  value: number;
  unit: string;
  refLow?: number;
  refHigh?: number;
  flag: ResultFlag;
}

/**
 * A panel as it was resulted, kept together.
 *
 * Fishbones are drawn from panels rather than from loose analytes
 * because the shape only means anything when the values came back
 * together on one draw.
 */
export interface LabPanel {
  id: string;
  patientId: string;
  date: string;
  group: LabGroup;
  name: string;
  /** Where it was done, when that is not this practice. */
  from?: string;
  values: LabValue[];
}

// ---------------------------------------------------------- the exam

/**
 * A physical examination as performed on a date.
 *
 * Never carried forward. An examination that was not done on the day
 * is not a finding, and a chart that reprints last month's normal
 * exam under today's date is producing a false record, which is both
 * a clinical problem and the single most common audit finding in
 * copied-forward notes.
 */
export interface ExamRecord {
  id: string;
  patientId: string;
  encounterId: string;
  date: string;
  by: string;
  /** System, finding. Compared against the previous exam to show change. */
  findings: { system: string; text: string }[];
}

// -------------------------------------------------- other diagnostics

export interface DiagnosticStudy {
  id: string;
  patientId: string;
  date: string;
  kind: 'imaging' | 'procedure' | 'cardiac' | 'screening' | 'other';
  name: string;
  from?: string;
  /** The reported impression, verbatim where it came from outside. */
  impression: string;
  significant: boolean;
}

// ------------------------------------------------ validated instruments

/**
 * A scored questionnaire, kept as a number rather than as prose.
 *
 * Behavioural health integration requires systematic assessment with
 * a validated rating scale, and a wellness visit requires screening
 * for depression and for cognitive impairment. "Discussed mood" does
 * not satisfy either. Storing the instrument, the score, the date and
 * who answered is what makes the requirement checkable rather than
 * assertable, and it is also the only way to show a trajectory, which
 * is what the clinical work actually turns on.
 */
export type InstrumentId =
  | 'phq-9' | 'phq-2' | 'gad-7' | 'audit-c' | 'mini-cog' | 'phq-9-item-9';

export const INSTRUMENTS: {
  id: InstrumentId; label: string; max: number;
  /** What the score means, in bands. */
  bands: { at: number; label: string }[];
}[] = [
  {
    id: 'phq-9', label: 'PHQ-9', max: 27,
    bands: [
      { at: 0, label: 'None or minimal' }, { at: 5, label: 'Mild' },
      { at: 10, label: 'Moderate' }, { at: 15, label: 'Moderately severe' },
      { at: 20, label: 'Severe' },
    ],
  },
  { id: 'phq-2', label: 'PHQ-2', max: 6, bands: [{ at: 0, label: 'Negative' }, { at: 3, label: 'Positive' }] },
  {
    id: 'gad-7', label: 'GAD-7', max: 21,
    bands: [
      { at: 0, label: 'Minimal' }, { at: 5, label: 'Mild' },
      { at: 10, label: 'Moderate' }, { at: 15, label: 'Severe' },
    ],
  },
  { id: 'audit-c', label: 'AUDIT-C', max: 12, bands: [{ at: 0, label: 'Negative' }, { at: 3, label: 'Positive' }] },
  { id: 'mini-cog', label: 'Mini-Cog', max: 5, bands: [{ at: 0, label: 'Possible impairment' }, { at: 3, label: 'Negative' }] },
];

export interface InstrumentScore {
  id: string;
  patientId: string;
  instrument: InstrumentId;
  date: string;
  score: number;
  /** Who filled it in. Patient-reported unless a clinician administered it. */
  by: 'patient' | 'clinician';
  encounterId?: string;
  /**
   * Item 9 of the PHQ-9, kept separately because it is a safety
   * question and burying it inside a total is how it gets missed.
   */
  safetyFlag?: boolean;
  note?: string;
}

export const bandFor = (instrument: InstrumentId, score: number): string => {
  const spec = INSTRUMENTS.find((x) => x.id === instrument);
  if (!spec) return '';
  return [...spec.bands].reverse().find((b) => score >= b.at)?.label ?? '';
};

// ------------------------------------------- documentation and billing

/**
 * WHY THESE ARE SEPARATE FROM THE LIVING SUMMARY.
 *
 * The longitudinal summary says where the patient is now. Billing
 * asks a different question: what happened on a particular date, and
 * what was done in a particular calendar month. Neither can be
 * reconstructed from a document that is continuously rewritten.
 *
 * So an encounter keeps its signed note and its own record of the
 * decision making and the time, care management keeps a per-month
 * time log, and consent is its own dated record. See
 * docs/systems/documentation-and-billing.md for what each service
 * actually requires and where that came from. NEEDS-COUNSEL and
 * NEEDS-CPA before any of this supports a claim.
 */

export type MdmLevel = 'straightforward' | 'low' | 'moderate' | 'high';

/**
 * The elements an office E/M level is selected from.
 *
 * Current AMA guidance selects the level either by medical decision
 * making, where two of the three elements must meet the level, or by
 * total time on the date of the encounter. Both are captured because
 * the correct answer is whichever is higher, and that cannot be
 * decided without recording both.
 */
export interface EmRecord {
  encounterId: string;
  /** Condition ids addressed at this visit, not the whole problem list. */
  problemsAddressed: string[];
  /** What was reviewed or ordered, each counted once. */
  dataReviewed: string[];
  problemsLevel: MdmLevel;
  dataLevel: MdmLevel;
  riskLevel: MdmLevel;
  /** Minutes on the date of the encounter, face to face and not. */
  totalMinutes: number;
  /** What the physician chose, and why. Never set automatically. */
  selectedBy?: 'mdm' | 'time';
  code?: '99212' | '99213' | '99214' | '99215';
}

export type CareProgram = 'ccm' | 'bhi' | 'apcm' | 'preventive' | 'lifestyle';

/**
 * One block of time, by one person, on one day.
 *
 * Countable is a judgement, not a calculation. Time a model spent is
 * not clinical staff time, and recording it as though it were is the
 * fastest way to turn a care management programme into an
 * overpayment. The flag is here so that distinction is in the data
 * rather than in somebody's memory.
 */
export interface CareLogEntry {
  id: string;
  patientId: string;
  program: CareProgram;
  date: string;
  minutes: number;
  by: string;
  role: 'physician' | 'clinical-staff' | 'non-clinical' | 'automated';
  activity: string;
  countable: boolean;
  /** Present when not countable: why. */
  excludedBecause?: string;
  /** The encounter it was recorded in, where it came from one. */
  encounterId?: string;
  /** Condition ids the work was about. */
  problems?: string[];
  /** Whether the care plan was changed by this work. */
  planUpdated?: boolean;
  /**
   * The same minutes cannot be counted twice.
   *
   * A block of time belongs to one programme. Where an activity could
   * arguably sit under two, it is recorded once against the one it was
   * claimed for, and this names the other so the choice is visible
   * rather than silently available to both.
   */
  notAlsoCountedFor?: CareProgram[];
}

// ------------------------------------------------- the monthly record

/**
 * Whether a month's service can be billed, and why or why not.
 *
 * Deliberately a ladder rather than a boolean, because four different
 * things get conflated and only the last one is a claim:
 *
 *   recorded      minutes exist in the log
 *   threshold     the countable minutes reach the code's minimum
 *   requirements  consent, eligibility, care plan, the rest
 *   ready         a physician has looked at all of it and agrees
 *
 * Reaching a time threshold is the weakest of the four and the one
 * software is most tempted to treat as sufficient. It is not, and the
 * system never advances past `threshold` on its own.
 */
export type MonthStatus = 'recorded' | 'threshold' | 'requirements' | 'ready' | 'claimed';

export interface RequirementCheck {
  id: string;
  label: string;
  /** What the rule actually asks for, in one line. */
  rule: string;
  met: boolean;
  /** What in this chart satisfies it, or what is missing. */
  evidence: string;
  /** False where this is good practice rather than a billing rule. */
  mandatory: boolean;
}

export interface MonthlyService {
  id: string;
  patientId: string;
  program: CareProgram;
  /** YYYY-MM. */
  month: string;
  code?: string;
  countableMinutes: number;
  excludedMinutes: number;
  checks: RequirementCheck[];
  status: MonthStatus;
  /** Set when a physician reviewed the month and agreed it is billable. */
  attestedBy?: string;
  attestedAt?: string;
}

/**
 * The billing output, produced only after the requirements were
 * verified by a person. Separate from the clinical record on purpose.
 */
export interface Claim {
  id: string;
  patientId: string;
  code: string;
  /** The service month for care management, or the date of service. */
  period: string;
  units: number;
  diagnoses: string[];
  createdAt: string;
  createdBy: string;
  /** What it was built from. */
  basis: { encounterId?: string; monthlyServiceId?: string };
  status: 'prepared' | 'submitted' | 'void';
}

export interface ServiceConsent {
  id: string;
  patientId: string;
  program: CareProgram;
  date: string;
  method: 'verbal' | 'written';
  by: string;
  /** What the patient was told. The part audits ask for. */
  note: string;
  revoked?: string;
}

