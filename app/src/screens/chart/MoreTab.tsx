/**
 * Allergies, family, surgical and social history.
 *
 * Asked once and changed rarely, so they are last: a chart review
 * reads them to be sure they were asked, not to find out what
 * happened this week.
 *
 * Every one of them says when it is empty. A blank family history
 * and a family history of nothing are different facts, and a chart
 * that shows them the same way is the chart that lets somebody
 * answer a question they never asked.
 */
import { useStore } from '../../lib/store';
import { Rows, Row, NoRows } from './Rows';

export function MoreTab({ patientId }: { patientId: string }) {
  const st = useStore();
  const allergies = st.allergiesFor(patientId);
  const h = st.patient(patientId)?.history;
  const social = h?.social;

  const socialRows: [string, string | undefined][] = [
    ['Tobacco', social?.tobacco],
    ['Alcohol', social?.alcohol],
    ['Other substances', social?.substances],
    ['Work', social?.work],
    ['Living situation', social?.living],
  ];

  const rows = [
    ...allergies.map((a) => ({
      key: a.id, tag: 'Allergy', warn: a.severity === 'severe',
      name: [a.substance, a.reaction].filter(Boolean).join(' \u2014 '),
    })),
    ...(h?.family ?? []).map((f, i) => ({
      key: `f${i}`, tag: 'Family', warn: false,
      name: [`${f.relation}: ${f.condition}`, f.note].filter(Boolean).join(' \u2014 '),
    })),
    ...(h?.surgical ?? []).map((x, i) => ({
      key: `s${i}`, tag: 'Surgical', warn: false, when: x.year,
      name: [x.name, x.note].filter(Boolean).join(' \u2014 '),
    })),
    ...socialRows.map(([k, v]) => ({
      key: k, tag: 'Social', warn: !v,
      name: `${k}: ${v ?? 'not asked, or asked and not recorded'}`,
    })),
  ];

  return (
    <Rows>
      {allergies.length === 0 && (
        <Row tag="Allergy" warn name="None on file. Not the same as no known allergies." />
      )}
      {!h?.family?.length && (
        <Row tag="Family" warn name="Not asked, or asked and not recorded." />
      )}
      {!h?.surgical?.length && (
        <Row tag="Surgical" warn name="Not asked, or asked and not recorded." />
      )}
      {rows.length === 0 && <NoRows>Nothing on file.</NoRows>}
      {rows.map((r) => (
        <Row key={r.key} when={(r as { when?: string }).when}
          tag={r.tag} warn={r.warn} name={r.name} />
      ))}
      {social?.note && <Row tag="Social" name={social.note} />}
    </Rows>
  );
}
