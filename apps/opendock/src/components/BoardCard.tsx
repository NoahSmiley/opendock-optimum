import { memo } from "react";
import type { BoardMember, Card } from "@/types";

interface BoardCardProps {
  card: Card;
  members: BoardMember[];
  selected: boolean;
  onOpen: (id: string) => void;
  onPointerDown: (e: React.PointerEvent, id: string) => void;
}

export const BoardCard = memo(function BoardCard({ card, members, selected, onOpen, onPointerDown }: BoardCardProps) {
  const assignee = members.find((m) => m.user_id === card.assignee_id);
  const initial = assignee ? (assignee.display_name || assignee.email).charAt(0).toUpperCase() : null;
  return (
    <div className={`board-card${selected ? " selected" : ""}`} data-card={card.id}
      onPointerDown={(e) => onPointerDown(e, card.id)} onClick={() => onOpen(card.id)}>
      <div className="board-card-title">{card.title}</div>
      {initial && <div className="board-card-assignee" title={assignee?.email}>{initial}</div>}
    </div>
  );
});
