/**
 * The first screen of a practice with no patients in it.
 *
 * Most clinical software treats day one as an error state. For a solo
 * practice opening its doors it is the normal state, and it lasts a
 * while: the panel grows one person at a time. So this screen does two
 * things only — start a real patient, or load examples to look around
 * with — and says plainly which is which.
 */
import { useStore } from '../lib/store';
import { useNav } from '../lib/nav';

export function FirstRun() {
  const st = useStore();
  const nav = useNav();

  return (
    <div className="wrap" style={{ maxWidth: 760 }}>
      <div className="page-head" style={{ marginTop: 40 }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>Direct Lifestyle Medicine</div>
        <h1 style={{ fontSize: 30 }}>No patients yet.</h1>
        <div className="sub" style={{ fontSize: 15, maxWidth: '52ch' }}>
          This record is empty, which is where a practice starts. Add your
          first patient, or load example data to look around.
        </div>
      </div>

      <div className="grid g3" style={{ marginTop: 26 }}>
        <section className="panel">
          <div className="body">
            <h2 style={{ fontSize: 17 }}>Add your first patient</h2>
            <p className="small muted" style={{ margin: '8px 0 16px' }}>
              Name, date of birth and how to reach them is enough to start.
              Everything else is built at the first visit.
            </p>
            <button className="btn" onClick={() => nav.go({ name: 'new-patient' })}>
              New patient
            </button>
          </div>
        </section>

        <section className="panel">
          <div className="body">
            <h2 style={{ fontSize: 17 }}>Load a worked day</h2>
            <p className="small muted" style={{ margin: '8px 0 16px' }}>
              Five charts in different states, and a Monday booked across them:
              five visits, and a weekend of messages and
              readings waiting in the inbox. Sharon White is complete, Marcus
              Reyes is half written, Nina Alvarado joined last week with nothing
              on file. All fictional, and you can clear them at any time.
            </p>
            <button className="btn ghost" onClick={() => { st.loadDemo(); nav.reset({ name: 'schedule' }); }}>
              Load the day
            </button>
          </div>
        </section>

        <section className="panel">
          <div className="body">
            <h2 style={{ fontSize: 17 }}>Load a full panel</h2>
            <p className="small muted" style={{ margin: '8px 0 16px' }}>
              About 120 fictional adults with years of history, and the mess a
              real panel carries: the same drug listed twice, allergies two
              sources disagree about, outside records that would not read.
            </p>
            <button className="btn ghost" onClick={() => { st.loadPanel(); nav.reset({ name: 'patients' }); }}>
              Load 120 patients
            </button>
          </div>
        </section>
      </div>

      <p className="small muted" style={{ marginTop: 28 }}>
        Everything you enter stays in this browser. Nothing is sent anywhere,
        and this prototype holds no real patient information.
      </p>
    </div>
  );
}
