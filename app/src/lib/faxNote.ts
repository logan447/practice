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
import { fmtDate, age } from './format';
import { labsHtml } from './fishbone';
import { vitalsHtml } from './vitals';
import {
  planYear, visitPrice, visitWorth, VISIT_TYPES, MEMBERSHIP_DISCOUNT,
} from './billing';
import type { VisitKind } from './billing';
import { CONVERSION_FACTOR } from './fees';
import { SECTION_HEADINGS } from '../domain/noteTemplate';
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
   * What the membership quoted for the year behind would have cost.
   *
   * Read off the note that quoted it rather than recomputed, so
   * the comparison is against the price somebody was actually
   * given and not against one worked out with hindsight.
   */
  yearBehindMembership?: number;
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
 * What this costs, what the year costs, and what a membership would.
 *
 * Cash. No claim is filed and no insurer is billed, so the number on
 * this page is the number the patient pays, which is the whole
 * argument for charging this way.
 *
 * Every price is benchmarked rather than chosen. A visit is worth
 * what the published national fee schedule pays for the code the
 * visit's own documentation supports, so the answer to "why that
 * number" is a code and a rate somebody else published, not a
 * judgment about what this patient will tolerate.
 *
 * A first assessment is free. What comes out of it is the year: the
 * visits that were booked, priced one by one, plus the visits nobody
 * books but everybody should expect, and then the same year offered
 * as a monthly fee that covers all of it and anything unplanned. So
 * the section reads as a quote at a first visit, a receipt at the
 * visits inside that year, and both at the annual.
 */
