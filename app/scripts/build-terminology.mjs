/**
 * Build the offline terminology subset.
 *
 * Run with `node scripts/build-terminology.mjs`. It writes
 * src/domain/terminology.generated.ts, which is committed, so the app
 * needs no network and no lookup ever leaves the browser.
 *
 * Why a bundled subset rather than live calls: a search box in a
 * clinical record is itself clinical. "What is the code for" is a
 * question about a patient in front of you, and sending every
 * keystroke to a third party is a disclosure decision nobody made. A
 * real deployment runs a terminology server inside its own boundary.
 * The subset here is the prototype's version of that boundary.
 *
 * Sources, all public and free:
 *   ICD-10-CM  NLM Clinical Table Search Service
 *              clinicaltables.nlm.nih.gov/api/icd10cm/v3
 *   RxNorm     NLM RxNav REST API, rxnav.nlm.nih.gov/REST
 *   ATC class  NLM RxClass, byRxcui with relaSource=ATC
 *   LOINC      NLM Clinical Table Search Service, loinc_items/v3
 *
 * Nothing here is hand-written. If a code is in the output, an NLM
 * service returned it for the query above it.
 */
import { writeFileSync } from 'node:fs';

const ICD_SEEDS = [
  'essential hypertension', 'hyperlipidemia', 'hypercholesterolemia', 'type 2 diabetes',
  'prediabetes', 'obesity', 'overweight', 'metabolic syndrome', 'sleep apnea',
  'hypothyroidism', 'hyperthyroidism', 'asthma', 'chronic obstructive pulmonary',
  'gastro-esophageal reflux', 'irritable bowel', 'constipation', 'osteoarthritis',
  'low back pain', 'rheumatoid arthritis', 'gout', 'osteoporosis', 'vitamin D deficiency',
  'iron deficiency anemia', 'anemia', 'chronic kidney disease', 'atrial fibrillation',
  'heart failure', 'coronary artery disease', 'angina', 'stroke', 'migraine',
  'generalized anxiety', 'major depressive', 'bipolar', 'insomnia', 'alcohol use',
  'tobacco use', 'nicotine dependence', 'attention-deficit', 'post-traumatic stress',
  'allergic rhinitis', 'urticaria', 'eczema', 'psoriasis', 'acne', 'cellulitis',
  'urinary tract infection', 'benign prostatic hyperplasia', 'erectile dysfunction',
  'menopause', 'polycystic ovarian', 'contraceptive management', 'pregnancy supervision',
  'breast cancer screening', 'colon cancer screening', 'immunization', 'annual examination',
  'fatigue', 'dizziness', 'chest pain', 'shortness of breath', 'abdominal pain',
  'headache', 'cough', 'fever', 'rash', 'joint pain', 'weight loss', 'weight gain',
  'hyperkalemia', 'hyponatremia', 'elevated liver enzymes', 'fatty liver',
  'peripheral neuropathy', 'carpal tunnel', 'hearing loss', 'cataract', 'glaucoma',
  'long term drug therapy', 'medication management', 'care of caregiver', 'loneliness',
  'food insecurity', 'housing', 'physical inactivity', 'diet counseling',
];

