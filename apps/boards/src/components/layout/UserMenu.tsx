import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, LogOut, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";

export function UserMenu() {
  const { user, status, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setOpen(false);
  }, [location]);

  useEffect(() => {
    if (!open) return;
    const handler = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [open]);

  const initials = useMemo(() => {
    if (!user?.name) return "??";
    return user.name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");
  }, [user]);

  const handleLogout = useCallback(async () => {
    await logout();
    navigate("/auth?mode=login", { replace: true });
  }, [logout, navigate]);

  const authenticated = status === "authenticated" && user;

  if (!authenticated) {
    return (
      <button
        type="button"
        onClick={() => navigate("/auth?mode=login")}
        className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-600 transition hover:border-neutral-300 hover:text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-neutral-500 dark:hover:text-white"
      >
        <User className="h-4 w-4" />
        Sign in
      </button>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-700 transition hover:border-neutral-300 hover:text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:border-neutral-500"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-neutral-900 text-xs font-semibold text-white dark:bg-white dark:text-neutral-900">
          {initials}
        </span>
        <span className="hidden sm:flex sm:flex-col sm:items-start">
          <span className="text-sm font-semibold">{user.name}</span>
          <span className="text-xs font-medium text-neutral-400">{user.email}</span>
        </span>
        <ChevronDown className="h-4 w-4 text-neutral-400" />
      </button>
      {open ? (
        <div className="absolute right-0 z-40 mt-2 w-48 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      ) : null}
    </div>
  );
}
