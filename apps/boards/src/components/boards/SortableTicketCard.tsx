import { Draggable } from "@hello-pangea/dnd";
import type { KanbanTicket, KanbanColumn, BoardMember, KanbanSprint, KanbanLabel } from "@opendock/shared/types";
import { TicketCard } from "./TicketCard";

interface SortableTicketCardProps {
  ticket: KanbanTicket;
  index: number;
  column: KanbanColumn;
  members: BoardMember[];
  labels: KanbanLabel[];
  sprints?: KanbanSprint[];
  onClick?: () => void;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (ticketId: string) => void;
}

export function SortableTicketCard({
  ticket,
  index,
  column,
  members,
  labels,
  sprints,
  onClick,
  selectionMode,
  isSelected,
  onToggleSelect,
}: SortableTicketCardProps) {
  return (
    <Draggable draggableId={ticket.id} index={index} isDragDisabled={selectionMode}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="select-none"
        >
          <TicketCard
            ticket={ticket}
            column={column}
            members={members}
            labels={labels}
            sprints={sprints}
            onClick={onClick}
            selectionMode={selectionMode}
            isSelected={isSelected}
            onToggleSelect={onToggleSelect}
          />
        </div>
      )}
    </Draggable>
  );
}
