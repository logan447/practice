/**
 * Add-a-thing, inline.
 *
 * A modal for adding one row is three interactions where one will do,
 * and it hides the list you are adding to. This opens in place, keeps
 * the context visible, and closes on save or escape.
 */
import { useEffect, useRef, type ReactNode } from 'react';

export function InlineAdd({
  label, children, onSave, canSave, open, setOpen,
}: {
  label: string;
  children: ReactNode;
  onSave: () => void;
  canSave: boolean;
  open: boolean;
  setOpen: (v: boolean) => void;
}) {
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    box.current?.querySelector('input,textarea,select')?.dispatchEvent(new Event('focus'));
    const el = box.current?.querySelector<HTMLInputElement>('input,textarea,select');
    el?.focus();
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [open, setOpen]);

  if (!open) {
    return (
      <button className="btn ghost sm" onClick={() => setOpen(true)}>+ {label}</button>
    );
  }

  return (
    <div ref={box} style={{
      border: '1px solid var(--accent-line)', borderRadius: 'var(--r)',
      background: 'var(--panel-2)', padding: 13, marginTop: 10,
    }}>
      <div className="stack-sm">{children}</div>
      <div className="row" style={{ marginTop: 12 }}>
        <button className="btn sm" disabled={!canSave}
          onClick={() => { onSave(); setOpen(false); }}>Save</button>
        <button className="btn ghost sm" onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </div>
  );
}

export function Field({
  label, value, onChange, placeholder, textarea,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; textarea?: boolean;
}) {
  return (
    <label style={{ display: 'block' }}>
      <div className="eyebrow" style={{ marginBottom: 4 }}>{label}</div>
      {textarea
        ? <textarea className="note" style={{ minHeight: 60 }} value={value}
          placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
        : <input className="search" value={value} placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)} />}
    </label>
  );
}
