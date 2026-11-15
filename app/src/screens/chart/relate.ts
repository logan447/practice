/**
 * Tying the record back to the problem it belongs to.
 *
 * The chart stores medicines, orders, labs, vitals and specialists as
 * flat lists, which is right: that is how they arrive and how they
 * have to be queried. But a problem-based summary needs the opposite
 * view, and somewhere has to do the joining.
 *
 * Doing it here, once, rather than in each section, is the only way
 * the subjective, the assessment and the plan can be guaranteed to
 * say the same thing about the same problem. Two screens with two
 * matchers is two answers.
 *
 * The joins are honest about being joins. Medicines carry an
 * indication, so that one is a lookup. Orders and specialists do not,
 * so those are matched on text and specialty, and where the match
 * fails the section says it found nothing rather than guessing.
 */
import type { LabPanel, Medication, Order, Specialist, VitalsSet } from '../../domain/types';

// ------------------------------------------------------- specialists

/**
 * Which specialty looks after which problem.
 *
 * A letter from cardiology is relevant to the hypertension and to the
 * heart failure, and to nothing else on the list. Showing it against
 * every problem is how a specialist comment stops being read.
 */
const SPECIALTY_FOR: Record<string, RegExp> = {
  'Essential hypertension': /cardiol|nephrol/i,
  'Coronary artery disease': /cardiol/i,
  'Atrial fibrillation': /cardiol/i,
  'Heart failure with preserved ejection fraction': /cardiol/i,
  'Type 2 diabetes mellitus': /endocrin|ophthalm|podiatr/i,
  Prediabetes: /endocrin/i,
  Hypothyroidism: /endocrin/i,
  'Mixed hyperlipidemia': /cardiol|lipid/i,
  'Chronic kidney disease, stage 3a': /nephrol/i,
  Obesity: /endocrin|bariatric/i,
  Osteoarthritis: /orthop|rheumat/i,
  'Osteoarthritis, both knees': /orthop|rheumat/i,
  'Chronic low back pain': /orthop|neurosurg|pain/i,
  'Gastro-oesophageal reflux': /gastro/i,
  Asthma: /pulmon|respirat|allerg/i,
  'Obstructive sleep apnea': /pulmon|sleep|ear/i,
  'Generalized anxiety disorder': /psychiat|psychol/i,
  'Major depressive disorder': /psychiat|psychol/i,
  'Benign prostatic hyperplasia': /urolog/i,
};

export const specialistsAbout = (
  conditionName: string, specialists: Specialist[],
): Specialist[] => {
  const re = SPECIALTY_FOR[conditionName];
  if (!re) return [];
  return specialists.filter((s) => re.test(s.specialty));
};

// ------------------------------------------------------- medicines

const STOP = new Set(['with', 'now', 'and', 'the', 'type', 'from', 'for', 'disease', 'disorder']);

const terms = (s: string): Set<string> => new Set(
  s.toLowerCase().split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 4 && !STOP.has(w)),
);

/**
 * Which medicines are for which problem, when the indication is free text.
 *
 * An indication field is almost never the diagnosis as coded. It says
 * "Hypertension" against "Essential hypertension", "Post-PCI" against
 * "Coronary artery disease, post-PCI", and "Shift-work sleep" against
 * an insomnia code. Matching on equality drops all of those on the
 * floor, and a problem-based chart that shows no medicines against a
 * problem being treated is worse than one with no join at all.
 *
 * So: exact match first, then a shared significant word. Where a drug
 * matches nothing it stays unattached rather than being filed under a
 * guess, because a medicine shown against the wrong problem is a
 * clinical error and an unattached one is only an untidy list.
 */
export function medsAbout(conditionName: string, meds: Medication[]): Medication[] {
  const want = terms(conditionName);
  return meds.filter((m) => {
    if (!m.indication) return false;
    if (m.indication === conditionName) return true;
    const got = terms(m.indication);
    for (const w of got) if (want.has(w)) return true;
    return false;
  });
}

// ------------------------------------------------------------ orders

/** Orders that are screening or referral rather than problem-directed. */
export const isPreventive = (o: Order): boolean =>
  o.kind === 'imaging' || o.kind === 'referral'
  || /screen|mammo|colonos|dexa|eye|vaccin|immunis/i.test(o.text);

export const ordersAbout = (
  conditionName: string, orders: Order[], meds: Medication[],
): Order[] => {
  const words = conditionName.toLowerCase().split(/[\s,]+/).filter((w) => w.length > 4);
  const drugs = meds.map((m) => m.name.toLowerCase());
  return orders.filter((o) => {
    if (isPreventive(o)) return false;
    const t = o.text.toLowerCase();
    return words.some((w) => t.includes(w)) || drugs.some((d) => t.includes(d));
  });
};

// ---------------------------------------------------------- measures

export interface Measure {
  label: string;
  value: string;
  /** The previous value, where there is one. Never averaged in. */
  prev?: string;
  /** Empty where the value is itself a date. */
  date: string;
  flag?: 'high' | 'low' | 'normal' | 'critical';
  /** Where it was done, when that was not here. */
  from?: string;
}

