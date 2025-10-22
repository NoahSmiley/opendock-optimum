import { useEffect, useMemo, useState } from "react";
import type { KanbanBoard, ProjectsResponse } from "@opendock/shared/types";
import { boardsApi, projectsApi } from "@/lib/api";
import { Loader2, Link as LinkIcon } from "lucide-react";
import { Link } from "react-router-dom";

interface LinkState {
  success?: string;
  error?: string;
}

export function ProjectsPage() {
  const [boards, setBoards] = useState<KanbanBoard[]>([]);
  const [projects, setProjects] = useState<ProjectsResponse["projects"]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [linkState, setLinkState] = useState<LinkState>({});
  const [updatingBoardId, setUpdatingBoardId] = useState<string | null>(null);

  const refresh = async () => {
    try {
      setError(null);
      setLoading(true);
      const [kanbanResponse, projectsResponse] = await Promise.all([
        boardsApi.listBoards(),
        projectsApi.listProjects(),
      ]);
      setBoards(kanbanResponse.boards);
      setProjects(projectsResponse.projects);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load workspace data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const projectOptions = useMemo(
    () =>
      projects
        .map((project) => ({ value: project.id, label: project.name }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [projects],
  );

  const boardsWithProjects = useMemo(() => {
    const projectMap = new Map(projects.map((project) => [project.id, project]));
    return boards
      .map((board) => ({
        board,
        project: board.projectId ? projectMap.get(board.projectId) ?? null : null,
      }))
      .sort((a, b) => a.board.name.localeCompare(b.board.name));
  }, [boards, projects]);

  const handleProjectLinkChange = async (boardId: string, projectId: string) => {
    setUpdatingBoardId(boardId);
    try {
      const response = await boardsApi.updateBoard(boardId, { projectId: projectId || null });
      const updated = response.board;
      setBoards((prev) =>
        prev.map((board) =>
          board.id === updated.id
            ? { ...board, projectId: updated.projectId, name: updated.name, description: updated.description }
            : board,
        ),
      );
      setLinkState({ success: "Board link updated." });
    } catch (err) {
      setLinkState({ error: err instanceof Error ? err.message : "Unable to update board." });
    } finally {
      setUpdatingBoardId(null);
      window.setTimeout(() => setLinkState({}), 3000);
    }
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">Projects & boards</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Link kanban boards to deployment projects so releases, builds, and roadmap context stay in sync.
        </p>
        <div className="flex items-center gap-3 text-xs text-neutral-400 dark:text-neutral-500">
          <button
            type="button"
            onClick={() => void refresh()}
            className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 font-semibold text-neutral-500 transition hover:border-neutral-300 hover:text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-neutral-500"
          >
            Refresh data
          </button>
          {linkState.success ? (
            <span className="text-emerald-500 dark:text-emerald-300">{linkState.success}</span>
          ) : null}
          {linkState.error ? (
            <span className="text-rose-500 dark:text-rose-300">{linkState.error}</span>
          ) : null}
        </div>
      </header>

      {error ? (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-600 dark:border-rose-400/30 dark:text-rose-200">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="flex items-center justify-center rounded-xl border border-neutral-200 bg-white p-12 text-sm text-neutral-500 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading workspace…
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <div className="border-b border-neutral-200 px-6 py-4 dark:border-neutral-800">
              <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-neutral-400 dark:text-neutral-500">
                Boards
              </h2>
            </div>
            <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {boardsWithProjects.length === 0 ? (
                <p className="px-6 py-8 text-sm text-neutral-500 dark:text-neutral-400">No boards available.</p>
              ) : (
                boardsWithProjects.map(({ board, project }) => (
                  <div key={board.id} className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-neutral-900 dark:text-white">{board.name}</p>
                      <p className="text-xs text-neutral-400 dark:text-neutral-500">
                        {project ? `Linked to ${project.name}` : "Not linked to a project"}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 sm:min-w-[220px]">
                      <select
                        value={board.projectId ?? ""}
                        onChange={(event) => void handleProjectLinkChange(board.id, event.target.value)}
                        disabled={updatingBoardId === board.id}
                        className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700 transition focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-200 disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:focus:border-neutral-500 dark:focus:ring-neutral-700"
                      >
                        <option value="">No project</option>
                        {projectOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <Link
                        to="/boards"
                        className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.3em] text-neutral-400 transition hover:text-neutral-900 dark:text-neutral-500 dark:hover:text-white"
                      >
                        <LinkIcon className="h-3 w-3" /> View board
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <aside className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-neutral-400 dark:text-neutral-500">
              Projects
            </h2>
            <ul className="mt-4 space-y-3 text-sm text-neutral-600 dark:text-neutral-300">
              {projects.map((project) => (
                <li key={project.id} className="flex flex-col gap-1 rounded-lg border border-neutral-200 bg-white/70 p-3 dark:border-neutral-700 dark:bg-neutral-900/60">
                  <span className="font-semibold text-neutral-900 dark:text-white">{project.name}</span>
                  <span className="text-xs text-neutral-400 dark:text-neutral-500">{project.branch}</span>
                  {project.latestBuild ? (
                    <span className="text-xs text-neutral-400 dark:text-neutral-500">
                      Last build: {new Date(project.latestBuild.createdAt).toLocaleString()}
                    </span>
                  ) : (
                    <span className="text-xs text-neutral-400 dark:text-neutral-500">No builds yet</span>
                  )}
                </li>
              ))}
            </ul>
          </aside>
        </div>
      )}
    </div>
  );
}

export default ProjectsPage;
