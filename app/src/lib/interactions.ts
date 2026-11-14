/**
 * Checking a prescription against the rest of the chart.
 *
 * Three checks, because three things in a chart can make a drug the
 * wrong drug: another drug, a recorded allergy, and the problem list
 * itself (or a number on it, which is why the kidney rules read the
 * actual eGFR rather than a diagnosis label).
 *
 * WHAT THIS IS. A hand-written set of rules, listed in full below and
 * countable: it is a demonstration of the mechanism, not a drug
 * knowledge base. Production systems license one (First Databank,
 * Medi-Span, Lexicomp) and that is a real line item, not an
 * implementation detail. NEEDS-COUNSEL on redistribution terms before
 * any licensed content is bundled into a record this practice ships.
 *
 * WHY EVERY ALERT CARRIES ITS BASIS. FDA's non-device clinical
 * decision support carve-out turns partly on whether the clinician can
 * independently review the grounds for a recommendation rather than
 * relying primarily on it. An alert that says "interaction: severe"
 * and nothing else fails that test, and it also fails the practical
 * one, because an alert you cannot evaluate is an alert you learn to
 * dismiss. So the mechanism is on the alert, not behind it.
 *
 * Drug classes come from ATC via NLM RxClass (see terminology.ts).
 * Where RxClass has no ATC mapping for an ingredient, the rule names
 * the ingredient directly.
 */
import type { Allergy, Condition, Medication, ResultSeries } from '../domain/types';
import { resolveDrug, type RxConcept } from '../domain/terminology';

export type Severity = 'avoid' | 'serious' | 'monitor';

export const SEVERITY_LABEL: Record<Severity, string> = {
  avoid: 'Avoid',
  serious: 'Serious',
  monitor: 'Worth watching',
};

export interface Alert {
  id: string;
  kind: 'drug-drug' | 'drug-allergy' | 'drug-condition' | 'duplicate';
  severity: Severity;
  /** The drug being checked. */
  subject: string;
  /** What it collides with. */
  against: string;
  /** One line: what happens. */
  effect: string;
  /** Why, in terms a clinician can check. This is the point. */
  basis: string;
}

// ------------------------------------------------------------- matchers

interface Group { label: string; atc?: string[]; names?: string[] }

const norm = (s: string): string => s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

/** A drug is in a group if an ATC class matches by prefix, or it is named. */
function inGroup(d: RxConcept | undefined, raw: string, g: Group): boolean {
  if (g.atc && d?.atc.some((c) => g.atc!.some((p) => c.id.startsWith(p)))) return true;
  const n = norm(d?.name ?? raw);
  return !!g.names?.some((x) => n === x || n.startsWith(x + ' ') || n.includes(x));
}

