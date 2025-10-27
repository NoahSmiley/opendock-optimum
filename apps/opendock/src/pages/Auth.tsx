import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { getApiBaseUrl } from "@opendock/shared/api";
import { useAuth } from "@/components/auth";

type AuthMode = "login" | "register";

export default function AuthPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialMode = useMemo<AuthMode>(() => {
    const mode = params.get("mode");
    return mode === "register" ? "register" : "login";
  }, [params]);

  const redirectTo = useMemo(() => {
    const target = params.get("redirect");
    if (!target) return "/dashboard";
    if (!target.startsWith("/")) return "/dashboard";
    return target;
  }, [params]);

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { status, user, login, register, error } = useAuth();
  const githubLoginUrl = useMemo(() => {
    const baseUrl = getApiBaseUrl().replace(/\/+$/, "");
    const url = new URL("/api/auth/github/login", `${baseUrl}/`);
    url.searchParams.set("redirect", redirectTo);
    return url.toString();
  }, [redirectTo]);

  useEffect(() => {
    if (status === "authenticated" && user) {
      navigate(redirectTo, { replace: true });
    }
  }, [status, user, navigate, redirectTo]);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const toggleMode = () => {
    setFormError(null);
    setMode((current) => (current === "login" ? "register" : "login"));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setFormError(null);
    try {
      if (mode === "login") {
        await login({ email, password });
      } else {
        await register({ email, password, displayName: displayName || undefined });
      }
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const headline = mode === "login" ? "Welcome back" : "Create your workspace";
  const submitLabel = submitting ? "Please wait..." : mode === "login" ? "Sign in" : "Create account";
  const secondaryLabel = mode === "login" ? "Need an account?" : "Already registered?";
  const secondaryCta = mode === "login" ? "Create one" : "Sign in";

  return (
    <div className="flex min-h-screen flex-col bg-white text-neutral-900 dark:bg-black dark:text-neutral-100">
      <header className="flex items-center justify-between px-6 py-6 sm:px-10">
        <Link
          to="/dashboard"
          className="text-sm font-semibold tracking-tight text-neutral-700 transition hover:text-neutral-900 dark:text-neutral-200 dark:hover:text-white"
        >
          OpenDock
        </Link>
        <Link
          to="/dashboard"
          className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-400 transition hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300"
        >
          Back to docs
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-lg rounded-3xl border border-neutral-200 bg-white/80 p-10 shadow-sm transition dark:border-neutral-800 dark:bg-neutral-950/80">
          <div className="space-y-3 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">{headline}</h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {mode === "login"
                ? "Sign in to continue planning and shipping with OpenDock."
                : "A calm workspace for hobby projects, simulated pipelines, and kanban planning."}
            </p>
          </div>
          <div className="mt-10 space-y-4">
            <a
              href={githubLoginUrl}
              className="inline-flex w-full items-center justify-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-700 shadow-sm transition hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950/60 dark:text-neutral-200 dark:hover:border-neutral-600 dark:hover:bg-neutral-900"
            >
              <svg aria-hidden className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.54 5.47 7.6.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.19 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
              </svg>
              Continue with GitHub
            </a>
            <div className="flex items-center gap-3 text-xs text-neutral-400 dark:text-neutral-500">
              <span className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
              <span>or continue with email</span>
              <span className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
            </div>
          </div>
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2 text-left">
              <label htmlFor="email" className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500 dark:text-neutral-400">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="email"
                className="w-full rounded-xl border border-neutral-200 bg-white/70 px-4 py-3 text-sm text-neutral-800 shadow-sm outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200 dark:border-neutral-800 dark:bg-neutral-950/60 dark:text-neutral-50 dark:focus:border-neutral-600 dark:focus:ring-neutral-700"
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-2 text-left">
              <label htmlFor="password" className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500 dark:text-neutral-400">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                className="w-full rounded-xl border border-neutral-200 bg-white/70 px-4 py-3 text-sm text-neutral-800 shadow-sm outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200 dark:border-neutral-800 dark:bg-neutral-950/60 dark:text-neutral-50 dark:focus:border-neutral-600 dark:focus:ring-neutral-700"
                placeholder="************"
              />
            </div>

            {mode === "register" && (
              <div className="space-y-2 text-left">
                <label htmlFor="displayName" className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500 dark:text-neutral-400">
                  Display name
                </label>
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  autoComplete="name"
                  className="w-full rounded-xl border border-neutral-200 bg-white/70 px-4 py-3 text-sm text-neutral-800 shadow-sm outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200 dark:border-neutral-800 dark:bg-neutral-950/60 dark:text-neutral-50 dark:focus:border-neutral-600 dark:focus:ring-neutral-700"
                  placeholder="A name to share with teammates"
                />
                <p className="text-xs text-neutral-400 dark:text-neutral-500">Optional. We'll fall back to your email if left blank.</p>
              </div>
            )}

            {(formError || error) && (
              <p className="rounded-xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-xs font-medium text-rose-600 dark:border-rose-900 dark:bg-rose-950/60 dark:text-rose-300">
                {formError ?? error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              {submitLabel}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
            <span>{secondaryLabel}</span>
            <button
              type="button"
              onClick={toggleMode}
              className="font-semibold text-neutral-900 underline-offset-4 transition hover:underline dark:text-neutral-100"
            >
              {secondaryCta}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}



