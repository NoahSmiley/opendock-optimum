import { Fragment, useState } from "react";
import {
  Plus,
  Settings2,
  Loader2,
} from "lucide-react";
import clsx from "clsx";
import type { KanbanBoard, KanbanUser } from "@opendock/shared/types";
import type { BoardFormState } from "./forms/types";
import { ThemeToggle } from "@/theme-toggle";
import { CreateBoardModal } from "../CreateBoardModal";

const sidebarSections = [
  {
    title: "Views",
    items: [
      { label: "Overview", tab: "timeline" as const },
      { label: "Board", tab: "kanban" as const },
      { label: "Backlog", tab: "issues" as const },
    ],
  },
  {
    title: "Settings",
    items: [
      { label: "Board Settings", tab: "settings" as const },
    ],
  },
] as const;

const primaryNavItems = [
  { label: "Overview", tab: "timeline" as const },
  { label: "Board", tab: "kanban" as const },
  { label: "Backlog", tab: "issues" as const },
] as const;

export type BoardTab = "timeline" | "kanban" | "issues" | "settings";

interface BoardsSidebarProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  boards: KanbanBoard[];
  users?: KanbanUser[];
  selectedBoardId: string | null;
  onSelectBoard: (boardId: string) => void;
  onCreateBoard: (data: {
    name: string;
    description?: string;
    members: Array<{ id?: string; name: string }>;
    projectId?: string;
  }) => Promise<void>;
  projectOptions: Array<{ value: string; label: string }>;
  activeTab: BoardTab;
  onTabChange: (tab: BoardTab) => void;
}

