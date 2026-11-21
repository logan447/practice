/**
 * The chart review, walked rather than remembered.
 *
 * Eleven sections in the order the chart is laid out, one at a time,
 * with the section's real content on screen and a box for whatever
 * you think while looking at it. At the end it has recorded two
 * things: that each section was opened, and what you said about it.
 * Both go into the visit note, which is the only reason to record
 * either.
 *
 * It reuses the chart's own tab components. A walkthrough that showed
 * a summary of each section rather than the section would be a third
 * rendering of the same record, and the third rendering is the one
 * that drifts.
 */
import { useEffect, useRef, useState } from 'react';
import { useStore } from '../../lib/store';
import { useNav } from '../../lib/nav';
import { REVIEW, dictated, type Ctx } from '../../lib/prechart';
import { TAB_LABEL } from './drawers';
import { fmtDate } from '../../lib/format';
import { LIFESTYLE_DOMAINS } from '../../domain/types';

import { NotesTab } from './NotesTab';
import { SubjectiveTab } from './SubjectiveTab';
import { VitalsTab } from './VitalsTab';
import { ProblemsTab } from './ProblemsTab';
import { LifestyleTab } from './LifestyleTab';
import { PreventionTab } from './PreventionTab';
import { MedsTab } from './MedsTab';
import { LabsTab } from './LabsTab';
import { ImagingTab } from './ImagingTab';
import { SpecialistsTab } from './SpecialistsTab';
import { MoreTab } from './MoreTab';

const BODY: Record<string, (p: { patientId: string }) => JSX.Element> = {
  notes: NotesTab,
  subjective: SubjectiveTab,
  vitals: VitalsTab,
  problems: ProblemsTab,
  lifestyle: LifestyleTab,
  prevention: PreventionTab,
  meds: MedsTab,
  results: LabsTab,
  studies: ImagingTab,
  specialists: SpecialistsTab,
  more: MoreTab,
};

