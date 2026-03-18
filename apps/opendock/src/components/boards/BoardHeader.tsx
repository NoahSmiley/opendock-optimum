import { ChevronDown, Search, Settings } from "lucide-react";
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
  onOpenSettings?: () => void;
}

const VIEWS: { label: string; view: BoardView }[] = [
  { label: "Overview", view: "overview" },
  { label: "Board", view: "board" },
  { label: "Backlog", view: "backlog" },
];

export function BoardHeader({
  board, boards, ticketCount, search, onSearchChange, onSelectBoard,
  activeView, onViewChange, onOpenSettings,
}: BoardHeaderProps) {
  return (
    <header className="flex w-full flex-shrink-0 flex-col">
      <div className="flex w-full items-center gap-4 px-5 pt-6 pb-3 lg:px-8">
        <BoardSelector board={board} boards={boards} onSelect={onSelectBoard} />
        <span className="text-[11px] tabular-nums text-neutral-500">{ticketCount}</span>
        <div className="ml-auto flex items-center gap-2">
          <label className="flex items-center gap-2 rounded-md border border-white/[0.06] bg-transparent px-2.5 py-1.5 text-[13px] text-neutral-300 focus-within:border-white/[0.12]">
            <Search className="h-3.5 w-3.5 text-neutral-500" />
            <input value={search} onChange={(e) => onSearchChange(e.target.value)} placeholder="Search..."
              className="w-36 border-none bg-transparent p-0 text-[13px] text-neutral-300 placeholder:text-neutral-600 focus:outline-none focus:ring-0" />
          </label>
          {onOpenSettings && (
            <button onClick={onOpenSettings}
              className="rounded-md border border-white/[0.06] p-1.5 text-neutral-500 transition hover:bg-white/[0.03] hover:text-neutral-300">
              <Settings className="h-3.5 w-3.5" />
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
    <div className="flex gap-0 border-b border-white/[0.04] px-5 lg:px-8">
      {VIEWS.map(({ label, view }) => (
        <button key={view} onClick={() => onViewChange(view)}
          className={clsx("relative px-3 py-2 text-[12px] font-medium transition-colors",
            activeView === view ? "text-neutral-200" : "text-neutral-500 hover:text-neutral-300")}>
          {label}
          {activeView === view && <span className="absolute inset-x-1 bottom-0 h-[1.5px] rounded-full bg-neutral-200" />}
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
        className="flex items-center gap-1.5 text-[15px] font-medium text-white transition-colors hover:text-neutral-300">
        {board.name}
        <ChevronDown className={clsx("h-3.5 w-3.5 text-neutral-500 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 min-w-[180px] rounded-lg border border-white/[0.08] bg-neutral-900 py-1 shadow-2xl">
          {boards.map((b) => (
            <button key={b.id} onClick={() => { onSelect(b.id); setOpen(false); }}
              className={clsx("flex w-full items-center px-3 py-1.5 text-left text-[13px] transition-colors",
                b.id === board.id ? "bg-white/[0.05] text-white" : "text-neutral-400 hover:bg-white/[0.03] hover:text-white")}>
              {b.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
