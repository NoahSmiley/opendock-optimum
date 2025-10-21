import { useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { Kanban as KanbanIcon, PanelsTopLeft, UsersRound, Workflow } from "lucide-react";
import { getBoardsAppUrl } from "@/lib/config";

const highlights = [
  {
    icon: PanelsTopLeft,
    title: "Dedicated canvas",
    description:
      "Boards opens in a full-width workspace so columns, swimlanes, and ticket overlays feel spacious.",
  },
  {
    icon: UsersRound,
    title: "Team-focused",
    description:
      "Assign tasks, track sprints, and keep everyone aligned without leaving the OpenDock ecosystem.",
  },
  {
    icon: Workflow,
    title: "Pipeline-aware",
    description:
      "Switch back to the dashboard at any time to correlate work-in-progress with build and deploy status.",
  },
];

export default function BoardsLanding() {
  const boardsUrl = useMemo(() => getBoardsAppUrl(), []);
  const isExternal = useMemo(() => /^https?:\/\//i.test(boardsUrl), [boardsUrl]);

  const handleLaunch = useCallback(() => {
    if (isExternal) {
      window.open(boardsUrl, "_blank", "noopener,noreferrer");
    } else {
      window.location.href = boardsUrl;
    }
  }, [boardsUrl, isExternal]);

  return (
    <div className="space-y-10">
      <section className="overflow-hidden rounded-3xl border border-neutral-200 bg-white/80 px-10 py-12 shadow-sm transition dark:border-white/10 dark:bg-neutral-900/70">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-100 px-4 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-neutral-500 dark:border-white/10 dark:bg-white/10 dark:text-neutral-200">
              <KanbanIcon className="h-3.5 w-3.5" /> Boards
            </span>
            <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-white">
              Plan your delivery runway in a focused workspace.
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-300">
              Boards is a full-screen kanban application built on the same backend as OpenDock. Use it to capture
              backlog ideas, organise sprints, and drag issues across columns without sacrificing deploy context.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleLaunch}
                title={isExternal ? "Launch Boards in a new window" : "Launch Boards"}
                className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
              >
                Launch Boards
              </button>
              <Link
                to="/dashboard"
                className="text-sm text-neutral-500 underline-offset-4 transition hover:text-neutral-900 hover:underline dark:text-neutral-300 dark:hover:text-white"
              >
                Back to dashboard
              </Link>
            </div>
            <p className="text-xs text-neutral-400 dark:text-neutral-500">
              {isExternal ? "Opens in a dedicated window" : "Loads the boards workspace within this domain"}
            </p>
          </div>
          <div className="rounded-3xl border border-neutral-200 bg-white/60 px-6 py-4 text-sm text-neutral-500 shadow-sm dark:border-white/10 dark:bg-neutral-900/60 dark:text-neutral-300">
            <p className="font-medium text-neutral-700 dark:text-neutral-100">Quick start</p>
            <ol className="mt-2 list-decimal space-y-1 pl-4">
              <li>Launch Boards and create a workspace.</li>
              <li>Add teammates and capture backlog cards.</li>
              <li>Drag tickets across columns as you ship.</li>
            </ol>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {highlights.map((highlight) => (
          <div
            key={highlight.title}
            className="rounded-3xl border border-neutral-200 bg-white/70 p-6 shadow-sm transition hover:border-neutral-300 dark:border-white/10 dark:bg-neutral-900/60 dark:hover:border-white/20"
          >
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
              <highlight.icon className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-neutral-900 dark:text-white">{highlight.title}</h2>
            <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-300">{highlight.description}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

