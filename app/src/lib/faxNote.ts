/**
 * One signed note, as a document you can fax.
 *
 * A packet is what you send when somebody asks for the record. A note
 * is what you send when a specialist asks what happened at the visit,
 * and it is the thing a solo practice sends most often. Sending the
 * whole packet instead is both slower to read and a wider disclosure
 * than was asked for.
 *
 * It renders to HTML and prints. Print to PDF is a real PDF, and it
 * is the one route that works from a browser without shipping a
 * typesetting engine into a prototype. Nothing here sends a fax: it
 * produces the page that gets faxed, and says so.
 *
 * Built for a fax machine rather than a screen:
 *
 * - A cover sheet, because a fax arrives on a shared machine and the
 *   first page is what tells the person standing at it who the rest
 *   is for.
 * - The patient's name and date of birth on every page, because
 *   pages get separated and a clinical page with no identifier on it
 *   is a page that can be filed into the wrong chart.
 * - Page numbers as "2 of 4", because the receiving end needs to
 *   know whether anything was lost in transmission.
 * - Black on white, no colour, 11pt serif. A fax is one bit per
 *   pixel and tone is lost in it.
 *
 * NEEDS-COUNSEL: the confidentiality notice is a placeholder. The
 * wording a covered entity puts on an outbound fax is a legal
 * question, not a design one, and the text below is deliberately
 * plain rather than borrowed from another practice's form.
 */
import type {
  Encounter, LabPanel, Patient, ResultSeries, VitalsSet,
} from '../domain/types';
import { SETTING_LABEL } from '../domain/types';
import { fmtDate, age as ageAt } from './format';
import { labsHtml } from './fishbone';
import { vitalsHtml } from './vitals';
import {
  planYear, visitPrice, visitWorth, VISIT_TYPES, UPFRONT_DISCOUNT,
  PAYER_ROUTES, payerAllows, slide, codesFor,
} from './billing';
import type { VisitKind, YearPlan } from './billing';
import { CONVERSION_FACTOR } from './fees';
import { SECTION_HEADINGS } from '../domain/noteTemplate';
import { TARGET_SOURCES } from '../domain/targets';
import type { TargetRow } from '../domain/targets';
import { ROS_LINE } from '../domain/ros';

export interface FaxInput {
  patient: Patient;
  encounter: Encounter;
  /** Who it is going to. Free text: a fax goes to a machine, not a record. */
  to: string;
  /** Their practice, where it was given. */
  toPractice?: string;
  /** The number it is being sent to. Printed so the sender can check it. */
  faxNumber?: string;
  /** One line on why it is being sent. */
  reason?: string;
  /** Who is sending it, as they sign. */
  from: string;
  today: string;
  /**
   * The labs, for the shorthand in the objective.
   *
   * Filtered by the caller to what had resulted by the visit date,
   * so an old note faxed today shows the labs that were in front of
   * the physician, not the ones that arrived afterwards.
   */
  panels: LabPanel[];
  /** The vitals, read the same way the labs are. */
  vitals?: VitalsSet[];
  series?: ResultSeries[];
  /** Whether this practice had seen them before today. */
  newPatient?: boolean;
  /** The visits booked out of this encounter, which are the quote. */
  booked?: { date: string; why: string }[];
  /** What this visit itself costs, where it was quoted at an earlier one. */
  quotedAt?: { price: number; on: string; of: number };
  /** Which kind of visit this is, which is what prices it. */
  visitKind?: VisitKind;
  /**
   * How many problems are off target, which sets how many visits
   * nobody has booked the projection should expect.
   */
  problemsOffTarget?: number;
  /**
   * The measures this patient is followed on, and what each aims at.
   *
   * Built by the caller from the chart, because which measures matter
   * is a fact about their problem list and not about this note.
   */
  targets?: TargetRow[];
  /**
   * What paying the year behind upfront would have cost.
   *
   * Read off the note that quoted it rather than recomputed, so
   * the comparison is against the price somebody was actually
   * given and not against one worked out with hindsight.
   */
  yearBehindUpfront?: number;
  /** Household income and size, where the sliding scale has been applied. */
  sliding?: { income: number; household: number };
  /**
   * The twelve months behind this visit, where there are any.
   *
   * Counted by the caller from the signed visits in the year before
   * this one, which is the only count worth printing: a quote says
   * what a year was expected to hold and this says what it held.
   * The two differ by whatever went wrong, and the difference is
   * the whole of the argument for paying by the year instead.
   */
  yearBehind?: { visits: number; since: string; paid: number };
  /**
   * Whether to put a cover sheet on the front.
   *
   * A note you are reading back to yourself before signing it is not
   * going anywhere, and a cover sheet addressed to nobody is a page
   * you have to turn past every time you check your own work.
   */
  coverSheet?: boolean;
}

