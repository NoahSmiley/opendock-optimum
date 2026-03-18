import { useState, useEffect } from 'react';
import { Trello, X, Plus, ExternalLink } from 'lucide-react';

interface Board {
  id: string;
  name: string;
  description?: string;
}

interface BoardLinkerProps {
  noteId?: string;
  linkedBoards?: Board[];
  onLink?: (boardId: string) => Promise<void>;
  onUnlink?: (boardId: string) => Promise<void>;
  className?: string;
}

export function BoardLinker({
  linkedBoards = [],
  onLink,
  onUnlink,
  className,
}: BoardLinkerProps) {
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [availableBoards, setAvailableBoards] = useState<Board[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // TODO: Fetch available boards from API
    // For now, using placeholder data
    setAvailableBoards([
      { id: '1', name: 'Product Roadmap', description: 'Q1 2024 Planning' },
      { id: '2', name: 'Sprint Planning', description: 'Current sprint tasks' },
      { id: '3', name: 'Bug Tracking', description: 'Active bugs and issues' },
    ]);
  }, []);

  const handleLink = async (boardId: string) => {
    if (!onLink) return;

    setIsLoading(true);
    try {
      await onLink(boardId);
      setShowLinkDialog(false);
    } catch (error) {
      console.error('Failed to link board:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlink = async (boardId: string) => {
    if (!onUnlink) return;

    if (window.confirm('Remove link to this board?')) {
      setIsLoading(true);
      try {
        await onUnlink(boardId);
      } catch (error) {
        console.error('Failed to unlink board:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const unlinkedBoards = availableBoards.filter(
    (board) => !linkedBoards.some((linked) => linked.id === board.id)
  );

  return (
    <div className={className}>
      <label className="mb-2 block text-xs font-medium text-neutral-600 dark:text-neutral-400">
        Linked Boards
      </label>

      {/* Linked Boards List */}
      {linkedBoards.length > 0 && (
        <div className="mb-3 flex flex-col gap-2">
          {linkedBoards.map((board) => (
            <div
              key={board.id}
              className="group flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800/50"
            >
              <div className="flex items-center gap-2">
                <Trello className="h-4 w-4 text-blue-500" />
                <div>
                  <div className="text-sm font-medium text-neutral-900 dark:text-white">
                    {board.name}
                  </div>
                  {board.description && (
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">
                      {board.description}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    // TODO: Navigate to board
                    console.log('Open board:', board.id);
                  }}
                  className="rounded-md p-1.5 text-neutral-400 opacity-0 transition-all hover:bg-neutral-100 hover:text-neutral-600 group-hover:opacity-100 dark:hover:bg-neutral-700 dark:hover:text-neutral-300"
                  title="Open board"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleUnlink(board.id)}
                  disabled={isLoading}
                  className="rounded-md p-1.5 text-neutral-400 opacity-0 transition-all hover:bg-neutral-100 hover:text-red-600 group-hover:opacity-100 dark:hover:bg-neutral-700 dark:hover:text-red-400"
                  title="Remove link"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Board Button */}
      {onLink && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowLinkDialog(!showLinkDialog)}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:border-neutral-400 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:border-neutral-600 dark:hover:bg-neutral-800"
          >
            <Plus className="h-4 w-4" />
            Link to Board
          </button>

          {/* Board Selection Dropdown */}
          {showLinkDialog && (
            <div className="absolute left-0 right-0 top-full z-10 mt-2 max-h-64 overflow-y-auto rounded-lg border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
              {unlinkedBoards.length > 0 ? (
                unlinkedBoards.map((board) => (
                  <button
                    key={board.id}
                    type="button"
                    onClick={() => handleLink(board.id)}
                    disabled={isLoading}
                    className="flex w-full items-start gap-3 border-b border-neutral-100 px-4 py-3 text-left transition-colors last:border-0 hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-800 dark:hover:bg-neutral-800/50"
                  >
                    <Trello className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-neutral-900 dark:text-white">
                        {board.name}
                      </div>
                      {board.description && (
                        <div className="text-xs text-neutral-500 dark:text-neutral-400">
                          {board.description}
                        </div>
                      )}
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-center text-sm text-neutral-500 dark:text-neutral-400">
                  All boards are already linked
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {linkedBoards.length === 0 && !onLink && (
        <div className="text-xs text-neutral-400 dark:text-neutral-500">
          No boards linked
        </div>
      )}
    </div>
  );
}
