/** Registered by AuthUnauthorizedBridge; axios calls this after a 401 (except login/google). */
let onUnauthorized = null;

export function setUnauthorizedHandler(handler) {
  onUnauthorized = typeof handler === "function" ? handler : null;
}

export function notifyUnauthorizedResponse() {
  onUnauthorized?.();
}
