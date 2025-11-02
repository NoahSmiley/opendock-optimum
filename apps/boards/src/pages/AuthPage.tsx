import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Loader2, LogIn, UserPlus } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { ThemeToggle } from "@/theme-toggle";

export function AuthPage() {
  const { status, error, login, register, user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const mode = searchParams.get("mode") === "register" ? "register" : "login";
  const redirectTarget = searchParams.get("redirect") ?? "/dashboard";
  const [feedback, setFeedback] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  useEffect(() => {
    if (user) {
      navigate(redirectTarget, { replace: true });
    }
  }, [user, navigate, redirectTarget]);

  useEffect(() => {
    setFeedback(null);
    setForm({ name: "", email: "", password: "" });
  }, [mode]);

  const heading = mode === "login" ? "Welcome back" : "Create your workspace account";

  const switchMode = useCallback(() => {
    setSearchParams((params) => {
      const next = new URLSearchParams(params);
      if (mode === "login") {
        next.set("mode", "register");
      } else {
        next.set("mode", "login");
      }
      return next;
    });
  }, [mode, setSearchParams]);

  const isLoading = status === "loading";
  const submitLabel = mode === "login" ? "Sign in" : "Create account";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);
    try {
      if (mode === "login") {
        await login({ email: form.email.trim(), password: form.password });
      } else {
        await register({ name: form.name.trim(), email: form.email.trim(), password: form.password });
      }
      navigate(redirectTarget, { replace: true });
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  };

  const helperText = useMemo(() => {
    if (mode === "login") {
      return "Authenticate with the credentials you registered for the boards workspace.";
    }
    return "Register to sync kanban planning with deploy pipelines. Your account also works across the OpenDock surface.";
  }, [mode]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-4 py-8 dark:bg-dark-bg">
      <div className="absolute right-6 top-6">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white/90 p-8 shadow-lg backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/80">
        <header className="mb-6 space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">{heading}</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{helperText}</p>
        </header>
        <form className="space-y-4" onSubmit={handleSubmit}>
          {mode === "register" ? (
            <label className="flex flex-col gap-1 text-sm font-medium text-neutral-600 dark:text-neutral-200">
              Full name
              <input
                required
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="********"
                disabled={isLoading}
                className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700 transition focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-200 disabled:opacity-60 dark:border-neutral-700 dark:bg-dark-bg dark:text-neutral-100 dark:focus:border-neutral-500 dark:focus:ring-neutral-700"
              />
            </label>
          ) : null}
          <label className="flex flex-col gap-1 text-sm font-medium text-neutral-600 dark:text-neutral-200">
            Email
            <input
              required
              type="email"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              placeholder="********"
              disabled={isLoading}
              className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700 transition focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-200 disabled:opacity-60 dark:border-neutral-700 dark:bg-dark-bg dark:text-neutral-100 dark:focus:border-neutral-500 dark:focus:ring-neutral-700"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-neutral-600 dark:text-neutral-200">
            Password
            <input
              required
              type="password"
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              placeholder="********"
              disabled={isLoading}
              className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700 transition focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-200 disabled:opacity-60 dark:border-neutral-700 dark:bg-dark-bg dark:text-neutral-100 dark:focus:border-neutral-500 dark:focus:ring-neutral-700"
            />
          </label>
          {feedback || error ? (
            <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-600 dark:border-rose-400/30 dark:text-rose-200">
              {feedback || error}
            </div>
          ) : null}
          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-neutral-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "login" ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
            {submitLabel}
          </button>
        </form>
        <footer className="mt-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
          {mode === "login" ? (
            <span>
              Need an account?{' '}
              <button type="button" onClick={switchMode} className="font-semibold text-neutral-900 underline-offset-4 hover:underline dark:text-white">
                Register
              </button>
            </span>
          ) : (
            <span>
              Already onboard?{' '}
              <button type="button" onClick={switchMode} className="font-semibold text-neutral-900 underline-offset-4 hover:underline dark:text-white">
                Sign in
              </button>
            </span>
          )}
        </footer>
        <div className="mt-4 text-center text-xs text-neutral-400 dark:text-neutral-500">
          Having trouble? <Link to="/roadmap" className="underline underline-offset-4">Check the roadmap</Link> for upcoming auth improvements.
        </div>
      </div>
    </div>
  );
}

export default AuthPage;
