import { useCallback, useEffect, useRef, useState } from "react";
import type { KanbanTicket } from "@opendock/shared/types";
import clsx from "clsx";
import { useTheme } from "@/theme-provider";
import { ThemeToggle } from "@/theme-toggle";
import { TicketDetailModal } from "@/components/TicketDetailModal";
import { BoardsSidebar, BoardsSidebarMobile, type BoardTab } from "@/components/boards/BoardsSidebar";
import { BoardToolbar } from "@/components/boards/BoardToolbar";
import { BoardSettingsModal } from "@/components/boards/BoardSettingsModal";
import { SettingsPage } from "@/components/boards/SettingsPage";
import { BulkActionsToolbar } from "@/components/boards/BulkActionsToolbar";
import { BulkMoveModal } from "@/components/boards/BulkMoveModal";
import { BulkAssignModal } from "@/components/boards/BulkAssignModal";
import { OverviewTab } from "@/components/boards/OverviewTab";
import { BacklogTab } from "@/components/boards/BacklogTab";
import { BoardKanbanView } from "@/components/boards/BoardKanbanView";
import { QuickFilters, applyQuickFilters, type QuickFilter } from "@/components/boards/QuickFilters";
import { KeyboardShortcutsHelp } from "@/components/KeyboardShortcutsHelp";
import { useBoardsData } from "@/hooks/useBoardsData";
import { useBoardFilters } from "@/hooks/useBoardFilters";
import { useBoardActions } from "@/hooks/useBoardActions";
import { useKeyboardShortcuts, type ShortcutHandler } from "@/hooks/useKeyboardShortcuts";
import { boardsApi } from "@/lib/api";