/*
 * The practice's own contact details, in one place.
 *
 * The fax number is from the 555-0100 to 555-0199 block, which is
 * reserved for fiction. A made-up number outside that range is
 * somebody's real line, and the thing being made up here is printed
 * on a document that asks people to send records to it.
 *
 * UNSET until the real ones exist: the website below is derived from
 * the email domain rather than confirmed.
 */
const PRACTICE_FAX = '(512) 555-0199';
const PRACTICE_SITE = 'www.lpmc.com';
/*
 * A placeholder, like the fax number above, and for the same reason:
 * a street address on a clinical document is where records get sent.
 * The state matches the licence rather than the phone number, which
 * is a 979 and wants reconciling before any of this is real.
 */
const PRACTICE_ADDRESS = '123 Main Street, Suite 200, Arlington, VA 22201';

const esc = (s: string): string => s
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * A section of the note, as written.
 *
 * The note is prose with headings written into it, and the headings
 * are the part a reader scans. "Essential hypertension — At goal"
 * becomes a bold run and the sentence after the dash does not, the
 * same as it reads on the screen it was signed on. A line that is
 * only one of the three service labels is a heading of its own.
 */
/*
 * The lines that are headings rather than content.
 *
 * Taken from the note template rather than listed again here, so
 * that adding a section to the template cannot leave the fax
 * rendering its heading as an ordinary sentence. The extras are
 * the objective's own headings, which the template does not cover
 * because they are generated rather than written.
 */
const SERVICES = new Set([
  ...SECTION_HEADINGS,
  'Preventative',
  'Vitals', 'Labs', 'Physical Exam', 'Surveys',
]);

const SURVEY_LINE =
  /^(PHQ-2|GAD-2|PHQ-9|GAD-7|AUDIT-C|Tobacco|Other drugs|Mini-Cog|Flourishing): /;

/**
 * One line of the formal review, with the positive marked.
 *
 * Whatever the patient raised comes before the denials on the line,
 * so the split is at the first denial. Red for a reader on a screen
 * or a saved PDF, bold so it survives a fax.
 */
function rosLine(line: string): string {
  const at = line.indexOf(':');
  const rest = line.slice(at + 1).trim();
  const cut = rest.search(/\b(Otherwise denies|Denies|no symptoms reported)/);
  const pos = cut > 0 ? rest.slice(0, cut).trim() : '';
  const tail = cut > 0 ? rest.slice(cut) : rest;
  return `<p class="rosline"><b>${esc(line.slice(0, at))}:</b> `
    + (pos ? `<span class="rospos">${esc(pos)}</span> ` : '')
    + `${esc(tail)}</p>`;
}

const body = (text?: string): string => {
  const t = (text ?? '').trim();
  if (!t) return '<p class="none">Not recorded.</p>';
  // The review runs from its own heading to the end of the section.
  // Without that, "Cardiovascular: regular rate and rhythm" in the
  // examination is rendered as a review line.
  let inRos = false;
  return t.split('\n').map((raw) => {
    const line = raw.trim();
    if (!line) return '';
    if (line === 'Review of systems') inRos = true;
    if (SERVICES.has(line)) return `<p class="svc">${esc(line)}</p>`;
    if (inRos && ROS_LINE.test(line)) return rosLine(line);
    if (SURVEY_LINE.test(line)) {
      const at = line.indexOf(':');
      const rest = line.slice(at + 1).trim();
      const hit = / (Positive|Current use)\b|Possible impairment/.test(rest);
      return `<p class="rosline"><b>${esc(line.slice(0, at))}:</b> `
        + (hit ? `<span class="rospos">${esc(rest)}</span>` : esc(rest)) + '</p>';
    }
    if (/^[•\-*]\s/.test(line)) {
      return `<p class="pt">${esc(line.replace(/^[•\-*]\s*/, '• '))}</p>`;
    }
    const i = line.indexOf('—');
    if (i < 0) return `<p>${esc(line)}</p>`;
    return `<p><b>${esc(line.slice(0, i).trim())}</b> — ${esc(line.slice(i + 1).trim())}</p>`;
  }).join('');
};