export function BoardsSidebar({
  collapsed,
  onToggleCollapsed,
  boards,
  users = [],
  selectedBoardId,
  onSelectBoard,
  onCreateBoard,
  projectOptions,
  activeTab,
  onTabChange,
}: BoardsSidebarProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  return (
    <>
      <header className="fixed left-0 right-0 top-0 z-50 hidden items-center justify-between bg-white/95 px-10 py-6 text-sm text-neutral-500 shadow-sm backdrop-blur dark:bg-neutral-950/80 dark:text-neutral-300 lg:flex xl:px-12">
        <div className="flex items-center gap-10 -ml-1.5">
          <div className="flex items-center gap-2 font-semibold text-neutral-700 dark:text-neutral-200">
            <span>OpenDock</span>
            <span className="text-neutral-300 dark:text-neutral-600">/</span>
            <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-xs font-semibold text-white dark:bg-neutral-200 dark:text-neutral-900">Boards</span>
          </div>
          <nav className="flex items-center gap-3 text-xs">
            {primaryNavItems.map((item) => (
              <button
                key={item.tab}
                type="button"
                onClick={() => onTabChange(item.tab)}
                className={clsx(
                  "rounded-md px-2.5 py-1 transition hover:text-neutral-900 dark:hover:text-white",
                  activeTab === item.tab &&
                    "bg-neutral-100 text-neutral-900 dark:bg-white/10 dark:text-white"
                )}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
        <ThemeToggle />
      </header>
      <aside
        className="fixed left-0 top-0 hidden h-screen w-[240px] flex-shrink-0 flex-col bg-white dark:bg-neutral-950 lg:flex"
      >
        <div className="flex h-full min-h-0 flex-col gap-4 overflow-auto overflow-x-hidden px-10 pb-8 pt-28 no-scrollbar">
          {/* Projects Section */}
          <div className="flex w-full flex-col gap-1.5">
            <div className="text-xs font-semibold tracking-wide text-neutral-400/90 dark:text-neutral-400/70">
              Projects
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-neutral-900 dark:text-white">Beyond Gravity</span>
            <button
              type="button"
              className="rounded-md p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
            >
              <Settings2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Navigation Sections */}
            <div className="mt-6 flex min-h-0 flex-1 flex-col gap-7">
          {sidebarSections.map((section) => (
            <div key={section.title} className="flex w-full flex-col gap-1">
              <span className="flex h-8 shrink-0 items-center text-xs font-semibold text-neutral-400/90 dark:text-neutral-400/70">
                {section.title}
              </span>
              <ul className="flex w-full flex-col gap-0.5">
                {section.items.map((item) => {
                  const isActive = activeTab === item.tab;
                  return (
                    <li key={item.label}>
                      <button
                        type="button"
                        onClick={() => onTabChange(item.tab)}
                        className={clsx(
                          "group relative flex h-[30px] w-full items-center justify-start overflow-visible rounded-md border border-transparent px-0 text-left text-[0.8rem] font-medium text-neutral-600 transition-colors outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-200 dark:text-neutral-300 dark:focus-visible:ring-neutral-700",
                          isActive ? "text-neutral-900 dark:text-neutral-100" : "hover:text-neutral-900 dark:hover:text-white"
                        )}
                      >
                        <span className="relative -ml-2 inline-flex min-w-0 max-w-full items-center overflow-hidden px-2 py-1">
                          <span
                            className={clsx(
                              "pointer-events-none absolute inset-0 rounded-full transition-colors",
                              isActive
                                ? "bg-neutral-100 dark:bg-neutral-800"
                                : "bg-transparent group-hover:bg-neutral-100 dark:group-hover:bg-neutral-800/70"
                            )}
                          />
                          <span className="relative z-10 truncate">{item.label}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          {/* Boards Section */}
          <div className="flex w-full flex-col gap-1">
            <div className="flex h-8 items-center justify-between text-xs font-semibold text-neutral-400/90 dark:text-neutral-400/70">
              <span>Boards</span>
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="rounded p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
                title="Create Board"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex w-full flex-col gap-0.5">
              {boards.length > 0 ? (
                boards.map((board) => {
                  const isSelected = selectedBoardId === board.id;
                  return (
                    <li key={board.id} className="group flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => onSelectBoard(board.id)}
                        className={clsx(
                          "group relative flex h-8 max-w-[80%] flex-1 items-center justify-start overflow-visible rounded-md border border-transparent px-0 text-left text-[0.8rem] font-medium text-neutral-600 transition-colors outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-200 dark:text-neutral-300 dark:focus-visible:ring-neutral-700",
                          isSelected ? "text-neutral-900 dark:text-neutral-100" : "hover:text-neutral-900 dark:hover:text-white"
                        )}
                      >
                        <span className="relative -ml-2 inline-flex min-w-0 max-w-full items-center overflow-hidden px-2 py-1">
                          <span
                            className={clsx(
                              "pointer-events-none absolute inset-0 rounded-full transition-colors",
                              isSelected
                                ? "bg-neutral-100 dark:bg-neutral-800"
                                : "bg-transparent group-hover:bg-neutral-100 dark:group-hover:bg-neutral-800/70"
                            )}
                          />
                          <span className="relative z-10 truncate">{board.name}</span>
                        </span>
                      </button>
                      <span
                        className={clsx(
                          "text-xs font-medium text-neutral-400 transition-colors dark:text-neutral-500",
                          isSelected
                            ? "text-neutral-500 dark:text-neutral-400"
                            : "group-hover:text-neutral-500 dark:group-hover:text-neutral-300"
                        )}
                      >
                        {board.tickets.length}
                      </span>
                    </li>
                  );
                })
              ) : (
                <p className="text-[0.8rem] font-medium text-neutral-500 dark:text-white/70">No boards yet.</p>
              )}
            </div>
          </div>
        </div>
        </div>
      </aside>

      {/* Create Board Modal */}
      <CreateBoardModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={async (data) => {
          await onCreateBoard(data);
          setShowCreateModal(false);
        }}
        projects={projectOptions}
        existingUsers={users}
      />
    </>
  );
}

interface BoardsSidebarMobileProps {
  boards: KanbanBoard[];
  users?: KanbanUser[];
  selectedBoardId: string | null;
  onSelectBoard: (boardId: string) => void;
  onCreateBoard: (data: {
    name: string;
    description?: string;
    members: Array<{ id?: string; name: string }>;
    projectId?: string;
  }) => Promise<void>;
  projectOptions: Array<{ value: string; label: string }>;
  activeTab: BoardTab;
  onTabChange: (tab: BoardTab) => void;
}

export function BoardsSidebarMobile({
  boards,
  users = [],
  selectedBoardId,
  onSelectBoard,
  onCreateBoard,
  projectOptions,
  activeTab,
  onTabChange,
}: BoardsSidebarMobileProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  return (
    <>
      <div className="mb-4 flex items-center justify-between rounded-xl border border-slate-200/70 bg-white/80 p-4 shadow-sm dark:border-white/10 dark:bg-neutral-900/70">
        <div className="flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-200">
          <span>OpenDock</span>
          <span className="text-neutral-300 dark:text-neutral-600">/</span>
          <span className="text-neutral-900 dark:text-white">Boards</span>
        </div>
        <nav className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
          {primaryNavItems.map((item) => (
            <button
              key={item.tab}
              type="button"
              onClick={() => onTabChange(item.tab)}
              className={clsx(
                "rounded-md px-2 py-1 transition hover:text-neutral-900 dark:hover:text-white",
                activeTab === item.tab &&
                  "bg-neutral-100 text-neutral-900 dark:bg-white/10 dark:text-white"
              )}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="rounded-xl border border-slate-200/70 bg-white/80 p-4 shadow-sm dark:border-white/10 dark:bg-neutral-900/70">
        <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
          <span>Boards</span>
          <span>{boards.length}</span>
        </div>
        <div className="mt-3 space-y-2">
          {boards.length > 0 ? (
            boards.map((board) => (
              <button
                key={board.id}
                type="button"
                onClick={() => onSelectBoard(board.id)}
                className={clsx(
                  "flex w-full items-center justify-between rounded-lg border border-transparent bg-white/70 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900 dark:bg-neutral-900/60 dark:text-slate-300 dark:hover:border-white/20 dark:hover:text-white",
                  selectedBoardId === board.id &&
                    "border-slate-900 bg-slate-900/80 text-white shadow-sm dark:border-white/30 dark:bg-white/15 dark:text-white",
                )}
              >
                <span className="truncate">{board.name}</span>
                <span className="text-xs text-slate-400 dark:text-slate-500">{board.tickets.length}</span>
              </button>
            ))
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-500/80">No boards yet.</p>
          )}
        </div>
      </div>
      <div className="mt-4 rounded-xl border border-slate-200/70 bg-white/80 p-4 shadow-sm dark:border-white/10 dark:bg-neutral-900/70">
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="flex w-full items-center justify-center gap-2 rounded-md border border-slate-200/70 bg-white/70 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white dark:border-white/10 dark:bg-neutral-900/60 dark:text-white dark:hover:bg-neutral-900/40"
        >
          <Plus className="h-4 w-4" />
          Create New Board
        </button>
      </div>

      {/* Create Board Modal */}
      <CreateBoardModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={async (data) => {
          await onCreateBoard(data);
          setShowCreateModal(false);
        }}
        projects={projectOptions}
        existingUsers={users}
      />
    </>
  );
}
