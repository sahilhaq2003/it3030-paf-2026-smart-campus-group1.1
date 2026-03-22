import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getDashboardRoute } from "../../utils/getDashboardRoute";

const BRAND = "#1E3A5F";

export default function LoginPage() {
  const { login, loginLoading, loginError, clearLoginError } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async () => {
    clearLoginError();
    try {
      const signedIn = await login();
      navigate(getDashboardRoute(signedIn?.roles));
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
                Use your campus Google account to continue
              </p>
            </div>

            <div className="mt-2 lg:mt-10 space-y-3">
              {loginError ? (
                <div
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
                >
                  {loginError}
                </div>
              ) : null}
              <button
                type="button"
                onClick={handleLogin}
                disabled={loginLoading}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-60"
                style={{ outlineColor: BRAND }}
              >
                {loginLoading ? (
                  <span className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-slate-200 border-t-slate-600" />
                ) : (
                  <GoogleGlyph className="h-5 w-5 shrink-0" />
                )}
                {loginLoading ? "Signing in…" : "Continue with Google"}
              </button>
            </div>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center" aria-hidden>
                <div className="w-full border-t border-slate-100" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 font-medium text-slate-400">
                  Demo authentication
                </span>
              </div>
            </div>

            <p className="text-center text-xs leading-relaxed text-slate-500">
              This build uses a simulated Google sign-in for development. Production will use
              your institution&apos;s OAuth configuration.
            </p>
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
