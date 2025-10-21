export default function AboutPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-white">What is OpenDock?</h1>
        <p className="max-w-3xl text-sm text-neutral-500 dark:text-neutral-300">
          OpenDock is a devops workbench for builders who want Heroku-like acceleration with Shadcn-inspired calm. It stitches together repo onboarding, build automation, deployments, and kanban planning into a cohesive experience you can run locally or host.
        </p>
      </header>
      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-neutral-200 bg-white/80 p-6 shadow-sm dark:border-white/10 dark:bg-neutral-900/70">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Built for focus</h2>
          <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-300">
            Shadcn-inspired spacing, type, and contrasts keep the interface calm even when pipelines spike. Cards surface the data you need while staying scannable.
          </p>
        </div>
        <div className="rounded-3xl border border-neutral-200 bg-white/80 p-6 shadow-sm dark:border-white/10 dark:bg-neutral-900/70">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Run it anywhere</h2>
          <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-300">
            The backend is a lightweight Express service with file-based persistence. Swap in your own queue, docker runtime, or database when you are ready.
          </p>
        </div>
      </section>
      <section className="rounded-3xl border border-neutral-200 bg-white/80 p-6 shadow-sm dark:border-white/10 dark:bg-neutral-900/70">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Using OpenDock</h2>
        <ol className="mt-4 list-decimal space-y-2 pl-4 text-sm text-neutral-500 dark:text-neutral-300">
          <li>Connect a GitHub repository from the dashboard to trigger the first build automatically.</li>
          <li>Follow builds, deployments, and health status from calm overview cards.</li>
          <li>Open the Boards workspace to plan sprints and drag issues through completion.</li>
        </ol>
      </section>
    </div>
  );
}
