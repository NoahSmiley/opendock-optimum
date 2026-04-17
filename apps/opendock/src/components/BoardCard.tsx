import { memo } from "react";
import type { Card } from "@/types";

interface BoardCardProps {
  card: Card;
  selected: boolean;
  onOpen: (id: string) => void;
  onPointerDown: (e: React.PointerEvent, id: string) => void;
}

export const BoardCard = memo(function BoardCard({ card, selected, onOpen, onPointerDown }: BoardCardProps) {
  return (
    <div className={`board-card${selected ? " selected" : ""}`} data-card={card.id}
      onPointerDown={(e) => onPointerDown(e, card.id)} onClick={() => onOpen(card.id)}>
      <div className="board-card-title">{card.title}</div>
    </div>
  );
});
