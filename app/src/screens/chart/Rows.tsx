/**
 * One row, one group, one sheet. The whole chart is built from these.
 *
 * Every tab in the chart is a list of records, and a record is a
 * thing with a name and a date that you can open. Once that is true
 * of all of them, a physician learns the chart once instead of
 * learning seven tabs. So there is exactly one row component here and
 * every tab uses it, even where its records are nothing alike.
 *
 * A row is one line. No second line of preview text, no coloured pill
 * saying what kind of thing it is. The kind is the tab you are
 * standing in, and a preview of a record you can open in one click is
 * a paragraph of noise multiplied by the length of the list.
 *
 * The right-hand `note` is for a word the eye needs before opening:
 * "Not yet reviewed", "Overdue", "Held". It is plain text, not a
 * badge, because a page of badges is a page where nothing stands out.
 */
import { useEffect } from 'react';

export function Group({ title, note, count, children }: {
  title: string;
  /** One line under the heading, where the group needs a caveat. */
  note?: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <section className="grp">
      <div className="grphead">
        <h3>{title}</h3>
        {count !== undefined && <span className="grpcount">{count}</span>}
      </div>
      {note && <p className="grpnote">{note}</p>}
      <div className="grprows">{children}</div>
    </section>
  );
}

export function Row({ name, when, note, warn, onOpen }: {
  name: string;
  when?: string;
  note?: string;
  /** The note is the kind you should not read past. */
  warn?: boolean;
  onOpen?: () => void;
}) {
  const Tag = onOpen ? 'button' : 'div';
  return (
    <Tag className={`rec${onOpen ? '' : ' flat'}`} onClick={onOpen}>
      <span className="recname">{name}</span>
      {note && <span className={`recnote${warn ? ' warn' : ''}`}>{note}</span>}
      {when && <span className="recwhen">{when}</span>}
    </Tag>
  );
}

export const NoRows = ({ children }: { children: React.ReactNode }) =>
  <p className="norows">{children}</p>;

/**
 * The record itself, over the chart rather than instead of it.
 *
 * Opening a record used to be a navigation: the chart went away and
 * coming back was a Back button and a scroll position you lost. A
 * sheet keeps the list behind it, so closing it puts you back exactly
 * where you were looking, which is the only reason you opened the
 * record in the first place.
 */
export function Sheet({ title, sub, onClose, children, actions }: {
  title: string;
  sub?: string;
  onClose: () => void;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [onClose]);

  return (
    <>
      <div className="sheetback" onClick={onClose} />
      <aside className="sheet" role="dialog" aria-label={title}>
        <header className="sheethead">
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2>{title}</h2>
            {sub && <p className="sheetsub">{sub}</p>}
          </div>
          <button className="sheetx" onClick={onClose} aria-label="Close">&times;</button>
        </header>
        <div className="sheetbody">{children}</div>
        {actions && <footer className="sheetfoot">{actions}</footer>}
      </aside>
    </>
  );
}
