/**
 * The review of systems.
 *
 * Two different things wear this name and a note needs both.
 *
 * The first is the pertinent negatives: the three or four symptoms
 * you ask about because of the problem in front of you, written at
 * the end of that problem's line. "Denies chest pain, shortness of
 * breath, and ankle swelling" under hypertension is the sentence
 * that says you considered the things that would have changed the
 * plan. It belongs to the problem, which is why it is written there
 * and not in a block at the bottom.
 *
 * The second is the formal review: every system, once, at the foot
 * of the subjective. It is the sweep for what the problem list would
 * not have asked about.
 *
 * Lifestyle and preventative lines get neither. A review of systems
 * under "Nutrition" is a form being filled in rather than a question
 * being asked.
 *
 * One thing this file deliberately does not do is invent positives.
 * A system reads as a positive only when the patient's own words
 * matched it, and the phrases below are narrow on purpose: a false
 * positive in a review of systems is a symptom the patient never
 * had, written into a record somebody else will act on. Everything
 * else reads "no symptoms reported", which is what is true, rather
 * than "denies", which claims a question that may not have been
 * asked.
 */

export interface RosSystem {
  id: string;
  label: string;
  /** What this system is asked about, when it is asked about at all. */
  asks: string[];
}

/**
 * The systems, in the order they are asked.
 *
 * Head to toe, then the two that are asked last because they are
 * asked differently.
 */
export const ROS_SYSTEMS: RosSystem[] = [
  { id: 'constitutional', label: 'Constitutional', asks: ['fever', 'night sweats', 'weight loss', 'fatigue'] },
  { id: 'eyes', label: 'Eyes', asks: ['change in vision', 'eye pain'] },
  { id: 'ent', label: 'Ears, nose and throat', asks: ['hearing loss', 'sore throat'] },
  { id: 'cardiovascular', label: 'Cardiovascular', asks: ['chest pain', 'palpitations', 'ankle swelling'] },
  { id: 'respiratory', label: 'Respiratory', asks: ['shortness of breath', 'cough', 'wheeze'] },
  { id: 'gastrointestinal', label: 'Gastrointestinal', asks: ['abdominal pain', 'nausea', 'change in bowels'] },
  { id: 'genitourinary', label: 'Genitourinary', asks: ['burning on passing urine', 'blood in the urine'] },
  { id: 'musculoskeletal', label: 'Musculoskeletal', asks: ['joint pain', 'joint swelling', 'back pain'] },
  { id: 'skin', label: 'Skin', asks: ['rash', 'a sore that is slow to heal'] },
  { id: 'neurological', label: 'Neurological', asks: ['headache', 'dizziness', 'numbness', 'weakness'] },
  { id: 'psychiatric', label: 'Psychiatric', asks: ['low mood', 'anxiety', 'trouble sleeping'] },
  { id: 'endocrine', label: 'Endocrine', asks: ['excessive thirst', 'passing urine at night', 'shakiness'] },
];

/**
 * What a problem makes you ask about.
 *
 * Matched on the words in the problem's name rather than on a code,
 * because a problem list carries both coded and typed entries and a
 * typed "high blood pressure" asks the same questions as a coded
 * essential hypertension.
 */
const PERTINENT: { match: RegExp; asks: string[] }[] = [
  {
    match: /hypertension|blood pressure/i,
    asks: ['chest pain', 'shortness of breath', 'headache', 'change in vision', 'ankle swelling'],
  },
  {
    match: /diabet/i,
    asks: ['excessive thirst', 'passing urine at night', 'blurred vision',
      'numbness or tingling in the feet', 'shakiness between meals'],
  },
  {
    match: /lipid|cholesterol/i,
    asks: ['chest pain on exertion', 'pain in the calves on walking', 'muscle aches'],
  },
  {
    match: /thyroid/i,
    asks: ['fatigue', 'feeling cold', 'constipation', 'change in weight'],
  },
  {
    match: /arthritis|osteoarthr|joint/i,
    asks: ['joint swelling', 'the joint locking or giving way', 'pain at night', 'fever'],
  },
  {
    match: /asthma|copd|respiratory/i,
    asks: ['cough', 'wheeze', 'waking short of breath'],
  },
  {
    match: /depress|anxiet|mood/i,
    asks: ['loss of interest', 'trouble sleeping', 'thoughts of harming herself'],
  },
  {
    match: /kidney|renal|ckd/i,
    asks: ['swelling', 'passing less urine', 'blood in the urine'],
  },
];

