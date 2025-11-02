import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white dark:bg-dark-bg">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-neutral-900 dark:text-white">404</h1>
        <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-400">
          Page not found
        </p>
        <Link
          to="/dashboard"
          className="mt-6 inline-block rounded-md bg-neutral-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