const G = {
  acei: { label: 'ACE inhibitor', atc: ['C09A', 'C09B'] },
  arb: { label: 'angiotensin receptor blocker', atc: ['C09C', 'C09D'], names: ['olmesartan'] },
  kSparing: { label: 'potassium-sparing diuretic', atc: ['C03DA', 'C03DB'] },
  kSupp: { label: 'potassium supplement', atc: ['A12BA'] },
  nsaid: { label: 'NSAID', atc: ['M01A'] },
  diuretic: { label: 'diuretic', atc: ['C03A', 'C03B', 'C03C'] },
  anticoag: { label: 'anticoagulant', atc: ['B01AA', 'B01AE', 'B01AF'], names: ['dabigatran', 'enoxaparin'] },
  antiplatelet: { label: 'antiplatelet', atc: ['B01AC'] },
  warfarin: { label: 'warfarin', names: ['warfarin'] },
  ssri: { label: 'SSRI', atc: ['N06AB'] },
  snri: { label: 'SNRI', names: ['venlafaxine', 'duloxetine'] },
  triptan: { label: 'triptan', atc: ['N02CC'] },
  tramadol: { label: 'tramadol', names: ['tramadol'] },
  statin: { label: 'statin', atc: ['C10AA'] },
  gemfibrozil: { label: 'gemfibrozil', names: ['gemfibrozil'] },
  simvastatin: { label: 'simvastatin', names: ['simvastatin'] },
  cyp3a4cv: { label: 'diltiazem, verapamil or amlodipine', names: ['diltiazem', 'verapamil', 'amlodipine'] },
  ppi: { label: 'proton pump inhibitor', atc: ['A02BC'] },
  clopidogrel: { label: 'clopidogrel', names: ['clopidogrel'] },
  benzo: { label: 'benzodiazepine', atc: ['N05BA', 'N05CD'], names: ['zolpidem'] },
  opioid: { label: 'opioid', atc: ['N02A'] },
  gabapentinoid: { label: 'gabapentin or pregabalin', names: ['gabapentin', 'pregabalin'] },
  lithium: { label: 'lithium', atc: ['N05AN'], names: ['lithium'] },
  levothyroxine: { label: 'levothyroxine', names: ['levothyroxine'] },
  cation: { label: 'calcium, iron or magnesium', names: ['calcium carbonate', 'ferrous sulfate', 'magnesium oxide'] },
  steroid: { label: 'oral corticosteroid', atc: ['H02AB'], names: ['prednisone', 'prednisolone', 'methylprednisolone'] },
  metformin: { label: 'metformin', atc: ['A10BA'], names: ['metformin'] },
  betaNonSel: { label: 'non-selective beta blocker', atc: ['C07AA'] },
  anticholinergic: { label: 'anticholinergic', atc: ['G04BD', 'N06AA'], names: ['diphenhydramine', 'oxybutynin'] },
  tzd: { label: 'thiazolidinedione', atc: ['A10BG'] },
  qt: { label: 'a QT-prolonging drug', names: ['citalopram', 'ondansetron', 'azithromycin', 'amiodarone', 'sotalol'] },
  warfarinPotentiator: {
    label: 'trimethoprim/sulfamethoxazole, fluconazole or metronidazole',
    names: ['sulfamethoxazole', 'trimethoprim', 'fluconazole', 'metronidazole'],
  },
  penicillin: { label: 'a penicillin', atc: ['J01C'] },
  cephalosporin: { label: 'a cephalosporin', atc: ['J01D'] },
  sulfonamideAbx: { label: 'a sulfonamide antibiotic', atc: ['J01E'] },
  aspirin: { label: 'aspirin', names: ['aspirin'] },
} satisfies Record<string, Group>;

// ---------------------------------------------------------- drug / drug

interface Pair {
  id: string; a: Group; b: Group; severity: Severity; effect: string; basis: string;
}

