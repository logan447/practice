/**
 * The AI surface.
 *
 * Three rules, enforced here rather than left to discipline:
 *   1. It never looks like the clinical record. Different colour, its
 *      own border, its own label.
 *   2. It always shows what it read. Citations are not collapsible.
 *   3. Nothing it produces enters the record without a physician action.
 *
 * The third rule is also why the FDA non-device CDS carve-out is likely
 * to hold: the clinician can see the basis rather than relying on the
 * output (docs/systems/emr-build-assessment.md §4).
 */
import type { ReactNode } from 'react';
import type { AiDraft } from '../domain/types';

/** Minimal inline formatting: **bold** and paragraph breaks. */
function render(body: string): ReactNode[] {
  return body.split('\n\n').map((para, i) => (
    <p key={i}>
      {para.split(/(\*\*[^*]+\*\*)/g).map((piece, j) =>
        piece.startsWith('**') && piece.endsWith('**')
          ? <strong key={j}>{piece.slice(2, -2)}</strong>
          : <span key={j}>{piece}</span>)}
    </p>
  ));
}

export function AiPanel({
  draft, onAccept, onAsk, compact,
}: { draft: AiDraft; onAccept?: () => void; onAsk?: () => void; compact?: boolean }) {
  return (
    <section className="ai-panel">
      <header>
        <AiMark />
        <h3>{draft.title}</h3>
        {draft.accepted && (
          <span className="chip ok" style={{ marginLeft: 'auto' }}>In the note</span>
        )}
      </header>

      <div className="body">{render(draft.body)}</div>

      <div className="cites">
        <b>Built from:</b>{' '}
        {draft.citations.join(' · ')}
      </div>

      {!compact && (onAccept || onAsk) && (
        <div className="acts">
          {onAccept && (
            <button className="btn sm" onClick={onAccept} disabled={draft.accepted}>
              {draft.accepted ? 'Added to the note' : 'Add to the note'}
            </button>
          )}
          {onAsk && <button className="btn ghost sm" onClick={onAsk}>Ask a follow-up</button>}
        </div>
      )}
    </section>
  );
}

/** The mark that says "a model wrote this". Used anywhere AI output appears. */
export function AiMark({ label = 'Draft, not in the record' }: { label?: string }) {
  return (
    <span className="chip ai" title={label}>
      <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M8 1.5l1.6 4.3 4.4 1.7-4.4 1.7L8 13.5l-1.6-4.3L2 7.5l4.4-1.7z"
          fill="currentColor" />
      </svg>
      AI
    </span>
  );
}
