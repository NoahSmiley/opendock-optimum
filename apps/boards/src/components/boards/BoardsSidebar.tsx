import { Fragment } from "react";
import {
  BarChart3,
  CalendarClock,
  Expand,
  Kanban as KanbanIcon,
  LayoutGrid,
  ListChecks,
  Minimize,
  Plus,
  Rocket,
  Settings2,
  FileCode2,
  Loader2,
} from "lucide-react";
import clsx from "clsx";
import type { KanbanBoard } from "@opendock/shared/types";
import type { BoardFormState } from "./forms/types";

const sidebarSections = [
  {
    title: "Planning",
    items: [
      { label: "Timeline", icon: CalendarClock, active: false },
      { label: "Kanban board", icon: KanbanIcon, active: true },
      { label: "Reports", icon: BarChart3, active: false },
    ],
  },
  {
    title: "Project",
    items: [
      { label: "Issues", icon: ListChecks, active: false },
      { label: "Components", icon: LayoutGrid, active: false },
    ],
  },
  {
    title: "Development",
    items: [
      { label: "Code", icon: FileCode2, active: false },
      { label: "Releases", icon: Rocket, active: false },
    ],
  },
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
      <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">
        Board name
        <input
          required
          value={boardForm.name}
          onChange={handleChange("name")}
          className="mt-2 w-full rounded-md border border-slate-200/60 bg-white/80 px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200/60 dark:border-white/15 dark:bg-white/5 dark:text-white dark:focus:border-white/30 dark:focus:ring-white/15"
        />
      </label>
      <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">
        Description
        <textarea
          value={boardForm.description}
          onChange={handleChange("description")}
          rows={3}
          className="mt-2 w-full rounded-md border border-slate-200/60 bg-white/80 px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200/60 dark:border-white/15 dark:bg-white/5 dark:text-white dark:focus:border-white/30 dark:focus:ring-white/15"
        />
      </label>
      <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">
        Members
        <input
          value={boardForm.members}
          onChange={handleChange("members")}
          placeholder="Comma separated names"
          className="mt-2 w-full rounded-md border border-slate-200/60 bg-white/80 px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200/60 dark:border-white/15 dark:bg-white/5 dark:text-white dark:focus:border-white/30 dark:focus:ring-white/15"
        />
      </label>
      <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">
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
}: BoardsSidebarProps) {
  return (
    <aside
      className={clsx(
        "fixed left-0 top-0 hidden h-screen flex-shrink-0 flex-col overflow-y-auto bg-white pb-6 pt-4 transition-all duration-300 dark:bg-black lg:flex",
        collapsed ? "w-16 px-3" : "w-64 px-6",
      )}
    >
      <div className="mb-6 flex items-center justify-between gap-2">
        <div
          className={clsx(
            "flex items-center gap-2 overflow-hidden transition-all duration-300",
            collapsed ? "w-0 opacity-0" : "w-auto opacity-100",
          )}
        >
          <span className="whitespace-nowrap text-sm font-semibold text-neutral-700 dark:text-neutral-300">OpenDock</span>
          <span className="text-neutral-300 dark:text-neutral-700">/</span>
          <span className="whitespace-nowrap text-sm font-semibold text-neutral-900 dark:text-white">Boards</span>
        </div>
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="rounded-md p-2 text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <Expand className="h-4 w-4" /> : <Minimize className="h-4 w-4" />}
        </button>
      </div>
      <div
        className={clsx(
          "mb-6 flex items-center justify-between gap-2 overflow-hidden transition-all duration-300",
          collapsed ? "max-h-0 opacity-0" : "max-h-20 opacity-100",
        )}
      >
        <div>
          <p className="whitespace-nowrap text-xs text-neutral-400 dark:text-neutral-500">Projects</p>
          <p className="mt-1 whitespace-nowrap text-base font-semibold text-neutral-900 dark:text-white">Beyond Gravity</p>
        </div>
        <button
          type="button"
          className="rounded-md p-2 text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
        >
          <Settings2 className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-6 flex-1 space-y-8 overflow-y-auto">
        {sidebarSections.map((section) => (
          <div key={section.title}>
            <p
              className={clsx(
                "overflow-hidden text-xs font-semibold uppercase text-neutral-400 transition-all duration-300 dark:text-neutral-500",
                collapsed ? "max-h-0 opacity-0" : "max-h-10 opacity-100",
              )}
            >
              {section.title}
            </p>
            <ul className={clsx("space-y-1", !collapsed && "mt-3")}>
              {section.items.map((item) => (
                <li key={item.label}>
                  <button
                    type="button"
                    className={clsx(
                      "flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white",
                      item.active && "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white",
                      collapsed && "justify-center",
                    )}
                    title={item.label}
                  >
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    <span
                      className={clsx(
                        "overflow-hidden whitespace-nowrap transition-all duration-300",
                        collapsed ? "w-0 opacity-0" : "w-auto opacity-100",
                      )}
                    >
                      {item.label}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div
          className={clsx(
            "overflow-hidden transition-all duration-300",
            collapsed ? "max-h-0 opacity-0" : "max-h-[500px] opacity-100",
          )}
        >
          <div className="flex items-center justify-between text-xs uppercase text-neutral-400 dark:text-neutral-500">
            <span className="whitespace-nowrap">Boards</span>
            <span>{boards.length}</span>
          </div>
          <div className="mt-3 space-y-1">
            {boards.length > 0 ? (
              boards.map((board) => (
                <button
                  key={board.id}
                  type="button"
                  onClick={() => onSelectBoard(board.id)}
                  className={clsx(
                    "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white",
                    selectedBoardId === board.id && "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white",
                  )}
                >
                  <span className="truncate">{board.name}</span>
                  <span className="text-xs text-neutral-400 dark:text-neutral-500">{board.tickets.length}</span>
                </button>
              ))
            ) : (
              <p className="text-sm text-neutral-500 dark:text-neutral-500">No boards yet.</p>
            )}
          </div>
        </div>
      </div>
      <div
        className={clsx(
          "mt-6 overflow-hidden border-t border-neutral-200 pt-4 transition-all duration-300 dark:border-neutral-800",
          collapsed ? "max-h-0 opacity-0" : "max-h-20 opacity-100",
        )}
      >
        <button
          type="button"
          onClick={onToggleBoardForm}
          className="flex w-full items-center justify-center gap-2 rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:hover:bg-neutral-800"
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
    </aside>
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
}: BoardsSidebarMobileProps) {
  return (
    <>
      <div className="rounded-xl border border-slate-200/70 bg-white/80 p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">
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
                  "flex w-full items-center justify-between rounded-lg border border-transparent bg-white/70 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900 dark:bg-white/10 dark:text-slate-300 dark:hover:border-white/20 dark:hover:text-white",
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
      <div className="mt-4 rounded-xl border border-slate-200/70 bg-white/80 p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
        <button
          type="button"
          onClick={onToggleBoardForm}
          className="flex w-full items-center justify-center gap-2 rounded-md border border-slate-200/70 bg-white/70 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
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
