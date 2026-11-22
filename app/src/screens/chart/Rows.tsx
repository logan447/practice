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

/**
 * One row: when, what kind, what it is.
 *
 * The name on the left edge, then the tag, then the date on the
 * right edge. Two edges and nothing floating in between: the eye
 * runs down the left for what each record is, and down the right for
 * when it happened, with the one word that says whether to stop in
 * between. Three columns all flush left made the name start in a
 * different place on every row, because whatever preceded it was a
 * different length. One tag and no more: a row with three labels on
 * it is a row you parse rather than read, and the tab you are
 * standing in has already said what kind of record this is.
 *
 * There are no headings inside a tab. Every group heading this record
 * used to carry ("We manage", "On the list, managed elsewhere",
 * "Active", "Held") said the same thing its rows can say, once each,
 * in the tag.
 */
export function Row({ name, when, tag, warn, onOpen }: {
  name: string;
  when?: string;
  /** One word or two about what this row is. Never a second one. */
  tag?: string;
  /** The tag is the kind you should not read past. */
  warn?: boolean;
  onOpen?: () => void;
}) {
  const Tag = onOpen ? 'button' : 'div';
  return (
    <Tag className={`rec${onOpen ? '' : ' flat'}`} onClick={onOpen}>
      <span className="recname">{name}</span>
      <span className={`rectag${warn ? ' warn' : ''}`}>{tag ?? ''}</span>
      <span className="recwhen">{when ?? ''}</span>
    </Tag>
  );
}

/** A list of rows, and nothing above it. */
export const Rows = ({ children }: { children: React.ReactNode }) =>
  <div className="grprows">{children}</div>;

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
