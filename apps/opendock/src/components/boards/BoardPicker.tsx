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
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h2 className="text-lg font-semibold text-white">Your Boards</h2>
          <p className="mt-1 text-sm text-neutral-500">Select a board to get started, or create a new one.</p>
        </div>
        <div className="flex flex-col gap-1.5">
          {boards.map((board) => (
            <button key={board.id} onClick={() => onSelectBoard(board.id)}
              className="flex items-center gap-3 rounded-lg border border-neutral-800/50 bg-neutral-900/50 px-4 py-3 text-left transition-colors hover:border-neutral-700 hover:bg-neutral-800/50">
              <Kanban className="h-4 w-4 shrink-0 text-neutral-500" />
              <div className="min-w-0">
                <span className="block text-sm font-medium text-white">{board.name}</span>
                {board.description && (
                  <span className="block truncate text-xs text-neutral-500">{board.description}</span>
                )}
              </div>
            </button>
          ))}
          <button onClick={onCreateBoard}
            className="flex items-center gap-3 rounded-lg border border-dashed border-neutral-800 px-4 py-3 text-sm text-neutral-500 transition-colors hover:border-neutral-600 hover:text-neutral-300">
            <Plus className="h-4 w-4" />
            Create new board
          </button>
        </div>
      </div>
    </div>
  );
}
