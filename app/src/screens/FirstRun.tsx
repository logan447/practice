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
          first patient, or load three example patients to look around.
        </div>
      </div>

      <div className="grid g2" style={{ marginTop: 26 }}>
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
            <h2 style={{ fontSize: 17 }}>Load examples</h2>
            <p className="small muted" style={{ margin: '8px 0 16px' }}>
              Three fictional patients with a year of history, results,
              care plans and open work. Or the same three inside a full
              panel of 140, to see physician time roll up. Nothing real.
              You can clear them at any time.
            </p>
            <div className="row wrap" style={{ gap: 8 }}>
              <button className="btn ghost" onClick={() => { st.loadDemo(); nav.reset({ name: 'patients' }); }}>
                Load 3 examples
              </button>
              <button className="btn ghost" onClick={() => { st.loadPanel(); nav.reset({ name: 'patients' }); }}>
                Load a full panel
              </button>
            </div>
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
