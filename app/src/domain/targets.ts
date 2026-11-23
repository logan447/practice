/**
 * Where each number is now, where it should be, and when.
 *
 * A patient leaves a visit knowing what was changed and not knowing
 * what it is supposed to achieve. The plan says "continue
 * metformin"; it does not say "your A1c is 7.1 and we are aiming to
 * have it under 7.0 by May". Those are different pieces of
 * information and only one of them is a reason to take the tablets.
 *
 * So: one line per measure that matters for this patient, with the
 * current value, the target, where the target comes from, and an aim
 * for each visit already on the books. Measures already at target
 * are on the list too, because "this one is where it should be and
 * the job is keeping it there" is the only way a patient learns that
 * maintenance is a result rather than an absence of news.
 *
 * Everything about the future here is an estimate and the page says
 * so. The interim aims are not predictions: they are the straight
 * line from here to the target across the visits that are booked,
 * which is a way of saying what progress would look like if it were
 * even, and progress is never even. They are there so that a visit
 * has something to be measured against, not so that anybody is held
 * to them.
 *
 * SOURCING. Each target names the body whose guideline sets it.
 * These are standard-of-care figures rather than anything this
 * practice invented, but the edition and year of each guideline have
 * not been checked against the publication, and guideline targets
 * move. Confirm before any of this is printed for a patient.
 * REFRESH-AT-RUNWAY.
 */

export interface MetricTarget {
  /** The lab key or vital this tracks. */
  key: string;
  label: string;
  unit: string;
  /** The number to get under, or over. */
  target: number;
  direction: 'lower' | 'higher';
  /** How the target reads in words, where a bare number is not enough. */
  targetText?: string;
  /** Which guideline sets it, for the footnote. */
  source: string;
  /** Which condition puts this measure on the list at all. */
  forCondition: RegExp;
  /** Decimal places when the number is printed. */
  places?: number;
}

/**
 * The measures this practice follows, and what each is aiming at.
 *
 * Keyed to the condition that makes them relevant, so a patient
 * without diabetes gets no A1c line and a patient without protein in
 * their urine gets no albumin line. A target list that shows every
 * measure the practice knows about is a list nobody reads.
 */
export const METRIC_TARGETS: MetricTarget[] = [
  {
    key: 'A1c', label: 'Haemoglobin A1c', unit: '%', target: 7.0, places: 1,
    direction: 'lower',
    targetText: 'under 7.0',
    source: 'ADA',
    forCondition: /diabetes/i,
  },
  {
    key: 'BP', label: 'Blood pressure', unit: '', target: 130, places: 0,
    direction: 'lower',
    targetText: 'under 130/80',
    source: 'ACC-AHA-ADA',
    forCondition: /hypertension|albuminuria/i,
  },
  {
    key: 'LDL', label: 'LDL cholesterol', unit: 'mg/dL', target: 100, places: 0,
    direction: 'lower',
    targetText: 'under 100, and under 70 where the risk is higher',
    source: 'ACC-AHA-LIPID',
    forCondition: /lipid|lipidaemia|cholesterol/i,
  },
  {
    key: 'ACR', label: 'Urine albumin to creatinine', unit: 'mg/g', target: 30,
    places: 0,
    direction: 'lower',
    targetText: 'under 30',
    source: 'KDIGO',
    forCondition: /albuminuria|kidney|nephropathy/i,
  },
  {
    key: 'Weight', label: 'Weight', unit: 'lb', target: 0, places: 0,
    direction: 'lower',
    targetText: 'ten per cent below where it started',
    source: 'OBESITY',
    forCondition: /obesity|overweight/i,
  },
  {
    key: 'Urate', label: 'Uric acid', unit: 'mg/dL', target: 6.0, places: 1,
    direction: 'lower',
    targetText: 'under 6.0 if we ever start treatment for it',
    source: 'ACR-GOUT',
    forCondition: /gout/i,
  },
];

/**
 * The guidelines behind the targets, for the footnote.
 *
 * Named rather than cited to a page, because a footnote a patient
 * cannot check is decoration. The year each one was last confirmed
 * against the publication is the thing that is missing, and it is
 * missing rather than guessed.
 */
export const TARGET_SOURCES: Record<string, string> = {
  ADA: 'American Diabetes Association, Standards of Care. A1c under 7 per cent '
    + 'for most non-pregnant adults, with a looser target where hypoglycaemia or '
    + 'other illness makes a tight one dangerous.',
  'ACC-AHA-ADA': 'American College of Cardiology and American Heart Association '
    + 'blood pressure guideline, with the American Diabetes Association for people '
    + 'who also have diabetes or protein in the urine.',
  'ACC-AHA-LIPID': 'American College of Cardiology and American Heart Association '
    + 'cholesterol guideline. The lower target applies where the ten year risk or '
    + 'the family history puts somebody in a higher risk group.',
  KDIGO: 'Kidney Disease Improving Global Outcomes. Under 30 mg/g is the normal '
    + 'range; above it is the earliest sign of kidney involvement and the stage at '
    + 'which it can still go back.',
  OBESITY: 'The weight target is five to ten per cent of starting weight, which is '
    + 'the range at which blood pressure, blood sugar and lipids move, rather than '
    + 'any particular number on the scale.',
  'ACR-GOUT': 'American College of Rheumatology gout guideline. The urate target '
    + 'applies to people on urate lowering therapy; it is not a reason on its own '
    + 'to start it.',
};

