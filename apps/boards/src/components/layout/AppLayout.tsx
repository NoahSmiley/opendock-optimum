import { useState, useCallback, useEffect, useRef } from "react";
import type { ComponentType, SVGProps } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Menu, LayoutDashboard, KanbanSquare, BookText, Rocket, Info } from "lucide-react";
import { ThemeToggle } from "@/theme-toggle";
import { UserMenu } from "./UserMenu";

interface NavItem {
  label: string;
  to: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  exact?: boolean;
}

const navItems: NavItem[] = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Boards", to: "/boards", icon: KanbanSquare },
  { label: "Projects", to: "/projects", icon: Rocket },
  { label: "Roadmap", to: "/roadmap", icon: BookText },
  { label: "About", to: "/about", icon: Info },
];

function MobileNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        onClose();
      }
    };
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={containerRef}
      className="absolute left-4 right-4 top-16 z-40 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg dark:border-neutral-800 dark:bg-neutral-900 lg:hidden"
    >
      <nav className="flex flex-col py-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            className={({ isActive }) =>
              [
                "flex items-center gap-3 px-5 py-2 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white",
                isActive ? "text-neutral-900 dark:text-white" : "",
              ].join(" ")
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export function AppLayout() {
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);
  useEffect(() => {
    closeMobileNav();
  }, [location, closeMobileNav]);

  return (
    <div className="flex min-h-screen bg-white text-neutral-900 transition-colors dark:bg-dark-bg dark:text-neutral-100">
      <aside className="hidden w-64 flex-shrink-0 bg-white px-6 py-4 dark:bg-dark-bg lg:flex">
        <div className="flex w-full flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">OpenDock</span>
              <span className="text-neutral-300 dark:text-neutral-700">/</span>
              <span className="text-sm font-semibold text-neutral-900 dark:text-white">Workspace</span>
            </div>
          </div>
          <nav className="flex flex-1 flex-col gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                className={({ isActive }) =>
                  [
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                    isActive
                      ? "bg-neutral-900 text-white shadow-sm dark:bg-white dark:text-neutral-900"
                      : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white",
                  ].join(" ")
                }
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="hidden lg:flex">
            <ThemeToggle />
          </div>
        </div>
      </aside>
      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-30 bg-white px-4 py-4 dark:bg-dark-bg">
          <div className="flex items-center justify-between">
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-500 transition hover:text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:text-white lg:hidden"
              aria-label="Toggle navigation"
              onClick={() => setMobileNavOpen((value) => !value)}
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="flex flex-1 justify-end gap-2">
              <div className="lg:hidden">
                <ThemeToggle />
              </div>
              <UserMenu />
            </div>
          </div>
          <MobileNav open={mobileNavOpen} onClose={closeMobileNav} />
        </header>
        <main className="flex flex-1 flex-col bg-white px-4 py-6 dark:bg-dark-bg sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
