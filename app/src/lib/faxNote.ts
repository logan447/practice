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
import { quoteYear, compare, MONTHLY_FEE, VISIT_FEE } from './billing';
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
  /**
   * The twelve months behind this visit, where there are any.
   *
   * Counted by the caller from the signed visits in the year before
   * this one, which is the only count worth printing: a quote says
   * what a year was expected to hold and this says what it held.
   * The two differ by whatever went wrong, and the difference is
   * the whole of the argument for paying by the year instead.
   */
  yearBehind?: { visits: number; since: string };
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
const SERVICES = new Set([
  'Lifestyle', 'Preventative', 'Review of systems',
  'Vitals', 'Labs', 'Physical Exam', 'Surveys', 
  'Full problem list', 'Medications', 'Care team',
  'Preventative Medicine Services',
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
 * What this costs, and what the year costs.
 *
 * Cash. There is no claim, no code and no payer, so there is nothing
 * to translate: the number on this page is the number the patient
 * pays, which is the whole argument for charging this way.
 *
 * A first assessment is free. What is charged is the year that comes
 * out of it, quoted at the visit that plans it and fixed for twelve
 * months, then quoted again at the next annual when the next year is
 * planned. So the section reads differently on a first visit, where
 * it is a quote, than on the visits inside that year, where it is a
 * receipt against one.
 */
function billing(input: FaxInput): string {
  const booked = (input.booked ?? []).filter((v) => v.date);
  const rows: string[] = [];

  if (input.newPatient) {
    rows.push('<tr><th>This visit</th><td>No charge. A first assessment is '
      + 'pro bono.</td></tr>');
    if (booked.length > 0) {
      const q = quoteYear(booked, true);
      const lines = q.visits.map((v) => `<tr><td>${fmtDate(v.date)}</td>`
        + `<td>${esc(v.why || 'review')}</td>`
        + `<td class="faxmoney">$${v.price.toFixed(2)}</td></tr>`).join('');
      rows.push(`<tr><th>The year ahead</th><td>Quoted today and fixed for twelve `
        + `months. ${q.visits.length} `
        + `${q.visits.length === 1 ? 'visit' : 'visits'} `
        + `at $${q.each.toFixed(2)}${q.visits.length === 1 ? '' : ' each'}.`
        + `<table class="faxquote"><tbody>${lines}`
        + `<tr class="faxtotal"><td></td><td>Total</td>`
        + `<td class="faxmoney">$${q.total.toFixed(2)}</td></tr></tbody></table></td></tr>`);
      const c = compare(booked.length);
      rows.push('<tr><th>Or a membership</th><td>'
        + `$${MONTHLY_FEE} a month, $${c.membership.toFixed(2)} for the year, `
        + 'covering the visits above and any other visit this year, with no '
        + 'charge per visit. Against the '
        + `$${c.payPerVisit.toFixed(2)} above it is `
        + (c.saving > 0
          ? `$${c.saving.toFixed(2)} less`
          : `$${Math.abs(c.saving).toFixed(2)} more`)
        + `, and it turns at ${c.breakEven} visits in a year. `
        + `${c.visits} ${c.visits === 1 ? 'is' : 'are'} booked, so one unplanned `
        + 'illness is what decides it.</td></tr>');
    } else {
      rows.push('<tr><th>The year ahead</th><td>Not quoted: no visits were booked '
        + 'at this one, so there is no year to price.</td></tr>');
    }
  } else if (input.quotedAt) {
    rows.push(`<tr><th>This visit</th><td>$${input.quotedAt.price.toFixed(2)}, quoted on `
      + `${fmtDate(input.quotedAt.on)} as one of ${input.quotedAt.of} visits for the `
      + 'year.</td></tr>');
  } else {
    rows.push('<tr><th>This visit</th><td>Not in the year that was quoted. Priced at '
      + 'the same rate as a planned visit and added to the year.</td></tr>');
  }

  if (!input.newPatient && booked.length > 0) {
    /*
     * The year that just ended, priced both ways.
     *
     * Only at the visit that closes a quoted year and prices the next
     * one, which in practice is the annual. Printed at a visit in the
     * middle of a year it would set three months of visits against
     * twelve months of membership and make paying per visit look
     * cheap for the arithmetic reason that the year is not over.
     *
     * It is also the one place the comparison is made out of what
     * happened rather than out of what somebody expected to happen,
     * which is the only honest way to tell somebody what a membership
     * would have saved them.
     */
    const yb = input.yearBehind;
    if (yb && yb.visits > 0) {
      const c = compare(yb.visits);
      rows.push('<tr><th>The year behind</th><td>'
        + `${yb.visits} charged visit${yb.visits === 1 ? '' : 's'} since `
        + `${fmtDate(yb.since)}, which came to $${c.payPerVisit.toFixed(2)}. `
        + `A membership for the same year would have been $${c.membership.toFixed(2)}, `
        + (c.saving > 0
          ? `so paying by the visit cost $${c.saving.toFixed(2)} more than a `
            + 'membership would have.'
          : c.saving < 0
            ? `so paying by the visit cost $${Math.abs(c.saving).toFixed(2)} less `
              + 'than a membership would have.'
            : 'so the two came to the same.')
        + '</td></tr>');
    }
    const q = quoteYear(booked, false);
    const lines = q.visits.map((v) => `<tr><td>${fmtDate(v.date)}</td>`
      + `<td>${esc(v.why || 'review')}</td>`
      + `<td class="faxmoney">$${v.price.toFixed(2)}</td></tr>`).join('');
    rows.push('<tr><th>The year ahead</th><td>'
      + `Quoted today and fixed for twelve months. ${q.visits.length} `
      + `${q.visits.length === 1 ? 'visit' : 'visits'} `
      + `at $${q.each.toFixed(2)}${q.visits.length === 1 ? '' : ' each'}.`
      + `<table class="faxquote"><tbody>${lines}`
      + '<tr class="faxtotal"><td></td><td>Total</td>'
      + `<td class="faxmoney">$${q.total.toFixed(2)}</td></tr>`
      + '</tbody></table></td></tr>');
    const c = compare(q.visits.length);
    rows.push('<tr><th>Or a membership</th><td>'
      + `$${MONTHLY_FEE} a month, $${c.membership.toFixed(2)} for the year, `
      + 'covering the visits above and any other visit, with no charge per visit. '
      + `Against the $${c.payPerVisit.toFixed(2)} above it is `
      + (c.saving > 0
        ? `$${c.saving.toFixed(2)} less`
        : `$${Math.abs(c.saving).toFixed(2)} more`)
      + `, and it turns at ${c.breakEven} visits in a year`
      + (input.yearBehind
        ? `. The year just gone held ${input.yearBehind.visits}.</td></tr>`
        : '.</td></tr>'));
  }

  rows.push(
    '<tr><th>Included</th><td>Each visit above, and the messaging and coordination '
      + 'between them. There is no charge for a message, a phone call or a letter '
      + 'like this one, whichever way the visits are paid for.</td></tr>',
    '<tr><th>Not included</th><td>Laboratory tests, imaging, medicines and anything '
      + 'done by another practice. Those are billed to the patient by whoever '
      + 'provides them.</td></tr>',
    `<tr><th>How it is set</th><td>$${VISIT_FEE.toFixed(2)} a visit, whoever is in `
      + 'the chair and whatever the visit turns out to hold, or '
      + `$${MONTHLY_FEE} a month, which covers every visit in the year. Two prices, `
      + 'decided once and the same for everybody. Sliding-scale and pro bono '
      + 'places exist and are arranged separately.</td></tr>',
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
