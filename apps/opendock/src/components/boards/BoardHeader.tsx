import { ChevronDown, Search, CheckSquare, Settings } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import clsx from "clsx";
import type { BoardView } from "@/pages/BoardsPage";
import type { Board } from "@/stores/boards/types";

interface BoardHeaderProps {
  board: Board;
  boards: Board[];
  ticketCount: number;
  search: string;
  onSearchChange: (v: string) => void;
  onSelectBoard: (boardId: string) => void;
  activeView: BoardView;
  onViewChange: (view: BoardView) => void;
  selectionMode?: boolean;
  onToggleSelectionMode?: () => void;
  onOpenSettings?: () => void;
}

const VIEWS: { label: string; view: BoardView }[] = [
  { label: "Overview", view: "overview" },
  { label: "Board", view: "board" },
  { label: "Backlog", view: "backlog" },
];

export function BoardHeader({
  board, boards, ticketCount, search, onSearchChange, onSelectBoard,
  activeView, onViewChange, selectionMode = false, onToggleSelectionMode, onOpenSettings,
}: BoardHeaderProps) {
  return (
    <header className="flex w-full flex-shrink-0 flex-col bg-neutral-950/80 shadow-sm backdrop-blur">
      <div className="flex w-full flex-col gap-3 px-4 pt-7 pb-4 sm:px-6 lg:flex-row lg:items-start lg:justify-between lg:px-8 xl:px-10">
        <div className="flex items-baseline gap-3 lg:min-w-[280px]">
          <BoardSelector board={board} boards={boards} onSelect={onSelectBoard} />
          <span className="text-xs text-neutral-500">
            {ticketCount} ticket{ticketCount !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex w-full items-center gap-2 sm:justify-end lg:ml-auto lg:max-w-[500px]">
          <label className="flex flex-1 items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900/50 px-3 py-1.5 text-sm text-neutral-100 focus-within:border-neutral-600 focus-within:ring-1 focus-within:ring-neutral-600/20">
            <Search className="h-4 w-4 shrink-0 text-neutral-500" />
            <input value={search} onChange={(e) => onSearchChange(e.target.value)} placeholder="Search..."
              className="w-full border-none bg-transparent p-0 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-0" />
          </label>
          {onToggleSelectionMode && (
            <button onClick={onToggleSelectionMode}
              className={clsx("flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm font-medium transition",
                selectionMode ? "border-blue-500 bg-blue-500 text-white hover:bg-blue-600"
                  : "border-neutral-800 bg-neutral-900/50 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800")}
              title={selectionMode ? "Exit selection mode" : "Select multiple tickets"}>
              <CheckSquare className="h-4 w-4" />
            </button>
          )}
          {onOpenSettings && (
            <button onClick={onOpenSettings}
              className="flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900/50 px-2.5 py-1.5 text-sm font-medium text-neutral-400 transition hover:text-neutral-200 hover:bg-neutral-800"
              title="Board settings">
              <Settings className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      <ViewTabs activeView={activeView} onViewChange={onViewChange} />
    </header>
  );
}

function ViewTabs({ activeView, onViewChange }: { activeView: BoardView; onViewChange: (v: BoardView) => void }) {
  return (
    <div className="flex gap-1 border-t border-neutral-800/50 px-4 sm:px-6 lg:px-8 xl:px-10">
      {VIEWS.map(({ label, view }) => (
        <button key={view} onClick={() => onViewChange(view)}
          className={clsx("relative px-3 py-2.5 text-xs font-medium transition-colors",
            activeView === view ? "text-white" : "text-neutral-500 hover:text-neutral-300")}>
          {label}
          {activeView === view && <span className="absolute inset-x-0 bottom-0 h-px bg-white" />}
        </button>
      ))}
    </div>
  );
}

function BoardSelector({ board, boards, onSelect }: { board: Board; boards: Board[]; onSelect: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-lg font-semibold text-white hover:text-neutral-200 transition-colors">
        {board.name}
        <ChevronDown className={clsx("h-4 w-4 text-neutral-400 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 min-w-[180px] rounded-lg border border-neutral-800 bg-neutral-900 py-1 shadow-xl">
          {boards.map((b) => (
            <button key={b.id} onClick={() => { onSelect(b.id); setOpen(false); }}
              className={clsx("flex w-full items-center px-3 py-1.5 text-left text-sm transition-colors",
                b.id === board.id ? "bg-neutral-800 text-white" : "text-neutral-400 hover:bg-neutral-800/50 hover:text-white")}>
              {b.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
