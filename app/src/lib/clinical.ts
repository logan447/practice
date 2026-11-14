/**
 * Derived clinical text.
 *
 * The one-liner, the chart review and the exam templates are generated
 * in one place so the same sentence appears in the header, the
 * subjective and the assessment without three slightly different
 * versions drifting apart.
 *
 * Everything here is a draft for the physician to edit. None of it is
 * an assertion the system is making on its own.
 */
import type {
  Condition, Encounter, ExamTemplate, Medication, Patient, PreVisit,
  ResultSeries, Specialist, CarePlan, ENCOUNTER_KINDS,
} from '../domain/types';
import { ENCOUNTER_KINDS as KINDS } from '../domain/types';
import { age, fmtDate } from './format';

const SEX_WORD: Record<string, string> = { female: 'female', male: 'male' };

/** Join with commas and a final "and". */
function list(items: string[]): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

/**
 * "Marcus Reyes is a 54-year-old male with a past medical history of
 * hypertension, prediabetes and obstructive sleep apnoea."
 */
export function oneLiner(p: Patient, conditions: Condition[], forVisit?: string): string {
  const active = conditions.filter((c) => c.status === 'active').map((c) => c.name.toLowerCase());
  const pmh = active.length
    ? ` with a past medical history of ${list(active)}`
    : ' with no significant past medical history on record';
  const visit = forVisit ? `, here for ${forVisit.toLowerCase()}` : '';
  return `${p.name} is a ${age(p.dob)}-year-old ${SEX_WORD[p.sex] ?? p.sex}${pmh}${visit}.`;
}

export const kindLabel = (k: Encounter['kind']): string =>
  KINDS.find((x) => x.id === k)?.label ?? k;

/**
 * What has happened since last time, as prose.
 *
 * Deliberately selective: open plan items and the last visit's plan,
 * not the whole chart. Reproducing the record is what makes notes
 * unreadable.
 */
export function chartReview(
  encounters: Encounter[], plan: CarePlan | undefined, currentId: string,
): string {
  const prior = encounters
    .filter((e) => e.id !== currentId && e.status === 'signed')
    .sort((a, b) => b.date.localeCompare(a.date));
  const last = prior[0];

  const parts: string[] = [];
  if (last) {
    parts.push(`Last seen ${fmtDate(last.date)} for ${kindLabel(last.kind).toLowerCase()}.`);
    const lastPlan = last.note?.plan.overall?.trim() || last.note?.plan.problems[0]?.treatment?.trim();
    if (lastPlan) parts.push(`Plan then: ${lastPlan}`);
  } else {
    parts.push('No previous visits on record.');
  }

  const open = plan?.goals.flatMap((g) =>
    g.actions.filter((a) => !a.done).map((a) => `${a.text} (${g.title})`)) ?? [];
  if (open.length) {
    parts.push(`Outstanding from the care plan: ${list(open)}.`);
  }

  return parts.join(' ');
}

/** Recent labs and imaging, newest first, only what has been released. */
export function diagnosticsSummary(series: ResultSeries[]): string {
  const clinical = series.filter((s) => s.source !== 'patient');
  if (clinical.length === 0) return 'No results on file.';

  const lines = clinical
    .map((s) => {
      const last = s.points[s.points.length - 1];
      const prev = s.points[s.points.length - 2];
      const move = prev
        ? ` (was ${prev.value} on ${fmtDate(prev.date, { year: false })})`
        : '';
      const flag = last.flag !== 'normal' ? ` — ${last.flag}` : '';
      return `${s.name} ${last.value} ${s.unit}${move}${flag}, ${fmtDate(last.date)}.`;
    });
  return lines.join('\n');
}

export function specialistSummary(specialists: Specialist[]): string {
  if (specialists.length === 0) return 'None involved.';
  return specialists.map((sp) => {
    const bits = [`${sp.name}, ${sp.specialty}`];
    if (sp.lastSeen) bits.push(`seen ${fmtDate(sp.lastSeen)}`);
    let line = bits.join(', ') + '.';
    if (sp.findings) line += ` ${sp.findings}`;
    if (sp.recommendations) line += ` Advised: ${sp.recommendations}`;
    if (sp.outstanding) line += ` Outstanding: ${sp.outstanding}`;
    return line;
  }).join('\n');
}