const PAIRS: Pair[] = [
  {
    id: 'acei-k', a: G.acei, b: G.kSparing, severity: 'serious',
    effect: 'Hyperkalaemia, which can be silent until it is an arrhythmia.',
    basis: 'Both reduce potassium excretion: the ACE inhibitor by lowering aldosterone, the diuretic by blocking its effect at the collecting duct. The effect is additive. Check potassium and creatinine within one to two weeks of starting or changing either.',
  },
  {
    id: 'arb-k', a: G.arb, b: G.kSparing, severity: 'serious',
    effect: 'Hyperkalaemia.',
    basis: 'Same mechanism as with an ACE inhibitor: receptor blockade lowers aldosterone, and the diuretic blocks what is left. Check potassium and creatinine after any change.',
  },
  {
    id: 'acei-ksupp', a: G.acei, b: G.kSupp, severity: 'serious',
    effect: 'Hyperkalaemia.',
    basis: 'A potassium supplement adds load while the ACE inhibitor reduces excretion. Ask whether the supplement is still needed at all: it is often left on the list after the diuretic that justified it was stopped.',
  },
  {
    id: 'acei-nsaid', a: G.acei, b: G.nsaid, severity: 'serious',
    effect: 'Acute kidney injury, and the blood pressure control is lost as well.',
    basis: 'The ACE inhibitor dilates the efferent arteriole and the NSAID constricts the afferent one, so glomerular filtration falls from both sides. With a diuretic added this is the combination usually called the triple whammy. Risk is highest in the first month and in volume depletion.',
  },
  {
    id: 'arb-nsaid', a: G.arb, b: G.nsaid, severity: 'serious',
    effect: 'Acute kidney injury and loss of blood pressure control.',
    basis: 'Same haemodynamics as the ACE inhibitor pairing. Worst with a diuretic also on the list, or during any illness that causes volume loss.',
  },
  {
    id: 'anticoag-nsaid', a: G.anticoag, b: G.nsaid, severity: 'serious',
    effect: 'Gastrointestinal bleeding.',
    basis: 'The anticoagulant removes the clotting response while the NSAID damages the mucosa and impairs platelets. The two act on different steps, so the risk is more than additive. If the NSAID is unavoidable, a proton pump inhibitor and the shortest possible course.',
  },
  {
    id: 'anticoag-antiplatelet', a: G.anticoag, b: G.antiplatelet, severity: 'serious',
    effect: 'Major bleeding.',
    basis: 'Anticoagulant plus antiplatelet roughly doubles major bleeding against anticoagulant alone. Sometimes correct after a stent, usually not otherwise. The question to answer in the note is what the antiplatelet is still for.',
  },
  {
    id: 'warfarin-potentiator', a: G.warfarin, b: G.warfarinPotentiator, severity: 'serious',
    effect: 'INR rises, often sharply, within days.',
    basis: 'All three inhibit CYP2C9, which clears S-warfarin, and trimethoprim/sulfamethoxazole also displaces it from protein binding. Expect the INR to move by day three to five: check it, do not wait for the next routine test.',
  },
  {
    id: 'clopidogrel-ppi', a: G.clopidogrel, b: G.ppi, severity: 'monitor',
    effect: 'The antiplatelet effect may be reduced.',
    basis: 'Clopidogrel is a prodrug activated by CYP2C19, which omeprazole and esomeprazole inhibit. Pantoprazole inhibits it far less and is the usual substitution. Whether this changes clinical outcomes is genuinely disputed, which is a reason to switch the PPI rather than to stop gastroprotection.',
  },
  {
    id: 'ssri-ssri', a: G.ssri, b: G.snri, severity: 'serious',
    effect: 'Serotonin syndrome.',
    basis: 'Two serotonergic agents by different routes. Watch for agitation, clonus, hyperreflexia and fever, which typically appear within 24 hours of the second drug or a dose increase rather than after months.',
  },
  {
    id: 'ssri-tramadol', a: G.ssri, b: G.tramadol, severity: 'serious',
    effect: 'Serotonin syndrome, and a lower seizure threshold.',
    basis: 'Tramadol is a serotonin and noradrenaline reuptake inhibitor as well as an opioid, which is the part that gets forgotten when it is treated as a mild analgesic. It also lowers the seizure threshold independently.',
  },
  {
    id: 'ssri-triptan', a: G.ssri, b: G.triptan, severity: 'monitor',
    effect: 'Serotonin syndrome has been described.',
    basis: 'A long-standing warning whose real-world rate looks very low in cohort studies. Not a reason to withhold a triptan from someone on an SSRI; a reason to say what to watch for.',
  },
  {
    id: 'ssri-bleed', a: G.ssri, b: G.anticoag, severity: 'monitor',
    effect: 'Added bleeding risk.',
    basis: 'SSRIs deplete platelet serotonin, which platelets cannot synthesise, so aggregation is impaired. Modest alone and worth knowing about alongside an anticoagulant, especially with an NSAID too.',
  },
  {
    id: 'statin-gemfibrozil', a: G.statin, b: G.gemfibrozil, severity: 'avoid',
    effect: 'Myopathy and rhabdomyolysis.',
    basis: 'Gemfibrozil inhibits the glucuronidation and OATP1B1 uptake of statins, raising exposure several-fold. Fenofibrate does not do this to the same degree and is the usual alternative where a fibrate is genuinely needed.',
  },
  {
    id: 'simva-cv', a: G.simvastatin, b: G.cyp3a4cv, severity: 'monitor',
    effect: 'Raised simvastatin exposure, so a dose ceiling applies.',
    basis: 'Simvastatin is cleared by CYP3A4, which these inhibit. Labelled maximums are 10 mg with verapamil or diltiazem and 20 mg with amlodipine. Other statins in this class are affected much less.',
  },
  {
    id: 'benzo-opioid', a: G.benzo, b: G.opioid, severity: 'serious',
    effect: 'Respiratory depression, sedation and death.',
    basis: 'Both depress central respiratory drive by different receptors, and the combination carries a boxed warning. If both are genuinely needed, the lowest doses for the shortest time, and naloxone in the house.',
  },
  {
    id: 'opioid-gabapentinoid', a: G.opioid, b: G.gabapentinoid, severity: 'monitor',
    effect: 'Added sedation and respiratory depression.',
    basis: 'Weaker than the benzodiazepine pairing but the same direction, and it turns up in overdose series often enough to be worth saying. Most relevant in older patients and in sleep apnoea.',
  },
  {
    id: 'nsaid-steroid', a: G.nsaid, b: G.steroid, severity: 'monitor',
    effect: 'Peptic ulceration and bleeding.',
    basis: 'The NSAID does the mucosal damage; the steroid impairs healing and masks the pain that would otherwise warn. Roughly a four-fold ulcer risk together against the NSAID alone.',
  },
  {
    id: 'lithium-renal', a: G.lithium, b: G.nsaid, severity: 'serious',
    effect: 'Lithium toxicity.',
    basis: 'Lithium is cleared renally and handled like sodium. NSAIDs, ACE inhibitors and thiazides all increase its reabsorption, and the therapeutic window is narrow enough that a week of ibuprofen can be enough. Check a level.',
  },
  {
    id: 'lithium-acei', a: G.lithium, b: G.acei, severity: 'serious',
    effect: 'Lithium toxicity.',
    basis: 'Same mechanism: reduced renal lithium clearance. Check a level within a week of starting or changing either.',
  },
  {
    id: 'levo-cation', a: G.levothyroxine, b: G.cation, severity: 'monitor',
    effect: 'Levothyroxine is absorbed less, so the TSH drifts up.',
    basis: 'Calcium, iron and magnesium chelate levothyroxine in the gut. This is a timing problem, not a contraindication: separate them by four hours and the dose stops moving. Often mistaken for a dose that needs raising.',
  },
  {
    id: 'levo-ppi', a: G.levothyroxine, b: G.ppi, severity: 'monitor',
    effect: 'Absorption may fall.',
    basis: 'Levothyroxine absorption depends on gastric acid, which the PPI suppresses. Recheck the TSH six to eight weeks after a PPI is started or stopped rather than adjusting the dose on symptoms.',
  },
  {
    id: 'qt-qt', a: G.qt, b: G.qt, severity: 'monitor',
    effect: 'Additive QT prolongation.',
    basis: 'Each of these prolongs the QT interval modestly on its own. Together, and with low potassium or magnesium, the risk of torsades rises. An ECG is cheap; check the potassium at the same time.',
  },
];

