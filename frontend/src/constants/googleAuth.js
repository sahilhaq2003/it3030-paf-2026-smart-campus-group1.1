/**
 * Web OAuth client ID from Google Cloud Console (Vite exposes only `VITE_*`).
 *
 * Google Cloud Console → APIs & Services → Credentials → your **Web application** OAuth client:
 *
 * **Authorized JavaScript origins** — must match the browser address exactly (scheme + host + port):
 *   - http://localhost:5173
 *   - http://localhost:5174
 *   - http://127.0.0.1:5173
 *   (Add each port Vite may use; 403 / "origin is not allowed" means this list is missing your URL.)
 *
 * **Authorized redirect URIs** — not used for the GSI button flow, but you can add the same origins if required.
 */
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";
