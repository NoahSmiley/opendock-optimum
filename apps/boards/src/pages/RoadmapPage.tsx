export function RoadmapPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">Product roadmap</h1>
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          High-level milestones showcasing what the boards experience will deliver next.
        </p>
      </header>
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">Now</h2>
          <ul className="mt-3 space-y-2 text-sm text-neutral-600 dark:text-neutral-300">
            <li>Authentication-first workspace</li>
            <li>Routing foundations for multi-surface navigation</li>
            <li>Refined kanban board management</li>
          </ul>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">Next</h2>
          <ul className="mt-3 space-y-2 text-sm text-neutral-600 dark:text-neutral-300">
            <li>Advanced reporting & velocity metrics</li>
            <li>Automations between deploys and board events</li>
            <li>Roadmap visualizations with cross-team dependencies</li>
          </ul>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 md:col-span-2">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">Later</h2>
          <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-300">
            Future iterations will connect releases, incidents, and analytics into a single command center for engineering managers and
            operators. This roadmap section will expand with timelines as the refactor progresses.
          </p>
        </div>
      </section>
    </div>
  );
}

export default RoadmapPage;
