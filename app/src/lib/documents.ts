/**
 * Paper.
 *
 * A chart that cannot produce a document is not a record, it is a
 * notebook. Five things have to leave the building: a summary the
 * patient takes home, a letter to a specialist, a note for an
 * employer, a justification to a plan, and the whole record in a form
 * another system can read.
 *
 * Two rules shape all of them.
 *
 * The patient-facing ones follow the House Style in docs/style: about
 * a fifth-grade reading level, short sentences, no marketing voice, no
 * em dashes. A summary somebody cannot read is not a summary. The
 * clinician-facing ones do not, because a referral letter written at a
 * fifth-grade level wastes a colleague's time.
 *
 * The work note says the least that does the job. An employer needs to
 * know somebody was seen and what they can do. They do not need the
 * diagnosis, and a record that hands it over by default has made a
 * disclosure decision on the patient's behalf.
 */
import type {
  Allergy, CarePlan, Condition, Encounter, Medication, Patient,
  ResultSeries, Specialist,
} from '../domain/types';
import { fmtDate } from './format';
import { kindLabel } from './clinical';
import { resolveDrug } from '../domain/terminology';

export type Audience = 'patient' | 'clinician' | 'employer' | 'plan' | 'machine';

export interface Doc {
  id: string;
  title: string;
  audience: Audience;
  /** Plain text, laid out to print. */
  body: string;
  filename: string;
  mime: string;
  /** Said under the title: who this is for and what is in it. */
  note: string;
}

const AUD: Record<Audience, string> = {
  patient: 'For the patient',
  clinician: 'For another clinician',
  employer: 'For an employer or school',
  plan: 'For a health plan',
  machine: 'For another record system',
};

export const audienceLabel = (a: Audience): string => AUD[a];

const first = (p: Patient): string => p.preferredName ?? p.name.split(' ')[0];
const PRACTICE = 'Direct Lifestyle Medicine';
const ME = 'L. DuBose, MD';

const bullet = (xs: string[]): string => xs.map((x) => `  - ${x}`).join('\n');

// ------------------------------------------------- after-visit summary

/**
 * House Style applies in full here. Short sentences, common words, no
 * em dashes, and nothing that sounds like marketing. The headings are
 * questions the patient actually has.
 */
export function afterVisit(
  p: Patient, e: Encounter, meds: Medication[], plan?: CarePlan,
): Doc {
  const active = meds.filter((m) => m.status === 'active');
  const mine = plan?.goals.flatMap((g) =>
    g.actions.filter((a) => a.owner === 'patient' && !a.done).map((a) => a.text)) ?? [];
  const ours = plan?.goals.flatMap((g) =>
    g.actions.filter((a) => a.owner === 'physician' && !a.done).map((a) => a.text)) ?? [];

  const talked = e.note?.subjective.additional?.trim()
    || e.note?.subjective.reason?.trim()
    || e.reason;
  const decided = e.note?.plan.overall?.trim()
    || e.note?.plan.problems.map((x) => x.treatment).filter(Boolean).join(' ')
    || 'We agreed to keep things as they are for now.';

  const body = `${PRACTICE}
Visit summary for ${p.name}
${fmtDate(e.date)}. Seen by ${ME}.

WHAT WE TALKED ABOUT

${talked}

WHAT WE DECIDED

${decided}

YOUR MEDICINES NOW

${active.length === 0 ? '  You are not taking any medicines right now.' : bullet(
    active.map((m) => {
      const sig = (m.sig || 'Take as discussed.').trim();
      return `${m.name}${m.dose ? ` ${m.dose}` : ''}. ${/[.?!]$/.test(sig) ? sig : `${sig}.`}`;
    }))}

If you take something that is not on this list, tell us. That includes
pills you buy yourself and anything a family member gave you.

${[
    mine.length > 0 ? `WHAT YOU ARE GOING TO DO\n\n${bullet(mine)}` : '',
    ours.length > 0 ? `WHAT I AM GOING TO DO\n\n${bullet(ours)}` : '',
  ].filter(Boolean).join('\n\n')}${mine.length || ours.length ? '\n\n' : ''}WHEN TO COME BACK

${e.legacyKind === 'initial'
    ? 'We will meet again soon to finish setting up your plan.'
    : 'Come back when we agreed, or sooner if you need to.'}

WHEN TO CALL SOONER

Call us if something gets worse, or if something new starts and worries
you. You do not need to wait for your next visit.

If you have chest pain, trouble breathing, weakness on one side, or you
feel like this is an emergency, call 911. Do not message us first.

HOW TO REACH US

Message through your portal. We answer routine messages in one to three
days.

This summary is yours. You can share it with anyone you want.
`;

  return {
    id: `avs-${e.id}`,
    title: 'Visit summary',
    audience: 'patient',
    body,
    filename: `visit-summary-${p.name.replace(/\s+/g, '-').toLowerCase()}-${e.date}.txt`,
    mime: 'text/plain',
    note: 'Written to the practice house style: short sentences, plain words, no marketing. The patient can share it with anyone.',
  };
}

