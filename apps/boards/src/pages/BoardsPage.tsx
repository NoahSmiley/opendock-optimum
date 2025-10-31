import { useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { useTheme } from "@/theme-provider";
import { ThemeToggle } from "@/theme-toggle";
import { TicketDetailPanel } from "@/components/TicketDetailPanel";
import { BoardsSidebar, BoardsSidebarMobile } from "@/components/boards/BoardsSidebar";
import { BoardToolbar } from "@/components/boards/BoardToolbar";
import { OverviewTab } from "@/components/boards/OverviewTab";
import { BacklogTab } from "@/components/boards/BacklogTab";
import { BoardKanbanView } from "@/components/boards/BoardKanbanView";
import { CodepenDemo } from "@/components/boards/CodepenDemo";
import { useBoardsData } from "@/hooks/useBoardsData";
import { useBoardFilters } from "@/hooks/useBoardFilters";
import { useBoardActions } from "@/hooks/useBoardActions";
import { boardsApi } from "@/lib/api";

function BoardsAppInner() {
  const {
    boards,
    loading,
    error,
    setError,
    selectedBoardId,
    setSelectedBoardId,
    refreshBoards,
    boardForm,
    setBoardForm,
    showBoardForm,
    setShowBoardForm,
    creatingBoard,
    handleCreateBoard,
    projectsLoading,
    projectsError,
    selectedBoard,
    projectOptions,
    mutateBoards,
  } = useBoardsData();

  const mutateAsync = useCallback(async () => {
    mutateBoards((boards) => boards);
  }, [mutateBoards]);

  const [activeTab, setActiveTab] = useState<"board" | "overview" | "backlog">("board");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [creatingColumnId, setCreatingColumnId] = useState<string | null>(null);
  const [creatingBacklogTicket, setCreatingBacklogTicket] = useState(false);
  const [creatingSprint, setCreatingSprint] = useState(false);
  const mutationInProgressRef = useRef<string | null>(null);
  const mutationAppliedRef = useRef(false);

  const {
    columnTicketMap,
    backlogColumn,
    activeSprint,
    boardStats,
    teamWorkload,
    maxWorkloadCount,
    priorityBreakdown,
    maxPriorityCount,
    activeComposerColumnId,
    setActiveComposerColumnId,
    setColumnDrafts,
    creatingColumnTicketId,
    columnTitle,
    setColumnTitle,
    sprintForm,
    backlogForm,
    getColumnDraft,
    updateColumnDraft,
    handleColumnComposerOpen,
    handleColumnComposerCancel,
    handleColumnTicketSubmit,
    handleCreateColumn,
    handleSprintFormChange,
    handleCreateSprint,
    handleBacklogFormChange,
    handleCreateBacklogTicket,
    handleAssigneeChange,
    handleTicketUpdate,
    handleAddComment,
    handleDeleteComment,
  } = useBoardActions({ selectedBoard, refreshBoards, setError, mutateBoards: mutateAsync });

  const {
    searchQuery,
    setSearchQuery,
    selectedAssigneeFilter,
    setSelectedAssigneeFilter,
    selectedPriorityFilter,
    setSelectedPriorityFilter,
    selectedSprintFilter,
    setSelectedSprintFilter,
    showUnassignedOnly,
    setShowUnassignedOnly,
    recentOnly,
    setRecentOnly,
    filtersActive,
    filteredTicketMap,
    sprintOptions,
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

  const handleToggleBoardForm = useCallback(() => {
    setShowBoardForm((prev) => !prev);
  }, [setShowBoardForm]);

  const handleBoardFormChange = useCallback((field: string, value: string) => {
    setBoardForm((prev) => ({ ...prev, [field]: value }));
  }, [setBoardForm]);

  const handleToggleUnassignedOnly = useCallback(() => {
    setShowUnassignedOnly((prev) => !prev);
  }, [setShowUnassignedOnly]);

  const handleToggleRecentOnly = useCallback(() => {
    setRecentOnly((prev) => !prev);
  }, [setRecentOnly]);

  const handleClearFilters = useCallback(() => {
    resetFilters();
  }, [resetFilters]);

  useEffect(() => {
    resetFilters();
    setActiveComposerColumnId(null);
    setColumnDrafts({});
  }, [resetFilters, selectedBoardId, setActiveComposerColumnId, setColumnDrafts]);

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-white text-neutral-900 transition-colors dark:bg-black dark:text-neutral-100">
      <BoardsSidebar
        collapsed={sidebarCollapsed}
        onToggleCollapsed={handleToggleSidebar}
        boards={boards}
        selectedBoardId={selectedBoardId}
        onSelectBoard={handleSelectBoard}
        showBoardForm={showBoardForm}
        onToggleBoardForm={handleToggleBoardForm}
        boardForm={boardForm}
        onBoardFormChange={handleBoardFormChange}
        creatingBoard={creatingBoard}
        onCreateBoard={handleCreateBoard}
        projectsLoading={projectsLoading}
        projectsError={projectsError}
        projectOptions={projectOptions}
      />
      <div className={clsx(
        "flex min-h-screen min-w-0 flex-1 flex-col transition-all duration-300",
        sidebarCollapsed ? "lg:ml-16" : "lg:ml-64"
      )}>
        <header className={clsx(
          "fixed right-0 top-0 z-50 bg-white transition-all duration-300 dark:bg-black",
          sidebarCollapsed ? "left-0 lg:left-16" : "left-0 lg:left-64"
        )}>
          <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 lg:hidden">
                <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                  OpenDock
                </span>
                <span className="text-neutral-300 dark:text-neutral-700">/</span>
                <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                  Boards
                </span>
              </div>
              <nav className="hidden items-center gap-6 text-sm text-neutral-500 dark:text-neutral-300 sm:flex">
                <button
                  type="button"
                  onClick={() => setActiveTab("overview")}
                  className={clsx(
                    "transition hover:text-neutral-900 dark:hover:text-white",
                    activeTab === "overview" && "text-neutral-900 dark:text-white"
                  )}
                >
                  Overview
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("board")}
                  className={clsx(
                    "transition hover:text-neutral-900 dark:hover:text-white",
                    activeTab === "board" && "text-neutral-900 dark:text-white"
                  )}
                >
                  Board
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("backlog")}
                  className={clsx(
                    "transition hover:text-neutral-900 dark:hover:text-white",
                    activeTab === "backlog" && "text-neutral-900 dark:text-white"
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
        <main className="mt-[57px] flex h-[calc(100vh-57px)] min-w-0 flex-col overflow-x-hidden bg-white dark:bg-black">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-10">
          {error ? (
            <div className="mb-6 inline-flex items-center gap-2 rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-500 dark:border-rose-400/30 dark:text-rose-200">
              {error}
            </div>
          ) : null}
          </div>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 lg:hidden">
            <BoardsSidebarMobile
              boards={boards}
              selectedBoardId={selectedBoardId}
              onSelectBoard={handleSelectBoard}
              showBoardForm={showBoardForm}
              onToggleBoardForm={handleToggleBoardForm}
              boardForm={boardForm}
              onBoardFormChange={handleBoardFormChange}
              creatingBoard={creatingBoard}
              onCreateBoard={handleCreateBoard}
              projectsLoading={projectsLoading}
              projectsError={projectsError}
              projectOptions={projectOptions}
            />
          </div>
          {loading ? (
            <div className="mx-auto mt-8 max-w-7xl rounded-xl border border-slate-200/70 bg-white/80 px-6 py-10 text-center text-sm text-slate-500 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
              Loading boards…
            </div>
          ) : selectedBoard ? (
            <>
            {activeTab === "board" && (
              <BoardToolbar
                board={selectedBoard}
                searchQuery={searchQuery}
                onSearchQueryChange={setSearchQuery}
                selectedAssigneeFilter={selectedAssigneeFilter}
                onAssigneeFilterChange={setSelectedAssigneeFilter}
                selectedSprintFilter={selectedSprintFilter}
                onSprintFilterChange={setSelectedSprintFilter}
                sprintOptions={sprintOptions}
                selectedPriorityFilter={selectedPriorityFilter}
                onPriorityFilterChange={setSelectedPriorityFilter}
                showUnassignedOnly={showUnassignedOnly}
                onToggleUnassignedOnly={handleToggleUnassignedOnly}
                recentOnly={recentOnly}
                onToggleRecentOnly={handleToggleRecentOnly}
                filtersActive={filtersActive}
                onClearFilters={handleClearFilters}
              />
            )}
            <div className="mt-8 space-y-8">
              {activeTab === "overview" ? (
                <OverviewTab
                  board={selectedBoard}
                  boardStats={boardStats}
                  teamWorkload={teamWorkload}
                  maxWorkloadCount={maxWorkloadCount}
                  priorityBreakdown={priorityBreakdown}
                  maxPriorityCount={maxPriorityCount}
                  activeSprint={activeSprint}
                  sprintForm={sprintForm}
                  onSprintFormChange={handleSprintFormChange}
                  onCreateSprint={handleCreateSprint}
                  creatingSprint={creatingSprint}
                />
              ) : null}
              {activeTab === "backlog" ? (
                <BacklogTab
                  board={selectedBoard}
                  backlogColumn={backlogColumn}
                  backlogForm={backlogForm}
                  onBacklogFormChange={handleBacklogFormChange}
                  onCreateBacklogTicket={handleCreateBacklogTicket}
                  creatingBacklogTicket={creatingBacklogTicket}
                />
              ) : null}
              {activeTab === "board" && selectedBoard ? (
                <>
                  <BoardKanbanView
                    board={selectedBoard}
                    columnTicketMap={columnTicketMap}
                    filteredTicketMap={filteredTicketMap}
                    activeComposerColumnId={activeComposerColumnId}
                    creatingColumnTicketId={creatingColumnTicketId}
                    columnTitle={columnTitle}
                    creatingColumnId={creatingColumnId}
                    getColumnDraft={getColumnDraft}
                    onColumnDraftChange={updateColumnDraft}
                    onColumnTicketSubmit={handleColumnTicketSubmit}
                    onColumnComposerOpen={handleColumnComposerOpen}
                    onColumnComposerCancel={handleColumnComposerCancel}
                    onColumnTitleChange={setColumnTitle}
                    onCreateColumn={handleCreateColumn}
                    onTicketClick={setSelectedTicketId}
                    onReorderTicket={handleReorderTicket}
                  />
                  
                  {/* Codepen Demo for comparison */}
                  <div className="mt-8">
                    <CodepenDemo />
                  </div>
                </>
              ) : null}
            </div>
            </>
          ) : (
            <div className="mx-auto mt-12 max-w-7xl rounded-xl border border-slate-200/70 bg-white/80 px-8 py-12 text-center text-sm text-slate-500 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
              Select a board from the sidebar to get started.
            </div>
          )}
        </main>
      </div>
      {/* Ticket Detail Panel */}
      {selectedTicketId && selectedBoard && (() => {
        const selectedTicket = selectedBoard.tickets.find((t) => t.id === selectedTicketId);
        return selectedTicket ? (
          <TicketDetailPanel
            ticket={selectedTicket}
            members={selectedBoard.members}
            onClose={() => setSelectedTicketId(null)}
            onUpdate={handleTicketUpdate}
            onAddComment={handleAddComment}
            onDeleteComment={handleDeleteComment}
            sidebarCollapsed={sidebarCollapsed}
          />
        ) : null;
      })()}
    </div>
  );
}

export default function BoardsPage() {
  const { theme } = useTheme();
  return <BoardsAppInner key={theme} />;
}