const RX_SEEDS = [
  // cardiovascular
  'lisinopril', 'enalapril', 'ramipril', 'losartan', 'valsartan', 'olmesartan',
  'amlodipine', 'nifedipine', 'diltiazem', 'verapamil', 'metoprolol', 'atenolol',
  'carvedilol', 'propranolol', 'hydrochlorothiazide', 'chlorthalidone', 'furosemide',
  'spironolactone', 'eplerenone', 'triamterene', 'clonidine', 'hydralazine',
  'isosorbide mononitrate', 'digoxin', 'amiodarone', 'sotalol', 'flecainide',
  // lipids and diabetes
  'atorvastatin', 'rosuvastatin', 'simvastatin', 'pravastatin', 'ezetimibe',
  'fenofibrate', 'gemfibrozil', 'icosapent ethyl', 'evolocumab', 'niacin',
  'metformin', 'glipizide', 'glyburide', 'glimepiride', 'sitagliptin', 'linagliptin',
  'empagliflozin', 'dapagliflozin', 'semaglutide', 'liraglutide', 'dulaglutide',
  'tirzepatide', 'insulin glargine', 'insulin lispro', 'pioglitazone',
  // anticoagulation and antiplatelet
  'warfarin', 'apixaban', 'rivaroxaban', 'dabigatran', 'clopidogrel', 'aspirin',
  'ticagrelor', 'enoxaparin',
  // psychiatry and neurology
  'sertraline', 'escitalopram', 'fluoxetine', 'paroxetine', 'citalopram',
  'venlafaxine', 'duloxetine', 'bupropion', 'mirtazapine', 'trazodone',
  'buspirone', 'alprazolam', 'lorazepam', 'clonazepam', 'zolpidem',
  'quetiapine', 'aripiprazole', 'lithium', 'lamotrigine', 'gabapentin',
  'pregabalin', 'topiramate', 'amitriptyline', 'nortriptyline', 'sumatriptan',
  'rizatriptan', 'methylphenidate', 'amphetamine', 'atomoxetine', 'donepezil',
  // pain and inflammation
  'ibuprofen', 'naproxen', 'celecoxib', 'meloxicam', 'diclofenac', 'indomethacin',
  'acetaminophen', 'tramadol', 'oxycodone', 'hydrocodone', 'morphine',
  'prednisone', 'methylprednisolone', 'colchicine', 'allopurinol', 'cyclobenzaprine',
  // gastro
  'omeprazole', 'pantoprazole', 'esomeprazole', 'famotidine', 'ranitidine',
  'ondansetron', 'polyethylene glycol', 'docusate', 'dicyclomine', 'mesalamine',
  // endocrine and other
  'levothyroxine', 'liothyronine', 'methimazole', 'alendronate', 'denosumab',
  'cholecalciferol', 'ergocalciferol', 'cyanocobalamin', 'folic acid',
  'ferrous sulfate', 'potassium chloride', 'magnesium oxide', 'calcium carbonate',
  // respiratory and allergy
  'albuterol', 'fluticasone', 'budesonide', 'montelukast', 'tiotropium',
  'loratadine', 'cetirizine', 'fexofenadine', 'diphenhydramine', 'prednisolone',
  // infection
  'amoxicillin', 'amoxicillin / clavulanate', 'azithromycin', 'doxycycline',
  'cephalexin', 'ciprofloxacin', 'levofloxacin', 'nitrofurantoin',
  'trimethoprim / sulfamethoxazole', 'metronidazole', 'fluconazole', 'valacyclovir',
  'penicillin', 'clindamycin',
  // urology and women's health
  'tamsulosin', 'finasteride', 'sildenafil', 'tadalafil', 'oxybutynin',
  'estradiol', 'medroxyprogesterone', 'norethindrone',
];