// ---------------------------------------------------- referral letter

export function referral(
  p: Patient, to: Specialist | undefined, reason: string,
  conditions: Condition[], meds: Medication[], allergies: Allergy[],
  series: ResultSeries[], today: string,
): Doc {
  const active = conditions.filter((c) => c.status === 'active');
  const onMeds = meds.filter((m) => m.status === 'active');
  const recent = series
    .filter((s) => s.source !== 'patient' && s.points.length > 0)
    .slice(0, 6)
    .map((s) => {
      const last = s.points[s.points.length - 1];
      return `${s.name} ${last.value} ${s.unit} (${fmtDate(last.date)})`;
    });

  const body = `${PRACTICE}
${fmtDate(today)}

${to ? `${to.name}\n${to.specialty}${to.practice ? `\n${to.practice}` : ''}` : 'To the receiving clinician'}

Re: ${p.name}, born ${fmtDate(p.dob)}

Dear ${to ? to.name.replace(/^Dr\.?\s*/, 'Dr ') : 'Colleague'},

I would be grateful for your opinion on ${first(p)}, a ${p.pronouns.split('/')[0]} of ${
  Math.floor((Date.parse(today) - Date.parse(p.dob)) / 31557600000)} years.

REASON FOR REFERRAL

${reason}

ACTIVE PROBLEMS

${active.length ? bullet(active.map((c) => `${c.name}${c.code ? ` (${c.code})` : ''}, recorded ${fmtDate(c.onset)}`)) : '  None recorded.'}

CURRENT MEDICATION

${onMeds.length ? bullet(onMeds.map((m) => {
    const d = resolveDrug(m.name, m.rxcui);
    return `${m.name}${m.dose ? ` ${m.dose}` : ''}${m.sig ? `, ${m.sig.toLowerCase()}` : ''}${d ? ` [RxCUI ${d.rxcui}]` : ''}`;
  })) : '  None.'}

ALLERGIES

${allergies.length ? bullet(allergies.map((a) => `${a.substance}: ${a.reaction ?? 'reaction not recorded'} (${a.severity ?? 'severity unknown'})`)) : '  None recorded. This is not the same as none known.'}

RECENT RESULTS

${recent.length ? bullet(recent) : '  None in the period covered by this record.'}

This practice is direct pay and membership based. I hold the longitudinal
relationship and will act on whatever you advise. Please send your letter
to the practice and a copy to the patient.

Yours sincerely,

${ME}
${PRACTICE}
`;

  return {
    id: `ref-${p.id}-${today}`,
    title: 'Referral letter',
    audience: 'clinician',
    body,
    filename: `referral-${p.name.replace(/\s+/g, '-').toLowerCase()}-${today}.txt`,
    mime: 'text/plain',
    note: 'Written for a colleague, so it is not simplified. Carries the problem list, the medication with RxNorm identifiers, the allergies and the recent results.',
  };
}

