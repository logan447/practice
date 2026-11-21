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
import { Group, Row, NoRows } from './Rows';

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
  const asked = socialRows.filter(([, v]) => v);

  return (
    <>
      <Group title="Allergies" count={allergies.length}>
        {allergies.length === 0 ? (
          <NoRows>None on file. Not the same as no known allergies.</NoRows>
        ) : allergies.map((a) => (
          <Row key={a.id} name={a.substance}
            note={a.severity === 'severe' ? 'Severe' : a.reaction}
            warn={a.severity === 'severe'} />
        ))}
      </Group>

      <Group title="Family history" count={h?.family?.length ?? 0}>
        {!h?.family || h.family.length === 0 ? (
          <NoRows>Not asked, or asked and not recorded.</NoRows>
        ) : h.family.map((f, i) => (
          <Row key={i} name={`${f.relation}: ${f.condition}`} note={f.note} />
        ))}
      </Group>

      <Group title="Surgical history" count={h?.surgical?.length ?? 0}>
        {!h?.surgical || h.surgical.length === 0 ? (
          <NoRows>Not asked, or asked and not recorded.</NoRows>
        ) : h.surgical.map((x, i) => (
          <Row key={i} name={x.name} note={x.note} when={x.year} />
        ))}
      </Group>

      <Group title="Social history" count={asked.length}>
        {asked.length === 0 ? (
          <NoRows>Not asked, or asked and not recorded.</NoRows>
        ) : (
          <>
            {socialRows.map(([k, v]) => (
              <Row key={k} name={k} note={v ?? 'Not asked'} warn={!v} />
            ))}
            {social?.note && <p className="grpnote" style={{ marginTop: 10 }}>{social.note}</p>}
          </>
        )}
      </Group>
    </>
  );
}
