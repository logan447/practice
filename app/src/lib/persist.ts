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

export function save(value: unknown): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    /* full, blocked, or private browsing: carry on in memory */
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
