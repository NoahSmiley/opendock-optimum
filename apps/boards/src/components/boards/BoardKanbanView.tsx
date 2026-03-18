import type { FormEvent } from "react";
import { useCallback } from "react";
import type { KanbanBoard, KanbanTicket, IssueType } from "@opendock/shared/types";
import { DragDropContext, Droppable, type DropResult } from "@hello-pangea/dnd";
import { KanbanColumn } from "./KanbanColumn";
import { SortableTicketCard } from "./SortableTicketCard";
import type { ColumnDraftState } from "./forms/types";
import { QuickCreateTicket } from "./QuickCreateTicket";

interface BoardKanbanViewProps {
  board: KanbanBoard;
  columnTicketMap: Map<string, KanbanTicket[]>;
  filteredTicketMap: Map<string, KanbanTicket[]>;
  activeComposerColumnId: string | null;
  creatingColumnTicketId?: string | null;
  getColumnDraft: (columnId: string) => ColumnDraftState;
  onColumnDraftChange?: (columnId: string, patch: Partial<ColumnDraftState>) => void;
  onColumnTicketSubmit?: (event: FormEvent, columnId: string) => void;
  onColumnComposerOpen?: (columnId: string) => void;
  onColumnComposerCancel?: () => void;
  onTicketClick: (ticketId: string) => void;
  onTicketTitleUpdate?: (ticketId: string, newTitle: string) => Promise<void>;
  onQuickCreateTicket?: (columnId: string, title: string, issueType: IssueType) => Promise<void>;
  onReorderTicket: (ticketId: string, toColumnId: string, toIndex: number) => void;
  selectionMode?: boolean;
  selectedTicketIds?: Set<string>;
  onToggleTicketSelection?: (ticketId: string) => void;
}

export function BoardKanbanView({
  board,
  columnTicketMap,
  filteredTicketMap,
  activeComposerColumnId: _activeComposerColumnId,
  getColumnDraft: _getColumnDraft,
  onTicketClick,
  onTicketTitleUpdate,
  onQuickCreateTicket,
  onReorderTicket,
  selectionMode = false,
  selectedTicketIds = new Set(),
  onToggleTicketSelection,
}: BoardKanbanViewProps) {
  // Handle drag end with react-beautiful-dnd
  const handleDragEnd = useCallback((result: DropResult) => {
    const { source, destination, draggableId } = result;

    // Dropped outside valid droppable area
    if (!destination) return;

    // Dropped in same position
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    // Call the parent's reorder function
    onReorderTicket(draggableId, destination.droppableId, destination.index);
  }, [onReorderTicket]);

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex h-full gap-4 overflow-x-auto pb-4 scroll-smooth select-none pl-4 sm:pl-6 lg:pl-8 xl:pl-10">
        <div className="flex gap-4">
          {board.columns.map((column) => {
            const tickets = filteredTicketMap.get(column.id) ?? [];
            const rawTickets = columnTicketMap.get(column.id) ?? [];

            return (
              <Droppable key={column.id} droppableId={column.id}>
                {(provided, snapshot) => (
                  <KanbanColumn
                    column={column}
                    tickets={tickets}
                    totalCount={rawTickets.length}
                    droppableProvided={provided}
                    isDraggingOver={snapshot.isDraggingOver}
                    footer={
                      onQuickCreateTicket && (
                        <QuickCreateTicket
                          columnId={column.id}
                          onCreateTicket={async (title, issueType) => {
                            await onQuickCreateTicket(column.id, title, issueType);
                          }}
                        />
                      )
                    }
                  >
                    {tickets.map((ticket, index) => (
                      <SortableTicketCard
                        key={ticket.id}
                        ticket={ticket}
                        index={index}
                        column={column}
                        members={board.members}
                        labels={board.labels || []}
                        sprints={board.sprints}
                        onClick={() => onTicketClick(ticket.id)}
                        onTitleUpdate={onTicketTitleUpdate}
                        selectionMode={selectionMode}
                        isSelected={selectedTicketIds.has(ticket.id)}
                        onToggleSelect={onToggleTicketSelection}
                      />
                    ))}
                  </KanbanColumn>
                )}
              </Droppable>
            );
          })}
        </div>
      </div>
    </DragDropContext>
  );
}
