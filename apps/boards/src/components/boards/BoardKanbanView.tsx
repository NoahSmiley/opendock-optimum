import type { FormEvent } from "react";
import { useCallback } from "react";
import { Plus } from "lucide-react";
import type { KanbanBoard, KanbanTicket } from "@opendock/shared/types";
import { DragDropContext, Droppable, type DropResult } from "@hello-pangea/dnd";
import { KanbanColumn } from "./KanbanColumn";
import { SortableTicketCard } from "./SortableTicketCard";
import { ColumnTicketComposer } from "./forms/ColumnTicketComposer";
import { AddColumnForm } from "./forms/AddColumnForm";
import type { ColumnDraftState } from "./forms/types";

interface BoardKanbanViewProps {
  board: KanbanBoard;
  columnTicketMap: Map<string, KanbanTicket[]>;
  filteredTicketMap: Map<string, KanbanTicket[]>;
  activeComposerColumnId: string | null;
  creatingColumnTicketId: string | null;
  columnTitle: string;
  creatingColumnId: string | null;
  getColumnDraft: (columnId: string) => ColumnDraftState;
  onColumnDraftChange: (columnId: string, patch: Partial<ColumnDraftState>) => void;
  onColumnTicketSubmit: (event: FormEvent, columnId: string) => void;
  onColumnComposerOpen: (columnId: string) => void;
  onColumnComposerCancel: () => void;
  onColumnTitleChange: (value: string) => void;
  onCreateColumn: (event: FormEvent, boardId: string) => void;
  onTicketClick: (ticketId: string) => void;
  onReorderTicket: (ticketId: string, toColumnId: string, toIndex: number) => void;
}

export function BoardKanbanView({
  board,
  columnTicketMap,
  filteredTicketMap,
  activeComposerColumnId,
  creatingColumnTicketId,
  columnTitle,
  creatingColumnId,
  getColumnDraft,
  onColumnDraftChange,
  onColumnTicketSubmit,
  onColumnComposerOpen,
  onColumnComposerCancel,
  onColumnTitleChange,
  onCreateColumn,
  onTicketClick,
  onReorderTicket,
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
      <div className="flex h-full gap-4 overflow-x-auto pb-4 scroll-smooth select-none">
        <div className="flex gap-4">
          {board.columns.map((column, columnIndex) => {
            const tickets = filteredTicketMap.get(column.id) ?? [];
            const rawTickets = columnTicketMap.get(column.id) ?? [];
            const draft = getColumnDraft(column.id);
            const composerOpen = activeComposerColumnId === column.id;

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
                      <div className="flex flex-col gap-2">
                        {composerOpen ? (
                          <ColumnTicketComposer
                            draft={draft}
                            members={board.members}
                            submitting={creatingColumnTicketId === column.id}
                            onDraftChange={(patch) => onColumnDraftChange(column.id, patch)}
                            onSubmit={(event) => onColumnTicketSubmit(event, column.id)}
                            onCancel={onColumnComposerCancel}
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => onColumnComposerOpen(column.id)}
                            className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-slate-300/60 px-4 py-2 text-sm font-semibold text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 dark:border-white/20 dark:text-slate-300 dark:hover:border-white/30 dark:hover:bg-white/10 dark:hover:text-white"
                          >
                            <Plus className="h-4 w-4" />
                            Create issue
                          </button>
                        )}
                      </div>
                    }
                  >
                    {tickets.map((ticket, index) => (
                      <SortableTicketCard
                        key={ticket.id}
                        ticket={ticket}
                        index={index}
                        column={column}
                        members={board.members}
                        sprints={board.sprints}
                        onClick={() => onTicketClick(ticket.id)}
                      />
                    ))}
                  </KanbanColumn>
                )}
              </Droppable>
            );
          })}

          <AddColumnForm
            title={columnTitle}
            onTitleChange={onColumnTitleChange}
            onSubmit={(event) => onCreateColumn(event, board.id)}
            creating={creatingColumnId === board.id}
          />
        </div>
      </div>
    </DragDropContext>
  );
}
