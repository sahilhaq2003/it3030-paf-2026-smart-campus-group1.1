import axiosInstance from "./axiosInstance";

const DEFAULT_ID_TOKEN = "dummy-google-token";

/**
 * POST /auth/google — backend accepts simulated payload for development.
 * @param {string} [idToken]
 * @returns {Promise<{ token: string, user: object }>}
 */
export async function loginWithGoogle(idToken = DEFAULT_ID_TOKEN) {
  const { data } = await axiosInstance.post("/auth/google", { idToken });
  return data;
}

/** POST /auth/login — email + password (BCrypt-verified on server). */
export async function loginWithPassword({ email, password }) {
  const { data } = await axiosInstance.post("/auth/login", { email, password });
  return data;
}

/** GET /auth/me — requires Authorization header (set by axios interceptor). */
export async function fetchCurrentUser() {
  const { data } = await axiosInstance.get("/auth/me");
  return data;
}
