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
import type { Encounter, Patient } from '../domain/types';
import { SETTING_LABEL } from '../domain/types';
import { fmtDate, age } from './format';

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
}

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
const SERVICES = new Set(['Medical', 'Lifestyle', 'Preventative']);

const body = (text?: string): string => {
  const t = (text ?? '').trim();
  if (!t) return '<p class="none">Not recorded.</p>';
  return t.split('\n').map((raw) => {
    const line = raw.trim();
    if (!line) return '';
    if (SERVICES.has(line)) return `<p class="svc">${esc(line)}</p>`;
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
            <tr><th>From</th><td>${esc(input.from)}<br>Direct Lifestyle Medicine</td></tr>
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
          Direct Lifestyle Medicine &middot; phone UNSET &middot; fax UNSET
        </p>
      </section>

      <!--
        A table with one cell, so the identifier repeats.
        Every browser repeats a thead across printed pages, and none
        of them repeat a fixed element reliably: headless Chrome
        places it once and prints it over the text. Pages get
        separated at the receiving end, and a clinical page with no
        name on it is a page that can be filed into the wrong chart,
        so this is not a detail to leave to a CSS feature that works
        in some engines.
      -->
      <table class="faxpage">
        <thead>
          <tr><th class="faxrun">${ident} &middot; visit ${fmtDate(e.date)}
            &middot; Direct Lifestyle Medicine</th></tr>
        </thead>
        <tbody><tr><td>
      <section class="faxnote">
        <h1>Visit note</h1>
        <p class="faxsub">
          ${esc(p.name)} &middot; ${age(p.dob)} ${p.sex === 'female' ? 'F' : 'M'}
          &middot; born ${fmtDate(p.dob)}
        </p>
        <p class="faxsub">
          ${fmtDate(e.date)} &middot; ${esc(SETTING_LABEL[e.setting ?? 'in-person'])}
          &middot; ${e.signedAt ? `signed ${fmtDate(e.signedAt)}` : 'not signed'}
          &middot; Direct Lifestyle Medicine
        </p>

        ${n?.subjective.oneLiner ? `<p class="faxone">${esc(n.subjective.oneLiner)}</p>` : ''}

        ${sec('Subjective', [
    n?.subjective.reason, n?.subjective.chartReview, n?.subjective.diagnostics,
    n?.subjective.specialists, n?.subjective.additional,
  ].filter(Boolean).join('\n\n'))}

        ${sec('Objective', [n?.objective.vitals, n?.objective.exam]
    .filter(Boolean).join('\n\n'))}

        ${sec('Assessment', n?.assessment.overall)}
        ${sec('Plan', plan)}
        ${sec('Patient instructions', n?.plan.overall)}

        <div class="faxsign">
          <p><b>${esc(input.from)}</b></p>
          <p>Direct Lifestyle Medicine</p>
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