/** Home readings, labelled as such because they are not clinic readings. */
export function homeMeasuresSummary(series: ResultSeries[]): string {
  const home = series.filter((s) => s.source === 'patient');
  if (home.length === 0) return 'None submitted.';
  return home.map((s) => {
    const recent = s.points.slice(-3);
    const vals = recent.map((p) => `${p.value} on ${fmtDate(p.date, { year: false })}`).join(', ');
    return `${s.name} (patient-measured at home): ${vals}. ${s.unit}.`;
  }).join('\n');
}

export const EXAM_TEMPLATES: Record<ExamTemplate, { label: string; body: string }> = {
  'in-person': {
    label: 'In person, normal',
    body: `General: well-appearing, no acute distress.
HEENT: normocephalic, atraumatic. Sclerae anicteric. Oropharynx clear.
Neck: supple, no lymphadenopathy, no thyromegaly.
Cardiovascular: regular rate and rhythm, no murmurs, rubs or gallops. No peripheral oedema.
Respiratory: clear to auscultation bilaterally. Normal work of breathing.
Abdomen: soft, non-tender, no organomegaly. Bowel sounds normal.
Extremities: no oedema. Pulses intact.
Skin: no rash or lesion of concern.
Neurological: alert and oriented. Gait normal.
Psychiatric: mood and affect appropriate.`,
  },
  telehealth: {
    label: 'Telehealth, normal',
    body: `Conducted by video with the patient's consent. Identity confirmed and location verified.
General: well-appearing, no acute distress. Speaking in full sentences.
Respiratory: normal work of breathing, no audible wheeze, no pausing for breath.
Cardiovascular: no visible oedema of the face or hands. Home blood pressure reviewed.
Neurological: alert and oriented. Speech fluent. Facial symmetry normal.
Psychiatric: mood and affect appropriate.
Limitations: no auscultation, palpation or direct vital signs possible by video.`,
  },
};

/** Which measures matter today, given what is being managed. */
export function relevantSeries(
  series: ResultSeries[], conditions: Condition[], limit = 4,
): ResultSeries[] {
  const active = conditions.filter((c) => c.status === 'active').map((c) => c.name.toLowerCase());
  const hits = (name: string) => {
    const n = name.toLowerCase();
    let score = 0;
    for (const c of active) {
      if (c.includes('diabet') || c.includes('prediabet')) {
        if (n.includes('a1c') || n.includes('glucose') || n.includes('sugar')) score += 3;
      }
      if (c.includes('hypertens') || c.includes('blood pressure')) {
        if (n.includes('blood pressure') || n.includes('systolic')) score += 3;
      }
      if (c.includes('lipid') || c.includes('cholesterol')) {
        if (n.includes('ldl') || n.includes('triglyceride') || n.includes('cholesterol')) score += 3;
      }
      if (c.includes('kidney') || c.includes('renal')) {
        if (n.includes('egfr') || n.includes('creatinine') || n.includes('potassium')) score += 3;
      }
      if (c.includes('obes') || c.includes('weight') || c.includes('metabolic')) {
        if (n.includes('weight')) score += 2;
      }
      if (c.includes('sleep') || c.includes('apnoea') || c.includes('apnea') || c.includes('insomnia')) {
        if (n.includes('sleep')) score += 2;
      }
    }
    return score;
  };
  return series
    .map((s) => ({ s, score: hits(s.name) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.s);
}

/** Problems worth opening the plan with, given what is active. */
export function planSeed(conditions: Condition[]): string[] {
  return conditions.filter((c) => c.status === 'active').map((c) => c.name);
}

export type { ENCOUNTER_KINDS };
export const medLine = (m: Medication): string =>
  `${m.name} ${m.dose}${m.sig ? ` — ${m.sig}` : ''}`;

export const previsitReason = (pv: PreVisit | undefined): string => {
  if (!pv) return '';
  const c = pv.concerns.map((x) => x.text);
  const head = c.length ? `${list(c)}.` : '';
  return [head, pv.narrative.trim()].filter(Boolean).join(' ');
};