// ---------------------------------------------------------- drug / allergy

interface AllergyRule {
  id: string; substance: string[]; group: Group; severity: Severity;
  effect: string; basis: string;
}

const ALLERGY_RULES: AllergyRule[] = [
  {
    id: 'pcn-pcn', substance: ['penicillin', 'pcn', 'amoxicillin'], group: G.penicillin,
    severity: 'avoid',
    effect: 'Same drug class as the recorded allergy.',
    basis: 'A recorded penicillin allergy with a described reaction is a reason not to give another penicillin without evaluating it. Note what the reaction actually was: most entries turn out to be rash or childhood report, and about nine in ten people labelled penicillin-allergic are not, which is worth unpicking rather than carrying forever.',
  },
  {
    id: 'pcn-ceph', substance: ['penicillin', 'pcn'], group: G.cephalosporin,
    severity: 'monitor',
    effect: 'Possible cross-reactivity.',
    basis: 'Cross-reactivity between penicillins and cephalosporins is much lower than the figure most of us were taught, and it tracks side-chain similarity rather than the beta-lactam ring. Relevant if the recorded reaction was anaphylaxis; usually not otherwise.',
  },
  {
    id: 'sulfa-abx', substance: ['sulfa', 'sulfa drugs', 'sulfamethoxazole', 'bactrim'],
    group: G.sulfonamideAbx, severity: 'avoid',
    effect: 'Same class as the recorded allergy.',
    basis: 'A sulfonamide antibiotic in someone with a recorded sulfa allergy. Worth saying what this rule deliberately does not do: it does not fire on furosemide, hydrochlorothiazide or celecoxib, which are non-antibiotic sulfonamides and do not cross-react. A checker that flagged those would be training you to ignore it.',
  },
  {
    id: 'nsaid-nsaid', substance: ['ibuprofen', 'naproxen', 'nsaid', 'aspirin'],
    group: G.nsaid, severity: 'avoid',
    effect: 'Same class as the recorded reaction.',
    basis: 'NSAID reactions are usually class effects rather than drug-specific, because they work through COX inhibition rather than an immune response to one molecule. If the recorded reaction was bleeding rather than hypersensitivity, record it as an adverse effect instead: the two need different decisions.',
  },
  {
    id: 'codeine-opioid', substance: ['codeine', 'morphine', 'opioid'],
    group: G.opioid, severity: 'monitor',
    effect: 'Related to the recorded reaction.',
    basis: 'Most codeine entries describe nausea or vomiting, which is a predictable opioid effect and not an allergy. It matters because carrying it as an allergy can block reasonable analgesia for years. Read the reaction before acting on the label.',
  },
];