// ----------------------------------------------------- work or school

/**
 * The least that does the job.
 *
 * An employer needs to know the person was seen and what they can do.
 * They do not need the diagnosis. Most records hand it over by
 * default, which is a disclosure decision made on the patient's behalf
 * by whoever wrote the template.
 */
export function workNote(
  p: Patient, today: string,
  opts: { from: string; to: string; restriction: string; includeDiagnosis: boolean; diagnosis?: string },
): Doc {
  const body = `${PRACTICE}
${fmtDate(today)}

TO WHOM IT MAY CONCERN

${p.name} was seen at this practice on ${fmtDate(opts.from)}.

${opts.from === opts.to
    ? `They were seen on ${fmtDate(opts.from)}.`
    : `They should be excused from ${fmtDate(opts.from)} to ${fmtDate(opts.to)}.`}

${opts.restriction || 'They may return to their usual duties after that.'}
${opts.includeDiagnosis && opts.diagnosis ? `\nDiagnosis: ${opts.diagnosis}.\n` : ''}
This note gives the information needed to support the absence. Nothing
else from the medical record is included. If you need more, the patient
can decide what to share.

${ME}
${PRACTICE}
`;

  return {
    id: `work-${p.id}-${today}`,
    title: 'Work or school note',
    audience: 'employer',
    body,
    filename: `note-${p.name.replace(/\s+/g, '-').toLowerCase()}-${today}.txt`,
    mime: 'text/plain',
    note: opts.includeDiagnosis
      ? 'The diagnosis is included because it was turned on. The default is off, and the patient should be the one who decides.'
      : 'No diagnosis. An employer needs to know the person was seen and what they can do, and nothing further.',
  };
}

// ------------------------------------------------- prior authorization

/**
 * Deliberately silent on how the membership interacts with coverage.
 *
 * That question is unsettled (D-039 guardrail 4b, NEEDS-COUNSEL), so
 * the letter argues the clinical case and nothing else. A template
 * that asserted a payer position would put the practice's name to a
 * claim nobody has checked.
 */
export function priorAuth(
  p: Patient, today: string,
  opts: { item: string; indication: string; tried: string; rationale: string },
  conditions: Condition[],
): Doc {
  const coded = conditions.filter((c) => c.status === 'active' && c.code);
  const body = `${PRACTICE}
${fmtDate(today)}

REQUEST FOR PRIOR AUTHORIZATION

Patient: ${p.name}
Date of birth: ${fmtDate(p.dob)}
Requested: ${opts.item}

INDICATION

${opts.indication}

${coded.length ? `Coded problems supporting this request:\n\n${bullet(coded.map((c) => `${c.code} ${c.name}`))}\n` : ''}
WHAT HAS ALREADY BEEN TRIED

${opts.tried || 'See the clinical rationale below.'}

CLINICAL RATIONALE

${opts.rationale}

I am the physician responsible for this patient's ongoing care and I am
available to discuss this request.

${ME}
${PRACTICE}
`;

  return {
    id: `pa-${p.id}-${today}`,
    title: 'Prior authorization request',
    audience: 'plan',
    body,
    filename: `prior-auth-${p.name.replace(/\s+/g, '-').toLowerCase()}-${today}.txt`,
    mime: 'text/plain',
    note: 'Argues the clinical case only. It says nothing about how the membership works with any coverage, because that question is not settled (NEEDS-COUNSEL).',
  };
}

// ------------------------------------------------------ the whole record

const SYS = {
  icd: 'http://hl7.org/fhir/sid/icd-10-cm',
  rx: 'http://www.nlm.nih.gov/research/umls/rxnorm',
  loinc: 'http://loinc.org',
};