/**
 * What to do between now and the next visit, numbered.
 *
 * A numbered list is a list somebody can work through and report
 * back on; a paragraph is a list they remember one item of. The
 * numbers are added here rather than typed, so a step moved or
 * removed does not leave the list counting wrong.
 */
const steps = (text: string): string => {
  const lines = text.split('\n').map((l) => l.trim().replace(/^\d+[.)]\s*/, ''))
    .filter(Boolean);
  if (lines.length === 0) return '';
  return `<ol class="faxsteps">${lines.map((l) => `<li>${esc(l)}</li>`).join('')}</ol>`;
};


/**
 * The same care, three ways to pay for it, against one baseline.
 *
 * Everything is measured against what Medicare fee for service would
 * allow for the same codes, because that is the number this practice
 * derives its own prices from and it is the only one of the four
 * that is published rather than negotiated.
 *
 * NEEDS-COUNSEL. This practice bills nobody today. D-039 guardrail
 * 4b says no print piece may state how Medicare or Medicaid work
 * with a membership until counsel has settled it, and this row is
 * exactly that. It is here so the owner can see the shape of the
 * decision; it carries its own warning, and SHOW_PAYER_ROUTES turns
 * it off for anything a patient will hold.
 */
const SHOW_PAYER_ROUTES = true;

/**
 * Dollars, with the separators a four figure number needs.
 *
 * $85000.00 is a number somebody has to count the digits of.
 * Whole dollars above a thousand, cents below it, because the
 * cents on a household income are noise and the cents on a visit
 * price are the price.
 */
const money = (n: number): string => (n >= 1000 && n % 1 === 0
  ? `$${n.toLocaleString('en-US')}`
  : `$${n.toLocaleString('en-US', {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  })}`);

function routes(plan: YearPlan, input: FaxInput, age?: number): string {
  const kind: VisitKind = 'follow-up';
  const base = visitWorth(kind, age) ?? 0;

  /*
   * The scale, against the poverty line for the household. Its own
   * row rather than a paragraph inside the payer table: it changes
   * what this patient pays, and the payer table does not.
   */
  const sl = input.sliding
    ? slide(plan.upfront, input.sliding.income, input.sliding.household)
    : undefined;
  const scale = sl && sl.band
    ? '<tr><th>Sliding scale</th><td>'
      + `${money(input.sliding!.income)} across ${input.sliding!.household} people is `
      + `${Math.round(sl.ofPoverty * 100)} per cent of the federal poverty guideline, `
      + `which is ${esc(sl.band.label)}. ${Math.round(sl.off * 100)} per cent comes `
      + `off: <b>${money(sl.price)}</b> for the year upfront.</td></tr>`
    : '<tr><th>Sliding scale</th><td>Fees come down against the federal poverty '
      + 'guideline for the household, which moves with how many people the income '
      + 'supports. Ask, and nobody has to explain why.</td></tr>';

  if (!SHOW_PAYER_ROUTES) return scale;

  /*
   * What the same visit is worth through each door, against the one
   * published baseline. Compressed to the payers themselves: cash and
   * upfront are two rows above this one and repeating them here was
   * the section arguing with itself about how many ways there are to
   * pay.
   */
  const lines = PAYER_ROUTES.map((r) => {
    const allowed = payerAllows(kind, r, age);
    return `<tr><td>${esc(r.label)}</td>`
      + `<td class="faxmoney">${allowed === undefined ? 'UNSET'
        : `${money(allowed)}<br><span class="faxbasis">`
          + `${Math.round((r.ratio ?? 1) * 100)}% of baseline</span>`}</td>`
      + `<td>${esc(r.patientPays)}</td></tr>`;
  }).join('');

  return scale
    + '<tr><th>If it were billed</th><td>'
    + '<p class="faxest"><b>Not in use.</b> This practice bills no insurer and '
    + 'nothing here is an offer. It is modelled so the comparison is on one page, '
    + 'and it has to be settled with counsel before it means anything.</p>'
    + `<p>One planned review, which the schedule values at ${money(base)}:</p>`
    + `<table class="faxquote"><tbody>${lines}</tbody></table></td></tr>`;
}

