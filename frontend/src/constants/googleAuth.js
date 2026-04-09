/**
 * Web OAuth client ID from Google Cloud Console (Vite exposes only `VITE_*`).
 *
 * If the console shows `403` on `accounts.google.com/gsi/button` and
 * `[GSI_LOGGER]: The given origin is not allowed for the given client ID`,
 * the fix is **only** in Google Cloud Console (not the Spring backend):
 *
 * 1) Google Cloud Console → APIs & Services → Credentials
 * 2) Open the OAuth 2.0 Client ID whose ID matches `VITE_GOOGLE_CLIENT_ID`
 *    (type must be **Web application**, not iOS/Android/Desktop).
 * 3) Under **Authorized JavaScript origins**, add the **exact** origin from
 *    your browser address bar (scheme + host + port), for example:
 *    - http://localhost:5173
 *    - http://127.0.0.1:5173
 *    - http://localhost:5174   (if Vite picks another port)
 *    - Your LAN URL if you use it, e.g. http://192.168.1.10:5173
 * 4) Save, wait ~1–5 minutes, hard-refresh the app.
 * 5) Prefer a normal browser tab at `http://localhost:5173` — embedded previews
 *    sometimes use a different origin that is not in your allow list.
 *
 * Redirect URIs are not required for the GSI button + ID token flow, but
 * having the same origins listed avoids confusion when debugging.
 */
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";
