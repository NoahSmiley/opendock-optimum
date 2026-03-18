import { useState, type FormEvent } from "react";
import { OpenDockLogo } from "@/components/shared/OpenDockLogo";
import { useAuthStore } from "@/stores/auth/store";

export function AuthPage() {
  return <LocalAuth />;
}

function LocalAuth() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const loading = useAuthStore((s) => s.loading);
  const error = useAuthStore((s) => s.error);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (mode === "login") login(email, password);
    else register(email, password, email.split("@")[0]);
  };

  return (
    <div className="auth-layout">
      <div className="flex flex-col items-center">
        <div className="mb-6 flex flex-col items-center gap-2">
          <OpenDockLogo size={56} />
          <span className="text-[13px] font-medium tracking-wide text-neutral-500">OpenDock</span>
        </div>
        <div className="auth-card">
          <h1>{mode === "login" ? "Sign In" : "Create Account"}</h1>
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label htmlFor="auth-email">Email</label>
              <input id="auth-email" type="email" value={email}
                onChange={(e) => setEmail(e.target.value)} required autoFocus />
            </div>
            <div className="auth-field">
              <label htmlFor="auth-password">Password</label>
              <input id="auth-password" type="password" value={password}
                onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {error && <p className="auth-error">{error}</p>}
            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? "..." : mode === "login" ? "Sign In" : "Sign Up"}
            </button>
          </form>
          <p className="auth-switch">
            {mode === "login" ? "No account? " : "Have an account? "}
            <button type="button" onClick={() => setMode(mode === "login" ? "register" : "login")}>
              {mode === "login" ? "Register" : "Sign In"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
