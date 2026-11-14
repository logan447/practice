/**
 * Looking a code up.
 *
 * A free-text diagnosis box is the fastest way to make clinical
 * software feel fake, and it is also how charts end up with
 * "prediabetes", "pre-diabetes" and "PreDM" as three different
 * problems. Coding at entry is not bureaucracy: it is the only reason
 * anything downstream can match.
 *
 * The data in terminology.generated.ts was fetched from NLM services,
 * not written here. This file is only the lookup, kept behind a narrow
 * interface so a real terminology server can replace the bundled
 * subset without any screen changing.
 */
import { ICD10CM, RXNORM, LOINC, type IcdCode, type RxConcept, type LoincCode } from './terminology.generated';

export type { IcdCode, RxConcept, LoincCode, AtcClass } from './terminology.generated';
export { ICD10CM, RXNORM, LOINC };

const norm = (s: string): string => s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

/**
 * Score a candidate against what has been typed.
 *
 * Whole-word prefix beats substring, start-of-string beats the middle,
 * and short names beat long ones at equal match, because "Obesity"
 * should outrank "Obesity complicating pregnancy" for "obes".
 */
function score(text: string, q: string): number {
  const t = norm(text);
  if (!q) return 0;
  if (t === q) return 1000;
  if (t.startsWith(q)) return 700 - t.length;
  const words = t.split(' ');
  if (words.some((w) => w.startsWith(q))) return 500 - t.length;
  if (t.includes(q)) return 300 - t.length;
  // every typed word appears somewhere: handles "diabetes type 2"
  const parts = q.split(' ').filter(Boolean);
  if (parts.length > 1 && parts.every((p) => t.includes(p))) return 200 - t.length;
  return -1;
}

function search<T>(xs: T[], q: string, text: (x: T) => string, code: (x: T) => string, n: number): T[] {
  const needle = norm(q);
  if (needle.length < 2) return [];
  return xs
    .map((x) => ({ x, s: Math.max(score(text(x), needle), code(x).toLowerCase().startsWith(needle) ? 900 : -1) }))
    .filter((r) => r.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, n)
    .map((r) => r.x);
}

export const searchConditions = (q: string, n = 8): IcdCode[] =>
  search(ICD10CM, q, (x) => x.name, (x) => x.code, n);

/** Searches the generic name, the brand names and the RxCUI together. */
export const searchDrugs = (q: string, n = 8): RxConcept[] =>
  search(RXNORM, q, (x) => [x.name, ...x.brands].join(' | '), (x) => x.rxcui, n);

export const searchMeasures = (q: string, n = 8): LoincCode[] =>
  search(LOINC, q, (x) => x.name, (x) => x.code, n);

// --------------------------------------------------------------- resolve

const BY_RXCUI = new Map(RXNORM.map((d) => [d.rxcui, d]));
const BY_NAME = new Map<string, RxConcept>();
for (const d of RXNORM) {
  BY_NAME.set(norm(d.name), d);
  for (const b of d.brands) if (!BY_NAME.has(norm(b))) BY_NAME.set(norm(b), d);
}

/**
 * What people call things.
 *
 * Hand-written, unlike everything else here, and short on purpose.
 * These are the lay names that are not brand names, so RxNorm has no
 * row for them, and an inherited list is full of them. Each one is an
 * unambiguous synonym, not a clinical judgement.
 */
const LAY_NAMES: Record<string, string> = {
  'vitamin d': 'cholecalciferol',
  'vitamin d3': 'cholecalciferol',
  'vitamin d2': 'ergocalciferol',
  'vitamin b12': 'vitamin B12',
  'baby aspirin': 'aspirin',
  asa: 'aspirin',
  'iron tablets': 'ferrous sulfate',
  iron: 'ferrous sulfate',
  'fish oil': 'icosapent ethyl',
  tylenol: 'acetaminophen',
  paracetamol: 'acetaminophen',
  'water pill': 'hydrochlorothiazide',
  'thyroid tablet': 'levothyroxine',
};
for (const [lay, real] of Object.entries(LAY_NAMES)) {
  const d = BY_NAME.get(norm(real));
  if (d && !BY_NAME.has(lay)) BY_NAME.set(lay, d);
}

/**
 * A free-text drug name, matched to a concept.
 *
 * Most of what is in an inherited chart arrived as text: "Lisinopril
 * 10mg", "lisinopril (per outside list)", "Vitamin D3". Checking has to
 * work on that, because waiting until every row is coded means never
 * checking anything.
 */
export function resolveDrug(name: string, rxcui?: string): RxConcept | undefined {
  if (rxcui && BY_RXCUI.has(rxcui)) return BY_RXCUI.get(rxcui);
  const n = norm(name);
  if (!n) return undefined;
  const exact = BY_NAME.get(n);
  if (exact) return exact;
  // leading word, which is how a dose or a brand suffix usually trails
  const first = n.split(' ')[0];
  const byFirst = BY_NAME.get(first);
  if (byFirst) return byFirst;
  // a concept name contained in what was typed, longest first
  let best: RxConcept | undefined;
  for (const d of RXNORM) {
    const dn = norm(d.name);
    if (dn.length < 4) continue;
    if (n.includes(dn) && (!best || dn.length > norm(best.name).length)) best = d;
  }
  return best;
}

export const conditionByCode = (code: string): IcdCode | undefined =>
  ICD10CM.find((c) => c.code === code);

/** Does this drug sit in an ATC class, by class-id prefix? */
export const inAtc = (d: RxConcept | undefined, ...prefixes: string[]): boolean =>
  !!d?.atc.some((c) => prefixes.some((p) => c.id.startsWith(p)));

export const COUNTS = {
  icd: ICD10CM.length,
  rx: RXNORM.length,
  loinc: LOINC.length,
};
