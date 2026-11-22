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
import type { Encounter, LabPanel, Patient } from '../domain/types';
import { SETTING_LABEL } from '../domain/types';
import { fmtDate, age } from './format';
import { labsHtml } from './fishbone';
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
  'Labs', 'Physical Exam', 'Surveys',
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

/** A section, left out entirely when it is empty. */
const sec = (title: string, text?: string): string =>
  ((text ?? '').trim() ? `<h3>${esc(title)}</h3>${body(text)}` : '');

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

      <section class="faxcover">
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
      </section>

      <!--
        One line, and it is the only thing above the first heading.
        It is a table head rather than a paragraph because every
        browser repeats a thead across printed pages, and none of
        them repeat a fixed element reliably. Pages get separated at
        the receiving end, and a clinical page with no name on it is
        a page that can be filed into the wrong chart, so the one
        line a reader needs is the one that comes back on each page.
      -->
      <table class="faxpage">
        <thead>
          <tr><th class="faxrun">${esc(p.name)}
            &middot; ${fmtDate(p.dob)}
            &middot; ${age(p.dob)} ${p.sex === 'female' ? 'F' : 'M'}
            &middot; ${fmtDate(e.date)},
            ${esc(SETTING_LABEL[e.setting ?? 'in-person'].toLowerCase())}
            &middot; ${e.signedAt ? `signed ${fmtDate(e.signedAt)}` : 'not signed'}</th></tr>
        </thead>
        <tbody><tr><td>
      <section class="faxnote">
        <h3>Subjective</h3>
        ${n?.subjective.oneLiner ? `<p class="faxone">${esc(n.subjective.oneLiner)}</p>` : ''}
        ${body([
    n?.subjective.chartReview, n?.subjective.diagnostics,
    n?.subjective.specialists, n?.subjective.additional,
  ].filter(Boolean).join('\n\n'))}

        <h3>Objective</h3>
        ${body(n?.objective.vitals)}
        <p class="svc">Labs</p>
        ${labsHtml(input.panels)}
        ${body(n?.objective.exam)}

        <h3>Assessment and plan</h3>
        ${n?.assessment.overall?.trim() ? body(n.assessment.overall) : ''}
        ${body(plan)}

        ${sec('Patient instructions', n?.plan.overall)}

        ${n?.plan.followUp?.trim()
    ? `<p class="faxfollow">${esc(n.plan.followUp.trim())}</p>` : ''}

        <div class="faxsign">
          ${e.signedAt ? '<p class="faxhand">Logan DuBose</p>' : ''}
          <p><b>Logan L. DuBose, MD, MBA, DipIBLM</b></p>
          <p>General Practitioner, licensed in VA</p>
          <p>Lifestyle and Preventative Medicine Clinic</p>
          <p>Phone: (979) 481-9110 &nbsp;|&nbsp; Fax: ${esc(PRACTICE_FAX)}
            &nbsp;|&nbsp; Email: logandubose960@lpmc.com</p>
          <p>${esc(PRACTICE_SITE)}</p>
          <p>${e.signedAt
    ? `Signed ${fmtDate(e.signedAt)}.`
    : 'This note is not signed. It is a draft and should not be filed as a record.'}</p>
        </div>
      </section>
        </td></tr></tbody>
      </table>
    </article>
  `;

  return { html, pages };
}
