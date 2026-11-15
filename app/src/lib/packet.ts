/**
 * The whole record, as one thing you can hand to another doctor.
 *
 * A cover page carrying the current summary in SOAP order, then every
 * signed note in date order, then the specialist letters, then the
 * labs as they were resulted, then imaging and procedures, then
 * anything that arrived as a file nobody could parse. One packet,
 * dated, produced on demand.
 *
 * The ordering is the argument. A summary alone asks the receiving
 * clinician to trust us. The attachments alone ask them to read two
 * years of notes. Together, the summary says where the patient is and
 * everything underneath it is the evidence, in a form they can check.
 *
 * It renders to HTML and prints. Print to PDF is a real PDF, and it
 * is the one route that works from a browser without shipping a
 * typesetting engine into a prototype. The machine-readable companion
 * is the FHIR bundle in documents.ts.
 */
import type {
  Allergy, CarePlan, ChartDocument, Condition, DiagnosticStudy, Encounter,
  ExamRecord, LabPanel, MasterPlan, Medication, Patient, PreventionItem,
  Specialist, VitalsSet,
} from '../domain/types';
import { fmtDate } from './format';
import type { LivingSubjective } from './subjective';
import { kindLabel } from './clinical';
import { age } from './format';

export interface PacketInput {
  patient: Patient;
  master?: MasterPlan;
  conditions: Condition[];
  medications: Medication[];
  allergies: Allergy[];
  encounters: Encounter[];
  exams: ExamRecord[];
  vitals: VitalsSet[];
  panels: LabPanel[];
  studies: DiagnosticStudy[];
  specialists: Specialist[];
  prevention: PreventionItem[];
  documents: ChartDocument[];
  plan?: CarePlan;
  /** The subjective as derived, so the packet cannot disagree with the chart. */
  subjective: LivingSubjective;
  today: string;
}

