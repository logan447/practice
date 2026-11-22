/**
 * Vitals, clinic and home kept apart.
 *
 * They are a tab of their own because a chart review reads them as
 * one thing: the numbers, in order, with where each was taken. A
 * clinic reading and a home reading are different measurements and
 * the chart never averages them or lets a reader mistake one for the
 * other.
 */
import { useStore } from '../../lib/store';
import { fmtDate } from '../../lib/format';
import { Rows, Row, NoRows } from './Rows';

const line = (v: {
  systolic?: number; diastolic?: number; heartRate?: number;
  weightLb?: number; bmi?: number;
}) => [
  v.systolic ? `${v.systolic}/${v.diastolic}` : '',
  v.heartRate ? `HR ${v.heartRate}` : '',
  v.weightLb ? `${v.weightLb} lb` : '',
  v.bmi ? `BMI ${v.bmi}` : '',
].filter(Boolean).join(' · ');

export function VitalsTab({ patientId }: { patientId: string }) {
  const st = useStore();
  const vitals = st.vitalsFor(patientId);

  const all = [...vitals].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <Rows>
      {all.length === 0 ? <NoRows>None recorded.</NoRows> : all.map((v) => (
        <Row key={v.id} when={fmtDate(v.date)}
          tag={v.source === 'home' ? 'At home' : 'In clinic'}
          name={line(v) || 'Recorded, no values'} />
      ))}
    </Rows>
  );
}