/**
 * The running list, not a fresh one each visit.
 *
 * A list that starts empty every visit loses things. The item nobody
 * got to in February is gone by May, not because it stopped
 * mattering but because nobody wrote it down again, and the ones
 * that go that way are reliably the dull administrative ones: the
 * phone call about what a drug costs, the booster that keeps being
 * deferred. Those are exactly the items a patient needs help with
 * and exactly the ones a fresh list drops.
 *
 * So it carries forward. An item stays until it is done or until
 * somebody decides it is not worth doing, and the list is the same
 * list each time rather than a new one. It should get shorter: a
 * first visit hands over a lot and a sixth should hand over three
 * things, and a list that is not shrinking is a plan that is not
 * working.
 */
function todoList(text: string | undefined, input: FaxInput): string {
  const items = steps(text ?? '');
  if (!items) return '';
  const first = input.newPatient;
  return '<h3>Our running list</h3>'
    + '<p class="faxest">This is the list we keep together, not a new one each time. '
    + 'We go through it at every visit: what is done comes off, what is not stays on '
    + 'with the reason, and anything new goes to the bottom. '
    + (first
      ? 'A first visit hands over more than any visit after it, and the list should '
        + 'get shorter from here.'
      : 'It should be getting shorter.')
    + '</p>'
    + items
    + '<p class="faxest">Between visits, the patient portal handles the '
    + 'administrative side of this: booking, chasing a referral, finding out what '
    + 'something will cost. And I take support calls on weekdays, walk-in or '
    + 'scheduled, for anything on this list that needs a person rather than a form.'
    + '</p>';
}

/**
 * What each number is aiming at, and when.
 *
 * The last thing before the money, which is the right place for it:
 * a patient reads the plan, then what it is supposed to achieve,
 * then what it costs. Measures already at target are on the list,
 * because a patient who only ever sees the problems never learns
 * that keeping something steady is a result.
 *
 * The interim aims are estimates and the page says so in its own
 * line rather than in a footnote nobody reads. They are a straight
 * line from here to the target across the visits already booked,
 * which is what even progress would look like, and progress is not
 * even.
 */
function targets(input: FaxInput): string {
  const rows = input.targets ?? [];
  if (rows.length === 0) return '';

  /*
   * One footnote per guideline, numbered where it is used rather
   * than named. The key is an internal slug and printing it under
   * the measure put "acc aha lipid" on a page a patient reads.
   */
  const used = [...new Set(rows.map((r) => r.source))].filter((k) => TARGET_SOURCES[k]);
  const noteNo = (k: string) => used.indexOf(k) + 1;

  const dates = rows[0].aims.map((a) => a.date);
  const head = '<tr><th>Measure</th><th>Now</th><th>Aiming at</th>'
    + dates.map((d) => `<th class="faxmoney">${fmtDate(d)}</th>`).join('')
    + '</tr>';
  const body = rows.map((r) => `<tr><td>${esc(r.label)}`
    + (noteNo(r.source) > 0 ? `<sup>${noteNo(r.source)}</sup>` : '')
    + '</td>'
    + `<td>${esc(r.current)}${r.on ? `<br><span class="faxbasis">${fmtDate(r.on)}</span>` : ''}</td>`
    + `<td>${esc(r.target)}${r.atTarget ? '<br><span class="faxbasis">at target</span>' : ''}</td>`
    + r.aims.map((a) => `<td class="faxmoney">${esc(a.aim)}</td>`).join('')
    + '</tr>').join('');

  const notes = used.map((k, i) =>
    `<p class="faxnote">${i + 1}. ${esc(TARGET_SOURCES[k])}</p>`).join('');

  return '<h3>What we are aiming at</h3>'
    + '<p class="faxest">The columns on the right are estimates, not promises. They '
    + 'are what steady progress would look like between now and each visit already '
    + 'booked, so that there is something to measure against. Real numbers move in '
    + 'steps, and a number that misses one of these is information rather than a '
    + 'failure.</p>'
    + `<table class="faxto faxtarget"><tbody>${head}${body}</tbody></table>`
    + `<p class="faxnote"><b>Where the targets come from.</b> Each is the figure in `
    + 'the relevant national guideline, not a number this practice chose. The '
    + 'edition of each guideline has not been re-checked against the publication '
    + 'and guideline targets do move.</p>'
    + notes;
}

