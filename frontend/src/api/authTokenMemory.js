/** In-memory access token only (spec: no localStorage). Survives until tab refresh or logout. */

let memoryToken = null;

export function getMemoryToken() {
  return memoryToken;
}

export function setMemoryToken(token) {
  memoryToken = token && String(token).trim() ? String(token).trim() : null;
}

export function clearMemoryToken() {
  memoryToken = null;
}
