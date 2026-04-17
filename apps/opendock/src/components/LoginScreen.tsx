import { useAuth } from "@/stores/auth";

export function LoginScreen() {
  const pending = useAuth((s) => s.pending);
  const error = useAuth((s) => s.error);
  const startLogin = useAuth((s) => s.startLogin);

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-brand">OpenDock</div>
        <p className="login-hint">
          {pending ? "Waiting for you to sign in at athion.me..." : "Sign in with your Athion account to continue."}
        </p>
        {error && <p className="login-error">{error}</p>}
        <button className="login-button" onClick={() => startLogin()} disabled={pending}>
          {pending ? "Waiting..." : "Sign in"}
        </button>
      </div>
    </div>
  );
}