// -------------------------------------------------------- drug / condition

interface ConditionRule {
  id: string; group: Group; severity: Severity;
  /** Matched against ICD-10-CM codes by prefix, or the problem name. */
  codes?: string[]; names?: string[];
  /** Or a number, which is the stronger version of the same question. */
  measure?: { series: string; below?: number; above?: number };
  problem: string;
  effect: string; basis: string;
}

const CONDITION_RULES: ConditionRule[] = [
  {
    id: 'metformin-egfr', group: G.metformin, severity: 'avoid',
    measure: { series: 'eGFR', below: 30 }, problem: 'an eGFR under 30',
    effect: 'Contraindicated at this level of kidney function.',
    basis: 'Metformin is cleared renally and accumulates, and lactic acidosis is the feared consequence. The labelled threshold is an eGFR below 30: do not start, and stop if it falls there. Between 30 and 45 it can continue at reduced dose with the eGFR watched.',
  },
  {
    id: 'metformin-egfr-45', group: G.metformin, severity: 'monitor',
    measure: { series: 'eGFR', below: 45 }, problem: 'an eGFR under 45',
    effect: 'Reduced dose, and watch the trend.',
    basis: 'Below 45 the labelling advises against starting and halving an existing dose, with the eGFR checked every three to six months. Also hold it around iodinated contrast at this level.',
  },
  {
    id: 'nsaid-ckd', group: G.nsaid, severity: 'avoid',
    codes: ['N18'], problem: 'chronic kidney disease',
    effect: 'Further loss of kidney function.',
    basis: 'NSAIDs constrict the afferent arteriole, and in reduced kidney function that reserve is already spent. The decline can be stepwise rather than gradual. Paracetamol or topical NSAIDs instead, and say so in the plan so it is not re-prescribed elsewhere.',
  },
  {
    id: 'nsaid-hf', group: G.nsaid, severity: 'avoid',
    codes: ['I50'], problem: 'heart failure',
    effect: 'Fluid retention and decompensation.',
    basis: 'Sodium and water retention from prostaglandin inhibition, working directly against the diuretic. Admission for heart failure is a documented consequence, not a theoretical one.',
  },
  {
    id: 'tzd-hf', group: G.tzd, severity: 'avoid',
    codes: ['I50'], problem: 'heart failure',
    effect: 'Fluid retention and worsening failure.',
    basis: 'Thiazolidinediones cause fluid retention through renal sodium handling, and carry a boxed warning in heart failure. Contraindicated in NYHA class III and IV.',
  },
  {
    id: 'beta-asthma', group: G.betaNonSel, severity: 'serious',
    codes: ['J45'], problem: 'asthma',
    effect: 'Bronchospasm.',
    basis: 'A non-selective beta blocker blocks beta-2 receptors in the airway as well as beta-1 in the heart. Cardioselective agents are usually tolerated in mild to moderate asthma and are the alternative where a beta blocker is needed.',
  },
  {
    id: 'anticholinergic-bph', group: G.anticholinergic, severity: 'monitor',
    codes: ['N40'], problem: 'benign prostatic hyperplasia',
    effect: 'Urinary retention.',
    basis: 'Anticholinergics reduce detrusor contraction, which is the same mechanism that makes them useful for an overactive bladder. With obstruction already present this can tip into retention. The risk is often introduced by an over-the-counter antihistamine nobody recorded.',
  },
];

// ------------------------------------------------- two of the same thing

