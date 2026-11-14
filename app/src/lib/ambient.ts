/**
 * Ambient capture that gets things wrong.
 *
 * A prototype whose AI is always right teaches exactly the wrong
 * lesson. The weight of the review step gets designed to match what
 * you have watched the thing do, and if you have only ever watched it
 * succeed, you design the review thin.
 *
 * So the draft carries deliberate, realistic errors and the system
 * keeps the truth beside them. At signature it can say which ones were
 * caught and which went into the record. That count is the
 * calibration: it is the evidence for how heavy the reading has to be.
 *
 * The failure modes below are the ones ambient scribes actually
 * produce. The worst is the fabricated negative: nobody discussed
 * chest pain, and the note now says it was denied.
 */

export type ErrorKind =
  | 'fabricated-negative'
  | 'transposed-number'
  | 'attribution'
  | 'laterality'
  | 'invented-plan'
  | 'drug-confusion'
  | 'dose';

export const ERROR_LABEL: Record<ErrorKind, string> = {
  'fabricated-negative': 'A negative nobody took',
  'transposed-number': 'Digits transposed',
  attribution: 'Attributed to the wrong person',
  laterality: 'Left and right swapped',
  'invented-plan': 'A plan item nobody said',
  'drug-confusion': 'The wrong drug',
  dose: 'The wrong dose',
};

export interface InjectedError {
  id: string;
  kind: ErrorKind;
  /** Note field id, e.g. "subjective.additional". */
  field: string;
  /** Human label for that field. */
  where: string;
  /** The exact text written into the draft. Used to test the edit. */
  wrong: string;
  /** What should have been there. */
  right: string;
  /** Why it matters, in one or two sentences. */
  why: string;
  /** True for errors that would reach a patient or another clinician. */
  consequential: boolean;
}

type TextStep = {
  at: number;
  kind: 'text';
  section: 'subjective' | 'objective' | 'assessment';
  key: string;
  text: string;
  errors: InjectedError[];
};

type PlanStep = {
  at: number;
  kind: 'plan';
  /** Which problem in the plan this lands on, matched loosely. */
  match: string;
  fields: { assessment: string; treatment: string; orders: string; followUp: string };
  errors: InjectedError[];
};

export type AmbientStep = TextStep | PlanStep;

const E = (
  id: string, kind: ErrorKind, field: string, where: string,
  wrong: string, right: string, why: string, consequential = true,
): InjectedError => ({ id, kind, field, where, wrong, right, why, consequential });

/**
 * The scripted consultation.
 *
 * `faulty` runs the same visit with the errors in it. Both versions
 * exist so the difference is visible: the clean one is what you hope
 * for, and the other is what you have to be able to catch.
 */
export function ambientScript(firstName: string, faulty: boolean): AmbientStep[] {
  const subjClean =
    `${firstName} reports the walks have held up, five days most weeks. Right knee aches after the longer ones and settles by morning, no swelling, no locking or giving way. CPAP every night. Has been reading about statins and wants to understand the reasoning rather than stop it.`;

  const subjFaulty =
    `${firstName} reports the walks have held up, five days most weeks. Left knee aches after the longer ones and settles by morning, no swelling, no locking or giving way. Denies chest pain, shortness of breath and palpitations. CPAP every night. Has been reading about statins and wants to understand the reasoning rather than stop it.`;

  const objClean = 'BP 124/76 seated after five minutes, repeated 122/78. Weight 198 lb. BMI 28.6.';
  const objFaulty = 'BP 124/76 seated after five minutes, repeated 122/78. Weight 189 lb. BMI 28.6.';

  const assClean =
    'Prediabetes remains in the normal range off metformin. Blood pressure consistently under 130 at home and in clinic, with weight stable three months, so a supervised lisinopril taper is reasonable now. Knee discomfort sounds mechanical and load-related rather than inflammatory. Statin is secondary prevention and the case for continuing it is strong.';
  const assFaulty =
    'Prediabetes remains in the normal range off metformin. Blood pressure consistently under 130 at home and in clinic, with weight stable three months, so a supervised losartan taper is reasonable now. Patient feels the knee is nothing to worry about and does not want it looked at. Statin is secondary prevention and the case for continuing it is strong.';

  if (!faulty) {
    return [
      { at: 3000, kind: 'text', section: 'subjective', key: 'additional', text: subjClean, errors: [] },
      { at: 6500, kind: 'text', section: 'objective', key: 'vitals', text: objClean, errors: [] },
      { at: 9500, kind: 'text', section: 'assessment', key: 'overall', text: assClean, errors: [] },
      {
        at: 12500, kind: 'plan', match: 'hypertension', errors: [],
        fields: {
          assessment: 'Controlled.',
          treatment: 'Halve lisinopril to 5 mg for four weeks.',
          orders: 'Home BP twice weekly.',
          followUp: 'Six weeks.',
        },
      },
    ];
  }

  return [
    {
      at: 3000, kind: 'text', section: 'subjective', key: 'additional', text: subjFaulty,
      errors: [
        E('e1', 'laterality', 'subjective.additional', 'Subjective',
          'Left knee aches', 'Right knee aches',
          'The patient said right. One word, and it is the word an imaging order or a referral gets written against.'),
        E('e2', 'fabricated-negative', 'subjective.additional', 'Subjective',
          'Denies chest pain, shortness of breath and palpitations',
          'None of this was discussed',
          'Nobody asked and nobody answered. A review of systems that was never taken is now in the record as though it was, and the next clinician will read it as having been taken.'),
      ],
    },
    {
      at: 6500, kind: 'text', section: 'objective', key: 'vitals', text: objFaulty,
      errors: [
        E('e3', 'transposed-number', 'objective.vitals', 'Objective',
          'Weight 189 lb', 'Weight 198 lb',
          'Two digits swapped. It reads as a nine pound loss that did not happen, and the weight trend is one of the things the plan is being judged on.'),
      ],
    },
    {
      at: 9500, kind: 'text', section: 'assessment', key: 'overall', text: assFaulty,
      errors: [
        E('e4', 'drug-confusion', 'assessment.overall', 'Assessment',
          'a supervised losartan taper', 'a supervised lisinopril taper',
          'Not a drug on this list. Similar sounding drug names are a standard transcription failure, and this one would be acted on.'),
        E('e5', 'attribution', 'assessment.overall', 'Assessment',
          'Patient feels the knee is nothing to worry about and does not want it looked at',
          'The physician judged it mechanical; the patient asked about it',
          'The clinician’s reasoning has been put in the patient’s mouth. If the knee turns out to matter, the record says it was declined.'),
      ],
    },
    {
      at: 12500, kind: 'plan', match: 'hypertension',
      fields: {
        assessment: 'Controlled.',
        treatment: 'Halve lisinopril to 2.5 mg for four weeks.',
        orders: 'Home BP twice weekly. Refer to orthopaedics for the left knee.',
        followUp: 'Six weeks.',
      },
      errors: [
        E('e6', 'dose', 'plan.problems', 'Plan',
          'Halve lisinopril to 2.5 mg', 'Halve lisinopril to 5 mg',
          'Half of 10 mg is 5 mg. The draft wrote a quarter dose, which is a real prescription if it is signed.'),
        E('e7', 'invented-plan', 'plan.problems', 'Plan',
          'Refer to orthopaedics for the left knee', 'No referral was discussed',
          'A whole plan item nobody said, carrying the wrong side as well. Signed, it generates a referral and a bill.'),
      ],
    },
  ];
}

/** Did the physician's edit take the wrong text out? */
export const wasCaught = (err: InjectedError, finalText: string): boolean =>
  !finalText.includes(err.wrong);
