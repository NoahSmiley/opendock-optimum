import { useCallback, useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import clsx from "clsx";
import { Expand, Minimize } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { getBoardsAppUrl } from "@/lib/config";
import { useAuth } from "./auth";

const navItems = [
  { label: "Docs", to: "/dashboard" },
  { label: "Boards", to: "/boards" },
  { label: "About", to: "/about" },
  { label: "Roadmap", to: "/roadmap" },
];

type SidebarLink = { label: string; to: string } | { label: string; launchBoards: true };

const sidebarSections: Array<{ title: string; links: SidebarLink[] }> = [
  {
    title: "Get Started",
    links: [
      { label: "Overview", to: "/dashboard" },
      { label: "Boards", to: "/boards" },
      { label: "Deployment", to: "/dashboard#deployment" },
    ],
  },
  {
    title: "Reference",
    links: [
      { label: "Projects", to: "/dashboard#projects" },
      { label: "Pipelines", to: "/dashboard#pipelines" },
      { label: "Monitoring", to: "/dashboard#monitor" },
      { label: "Boards App", launchBoards: true },
    ],
  },
];

const LAYOUT_PREF_KEY = "opendock.layout.wide";

const HASH_AWARE_PATHS = new Set(
  sidebarSections
    .flatMap((section) => section.links)
    .filter((link): link is Extract<SidebarLink, { to: string }> => "to" in link)
    .filter((link) => link.to.includes("#"))
    .map((link) => link.to.split("#")[0]),
);

export function AppLayout() {
  const headerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { pathname, hash } = location;
  const [wideLayout, setWideLayout] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(LAYOUT_PREF_KEY) === "1";
  });
  const [layoutOffset, setLayoutOffset] = useState(0);
  const { user, status: authStatus, logout } = useAuth();

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(LAYOUT_PREF_KEY, wideLayout ? "1" : "0");
  }, [wideLayout]);

  useEffect(() => {
    if (!hash) return;
    const target = document.querySelector(hash);
    if (target instanceof HTMLElement) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [hash]);

  const toggleLayout = useCallback(() => {
    setWideLayout((current) => !current);
  }, []);

  const handleSignIn = useCallback(() => {
    navigate("/auth?mode=login");
  }, [navigate]);

  const handleSignOut = useCallback(async () => {
    try {
      await logout();
    } finally {
      navigate("/auth?mode=login");
    }
  }, [logout, navigate]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const updateOffset = () => {
      const node = headerRef.current;
      if (!node) return;
      if (!wideLayout) {
        setLayoutOffset(0);
        return;
      }
      const viewportWidth = window.innerWidth;
      const containerWidth = node.offsetWidth;
      const edgePadding = 20;
      const computed = Math.max(0, Math.round((viewportWidth - containerWidth) / 2 - edgePadding));
      setLayoutOffset((current) => (current === computed ? current : computed));
    };
    updateOffset();
    window.addEventListener("resize", updateOffset);
    return () => window.removeEventListener("resize", updateOffset);
  }, [wideLayout]);

  const headerShellClass = clsx(
    "flex w-full items-center justify-between gap-6 py-4",
    "mx-auto max-w-6xl px-6 sm:px-8",
  );

  const mainShellClass = clsx(
    "flex w-full gap-8 py-10 lg:py-12",
    "mx-auto max-w-6xl px-6 sm:px-8",
  );

  const contentClass = "flex-1 min-w-0 mx-auto w-full max-w-5xl";

  const isSidebarActive = useCallback(
    (target: string) => {
      const [targetPath, targetHash] = target.split("#");
      if (targetPath && targetPath !== pathname) {
        return false;
      }
      if (targetHash) {
        return hash === `#${targetHash}`;
      }
      if (targetPath && HASH_AWARE_PATHS.has(targetPath)) {
        return hash === "" || hash === "#";
      }
      return targetPath === pathname;
    },
    [hash, pathname],
  );

  const handleLaunchBoards = useCallback(() => {
    const boardsUrl = getBoardsAppUrl();
    const isExternal = /^https?:\/\//i.test(boardsUrl);
    if (isExternal) {
      window.open(boardsUrl, "_blank", "noopener,noreferrer");
    } else {
      window.location.href = boardsUrl;
    }
  }, []);

  return (
    <div className="min-h-screen bg-white text-neutral-900 transition dark:bg-black dark:text-neutral-100">
      <header className="sticky top-0 z-40 bg-white backdrop-blur-md supports-[backdrop-filter]:backdrop-blur dark:bg-black/95">
        <div className="relative w-full overflow-hidden">
          <div ref={headerRef} className={headerShellClass}>
            <div
              className="flex items-center gap-8 transition-transform duration-300 ease-in-out"
              style={{
                transform: wideLayout ? `translateX(${-layoutOffset}px)` : "translateX(0)",
              }}
            >
              <NavLink
                to="/dashboard"
                end
                className="flex items-center gap-2 text-sm font-semibold tracking-tight text-neutral-700 transition hover:text-neutral-900 dark:text-white dark:hover:text-white"
              >
                OpenDock
              </NavLink>
              <nav className="hidden items-center gap-6 text-sm text-neutral-500 dark:text-neutral-300 sm:flex">
                {navItems.map((item) => (
                  <NavLink
                    key={item.label}
                    to={item.to}
                    end
                    className={({ isActive }) =>
                      clsx(
                        "transition hover:text-neutral-900 dark:hover:text-white",
                        isActive && "text-neutral-900 dark:text-white",
                      )
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>
            </div>
            <div
              className="flex items-center gap-3 transition-transform duration-300 ease-in-out"
              style={{
                transform: wideLayout ? `translateX(${layoutOffset}px)` : "translateX(0)",
              }}
            >
              <button
                type="button"
                onClick={toggleLayout}
                aria-pressed={wideLayout}
                title="Toggle layout"
                className={clsx(
                  "inline-flex size-8 shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium transition-all",
                  "outline-none focus-visible:border-neutral-600 focus-visible:ring-neutral-600/50 focus-visible:ring-[3px]",
                  "disabled:pointer-events-none disabled:opacity-50",
                  "hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800/50 dark:hover:text-neutral-100",
                  "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
                )}
              >
                <span className="sr-only">Toggle layout</span>
                {wideLayout ? (
                  <Minimize className="h-4 w-4" aria-hidden />
                ) : (
                  <Expand className="h-4 w-4" aria-hidden />
                )}
              </button>
              <ThemeToggle />
              <AuthControls
                status={authStatus}
                userName={user?.displayName ?? user?.email ?? ""}
                onSignIn={handleSignIn}
                onSignOut={handleSignOut}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="relative w-full">
        <div className={mainShellClass}>
          <aside
            className="hidden w-64 flex-none bg-white px-6 py-10 text-sm text-neutral-600 backdrop-blur-sm supports-[backdrop-filter]:backdrop-blur dark:bg-black/70 dark:text-neutral-300 lg:block transition-transform duration-300 ease-in-out"
            style={{
              transform: wideLayout ? `translateX(${-layoutOffset}px)` : "translateX(0)",
            }}
          >
            <div className="space-y-10">
              {sidebarSections.map((section) => (
                <div key={section.title}>
                  <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-400 dark:text-neutral-500">
                    {section.title}
                  </h3>
                  <ul className="mt-3 space-y-2">
                    {section.links.map((link) => {
                      if ("launchBoards" in link) {
                        return (
                          <li key={link.label}>
                            <button
                              type="button"
                              onClick={handleLaunchBoards}
                              className="w-full rounded-md px-2 py-1 text-left transition hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-white/10 dark:hover:text-white"
                            >
                              {link.label}
                            </button>
                          </li>
                        );
                      }

                      const target = link.to;
                      return (
                        <li key={link.label}>
                          <NavLink
                            to={target}
                            className={({ isPending }) =>
                              clsx(
                                "block rounded-md px-2 py-1 transition",
                                isPending && "opacity-70",
                                isSidebarActive(target)
                                  ? "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white"
                                  : "hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-white/10 dark:hover:text-white",
                              )
                            }
                          >
                            {link.label}
                          </NavLink>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </aside>
          <div className={contentClass}>
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}

interface AuthControlsProps {
  status: "unauthenticated" | "loading" | "authenticated" | "error";
  userName: string;
  onSignIn: () => void;
  onSignOut: () => void;
}

function AuthControls({ status, userName, onSignIn, onSignOut }: AuthControlsProps) {
  if (status === "loading") {
    return (
      <span className="text-xs font-medium text-neutral-400 dark:text-neutral-500" aria-live="polite">
        Checking session...
      </span>
    );
  }

  if (status === "authenticated" && userName) {
    return (
      <div className="flex items-center gap-2">
        <span className="hidden text-xs font-medium text-neutral-500 dark:text-neutral-300 sm:inline">{userName}</span>
        <button
          type="button"
          onClick={onSignOut}
          className="rounded-full border border-neutral-200 px-3 py-1 text-xs font-semibold text-neutral-600 transition hover:border-neutral-300 hover:text-neutral-900 dark:border-neutral-700 dark:text-neutral-200 dark:hover:border-neutral-500"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onSignIn}
      className="rounded-full border border-neutral-200 px-3 py-1 text-xs font-semibold text-neutral-600 transition hover:border-neutral-300 hover:text-neutral-900 dark:border-neutral-700 dark:text-neutral-200 dark:hover:border-neutral-500"
    >
      Sign in
    </button>
  );
}