/**
 * A FHIR R4 Bundle, not a C-CDA.
 *
 * The item this was built for asked for a CCD. Producing real C-CDA
 * takes a toolkit and a validator, and a hand-rolled approximation of
 * it would be worse than useless: it would look exportable and fail at
 * the receiving end. The domain model has been shaped for FHIR R4
 * since the first commit, so this is the export it can actually stand
 * behind. C-CDA stays on the list as a real piece of work.
 */
export function fhirBundle(input: {
  patient: Patient;
  conditions: Condition[];
  medications: Medication[];
  allergies: Allergy[];
  series: ResultSeries[];
  encounters: Encounter[];
  plan?: CarePlan;
  today: string;
}): Doc {
  const { patient: p, conditions, medications, allergies, series, encounters, plan, today } = input;
  const ref = (t: string, id: string) => ({ reference: `${t}/${id}` });
  const subject = ref('Patient', p.id);
  const entries: unknown[] = [];

  entries.push({
    fullUrl: `urn:uuid:${p.id}`,
    resource: {
      resourceType: 'Patient', id: p.id,
      name: [{ text: p.name, family: p.name.split(' ').slice(-1)[0], given: p.name.split(' ').slice(0, -1) }],
      gender: p.sex, birthDate: p.dob,
      telecom: [
        { system: 'phone', value: p.phone }, { system: 'email', value: p.email },
      ],
    },
  });

  for (const c of conditions) {
    entries.push({
      fullUrl: `urn:uuid:${c.id}`,
      resource: {
        resourceType: 'Condition', id: c.id, subject,
        clinicalStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', code: c.status === 'remission' ? 'remission' : c.status }] },
        code: {
          text: c.name,
          coding: c.code ? [{ system: SYS.icd, code: c.code, display: c.name }] : undefined,
        },
        onsetDateTime: c.onset,
        recordedDate: c.provenance.recorded,
      },
    });
  }

  for (const m of medications) {
    const d = resolveDrug(m.name, m.rxcui);
    entries.push({
      fullUrl: `urn:uuid:${m.id}`,
      resource: {
        resourceType: 'MedicationRequest', id: m.id, subject,
        status: m.status === 'held' ? 'on-hold' : m.status === 'stopped' ? 'stopped' : 'active',
        intent: 'order',
        medicationCodeableConcept: {
          text: `${m.name}${m.dose ? ` ${m.dose}` : ''}`,
          coding: d ? [{ system: SYS.rx, code: d.rxcui, display: d.name }] : undefined,
        },
        dosageInstruction: m.sig ? [{ text: m.sig }] : undefined,
        authoredOn: m.started,
        reasonCode: m.indication ? [{ text: m.indication }] : undefined,
      },
    });
  }

  for (const a of allergies) {
    entries.push({
      fullUrl: `urn:uuid:${a.id}`,
      resource: {
        resourceType: 'AllergyIntolerance', id: a.id, patient: subject,
        code: { text: a.substance },
        criticality: a.severity === 'severe' ? 'high' : a.severity === 'moderate' ? 'low' : undefined,
        reaction: a.reaction ? [{ manifestation: [{ text: a.reaction }], severity: a.severity === 'unknown' ? undefined : a.severity }] : undefined,
        recordedDate: a.recorded,
      },
    });
  }

  for (const s of series) {
    for (const pt of s.points) {
      entries.push({
        fullUrl: `urn:uuid:${s.id}-${pt.date}`,
        resource: {
          resourceType: 'Observation', id: `${s.id}-${pt.date}`, subject,
          status: 'final',
          code: { text: s.name, coding: s.code ? [{ system: SYS.loinc, code: s.code, display: s.name }] : undefined },
          effectiveDateTime: pt.date,
          valueQuantity: { value: pt.value, unit: s.unit },
          referenceRange: (s.refLow !== undefined || s.refHigh !== undefined)
            ? [{ low: s.refLow !== undefined ? { value: s.refLow, unit: s.unit } : undefined,
              high: s.refHigh !== undefined ? { value: s.refHigh, unit: s.unit } : undefined }]
            : undefined,
          // Patient-measured readings stay labelled as such all the way out.
          performer: s.source === 'patient' ? [subject] : undefined,
        },
      });
    }
  }

  for (const e of encounters.filter((x) => x.status === 'signed')) {
    entries.push({
      fullUrl: `urn:uuid:${e.id}`,
      resource: {
        resourceType: 'Encounter', id: e.id, subject, status: 'finished',
        class: { code: e.setting === 'home' ? 'HH' : 'AMB' },
        type: [{ text: kindLabel(e.kind) }],
        period: { start: e.date, end: e.date },
        reasonCode: [{ text: e.reason }],
      },
    });
  }

  if (plan?.signed) {
    entries.push({
      fullUrl: `urn:uuid:${plan.id}`,
      resource: {
        resourceType: 'CarePlan', id: plan.id, subject, status: 'active', intent: 'plan',
        description: plan.summary,
        activity: plan.goals.map((g) => ({
          detail: { description: `${g.title}. ${g.why}`, status: g.status === 'met' ? 'completed' : 'in-progress' },
        })),
      },
    });
  }

  const bundle = {
    resourceType: 'Bundle',
    type: 'collection',
    timestamp: `${today}T00:00:00Z`,
    meta: { source: `${PRACTICE} clinical record` },
    entry: entries,
  };

  return {
    id: `fhir-${p.id}`,
    title: 'Whole record, machine readable',
    audience: 'machine',
    body: JSON.stringify(bundle, null, 2),
    filename: `record-${p.name.replace(/\s+/g, '-').toLowerCase()}-${today}.json`,
    mime: 'application/fhir+json',
    note: `FHIR R4 Bundle. ${entries.length} resources, with ICD-10-CM, RxNorm and LOINC codings where the record has them.`,
  };
}

