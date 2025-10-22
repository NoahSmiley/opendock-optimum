import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "./theme-toggle";

export function PublicHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    { name: "Features", href: "/features" },
    { name: "Pricing", href: "/pricing" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-neutral-800 dark:bg-black/80 dark:supports-[backdrop-filter]:bg-black/60">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-neutral-900 dark:text-white">OpenDock</span>
          </Link>
        </div>

        {/* Desktop navigation */}
        <div className="hidden md:flex md:items-center md:gap-8">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`text-sm font-medium transition ${
                isActive(item.href)
                  ? "text-neutral-900 dark:text-white"
                  : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <div className="hidden md:flex md:items-center md:gap-4">
            <Link
              to="/auth?mode=login"
              className="text-sm font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white"
            >
              Sign in
            </Link>
            <Link
              to="/auth?mode=register"
              className="inline-flex items-center rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md p-2 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="sr-only">Open main menu</span>
            {mobileMenuOpen ? (
              <X className="h-6 w-6" aria-hidden="true" />
            ) : (
              <Menu className="h-6 w-6" aria-hidden="true" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          <div className="space-y-1 px-4 pb-3 pt-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`block rounded-md px-3 py-2 text-base font-medium ${
                  isActive(item.href)
                    ? "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white"
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <div className="mt-4 flex flex-col gap-2 px-3">
              <Link
                to="/auth?mode=login"
                className="block text-center text-base font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign in
              </Link>
              <Link
                to="/auth?mode=register"
                className="block rounded-full bg-neutral-900 px-4 py-2 text-center text-base font-semibold text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