function billing(input: FaxInput): string {
  const booked = (input.booked ?? []).filter((v) => v.date);
  const off = input.problemsOffTarget ?? 0;
  const rows: string[] = [];
  const money = (n: number) => `$${n.toFixed(2)}`;

  /** One priced line of a year, with what makes it that price. */
  const line = (v: { date?: string; why: string; kind: VisitKind; price: number }) =>
    `<tr><td>${v.date ? fmtDate(v.date) : 'expected'}</td>`
    + `<td>${esc(v.why || 'review')}<br><span class="faxbasis">`
    + `${esc(VISIT_TYPES[v.kind].label)}, ${esc(VISIT_TYPES[v.kind].codes.join(' and '))}`
    + `</span></td>`
    + `<td class="faxmoney">${money(v.price)}</td></tr>`;

  /**
   * The year ahead, as a table and then as a monthly fee.
   *
   * Written once and used at both the visits that price a year: the
   * first assessment and every annual after it.
   */
  const yearAhead = () => {
    const plan = planYear(booked, off);
    const all = [...plan.planned, ...plan.unplanned];
    if (all.length === 0) return;
    rows.push('<tr><th>The year ahead</th><td>'
      + 'Each visit priced at what its own work is worth, and the visits nobody '
      + 'books but everybody should expect added at the bottom.'
      + `<table class="faxquote"><tbody>${all.map(line).join('')}`
      + '<tr class="faxtotal"><td></td><td>Paying for each visit as it happens</td>'
      + `<td class="faxmoney">${money(plan.feeForService)}</td></tr>`
      + '</tbody></table></td></tr>');
    rows.push('<tr><th>Or a membership</th><td>'
      + `${money(plan.feeForService)} less ${Math.round(MEMBERSHIP_DISCOUNT * 100)} `
      + `per cent is ${money(plan.membershipYear)}, which is `
      + `<b>${money(plan.membershipMonth)} a month</b>. `
      + 'It covers every visit above and any other visit this year, acute or '
      + 'planned, with nothing charged per visit. '
      + `The ${plan.unplanned.length} unbooked `
      + `${plan.unplanned.length === 1 ? 'visit is' : 'visits are'} an estimate; `
      + 'the membership is what makes being wrong about it cost nothing.'
      + '</td></tr>');
  };

  // ---------------------------------------------------------- this visit
  if (input.newPatient) {
    const worth = visitWorth('initial');
    rows.push('<tr><th>This visit</th><td>No charge. A first assessment is pro bono.'
      + (worth === undefined ? '' : ` The work is ${VISIT_TYPES.initial.minutes} `
        + `minutes, ${esc(VISIT_TYPES.initial.codes.join(' and '))}, which the `
        + `benchmark values at ${money(worth)}.`)
      + '</td></tr>');
  } else if (input.quotedAt) {
    rows.push(`<tr><th>This visit</th><td>${money(input.quotedAt.price)}, quoted on `
      + `${fmtDate(input.quotedAt.on)} as one of ${input.quotedAt.of} visits for the `
      + 'year.</td></tr>');
  } else {
    /*
     * A visit the quote did not hold. It is priced at what it is
     * worth rather than at what a planned visit costs, because an
     * acute visit is a smaller piece of work and charging the planned
     * price for it would be the practice profiting from an illness.
     */
    const k: VisitKind = input.visitKind ?? 'acute';
    const p = visitPrice(k);
    rows.push('<tr><th>This visit</th><td>'
      + (p === undefined
        ? 'Not in the year that was quoted, and not priced: the code this work '
          + 'supports has no rate on file.'
        : `${money(p)}. Not in the year that was quoted, so it is priced on its own: `
          + `${esc(VISIT_TYPES[k].label.toLowerCase())}, `
          + `${esc(VISIT_TYPES[k].codes.join(' and '))}. `
          + 'A shorter visit costs less than a planned review, which is why it is '
          + 'not charged at the planned rate.')
      + '</td></tr>');
  }

  // ------------------------------------------------------- the year behind
  if (!input.newPatient && booked.length > 0) {
    /*
     * The year that just ended, priced both ways.
     *
     * Only at the visit that closes a quoted year and prices the next
     * one, which in practice is the annual. Printed mid-year it would
     * set three months of visits against twelve months of membership
     * and make paying per visit look cheap for the arithmetic reason
     * that the year is not over.
     */
    const yb = input.yearBehind;
    if (yb && yb.visits > 0 && yb.paid !== undefined) {
      const wouldHave = input.yearBehindMembership;
      rows.push('<tr><th>The year behind</th><td>'
        + `${yb.visits} charged visit${yb.visits === 1 ? '' : 's'} since `
        + `${fmtDate(yb.since)}, which came to ${money(yb.paid)}. `
        + (wouldHave === undefined
          ? 'No membership was quoted for it.'
          : `The membership quoted for that year was ${money(wouldHave)}, so paying `
            + 'by the visit cost '
            + (yb.paid > wouldHave
              ? `${money(yb.paid - wouldHave)} more than the membership would have.`
              : yb.paid < wouldHave
                ? `${money(wouldHave - yb.paid)} less than the membership would have.`
                : 'the same as the membership would have.'))
        + '</td></tr>');
    }
  }

  // -------------------------------------------------------- the year ahead
  if (input.newPatient || booked.length > 0) yearAhead();

  rows.push(
    '<tr><th>Included</th><td>Each visit above, and the messaging and coordination '
      + 'between them. There is no charge for a message, a phone call or a letter '
      + 'like this one, whichever way the visits are paid for.</td></tr>',
    '<tr><th>Not included</th><td>Laboratory tests, imaging, medicines and anything '
      + 'done by another practice. Those are billed to the patient by whoever '
      + 'provides them.</td></tr>',
    '<tr><th>How it is priced</th><td>Each visit is worth what the published 2026 '
      + 'national fee schedule pays for the code its own documentation supports, '
      + `at ${CONVERSION_FACTOR} dollars per relative value unit. No claim is filed `
      + 'and no insurance is billed; the schedule is used as a benchmark so that '
      + 'every price has an answer to why it is that number. Sliding-scale and pro '
      + 'bono places exist and are arranged separately.</td></tr>',
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
          &middot; ${age(p.dob, e.date)} ${p.sex === 'female' ? 'F' : 'M'}
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

        ${n?.plan.overall?.trim() ? `<h3>Before your next visit</h3>${steps(n.plan.overall)}` : ''}

        ${n?.plan.followUp?.trim()
    ? n.plan.followUp.trim().split('\n')
      .map((l) => `<p class="faxfollow">${esc(l.trim())}</p>`).join('')
    : ''}

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
