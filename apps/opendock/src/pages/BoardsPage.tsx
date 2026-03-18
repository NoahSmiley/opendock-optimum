import { useEffect, useState, useCallback } from "react";
import { useBoardsStore } from "@/stores/boards/store";
import { createBoard } from "@/stores/boards/actions";
import { BoardHeader } from "@/components/boards/BoardHeader";
import { KanbanView } from "@/components/boards/KanbanView";
import { TicketDetail } from "@/components/boards/TicketDetail";
import { FilterBar, applyQuickFilters } from "@/components/boards/FilterBar";
import { OverviewTab } from "@/components/boards/OverviewTab";
import { BacklogTab } from "@/components/boards/BacklogTab";
import { BoardSettingsModal } from "@/components/boards/BoardSettingsModal";
import { CreateBoardModal } from "@/components/boards/CreateBoardModal";
import { BoardPicker } from "@/components/boards/BoardPicker";
import type { BoardSnapshot, Ticket } from "@/stores/boards/types";

export type BoardView = "board" | "overview" | "backlog";

export function BoardsPage() {
  const { boards, activeBoard, selectedTicket, fetchBoards, fetchBoard, selectTicket } = useBoardsStore();
  const [search, setSearch] = useState("");
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [view, setView] = useState<BoardView>("board");
  const [showSettings, setShowSettings] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => { fetchBoards(); }, [fetchBoards]);

  const toggleFilter = useCallback((id: string) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectionMode = useCallback(() => {
    setSelectionMode((prev) => { if (prev) setSelectedIds(new Set()); return !prev; });
  }, []);

  const toggleTicketSelect = useCallback((ticketId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(ticketId)) next.delete(ticketId); else next.add(ticketId);
      return next;
    });
  }, []);

  const handleSelectTicket = useCallback((ticket: Ticket) => selectTicket(ticket), [selectTicket]);

  const snapshot = activeBoard ? filterSnapshot(activeBoard, search, activeFilters) : null;
  const isFiltering = search !== "" || activeFilters.size > 0;
  const totalTicketCounts = activeBoard && isFiltering ? buildColumnCounts(activeBoard.tickets) : undefined;

  if (!activeBoard) {
    return (
      <>
        <BoardPicker boards={boards} onSelectBoard={fetchBoard} onCreateBoard={() => setShowCreateModal(true)} />
        {showCreateModal && (
          <CreateBoardModal onSubmit={async (name, desc) => { await createBoard(name, desc); }}
            onClose={() => setShowCreateModal(false)} />
        )}
      </>
    );
  }

  return (
    <div className="boards-page">
      <div className="boards-main">
        <BoardHeader board={activeBoard.board} boards={boards} ticketCount={activeBoard.tickets.length}
          search={search} onSearchChange={setSearch} onSelectBoard={fetchBoard}
          activeView={view} onViewChange={setView}
          selectionMode={selectionMode} onToggleSelectionMode={toggleSelectionMode}
          onOpenSettings={() => setShowSettings(true)} />
        {snapshot && (
          <BoardContent view={view} snapshot={snapshot} activeBoard={activeBoard}
            activeFilters={activeFilters} toggleFilter={toggleFilter} setActiveFilters={setActiveFilters}
            handleSelectTicket={handleSelectTicket} selectionMode={selectionMode}
            selectedIds={selectedIds} toggleTicketSelect={toggleTicketSelect}
            totalTicketCounts={totalTicketCounts} />
        )}
      </div>
      {selectedTicket && (
        <TicketDetail ticket={selectedTicket} board={activeBoard.board} labels={activeBoard.labels}
          members={activeBoard.members} onClose={() => selectTicket(null)} />
      )}
      {showSettings && (
        <BoardSettingsModal board={activeBoard.board} onClose={() => setShowSettings(false)} />
      )}
      {showCreateModal && (
        <CreateBoardModal onSubmit={async (name, desc) => { await createBoard(name, desc); }}
          onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}

function BoardContent({ view, snapshot, activeBoard, activeFilters, toggleFilter, setActiveFilters,
  handleSelectTicket, selectionMode, selectedIds, toggleTicketSelect, totalTicketCounts }: {
  view: BoardView; snapshot: BoardSnapshot; activeBoard: BoardSnapshot;
  activeFilters: Set<string>; toggleFilter: (id: string) => void; setActiveFilters: (f: Set<string>) => void;
  handleSelectTicket: (t: Ticket) => void; selectionMode: boolean; selectedIds: Set<string>;
  toggleTicketSelect: (id: string) => void; totalTicketCounts?: Map<string, number>;
}) {
  if (view === "overview") return <OverviewTab snapshot={activeBoard} />;
  if (view === "backlog") return (
    <BacklogTab tickets={snapshot.tickets} columns={activeBoard.columns} labels={activeBoard.labels}
      members={activeBoard.members} onTicketClick={handleSelectTicket} />
  );
  return (
    <div className="mt-5 flex min-h-0 flex-1 flex-col space-y-5 overflow-hidden">
      <div className="pl-4 sm:pl-6 lg:pl-8 xl:pl-10">
        <FilterBar activeFilters={activeFilters} onToggleFilter={toggleFilter}
          onClearAll={() => setActiveFilters(new Set())} />
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        <KanbanView snapshot={snapshot} onTicketClick={handleSelectTicket}
          selectionMode={selectionMode} selectedIds={selectedIds} onToggleSelect={toggleTicketSelect}
          totalTicketCounts={totalTicketCounts} />
      </div>
    </div>
  );
}

function buildColumnCounts(tickets: Ticket[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const t of tickets) counts.set(t.columnId, (counts.get(t.columnId) ?? 0) + 1);
  return counts;
}

function filterSnapshot(snapshot: BoardSnapshot, search: string, quickFilters: Set<string>): BoardSnapshot {
  let tickets = snapshot.tickets;
  tickets = applyQuickFilters(tickets, quickFilters);
  if (search) {
    const q = search.toLowerCase();
    tickets = tickets.filter((t) => t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q));
  }
  return { ...snapshot, tickets };
}