export interface TargetRow {
  label: string;
  /** Where it is now, as it should be printed. */
  current: string;
  /** When that was measured. */
  on?: string;
  /** Where it needs to get to, in words. */
  target: string;
  /** Whether it is already there. */
  atTarget: boolean;
  /** An aim for each booked visit, soonest first. */
  aims: { date: string; aim: string }[];
  /** Which guideline key set the target. */
  source: string;
}

/**
 * Interim aims across the visits that are booked.
 *
 * The straight line from here to the target, in equal steps, stopping
 * at the target. Not a prediction and not a promise: a way of saying
 * what even progress would look like, so that a visit in May has
 * something to be measured against other than the last visit.
 *
 * A measure already at target gets "hold" at every visit instead,
 * because the aim for something that is where it should be is that
 * it stays there, and inventing a number for it would suggest
 * otherwise.
 */
export function interimAims(
  current: number, target: number, direction: 'lower' | 'higher',
  visits: string[], places = 1,
): { date: string; aim: string }[] {
  const there = direction === 'lower' ? current <= target : current >= target;
  if (there) return visits.map((date) => ({ date, aim: 'hold' }));
  const steps = visits.length;
  if (steps === 0) return [];
  const gap = target - current;
  return visits.map((date, i) => {
    const at = current + (gap * (i + 1)) / steps;
    const n = Math.round(at * 10 ** places) / 10 ** places;
    return {
      date,
      aim: `${direction === 'lower' ? 'to' : 'to'} ${n.toFixed(places)}`,
    };
  });
}

/**
 * The target table for one patient on one day.
 *
 * Which measures appear is decided by the problem list: a patient
 * without diabetes gets no A1c row. What each is aiming at comes from
 * the guideline. Where it stands now is the most recent value on or
 * before the visit, so that an old note faxed today shows the numbers
 * that were in front of the physician.
 */
export function buildTargets(
  conditions: { name: string; status: string; managed?: boolean }[],
  panels: { date: string; values: { key: string; value: number; unit?: string }[] }[],
  vitals: { date: string; source: string; systolic?: number; diastolic?: number;
    weightLb?: number }[],
  booked: string[],
  on: string,
): TargetRow[] {
  const active = conditions.filter((c) => c.status === 'active' && c.managed !== false);
  const latest = (key: string) => panels
    .filter((pl) => pl.date <= on && pl.values.some((v) => v.key === key))
    .sort((a, b) => b.date.localeCompare(a.date))[0];
  const office = vitals
    .filter((v) => v.source === 'office' && v.date <= on)
    .sort((a, b) => b.date.localeCompare(a.date));

  const rows: TargetRow[] = [];
  for (const m of METRIC_TARGETS) {
    if (!active.some((c) => m.forCondition.test(c.name))) continue;

    if (m.key === 'BP') {
      const v = office[0];
      if (!v?.systolic) continue;
      const at = v.systolic <= 130 && (v.diastolic ?? 0) <= 80;
      rows.push({
        label: m.label,
        current: `${v.systolic}/${v.diastolic ?? '?'}`,
        on: v.date,
        target: m.targetText ?? String(m.target),
        atTarget: at,
        aims: interimAims(v.systolic, m.target, 'lower', booked, 0)
          .map((a) => ({ ...a, aim: at ? 'hold' : a.aim.replace('to ', 'to ') })),
        source: m.source,
      });
      continue;
    }

    if (m.key === 'Weight') {
      const now = office[0];
      const first = office[office.length - 1];
      if (!now?.weightLb || !first?.weightLb) continue;
      // Ten per cent off the weight they started at, not a number on
      // a chart somebody else drew.
      const goal = Math.round(first.weightLb * 0.9);
      const at = now.weightLb <= goal;
      rows.push({
        label: m.label,
        current: `${now.weightLb} lb`,
        on: now.date,
        target: `${goal} lb, ten per cent below ${first.weightLb}`,
        atTarget: at,
        aims: at ? booked.map((date) => ({ date, aim: 'hold' }))
          : interimAims(now.weightLb, goal, 'lower', booked, 0)
            .map((a) => ({ ...a, aim: a.aim.replace('to ', 'to ') })),
        source: m.source,
      });
      continue;
    }

    const pl = latest(m.key);
    if (!pl) continue;
    const val = pl.values.find((v) => v.key === m.key)!.value;
    const at = val <= m.target;
    rows.push({
      label: m.label,
      current: `${val}${m.unit ? ` ${m.unit}` : ''}`,
      on: pl.date,
      target: m.targetText ?? String(m.target),
      atTarget: at,
      aims: interimAims(val, m.target, 'lower', booked, m.places ?? 1),
      source: m.source,
    });
  }
  return rows;
}
