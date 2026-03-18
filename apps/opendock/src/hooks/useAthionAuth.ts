import { useState, useEffect, useCallback, useRef } from "react";

interface AuthStatus {
  loggedIn: boolean;
  email: string | null;
  displayName: string | null;
}

interface TauriAuthStatus {
  logged_in: boolean;
  email: string | null;
  display_name: string | null;
}

function isTauri(): boolean {
  return "__TAURI_INTERNALS__" in window;
}

async function invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  const { invoke: tauriInvoke } = await import("@tauri-apps/api/core");
  return tauriInvoke<T>(cmd, args);
}

export function useAthionAuth() {
  const [status, setStatus] = useState<AuthStatus>({ loggedIn: false, email: null, displayName: null });
  const [ready, setReady] = useState(false);
  const [polling, setPolling] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isTauri()) {
      setReady(true);
      return;
    }
    invoke<TauriAuthStatus>("get_auth_status")
      .then((s) => setStatus({ loggedIn: s.logged_in, email: s.email, displayName: s.display_name }))
      .catch(() => setStatus({ loggedIn: false, email: null, displayName: null }))
      .finally(() => setReady(true));
  }, []);

  const login = useCallback(async () => {
    if (!isTauri()) return;
    setPolling(true);
    try {
      const { code } = await invoke<{ code: string; url: string }>("login_initiate");

      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(async () => {
        try {
          const result = await invoke<{ status: string; email: string | null }>("login_poll", { code });
          if (result.status === "complete") {
            if (pollRef.current) clearInterval(pollRef.current);
            pollRef.current = null;
            setPolling(false);
            // Re-fetch full status
            const s = await invoke<TauriAuthStatus>("get_auth_status");
            setStatus({ loggedIn: s.logged_in, email: s.email, displayName: s.display_name });
          } else if (result.status === "expired") {
            if (pollRef.current) clearInterval(pollRef.current);
            pollRef.current = null;
            setPolling(false);
          }
        } catch {
          if (pollRef.current) clearInterval(pollRef.current);
          pollRef.current = null;
          setPolling(false);
        }
      }, 2000);
    } catch {
      setPolling(false);
    }
  }, []);

  const logout = useCallback(async () => {
    if (!isTauri()) return;
    await invoke("logout").catch(() => {});
    setStatus({ loggedIn: false, email: null, displayName: null });
  }, []);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  return { status, login, logout, loading: polling, ready };
}