const byDateDesc = <T extends { date: string }>(xs: T[]): T[] =>
  [...xs].sort((a, b) => b.date.localeCompare(a.date));

const labMeasure = (panels: LabPanel[], key: string, label: string): Measure | undefined => {
  const hits = byDateDesc(panels).filter((p) => p.values.some((v) => v.key === key));
  if (hits.length === 0) return undefined;
  const now = hits[0].values.find((v) => v.key === key)!;
  const before = hits[1]?.values.find((v) => v.key === key);
  return {
    label, value: `${now.value}${now.unit ? ` ${now.unit}` : ''}`,
    prev: before ? `${before.value}` : undefined,
    date: hits[0].date, flag: now.flag, from: hits[0].from,
  };
};

/**
 * Which numbers belong to which problem.
 *
 * Only the ones that are actually used to judge it. A problem with no
 * measure of its own says so, because "no tracking measure on file"
 * and "the measure is fine" are completely different facts and a
 * blank space reads as the second one.
 */
export function measuresAbout(
  conditionName: string, panels: LabPanel[], vitals: VitalsSet[],
): Measure[] {
  const office = byDateDesc(vitals.filter((v) => v.source === 'office'));
  const home = byDateDesc(vitals.filter((v) => v.source === 'home'));
  const out: Measure[] = [];

  const bp = () => {
    if (office[0]?.systolic) {
      out.push({
        label: 'Clinic BP',
        value: `${office[0].systolic}/${office[0].diastolic}`,
        prev: office[1]?.systolic ? `${office[1].systolic}/${office[1].diastolic}` : undefined,
        date: office[0].date,
        flag: office[0].systolic >= 130 ? 'high' : 'normal',
      });
    }
    const withSys = home.filter((h) => h.systolic);
    if (withSys.length > 0) {
      const mean = Math.round(withSys.reduce((a, h) => a + (h.systolic ?? 0), 0) / withSys.length);
      out.push({
        label: `Home BP, ${withSys.length} readings`,
        value: `${mean} mean systolic`,
        date: withSys[0].date,
        flag: mean >= 130 ? 'high' : 'normal',
      });
    }
  };
  const weight = () => {
    if (!office[0]?.weightLb) return;
    out.push({
      label: 'Weight', value: `${office[0].weightLb} lb`,
      prev: office[1]?.weightLb ? `${office[1].weightLb}` : undefined,
      date: office[0].date,
    });
    if (office[0].bmi) {
      out.push({
        label: 'BMI', value: `${office[0].bmi}`,
        prev: office[1]?.bmi ? `${office[1].bmi}` : undefined,
        date: office[0].date,
        flag: office[0].bmi >= 30 ? 'high' : 'normal',
      });
    }
  };
  const push = (m?: Measure) => { if (m) out.push(m); };

  switch (conditionName) {
    case 'Essential hypertension':
      bp();
      push(labMeasure(panels, 'K', 'Potassium'));
      push(labMeasure(panels, 'Cr', 'Creatinine'));
      break;
    case 'Type 2 diabetes mellitus':
      push(labMeasure(panels, 'A1c', 'A1c'));
      push(labMeasure(panels, 'UACR', 'Urine albumin/creatinine'));
      push(labMeasure(panels, 'eGFR', 'eGFR'));
      break;
    case 'Prediabetes':
      push(labMeasure(panels, 'A1c', 'A1c'));
      push(labMeasure(panels, 'Glu', 'Fasting glucose'));
      break;
    case 'Mixed hyperlipidemia':
      push(labMeasure(panels, 'LDL', 'LDL'));
      push(labMeasure(panels, 'TG', 'Triglycerides'));
      push(labMeasure(panels, 'HDL', 'HDL'));
      break;
    case 'Obesity':
      weight();
      push(labMeasure(panels, 'A1c', 'A1c'));
      break;
    case 'Chronic kidney disease, stage 3a':
      push(labMeasure(panels, 'eGFR', 'eGFR'));
      push(labMeasure(panels, 'Cr', 'Creatinine'));
      push(labMeasure(panels, 'K', 'Potassium'));
      push(labMeasure(panels, 'UACR', 'Urine albumin/creatinine'));
      break;
    case 'Hypothyroidism':
      push(labMeasure(panels, 'TSH', 'TSH'));
      break;
    case 'Heart failure with preserved ejection fraction':
      weight();
      push(labMeasure(panels, 'K', 'Potassium'));
      push(labMeasure(panels, 'Cr', 'Creatinine'));
      break;
    case 'Coronary artery disease':
    case 'Atrial fibrillation':
      bp();
      push(labMeasure(panels, 'LDL', 'LDL'));
      break;
    case 'Asthma':
    case 'Obstructive sleep apnea':
      if (office[0]?.spo2) {
        out.push({
          label: 'Oxygen saturation', value: `${office[0].spo2}%`,
          prev: office[1]?.spo2 ? `${office[1].spo2}` : undefined,
          date: office[0].date,
          flag: office[0].spo2 < 95 ? 'low' : 'normal',
        });
      }
      break;
    default:
      break;
  }
  return out;
}