/**
 * What it costs, in as few rows as it can be said in.
 *
 * One year, two ways to pay for it, and a separate line for the
 * illness nobody booked. That is the whole offer, and an offer that
 * takes more than four rows to state is one the patient will take
 * somebody else's word for.
 *
 * It got here by losing things. There was a monthly membership with
 * unlimited visits, priced off a projection of how many unplanned
 * visits a patient with this many problems ought to have. Every part
 * of that was a place to be wrong: the projection, the unlimited
 * promise, and the arithmetic turning one into the other. Charging
 * for an acute visit when there is one says the same thing without
 * any of it.
 *
 * Every price is still benchmarked rather than chosen: a visit is
 * worth what the published fee schedule pays for the code its own
 * documentation supports. No claim is filed and no insurer is
 * billed.
 */
function billing(input: FaxInput): string {
  const booked = (input.booked ?? []).filter((v) => v.date);
  /*
   * Their age on the day of the visit, not today. The preventive
   * codes are banded by age, so a note from three years ago is
   * priced at the band they were in when it was written.
   */
  const age = ageAt(input.patient.dob, input.encounter.date);
  const rows: string[] = [];

  const line = (v: { date: string; why: string; kind: VisitKind; price: number }) =>
    `<tr><td>${fmtDate(v.date)}</td>`
    + `<td>${esc(v.why || 'review')}<br><span class="faxbasis">`
    + `${esc(VISIT_TYPES[v.kind].label)}, ${esc(codesFor(v.kind, age).join(' and '))}`
    + '</span></td>'
    + `<td class="faxmoney">${money(v.price)}</td></tr>`;

  // ---------------------------------------------------------- this visit
  if (input.newPatient) {
    const worth = visitWorth('initial', age);
    rows.push('<tr><th>This visit</th><td>No charge. A first assessment is pro bono.'
      + (worth === undefined ? '' : ` The work is ${VISIT_TYPES.initial.minutes} `
        + `minutes, ${esc(codesFor('initial', age).join(' and '))}, which the `
        + `benchmark values at ${money(worth)}.`)
      + '</td></tr>');
  } else if (input.quotedAt) {
    rows.push(`<tr><th>This visit</th><td>${money(input.quotedAt.price)}, in the year `
      + `plan made on ${fmtDate(input.quotedAt.on)}.</td></tr>`);
  } else {
    const k: VisitKind = input.visitKind ?? 'acute';
    const p = visitPrice(k, age);
    rows.push('<tr><th>This visit</th><td>'
      + (p === undefined
        ? 'Not priced: the code this work supports has no rate on file.'
        : `${money(p)}. An ${esc(VISIT_TYPES[k].label.toLowerCase())}, which is not `
          + 'in the year plan because nobody can book an illness. '
          + `${esc(codesFor(k, age).join(' and '))}.`)
      + '</td></tr>');
  }

  // ------------------------------------------------------- the year behind
  if (!input.newPatient && booked.length > 0 && input.yearBehind
      && input.yearBehind.visits > 0 && input.yearBehind.paid !== undefined) {
    const yb = input.yearBehind;
    const offered = input.yearBehindUpfront;
    rows.push('<tr><th>The year behind</th><td>'
      + `${yb.visits} visit${yb.visits === 1 ? '' : 's'} since `
      + `${fmtDate(yb.since)}, which came to ${money(yb.paid)}`
      + (offered === undefined
        ? '.'
        : `. Paying that year upfront would have been ${money(offered)} for the `
          + 'planned visits, plus any acute visit as it happened.')
      + '</td></tr>');
  }

  // -------------------------------------------------------- the year ahead
  if (input.newPatient || booked.length > 0) {
    const plan = planYear(booked, age);
    if (plan.visits.length > 0) {
      rows.push('<tr><th>One year plan</th><td>'
        + `${plan.visits.length} visit${plan.visits.length === 1 ? '' : 's'}, `
        + 'each priced at what its own work is worth.'
        + `<table class="faxquote"><tbody>${plan.visits.map(line).join('')}`
        + '<tr class="faxtotal"><td></td><td>Total</td>'
        + `<td class="faxmoney">${money(plan.total)}</td></tr>`
        + '</tbody></table></td></tr>');
      rows.push('<tr><th>Three ways to pay</th><td>'
        + '<table class="faxquote"><tbody>'
        + '<tr><td><b>Per visit</b></td>'
        + `<td class="faxmoney">${money(plan.total)}`
        + (plan.acuteFee === undefined ? ''
          : `<br><span class="faxbasis">plus ${money(plan.acuteFee)} an acute visit`
            + '</span>')
        + '</td>'
        + '<td>Each visit paid when it happens. An acute visit is charged when '
        + 'there is one.</td></tr>'
        + '<tr><td><b>The year upfront</b></td>'
        + `<td class="faxmoney">${money(plan.upfront)}`
        + `<br><span class="faxbasis">${Math.round(UPFRONT_DISCOUNT * 100)}% less`
        + '</span></td>'
        + '<td>The year paid at the start, and every acute or extra follow-up '
        + 'visit included.</td></tr>'
        + '<tr><td><b>Monthly</b></td>'
        + `<td class="faxmoney">${money(plan.monthly)}/mo`
        + '<br><span class="faxbasis">the same year in twelve</span></td>'
        + '<td>The same price and the same inclusions, spread.</td></tr>'
        + '</tbody></table>'
        + `<p>Committing to the year saves ${money(plan.saving)} against paying per `
        + 'visit, and covers any visit the year turns out to need.</p></td></tr>');
      rows.push(routes(plan, input, age));
    }
  }

  rows.push(
    '<tr><th>Included</th><td>Each visit above, and the messaging and coordination '
      + 'between them. There is no charge for a message, a phone call or a letter '
      + 'like this one. Support calls on weekdays, walk-in or scheduled, are '
      + 'included too.</td></tr>',
    '<tr><th>Not included</th><td>Laboratory tests, imaging, medicines and anything '
      + 'done by another practice. Those are billed to the patient by whoever '
      + 'provides them.</td></tr>',
    '<tr><th>How it is priced</th><td>Each visit is worth what the published 2026 '
      + 'national fee schedule pays for the code its own documentation supports, '
      + `at ${CONVERSION_FACTOR} dollars per relative value unit. No claim is filed `
      + 'and no insurance is billed; the schedule is used as a benchmark so that '
      + 'every price has an answer to why it is that number.</td></tr>',
  );

  return `<h3>Billing</h3><table class="faxto faxbill"><tbody>${rows.join('')}</tbody></table>`;
}

