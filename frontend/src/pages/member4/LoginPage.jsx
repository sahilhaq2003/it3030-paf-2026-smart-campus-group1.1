import { useState, useCallback } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { GOOGLE_CLIENT_ID } from "../../constants/googleAuth";
import { getDashboardRoute, getPostLoginRoute } from "../../utils/getDashboardRoute";

function isValidEmail(value) {
  const v = value.trim();
  if (!v) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export default function LoginPage() {
  const { loginWithPassword, loginWithGoogle, loginLoading, loginError, clearLoginError } =
    useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loginMode, setLoginMode] = useState("student");

  /** Stable callback so @react-oauth/google effect deps do not churn (avoids duplicate GSI initialize). */
  const onGoogleCredential = useCallback(
    (credentialResponse) => {
      clearLoginError();
      setFieldErrors({});
      const cred = credentialResponse?.credential;
      if (!cred) return;
      void (async () => {
        try {
          const signedIn = await loginWithGoogle(cred);
          navigate(getPostLoginRoute(signedIn?.roles, { viaGoogle: true }));
        } catch {
          /* loginError set in AuthContext */
        }
      })();
    },
    [clearLoginError, loginWithGoogle, navigate],
  );

  const handleEmailPassword = async (e) => {
    e.preventDefault();
    clearLoginError();
    const next = {};
    if (!isValidEmail(email)) next.email = "Enter a valid email address";
    if (!password) next.password = "Password is required";
    setFieldErrors(next);
    if (Object.keys(next).length) return;

    try {
      const signedIn = await loginWithPassword(email.trim(), password);
      navigate(getDashboardRoute(signedIn?.roles));
    } catch {
      /* loginError set in AuthContext */
    }
  };

  const handleGoogle = async () => {
    clearLoginError();
    setFieldErrors({});
    try {
      const signedIn = await loginWithGoogle();
      navigate(getPostLoginRoute(signedIn?.roles, { viaGoogle: true }));
    } catch {
      /* loginError set in AuthContext */
    }
  };

  const switchLoginMode = (mode) => {
    setLoginMode(mode);
    clearLoginError();
    setFieldErrors({});
  };

  return (
    <div className="min-h-screen antialiased lg:flex">
      {/* Brand column — large screens */}
      <aside className="relative hidden w-[44%] shrink-0 flex-col justify-between overflow-hidden bg-campus-shell p-12 text-white lg:flex xl:p-14">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-20 -top-28 h-[28rem] w-[28rem] rounded-full bg-campus-brand/20 blur-3xl" />
          <div className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-violet-500/10 blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        <div className="relative">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-300 transition hover:text-white"
          >
            <span aria-hidden>←</span> Back to home
          </Link>
          <h1 className="mt-20 text-4xl font-bold leading-[1.15] tracking-tight xl:text-[2.75rem]">
            Sign in to your campus workspace
          </h1>
          <p className="mt-6 max-w-md text-[15px] leading-relaxed text-zinc-400">
            Access maintenance tickets, admin dashboards, and technician tools in one secure
            place—aligned with your institution&apos;s roles and policies.
          </p>
        </div>

        <p className="relative text-xs font-medium text-zinc-600">
          Smart Campus Hub · Encrypted session (when connected to live API)
        </p>
      </aside>

      {/* Auth column */}
      <div className="flex flex-1 flex-col justify-center bg-slate-50 px-5 py-14 sm:px-10">
        <div className="mx-auto w-full max-w-[420px]">
          <div className="mb-10 lg:hidden">
            <Link
              to="/"
              className="text-sm font-semibold text-campus-brand transition hover:text-campus-brand-hover"
            >
              ← Back to home
            </Link>
            <div className="mt-8 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-campus-brand text-sm font-bold text-white shadow-md shadow-campus-brand/25">
                SC
              </div>
              <div>
                <p className="font-semibold text-slate-900">Smart Campus Hub</p>
                <p className="text-xs text-slate-500">Campus sign-in</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-8 shadow-lg shadow-slate-200/50 sm:p-10">
            <div className="hidden text-center lg:block">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-campus-brand text-base font-bold text-white shadow-md shadow-campus-brand/25">
                SC
              </div>
              <h2 className="mt-5 text-2xl font-bold tracking-tight text-slate-900">
                Welcome back
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Admin and technicians use password login. Students continue with Google.
              </p>
            </div>

            <div className="mt-2 lg:mt-8">
              <div className="mx-auto mb-5 grid w-full grid-cols-2 rounded-xl border border-slate-200 bg-slate-50 p-1">
                <button
                  type="button"
                  onClick={() => switchLoginMode("student")}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    loginMode === "student"
                      ? "bg-white text-campus-brand shadow-sm"
                      : "text-slate-600 hover:text-slate-800"
                  }`}
                >
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => switchLoginMode("staff")}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    loginMode === "staff"
                      ? "bg-white text-campus-brand shadow-sm"
                      : "text-slate-600 hover:text-slate-800"
                  }`}
                >
                  Admin / Technician
                </button>
              </div>
            </div>

            {loginMode === "staff" ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-campus-brand">
                  Staff Login
                </p>
                <p className="mt-1 text-sm text-slate-600">For Admin and Technician accounts</p>
              </div>

              <form onSubmit={handleEmailPassword} className="space-y-4" noValidate>
                {loginError ? (
                  <div
                    role="alert"
                    className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
                  >
                    {loginError}
                  </div>
                ) : null}

                <div>
                  <label htmlFor="login-email" className="block text-sm font-medium text-slate-700">
                    Email
                  </label>
                  <input
                    id="login-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(ev) => {
                      setEmail(ev.target.value);
                      if (fieldErrors.email) setFieldErrors((f) => ({ ...f, email: undefined }));
                    }}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-campus-brand-muted focus:ring-2 focus:ring-campus-brand/15"
                    placeholder="staff@campus.edu"
                    disabled={loginLoading}
                  />
                  {fieldErrors.email ? (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
                  ) : null}
                </div>

                <div>
                  <label
                    htmlFor="login-password"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Password
                  </label>
                  <input
                    id="login-password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(ev) => {
                      setPassword(ev.target.value);
                      if (fieldErrors.password) setFieldErrors((f) => ({ ...f, password: undefined }));
                    }}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-campus-brand-muted focus:ring-2 focus:ring-campus-brand/15"
                    placeholder="••••••••"
                    disabled={loginLoading}
                  />
                  {fieldErrors.password ? (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>
                  ) : null}
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full rounded-xl bg-campus-brand px-4 py-3.5 text-sm font-semibold text-white shadow-md shadow-slate-900/10 transition hover:bg-campus-brand-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-brand disabled:pointer-events-none disabled:opacity-60"
                >
                  {loginLoading ? "Signing in…" : "Sign in as Admin / Technician"}
                </button>
              </form>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
                <div className="mb-4 text-center">
                  <p className="text-xs font-semibold uppercase tracking-wide text-campus-brand">
                    Student Login
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Students must continue with Google account
                  </p>
                </div>

                {!GOOGLE_CLIENT_ID ? (
                  <button
                    type="button"
                    onClick={handleGoogle}
                    disabled={loginLoading}
                    className="group flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm shadow-slate-200/70 transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-brand disabled:pointer-events-none disabled:opacity-60"
                  >
                    {loginLoading ? (
                      <span className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-slate-200 border-t-campus-brand" />
                    ) : (
                      <GoogleGlyph className="h-5 w-5 shrink-0 transition-transform group-hover:scale-105" />
                    )}
                    Continue with Google (student)
                  </button>
                ) : null}
              </div>
            )}

            {/*
              Keep GoogleLogin mounted when switching Student ↔ Staff so google.accounts.id.initialize()
              runs once (avoids GSI_LOGGER duplicate init). Hide with CSS on staff tab.
            */}
            {GOOGLE_CLIENT_ID ? (
              <div
                className={
                  loginMode === "student"
                    ? "mt-4"
                    : "hidden h-0 w-0 overflow-hidden p-0"
                }
                aria-hidden={loginMode !== "student"}
              >
                <div
                  className={`login-google-wrap relative flex w-full min-w-0 justify-center ${loginLoading ? "pointer-events-none opacity-60" : ""}`}
                >
                  <GoogleLogin
                    width={300}
                    type="standard"
                    theme="filled_blue"
                    size="large"
                    text="continue_with"
                    shape="pill"
                    logo_alignment="left"
                    locale="en"
                    containerProps={{
                      className: "login-google-inner flex w-full max-w-full items-center justify-center p-0",
                    }}
                    onSuccess={onGoogleCredential}
                    onError={clearLoginError}
                  />
                  {loginLoading ? (
                    <div
                      className="absolute inset-0 flex items-center justify-center gap-2 rounded-md bg-white/80 text-sm font-semibold text-slate-700 backdrop-blur-[1px]"
                      aria-live="polite"
                    >
                      <span className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-slate-200 border-t-campus-brand" />
                      Signing in…
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            <p className="mt-3 text-center text-xs text-slate-500">
              Switch role to choose the correct sign-in method.
            </p>

          </div>

          <p className="mt-8 text-center text-xs text-slate-400">
            Need help?{" "}
            <Link to="/login/help" className="font-semibold text-campus-brand hover:text-campus-brand-hover">
              View login process help
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleGlyph({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
