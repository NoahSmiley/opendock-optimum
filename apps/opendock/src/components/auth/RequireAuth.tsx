import type { ReactElement } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";

interface RequireAuthProps {
  children: ReactElement;
}

export function RequireAuth({ children }: RequireAuthProps) {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-neutral-900 dark:bg-black dark:text-neutral-100">
        <div className="flex flex-col items-center gap-3 text-sm text-neutral-500 dark:text-neutral-400">
          <span className="inline-flex h-10 w-10 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900 dark:border-neutral-700 dark:border-t-white" />
          <p>Preparing your workspace...</p>
        </div>
      </div>
    );
  }

  if (status !== "authenticated") {
    const redirectParam = encodeURIComponent(location.pathname + location.search + location.hash);
    return <Navigate to={`/auth?mode=login&redirect=${redirectParam}`} replace />;
  }

  return children;
}

