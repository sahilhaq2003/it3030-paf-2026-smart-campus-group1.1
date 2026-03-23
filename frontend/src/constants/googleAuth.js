/**
 * Web OAuth client ID from Google Cloud Console (Vite exposes only `VITE_*`).
 *
 * In Google Cloud → Credentials → your Web client → Authorized JavaScript origins,
 * add every dev origin you use, e.g. http://localhost:5173 and http://localhost:5174
 * (Vite picks another port if 5173 is busy). Mismatch causes "origin is not allowed".
 */
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";
