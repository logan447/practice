/**
 * Everything being done about one problem, in one vocabulary.
 *
 * A drug, a lab, a referral, a vaccine and a lifestyle prescription
 * are different things clinically and the same thing to a reader
 * scanning a chart: something that is running, something that needs
 * me, or something that is finished. Giving each category its own
 * status words ("taking as prescribed", "partially completed",
 * "struggling") makes the page look informative and read slowly,
 * because the eye has to learn a new scale in every section.
 *
 * So one scale, three words, and the clinical detail moved out of the
 * badge and into the note beside it or the record behind it. The
 * status says whether to look; the record says what to think.
 *
 * Used by the subjective and the plan from the same function, because
 * two implementations of "is this going well" is two answers.
 */
import type {
  ActionStatus, Condition, LifestyleIntervention, Medication, Order,
  PreventionItem, ProblemCheckIn, Specialist, VitalsSet,
} from '../domain/types';
import { LIFESTYLE_DOMAINS } from '../domain/types';
import { fmtDate } from './format';
import { medsAbout, specialistsAbout } from '../screens/chart/relate';

export interface Intervention {
  /** What it is, in two or three words. */
  label: string;
  status: ActionStatus;
  /** One short qualifier, where one earns its place. Never a sentence. */
  note?: string;
}

export interface InterventionInput {
  conditions: Condition[];
  medications: Medication[];
  lifestyle: LifestyleIntervention[];
  prevention: PreventionItem[];
  specialists: Specialist[];
  orders: Order[];
  checkIns: ProblemCheckIn[];
  vitals: VitalsSet[];
}

const DOMAIN_LABEL: Record<string, string> = Object.fromEntries(
  LIFESTYLE_DOMAINS.map((d) => [d.id, d.label]),
);

const desc = <T extends { date: string }>(xs: T[]): T[] =>
  [...xs].sort((a, b) => b.date.localeCompare(a.date));

const words = (name: string) =>
  name.toLowerCase().split(/[\s,]+/).filter((w) => w.length > 4);

export function interventionsFor(
  c: Condition, input: InterventionInput,
): Intervention[] {
  const out: Intervention[] = [];
  const mine = medsAbout(c.name, input.medications.filter((m) => m.status !== 'stopped'));

  // --- medicines. Prescribed is not the same as taken, and the
  //     difference is the only thing worth a status here.
  for (const m of mine) {
    const a = m.adherence;
    out.push({
      label: `${m.name}${m.dose ? ` ${m.dose}` : ''}`,
      status: !a ? 'needs-attention'
        : a.status === 'taking' ? 'active' : 'needs-attention',
      note: !a ? 'adherence not asked about'
        : a.status === 'taking' ? undefined
          : a.status === 'missing-some' ? 'missing doses' : 'not being taken',
    });
  }

  // --- lifestyle prescriptions aimed at this problem
  for (const li of input.lifestyle.filter((x) => x.forConditions.includes(c.id))) {
    const answer = desc(input.checkIns.filter(
      (x) => x.about.kind === 'lifestyle' && x.about.id === li.id,
    ))[0];
    const struggling = li.status === 'struggling' || li.status === 'not-started'
      || answer?.onPlan === 'no';
    out.push({
      label: DOMAIN_LABEL[li.domain] ?? li.domain,
      status: li.status === 'achieved' ? 'complete'
        : struggling ? 'needs-attention' : 'active',
      note: li.prescription.replace(/\.$/, ''),
    });
  }

  // --- home monitoring, where it is part of this problem's plan
  if (c.name === 'Essential hypertension') {
    const home = desc(input.vitals.filter((v) => v.source === 'home'));
    out.push({
      label: 'Home blood pressure',
      status: home.length === 0 ? 'needs-attention' : 'active',
      note: home.length === 0
        ? 'asked for, nothing received'
        : `${home.length} readings, last ${fmtDate(home[0].date)}`,
    });
  }

  // --- specialists who look after it
  for (const s of specialistsAbout(c.name, input.specialists)) {
    const waiting = !!s.outstanding && s.outstanding !== 'None.';
    out.push({
      label: s.specialty,
      status: waiting ? 'needs-attention' : 'complete',
      note: waiting ? s.outstanding : (s.lastSeen ? `seen ${fmtDate(s.lastSeen)}` : undefined),
    });
  }

  // --- testing and referrals out for it
  for (const o of input.orders.filter((x) => x.status !== 'done')) {
    const t = o.text.toLowerCase();
    const hit = words(c.name).some((w) => t.includes(w))
      || mine.some((m) => t.includes(m.name.toLowerCase()));
    if (!hit) continue;
    out.push({
      label: o.text,
      status: o.status === 'draft' ? 'needs-attention' : 'active',
      note: o.status === 'draft' ? 'written, not sent' : `sent ${fmtDate(o.created)}`,
    });
  }

  return out;
}
