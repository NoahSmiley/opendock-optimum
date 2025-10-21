const roadmap = [
  {
    title: "Phase 1 — Today",
    items: [
      "Workspace split with shared library",
      "Shadcn-inspired shell with theme toggle",
      "Dedicated Boards app for kanban",
    ],
  },
  {
    title: "Phase 2 — Upcoming",
    items: [
      "Docker-based deployment runner",
      "Real-time log streaming",
      "Invite and role-based access",
    ],
  },
  {
    title: "Phase 3 — Later",
    items: [
      "Insights dashboard with trends",
      "Native GitHub App integration",
      "Notification webhooks (Slack/email)",
    ],
  },
];

export default function RoadmapPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-white">Roadmap</h1>
        <p className="max-w-2xl text-sm text-neutral-500 dark:text-neutral-300">
          A high-level view of where OpenDock is heading. Each phase blends delivery automation with the calm, spacious UI cues of shadcn/ui.
        </p>
      </header>
      <div className="grid gap-4 md:grid-cols-3">
        {roadmap.map((entry) => (
          <section
            key={entry.title}
            className="rounded-3xl border border-neutral-200 bg-white/80 p-6 shadow-sm transition hover:border-neutral-300 dark:border-white/10 dark:bg-neutral-900/70 dark:hover:border-white/20"
          >
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">{entry.title}</h2>
            <ul className="mt-4 space-y-2 text-sm text-neutral-500 dark:text-neutral-300">
              {entry.items.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-neutral-400 dark:bg-neutral-300" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
