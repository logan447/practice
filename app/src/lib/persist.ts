/**
 * Prototype persistence.
 *
 * localStorage, per browser, wrapped so that a private window, cleared
 * site data or a blocked accessor degrades to "no saved state" rather
 * than a white screen. Nothing clinical should ever live here; this is
 * so that a prototype you are evaluating survives a page reload.
 */
const KEY = 'dlm-emr-v1';

export function load<T>(): T | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

/**
 * Returns false when the write did not happen.
 *
 * Silently losing a write is the wrong failure. At panel volume this
 * is a real case, not a theoretical one: a full browser store, private
 * browsing, or blocked site data all look the same from here, and the
 * person needs to know their work is only in memory.
 */
export function save(value: unknown): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function wipe(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* nothing to do */
  }
}

let seq = Date.now() % 100000;
/** Ids only need to be unique within one browser session. */
export const newId = (prefix: string): string => `${prefix}${(seq++).toString(36)}`;
