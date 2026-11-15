/**
 * What the assistant thinks the summary should now say.
 *
 * Nothing here is in the record. Each proposal shows the text, what
 * it was built from, and whether it is something the chart documents
 * or something the assistant read into it. Accepting is an edit you
 * make, signed with your name and dated; rejecting leaves no trace in
 * the summary at all.
 *
 * The interpretations are marked rather than hidden because they are
 * often the useful ones. The point is not to keep them out, it is to
 * make sure nobody mistakes one for a finding later.
 */
import { useState } from 'react';
import { useStore } from '../../lib/store';
import { Chip } from '../../components/ui';
import { relative } from '../../lib/format';
import type { SummaryProposal } from '../../domain/types';

export function Proposals({ patientId, onDone }: { patientId: string; onDone: () => void }) {
  const st = useStore();
  const pending = st.proposalsFor(patientId);

  if (pending.length === 0) {
    return (
      <div className="stack">
        <p className="small muted">
          Nothing proposed. Everything in the record up to {relative(st.now)} is already
          reflected in the summary, or has been reviewed and declined.
        </p>
        <button className="btn ghost" onClick={onDone}>Close</button>
      </div>
    );
  }

  const docs = pending.filter((p) => p.kind === 'documented');
  const interp = pending.filter((p) => p.kind === 'interpretation');

  return (
    <div className="stack">
      <p className="small muted" style={{ maxWidth: '68ch' }}>
        {pending.length} proposed change{pending.length > 1 ? 's' : ''}. None of this is in
        the record. Accept what is right, edit what is close, and decline the rest.
      </p>

      {docs.length > 0 && <div className="soaplabel">From the record</div>}
      {docs.map((p) => <ProposalCard key={p.id} p={p} />)}

      {interp.length > 0 && (
        <>
          <div className="soaplabel" style={{ marginTop: 14 }}>Read into the record</div>
          <p className="small muted" style={{ margin: '0 0 8px', maxWidth: '68ch' }}>
            These are the assistant's reading, not findings. If you accept one it becomes
            your assessment, in your name.
          </p>
        </>
      )}
      {interp.map((p) => <ProposalCard key={p.id} p={p} />)}

      <div className="row" style={{ marginTop: 10 }}>
        <button className="btn ghost sm" onClick={() => { st.clearProposals(patientId); onDone(); }}>
          Decline all and close
        </button>
      </div>
    </div>
  );
}

function ProposalCard({ p }: { p: SummaryProposal }) {
  const st = useStore();
  const [text, setText] = useState(p.text);
  const [editing, setEditing] = useState(false);
  const edited = text.trim() !== p.text.trim();

  return (
    <div className={`proposal ${p.kind}`}>
      <div className="row" style={{ gap: 8, marginBottom: 7 }}>
        <Chip tone={p.kind === 'interpretation' ? 'warn' : undefined}>
          {p.kind === 'interpretation' ? 'Interpretation' : 'Documented'}
        </Chip>
        <strong style={{ fontSize: 13.5 }}>{p.targetLabel}</strong>
      </div>

      {editing ? (
        <textarea className="note" rows={4} value={text} onChange={(e) => setText(e.target.value)} />
      ) : (
        <p className="ptext">{text}</p>
      )}

      <details className="pbasis">
        <summary>Built from {p.basis.length} thing{p.basis.length > 1 ? 's' : ''}</summary>
        <ul>{p.basis.map((b) => <li key={b}>{b}</li>)}</ul>
      </details>

      <div className="row" style={{ gap: 7, marginTop: 9 }}>
        <button className="btn sm" onClick={() => st.decideProposal(p.id, true, edited ? text : undefined)}>
          {edited ? 'Accept as edited' : 'Accept'}
        </button>
        <button className="btn ghost sm" onClick={() => setEditing((v) => !v)}>
          {editing ? 'Done editing' : 'Edit'}
        </button>
        <button className="btn quiet sm" onClick={() => st.decideProposal(p.id, false)}>Decline</button>
      </div>
    </div>
  );
}
