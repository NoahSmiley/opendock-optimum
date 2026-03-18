import { useState, type FormEvent } from "react";
import { useAuthStore } from "@/stores/auth/store";

export function RegisterForm({ onSwitch }: { onSwitch: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const register = useAuthStore((s) => s.register);
  const loading = useAuthStore((s) => s.loading);
  const error = useAuthStore((s) => s.error);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    register(email, password, displayName || undefined);
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <div className="auth-field">
        <label htmlFor="reg-name">Display Name</label>
        <input
          id="reg-name"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          autoFocus
          autoComplete="name"
        />
      </div>
      <div className="auth-field">
        <label htmlFor="reg-email">Email</label>
        <input
          id="reg-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </div>
      <div className="auth-field">
        <label htmlFor="reg-password">Password</label>
        <input
          id="reg-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
        />
      </div>
      {error && <p className="auth-error">{error}</p>}
      <button type="submit" className="auth-submit" disabled={loading}>
        {loading ? "Creating account..." : "Create Account"}
      </button>
      <p className="auth-switch">
        Have an account?{" "}
        <button type="button" onClick={onSwitch}>
          Sign in
        </button>
      </p>
    </form>
  );
}