/** The same record as something a person can read. */
export function recordSummary(input: Parameters<typeof fhirBundle>[0]): Doc {
  const { patient: p, conditions, medications, allergies, series, encounters, today } = input;
  const body = `${PRACTICE}
Complete record for ${p.name}
Produced ${fmtDate(today)}

This is everything this practice holds about you, in a form you can read.
There is a second file alongside it that other record systems can read.

PROBLEMS

${conditions.length ? bullet(conditions.map((c) => `${c.name}${c.code ? ` (${c.code})` : ''}, ${c.status}, first recorded ${fmtDate(c.onset)}`)) : '  None recorded.'}

MEDICINES

${medications.length ? bullet(medications.map((m) => `${m.name}${m.dose ? ` ${m.dose}` : ''}, ${m.status}${m.changeNote ? `. ${m.changeNote}` : ''}`)) : '  None recorded.'}

ALLERGIES

${allergies.length ? bullet(allergies.map((a) => `${a.substance}: ${a.reaction ?? 'not recorded'}`)) : '  None recorded.'}

MEASUREMENTS

${series.length ? bullet(series.map((s) => {
    const last = s.points[s.points.length - 1];
    return `${s.name}: ${s.points.length} readings, latest ${last ? `${last.value} ${s.unit} on ${fmtDate(last.date)}` : 'none'}${s.source === 'patient' ? ' (measured by you)' : ''}`;
  })) : '  None recorded.'}

VISITS

${encounters.length ? bullet(encounters.map((e) => `${fmtDate(e.date)}: ${kindLabel(e.kind)}, ${e.reason}`)) : '  None recorded.'}

If something here is wrong, tell us and we will correct it. You have the
right to ask for a correction, and we will say in writing what we did.
`;

  return {
    id: `summary-${p.id}`,
    title: 'Whole record, readable',
    audience: 'patient',
    body,
    filename: `record-${p.name.replace(/\s+/g, '-').toLowerCase()}-${today}.txt`,
    mime: 'text/plain',
    note: 'The same content as the machine-readable file, written to be read.',
  };
}
