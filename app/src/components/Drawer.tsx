/**
 * Secondary information, out of the way until it is wanted.
 *
 * The chart used to carry eight tabs across the top, which meant the
 * first thing it said about a patient was "here are eight places to
 * look". Everything that was in those tabs is still here; it is
 * behind a panel that slides in from the right and does not change
 * the page under it, so the care plan is never lost to go and check
 * a medicine.
 */
import { useEffect, type ReactNode } from 'react';

export function Drawer({ open, title, sub, onClose, children, wide }: {
  open: boolean;
  title: string;
  sub?: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', esc);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', esc);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="drawerwrap" role="dialog" aria-label={title}>
      <button className="drawerveil" aria-label="Close" onClick={onClose} />
      <aside className={`drawer${wide ? ' wide' : ''}`}>
        <header>
          <div style={{ minWidth: 0 }}>
            <h2>{title}</h2>
            {sub && <p className="small muted">{sub}</p>}
          </div>
          <button className="btn quiet sm" onClick={onClose}>Close</button>
        </header>
        <div className="drawerbody">{children}</div>
      </aside>
    </div>
  );
}
