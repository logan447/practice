/**
 * Looking at a document before it leaves.
 *
 * Print and download both work, because a document that can only be
 * read on screen has not left the building. The preview is the
 * document, in a monospaced block, not a styled approximation of it:
 * what is on screen is what prints and what downloads.
 */
import { useEffect } from 'react';
import { Chip } from './ui';
import { audienceLabel, type Doc } from '../lib/documents';

export function download(doc: Doc): void {
  const blob = new Blob([doc.body], { type: doc.mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = doc.filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function DocView({ doc, onClose }: { doc: Doc; onClose: () => void }) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);

  return (
    <div className="docwrap" role="dialog" aria-label={doc.title}>
      <div className="dochead">
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="row" style={{ gap: 8 }}>
            <strong style={{ fontSize: 15 }}>{doc.title}</strong>
            <Chip>{audienceLabel(doc.audience)}</Chip>
          </div>
          <p className="small muted" style={{ margin: '5px 0 0', maxWidth: '72ch' }}>{doc.note}</p>
        </div>
        <div className="row" style={{ gap: 7 }}>
          <button className="btn ghost sm" onClick={() => window.print()}>Print</button>
          <button className="btn sm" onClick={() => download(doc)}>Download</button>
          <button className="btn quiet sm" onClick={onClose}>Close</button>
        </div>
      </div>
      <pre className="docbody">{doc.body}</pre>
      <div className="small muted" style={{ marginTop: 9 }}>
        Saves as <code>{doc.filename}</code>
      </div>
    </div>
  );
}
