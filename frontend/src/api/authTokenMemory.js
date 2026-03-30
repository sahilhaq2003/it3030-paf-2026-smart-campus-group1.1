/**
 * Access token store.
 *
 * We keep an in-memory copy for fast reads, but also persist to sessionStorage so a page
 * refresh doesn't drop auth state (otherwise ProtectedRoute redirects to /login).
 */

const STORAGE_KEY = "smart-campus.accessToken";

let memoryToken = null;

export function getMemoryToken() {
  if (memoryToken) return memoryToken;
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    return stored && String(stored).trim() ? String(stored).trim() : null;
  } catch {
    return null;
  }
}

export function setMemoryToken(token) {
  const next = token && String(token).trim() ? String(token).trim() : null;
  memoryToken = next;
  try {
    if (next) sessionStorage.setItem(STORAGE_KEY, next);
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage errors (e.g. blocked cookies/storage).
  }
}

export function clearMemoryToken() {
  memoryToken = null;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
