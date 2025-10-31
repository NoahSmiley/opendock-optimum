import { Draggable } from "@hello-pangea/dnd";
import type { KanbanTicket, KanbanColumn, BoardMember, KanbanSprint } from "@opendock/shared/types";
import { TicketCard } from "./TicketCard";

interface SortableTicketCardProps {
  ticket: KanbanTicket;
  index: number;
  column: KanbanColumn;
  members: BoardMember[];
  sprints?: KanbanSprint[];
  onClick?: () => void;
}

export function SortableTicketCard({
  ticket,
  index,
  column,
  members,
  sprints,
  onClick,
}: SortableTicketCardProps) {
  return (
    <Draggable draggableId={ticket.id} index={index}>
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
            sprints={sprints}
            onClick={onClick}
          />
        </div>
      )}
    </Draggable>
  );
}
