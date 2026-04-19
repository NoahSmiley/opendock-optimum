import { useState } from "react";
import { useAuth } from "@/stores/auth";

export function LoginScreen() {
  const pending = useAuth((s) => s.pending);
  const error = useAuth((s) => s.error);
  const login = useAuth((s) => s.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    login(email.trim(), password);
  };

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={submit}>
        <div className="login-brand">Opendock</div>
        <p className="login-hint">Sign in with your Athion account.</p>
        <input type="email" className="login-input" placeholder="Email" autoComplete="email" autoFocus
          value={email} onChange={(e) => setEmail(e.target.value)} disabled={pending} />
        <input type="password" className="login-input" placeholder="Password" autoComplete="current-password"
          value={password} onChange={(e) => setPassword(e.target.value)} disabled={pending} />
        {error && <p className="login-error">{error}</p>}
        <button type="submit" className="login-button" disabled={pending || !email.trim() || !password}>
          {pending ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}