function BoardsAppInner() {
  const {
    boards,
    users,
    loading,
    error,
    setError,
    selectedBoardId,
    setSelectedBoardId,
    refreshBoards,
    selectedBoard,
    projectOptions,
    mutateBoards,
  } = useBoardsData();

  const mutateAsync = useCallback(async () => {
    mutateBoards((boards) => boards);
  }, [mutateBoards]);

  const [activeTab, setActiveTab] = useState<BoardTab>("kanban");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [showBoardSettings, setShowBoardSettings] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedTicketIds, setSelectedTicketIds] = useState<Set<string>>(new Set());
  const [showBulkMoveModal, setShowBulkMoveModal] = useState(false);
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);
  const [quickFilters, setQuickFilters] = useState<QuickFilter[]>([]);
  const mutationInProgressRef = useRef<string | null>(null);
  const mutationAppliedRef = useRef(false);

  const {
    columnTicketMap,
    activeComposerColumnId,
    setActiveComposerColumnId,
    setColumnDrafts,
    creatingColumnTicketId,
    getColumnDraft,
    updateColumnDraft,
    handleColumnComposerOpen,
    handleColumnComposerCancel,
    handleColumnTicketSubmit,
    handleTicketUpdate,
    handleAddComment,
    handleDeleteComment,
    handleDeleteTicket,
    handleRenameColumn,
    handleUpdateColumnWipLimit,
    handleDeleteColumn,
  } = useBoardActions({ selectedBoard, refreshBoards, setError, mutateBoards: mutateAsync });

  const {
    searchQuery,
    setSearchQuery,
    showUnassignedOnly,
    setShowUnassignedOnly,
    recentOnly,
    setRecentOnly,
    filteredTicketMap,
    resetFilters,
  } = useBoardFilters({ selectedBoard, columnTicketMap });

  // Handle ticket reordering with careful optimistic updates
  const handleReorderTicket = useCallback(async (ticketId: string, toColumnId: string, toIndex: number) => {
    if (!selectedBoard) return;

    // Guard against duplicate calls during the same operation using ref
    const callKey = `${ticketId}-${toColumnId}-${toIndex}`;
    if (mutationInProgressRef.current === callKey) {
      return;
    }
    mutationInProgressRef.current = callKey;
    setTimeout(() => {
      mutationInProgressRef.current = null;
    }, 200);

    // Suppress stream events for 1000ms to prevent double updates
    if (typeof (window as any).__suppressTicketReorderEvents === "function") {
      (window as any).__suppressTicketReorderEvents(1000);
    }

    // Optimistically update - use array reordering approach
    mutateBoards((boards) => {
      // Check if mutation was already applied using ref
      if (mutationAppliedRef.current) {
        return boards;
      }

      // Check if this ticket has already been moved to the destination
      const currentBoard = boards.find((b) => b.id === selectedBoard.id);
      if (currentBoard) {
        const currentTicket = currentBoard.tickets.find((t) => t.id === ticketId);
        if (currentTicket && currentTicket.columnId === toColumnId && currentTicket.order === toIndex) {
          return boards;
        }
      }

      // Mark mutation as applied
      mutationAppliedRef.current = true;
      setTimeout(() => {
        mutationAppliedRef.current = false;
      }, 100);

      return boards.map((board) => {
        if (board.id !== selectedBoard.id) return board;

        const ticket = board.tickets.find((t) => t.id === ticketId);
        if (!ticket) return board;

        const fromColumnId = ticket.columnId;
        const isSameColumn = fromColumnId === toColumnId;

        if (isSameColumn) {
          // Same column: reorder within the same array
          const columnTickets = board.tickets
            .filter((t) => t.columnId === toColumnId)
            .sort((a, b) => a.order - b.order);

          // Remove from old position
          const ticketIndex = columnTickets.findIndex((t) => t.id === ticketId);
          const [removed] = columnTickets.splice(ticketIndex, 1);

          // Insert at new position
          columnTickets.splice(toIndex, 0, removed);

          // Update order
          const updatedColumnTickets = columnTickets.map((t, idx) => ({ ...t, order: idx }));

          // Merge with other columns
          const otherTickets = board.tickets.filter((t) => t.columnId !== toColumnId);
          return { ...board, tickets: [...otherTickets, ...updatedColumnTickets] };
        } else {
          // Different column: remove from source, add to destination
          const sourceTickets = board.tickets
            .filter((t) => t.columnId === fromColumnId && t.id !== ticketId)
            .sort((a, b) => a.order - b.order)
            .map((t, idx) => ({ ...t, order: idx }));

          const destTickets = board.tickets
            .filter((t) => t.columnId === toColumnId)
            .sort((a, b) => a.order - b.order);

          // Insert at position
          destTickets.splice(toIndex, 0, { ...ticket, columnId: toColumnId, order: toIndex });
          const updatedDestTickets = destTickets.map((t, idx) => ({ ...t, order: idx }));

          // Merge all tickets
          const otherTickets = board.tickets.filter((t) => t.columnId !== fromColumnId && t.columnId !== toColumnId);
          return { ...board, tickets: [...otherTickets, ...sourceTickets, ...updatedDestTickets] };
        }
      });
    });

    // Call API in background
    try {
      await boardsApi.reorderTicket(selectedBoard.id, {
        ticketId,
        toColumnId,
        toIndex,
      });
    } catch (err) {
      console.error("Failed to reorder ticket:", err);
      setError(err instanceof Error ? err.message : "Failed to move ticket");
      refreshBoards();
    }
  }, [selectedBoard, mutateBoards, setError, refreshBoards]);

  const handleToggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  const handleSelectBoard = useCallback((boardId: string) => {
    setSelectedBoardId(boardId);
  }, [setSelectedBoardId]);

  // Bulk selection handlers
  const handleToggleSelectionMode = useCallback(() => {
    setSelectionMode((prev) => !prev);
    if (selectionMode) {
      // Clear selections when exiting selection mode
      setSelectedTicketIds(new Set());
    }
  }, [selectionMode]);

  const handleToggleTicketSelection = useCallback((ticketId: string) => {
    setSelectedTicketIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(ticketId)) {
        newSet.delete(ticketId);
      } else {
        newSet.add(ticketId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (!selectedBoard) return;
    const allTicketIds = new Set(selectedBoard.tickets.map((t) => t.id));
    setSelectedTicketIds(allTicketIds);
  }, [selectedBoard]);

  const handleClearSelection = useCallback(() => {
    setSelectedTicketIds(new Set());
    setSelectionMode(false);
  }, []);

  const handleBulkDelete = useCallback(async () => {
    if (!selectedBoard || selectedTicketIds.size === 0) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedTicketIds.size} ticket${selectedTicketIds.size > 1 ? 's' : ''}?`
    );

    if (!confirmed) return;

    try {
      // Delete tickets one by one (we'll implement bulk API later)
      for (const ticketId of selectedTicketIds) {
        await handleDeleteTicket(ticketId);
      }
      setSelectedTicketIds(new Set());
      setSelectionMode(false);
    } catch (error) {
      console.error("Failed to delete tickets:", error);
      setError("Failed to delete some tickets");
    }
  }, [selectedBoard, selectedTicketIds, handleDeleteTicket, setError]);

  const handleBulkMove = useCallback(() => {
    setShowBulkMoveModal(true);
  }, []);

  const handleBulkMoveConfirm = useCallback(async (targetColumnId: string) => {
    if (!selectedBoard || selectedTicketIds.size === 0) return;

    try {
      const columnOrder = new Map(
        selectedBoard.columns
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((column, index) => [column.id, index]),
      );

      const ticketsToMove = selectedBoard.tickets
        .filter((ticket) => selectedTicketIds.has(ticket.id) && ticket.columnId !== targetColumnId)
        .sort((a, b) => {
          const columnRankA = columnOrder.get(a.columnId) ?? Number.MAX_SAFE_INTEGER;
          const columnRankB = columnOrder.get(b.columnId) ?? Number.MAX_SAFE_INTEGER;
          if (columnRankA === columnRankB) {
            return a.order - b.order;
          }
          return columnRankA - columnRankB;
        });

      let nextIndex = selectedBoard.tickets.filter((t) => t.columnId === targetColumnId).length;

      for (const ticket of ticketsToMove) {
        await boardsApi.reorderTicket(selectedBoard.id, {
          ticketId: ticket.id,
          toColumnId: targetColumnId,
          toIndex: nextIndex,
        });
        nextIndex += 1;
      }
      await refreshBoards();
      setSelectedTicketIds(new Set());
      setSelectionMode(false);
      setShowBulkMoveModal(false);
    } catch (error) {
      console.error("Failed to move tickets:", error);
      setError("Failed to move some tickets");
    }
  }, [selectedBoard, selectedTicketIds, refreshBoards, setError]);

  const handleBulkAssign = useCallback(() => {
    setShowBulkAssignModal(true);
  }, []);

  const handleBulkAssignConfirm = useCallback(async (assigneeIds: string[]) => {
    if (!selectedBoard || selectedTicketIds.size === 0) return;

    try {
      // Assign tickets one by one (we'll implement bulk API later)
      for (const ticketId of selectedTicketIds) {
        await boardsApi.updateTicket(ticketId, { assigneeIds });
      }
      await refreshBoards();
      setSelectedTicketIds(new Set());
      setSelectionMode(false);
      setShowBulkAssignModal(false);
    } catch (error) {
      console.error("Failed to assign tickets:", error);
      setError("Failed to assign some tickets");
    }
  }, [selectedBoard, selectedTicketIds, refreshBoards, setError]);

  useEffect(() => {
    resetFilters();
    setActiveComposerColumnId(null);
    setColumnDrafts({});
    setSelectionMode(false);
    setSelectedTicketIds(new Set());
  }, [resetFilters, selectedBoardId, setActiveComposerColumnId, setColumnDrafts]);

  // Keyboard shortcuts
  const shortcuts: ShortcutHandler[] = [
    // General
    {
      key: "/",
      description: "Focus search",
      handler: () => {
        const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement;
        searchInput?.focus();
      },
    },
    {
      key: "Escape",
      description: "Close panels/modals",
      handler: () => {
        if (selectedTicketId) {
          setSelectedTicketId(null);
        } else if (showBoardSettings) {
          setShowBoardSettings(false);
        } else if (selectionMode) {
          setSelectionMode(false);
          setSelectedTicketIds(new Set());
        }
      },
    },
    // Navigation
    {
      key: "g",
      shift: true,
      description: "Navigate to boards",
      handler: () => setActiveTab("kanban"),
    },
    {
      key: "b",
      shift: true,
      description: "Navigate to backlog",
      handler: () => setActiveTab("issues"),
    },
    {
      key: "o",
      shift: true,
      description: "Navigate to overview",
      handler: () => setActiveTab("timeline"),
    },
    // Board switching
    {
      key: "[",
      description: "Previous board",
      handler: () => {
        if (!boards.length) return;
        const currentIndex = boards.findIndex(b => b.id === selectedBoardId);
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : boards.length - 1;
        setSelectedBoardId(boards[prevIndex].id);
      },
    },
    {
      key: "]",
      description: "Next board",
      handler: () => {
        if (!boards.length) return;
        const currentIndex = boards.findIndex(b => b.id === selectedBoardId);
        const nextIndex = currentIndex < boards.length - 1 ? currentIndex + 1 : 0;
        setSelectedBoardId(boards[nextIndex].id);
      },
    },
    // Selection and bulk actions
    {
      key: "a",
      meta: true,
      description: "Select all tickets",
      handler: () => {
        if (selectionMode && selectedBoard) {
          const allTicketIds = new Set(
            Object.values(filteredTicketMap).flat().map(t => t.id)
          );
          setSelectedTicketIds(allTicketIds);
        }
      },
    },
    {
      key: "s",
      description: "Toggle selection mode",
      handler: () => {
        setSelectionMode(!selectionMode);
        if (!selectionMode) {
          setSelectedTicketIds(new Set());
        }
      },
    },
    {
      key: "d",
      shift: true,
      description: "Delete selected tickets",
      handler: () => {
        if (selectionMode && selectedTicketIds.size > 0) {
          handleBulkDelete();
        }
      },
    },
    // Filters
    {
      key: "f",
      description: "Clear all filters",
      handler: () => resetFilters(),
    },
    {
      key: "u",
      description: "Show unassigned only",
      handler: () => setShowUnassignedOnly(!showUnassignedOnly),
    },
    {
      key: "r",
      description: "Show recent only",
      handler: () => setRecentOnly(!recentOnly),
    },
  ];

  const { showHelp, setShowHelp } = useKeyboardShortcuts(shortcuts);

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-white text-neutral-900 transition-colors dark:bg-dark-bg dark:text-neutral-100">
      <BoardsSidebar
        collapsed={sidebarCollapsed}
        onToggleCollapsed={handleToggleSidebar}
        boards={boards}
        users={users}
        selectedBoardId={selectedBoardId}
        onSelectBoard={handleSelectBoard}
        onCreateBoard={async (data) => {
          await boardsApi.createBoard({
            name: data.name,
            description: data.description,
            projectId: data.projectId,
            members: data.members.map(m => ({ name: m.name })),
          });
          await refreshBoards();
        }}
        projectOptions={projectOptions}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col lg:ml-52">
        <header className="fixed right-0 top-0 z-50 bg-white dark:bg-dark-bg left-0 lg:left-52">
          <div className="flex items-center justify-between gap-4 px-4 py-10 sm:px-6 lg:px-8 xl:px-10">
            <div className="flex items-center gap-6 h-full">
              <div className="flex items-center gap-2 lg:hidden">
                <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                  OpenDock
                </span>
                <span className="text-neutral-300 dark:text-neutral-700">/</span>
                <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                  Boards
                </span>
              </div>
              <nav className="hidden h-full items-center gap-6 self-start text-sm text-neutral-500 dark:text-neutral-300 sm:flex">
                <button
                  type="button"
                  onClick={() => setActiveTab("timeline")}
                  className={clsx(
                    "py-1 transition hover:text-neutral-900 dark:hover:text-white",
                    activeTab === "timeline" && "text-neutral-900 dark:text-white"
                  )}
                >
                  Overview
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("kanban")}
                  className={clsx(
                    "py-1 transition hover:text-neutral-900 dark:hover:text-white",
                    activeTab === "kanban" && "text-neutral-900 dark:text-white"
                  )}
                >
                  Board
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("issues")}
                  className={clsx(
                    "py-1 transition hover:text-neutral-900 dark:hover:text-white",
                    activeTab === "issues" && "text-neutral-900 dark:text-white"
                  )}
                >
                  Backlog
                </button>
              </nav>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
            </div>
          </div>
        </header>
        <main className="mt-[160px] flex h-[calc(100vh-160px)] min-w-0 flex-col overflow-x-hidden bg-white dark:bg-dark-bg">
          {error ? (
            <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-10">
              <div className="inline-flex items-center gap-2 rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-500 dark:border-rose-400/30 dark:text-rose-200">
                {error}
              </div>
            </div>
          ) : null}
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 lg:hidden">
            <BoardsSidebarMobile
              boards={boards}
              users={users}
              selectedBoardId={selectedBoardId}
              onSelectBoard={handleSelectBoard}
              onCreateBoard={async (data) => {
                await boardsApi.createBoard({
                  name: data.name,
                  description: data.description,
                  projectId: data.projectId,
                  members: data.members.map(m => ({ name: m.name })),
                });
                await refreshBoards();
              }}
              projectOptions={projectOptions}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </div>
          {loading ? (
            <div className="mx-auto mt-8 max-w-7xl rounded-xl border border-slate-200/70 bg-white/80 px-6 py-10 text-center text-sm text-slate-500 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
              Loading boards...
            </div>
          ) : selectedBoard ? (
            <>
            {activeTab === "kanban" && (
              <BoardToolbar
                board={selectedBoard}
                searchQuery={searchQuery}
                onSearchQueryChange={setSearchQuery}
                selectionMode={selectionMode}
                onToggleSelectionMode={handleToggleSelectionMode}
              />
            )}
            {activeTab === "settings" ? (
              <SettingsPage
                board={selectedBoard}
                onCreateColumn={async (title) => {
                  await boardsApi.createColumn(selectedBoard.id, title);
                  await refreshBoards();
                }}
                onRenameColumn={handleRenameColumn}
                onDeleteColumn={handleDeleteColumn}
                onCreateLabel={async (name, color) => {
                  await boardsApi.createLabel(selectedBoard.id, { name, color });
                  await refreshBoards();
                }}
                onUpdateLabel={async (labelId, name, color) => {
                  await boardsApi.updateLabel(labelId, { name, color });
                  await refreshBoards();
                }}
                onDeleteLabel={async (labelId) => {
                  await boardsApi.deleteLabel(labelId);
                  await refreshBoards();
                }}
              />
            ) : (
          <div className="mt-6 space-y-8">
                {activeTab === "timeline" ? (
                  <OverviewTab board={selectedBoard} />
                ) : null}
                {activeTab === "issues" ? (
                  <BacklogTab board={selectedBoard} />
                ) : null}
                {activeTab === "kanban" && selectedBoard ? (
                  <>
                    <div className="pl-4 sm:pl-6 lg:pl-8 xl:pl-10">
                      <QuickFilters
                        board={selectedBoard}
                        onFiltersChange={setQuickFilters}
                        className="mb-4"
                      />
                    </div>
                    <BoardKanbanView
                      board={selectedBoard}
                      columnTicketMap={columnTicketMap}
                      filteredTicketMap={(() => {
                        // Apply quick filters on top of existing filters
                        const map = new Map<string, KanbanTicket[]>();
                        filteredTicketMap.forEach((tickets, columnId) => {
                          const quickFilteredTickets = applyQuickFilters(
                            tickets,
                            quickFilters,
                            selectedBoard,
                            undefined // TODO: Add current user ID when we have user management
                          );
                          map.set(columnId, quickFilteredTickets);
                        });
                        return map;
                      })()}
                      activeComposerColumnId={activeComposerColumnId}
                      creatingColumnTicketId={creatingColumnTicketId}
                      getColumnDraft={getColumnDraft}
                      onColumnDraftChange={updateColumnDraft}
                      onColumnTicketSubmit={handleColumnTicketSubmit}
                      onColumnComposerOpen={handleColumnComposerOpen}
                      onColumnComposerCancel={handleColumnComposerCancel}
                      onTicketClick={setSelectedTicketId}
                      onTicketTitleUpdate={async (ticketId, newTitle) => {
                        await handleTicketUpdate(ticketId, { title: newTitle });
                      }}
                      onQuickCreateTicket={async (columnId, title, issueType) => {
                        const result = await boardsApi.createTicket(selectedBoard.id, {
                          title,
                          columnId,
                          priority: "medium",
                          assigneeIds: [],
                        });
                        // Update with issueType after creation if it's not "task"
                        if (issueType && issueType !== "task") {
                          await boardsApi.updateTicket(result.ticket.id, {
                            issueType,
                          });
                        }
                        await refreshBoards();
                      }}
                      onReorderTicket={handleReorderTicket}
                      selectionMode={selectionMode}
                      selectedTicketIds={selectedTicketIds}
                      onToggleTicketSelection={handleToggleTicketSelection}
                    />
                  </>
                ) : null}
              </div>
            )}
            </>
          ) : (
            <div className="mx-auto mt-12 max-w-7xl rounded-xl border border-slate-200/70 bg-white/80 px-8 py-12 text-center text-sm text-slate-500 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
              Select a board from the sidebar to get started.
            </div>
          )}
        </main>
      </div>
      {/* Ticket Detail Modal */}
      {selectedTicketId && selectedBoard && (() => {
        const selectedTicket = selectedBoard.tickets.find((t) => t.id === selectedTicketId);
        return selectedTicket ? (
          <TicketDetailModal
            ticket={selectedTicket}
            board={selectedBoard}
            members={selectedBoard.members}
            labels={selectedBoard.labels}
            isOpen={!!selectedTicketId}
            onClose={() => setSelectedTicketId(null)}
            onUpdate={handleTicketUpdate}
            onDelete={handleDeleteTicket}
            onAddComment={handleAddComment}
            onDeleteComment={handleDeleteComment}
          />
        ) : null;
      })()}

      {/* Board Settings Modal */}
      {selectedBoard && (
        <BoardSettingsModal
          isOpen={showBoardSettings}
          board={selectedBoard}
          onClose={() => setShowBoardSettings(false)}
          onCreateColumn={async (title) => {
            await boardsApi.createColumn(selectedBoard.id, title);
            await refreshBoards();
          }}
          onRenameColumn={handleRenameColumn}
          onUpdateColumnWipLimit={handleUpdateColumnWipLimit}
          onDeleteColumn={handleDeleteColumn}
        />
      )}

      {/* Bulk Actions Toolbar */}
      {selectionMode && selectedTicketIds.size > 0 && selectedBoard && (
        <BulkActionsToolbar
          selectedCount={selectedTicketIds.size}
          totalCount={selectedBoard.tickets.length}
          onSelectAll={handleSelectAll}
          onClearSelection={handleClearSelection}
          onBulkDelete={handleBulkDelete}
          onBulkMove={handleBulkMove}
          onBulkAssign={handleBulkAssign}
          board={selectedBoard}
        />
      )}

      {/* Bulk Move Modal */}
      {selectedBoard && (
        <BulkMoveModal
          isOpen={showBulkMoveModal}
          board={selectedBoard}
          selectedCount={selectedTicketIds.size}
          onClose={() => setShowBulkMoveModal(false)}
          onConfirm={handleBulkMoveConfirm}
        />
      )}

      {/* Bulk Assign Modal */}
      {selectedBoard && (
        <BulkAssignModal
          isOpen={showBulkAssignModal}
          board={selectedBoard}
          selectedCount={selectedTicketIds.size}
          onClose={() => setShowBulkAssignModal(false)}
          onConfirm={handleBulkAssignConfirm}
        />
      )}

      {/* Keyboard Shortcuts Help */}
      <KeyboardShortcutsHelp
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
        shortcuts={shortcuts}
      />
    </div>
  );
}

export default function BoardsPage() {
  const { theme } = useTheme();
  return <BoardsAppInner key={theme} />;
}
