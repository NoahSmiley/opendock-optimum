import { useEffect, useMemo, useState } from "react";
import type { KanbanBoard, KanbanUser } from "@opendock/shared/types";
import { boardsApi } from "@/lib/api";
import {
  Loader2,
  Plus,
  Settings,
  ChevronRight,
  Hash,
  Layers
} from "lucide-react";
import { Link } from "react-router-dom";
import { CreateBoardModal } from "@/components/CreateBoardModal";
import clsx from "clsx";

interface LinkState {
  success?: string;
  error?: string;
}

export function ProjectsPage() {
  const [boards, setBoards] = useState<KanbanBoard[]>([]);
  const [users, setUsers] = useState<KanbanUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [linkState, setLinkState] = useState<LinkState>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [, setCreatingBoard] = useState(false);

  const refresh = async () => {
    try {
      setError(null);
      setLoading(true);
      const kanbanResponse = await boardsApi.listBoards();
      setBoards(kanbanResponse.boards);
      setUsers(kanbanResponse.users || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load workspace data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const projectOptions: Array<{ value: string; label: string }> = [];

  const boardsWithStats = useMemo(() => {
    return boards
      .map((board) => {
        const ticketCount = board.tickets?.length || 0;
        const memberCount = board.members?.length || 0;
        const columnCount = board.columns?.length || 0;
        const highPriorityCount = board.tickets?.filter(t => t.priority === "high").length || 0;

        return {
          board,
          stats: {
            tickets: ticketCount,
            members: memberCount,
            columns: columnCount,
            highPriority: highPriorityCount,
          }
        };
      })
      .sort((a, b) => {
        // Sort by most active (ticket count) first
        const diff = b.stats.tickets - a.stats.tickets;
        if (diff !== 0) return diff;
        return a.board.name.localeCompare(b.board.name);
      });
  }, [boards]);

  const handleCreateBoard = async (data: {
    name: string;
    description?: string;
    members: Array<{ id?: string; name: string }>;
    projectId?: string;
  }) => {
    setCreatingBoard(true);
    try {
      await boardsApi.createBoard({
        name: data.name,
        description: data.description,
        projectId: data.projectId,
        members: data.members.map(m => ({ name: m.name })),
      });
      await refresh();
      setShowCreateModal(false);
      setLinkState({ success: `Board "${data.name}" created successfully!` });
      setTimeout(() => setLinkState({}), 3000);
    } catch (err) {
      setLinkState({ error: err instanceof Error ? err.message : "Unable to create board." });
      setTimeout(() => setLinkState({}), 5000);
      throw err;
    } finally {
      setCreatingBoard(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Boards</h1>
              <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                Manage your kanban boards
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              <Plus className="h-4 w-4" />
              Create Board
            </button>
          </div>

          {/* Status Messages */}
          {(linkState.success || linkState.error) && (
            <div className="mt-4">
              {linkState.success && (
                <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                  {linkState.success}
                </div>
              )}
              {linkState.error && (
                <div className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
                  {linkState.error}
                </div>
              )}
            </div>
          )}
        </div>

        {error && !loading && (
          <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-300">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center rounded-lg border border-neutral-200 bg-white p-16 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex items-center gap-3 text-neutral-500 dark:text-neutral-400">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading workspace data...</span>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Boards Grid */}
            <div className="lg:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Active Boards ({boardsWithStats.length})
                </h2>
                <button
                  onClick={() => void refresh()}
                  className="text-xs font-medium text-neutral-500 transition hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                >
                  Refresh
                </button>
              </div>

              {boardsWithStats.length === 0 ? (
                <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-12 text-center dark:border-neutral-700 dark:bg-neutral-900">
                  <Layers className="mx-auto h-12 w-12 text-neutral-400 dark:text-neutral-600" />
                  <h3 className="mt-4 text-sm font-semibold text-neutral-900 dark:text-white">No boards yet</h3>
                  <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                    Create your first board to start organizing tasks
                  </p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                  >
                    <Plus className="h-4 w-4" />
                    Create Your First Board
                  </button>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {boardsWithStats.map(({ board, stats }) => (
                    <div
                      key={board.id}
                      className="group relative overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm transition hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
                    >
                      {/* Board Header */}
                      <div className="border-b border-neutral-100 p-4 dark:border-neutral-800">
                        <div className="flex items-start justify-between">
                          <div className="min-w-0 flex-1">
                            <h3 className="flex items-center gap-2 text-base font-semibold text-neutral-900 dark:text-white">
                              <Hash className="h-4 w-4 text-neutral-400" />
                              <span className="truncate">{board.name}</span>
                            </h3>
                            {board.description && (
                              <p className="mt-1 line-clamp-2 text-xs text-neutral-500 dark:text-neutral-400">
                                {board.description}
                              </p>
                            )}
                          </div>
                          <Link
                            to={`/boards?boardId=${board.id}`}
                            className="rounded p-1.5 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
                          >
                            <Settings className="h-4 w-4" />
                          </Link>
                        </div>
                      </div>

                      {/* Board Stats */}
                      <div className="grid grid-cols-4 gap-px bg-neutral-100 dark:bg-neutral-800">
                        <div className="bg-white px-3 py-2 dark:bg-neutral-900">
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">Tickets</p>
                          <p className="text-lg font-semibold text-neutral-900 dark:text-white">{stats.tickets}</p>
                        </div>
                        <div className="bg-white px-3 py-2 dark:bg-neutral-900">
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">Members</p>
                          <p className="text-lg font-semibold text-neutral-900 dark:text-white">{stats.members}</p>
                        </div>
                        <div className="bg-white px-3 py-2 dark:bg-neutral-900">
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">Columns</p>
                          <p className="text-lg font-semibold text-neutral-900 dark:text-white">{stats.columns}</p>
                        </div>
                        <div className="bg-white px-3 py-2 dark:bg-neutral-900">
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">High Pri</p>
                          <p className={clsx(
                            "text-lg font-semibold",
                            stats.highPriority > 0
                              ? "text-rose-600 dark:text-rose-400"
                              : "text-neutral-900 dark:text-white"
                          )}>
                            {stats.highPriority}
                          </p>
                        </div>
                      </div>

                      {/* Board Actions */}
                      <Link
                        to={`/boards?boardId=${board.id}`}
                        className="flex items-center justify-between bg-neutral-50 px-4 py-3 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 dark:bg-neutral-800/50 dark:text-neutral-300 dark:hover:bg-neutral-800"
                      >
                        <span>Open Board</span>
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Workspace Overview
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">Total Boards</span>
                    <span className="text-sm font-semibold text-neutral-900 dark:text-white">{boards.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">Total Tickets</span>
                    <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                      {boards.reduce((acc, b) => acc + (b.tickets?.length || 0), 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">Team Members</span>
                    <span className="text-sm font-semibold text-neutral-900 dark:text-white">{users.length}</span>
                  </div>
                </div>
              </div>

              {/* Team Members */}
              {users.length > 0 && (
                <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                    Team Members
                  </h3>
                  <div className="flex -space-x-2">
                    {users.slice(0, 8).map((user) => (
                      <div
                        key={user.id}
                        className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-neutral-200 text-xs font-semibold text-neutral-700 dark:border-neutral-900 dark:bg-neutral-700 dark:text-neutral-300"
                        title={user.name}
                      >
                        {user.name.slice(0, 2).toUpperCase()}
                      </div>
                    ))}
                    {users.length > 8 && (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-neutral-100 text-xs font-medium text-neutral-600 dark:border-neutral-900 dark:bg-neutral-800 dark:text-neutral-400">
                        +{users.length - 8}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Create Board Modal */}
        <CreateBoardModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateBoard}
          projects={projectOptions}
          existingUsers={users}
        />
      </div>
    </div>
  );
}

export default ProjectsPage;
