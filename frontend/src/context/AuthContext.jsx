import axios from "axios";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  fetchCurrentUser,
  loginWithGoogle as loginWithGoogleApi,
  loginWithPassword as loginWithPasswordApi,
} from "../api/authApi";
import { AUTH_TOKEN_STORAGE_KEY } from "../constants/authStorage";

const AuthContext = createContext(null);

function getStoredToken() {
  return sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getStoredToken());
  const [user, setUser] = useState(null);
  const [bootstrapping, setBootstrapping] = useState(() => Boolean(getStoredToken()));
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState(null);

  /** Restore session: token in sessionStorage → GET /auth/me */
  useEffect(() => {
    if (!token) {
      setBootstrapping(false);
      return;
    }
    if (user) {
      setBootstrapping(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const profile = await fetchCurrentUser();
        if (!cancelled) setUser(profile);
      } catch {
        if (!cancelled) {
          sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
          setToken(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) setBootstrapping(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, user]);

  const applyAuthResponse = useCallback((accessToken, nextUser) => {
    if (!accessToken || !nextUser) {
      throw new Error("Invalid response from server");
    }
    sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEY, accessToken);
    setToken(accessToken);
    setUser(nextUser);
    return nextUser;
  }, []);

  const loginWithGoogle = useCallback(
    async (idToken = "dummy-google-token") => {
      setLoginError(null);
      setLoginLoading(true);
      try {
        const { token: accessToken, user: nextUser } = await loginWithGoogleApi(idToken);
        return applyAuthResponse(accessToken, nextUser);
      } catch (err) {
        const message = resolveAuthErrorMessage(err);
        setLoginError(message);
        throw err;
      } finally {
        setLoginLoading(false);
      }
    },
    [applyAuthResponse],
  );

  const loginWithPassword = useCallback(
    async (email, password) => {
      setLoginError(null);
      setLoginLoading(true);
      try {
        const { token: accessToken, user: nextUser } = await loginWithPasswordApi({
          email,
          password,
        });
        return applyAuthResponse(accessToken, nextUser);
      } catch (err) {
        const message = resolveAuthErrorMessage(err);
        setLoginError(message);
        throw err;
      } finally {
        setLoginLoading(false);
      }
    },
    [applyAuthResponse],
  );

  const logout = useCallback(() => {
    sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    setToken(null);
    setUser(null);
    setLoginError(null);
  }, []);

  const clearLoginError = useCallback(() => setLoginError(null), []);

  const value = useMemo(
    () => ({
      user,
      token,
      loginWithGoogle,
      loginWithPassword,
      logout,
      isAuthenticated: Boolean(user && token),
      isBootstrapping: bootstrapping,
      loginLoading,
      loginError,
      clearLoginError,
    }),
    [
      user,
      token,
      loginWithGoogle,
      loginWithPassword,
      logout,
      bootstrapping,
      loginLoading,
      loginError,
      clearLoginError,
    ],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

function resolveAuthErrorMessage(err) {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data;
    if (typeof data === "string" && data.trim()) return data;
    if (Array.isArray(data?.errors) && data.errors.length) {
      const first = data.errors[0];
      if (first?.defaultMessage) return String(first.defaultMessage);
    }
    if (data?.message) return String(data.message);
    if (data?.error) return String(data.error);
    if (err.response?.status === 401) return "Unauthorized";
    if (err.response?.status === 403) return "Access denied";
    if (err.response?.status === 404) return "Service not found";
    if (err.response?.status >= 500) return "Server error — try again later";
    if (err.code === "ERR_NETWORK") {
      return "Cannot reach server — check the API is running";
    }
    return err.message || "Sign-in failed";
  }
  if (err instanceof Error) return err.message;
  return "Sign-in failed";
}