const LOINC_SEEDS = [
  'Hemoglobin A1c/Hemoglobin.total in Blood', 'Cholesterol in LDL', 'Triglyceride',
  'Cholesterol in HDL', 'Cholesterol [Mass/volume] in Serum or Plasma',
  'Systolic blood pressure', 'Diastolic blood pressure', 'Body weight',
  'Body mass index', 'Heart rate', 'Glomerular filtration rate',
  'Creatinine [Mass/volume] in Serum or Plasma', 'Potassium [Moles/volume] in Serum or Plasma',
  'Sodium [Moles/volume] in Serum or Plasma', 'Glucose [Mass/volume] in Serum or Plasma',
  'Thyrotropin', 'Alanine aminotransferase', 'Aspartate aminotransferase',
  'Hemoglobin [Mass/volume] in Blood', 'Ferritin', 'Vitamin D', 'Albumin',
  'Microalbumin/Creatinine', 'Urate [Mass/volume] in Serum or Plasma',
  'PHQ-9 total score', 'GAD-7 total score', 'Oxygen saturation',
  'Waist circumference', 'Body temperature', 'Respiratory rate',
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function json(url) {
  for (let i = 0; i < 4; i++) {
    try {
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (res.ok) return await res.json();
    } catch { /* retry */ }
    await sleep(400 * (i + 1));
  }
  throw new Error('failed: ' + url);
}

// ------------------------------------------------------------- ICD-10-CM
async function icd() {
  const seen = new Map();
  for (const term of ICD_SEEDS) {
    const u = `https://clinicaltables.nlm.nih.gov/api/icd10cm/v3/search?sf=code,name&df=code,name&maxList=12&terms=${encodeURIComponent(term)}`;
    const [, , , rows] = await json(u);
    for (const [code, name] of rows ?? []) if (!seen.has(code)) seen.set(code, name);
    process.stderr.write('.');
  }
  return [...seen].map(([code, name]) => ({ code, name })).sort((a, b) => a.code.localeCompare(b.code));
}

// ----------------------------------------------------------------- RxNorm
async function rx() {
  const out = new Map();
  for (const name of RX_SEEDS) {
    // Exact first. The normalized search often lands on a precise
    // ingredient (the salt), which carries no ATC class of its own, so
    // a class-based check would quietly see nothing.
    let g = await json(`https://rxnav.nlm.nih.gov/REST/rxcui.json?name=${encodeURIComponent(name)}`);
    let rxcui = g?.idGroup?.rxnormId?.[0];
    if (!rxcui) {
      g = await json(`https://rxnav.nlm.nih.gov/REST/rxcui.json?name=${encodeURIComponent(name)}&search=1`);
      rxcui = g?.idGroup?.rxnormId?.[0];
    }
    if (!rxcui) { process.stderr.write('?'); continue; }

    let prop = (await json(`https://rxnav.nlm.nih.gov/REST/rxcui/${rxcui}/properties.json`))?.properties;
    if (prop && prop.tty !== 'IN') {
      const rel = await json(`https://rxnav.nlm.nih.gov/REST/rxcui/${rxcui}/related.json?tty=IN`);
      const ing = rel?.relatedGroup?.conceptGroup?.find((g2) => g2.tty === 'IN')?.conceptProperties?.[0];
      if (ing?.rxcui) {
        rxcui = ing.rxcui;
        prop = (await json(`https://rxnav.nlm.nih.gov/REST/rxcui/${rxcui}/properties.json`))?.properties;
      }
    }
    if (out.has(rxcui)) { process.stderr.write('='); continue; }

    // RxClass answers for the whole family, combination products
    // included. Keep only the rows that are this exact concept.
    const c = await json(`https://rxnav.nlm.nih.gov/REST/rxclass/class/byRxcui.json?rxcui=${rxcui}&relaSource=ATC`);
    const infos = (c?.rxclassDrugInfoList?.rxclassDrugInfo ?? [])
      .filter((i) => String(i.minConcept?.rxcui) === String(rxcui));
    const classes = [...new Map(infos.map((i) => [
      i.rxclassMinConceptItem.classId,
      { id: i.rxclassMinConceptItem.classId, name: i.rxclassMinConceptItem.className },
    ])).values()].sort((a, b) => a.id.localeCompare(b.id));

    // Brand names, because that is what half an inherited list says.
    const bn = await json(`https://rxnav.nlm.nih.gov/REST/rxcui/${rxcui}/related.json?tty=BN`);
    const brands = [...new Set((bn?.relatedGroup?.conceptGroup ?? [])
      .find((g2) => g2.tty === 'BN')?.conceptProperties?.map((b) => b.name) ?? [])]
      .filter((b) => !/\s/.test(b))
      .sort((a, b) => a.length - b.length)
      .slice(0, 20);

    out.set(rxcui, { rxcui, name: prop?.name ?? name, tty: prop?.tty ?? '', brands, atc: classes });
    process.stderr.write(classes.length ? '.' : '!');
    await sleep(60);
  }
  return [...out.values()].sort((a, b) => a.name.localeCompare(b.name));
}

// ------------------------------------------------------------------ LOINC
async function loinc() {
  const seen = new Map();
  for (const term of LOINC_SEEDS) {
    const u = `https://clinicaltables.nlm.nih.gov/api/loinc_items/v3/search?maxList=4&df=LOINC_NUM,LONG_COMMON_NAME&terms=${encodeURIComponent(term)}`;
    const [, , , rows] = await json(u);
    for (const [code, name] of rows ?? []) if (!seen.has(code)) seen.set(code, name);
    process.stderr.write('.');
  }
  return [...seen].map(([code, name]) => ({ code, name })).sort((a, b) => a.name.localeCompare(b.name));
}

const [I, R, L] = [await icd(), await rx(), await loinc()];
process.stderr.write('\n');

const body = `/**
 * Terminology, fetched rather than invented.
 *
 * GENERATED by scripts/build-terminology.mjs on ${new Date().toISOString().slice(0, 10)}.
 * Do not edit by hand: re-run the script.
 *
 * Every code below was returned by a US National Library of Medicine
 * service for a query in that script. None was typed from memory. This
 * is a deliberately small subset shaped around adult primary care, not
 * a complete release of any of these code systems:
 *
 *   ICD-10-CM  ${I.length} of roughly 74,000 codes
 *   RxNorm     ${R.length} ingredient concepts, with brand names and ATC classes
 *   LOINC      ${L.length} of roughly 100,000 terms
 *
 * It is bundled rather than looked up live because a search box in a
 * clinical record is itself clinical: what you are typing is a
 * question about a patient. Nothing here leaves the browser. A real
 * deployment would run a terminology server inside its own boundary
 * and keep that property.
 */

export interface IcdCode { code: string; name: string }
export interface AtcClass { id: string; name: string }
export interface RxConcept { rxcui: string; name: string; tty: string; brands: string[]; atc: AtcClass[] }
export interface LoincCode { code: string; name: string }

export const ICD10CM: IcdCode[] = ${JSON.stringify(I, null, 0).replace(/\},\{/g, '},\n  {').replace(/^\[/, '[\n  ').replace(/\]$/, ',\n]')};

export const RXNORM: RxConcept[] = ${JSON.stringify(R, null, 0).replace(/\},\{"rxcui/g, '},\n  {"rxcui').replace(/^\[/, '[\n  ').replace(/\]$/, ',\n]')};

export const LOINC: LoincCode[] = ${JSON.stringify(L, null, 0).replace(/\},\{/g, '},\n  {').replace(/^\[/, '[\n  ').replace(/\]$/, ',\n]')};
`;

writeFileSync(new URL('../src/domain/terminology.generated.ts', import.meta.url), body);
console.error(`ICD-10-CM ${I.length} · RxNorm ${R.length} · LOINC ${L.length}`);
