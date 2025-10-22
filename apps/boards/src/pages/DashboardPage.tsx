import { useEffect, useMemo, useState } from "react";
import type { KanbanBoard, ProjectsResponse } from "@opendock/shared/types";
import { boardsApi, projectsApi } from "@/lib/api";
import { Loader2, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

interface DashboardState {
  boards: KanbanBoard[];
  projects: ProjectsResponse["projects"];
  loading: boolean;
  error: string | null;
}

export function DashboardPage() {
  const [{ boards, projects, loading, error }, setState] = useState<DashboardState>({
    boards: [],
    projects: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    const load = async () => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));
        const [boardsResponse, projectsResponse] = await Promise.all([
          boardsApi.listBoards(),
          projectsApi.listProjects(),
        ]);
        setState({
          boards: boardsResponse.boards,
          projects: projectsResponse.projects,
          loading: false,
          error: null,
        });
      } catch (err) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err.message : "Unable to load dashboard data.",
        }));
      }
    };
    void load();
  }, []);

  const totalTickets = useMemo(
    () => boards.reduce((sum, board) => sum + board.tickets.length, 0),
    [boards],
  );
  const linkedBoards = useMemo(
    () => boards.filter((board) => Boolean(board.projectId)).length,
    [boards],
  );
  const teamMembers = useMemo(() => {
    const memberIds = new Set<string>();
    boards.forEach((board) => board.memberIds.forEach((id) => memberIds.add(id)));
    return memberIds.size;
  }, [boards]);

  const busyBoards = useMemo(
    () =>
      [...boards]
        .sort((a, b) => b.tickets.length - a.tickets.length)
        .slice(0, 5),
    [boards],
  );

  const activeProjects = useMemo(
    () =>
      projects
        .map((project) => ({
          project,
          linkedBoards: boards.filter((board) => board.projectId === project.id).length,
        }))
        .sort((a, b) => b.linkedBoards - a.linkedBoards)
        .slice(0, 5),
    [projects, boards],
  );

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">Workspace overview</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Track planning momentum and understand how boards map to deployment projects.
        </p>
      </header>

      {error ? (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-600 dark:border-rose-400/30 dark:text-rose-200">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="flex items-center justify-center rounded-xl border border-neutral-200 bg-white p-12 text-sm text-neutral-500 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading dashboard…
        </div>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-400 dark:text-neutral-500">Boards</p>
              <p className="mt-3 text-3xl font-semibold text-neutral-900 dark:text-white">{boards.length}</p>
              <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">Active kanban surfaces</p>
            </article>
            <article className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-400 dark:text-neutral-500">Tickets</p>
              <p className="mt-3 text-3xl font-semibold text-neutral-900 dark:text-white">{totalTickets}</p>
              <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">Total work items across boards</p>
            </article>
            <article className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-400 dark:text-neutral-500">Linked boards</p>
              <p className="mt-3 text-3xl font-semibold text-neutral-900 dark:text-white">{linkedBoards}</p>
              <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">Boards pointing at projects</p>
            </article>
            <article className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-400 dark:text-neutral-500">Contributors</p>
              <p className="mt-3 text-3xl font-semibold text-neutral-900 dark:text-white">{teamMembers}</p>
              <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">Unique members assigned to work</p>
            </article>
          </section>

          <section className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <div className="rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 dark:border-neutral-800">
                <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-neutral-400 dark:text-neutral-500">Busy boards</h2>
                <Link
                  to="/boards"
                  className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.3em] text-neutral-400 transition hover:text-neutral-900 dark:text-neutral-500 dark:hover:text-white"
                >
                  View all <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
              <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {busyBoards.length === 0 ? (
                  <li className="px-6 py-6 text-sm text-neutral-500 dark:text-neutral-400">No boards yet.</li>
                ) : (
                  busyBoards.map((board) => (
                    <li key={board.id} className="flex items-center justify-between px-6 py-4 text-sm">
                      <div>
                        <p className="font-semibold text-neutral-900 dark:text-white">{board.name}</p>
                        <p className="text-xs text-neutral-400 dark:text-neutral-500">{board.tickets.length} tickets</p>
                      </div>
                      <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                        {board.projectId ? "Linked" : "Unlinked"}
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <div className="border-b border-neutral-200 px-6 py-4 dark:border-neutral-800">
                <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-neutral-400 dark:text-neutral-500">Active projects</h2>
              </div>
              <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {activeProjects.length === 0 ? (
                  <li className="px-6 py-6 text-sm text-neutral-500 dark:text-neutral-400">No projects created yet.</li>
                ) : (
                  activeProjects.map(({ project, linkedBoards: linked }) => (
                    <li key={project.id} className="flex items-center justify-between px-6 py-4 text-sm">
                      <div>
                        <p className="font-semibold text-neutral-900 dark:text-white">{project.name}</p>
                        <p className="text-xs text-neutral-400 dark:text-neutral-500">{linked} linked boards</p>
                      </div>
                      <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                        {project.latestBuild ? "Active" : "Pending"}
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default DashboardPage;
