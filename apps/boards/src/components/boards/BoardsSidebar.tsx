import { Fragment } from "react";
import {
  Plus,
  Settings2,
  Loader2,
} from "lucide-react";
import clsx from "clsx";
import type { KanbanBoard } from "@opendock/shared/types";
import type { BoardFormState } from "./forms/types";
import { ThemeToggle } from "@/theme-toggle";

const sidebarSections = [
  {
    title: "Planning",
    items: [
      { label: "Timeline", tab: "timeline" as const },
      { label: "Kanban board", tab: "kanban" as const },
      { label: "Reports", tab: "reports" as const },
    ],
  },
  {
    title: "Project",
    items: [
      { label: "Issues", tab: "issues" as const },
      { label: "Components", tab: "components" as const },
    ],
  },
  {
    title: "Development",
    items: [
      { label: "Code", tab: "code" as const },
      { label: "Releases", tab: "releases" as const },
    ],
  },
  {
    title: "Board",
    items: [
      { label: "Settings", tab: "settings" as const },
    ],
  },
] as const;

const primaryNavItems = [
  { label: "Overview", tab: "timeline" as const },
  { label: "Board", tab: "kanban" as const },
  { label: "Backlog", tab: "issues" as const },
] as const;

interface BoardFormFieldsProps {
  boardForm: BoardFormState;
  onBoardFormChange: (field: keyof BoardFormState, value: string) => void;
  projectOptions: Array<{ value: string; label: string }>;
  projectsLoading: boolean;
  projectsError: string | null;
  creatingBoard: boolean;
}

function BoardFormFields({
  boardForm,
  onBoardFormChange,
  projectOptions,
  projectsLoading,
  projectsError,
  creatingBoard,
}: BoardFormFieldsProps) {
  const handleChange =
    (field: keyof BoardFormState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      onBoardFormChange(field, event.target.value);
    };

  return (
    <Fragment>
      <label className="text-xs font-semibold text-slate-400 dark:text-slate-500">
        Board name
        <input
          required
          value={boardForm.name}
          onChange={handleChange("name")}
          className="mt-2 w-full rounded-md border border-slate-200/60 bg-white/80 px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200/60 dark:border-white/15 dark:bg-white/5 dark:text-white dark:focus:border-white/30 dark:focus:ring-white/15"
        />
      </label>
      <label className="text-xs font-semibold text-slate-400 dark:text-slate-500">
        Description
        <textarea
          value={boardForm.description}
          onChange={handleChange("description")}
          rows={3}
          className="mt-2 w-full rounded-md border border-slate-200/60 bg-white/80 px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200/60 dark:border-white/15 dark:bg-white/5 dark:text-white dark:focus:border-white/30 dark:focus:ring-white/15"
        />
      </label>
      <label className="text-xs font-semibold text-slate-400 dark:text-slate-500">
        Members
        <input
          value={boardForm.members}
          onChange={handleChange("members")}
          placeholder="Comma separated names"
          className="mt-2 w-full rounded-md border border-slate-200/60 bg-white/80 px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200/60 dark:border-white/15 dark:bg-white/5 dark:text-white dark:focus:border-white/30 dark:focus:ring-white/15"
        />
      </label>
      <label className="text-xs font-semibold text-slate-400 dark:text-slate-500">
        Project
        <select
          value={boardForm.projectId}
          onChange={handleChange("projectId")}
          disabled={projectsLoading}
          className="mt-2 w-full rounded-md border border-slate-200/60 bg-white/80 px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200/60 dark:border-white/15 dark:bg-white/5 dark:text-white dark:focus:border-white/30 dark:focus:ring-white/15 disabled:opacity-60"
        >
          <option value="">No project</option>
          {projectOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      {projectsError ? (
        <p className="text-xs text-rose-500 dark:text-rose-300">{projectsError}</p>
      ) : null}
      <button
        type="submit"
        disabled={creatingBoard}
        className="flex w-full items-center justify-center gap-2 rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
      >
        {creatingBoard ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        Create board
      </button>
    </Fragment>
  );
}

export type BoardTab = "timeline" | "kanban" | "reports" | "issues" | "components" | "code" | "releases" | "settings";

interface BoardsSidebarProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  boards: KanbanBoard[];
  selectedBoardId: string | null;
  onSelectBoard: (boardId: string) => void;
  showBoardForm: boolean;
  onToggleBoardForm: () => void;
  boardForm: BoardFormState;
  onBoardFormChange: (field: keyof BoardFormState, value: string) => void;
  creatingBoard: boolean;
  onCreateBoard: (event: React.FormEvent<HTMLFormElement>) => void;
  projectsLoading: boolean;
  projectsError: string | null;
  projectOptions: Array<{ value: string; label: string }>;
  activeTab: BoardTab;
  onTabChange: (tab: BoardTab) => void;
}

export function BoardsSidebar({
  collapsed,
  onToggleCollapsed,
  boards,
  selectedBoardId,
  onSelectBoard,
  showBoardForm,
  onToggleBoardForm,
  boardForm,
  onBoardFormChange,
  creatingBoard,
  onCreateBoard,
  projectsLoading,
  projectsError,
  projectOptions,
  activeTab,
  onTabChange,
}: BoardsSidebarProps) {
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
              <span>{boards.length}</span>
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
    </>
  );
}

interface BoardsSidebarMobileProps {
  boards: KanbanBoard[];
  selectedBoardId: string | null;
  onSelectBoard: (boardId: string) => void;
  showBoardForm: boolean;
  onToggleBoardForm: () => void;
  boardForm: BoardFormState;
  onBoardFormChange: (field: keyof BoardFormState, value: string) => void;
  creatingBoard: boolean;
  onCreateBoard: (event: React.FormEvent<HTMLFormElement>) => void;
  projectsLoading: boolean;
  projectsError: string | null;
  projectOptions: Array<{ value: string; label: string }>;
  activeTab: BoardTab;
  onTabChange: (tab: BoardTab) => void;
}

export function BoardsSidebarMobile({
  boards,
  selectedBoardId,
  onSelectBoard,
  showBoardForm,
  onToggleBoardForm,
  boardForm,
  onBoardFormChange,
  creatingBoard,
  onCreateBoard,
  projectsLoading,
  projectsError,
  projectOptions,
  activeTab,
  onTabChange,
}: BoardsSidebarMobileProps) {
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
          onClick={onToggleBoardForm}
          className="flex w-full items-center justify-center gap-2 rounded-md border border-slate-200/70 bg-white/70 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white dark:border-white/10 dark:bg-neutral-900/60 dark:text-white dark:hover:bg-neutral-900/40"
        >
          <Plus className="h-4 w-4" />
          New board
        </button>
        {showBoardForm ? (
          <form className="mt-4 space-y-3" onSubmit={onCreateBoard}>
            <BoardFormFields
              boardForm={boardForm}
              onBoardFormChange={onBoardFormChange}
              projectOptions={projectOptions}
              projectsLoading={projectsLoading}
              projectsError={projectsError}
              creatingBoard={creatingBoard}
            />
          </form>
        ) : null}
      </div>
    </>
  );
}