export function buildFaxNote(input: FaxInput): { html: string; pages: string } {
  const { patient: p, encounter: e, today } = input;
  const n = e.note;
  const ident = `${esc(p.name)} &middot; born ${fmtDate(p.dob)}`;

  /*
   * How many pages. A fax cover sheet states it so the receiving end
   * can tell a short note from a truncated one, and a browser cannot
   * know it before it paginates. Stated as the cover plus the note,
   * which is what the sender can count and correct by hand.
   */
  const pages = 'cover sheet plus the note';

  const plan = (n?.plan.problems ?? []).map((pr) => [
    pr.problem, pr.assessment, pr.treatment, pr.orders, pr.followUp,
  ].filter(Boolean).join('\n')).join('\n\n');

  const html = `
    <article class="fax">

      ${input.coverSheet === false ? '' : `      <section class="faxcover">
        <h1>Fax cover sheet</h1>
        <table class="faxto">
          <tbody>
            <tr><th>To</th><td>${esc(input.to || 'UNSET')}${
  input.toPractice ? `<br>${esc(input.toPractice)}` : ''}</td></tr>
            <tr><th>Fax</th><td>${esc(input.faxNumber || 'UNSET')}</td></tr>
            <tr><th>From</th><td>${esc(input.from)}<br>Lifestyle and Preventative Medicine Clinic</td></tr>
            <tr><th>Sent</th><td>${fmtDate(today)}</td></tr>
            <tr><th>Pages</th><td>${pages}</td></tr>
            <tr><th>About</th><td>${ident}</td></tr>
          </tbody>
        </table>

        ${input.reason ? `<h3>Why we are sending this</h3><p>${esc(input.reason)}</p>` : ''}

        <h3>What this is</h3>
        <p>
          This is the note from one visit on ${fmtDate(e.date)}. It is not the
          whole record. If you need the whole record, call us and we will send it.
        </p>

        <h3>If this reached you by mistake</h3>
        <p>
          This fax is for the person named above. If you are not that person,
          please call us and destroy the pages.
        </p>
        <p class="faxcontact">
          Lifestyle and Preventative Medicine Clinic &middot;
          phone (979) 481-9110 &middot; fax ${esc(PRACTICE_FAX)}
        </p>
      </section>`}

      <section class="faxnote">
        <!--
          One line, once. It opens the note and does not come back at
          the top of every page: a note is read as a document rather
          than as a stack of loose pages, and a line repeated four
          times is three lines of furniture.
        -->
        <p class="faxrun">${esc(p.name)}
          &middot; ${fmtDate(p.dob)}
          &middot; ${ageAt(p.dob, e.date)} ${p.sex === 'female' ? 'F' : 'M'}
          &middot; ${fmtDate(e.date)},
          ${esc(SETTING_LABEL[e.setting ?? 'in-person'].toLowerCase())}
          &middot; ${e.signedAt ? `signed ${fmtDate(e.signedAt)}` : 'not signed'}</p>

        <h3>Subjective</h3>
        ${n?.subjective.oneLiner ? `<p class="faxone">${esc(n.subjective.oneLiner)}</p>` : ''}
        ${body([
    n?.subjective.chartReview, n?.subjective.diagnostics,
    n?.subjective.specialists, n?.subjective.additional,
  ].filter(Boolean).join('\n\n'))}

        <h3>Objective</h3>
        <p class="svc">Vitals</p>
        ${vitalsHtml(input.vitals ?? [], input.series ?? []) || body(n?.objective.vitals)}
        <p class="svc">Labs</p>
        ${labsHtml(input.panels)}
        ${body(n?.objective.exam)}

        <h3>Assessment and plan</h3>
        ${n?.assessment.overall?.trim() ? body(n.assessment.overall) : ''}
        ${body(plan)}

        ${todoList(n?.plan.overall, input)}

        ${n?.plan.followUp?.trim()
    ? n.plan.followUp.trim().split('\n')
      .map((l) => `<p class="faxfollow">${esc(l.trim())}</p>`).join('')
    : ''}

        ${targets(input)}

        ${billing(input)}

        <div class="faxsign">
          ${e.signedAt ? '<p class="faxhand">Logan DuBose</p>' : ''}
          <p><b>Logan L. DuBose, MD, MBA, DipIBLM</b></p>
          <p>General Practitioner (GP), Licensed in VA</p>
          <p>Lifestyle and Preventative Medicine Clinic, ${esc(PRACTICE_SITE)}</p>
          <p>${esc(PRACTICE_ADDRESS)}</p>
          <p>Phone: (979) 481-9110 &nbsp;|&nbsp; Fax: ${esc(PRACTICE_FAX)}
            &nbsp;|&nbsp; Email: logandubose960@lpmc.com</p>
          <p>${e.signedAt
    ? `Signed ${fmtDate(e.signedAt)}.`
    : 'This note is not signed. It is a draft and should not be filed as a record.'}</p>
        </div>
      </section>
    </article>
  `;

  return { html, pages };
}