/**
 * Classes where more than one active drug is usually a mistake rather
 * than a regimen. Deliberately not every class: two antihypertensives
 * from different classes is normal practice, two NSAIDs is not.
 */
const DUPLICATE_CLASSES: { atc: string; label: string; why: string }[] = [
  { atc: 'M01A', label: 'NSAID', why: 'No added benefit and the gastrointestinal and renal risk is additive. One, at the lowest effective dose.' },
  { atc: 'A02BC', label: 'proton pump inhibitor', why: 'One is a full dose of acid suppression. Two usually means a hospital list was merged with a home list and nobody reconciled them.' },
  { atc: 'N06AB', label: 'SSRI', why: 'Two SSRIs give no extra effect and carry serotonin risk. Almost always a cross-taper that never finished.' },
  { atc: 'C09A', label: 'ACE inhibitor', why: 'Two agents on the same pathway raise hyperkalaemia and kidney risk without lowering pressure further.' },
  { atc: 'B01AF', label: 'direct oral anticoagulant', why: 'Two anticoagulants at treatment dose is a bleeding event waiting to happen. Usually a switch that was recorded as an addition.' },
  { atc: 'N05BA', label: 'benzodiazepine', why: 'Additive sedation and fall risk, with no added indication.' },
  { atc: 'C10AA', label: 'statin', why: 'Two statins multiply myopathy risk with no extra lipid lowering. Usually a dose change recorded as a new drug.' },
  { atc: 'A10BA', label: 'biguanide', why: 'Two entries for metformin is a duplicate, and taken as written it is a double dose.' },
];

function duplicates(resolved: { raw: string; label: string; d: RxConcept | undefined }[]): Alert[] {
  const out: Alert[] = [];
  for (const c of DUPLICATE_CLASSES) {
    const hits = resolved.filter((r) => r.d?.atc.some((x) => x.id.startsWith(c.atc)));
    // same ingredient twice is a reconciliation problem, not a
    // duplicate-therapy one, and the chart already says so elsewhere
    const distinct = [...new Map(hits.map((h) => [h.d!.rxcui, h])).values()];
    if (distinct.length < 2) continue;
    out.push({
      id: `dup-${c.atc}`, kind: 'duplicate', severity: 'serious',
      subject: `${distinct.length} ${c.label}s on the list at once`,
      against: distinct.map((h) => h.label).join(', '),
      effect: 'Two drugs doing the same job.',
      basis: c.why,
    });
  }
  return out;
}

/**
 * One alert per thing worth saying.
 *
 * Three NSAIDs against one ACE inhibitor is one clinical fact, not
 * three. Left uncollapsed it is also the fastest way to teach someone
 * to dismiss the panel without reading it, which costs more than the
 * alerts were ever worth.
 */
function collapse(alerts: Alert[]): Alert[] {
  const byRule = new Map<string, Alert[]>();
  for (const a of alerts) {
    const rule = a.id.split('-').slice(0, -1).join('-');
    byRule.set(rule, [...(byRule.get(rule) ?? []), a]);
  }
  const out: Alert[] = [];
  for (const [, group] of byRule) {
    if (group.length < 2) { out.push(...group); continue; }
    const counts = new Map<string, number>();
    for (const a of group) counts.set(a.subject, (counts.get(a.subject) ?? 0) + 1);
    const [anchor, n] = [...counts].sort((x, y) => y[1] - x[1])[0];
    if (n < 2) { out.push(...group); continue; }
    const others = group.filter((a) => a.subject === anchor).map((a) => a.against);
    const rest = group.filter((a) => a.subject !== anchor);
    const first = group.find((a) => a.subject === anchor)!;
    out.push({
      ...first,
      against: others.length > 1
        ? `${others.slice(0, -1).join(', ')} and ${others[others.length - 1]}`
        : others[0],
    });
    out.push(...rest);
  }
  return out;
}

// ------------------------------------------------------------------ run

export interface CheckInput {
  medications: Medication[];
  allergies: Allergy[];
  conditions: Condition[];
  series: ResultSeries[];
  /** Check just this one against the rest, or omit to check the whole list. */
  candidate?: { name: string; rxcui?: string };
}

const latest = (series: ResultSeries[], name: string): number | undefined => {
  const s = series.find((x) => x.name === name && x.points.length > 0);
  return s?.points[s.points.length - 1]?.value;
};