/** "chest pain, shortness of breath, and ankle swelling" */
export function andList(xs: string[]): string {
  if (xs.length === 0) return '';
  if (xs.length === 1) return xs[0];
  if (xs.length === 2) return `${xs[0]} and ${xs[1]}`;
  return `${xs.slice(0, -1).join(', ')}, and ${xs[xs.length - 1]}`;
}

/**
 * The sentence at the end of a problem's line in the subjective.
 *
 * Empty when the problem matches nothing: a general sweep belongs in
 * the formal review at the foot of the section, and writing it under
 * every problem is how a note comes to say "denies fever" five
 * times.
 */
export function pertinentNegatives(conditionName: string): string {
  const hit = PERTINENT.find((x) => x.match.test(conditionName));
  if (!hit) return '';
  return `Denies ${andList(hit.asks)}.`;
}

/* ------------------------------------------------- what they said */

/**
 * Symptoms as patients say them.
 *
 * Narrow by design. A loose pattern here writes a symptom into the
 * record that the patient never had, and the record is what somebody
 * else acts on. Anything not matched here is not a positive; it is
 * just something they said.
 */
const SAID: { match: RegExp; system: string; symptom: string }[] = [
  { match: /\bshak(y|iness|ing)\b/i, system: 'endocrine', symptom: 'shakiness in the evenings' },
  { match: /\bthirst/i, system: 'endocrine', symptom: 'thirst' },
  { match: /\bknees?\b/i, system: 'musculoskeletal', symptom: 'knee pain' },
  { match: /\b(joint|back) pain\b/i, system: 'musculoskeletal', symptom: 'joint pain' },
  { match: /\b(tired|fatigue|exhausted|worn out)\b/i, system: 'constitutional', symptom: 'fatigue' },
  { match: /\bheadaches?\b/i, system: 'neurological', symptom: 'headache' },
  { match: /\b(dizzy|dizziness|light-?headed)\b/i, system: 'neurological', symptom: 'dizziness' },
  { match: /\b(numb|numbness|tingling)\b/i, system: 'neurological', symptom: 'numbness or tingling' },
  { match: /\bchest pain\b/i, system: 'cardiovascular', symptom: 'chest pain' },
  { match: /\bpalpitations?\b/i, system: 'cardiovascular', symptom: 'palpitations' },
  { match: /\b(ankles?|legs?) (are |were |is |was )?swollen\b|\bswelling\b/i, system: 'cardiovascular', symptom: 'swelling' },
  { match: /\b(short of breath|breathless|shortness of breath)\b/i, system: 'respiratory', symptom: 'shortness of breath' },
  { match: /\bcough(ing)?\b/i, system: 'respiratory', symptom: 'cough' },
  { match: /\bnausea|\bsick to (my|her|his) stomach\b/i, system: 'gastrointestinal', symptom: 'nausea' },
  { match: /\brash\b/i, system: 'skin', symptom: 'rash' },
  { match: /\b(not sleeping|cannot sleep|can'?t sleep|trouble sleeping|insomnia)\b/i, system: 'psychiatric', symptom: 'trouble sleeping' },
  { match: /\b(low mood|feeling down|depressed)\b/i, system: 'psychiatric', symptom: 'low mood' },
  { match: /\b(anxious|anxiety|worried all the time)\b/i, system: 'psychiatric', symptom: 'anxiety' },
];

/**
 * The formal review, as lines.
 *
 * A system the patient's own words raised reads as a positive and is
 * written first on its line, before anything else. Every other
 * system says no symptoms were reported, which is true, rather than
 * that the patient denied them, which would claim a question that
 * may not have been asked.
 *
 * The positives are highlighted where this is rendered, so the shape
 * of the block is the finding: a wall of one sentence with two lines
 * that are not.
 */
export function reviewOfSystems(saidByPatient: string[]): string {
  const text = saidByPatient.join(' · ');
  const found = new Map<string, Set<string>>();
  for (const s of SAID) {
    if (!s.match.test(text)) continue;
    if (!found.has(s.system)) found.set(s.system, new Set());
    found.get(s.system)!.add(s.symptom);
  }
  const lines = ROS_SYSTEMS.map((sys) => {
    const hits = found.get(sys.id);
    if (hits && hits.size > 0) {
      return `${sys.label}: ${andList([...hits])}. Otherwise denies ${andList(sys.asks)}.`;
    }
    return `${sys.label}: no symptoms reported.`;
  });
  return ['Review of systems', ...lines].join('\n');
}

/** Does this line belong to the formal review? Used by the readers. */
export const ROS_LINE = new RegExp(
  `^(${ROS_SYSTEMS.map((s) => s.label).join('|')}): `,
);
