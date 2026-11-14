/**
 * Picking a coded thing.
 *
 * Type-ahead over a real code system, with the code visible. Two rules
 * shape it:
 *
 * It must be faster than typing free text, or nobody codes anything.
 * So it is keyboard-first, matches on brand names as well as generic
 * ones, and the first result is already selected.
 *
 * It must allow free text anyway. A picker that refuses what is in
 * front of you turns into a picker people route around, and a problem
 * list with the wrong code on it is worse than one with none. So "use
 * what I typed" is always available, and what it produces is marked
 * uncoded rather than quietly coded to the nearest thing.
 */
import { useEffect, useRef, useState } from 'react';

export interface PickerRow {
  id: string;
  primary: string;
  /** The code, shown in a monospace slot so it reads as an identifier. */
  code: string;
  /** Brand names, classes, anything that explains why this matched. */
  note?: string;
}

export function CodePicker({
  label, placeholder, hint, value, onText, search, onPick, allowFreeText = true, autoFocus,
}: {
  label: string;
  placeholder?: string;
  hint?: string;
  value: string;
  onText: (v: string) => void;
  search: (q: string) => PickerRow[];
  onPick: (row: PickerRow) => void;
  allowFreeText?: boolean;
  autoFocus?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState(0);
  const box = useRef<HTMLDivElement>(null);

  const rows = open ? search(value) : [];

  useEffect(() => { setSel(0); }, [value]);

  useEffect(() => {
    const away = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', away);
    return () => document.removeEventListener('mousedown', away);
  }, []);

  const take = (r: PickerRow) => { onPick(r); setOpen(false); };

  return (
    <div ref={box} style={{ position: 'relative' }}>
      <div className="eyebrow" style={{ marginBottom: 5 }}>{label}</div>
      <input
        className="search" value={value} placeholder={placeholder} autoFocus={autoFocus}
        onChange={(e) => { onText(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (!open || rows.length === 0) return;
          if (e.key === 'ArrowDown') { e.preventDefault(); setSel((i) => Math.min(i + 1, rows.length - 1)); }
          if (e.key === 'ArrowUp') { e.preventDefault(); setSel((i) => Math.max(i - 1, 0)); }
          if (e.key === 'Enter') { e.preventDefault(); take(rows[sel]); }
          if (e.key === 'Escape') { setOpen(false); }
        }}
      />
      {hint && !open && <div className="small muted" style={{ marginTop: 4 }}>{hint}</div>}

      {open && value.trim().length >= 2 && (
        <div className="picker">
          {rows.map((r, i) => (
            <button key={r.id} className={`prow${i === sel ? ' on' : ''}`}
              onMouseEnter={() => setSel(i)} onClick={() => take(r)}>
              <span className="pcode">{r.code}</span>
              <span className="pmain">
                {r.primary}
                {r.note && <span className="pnote">{r.note}</span>}
              </span>
            </button>
          ))}
          {rows.length === 0 && (
            <div className="prow none">Nothing in the loaded subset matches.</div>
          )}
          {allowFreeText && (
            <button className="prow free" onClick={() => setOpen(false)}>
              <span className="pcode">—</span>
              <span className="pmain">
                Use &ldquo;{value.trim()}&rdquo; as typed
                <span className="pnote">Saved without a code, so nothing can check against it</span>
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
