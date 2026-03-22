import { useState, useRef, useLayoutEffect } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { GOOGLE_CLIENT_ID } from "../../constants/googleAuth";
import { getDashboardRoute, getPostLoginRoute } from "../../utils/getDashboardRoute";

const BRAND = "#1E3A5F";

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
  const googleWrapRef = useRef(null);
  /** Measured once after layout so GoogleLogin does not re-call gsi.initialize() on every resize. */
  const [googleBtnWidth, setGoogleBtnWidth] = useState(null);

  useLayoutEffect(() => {
    const el = googleWrapRef.current;
    if (!el) return undefined;
    let cancelled = false;
    let rafInner = 0;
    const apply = () => {
      if (cancelled) return;
      const w = Math.floor(el.getBoundingClientRect().width);
      setGoogleBtnWidth(w > 0 ? w : 320);
    };
    const rafOuter = requestAnimationFrame(() => {
      rafInner = requestAnimationFrame(apply);
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafOuter);
      cancelAnimationFrame(rafInner);
    };
  }, []);

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

  return (
    <div className="min-h-screen antialiased lg:flex">
      {/* Brand column — large screens */}
      <aside className="relative hidden w-[44%] shrink-0 flex-col justify-between overflow-hidden bg-[#0b1f33] p-12 text-white lg:flex xl:p-14">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-20 -top-28 h-[28rem] w-[28rem] rounded-full bg-blue-500/25 blur-3xl" />
          <div className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />
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
            className="inline-flex items-center gap-2 text-sm font-medium text-sky-100/90 transition hover:text-white"
          >
            <span aria-hidden>←</span> Back to home
          </Link>
          <h1 className="mt-20 text-4xl font-bold leading-[1.15] tracking-tight xl:text-[2.75rem]">
            Sign in to your campus workspace
          </h1>
          <p className="mt-6 max-w-md text-[15px] leading-relaxed text-sky-100/75">
            Access maintenance tickets, admin dashboards, and technician tools in one secure
            place—aligned with your institution&apos;s roles and policies.
          </p>
        </div>

        <p className="relative text-xs font-medium text-sky-200/40">
          Smart Campus Hub · Encrypted session (when connected to live API)
        </p>
      </aside>

      {/* Auth column */}
      <div className="flex flex-1 flex-col justify-center bg-slate-50 px-5 py-14 sm:px-10">
        <div className="mx-auto w-full max-w-[420px]">
          <div className="mb-10 lg:hidden">
            <Link
              to="/"
              className="text-sm font-semibold transition hover:opacity-80"
              style={{ color: BRAND }}
            >
              ← Back to home
            </Link>
            <div className="mt-8 flex items-center gap-3">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl text-sm font-bold text-white"
                style={{ backgroundColor: BRAND }}
              >
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
              <div
                className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-base font-bold text-white shadow-md"
                style={{ backgroundColor: BRAND }}
              >
                SC
              </div>
              <h2 className="mt-5 text-2xl font-bold tracking-tight text-slate-900">
                Welcome back
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Sign in with your campus email and password
              </p>
            </div>

            <form onSubmit={handleEmailPassword} className="mt-2 lg:mt-10 space-y-4" noValidate>
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
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  placeholder="you@campus.edu"
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
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
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
                className="w-full rounded-xl px-4 py-3.5 text-sm font-semibold text-white shadow-md transition hover:opacity-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-60"
                style={{ backgroundColor: BRAND, outlineColor: BRAND }}
              >
                {loginLoading ? "Signing in…" : "Sign in"}
              </button>
            </form>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center" aria-hidden>
                <div className="w-full border-t border-slate-100" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 font-medium text-slate-400">Or continue with</span>
              </div>
            </div>

            {GOOGLE_CLIENT_ID ? (
              loginLoading ? (
                <div className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-600">
                  <span className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-slate-200 border-t-slate-600" />
                  Signing in…
                </div>
              ) : (
                <div ref={googleWrapRef} className="w-full min-w-0">
                  {googleBtnWidth == null ? (
                    <div
                      className="flex h-10 w-full items-center justify-center rounded-md border border-slate-200 bg-slate-50"
                      aria-hidden
                    />
                  ) : null}
                  {googleBtnWidth != null ? (
                  <GoogleLogin
                    width={googleBtnWidth}
                    size="large"
                    text="continue_with"
                    shape="rectangular"
                    onSuccess={(credentialResponse) => {
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
                    }}
                    onError={() => clearLoginError()}
                  />
                  ) : null}
                </div>
              )
            ) : (
              <button
                type="button"
                onClick={handleGoogle}
                disabled={loginLoading}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-60"
                style={{ outlineColor: BRAND }}
              >
                {loginLoading ? (
                  <span className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-slate-200 border-t-slate-600" />
                ) : (
                  <GoogleGlyph className="h-5 w-5 shrink-0" />
                )}
                Continue with Google (demo — set VITE_GOOGLE_CLIENT_ID)
              </button>
            )}

          </div>

          <p className="mt-8 text-center text-xs text-slate-400">
            Need help?{" "}
            <span className="text-slate-500">Contact your campus IT desk.</span>
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
