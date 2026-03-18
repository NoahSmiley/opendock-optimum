import { Plus, Kanban } from "lucide-react";
import type { Board } from "@/stores/boards/types";

interface BoardPickerProps {
  boards: Board[];
  onSelectBoard: (boardId: string) => void;
  onCreateBoard: () => void;
}

export function BoardPicker({ boards, onSelectBoard, onCreateBoard }: BoardPickerProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h2 className="text-[15px] font-medium text-white">Your Boards</h2>
          <p className="mt-1.5 text-[13px] text-neutral-500">Select a board or create a new one.</p>
        </div>
        <div className="flex flex-col gap-1">
          {boards.map((board) => (
            <button key={board.id} onClick={() => onSelectBoard(board.id)}
              className="flex items-center gap-3 rounded-md px-3.5 py-2.5 text-left transition-colors hover:bg-white/[0.04]">
              <Kanban className="h-4 w-4 shrink-0 text-neutral-600" />
              <div className="min-w-0">
                <span className="block text-[13px] font-medium text-neutral-200">{board.name}</span>
                {board.description && (
                  <span className="block truncate text-[11px] text-neutral-500">{board.description}</span>
                )}
              </div>
            </button>
          ))}
          <button onClick={onCreateBoard}
            className="flex items-center gap-3 rounded-md border border-dashed border-white/[0.08] px-3.5 py-2.5 text-[13px] text-neutral-500 transition-colors hover:border-white/[0.12] hover:text-neutral-300">
            <Plus className="h-4 w-4" />
            Create new board
          </button>
        </div>
      </div>
    </div>
  );
}
