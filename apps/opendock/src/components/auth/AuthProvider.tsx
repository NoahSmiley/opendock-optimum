import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { AuthUser, RegisterInput, LoginInput } from "@/lib/auth-client";
import { fetchSession, login as loginRequest, logout as logoutRequest, register as registerRequest } from "@/lib/auth-client";

type AuthStatus = "unauthenticated" | "loading" | "authenticated" | "error";

interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  error: string | null;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refresh = useCallback(async () => {
    try {
      setStatus("loading");
      const session = await fetchSession();
      setUser(session.user);
      setStatus(session.user ? "authenticated" : "unauthenticated");
      setError(null);
    } catch (err) {
      console.error("Failed to fetch session", err);
      setUser(null);
      setStatus("error");
      setError(err instanceof Error ? err.message : "Unable to load session.");
    }
  }, []);

  const login = useCallback(
    async (input: LoginInput) => {
      try {
        setStatus("loading");
        const authenticated = await loginRequest(input);
        setUser(authenticated);
        setStatus("authenticated");
        setError(null);
      } catch (err) {
        console.error("Login failed", err);
        setStatus("unauthenticated");
        setError(err instanceof Error ? err.message : "Login failed.");
        throw err;
      }
    },
    [],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      try {
        setStatus("loading");
        const newUser = await registerRequest(input);
        setUser(newUser);
        setStatus("authenticated");
        setError(null);
      } catch (err) {
        console.error("Registration failed", err);
        setStatus("unauthenticated");
        setError(err instanceof Error ? err.message : "Registration failed.");
        throw err;
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } catch (err) {
      console.error("Logout failed", err);
    } finally {
      setUser(null);
      setStatus("unauthenticated");
    }
  }, []);

  const contextValue = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      error,
      login,
      register,
      logout,
      refresh,
    }),
    [status, user, error, login, register, logout, refresh],
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