export function ChartReview({ patientId, onClose }: {
  patientId: string; onClose: () => void;
}) {
  const st = useStore();
  const nav = useNav();
  const p = st.patient(patientId);
  const [i, setI] = useState(0);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [seen, setSeen] = useState<string[]>([REVIEW[0].id]);
  const [speaking, setSpeaking] = useState(false);
  const [done, setDone] = useState(false);
  const timer = useRef<number | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const section = REVIEW[i];
  const Body = BODY[section.id];

  // ------------------------------------------------- what to dictate about
  const conditions = st.conditionsFor(patientId).filter((c) => c.status === 'active');
  const prevention = st.preventionFor(patientId);
  const due = prevention.filter((x) => x.status === 'due' || x.status === 'overdue');
  const lifestyle = st.lifestyleFor(patientId);
  const reports = st.reportsFor(patientId);
  const specialists = st.specialistsFor(patientId);
  const meds = st.medsFor(patientId);
  const encounters = st.encountersFor(patientId).filter((e) => e.status === 'signed');
  const h = p?.history;

  const ctx: Ctx = {
    firstName: p?.preferredName ?? p?.name.split(' ')[0] ?? 'They',
    problems: conditions.filter((c) => c.managed)
      .map((c) => ({ name: c.name, controlled: c.goal === 'at-goal' })),
    dueCount: due.length,
    dueNames: due.map((x) => x.name),
    struggling: lifestyle.filter((l) => l.status === 'struggling' || l.status === 'not-started')
      .map((l) => LIFESTYLE_DOMAINS.find((d) => d.id === l.domain)?.label ?? l.domain),
    unreviewed: reports.filter((r) => !r.acknowledged).length,
    outstanding: specialists
      .filter((sp) => sp.outstanding && !/^(none|nothing|n\/a|no)\b/i.test(sp.outstanding.trim()))
      .map((sp) => sp.name),
    heldMeds: meds.filter((m) => m.status === 'held').map((m) => `${m.name} ${m.dose}`),
    lastVisit: encounters[0] ? fmtDate(encounters[0].date) : undefined,
    newRecords: st.newSince(patientId).count,
    historyGaps: [
      !h?.family?.length ? 'Family history' : '',
      !h?.surgical?.length ? 'Surgical history' : '',
      !h?.social ? 'Social history' : '',
    ].filter(Boolean),
  };

  const speak = () => {
    setSpeaking(true);
    const text = dictated(section.id, ctx);
    let n = 0;
    const step = () => {
      n += Math.max(2, Math.round(text.length / 26));
      setNotes((v) => ({ ...v, [section.id]: text.slice(0, n) }));
      if (n < text.length) timer.current = window.setTimeout(step, 55);
      else setSpeaking(false);
    };
    step();
  };

  const go = (to: number) => {
    if (timer.current) clearTimeout(timer.current);
    setSpeaking(false);
    const next = Math.max(0, Math.min(REVIEW.length - 1, to));
    setI(next);
    setSeen((v) => (v.includes(REVIEW[next].id) ? v : [...v, REVIEW[next].id]));
  };

  const finish = () => {
    st.savePreChart(patientId, notes, seen);
    setDone(true);
  };

  if (!p) return null;

  if (done) {
    const said = REVIEW.filter((s) => (notes[s.id] ?? '').trim());
    return (
      <div className="walkback">
        <div className="walkdone">
          <h2>Chart review saved</h2>
          <p className="sub">
            {seen.length} of {REVIEW.length} sections opened, {said.length} with a note.
            It goes into the next visit note and is not a record of its own.
          </p>
          <div className="walkrecap">
            {REVIEW.map((s) => (
              <div key={s.id} className={`wrline${seen.includes(s.id) ? ' on' : ''}`}>
                <span className="wrname">{TAB_LABEL[s.id]}</span>
                <span className="wrsaid">
                  {(notes[s.id] ?? '').trim()
                    || (seen.includes(s.id) ? 'Reviewed, nothing to add' : 'Not opened')}
                </span>
              </div>
            ))}
          </div>
          <div className="row" style={{ gap: 8, marginTop: 20 }}>
            <button className="btn" onClick={() => {
              const id = st.openEncounter(patientId, 'visit');
              nav.go({ name: 'encounter', encounterId: id });
            }}>Start the visit</button>
            <button className="btn ghost" onClick={onClose}>Back to the chart</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="walkback">
      <div className="walk">
        <header className="walkhead">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="eyebrow">
              Chart review &middot; {p.name} &middot; {i + 1} of {REVIEW.length}
            </div>
            <h2>{TAB_LABEL[section.id]}</h2>
            <p className="walkask">{section.asks}</p>
          </div>
          <button className="sheetx" onClick={onClose} aria-label="Close">&times;</button>
        </header>

        <div className="walkbar">
          {REVIEW.map((s, n) => (
            <button key={s.id}
              className={`wstep${n === i ? ' on' : ''}${seen.includes(s.id) ? ' seen' : ''}`}
              title={TAB_LABEL[s.id]} onClick={() => go(n)} />
          ))}
        </div>

        <div className="walkbody">
          <Body patientId={patientId} />
        </div>

        <footer className="walkfoot">
          <textarea className="prose walksay" rows={2}
            placeholder={`What you make of the ${TAB_LABEL[section.id].toLowerCase()}. It goes into the note.`}
            value={notes[section.id] ?? ''}
            onChange={(e) => setNotes((v) => ({ ...v, [section.id]: e.target.value }))} />
          <div className="walkacts">
            <button className={`btn ghost${speaking ? ' listening' : ''}`}
              onClick={speaking ? () => {
                if (timer.current) clearTimeout(timer.current);
                setSpeaking(false);
              } : speak}>
              {speaking ? <><span className="pulse" /> Stop</> : 'Dictate'}
            </button>
            <span className="spacer" />
            <button className="btn quiet" disabled={i === 0} onClick={() => go(i - 1)}>Back</button>
            {i === REVIEW.length - 1 ? (
              <button className="btn" onClick={finish}>Finish</button>
            ) : (
              <button className="btn" onClick={() => go(i + 1)}>Next</button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