const esc = (s: string): string => s
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const para = (s?: string): string =>
  (s?.trim()
    ? s.trim().split(/\n{2,}/).map((p) => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('')
    : '<p class="none">Not recorded.</p>');

export interface PacketSection {
  id: string;
  title: string;
  /** Shown in the contents list. */
  count?: number;
  html: string;
}

export function buildPacket(input: PacketInput): {
  title: string;
  sections: PacketSection[];
  html: string;
} {
  const {
    patient: p, master, conditions, medications, allergies, encounters, exams,
    vitals, panels, studies, specialists, prevention, documents, plan, today,
  } = input;

  const signed = [...encounters].filter((e) => e.status === 'signed')
    .sort((a, b) => b.date.localeCompare(a.date));
  const active = conditions.filter((c) => c.status === 'active');
  const managed = active.filter((c) => c.managed);
  const office = vitals.filter((v) => v.source === 'office')
    .sort((a, b) => b.date.localeCompare(a.date));
  const sortedPanels = [...panels].sort((a, b) => b.date.localeCompare(a.date));
  const unparsed = documents.filter((d) => d.status !== 'parsed');

  const sections: PacketSection[] = [];

  // ---------------------------------------------------- 1. the summary
  const sum = `
    <section class="cover">
      <h1>${esc(p.name)}</h1>
      <p class="sub">
        ${age(p.dob)} ${p.sex === 'female' ? 'F' : 'M'} &middot; born ${fmtDate(p.dob)}
        &middot; record produced ${fmtDate(today)}
      </p>
      <p class="sub">Direct Lifestyle Medicine &middot; L. DuBose, MD</p>

      <h3>Past medical history</h3>
      <p>${active.length ? active.map((c) => `${esc(c.name)}${c.code ? ` (${c.code})` : ''}`).join('; ') : 'None recorded.'}</p>

      <h3>Managed by this practice</h3>
      <p>${managed.length ? managed.map((c) => esc(c.name)).join('; ') : 'None.'}</p>

      <h3>Allergies</h3>
      <p>${allergies.length
    ? allergies.map((a) => `${esc(a.substance)}: ${esc(a.reaction ?? 'reaction not recorded')} (${a.severity ?? 'severity unknown'})`).join('; ')
    : 'None recorded. This is not the same as none known.'}</p>

      <h3>Current medicines</h3>
      ${medications.filter((m) => m.status !== 'stopped').length === 0
    ? '<p class="none">None.</p>'
    : `<ul>${medications.filter((m) => m.status !== 'stopped').map((m) =>
      `<li>${esc(m.name)} ${esc(m.dose)}${m.sig ? ` &mdash; ${esc(m.sig)}` : ''}${
        m.indication ? ` <span class="dim">for ${esc(m.indication)}</span>` : ''}</li>`).join('')}</ul>`}
    </section>

    <section>
      <h2>Summary of care, in SOAP order</h2>
      <p class="dim">
        The summary below is derived from the records in this packet, on the
        date it was produced. It describes where this patient is now. The
        signed notes that follow are what happened on each date. If the two
        ever disagree, the notes are the record.
      </p>

      <h3>Subjective</h3>
      ${para(input.subjective.overall.map((c) => c.text).join(' '))}
      ${input.subjective.problems.map((pr) => `
        <h4>${esc(pr.name)}</h4>
        ${para(pr.clauses.map((c) => c.text).join(' '))}
        ${pr.interventions.length > 0
    ? `<ul>${pr.interventions.map((iv) => `<li><b>${esc(iv.label)}:</b> ${esc(iv.status)}${
      iv.note ? ` <i>(${esc(iv.note)})</i>` : ''}</li>`).join('')}</ul>`
    : ''}`).join('')}

      <h3>Objective</h3>
      ${office[0] ? `<p><b>Most recent office vitals, ${fmtDate(office[0].date)}:</b>
        ${[
    office[0].systolic ? `BP ${office[0].systolic}/${office[0].diastolic}` : '',
    office[0].heartRate ? `HR ${office[0].heartRate}` : '',
    office[0].weightLb ? `weight ${office[0].weightLb} lb` : '',
    office[0].bmi ? `BMI ${office[0].bmi}` : '',
  ].filter(Boolean).join(', ')}.</p>` : '<p class="none">No office vitals recorded.</p>'}
      ${sortedPanels[0] ? `<p><b>Most recent labs, ${fmtDate(sortedPanels[0].date)}:</b> ${
    sortedPanels.filter((x) => x.date === sortedPanels[0].date)
      .flatMap((x) => x.values).map((v) =>
        `${esc(v.key)} ${v.value}${v.flag !== 'normal' ? ` (${v.flag})` : ''}`).join(', ')
  }.</p>` : ''}
      ${para(master?.objective.narrative)}

      <h3>Assessment</h3>${para(master?.assessment.narrative)}

      <h3>Plan</h3>
      ${managed.map((c) => `
        <h4>${esc(c.name)}${c.code ? ` <span class="dim">${c.code}</span>` : ''}</h4>
        ${para(master?.plan?.byProblem?.[c.id])}`).join('')}
      <h4>Preventative care</h4>${para(master?.plan.prevention)}
      <h4>Lifestyle medicine</h4>${para(master?.plan.lifestyle)}
      <h4>Follow-up</h4>${para(master?.plan.followUp)}

      ${plan?.signed ? `
        <h3>Goals agreed with the patient</h3>
        <ul>${plan.goals.map((g) =>
    `<li><b>${esc(g.title)}</b> &mdash; ${esc(g.why)} <span class="dim">(${g.status})</span></li>`).join('')}</ul>` : ''}
    </section>`;
  sections.push({ id: 'summary', title: 'Summary of care', html: sum });

  // ------------------------------------------------- 2. the signed notes
  const notesHtml = signed.length === 0
    ? '<p class="none">No signed visits.</p>'
    : signed.map((e) => {
      const ex = exams.find((x) => x.encounterId === e.id);
      const vs = vitals.find((v) => v.encounterId === e.id);
      const n = e.note;
      return `
      <article class="note">
        <h3>${fmtDate(e.date)} &middot; ${esc(kindLabel(e.kind))}</h3>
        <p class="dim">${esc(e.reason)} &middot; ${e.duration ?? ''} min &middot;
          signed ${e.signedAt ? fmtDate(e.signedAt) : 'unsigned'} by L. DuBose, MD</p>
        ${n ? `
          <h4>Subjective</h4>${para([n.subjective.oneLiner, n.subjective.reason, n.subjective.additional].filter(Boolean).join('\n\n'))}
          <h4>Objective</h4>
          ${vs ? `<p>BP ${vs.systolic}/${vs.diastolic}${vs.heartRate ? `, HR ${vs.heartRate}` : ''}${
  vs.weightLb ? `, weight ${vs.weightLb} lb` : ''}${vs.bmi ? `, BMI ${vs.bmi}` : ''}.</p>` : ''}
          ${para([n.objective.vitals, n.objective.homeMeasures].filter(Boolean).join('\n\n'))}
          ${ex ? `<p><b>Examination performed ${fmtDate(ex.date)}:</b></p><ul>${
  ex.findings.map((f) => `<li><b>${esc(f.system)}.</b> ${esc(f.text)}</li>`).join('')}</ul>`
    : (n.objective.exam ? para(n.objective.exam) : '<p class="none">No examination documented on this date.</p>')}
          <h4>Assessment</h4>${para(n.assessment.overall)}
          <h4>Plan</h4>${para([
  ...n.plan.problems.map((pr) => `${pr.problem}. ${[pr.assessment, pr.treatment, pr.orders, pr.followUp].filter(Boolean).join(' ')}`),
  n.plan.overall,
].filter(Boolean).join('\n\n'))}
        ` : '<p class="none">No note recorded for this encounter.</p>'}
      </article>`;
    }).join('');
  sections.push({
    id: 'notes', title: 'Signed visit notes', count: signed.length,
    html: `<section><h2>Signed visit notes</h2>
      <p class="dim">In reverse date order, exactly as signed. Not edited by the summary.</p>
      ${notesHtml}</section>`,
  });

  // --------------------------------------------------- 3. specialists
  sections.push({
    id: 'specialists', title: 'Specialist consultations', count: specialists.length,
    html: `<section><h2>Specialist consultations</h2>
      ${specialists.length === 0 ? '<p class="none">None recorded.</p>'
    : specialists.map((sp) => `
        <article class="note">
          <h3>${esc(sp.name)} &middot; ${esc(sp.specialty)}</h3>
          <p class="dim">${esc(sp.practice ?? '')}${sp.lastSeen ? ` &middot; last seen ${fmtDate(sp.lastSeen)}` : ''}</p>
          ${sp.findings ? `<h4>Findings</h4>${para(sp.findings)}` : ''}
          ${sp.recommendations ? `<h4>Recommendations</h4>${para(sp.recommendations)}` : ''}
          ${sp.outstanding ? `<h4>Outstanding</h4>${para(sp.outstanding)}` : ''}
        </article>`).join('')}</section>`,
  });

  // --------------------------------------------------------- 4. labs
  sections.push({
    id: 'labs', title: 'Laboratory results', count: sortedPanels.length,
    html: `<section><h2>Laboratory results</h2>
      <p class="dim">Every panel as it was resulted, newest first. Values outside the
      reference range are marked.</p>
      ${sortedPanels.length === 0 ? '<p class="none">None on file.</p>'
    : sortedPanels.map((pl) => `
        <article class="panel">
          <h3>${esc(pl.name)} &middot; ${fmtDate(pl.date)}${pl.from ? ` <span class="dim">${esc(pl.from)}</span>` : ''}</h3>
          <table><tbody>${pl.values.map((v) => `
            <tr>
              <td>${esc(v.name)}</td>
              <td class="num${v.flag !== 'normal' ? ' flag' : ''}">${v.value} ${esc(v.unit)}</td>
              <td class="dim">${v.refLow !== undefined || v.refHigh !== undefined
    ? `${v.refLow ?? ''}${v.refLow !== undefined && v.refHigh !== undefined ? ' to ' : ''}${v.refHigh ?? ''}`
    : 'no range supplied'}</td>
              <td class="dim">${v.flag !== 'normal' ? v.flag : ''}</td>
            </tr>`).join('')}</tbody></table>
        </article>`).join('')}</section>`,
  });

  // ------------------------------------------- 5. imaging and procedures
  sections.push({
    id: 'studies', title: 'Imaging and procedures', count: studies.length,
    html: `<section><h2>Imaging, procedures and other diagnostics</h2>
      ${studies.length === 0 ? '<p class="none">None on file.</p>'
    : [...studies].sort((a, b) => b.date.localeCompare(a.date)).map((d) => `
        <article class="note">
          <h3>${esc(d.name)} &middot; ${fmtDate(d.date)}</h3>
          <p class="dim">${esc(d.from ?? 'source not recorded')} &middot; ${d.kind}</p>
          ${para(d.impression)}
        </article>`).join('')}</section>`,
  });

  // -------------------------------------------------- 6. prevention
  sections.push({
    id: 'prevention', title: 'Preventative care', count: prevention.length,
    html: `<section><h2>Preventative care</h2>
      ${prevention.length === 0 ? '<p class="none">None recorded.</p>'
    : `<table><tbody>${prevention.map((x) => `
        <tr>
          <td>${esc(x.name)}</td>
          <td>${x.status}</td>
          <td class="dim">${x.lastDone ? `last ${fmtDate(x.lastDone)}` : 'never recorded'}</td>
          <td class="dim">${x.dueBy ? `due ${fmtDate(x.dueBy)}` : ''}</td>
        </tr>`).join('')}</tbody></table>`}</section>`,
  });

  // ----------------------------------------------- 7. uploaded files
  sections.push({
    id: 'uploads', title: 'Documents received', count: documents.length,
    html: `<section><h2>Documents received from elsewhere</h2>
      <p class="dim">Everything sent to this practice about this patient. The ones
      marked as not read are files whose contents never reached the record, which
      is a fact about the record and not about the patient.</p>
      ${documents.length === 0 ? '<p class="none">None received.</p>'
    : documents.map((d) => `
        <article class="note">
          <h3>${esc(d.title)} &middot; ${fmtDate(d.date)}</h3>
          <p class="dim">${esc(d.from)} &middot; ${d.kind} &middot; ${
  d.status === 'parsed' ? 'read into the record'
    : d.status === 'scanned' ? 'images only, text never extracted'
      : 'could not be read'}</p>
          ${d.status === 'parsed' && d.text ? para(d.text)
    : `<p class="none">The file is attached to this record. Its contents are not in
       the text above and were never searchable.</p>`}
        </article>`).join('')}
      ${unparsed.length > 0
    ? `<p class="dim">${unparsed.length} of these could not be read into the record.</p>`
    : ''}</section>`,
  });

  const contents = `
    <section class="contents">
      <h2>What is in this packet</h2>
      <ol>${sections.map((sc) =>
    `<li>${esc(sc.title)}${sc.count !== undefined ? ` <span class="dim">(${sc.count})</span>` : ''}</li>`).join('')}</ol>
      <p class="dim">
        Produced ${fmtDate(today)} for ${esc(p.name)} by Direct Lifestyle Medicine.
        This is the complete record this practice holds. If anything in it is wrong,
        tell us and we will correct it and write back to say what we changed.
      </p>
    </section>`;

  return {
    title: `${p.name} — complete record, ${fmtDate(today)}`,
    sections,
    html: sections[0].html + contents + sections.slice(1).map((sc) => sc.html).join(''),
  };
}
