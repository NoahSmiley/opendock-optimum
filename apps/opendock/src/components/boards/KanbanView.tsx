import { useCallback } from "react";
import { DragDropContext, Droppable, type DropResult } from "@hello-pangea/dnd";
import { KanbanColumn } from "./KanbanColumn";
import { SortableTicketCard } from "./SortableTicketCard";
import { QuickCreateTicket } from "./QuickCreateTicket";
import { reorderTicket, createTicket, updateTicket } from "@/stores/boards/actions";
import type { BoardSnapshot, Ticket } from "@/stores/boards/types";

interface KanbanViewProps {
  snapshot: BoardSnapshot;
  onTicketClick: (ticket: Ticket) => void;
  selectionMode?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (ticketId: string) => void;
  totalTicketCounts?: Map<string, number>;
}

export function KanbanView({ snapshot, onTicketClick, selectionMode = false, selectedIds, onToggleSelect, totalTicketCounts }: KanbanViewProps) {
  const { board, columns, tickets, labels, members } = snapshot;
  const sortedColumns = [...columns].sort((a, b) => a.order - b.order);

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      const { source, destination, draggableId } = result;
      if (!destination) return;
      if (source.droppableId === destination.droppableId && source.index === destination.index) return;
      reorderTicket(board.id, draggableId, destination.droppableId, destination.index);
    },
    [board.id],
  );

  const getColumnTickets = (columnId: string) =>
    tickets.filter((t) => t.columnId === columnId).sort((a, b) => a.order - b.order);

  const handleTitleUpdate = useCallback(
    async (ticketId: string, title: string) => { await updateTicket(ticketId, { title }); },
    [],
  );

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex h-full gap-5 overflow-x-auto pb-4 scroll-smooth select-none pl-4 sm:pl-6 lg:pl-8 xl:pl-10">
        <div className="flex gap-5">
          {sortedColumns.map((column) => {
            const colTickets = getColumnTickets(column.id);
            return (
              <Droppable key={column.id} droppableId={column.id}>
                {(provided, snap) => (
                  <KanbanColumn
                    column={column}
                    ticketCount={colTickets.length}
                    totalCount={totalTicketCounts?.get(column.id)}
                    droppableProvided={provided}
                    isDraggingOver={snap.isDraggingOver}
                    footer={
                      <QuickCreateTicket
                        onCreateTicket={async (title) => {
                          await createTicket(board.id, column.id, title);
                        }}
                      />
                    }
                  >
                    {colTickets.map((ticket, index) => (
                      <SortableTicketCard
                        key={ticket.id}
                        ticket={ticket}
                        index={index}
                        labels={labels}
                        members={members}
                        onClick={() => onTicketClick(ticket)}
                        onTitleUpdate={handleTitleUpdate}
                        selectionMode={selectionMode}
                        isSelected={selectedIds?.has(ticket.id) ?? false}
                        onToggleSelect={onToggleSelect}
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
