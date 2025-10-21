import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
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
          <form className="mt-10 space-y-4" onSubmit={handleSubmit}>
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