export function check(input: CheckInput): Alert[] {
  const { medications, allergies, conditions, series, candidate } = input;
  const active = medications.filter((m) => m.status !== 'stopped');

  const resolved = active.map((m) => ({
    raw: m.name, label: `${m.name}${m.dose ? ` ${m.dose}` : ''}`, d: resolveDrug(m.name, m.rxcui),
  }));
  const subjects = candidate
    ? [{ raw: candidate.name, label: candidate.name, d: resolveDrug(candidate.name, candidate.rxcui) }]
    : resolved;

  const out: Alert[] = [];
  const seen = new Set<string>();
  const add = (a: Alert) => { if (!seen.has(a.id)) { seen.add(a.id); out.push(a); } };

  for (const s of subjects) {
    // --- against the rest of the list
    for (const o of resolved) {
      if (!candidate && o === s) continue;
      if (candidate && norm(o.raw) === norm(s.raw)) continue;
      for (const p of PAIRS) {
        const hit = (inGroup(s.d, s.raw, p.a) && inGroup(o.d, o.raw, p.b))
          || (inGroup(s.d, s.raw, p.b) && inGroup(o.d, o.raw, p.a));
        if (!hit) continue;
        // a drug cannot interact with itself through a same-group rule
        if (p.a === p.b && norm(s.d?.name ?? s.raw) === norm(o.d?.name ?? o.raw)) continue;
        // One alert per pair. Without this the whole-list check says
        // everything twice, once from each end, which is how alert
        // fatigue gets designed in rather than discovered.
        const key = [norm(s.raw), norm(o.raw)].sort().join('+');
        add({
          id: `dd-${p.id}-${key}`, kind: 'drug-drug',
          severity: p.severity, subject: s.label, against: o.label,
          effect: p.effect, basis: p.basis,
        });
      }
    }

    // --- against recorded allergies
    for (const a of allergies) {
      const sub = norm(a.substance);
      for (const r of ALLERGY_RULES) {
        if (!r.substance.some((x) => sub === x || sub.includes(x))) continue;
        if (!inGroup(s.d, s.raw, r.group)) continue;
        add({
          id: `da-${r.id}-${norm(s.raw)}-${sub}`, kind: 'drug-allergy',
          severity: r.severity, subject: s.label,
          against: `recorded allergy to ${a.substance}${a.reaction ? ` (${a.reaction})` : ''}`,
          effect: r.effect, basis: r.basis,
        });
      }
    }

    // --- against the problem list, and the numbers on it
    for (const r of CONDITION_RULES) {
      if (!inGroup(s.d, s.raw, r.group)) continue;
      let hit = false;
      if (r.measure) {
        const v = latest(series, r.measure.series);
        if (v !== undefined
          && (r.measure.below === undefined || v < r.measure.below)
          && (r.measure.above === undefined || v > r.measure.above)) hit = true;
      }
      if (!hit && (r.codes || r.names)) {
        hit = conditions.some((c) =>
          c.status === 'active'
          && ((r.codes?.some((x) => c.code.startsWith(x)) ?? false)
            || (r.names?.some((x) => norm(c.name).includes(x)) ?? false)));
      }
      if (!hit) continue;
      add({
        id: `dc-${r.id}-${norm(s.raw)}`, kind: 'drug-condition',
        severity: r.severity, subject: s.label, against: r.problem,
        effect: r.effect, basis: r.basis,
      });
    }
  }

  if (!candidate) out.push(...duplicates(resolved));

  const order: Record<Severity, number> = { avoid: 0, serious: 1, monitor: 2 };
  return collapse(out).sort((a, b) => order[a.severity] - order[b.severity]);
}

/** Said on screen wherever an alert is, so nobody mistakes it for a product. */
export const RULESET = {
  pairs: PAIRS.length,
  allergy: ALLERGY_RULES.length,
  condition: CONDITION_RULES.length,
  duplicate: DUPLICATE_CLASSES.length,
  get total() {
    return PAIRS.length + ALLERGY_RULES.length + CONDITION_RULES.length + DUPLICATE_CLASSES.length;
  },
  note: 'A hand-written demonstration set, not a drug knowledge base. A production record licenses one. Every alert shows its reasoning so it can be judged rather than obeyed.',
};
