export function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">About OpenDock Boards</h1>
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          Documentation describing how planning and delivery fit together across the platform.
        </p>
      </header>
      <article className="space-y-4 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
          The boards workspace orchestrates product delivery: backlog grooming, sprint planning, execution, and retrospectives.
          This documentation suite will eventually outline conventions, workflow guides, and integrations with build & deploy
          pipelines housed in OpenDock.
        </p>
        <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
          Expect deep dives on ticket hygiene, sprint cadences, and cross-project reporting once the refactor lands. Until then,
          the section acts as a placeholder so routing and navigation can wire up end-to-end.
        </p>
      </article>
    </div>
  );
}

export default AboutPage;
