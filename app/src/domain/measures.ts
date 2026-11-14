/**
 * What a patient can record themselves.
 *
 * A catalogue rather than a free-text box, so that a home blood
 * pressure becomes a number on a trend instead of a sentence nobody
 * can plot. Each entry carries its own units, sane input bounds, and
 * the LOINC code the value would map to in a real record.
 *
 * Patient-measured values are kept in their own series, never merged
 * into the clinical ones. Two reasons, and both matter:
 *
 *   1. Provenance. A reading taken on a kitchen table and a reading
 *      taken in clinic are different kinds of claim, and the rule in
 *      ai-layer-and-hda.md is that patient-reported data is labelled
 *      as such and never silently promoted.
 *   2. Clinically they are not the same measurement. Home blood
 *      pressure runs lower than clinic blood pressure and is judged
 *      against different targets. Averaging them would be wrong.
 */

export interface MeasureField {
  key: string;
  label: string;
  unit: string;
  loinc: string;
  min: number;
  max: number;
  step?: number;
  /** Outside this, prompt the patient to make contact. Deliberately wide. */
  alertBelow?: number;
  alertAbove?: number;
}

export interface Measure {
  key: string;
  label: string;
  /** What the patient is told, in their words. */
  hint: string;
  fields: MeasureField[];
}

export const MEASURES: Measure[] = [
  {
    key: 'bp',
    label: 'Blood pressure',
    hint: 'Sitting, feet on the floor, after five quiet minutes. Same arm each time.',
    fields: [
      {
        key: 'sys', label: 'Top number', unit: 'mmHg', loinc: '8459-0',
        min: 60, max: 260, alertAbove: 180, alertBelow: 90,
      },
      {
        key: 'dia', label: 'Bottom number', unit: 'mmHg', loinc: '8453-3',
        min: 30, max: 160, alertAbove: 120,
      },
    ],
  },
  {
    key: 'weight',
    label: 'Weight',
    hint: 'Morning, before breakfast, same scales.',
    fields: [{ key: 'wt', label: 'Weight', unit: 'lb', loinc: '29463-7', min: 60, max: 600, step: 0.2 }],
  },
  {
    key: 'glucose',
    label: 'Blood sugar',
    hint: 'Note whether it was before or after eating in the box below.',
    fields: [{
      key: 'glu', label: 'Blood sugar', unit: 'mg/dL', loinc: '2339-0',
      min: 20, max: 600, alertBelow: 60, alertAbove: 350,
    }],
  },
  {
    key: 'sleep',
    label: 'Sleep',
    hint: 'Roughly how long you actually slept, not how long you were in bed.',
    fields: [{ key: 'hrs', label: 'Hours slept', unit: 'hours', loinc: '93832-4', min: 0, max: 16, step: 0.5 }],
  },
  {
    key: 'activity',
    label: 'Activity',
    hint: 'Minutes of anything that made you breathe harder.',
    fields: [{ key: 'min', label: 'Active minutes', unit: 'min', loinc: '82290-8', min: 0, max: 600, step: 5 }],
  },
  {
    key: 'energy',
    label: 'How you felt',
    hint: 'Nought is the worst day you can imagine, ten is the best.',
    fields: [{ key: 'score', label: 'Energy and mood', unit: '/10', loinc: '75274-1', min: 0, max: 10 }],
  },
];

export const measureByKey = (key: string): Measure | undefined =>
  MEASURES.find((m) => m.key === key);

/** Series id for a patient-logged field. Stable, so repeat entries append. */
export const patientSeriesId = (patientId: string, measureKey: string, fieldKey: string): string =>
  `ps-${patientId}-${measureKey}-${fieldKey}`;

/**
 * Is this reading far enough outside the ordinary that someone should
 * look at it today? Deliberately wide: this is a prompt to make
 * contact, not a clinical judgment, and a prototype that cries wolf
 * teaches people to ignore it.
 */
export function isAlerting(field: MeasureField, value: number): boolean {
  if (field.alertAbove !== undefined && value >= field.alertAbove) return true;
  if (field.alertBelow !== undefined && value <= field.alertBelow) return true;
  return false;
}
