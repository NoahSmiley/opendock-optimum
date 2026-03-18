import { Draggable } from "@hello-pangea/dnd";
import { TicketCard } from "./TicketCard";
import type { Ticket, Label, BoardMember } from "@/stores/boards/types";

interface SortableTicketCardProps {
  ticket: Ticket;
  index: number;
  labels: Label[];
  members: BoardMember[];
  onClick: () => void;
  onTitleUpdate?: (ticketId: string, title: string) => Promise<void>;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (ticketId: string) => void;
}

export function SortableTicketCard({
  ticket, index, labels, members, onClick, onTitleUpdate,
  selectionMode = false, isSelected = false, onToggleSelect,
}: SortableTicketCardProps) {
  return (
    <Draggable draggableId={ticket.id} index={index} isDragDisabled={selectionMode}>
      {(provided) => (
        <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="select-none">
          <TicketCard
            ticket={ticket} labels={labels} members={members}
            onClick={onClick} onTitleUpdate={onTitleUpdate}
            selectionMode={selectionMode} isSelected={isSelected} onToggleSelect={onToggleSelect}
          />
        </div>
      )}
    </Draggable>
  );
}
